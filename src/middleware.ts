import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = ['/login', '/api/auth'];
const secret       = new TextEncoder().encode(process.env.JWT_SECRET ?? '');

function redirectToLogin(request: NextRequest, pathname: string) {
  const url = new URL('/login', request.url);
  url.searchParams.set('from', pathname);
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('admin_access')?.value;

  if (!accessToken) {
    return redirectToLogin(request, pathname);
  }

  try {
    const { payload } = await jwtVerify(accessToken, secret);
    if ((payload as { role?: string }).role !== 'admin') {
      return redirectToLogin(request, pathname);
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
