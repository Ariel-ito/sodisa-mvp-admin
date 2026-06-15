import { NextRequest, NextResponse } from 'next/server';

const API_URL        = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const COOKIE_MAX_AGE = 8 * 60 * 60;
const IS_PROD        = process.env.NODE_ENV === 'production';

function setCookies(response: ReturnType<typeof import('next/server').NextResponse.json>, refreshToken: string, accessToken: string) {
  const opts = { httpOnly: true, secure: IS_PROD, sameSite: 'strict' as const, maxAge: COOKIE_MAX_AGE, path: '/' };
  response.cookies.set('admin_refresh', refreshToken, opts);
  response.cookies.set('admin_access',  accessToken,  opts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const apiRes = await fetch(`${API_URL}/portal/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await apiRes.json();

  if (!apiRes.ok) {
    return NextResponse.json(data, { status: apiRes.status });
  }

  const response = NextResponse.json({ accessToken: data.accessToken, user: data.user });
  setCookies(response, data.refreshToken, data.accessToken);
  return response;
}
