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

export async function getBodyweightLogs() {
  const { client, user } = await withUser();
  if (!client || !user) return [];
  const res = await client.from('bodyweight_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
  if (res.error) throw res.error;
  return res.data || [];
}

export async function logBodyweight({ weight, created_at }) {
  const { client, user } = await withUser();
  if (!client || !user) throw new Error('Not signed in');
  const res = await client.from('bodyweight_logs').insert({ user_id: user.id, weight: Number(weight || 0), created_at: created_at || new Date().toISOString() }).select('*').maybeSingle();
  if (res.error) throw res.error;
  return res.data;
}

export async function getWorkouts() {
  const { client, user } = await withUser();
  if (!client || !user) return [];
  const res = await client.from('workouts').select('*, workout_sets(*)').eq('user_id', user.id).order('started_at', { ascending: false });
  if (res.error) throw res.error;
  return res.data || [];
}

export async function createWorkout({ name, started_at }) {
  const { client, user } = await withUser();
  if (!client || !user) throw new Error('Not signed in');
  const res = await client.from('workouts').insert({ user_id: user.id, name: name || 'Workout', started_at: started_at || new Date().toISOString() }).select('*').maybeSingle();
  if (res.error) throw res.error;
  return res.data;
}

export async function logSet(payload) {
  const { client, user } = await withUser();
  if (!client || !user) throw new Error('Not signed in');
  const res = await client.from('workout_sets').insert({
    user_id: user.id,
    workout_id: payload.workout_id,
    exercise_id: payload.exercise_id,
    weight: Number(payload.weight || 0),
    reps: Number(payload.reps || 0),
    rpe: payload.rpe == null ? null : Number(payload.rpe),
    is_warmup: !!payload.is_warmup,
    created_at: payload.created_at || new Date().toISOString()
  }).select('*').maybeSingle();
  if (res.error) throw res.error;
  return res.data;
}

export async function completeWorkout(workoutId, completed_at = new Date().toISOString()) {
  const { client, user } = await withUser();
  if (!client || !user) throw new Error('Not signed in');
  const res = await client.from('workouts').update({ completed_at }).eq('id', workoutId).eq('user_id', user.id).select('*').maybeSingle();
  if (res.error) throw res.error;
  return res.data;
}

export async function getNutritionLogs() {
  const { client, user } = await withUser();
  if (!client || !user) return [];
  const res = await client.from('nutrition_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
  if (res.error) throw res.error;
  return res.data || [];
}

export async function logFood(payload) {
  const { client, user } = await withUser();
  if (!client || !user) throw new Error('Not signed in');
  const res = await client.from('nutrition_logs').insert({
    user_id: user.id,
    food_name: payload.food_name,
    calories: Number(payload.calories || 0),
    protein: Number(payload.protein || 0),
    carbs: Number(payload.carbs || 0),
    fat: Number(payload.fat || 0),
    meal_type: payload.meal_type || null,
    created_at: payload.created_at || new Date().toISOString()
  }).select('*').maybeSingle();
  if (res.error) throw res.error;
  return res.data;
}

export async function getUserGoal() {
  const { client, user } = await withUser();
  if (!client || !user) return null;
  const res = await client.from('user_goals').select('*').eq('user_id', user.id).maybeSingle();
  if (res.error) throw res.error;
  return res.data || null;
}

export async function updateUserGoal(payload) {
  const { client, user } = await withUser();
  if (!client || !user) throw new Error('Not signed in');
  const res = await client.from('user_goals').upsert({
    user_id: user.id,
    goal_type: payload.goal_type || 'cut',
    target_weight: payload.target_weight == null ? null : Number(payload.target_weight),
    weekly_pace: payload.weekly_pace == null ? null : Number(payload.weekly_pace),
    daily_calorie_target: payload.daily_calorie_target == null ? null : Number(payload.daily_calorie_target),
    daily_protein_target: payload.daily_protein_target == null ? null : Number(payload.daily_protein_target),
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' }).select('*').maybeSingle();
  if (res.error) throw res.error;
  return res.data;
}

export async function fetchDashboardData(rangeStartIso, streakRangeStartIso = rangeStartIso) {
  const { client, user } = await withUser();
  if (!client || !user) return null;

  const [profileRes, setsRes, workoutsRes, bodyweightRes] = await Promise.all([
    client.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    client
      .from('workout_sets')
      .select('id, workout_id, exercise_id, muscle_group, weight, reps, created_at, is_warmup')
      .eq('user_id', user.id)
      .eq('is_warmup', false)
      .gte('created_at', `${streakRangeStartIso}T00:00:00Z`)
      .order('created_at', { ascending: false }),
    client.from('workouts').select('id, started_at').eq('user_id', user.id).gte('started_at', `${streakRangeStartIso}T00:00:00Z`),
    client.from('bodyweight_logs').select('weight, created_at').eq('user_id', user.id).order('created_at', { ascending: true })
  ]);

  const sets = setsRes.data || [];
  const workouts = (workoutsRes.data || []).map((w) => ({ date: dateFromIso(w.started_at) })).filter((w) => w.date);

  return {
    error: profileRes.error || setsRes.error || workoutsRes.error || bodyweightRes.error || null,
    profile: profileRes.data || null,
    workouts,
    sets: sets.filter((s) => dateFromIso(s.created_at) >= rangeStartIso),
    exercises: [],
    bodyweight: (bodyweightRes.data || []).map((bw) => ({ date: dateFromIso(bw.created_at), weight: bw.weight }))
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
