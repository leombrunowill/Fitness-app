'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export type ReadinessState = 'good_to_train' | 'recovery_needed' | 'behind_on_protein';
export type GoalType = 'cutting' | 'bulking' | 'maintaining';

type WorkoutSummary = {
  name: string;
  primaryMuscles: string[];
  exerciseCount: number;
  snapshot: string;
};

type PRSummary = {
  exercise: string;
  weight: number;
  reps: number;
  happenedAt: string;
};

export type DashboardData = {
  todayBodyweight: number | null;
  streakDays: number;
  workoutsThisWeek: number;
  adherencePct: number;
  readiness: ReadinessState;
  readinessContext?: string;
  nextWorkout: WorkoutSummary | null;
  lastWorkout: WorkoutSummary | null;
  muscleVolume7d: Array<{ muscle: string; value: number; status: 'undertrained' | 'optimal' | 'overreached' }>;
  goal: {
    type: GoalType;
    name: string;
    dailyCaloriesTarget: number;
    dailyProteinTarget: number;
    paceDelta?: number;
    consistencyScore?: number;
    adherencePct?: number;
  } | null;
  nutritionToday: {
    caloriesConsumed: number;
    proteinConsumed: number;
    hasLoggedFood: boolean;
  };
  recentPR: PRSummary | null;
  isNewUser: boolean;
};

const DASHBOARD_QUERY_KEY = ['dashboard'] as const;

async function fetchDashboardData(): Promise<DashboardData> {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase.rpc('dashboard_v2_snapshot');
  if (error) throw error;
  return data as DashboardData;
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
      caloriesRemaining: data?.goal
        ? Math.max(data.goal.dailyCaloriesTarget - data.nutritionToday.caloriesConsumed, 0)
        : 0,
      proteinRemaining: data?.goal
        ? Math.max(data.goal.dailyProteinTarget - data.nutritionToday.proteinConsumed, 0)
        : 0,
      showPR: !!data?.recentPR && Date.now() - new Date(data.recentPR.happenedAt).getTime() <= 3 * 24 * 60 * 60 * 1000,
    };
  }, [query.data]);

  const optimisticNutritionLog = useMutation({
    mutationFn: async (delta: { calories: number; protein: number }) => delta,
    onMutate: async (delta) => {
      await queryClient.cancelQueries({ queryKey: DASHBOARD_QUERY_KEY });
      const previous = queryClient.getQueryData<DashboardData>(DASHBOARD_QUERY_KEY);
      queryClient.setQueryData<DashboardData>(DASHBOARD_QUERY_KEY, (current) => {
        if (!current) return current;
        return {
          ...current,
          nutritionToday: {
            ...current.nutritionToday,
            hasLoggedFood: true,
            caloriesConsumed: current.nutritionToday.caloriesConsumed + delta.calories,
            proteinConsumed: current.nutritionToday.proteinConsumed + delta.protein,
          },
        };
      });
      return { previous };
    },
    onError: (_error, _delta, context) => {
      if (context?.previous) {
        queryClient.setQueryData(DASHBOARD_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    },
  });

  return { ...query, ...selectors, optimisticNutritionLog };
}

export { DASHBOARD_QUERY_KEY };
