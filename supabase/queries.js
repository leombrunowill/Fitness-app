import { getSupabaseClient, getAuthUser } from './client.js';

async function withUser() {
  const client = getSupabaseClient();
  const user = await getAuthUser();
  if (!client || !user) return { client: null, user: null };
  return { client, user };
}

function dateFromIso(isoLike) {
  const v = String(isoLike || '');
  return v ? v.slice(0, 10) : '';
}

export async function fetchDashboardData(rangeStartIso, streakRangeStartIso = rangeStartIso) {
  const { client, user } = await withUser();
  if (!client || !user) return null;

  const [profileRes, setsRes] = await Promise.all([
    client.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    client
      .from('workout_sets')
      .select('id, workout_id, exercise_id, muscle_group, weight, reps, created_at, completed, is_warmup')
      .eq('user_id', user.id)
      .eq('completed', true)
      .eq('is_warmup', false)
      .gte('created_at', `${streakRangeStartIso}T00:00:00Z`)
      .order('created_at', { ascending: false })
  ]);

  const sets = setsRes.data || [];
  const workouts = Array.from(
    new Set(
      sets
        .map((s) => dateFromIso(s.created_at))
        .filter(Boolean)
    )
  ).map((date) => ({ date }));

  return {
    error: profileRes.error || setsRes.error || null,
    profile: profileRes.data || null,
    workouts,
    sets: sets.filter((s) => dateFromIso(s.created_at) >= rangeStartIso),
    exercises: [],
    bodyweight: []
  };
}

export async function upsertProfileSetup(payload) {
  const { client, user } = await withUser();
  if (!client || !user) return { error: new Error('Not signed in') };

  const draft = {
    id: user.id,
    training_goal: payload.training_goal || null,
    experience_level: payload.experience_level || null,
    weekly_training_days: Number(payload.weekly_training_days || 0) || null,
    bodyweight_goal: Number(payload.bodyweight_goal || 0) || null,
    updated_at: new Date().toISOString()
  };

  return client.from('profiles').upsert(draft, { onConflict: 'id' });
}
