'use client';

import { AppPage } from '@/components/design-system';
import { DashboardScreen as DashboardCards, DashboardSkeleton } from '@/features/dashboard/components/DashboardScreen';
import { useDashboardData } from '@/hooks/useDashboardData';

export function DashboardScreen() {
  const { isPending, isFetching, data, caloriesRemaining, proteinRemaining, bodyweightTrend, logBodyweight } = useDashboardData();
  const loading = isPending || isFetching || !data;

  return (
    <AppPage>
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <DashboardCards
          data={data}
          caloriesRemaining={caloriesRemaining}
          proteinRemaining={proteinRemaining}
          bodyweightTrend={bodyweightTrend}
          onLogBodyweight={(value) => logBodyweight.mutate(value)}
          bodyweightSaving={logBodyweight.isPending}
        />
      )}
    </AppPage>
  );
}
