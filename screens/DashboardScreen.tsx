'use client';

import { AppPage } from '@/components/design-system';
import { DashboardScreen as DashboardCards, DashboardSkeleton } from '@/features/dashboard/components/DashboardScreen';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useSessionUser } from '@/components/providers/AppProviders';

export function DashboardScreen() {
  const { userId } = useSessionUser();
  const {
    isPending,
    isFetching,
    isError,
    error,
    data,
    caloriesRemaining,
    proteinRemaining,
    bodyweightTrend,
    logBodyweight,
    logWorkout,
    logNutrition,
    bodyweightSaving,
    workoutSaving,
    nutritionSaving,
    isOnline,
    queueLength,
    lastRecomputeAt,
  } = useDashboardData();

  const loading = isPending || (isFetching && !data);

  return (
    <AppPage>
      {loading ? (
        <DashboardSkeleton />
      ) : isError || !data ? (
        <div className="p-4 text-sm text-red-300">Unable to load dashboard: {(error as Error)?.message || 'Unknown error'}</div>
      ) : (
        <DashboardCards
          data={data}
          caloriesRemaining={caloriesRemaining}
          proteinRemaining={proteinRemaining}
          bodyweightTrend={bodyweightTrend}
          onLogBodyweight={logBodyweight}
          onLogWorkout={() => logWorkout({ name: 'Quick log workout', muscleGroup: 'Chest', reps: 12 })}
          onLogNutrition={() => logNutrition({ foodName: 'Quick meal', calories: 520, protein: 35, carbs: 45, fat: 18, mealType: 'lunch' })}
          bodyweightSaving={bodyweightSaving}
          workoutSaving={workoutSaving}
          nutritionSaving={nutritionSaving}
          isOnline={isOnline}
          queueLength={queueLength}
          lastRecomputeAt={lastRecomputeAt}
          userId={userId}
          isNameLoading={isFetching}
        />
      )}
    </AppPage>
  );
}
