let cachedClient = null;

export function getSupabaseClient() {
  if (cachedClient) return cachedClient;
  if (!window.supabase || !window.IRONLOG_SUPABASE_URL || !window.IRONLOG_SUPABASE_ANON_KEY) return null;
  cachedClient = window.supabase.createClient(window.IRONLOG_SUPABASE_URL, window.IRONLOG_SUPABASE_ANON_KEY);
  return cachedClient;
}

export async function getAuthUser() {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data && data.user ? data.user : null;
}
