'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { copyYesterday, deleteFoodEntry, getFavoriteFoods, getRecentFoods, logFoodEntry, saveFavoriteFood } from '@/data/nutrition';
import { useSessionUser } from '@/components/providers/AppProviders';
import { nutritionKeys } from '@/hooks/useNutritionDay';

export function useNutritionRecent(localDate: string) {
  const { userId } = useSessionUser();
  return {
    recentQueryKey: nutritionKeys.recent(userId, localDate),
    favoritesQueryKey: nutritionKeys.favorites(userId),
    recentQueryFn: () => getRecentFoods(userId as string, localDate),
    favoritesQueryFn: () => getFavoriteFoods(userId as string),
    enabled: Boolean(userId),
  };
}

export function useLogFood(localDate: string) {
  const { userId } = useSessionUser();
  return useMutation({
    mutationFn: (payload: { foodName: string; mealType: any; calories: number; protein: number; carbs?: number; fat?: number }) =>
      logFoodEntry(userId as string, { ...payload, localDate }),
  });
}

export function useDeleteFood(localDate: string) {
  const { userId } = useSessionUser();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => deleteFoodEntry(userId as string, entryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nutritionKeys.day(userId, localDate) });
    },
  });
}

export function useCopyYesterday(localDate: string) {
  const { userId } = useSessionUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => copyYesterday(userId as string, localDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nutritionKeys.day(userId, localDate) });
      qc.invalidateQueries({ queryKey: nutritionKeys.recent(userId, localDate) });
    },
  });
}

export function useSaveFavorite() {
  const { userId } = useSessionUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { foodName: string; calories: number; protein: number; carbs?: number; fat?: number; servingLabel?: string }) =>
      saveFavoriteFood(userId as string, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nutritionKeys.favorites(userId) });
    },
  });
}
