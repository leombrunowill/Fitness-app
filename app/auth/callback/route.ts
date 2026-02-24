import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '@/supabase/config';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login', origin));
  }

  const { url, anonKey } = getSupabaseConfig();
  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(new URL('/login', origin));
  }

  const response = NextResponse.redirect(new URL('/dashboard', origin));
  response.cookies.set('sb-access-token', data.session.access_token, {
    path: '/',
    sameSite: 'lax',
    maxAge: data.session.expires_in,
  });
  response.cookies.set('sb-refresh-token', data.session.refresh_token, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
