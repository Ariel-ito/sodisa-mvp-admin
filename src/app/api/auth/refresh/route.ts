import { NextRequest, NextResponse } from 'next/server';

const API_URL        = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const COOKIE_MAX_AGE = 8 * 60 * 60;
const IS_PROD        = process.env.NODE_ENV === 'production';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('admin_refresh')?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: 'No session' }, { status: 401 });
  }

  const apiRes = await fetch(`${API_URL}/portal/auth/refresh`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ refreshToken }),
  });

  if (!apiRes.ok) {
    const response = NextResponse.json({ message: 'Sesión expirada' }, { status: 401 });
    response.cookies.delete('admin_refresh');
    response.cookies.delete('admin_access');
    return response;
  }

  const { accessToken, refreshToken: newToken, user } = await apiRes.json();

  const response = NextResponse.json({ accessToken, user });
  const opts = { httpOnly: true, secure: IS_PROD, sameSite: 'lax' as const, maxAge: COOKIE_MAX_AGE, path: '/' };
  response.cookies.set('admin_refresh', newToken,      opts);
  response.cookies.set('admin_access',  accessToken,   opts);

  return response;
}
