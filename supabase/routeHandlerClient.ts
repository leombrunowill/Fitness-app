import { createClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';
import { getSupabaseConfig } from '@/supabase/config';

export function createRouteHandlerClient(accessToken?: string | null) {
  const { url, anonKey } = getSupabaseConfig();
  return createClient(url, anonKey, {
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}

function getRequestAccessToken() {
  const headerStore = headers();
  const cookieStore = cookies();

  const authHeader = headerStore.get('authorization');
  const bearerToken = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice('bearer '.length) : null;

  const rawCookieToken = cookieStore.get('sb-access-token')?.value || cookieStore.getAll().find((cookie) => cookie.name.endsWith('-auth-token'))?.value;

  let cookieToken: string | null = rawCookieToken || null;
  if (rawCookieToken?.startsWith('[')) {
    try {
      const parsed = JSON.parse(rawCookieToken);
      cookieToken = Array.isArray(parsed) ? parsed[0] : rawCookieToken;
    } catch {
      cookieToken = rawCookieToken;
    }
  }

  return bearerToken || cookieToken;
}

export async function getRouteHandlerUser() {
  const token = getRequestAccessToken();

  if (!token) {
    return { user: null, error: new Error('Missing auth token'), token: null };
  }

  const supabase = createRouteHandlerClient(token);
  const { data, error } = await supabase.auth.getUser(token);
  return { user: data.user, error, token };
}
