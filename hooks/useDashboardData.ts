'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export const DASHBOARD_QUERY_KEY = ['dashboard'] as const;

type OfflineItem = { type: 'bodyweight' | 'workout' | 'nutrition'; payload: any };
const OFFLINE_QUEUE_KEY = 'fitness-offline-queue';

const readQueue = (): OfflineItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
};

const writeQueue = (items: OfflineItem[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(items));
};

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
  const { pushToast } = useToast();
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
    ...baseMutationHandlers,
  });

  const logNutrition = useMutation({
    mutationFn: logNutritionEntry,
    ...baseMutationHandlers,
  });

  const queueAction = useCallback((type: OfflineItem['type'], payload: any) => {
    const queue = readQueue();
    queue.push({ type, payload });
    writeQueue(queue);
  }, []);

  const syncOfflineQueue = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    const items = readQueue();
    if (!items.length) return;

    const remaining: OfflineItem[] = [];
    for (const item of items) {
      try {
        if (item.type === 'bodyweight') await logBodyweightEntry(item.payload);
        if (item.type === 'workout') await logWorkoutEntry(item.payload);
        if (item.type === 'nutrition') await logNutritionEntry(item.payload);
      } catch {
        remaining.push(item);
      }
    }

    writeQueue(remaining);
    if (!remaining.length) {
      pushToast('Offline logs synced.', 'success');
      invalidateDashboard();
    }
  }, [invalidateDashboard, pushToast]);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    syncOfflineQueue();
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [syncOfflineQueue]);

  const safeLogBodyweight = (value: number) => {
    logBodyweight.mutate(value, {
      onError: (error) => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          queueAction('bodyweight', value);
          pushToast('Offline: saved for retry when back online.');
          return;
        }
        pushToast((error as Error).message || 'Failed to save bodyweight.', 'error');
      },
    });
  };

  const safeLogWorkout = (input: WorkoutEntryInput) => {
    logWorkout.mutate(input, {
      onError: (error) => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          queueAction('workout', input);
          pushToast('Offline: workout saved for retry when back online.');
          return;
        }
        pushToast((error as Error).message || 'Failed to save workout.', 'error');
      },
    });
  };

  const safeLogNutrition = (input: NutritionEntryInput) => {
    logNutrition.mutate(input, {
      onError: (error) => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          queueAction('nutrition', input);
          pushToast('Offline: nutrition saved for retry when back online.');
          return;
        }
        pushToast((error as Error).message || 'Failed to save nutrition.', 'error');
      },
    });
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
    queueLength: readQueue().length,
    logBodyweight: safeLogBodyweight,
    logWorkout: safeLogWorkout,
    logNutrition: safeLogNutrition,
    bodyweightSaving: logBodyweight.isPending,
    workoutSaving: logWorkout.isPending,
    nutritionSaving: logNutrition.isPending,
  };
}
