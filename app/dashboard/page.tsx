'use client';

import { AppPage } from '@/components/design-system';
import { DashboardScreen, DashboardSkeleton } from '@/features/dashboard/components/DashboardScreen';
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData';

export default function DashboardPage() {
  const { isPending, isFetching, data, caloriesRemaining, proteinRemaining, bodyweightTrend, logBodyweight } = useDashboardData();

  const loading = isPending || isFetching || !data;

  return (
    <AppPage>
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <DashboardScreen
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
