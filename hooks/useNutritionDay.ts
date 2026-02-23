'use client';

import { useQuery } from '@tanstack/react-query';
import { getNutritionDay } from '@/data/nutrition';
import { useSessionUser } from '@/components/providers/AppProviders';

export const nutritionKeys = {
  day: (userId: string | null, localDate: string) => ['nutrition', 'day', userId, localDate] as const,
  recent: (userId: string | null, localDate: string) => ['nutrition', 'recent', userId, localDate] as const,
  favorites: (userId: string | null) => ['nutrition', 'favorites', userId] as const,
};

export function useNutritionDay(localDate: string) {
  const { userId } = useSessionUser();
  return useQuery({
    queryKey: nutritionKeys.day(userId, localDate),
    queryFn: () => getNutritionDay(userId as string, localDate),
    enabled: Boolean(userId),
  });
}
