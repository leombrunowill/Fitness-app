'use client';

import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchDashboardData, logBodyweightEntry, type DashboardData } from '@/data/dashboard';
import { getBodyweightTrend, type BodyweightTrend } from '@/features/dashboard/utils/getBodyweightTrend';

export const DASHBOARD_QUERY_KEY = ['dashboard'] as const;

export function useDashboardData() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: fetchDashboardData,
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
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
    mutationFn: logBodyweightEntry,
    onMutate: async (value) => {
      await queryClient.cancelQueries({ queryKey: DASHBOARD_QUERY_KEY });
      const previous = queryClient.getQueryData<DashboardData>(DASHBOARD_QUERY_KEY);
      const optimistic = { value, loggedAt: new Date().toISOString() };

      queryClient.setQueryData<DashboardData>(DASHBOARD_QUERY_KEY, (current) => {
        if (!current) return current;
        return {
          ...current,
          todayBodyweight: optimistic,
          bodyweightLogs14d: [...current.bodyweightLogs14d, optimistic],
        };
      });

      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(DASHBOARD_QUERY_KEY, context.previous);
    },
    onSettled: invalidateDashboard,
  });

  return { ...query, ...selectors, logBodyweight };
}
