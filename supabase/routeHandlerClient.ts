import { createClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return { url, anonKey };
}

export function createRouteHandlerClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createClient(url, anonKey);
}

export async function getRouteHandlerUser() {
  const supabase = createRouteHandlerClient();
  const headerStore = headers();
  const cookieStore = cookies();

  const authHeader = headerStore.get('authorization');
  const bearerToken = authHeader?.toLowerCase().startsWith('bearer ')
    ? authHeader.slice('bearer '.length)
    : null;

  const rawCookieToken =
    cookieStore.get('sb-access-token')?.value ||
    cookieStore
      .getAll()
      .find((cookie) => cookie.name.endsWith('-auth-token'))
      ?.value;

  let cookieToken: string | null = rawCookieToken || null;
  if (rawCookieToken?.startsWith('[')) {
    try {
      const parsed = JSON.parse(rawCookieToken);
      cookieToken = Array.isArray(parsed) ? parsed[0] : rawCookieToken;
    } catch {
      cookieToken = rawCookieToken;
    }
  }

  const token = bearerToken || cookieToken;

  if (!token) {
    return { user: null, error: new Error('Missing auth token') };
  }

  const { data, error } = await supabase.auth.getUser(token);
  return { user: data.user, error };
}
