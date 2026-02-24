'use client';

import { getSupabaseBrowserClient } from '@/supabase/browserClient';
import { saveNutritionDiagnostics } from '@/data/nutritionDiagnostics';
import { getLocalYYYYMMDD } from '@/utils/date';

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export type NutritionEntry = {
  id: string;
  user_id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal_type: MealType;
  local_date: string;
  created_at: string;
};

export type FavoriteFood = {
  id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_label: string | null;
};

export type NutritionDay = {
  date: string;
  meals: Record<MealType, NutritionEntry[]>;
  mealTotals: Record<MealType, { calories: number; protein: number; carbs: number; fat: number }>;
  totals: { calories: number; protein: number; carbs: number; fat: number };
  target: { calories: number; protein: number };
};

export type LogFoodPayload = {
  foodName: string;
  mealType: MealType;
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
  localDate: string;
};

export type LogNutritionEntryInput = {
  food_name: string;
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
  meal_type?: MealType | null;
};

function assertUserId(userId: string | null | undefined) {
  if (!userId) throw new Error('You must be signed in to save nutrition logs.');
}

function normalizeNutritionRow(row: any): NutritionEntry {
  return {
    id: row.id,
    user_id: row.user_id,
    food_name: row.food_name,
    calories: Number(row.calories || 0),
    protein: Number(row.protein || 0),
    carbs: Number(row.carbs || 0),
    fat: Number(row.fat || 0),
    meal_type: (row.meal_type || 'snack') as MealType,
    local_date: row.local_date,
    created_at: row.created_at,
  };
}

function emptyDay(localDate: string): NutritionDay {
  const meals = { breakfast: [], lunch: [], dinner: [], snack: [] } as Record<MealType, NutritionEntry[]>;
  const mealTotals = {
    breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    lunch: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    dinner: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    snack: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  };
  return {
    date: localDate,
    meals,
    mealTotals,
    totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    target: { calories: 2200, protein: 180 },
  };
}

async function getAccessToken() {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

export async function getNutritionDay(userId: string, localDate: string): Promise<NutritionDay> {
  assertUserId(userId);
  const supabase = getSupabaseBrowserClient();

  const [logsRes, goalsRes] = await Promise.all([
    supabase
      .from('nutrition_logs')
      .select('id,user_id,food_name,calories,protein,carbs,fat,meal_type,local_date,created_at')
      .eq('user_id', userId)
      .eq('local_date', localDate)
      .order('created_at', { ascending: true }),
    supabase.from('user_goals').select('daily_calorie_target,daily_protein_target').eq('user_id', userId).maybeSingle(),
  ]);

  if (logsRes.error) throw logsRes.error;
  if (goalsRes.error) throw goalsRes.error;

  const day = emptyDay(localDate);
  day.target = {
    calories: Number(goalsRes.data?.daily_calorie_target || 2200),
    protein: Number(goalsRes.data?.daily_protein_target || 180),
  };

  for (const row of logsRes.data || []) {
    const entry = normalizeNutritionRow(row);
    const mealType = MEAL_TYPES.includes(entry.meal_type) ? entry.meal_type : 'snack';
    day.meals[mealType].push(entry);
    day.mealTotals[mealType].calories += entry.calories;
    day.mealTotals[mealType].protein += entry.protein;
    day.mealTotals[mealType].carbs += entry.carbs;
    day.mealTotals[mealType].fat += entry.fat;

    day.totals.calories += entry.calories;
    day.totals.protein += entry.protein;
    day.totals.carbs += entry.carbs;
    day.totals.fat += entry.fat;
  }

  return day;
}

export async function logFoodEntry(userId: string, payload: LogFoodPayload): Promise<NutritionEntry> {
  assertUserId(userId);
const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

 if (!user) {
    throw new Error('Not signed in');
  }

  const insertPayload = {
    user_id: user.id,
  food_name: payload.foodName,
  calories: Number(payload.calories || 0),
    protein: Number(payload.protein || 0),
    carbs: Number(payload.carbs || 0),
    fat: Number(payload.fat || 0),
    meal_type: payload.mealType ?? null,
    local_date: payload.localDate,
  };

    console.log('[nutrition] add clicked', insertPayload);

 const { data, error } = await supabase.from('nutrition_logs').insert(insertPayload).select().single();

  console.log('[nutrition] insert result', { data, error });

  saveNutritionDiagnostics({ payload: insertPayload, response: { data, error }, at: new Date().toISOString() });
  
  if (error) {
    const details = typeof error.details === 'string' && error.details ? ` ${error.details}` : '';
    throw new Error(`${error.message}${details}`.trim());
  }

  return normalizeNutritionRow(data);
}

export async function deleteFoodEntry(userId: string, entryId: string): Promise<void> {
  assertUserId(userId);
  const token = await getAccessToken();
  if (!token) throw new Error('Missing session token. Please sign in again.');

  const response = await fetch(`/api/nutrition/log?id=${encodeURIComponent(entryId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const body = await response.json();
  saveNutritionDiagnostics({ payload: { id: entryId }, response: body, at: new Date().toISOString() });
  if (!response.ok) throw new Error(body.error || 'Unable to delete nutrition log.');
}

export async function copyYesterday(userId: string, localDate: string): Promise<number> {
  assertUserId(userId);
  const supabase = getSupabaseBrowserClient();

  const yesterday = new Date(`${localDate}T12:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDate = yesterday.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('nutrition_logs')
    .select('food_name,calories,protein,carbs,fat,meal_type')
    .eq('user_id', userId)
    .eq('local_date', yesterdayDate);

  if (error) throw error;
  if (!data?.length) return 0;

  const inserts = data.map((row) => ({
    user_id: userId,
    food_name: row.food_name,
    calories: Number(row.calories || 0),
    protein: Number(row.protein || 0),
    carbs: Number(row.carbs || 0),
    fat: Number(row.fat || 0),
    meal_type: row.meal_type,
    local_date: localDate,
  }));

  const { error: insertError } = await supabase.from('nutrition_logs').insert(inserts);
  if (insertError) throw insertError;
  return inserts.length;
}

export async function getRecentFoods(userId: string, localDate: string): Promise<FavoriteFood[]> {
  assertUserId(userId);
  const supabase = getSupabaseBrowserClient();
  const from = new Date(`${localDate}T12:00:00`);
  from.setDate(from.getDate() - 14);
  const fromDate = from.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('nutrition_logs')
    .select('id,food_name,calories,protein,carbs,fat,created_at')
    .eq('user_id', userId)
    .gte('local_date', fromDate)
    .order('created_at', { ascending: false })
    .limit(60);

  if (error) throw error;

  const seen = new Set<string>();
  return (data || [])
    .filter((row) => {
      const key = row.food_name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((row) => ({
      id: row.id,
      food_name: row.food_name,
      calories: Number(row.calories || 0),
      protein: Number(row.protein || 0),
      carbs: Number(row.carbs || 0),
      fat: Number(row.fat || 0),
      serving_label: 'Last used',
    }));
}

export async function getFavoriteFoods(userId: string): Promise<FavoriteFood[]> {
  assertUserId(userId);
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('favorite_foods')
    .select('id,food_name,calories,protein,carbs,fat,serving_label')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    food_name: row.food_name,
    calories: Number(row.calories || 0),
    protein: Number(row.protein || 0),
    carbs: Number(row.carbs || 0),
    fat: Number(row.fat || 0),
    serving_label: row.serving_label,
  }));
}

export async function saveFavoriteFood(userId: string, payload: Omit<LogFoodPayload, 'mealType' | 'localDate'> & { servingLabel?: string }) {
  assertUserId(userId);
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from('favorite_foods').upsert(
    {
      user_id: userId,
      food_name: payload.foodName,
      calories: payload.calories,
      protein: payload.protein,
      carbs: payload.carbs || 0,
      fat: payload.fat || 0,
      serving_label: payload.servingLabel || null,
    },
    { onConflict: 'user_id,food_name' },
  );
  if (error) throw error;
}


export async function logNutritionEntry(input: LogNutritionEntryInput): Promise<NutritionEntry> {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  assertUserId(userId);

  const localDate = getLocalYYYYMMDD();
  return logFoodEntry(userId, {
    foodName: input.food_name,
    calories: Number(input.calories || 0),
    protein: Number(input.protein || 0),
    carbs: Number(input.carbs || 0),
    fat: Number(input.fat || 0),
    mealType: (input.meal_type as MealType) || 'snack',
    localDate,
  });
}
