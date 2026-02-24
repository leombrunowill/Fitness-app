'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  buildWorkoutStreak,
  computeRecoveryScoreFromDate,
  fetchDashboardData,
  logBodyweightEntry,
  logNutritionEntry,
  logWorkoutEntry,
  recomputeDashboard,
  type DashboardData,
  type NutritionEntryInput,
  type WorkoutEntryInput,
} from '@/data/dashboard';
import { getBodyweightTrend, type BodyweightTrend } from '@/features/dashboard/utils/getBodyweightTrend';
import { useToast } from '@/components/providers/ToastProvider';
import { useSessionUser } from '@/components/providers/AppProviders';

export const DASHBOARD_QUERY_KEY = ['dashboard'] as const;

function patchAfterWorkout(current: DashboardData, input: WorkoutEntryInput) {
  const now = new Date().toISOString();
  const nextWorkout = {
    name: input.name?.trim() || 'Quick workout',
    primaryMuscles: [input.muscleGroup?.trim() || 'Full body'],
    exerciseCount: 1,
    snapshot: `Last completed ${new Date(now).toLocaleDateString()}`,
  };
  const nextVolume = [...current.volumeStatus];
  const muscle = input.muscleGroup?.trim() || 'Full body';
  const reps = Number.isFinite(input.reps) ? Number(input.reps) : 10;
  const existing = nextVolume.find((v) => v.muscle === muscle);
  if (existing) {
    const nextValue = Math.min(100, existing.value + reps);
    existing.value = nextValue;
    existing.status = nextValue < 40 ? 'undertrained' : nextValue > 85 ? 'overreached' : 'optimal';
  } else {
    nextVolume.push({ muscle, value: Math.min(100, reps), status: reps < 40 ? 'undertrained' : 'optimal' });
  }
  nextVolume.sort((a, b) => a.value - b.value);
  const streak = buildWorkoutStreak([{ id: 'optimistic', name: nextWorkout.name, started_at: now, completed_at: now }]);

  return recomputeDashboard({
    ...current,
    streak: {
      current: Math.max(current.streak.current, streak.current),
      longest: Math.max(current.streak.longest, current.streak.current + 1),
    },
    nextWorkout,
    recoveryScore: computeRecoveryScoreFromDate(now),
    volumeStatus: nextVolume,
  });
}

export function useDashboardData() {
  const queryClient = useQueryClient();
    const router = useRouter();
  const { pushToast } = useToast();
    const { userId } = useSessionUser();
  const [lastRecomputeAt, setLastRecomputeAt] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine);

  const query = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: fetchDashboardData,
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const invalidateDashboard = useCallback(() => queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY }), [queryClient]);

  const markRecompute = () => setLastRecomputeAt(new Date().toISOString());

  const updateCache = (patch: (current: DashboardData) => DashboardData) => {
    queryClient.setQueryData<DashboardData>(DASHBOARD_QUERY_KEY, (current) => {
      if (!current) return current;
      const next = patch(current);
      markRecompute();
      return next;
    });
  };

  const baseMutationHandlers = {
    onError: (_error: unknown, _vars: unknown, context: { previous?: DashboardData } | undefined) => {
      if (context?.previous) queryClient.setQueryData(DASHBOARD_QUERY_KEY, context.previous);
      pushToast('Could not sync action. Please sign in and try again.');
    },
    onSettled: invalidateDashboard,
  };

  const logBodyweight = useMutation({
    mutationFn: logBodyweightEntry,
    onMutate: async (value: number) => {
      await queryClient.cancelQueries({ queryKey: DASHBOARD_QUERY_KEY });
      const previous = queryClient.getQueryData<DashboardData>(DASHBOARD_QUERY_KEY);
      const optimistic = { value, loggedAt: new Date().toISOString() };
      updateCache((current) => ({ ...current, todayBodyweight: optimistic, bodyweightLogs14d: [...current.bodyweightLogs14d, optimistic].slice(-14) }));
      return { previous };
    },
    ...baseMutationHandlers,
  });

  const logWorkout = useMutation({
    mutationFn: logWorkoutEntry,
    onMutate: async (input: WorkoutEntryInput) => {
      await queryClient.cancelQueries({ queryKey: DASHBOARD_QUERY_KEY });
      const previous = queryClient.getQueryData<DashboardData>(DASHBOARD_QUERY_KEY);
      updateCache((current) => patchAfterWorkout(current, input));
      return { previous };
    },
    ...baseMutationHandlers,
  });

  const logNutrition = useMutation({
    mutationFn: logNutritionEntry,
    ...baseMutationHandlers,
  });

  useEffect(() => {
       const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
}, []);

  const requireSignedIn = useCallback(() => {
    if (userId) return true;
    pushToast('Please sign in to log workouts or nutrition.', 'error');
    router.push('/login');
    return false;
  }, [pushToast, router, userId]);
  
  const safeLogBodyweight = (value: number) => {
 if (!requireSignedIn()) return;
    logBodyweight.mutate(value);
  };

  const safeLogWorkout = (input: WorkoutEntryInput) => {
   if (!requireSignedIn()) return;
    logWorkout.mutate(input);
  };

  const safeLogNutrition = (input: NutritionEntryInput) => {
     if (!requireSignedIn()) return;
    logNutrition.mutate(input);
  };

  const selectors = useMemo(() => {
    const data = query.data;
    return {
      data,
      bodyweightTrend: data ? getBodyweightTrend(data.bodyweightLogs14d) : ('insufficient_data' as BodyweightTrend),
      caloriesRemaining: data ? Math.max(data.nutritionProgress.caloriesTarget - data.nutritionProgress.caloriesConsumed, 0) : 0,
      proteinRemaining: data ? Math.max(data.nutritionProgress.proteinTarget - data.nutritionProgress.proteinConsumed, 0) : 0,
    };
  }, [query.data]);

  return {
    ...query,
    ...selectors,
    isOnline,
    lastRecomputeAt,
    queueLength: 0,
    logBodyweight: safeLogBodyweight,
    logWorkout: safeLogWorkout,
    logNutrition: safeLogNutrition,
    bodyweightSaving: logBodyweight.isPending,
    workoutSaving: logWorkout.isPending,
    nutritionSaving: logNutrition.isPending,
  };
}
