import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PROTECTED_PATHS = ['/dashboard', '/nutrition', '/workouts', '/profile'];

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('sb-access-token')?.value;
  if (!accessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next();

  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/nutrition/:path*', '/workouts/:path*', '/profile/:path*'],
};
