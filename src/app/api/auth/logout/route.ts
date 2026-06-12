import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('admin_refresh')?.value;

  if (refreshToken) {
    try {
      await fetch(`${API_URL}/portal/auth/logout`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refreshToken }),
      });
    } catch { /* best effort */ }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete('admin_refresh');
  response.cookies.delete('admin_access');
  return response;
}
