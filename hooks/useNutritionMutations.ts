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
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: { foodName: string; mealType: any; calories: number; protein: number; carbs?: number; fat?: number }) =>
      logFoodEntry(userId as string, { ...payload, localDate }),
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: nutritionKeys.day(userId, localDate) });
      const prev = qc.getQueryData(nutritionKeys.day(userId, localDate));

      qc.setQueryData(nutritionKeys.day(userId, localDate), (current: any) => {
        if (!current) return current;
        const optimistic = {
          id: `optimistic-${Date.now()}`,
          user_id: userId,
          food_name: payload.foodName,
          calories: Number(payload.calories || 0),
          protein: Number(payload.protein || 0),
          carbs: Number(payload.carbs || 0),
          fat: Number(payload.fat || 0),
          meal_type: payload.mealType,
          local_date: localDate,
          created_at: new Date().toISOString(),
        };
        current.meals[payload.mealType] = [optimistic, ...current.meals[payload.mealType]];
        current.mealTotals[payload.mealType].calories += optimistic.calories;
        current.mealTotals[payload.mealType].protein += optimistic.protein;
        current.mealTotals[payload.mealType].carbs += optimistic.carbs;
        current.mealTotals[payload.mealType].fat += optimistic.fat;
        current.totals.calories += optimistic.calories;
        current.totals.protein += optimistic.protein;
        current.totals.carbs += optimistic.carbs;
        current.totals.fat += optimistic.fat;
        return { ...current };
      });

      return { prev };
    },
    onError: (_error, _payload, context) => {
      if (context?.prev) qc.setQueryData(nutritionKeys.day(userId, localDate), context.prev);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nutritionKeys.day(userId, localDate) });
      qc.invalidateQueries({ queryKey: nutritionKeys.recent(userId, localDate) });
    },
  });
}

export function useDeleteFood(localDate: string) {
  const { userId } = useSessionUser();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => deleteFoodEntry(userId as string, entryId),
    onMutate: async (entryId) => {
      await qc.cancelQueries({ queryKey: nutritionKeys.day(userId, localDate) });
      const prev = qc.getQueryData(nutritionKeys.day(userId, localDate));
      qc.setQueryData(nutritionKeys.day(userId, localDate), (current: any) => {
        if (!current) return current;
        for (const meal of ['breakfast', 'lunch', 'dinner', 'snack']) {
          const idx = current.meals[meal].findIndex((item: any) => item.id === entryId);
          if (idx >= 0) {
            const [removed] = current.meals[meal].splice(idx, 1);
            current.mealTotals[meal].calories -= removed.calories;
            current.mealTotals[meal].protein -= removed.protein;
            current.mealTotals[meal].carbs -= removed.carbs;
            current.mealTotals[meal].fat -= removed.fat;
            current.totals.calories -= removed.calories;
            current.totals.protein -= removed.protein;
            current.totals.carbs -= removed.carbs;
            current.totals.fat -= removed.fat;
            break;
          }
        }
        return { ...current };
      });
      return { prev };
    },
    onError: (_error, _payload, context) => {
      if (context?.prev) qc.setQueryData(nutritionKeys.day(userId, localDate), context.prev);
    },
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
