import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dejar pasar rutas públicas y assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // El refresh token se guarda como httpOnly cookie por el Route Handler /api/auth/login.
  // El middleware puede leerlo (server-side) para decidir si dejar pasar o redirigir.
  const token = request.cookies.get('admin_refresh')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Excluir: assets de Next.js y archivos con extensión en public/ (imágenes, JSON, etc.)
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
