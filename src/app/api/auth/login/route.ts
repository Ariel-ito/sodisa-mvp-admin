import { NextRequest, NextResponse } from 'next/server';

const API_URL        = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const COOKIE_MAX_AGE = 8 * 60 * 60; // 8 hours in seconds

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

  const response = NextResponse.json({
    accessToken: data.accessToken,
    user:        data.user,
  });

  response.cookies.set('admin_refresh', data.refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   COOKIE_MAX_AGE,
    path:     '/',
  });

  return response;
}
