'use client';

import { getSupabaseBrowserClient } from '@/supabase/browserClient';
import { logNutritionEntry as strictLogNutritionEntry, type MealType } from '@/data/nutrition';

export type DashboardData = {
  firstName: string;
  streak: { current: number; longest: number };
  adherenceScore: number;
  nutritionAdherence: number;
  nextWorkout: {
    name: string;
    primaryMuscles: string[];
    exerciseCount: number;
    snapshot: string;
  } | null;
  volumeStatus: Array<{ muscle: string; value: number; status: 'undertrained' | 'optimal' | 'overreached' }>;
  weakPoint: {
    muscleGroup: string;
    reason: string;
    recommendation: string;
  } | null;
  nutritionProgress: {
    caloriesConsumed: number;
    proteinConsumed: number;
    caloriesTarget: number;
    proteinTarget: number;
    calorieTargetReached: boolean;
  };
  todayBodyweight: { value: number; loggedAt: string } | null;
  bodyweightLogs14d: Array<{ value: number; loggedAt: string }>;
  recoveryScore: number;
  todayFocus: { title: string; actionLabel: string; description: string };
  todayDateLabel: string;
};

export type WorkoutEntryInput = { name?: string; muscleGroup?: string; reps?: number };
export type NutritionEntryInput = { foodName?: string; calories: number; protein: number; carbs?: number; fat?: number; mealType?: MealType | null };

type WorkoutRow = { id: string; name: string; started_at: string; completed_at: string | null };
type SetRow = { id: string; workout_id: string; muscle_group: string | null; secondary_muscle_group: string | null; secondary_multiplier: number | null; reps: number | null; weight: number | null; created_at: string };

const DAY = 24 * 60 * 60 * 1000;
const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);

function getFirstName(firstName: string | null | undefined, email: string | null | undefined) {
  if (firstName?.trim()) return firstName.trim();
  const emailPrefix = email?.split('@')[0]?.trim();
  if (emailPrefix) return emailPrefix;
  return 'there';
}

export function buildWorkoutStreak(workouts: WorkoutRow[]) {
  const today = toIsoDate(new Date());
  const days = Array.from(new Set(workouts.map((w) => toIsoDate(new Date(w.completed_at || w.started_at))).filter((d) => d <= today))).sort();

  if (!days.length) return { current: 0, longest: 0 };

  let longest = 1;
  let running = 1;
  for (let i = 1; i < days.length; i += 1) {
    const prev = new Date(`${days[i - 1]}T00:00:00Z`).getTime();
    const current = new Date(`${days[i]}T00:00:00Z`).getTime();
    if ((current - prev) / DAY === 1) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 1;
    }
  }

  let currentStreak = 0;
  let cursor = new Date(`${today}T00:00:00Z`).getTime();
  const daySet = new Set(days);
  while (daySet.has(new Date(cursor).toISOString().slice(0, 10))) {
    currentStreak += 1;
    cursor -= DAY;
  }

  return { current: currentStreak, longest };
}

export function computeRecoveryScoreFromDate(lastWorkoutAt: string | null) {
  if (!lastWorkoutAt) return 82;
  const latest = new Date(lastWorkoutAt).getTime();
  const daysSince = Math.max(0, Math.floor((Date.now() - latest) / DAY));
  return Math.max(45, Math.min(98, 90 - daysSince * 7));
}

function getVolumeStatus(sets: SetRow[]) {
  const muscleVolume = new Map<string, number>();
  sets.forEach((set) => {
    const primary = set.muscle_group?.trim();
    const secondary = set.secondary_muscle_group?.trim();
    const reps = Number(set.reps || 0);
    if (primary && reps > 0) muscleVolume.set(primary, (muscleVolume.get(primary) || 0) + reps);
    if (secondary && reps > 0) {
      const multiplier = Number(set.secondary_multiplier ?? 0.5);
      muscleVolume.set(secondary, (muscleVolume.get(secondary) || 0) + reps * multiplier);
    }
  });

  const rows = Array.from(muscleVolume.entries()).map(([muscle, raw]) => {
    const value = Math.min(100, Math.round(raw));
    const status: 'undertrained' | 'optimal' | 'overreached' = value < 40 ? 'undertrained' : value > 85 ? 'overreached' : 'optimal';
    return { muscle, value, status };
  });

  return rows.sort((a, b) => a.value - b.value);
}

function getWeakPoint(volumeStatus: ReturnType<typeof getVolumeStatus>) {
  const weak = volumeStatus.find((v) => v.status === 'undertrained');
  if (!weak) return null;
  return {
    muscleGroup: weak.muscle,
    reason: `${weak.muscle} volume is below your 30-day baseline.`,
    recommendation: `Add 2-4 focused working sets for ${weak.muscle} next session.`,
  };
}

export function recomputeDashboard(data: DashboardData): DashboardData {
  const weakPoint = getWeakPoint(data.volumeStatus);
  const caloriesTarget = data.nutritionProgress.caloriesTarget;
  const proteinTarget = data.nutritionProgress.proteinTarget;
  const caloriePct = caloriesTarget > 0 ? Math.min(100, Math.round((data.nutritionProgress.caloriesConsumed / caloriesTarget) * 100)) : 0;
  const proteinPct = proteinTarget > 0 ? Math.min(100, Math.round((data.nutritionProgress.proteinConsumed / proteinTarget) * 100)) : 0;
  const nutritionAdherence = Math.round((caloriePct + proteinPct) / 2);

  return {
    ...data,
    weakPoint,
    nutritionAdherence,
    adherenceScore: nutritionAdherence,
    todayFocus: weakPoint
      ? { title: `Bring up ${weakPoint.muscleGroup}`, actionLabel: 'View suggested exercises', description: weakPoint.reason }
      : { title: 'Stay consistent', actionLabel: 'Start workout', description: "Complete today's session to protect your streak." },
  };
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const supabase = getSupabaseBrowserClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;

 if (!userId) {
    throw new Error('You must be signed in to view dashboard data.');
  }
  
  const now = new Date();
  const today = toIsoDate(now);
  const sevenDaysAgo = toIsoDate(new Date(now.getTime() - DAY * 7));
  const thirtyDaysAgo = toIsoDate(new Date(now.getTime() - DAY * 30));

  const [profileRes, goalRes, workoutsRes, setsRes, bodyweightRes, nutritionRes] = await Promise.all([
    supabase.from('profiles').select('first_name').eq('id', userId).maybeSingle(),
    supabase.from('user_goals').select('daily_calorie_target,daily_protein_target').eq('user_id', userId).maybeSingle(),
    supabase.from('workouts').select('id,name,started_at,completed_at').eq('user_id', userId).lte('started_at', `${today}T23:59:59Z`).order('started_at', { ascending: false }),
    supabase
      .from('workout_sets')
      .select('id,workout_id,muscle_group,secondary_muscle_group,secondary_multiplier,reps,weight,created_at')
      .eq('user_id', userId)
      .gte('created_at', `${thirtyDaysAgo}T00:00:00Z`),
    supabase.from('bodyweight_logs').select('weight,created_at').eq('user_id', userId).gte('created_at', `${sevenDaysAgo}T00:00:00Z`).order('created_at', { ascending: true }),
    supabase.from('nutrition_logs').select('calories,protein,local_date').eq('user_id', userId).eq('local_date', today),
  ]);

  const err = profileRes.error || goalRes.error || workoutsRes.error || setsRes.error || bodyweightRes.error || nutritionRes.error;
  if (err) throw err;

  const workouts = (workoutsRes.data || []) as WorkoutRow[];
  const sets = (setsRes.data || []) as SetRow[];
  const bodyweightLogs = (bodyweightRes.data || []).map((r) => ({ value: Number(r.weight), loggedAt: r.created_at }));
  const todayBodyweight = [...bodyweightLogs].reverse().find((r) => r.loggedAt.startsWith(today));
  const nutritionToday = (nutritionRes.data || []).reduce(
    (acc, row) => ({ caloriesConsumed: acc.caloriesConsumed + Number(row.calories || 0), proteinConsumed: acc.proteinConsumed + Number(row.protein || 0) }),
    { caloriesConsumed: 0, proteinConsumed: 0 },
  );

  const caloriesTarget = Number(goalRes.data?.daily_calorie_target || 0);
  const proteinTarget = Number(goalRes.data?.daily_protein_target || 0);

  const streak = buildWorkoutStreak(workouts);
  const volumeStatus = getVolumeStatus(sets);
  const weakPoint = getWeakPoint(volumeStatus);

  const nextWorkoutSource = workouts[0];
  const nextWorkoutSets = nextWorkoutSource ? sets.filter((s) => s.workout_id === nextWorkoutSource.id) : [];
  const primaryMuscles = Array.from(new Set(nextWorkoutSets.map((set) => set.muscle_group).filter(Boolean) as string[])).slice(0, 3);

  const base: DashboardData = {
    firstName: getFirstName(profileRes.data?.first_name, auth.user?.email),
    streak,
    adherenceScore: 0,
    nutritionAdherence: 0,
    nextWorkout: nextWorkoutSource
      ? {
          name: nextWorkoutSource.name,
          primaryMuscles,
          exerciseCount: nextWorkoutSets.length || 1,
          snapshot: `Last completed ${new Date(nextWorkoutSource.started_at).toLocaleDateString()}`,
        }
      : null,
    volumeStatus,
    weakPoint,
    nutritionProgress: {
      caloriesConsumed: Math.round(nutritionToday.caloriesConsumed),
      proteinConsumed: Math.round(nutritionToday.proteinConsumed),
      caloriesTarget,
      proteinTarget,
      calorieTargetReached: caloriesTarget > 0 && nutritionToday.caloriesConsumed >= caloriesTarget,
    },
    todayBodyweight: todayBodyweight || null,
    bodyweightLogs14d: bodyweightLogs,
    recoveryScore: computeRecoveryScoreFromDate(nextWorkoutSource?.completed_at || nextWorkoutSource?.started_at || null),
    todayFocus: { title: '', actionLabel: '', description: '' },
    todayDateLabel: now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
  };

  return recomputeDashboard(base);
}

async function getUserId() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const userId = data.user?.id || null;
  return { supabase, userId };
}

async function getAccessToken() {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

export async function logBodyweightEntry(value: number) {
  const { supabase, userId } = await getUserId();
  const payload = { user_id: userId, weight: value, created_at: new Date().toISOString() };
if (!userId) throw new Error('You must be signed in to log bodyweight.');
  const { error } = await supabase.from('bodyweight_logs').insert(payload);
  if (error) throw error;
  return { value, loggedAt: payload.created_at };
}

export async function logWorkoutEntry(input: WorkoutEntryInput) {
  const { userId } = await getUserId();
  const name = input.name?.trim() || 'Quick workout';
  const muscleGroup = input.muscleGroup?.trim() || 'Full body';
  const reps = Number.isFinite(input.reps) ? Number(input.reps) : 10;

    if (!userId) throw new Error('You must be signed in to log workouts.');

const token = await getAccessToken();
  if (!token) throw new Error('Missing session token. Please sign in again.');

  const response = await fetch('/api/workouts/log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, muscle_group: muscleGroup, reps }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error || 'Unable to save workout log.');
  }

    return body.data;
}

export async function logNutritionEntry(input: NutritionEntryInput) {
  return strictLogNutritionEntry({
    food_name: input.foodName?.trim() || 'Quick meal',
    calories: Number(input.calories || 0),
    protein: Number(input.protein || 0),
    carbs: Number(input.carbs || 0),
    fat: Number(input.fat || 0),
    meal_type: input.mealType ?? 'snack',
  });
}
