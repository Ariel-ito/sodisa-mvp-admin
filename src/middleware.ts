import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '');

/** Roles que pueden entrar al panel. Debe reflejar PANEL_ROLES de mvp_api/user.entity.ts. */
const PANEL_ROLES = ['admin', 'support', 'qa'];

/**
 * Rutas admin-only aunque el rol ya haya pasado el gate de login (SUPPORT/QA no
 * gestionan staff, plantillas de rol globales, auditoría ni la config/conexión de
 * una empresa). Ojo: el patrón de empresas NO debe matchear /empresas/[id]/usuarios/**,
 * eso sí lo pueden usar SUPPORT/QA.
 */
const ADMIN_ONLY_PATTERNS = [
  /^\/usuarios(\/.*)?$/,
  /^\/roles(\/.*)?$/,
  /^\/auditoria(\/.*)?$/,
  /^\/empresas\/nueva$/,
  /^\/empresas\/[^/]+$/,
];

function redirectToLogin(request: NextRequest, pathname: string) {
  const url = new URL('/login', request.url);
  url.searchParams.set('from', pathname);
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const hasSession   = !!request.cookies.get('admin_refresh')?.value;
  const accessToken  = request.cookies.get('admin_access')?.value;

  // Página de login: redirigir al admin ya autenticado
  if (pathname === '/login') {
    return hasSession
      ? NextResponse.redirect(new URL('/', request.url))
      : NextResponse.next();
  }

  if (!accessToken) {
    return redirectToLogin(request, pathname);
  }

  try {
    const { payload } = await jwtVerify(accessToken, secret);
    const role = (payload as { role?: string }).role ?? '';
    if (!PANEL_ROLES.includes(role)) {
      return redirectToLogin(request, pathname);
    }
    if (role !== 'admin' && ADMIN_ONLY_PATTERNS.some((re) => re.test(pathname))) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  } catch (err: unknown) {
    // ERR_JWT_EXPIRED: token expiró pero la firma es válida — dejar pasar,
    // el layout llama hydrateToken() que lo renueva de forma transparente.
    if ((err as { code?: string })?.code === 'ERR_JWT_EXPIRED') {
      return NextResponse.next();
    }
    // Firma inválida, token manipulado, etc. — bloquear
    return redirectToLogin(request, pathname);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
