'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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

type WorkoutRow = { id: string; name: string; started_at: string; completed_at: string | null };
type SetRow = { id: string; workout_id: string; muscle_group: string | null; secondary_muscle_group: string | null; secondary_multiplier: number | null; reps: number | null; weight: number | null; created_at: string };

const DAY = 24 * 60 * 60 * 1000;
const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);

function getFirstName(displayName: string | null | undefined) {
  if (!displayName) return 'Athlete';
  return displayName.trim().split(/\s+/)[0] || 'Athlete';
}

function buildWorkoutStreak(workouts: WorkoutRow[]) {
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

  if (!currentStreak) {
    const yesterday = new Date(new Date(`${today}T00:00:00Z`).getTime() - DAY).toISOString().slice(0, 10);
    if (daySet.has(yesterday)) {
      currentStreak = 1;
      let walk = new Date(`${yesterday}T00:00:00Z`).getTime() - DAY;
      while (daySet.has(new Date(walk).toISOString().slice(0, 10))) {
        currentStreak += 1;
        walk -= DAY;
      }
    }
  }

  return { current: currentStreak, longest };
}

function computeRecoveryScore(workouts: WorkoutRow[]) {
  const latest = workouts.map((w) => new Date(w.completed_at || w.started_at).getTime()).sort((a, b) => b - a)[0];
  if (!latest) return 82;
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

export async function fetchDashboardData(): Promise<DashboardData> {
  const supabase = createClientComponentClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;

  if (!userId) throw new Error('Not signed in');

  const now = new Date();
  const today = toIsoDate(now);
  const sevenDaysAgo = toIsoDate(new Date(now.getTime() - DAY * 7));
  const thirtyDaysAgo = toIsoDate(new Date(now.getTime() - DAY * 30));

  const [profileRes, goalRes, workoutsRes, setsRes, bodyweightRes, nutritionRes] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', userId).maybeSingle(),
    supabase.from('user_goals').select('daily_calorie_target,daily_protein_target').eq('user_id', userId).maybeSingle(),
    supabase.from('workouts').select('id,name,started_at,completed_at').eq('user_id', userId).lte('started_at', `${today}T23:59:59Z`).order('started_at', { ascending: false }),
    supabase
      .from('workout_sets')
      .select('id,workout_id,muscle_group,secondary_muscle_group,secondary_multiplier,reps,weight,created_at')
      .eq('user_id', userId)
      .gte('created_at', `${thirtyDaysAgo}T00:00:00Z`),
    supabase.from('bodyweight_logs').select('weight,created_at').eq('user_id', userId).gte('created_at', `${sevenDaysAgo}T00:00:00Z`).order('created_at', { ascending: true }),
    supabase.from('nutrition_logs').select('calories,protein,created_at').eq('user_id', userId).gte('created_at', `${today}T00:00:00Z`).lte('created_at', `${today}T23:59:59Z`),
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
  const caloriePct = caloriesTarget > 0 ? Math.min(100, Math.round((nutritionToday.caloriesConsumed / caloriesTarget) * 100)) : 0;
  const proteinPct = proteinTarget > 0 ? Math.min(100, Math.round((nutritionToday.proteinConsumed / proteinTarget) * 100)) : 0;

  const nutritionAdherence = Math.round((caloriePct + proteinPct) / 2);
  const streak = buildWorkoutStreak(workouts);
  const volumeStatus = getVolumeStatus(sets);
  const weakPoint = getWeakPoint(volumeStatus);
  const recoveryScore = computeRecoveryScore(workouts);

  const nextWorkoutSource = workouts[0];
  const nextWorkoutSets = nextWorkoutSource ? sets.filter((s) => s.workout_id === nextWorkoutSource.id) : [];
  const primaryMuscles = Array.from(new Set(nextWorkoutSets.map((set) => set.muscle_group).filter(Boolean) as string[])).slice(0, 3);

  const todayDateLabel = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  return {
    firstName: getFirstName(profileRes.data?.display_name),
    streak,
    adherenceScore: nutritionAdherence,
    nutritionAdherence,
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
    recoveryScore,
    todayFocus: weakPoint
      ? { title: `Bring up ${weakPoint.muscleGroup}`, actionLabel: 'View suggested exercises', description: weakPoint.reason }
      : { title: 'Stay consistent', actionLabel: 'Start workout', description: "Complete today's session to protect your streak." },
    todayDateLabel,
  };
}

export async function logBodyweightEntry(value: number) {
  const supabase = createClientComponentClient();
  const { error } = await supabase.from('bodyweight_logs').insert({ weight: value });
  if (error) throw error;
  return { value, loggedAt: new Date().toISOString() };
}
