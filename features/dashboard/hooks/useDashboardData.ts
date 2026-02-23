'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getBodyweightTrend, type BodyweightTrend } from '../utils/getBodyweightTrend';
import { getStreakStats } from '../utils/getAdherenceDays';

export type GoalType = 'cutting' | 'bulking' | 'maintaining';

type WorkoutSummary = {
  name: string;
  primaryMuscles: string[];
  exerciseCount: number;
  snapshot: string;
};

type WeakPointSummary = {
  muscleGroup: string;
  reason: string;
  recommendation: string;
};

type BodyweightLog = {
  value: number;
  loggedAt: string;
};

export type DashboardData = {
  firstName: string;
  adherenceDays: Array<{ date: string; completedWorkout: boolean; bodyweightLogged: boolean; calorieTargetReached: boolean }>;
  streak: {
    current: number;
    longest: number;
  };
  adherenceScore: number;
  nextWorkout: WorkoutSummary | null;
  volumeStatus: Array<{ muscle: string; value: number; status: 'undertrained' | 'optimal' | 'overreached' }>;
  weakPoint: WeakPointSummary | null;
  nutritionProgress: {
    caloriesConsumed: number;
    proteinConsumed: number;
    caloriesTarget: number;
    proteinTarget: number;
    calorieTargetReached: boolean;
  };
  todayBodyweight: BodyweightLog | null;
  bodyweightLogs14d: BodyweightLog[];
  todayDateLabel: string;
};

const DASHBOARD_QUERY_KEY = ['dashboard'] as const;

async function fetchDashboardData(): Promise<DashboardData> {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase.rpc('dashboard_v3_snapshot');

  if (error) throw error;

  const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
  const fallback = (data || {}) as Partial<DashboardData>;

  const adherenceDays = fallback.adherenceDays || [];
  const streakStats = getStreakStats(adherenceDays, locale);

  return {
    firstName: fallback.firstName || 'Athlete',
    adherenceDays,
    streak: fallback.streak || { current: streakStats.currentStreak, longest: streakStats.longestStreak },
    adherenceScore: fallback.adherenceScore || 0,
    nextWorkout: fallback.nextWorkout || null,
    volumeStatus: fallback.volumeStatus || [],
    weakPoint: fallback.weakPoint || null,
    nutritionProgress: fallback.nutritionProgress || {
      caloriesConsumed: 0,
      proteinConsumed: 0,
      caloriesTarget: 0,
      proteinTarget: 0,
      calorieTargetReached: false,
    },
    todayBodyweight: fallback.todayBodyweight || null,
    bodyweightLogs14d: fallback.bodyweightLogs14d || [],
    todayDateLabel: fallback.todayDateLabel || new Date().toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' }),
  };
}

export function useDashboardData() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: fetchDashboardData,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const selectors = useMemo(() => {
    const data = query.data;

    return {
      data,
      bodyweightTrend: data ? getBodyweightTrend(data.bodyweightLogs14d) : ('insufficient_data' as BodyweightTrend),
      caloriesRemaining: data ? Math.max(data.nutritionProgress.caloriesTarget - data.nutritionProgress.caloriesConsumed, 0) : 0,
      proteinRemaining: data ? Math.max(data.nutritionProgress.proteinTarget - data.nutritionProgress.proteinConsumed, 0) : 0,
    };
  }, [query.data]);

  const invalidateDashboard = useCallback(() => queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY }), [queryClient]);

  const logBodyweight = useMutation({
    mutationFn: async (value: number) => {
      const supabase = createClientComponentClient();
      const { error } = await supabase.from('bodyweight_logs').insert({ weight: value });
      if (error) throw error;
      return value;
    },
    onMutate: async (value) => {
      await queryClient.cancelQueries({ queryKey: DASHBOARD_QUERY_KEY });
      const previous = queryClient.getQueryData<DashboardData>(DASHBOARD_QUERY_KEY);
      const now = new Date().toISOString();

      queryClient.setQueryData<DashboardData>(DASHBOARD_QUERY_KEY, (current) => {
        if (!current) return current;
        return {
          ...current,
          todayBodyweight: { value, loggedAt: now },
          bodyweightLogs14d: [...current.bodyweightLogs14d, { value, loggedAt: now }],
        };
      });

      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(DASHBOARD_QUERY_KEY, context.previous);
      }
    },
    onSettled: invalidateDashboard,
  });

  const onWorkoutLogged = () => invalidateDashboard();
  const onNutritionLogged = () => invalidateDashboard();

  useEffect(() => {
    const handleWorkout = () => invalidateDashboard();
    const handleWeight = () => invalidateDashboard();
    const handleNutrition = () => invalidateDashboard();

    window.addEventListener('fitness:new-workout', handleWorkout);
    window.addEventListener('fitness:new-weight', handleWeight);
    window.addEventListener('fitness:nutrition-log', handleNutrition);

    return () => {
      window.removeEventListener('fitness:new-workout', handleWorkout);
      window.removeEventListener('fitness:new-weight', handleWeight);
      window.removeEventListener('fitness:nutrition-log', handleNutrition);
    };
  }, [invalidateDashboard]);

  return { ...query, ...selectors, logBodyweight, onWorkoutLogged, onNutritionLogged };
}

export { DASHBOARD_QUERY_KEY };
