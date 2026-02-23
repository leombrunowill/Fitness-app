'use client';

import { AppPage } from '@/components/design-system';
import { DashboardScreen, DashboardSkeleton } from '@/features/dashboard/components/DashboardScreen';
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData';

export default function DashboardPage() {
  const { isLoading, data, caloriesRemaining, proteinRemaining, showPR } = useDashboardData();

  return (
    <AppPage>
      {isLoading || !data ? (
        <DashboardSkeleton />
      ) : (
        <DashboardScreen data={data} caloriesRemaining={caloriesRemaining} proteinRemaining={proteinRemaining} showPR={showPR} />
      )}
    </AppPage>
  );
}
