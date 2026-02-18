import { getSupabaseClient, getAuthUser } from './client.js';

async function withUser() {
  const client = getSupabaseClient();
  const user = await getAuthUser();
  if (!client || !user) return { client: null, user: null };
  return { client, user };
}

export async function fetchDashboardData(rangeStartIso) {
  const { client, user } = await withUser();
  if (!client || !user) return null;

  const [profiles, workouts, sets, exercises, bodyweight] = await Promise.all([
    client.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    client.from('workouts').select('*').eq('user_id', user.id).gte('date', rangeStartIso).order('date', { ascending: false }),
    client.from('sets').select('*').eq('user_id', user.id).gte('created_at', `${rangeStartIso}T00:00:00Z`),
    client.from('exercises').select('*').eq('user_id', user.id),
    client.from('bodyweight_logs').select('*').eq('user_id', user.id).gte('date', rangeStartIso).order('date', { ascending: false })
  ]);

  const error = (profiles && profiles.error) || (workouts && workouts.error) || (sets && sets.error) || (exercises && exercises.error) || (bodyweight && bodyweight.error) || null;

  return {
    error,
    profile: profiles.data || null,
    workouts: workouts.data || [],
    sets: sets.data || [],
    exercises: exercises.data || [],
    bodyweight: bodyweight.data || []
  };
}

export async function upsertProfileSetup(payload) {
  const { client, user } = await withUser();
  if (!client || !user) return { error: new Error('Not signed in') };
  return client.from('profiles').upsert({ id: user.id, ...payload, updated_at: new Date().toISOString() }, { onConflict: 'id' });
}
