'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSessionUser } from '@/components/providers/AppProviders';
import { useToast } from '@/components/providers/ToastProvider';
import { FavoriteFood, MEAL_TYPES, MealType } from '@/data/nutrition';
import { nutritionKeys, useNutritionDay } from '@/hooks/useNutritionDay';
import { useCopyYesterday, useDeleteFood, useLogFood, useNutritionRecent, useSaveFavorite } from '@/hooks/useNutritionMutations';

const FOOD_LIBRARY: FavoriteFood[] = [
  { id: '1', food_name: 'Chicken Breast (100g)', calories: 165, protein: 31, carbs: 0, fat: 4, serving_label: '100g' },
  { id: '2', food_name: 'White Rice (1 cup)', calories: 205, protein: 4, carbs: 45, fat: 0, serving_label: '1 cup cooked' },
  { id: '3', food_name: 'Eggs (2 large)', calories: 140, protein: 12, carbs: 1, fat: 10, serving_label: '2 eggs' },
  { id: '4', food_name: 'Greek Yogurt (170g)', calories: 100, protein: 17, carbs: 6, fat: 0, serving_label: 'single cup' },
  { id: '5', food_name: 'Salmon (150g)', calories: 280, protein: 30, carbs: 0, fat: 17, serving_label: '150g' },
  { id: '6', food_name: 'Whey Protein (1 scoop)', calories: 120, protein: 24, carbs: 3, fat: 2, serving_label: '1 scoop' },
];

function todayLocalDate() {
  const now = new Date();
  const tzOffsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

function macroFmt(value: number) {
  return Math.round(value);
}

export function NutritionScreen() {
  const localDate = todayLocalDate();
  const { userId, loading } = useSessionUser();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [openMeal, setOpenMeal] = useState<MealType>('breakfast');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data, isPending, isError, error } = useNutritionDay(localDate);
  const logMutation = useLogFood(localDate);
  const deleteMutation = useDeleteFood(localDate);
  const copyMutation = useCopyYesterday(localDate);
  const saveFavoriteMutation = useSaveFavorite();

  const recentCtx = useNutritionRecent(localDate);
  const recentQuery = useQuery({ queryKey: recentCtx.recentQueryKey, queryFn: recentCtx.recentQueryFn, enabled: recentCtx.enabled });
  const favoritesQuery = useQuery({ queryKey: recentCtx.favoritesQueryKey, queryFn: recentCtx.favoritesQueryFn, enabled: recentCtx.enabled });

  const remaining = useMemo(() => {
    if (!data) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return {
      calories: Math.max(0, data.target.calories - data.totals.calories),
      protein: Math.max(0, data.target.protein - data.totals.protein),
      carbs: Math.max(0, 250 - data.totals.carbs),
      fat: Math.max(0, 70 - data.totals.fat),
    };
  }, [data]);

  if (loading) return <NutritionSkeleton />;
  if (!userId) return <div className="p-4 text-sm text-amber-300">Sign in to use Nutrition logging.</div>;
  if (isPending) return <NutritionSkeleton />;
  if (isError || !data) return <div className="p-4 text-sm text-red-300">Unable to load nutrition: {(error as Error)?.message}</div>;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 pb-24 text-slate-100">
      <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/20">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Today</p>
            <h1 className="text-2xl font-semibold">Nutrition</h1>
          </div>
          <p className="text-xs text-slate-400">{localDate}</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <SummaryStat label="Calories" value={`${macroFmt(data.totals.calories)} / ${data.target.calories}`} />
          <SummaryStat label="Protein" value={`${macroFmt(data.totals.protein)}g / ${data.target.protein}g`} />
        </div>
        <Progress label="Calories" value={data.totals.calories} target={data.target.calories} />
        <Progress label="Protein" value={data.totals.protein} target={data.target.protein} />

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-800/70 p-3 text-sm">
          <p>Remaining Calories</p><p className="text-right font-semibold">{macroFmt(remaining.calories)}</p>
          <p>Remaining Protein</p><p className="text-right font-semibold">{macroFmt(remaining.protein)}g</p>
          <p>Remaining Carbs</p><p className="text-right font-semibold">{macroFmt(remaining.carbs)}g</p>
          <p>Remaining Fat</p><p className="text-right font-semibold">{macroFmt(remaining.fat)}g</p>
        </div>

        <button
          className="mt-4 w-full rounded-xl bg-slate-700 px-4 py-3 text-sm font-semibold disabled:opacity-50"
          disabled={copyMutation.isPending}
          onClick={() => copyMutation.mutate(undefined, {
            onSuccess: (count) => pushToast(count ? `Copied ${count} items ✓` : 'No items from yesterday', 'success'),
            onError: (err) => pushToast((err as Error).message, 'error'),
          })}
        >
          {copyMutation.isPending ? 'Copying…' : 'Copy Yesterday'}
        </button>
      </section>

      {MEAL_TYPES.map((meal) => (
        <section key={meal} className="rounded-2xl border border-white/10 bg-slate-900/65 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold capitalize">{meal}</h2>
              <p className="text-xs text-slate-400">{macroFmt(data.mealTotals[meal].calories)} kcal • {macroFmt(data.mealTotals[meal].protein)}p • {macroFmt(data.mealTotals[meal].carbs)}c • {macroFmt(data.mealTotals[meal].fat)}f</p>
            </div>
            <button className="rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium" onClick={() => { setOpenMeal(meal); setSheetOpen(true); }}>Add</button>
          </div>

          {data.meals[meal].length ? (
            <ul className="space-y-2">
              {data.meals[meal].map((item) => (
                <motion.li
                  key={item.id}
                  drag="x"
                  dragConstraints={{ left: -120, right: 0 }}
                  dragElastic={0.15}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -90) {
                      deleteMutation.mutate(item.id, {
                        onSuccess: () => pushToast('Deleted', 'success'),
                        onError: (err) => pushToast((err as Error).message, 'error'),
                      });
                    }
                  }}
                  className="flex items-center justify-between rounded-xl bg-slate-800/80 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.food_name}</p>
                    <p className="text-xs text-slate-400">{macroFmt(item.calories)} kcal • {macroFmt(item.protein)}p</p>
                  </div>
                  <button className="rounded-md bg-slate-700 px-2 py-1 text-xs" onClick={() => deleteMutation.mutate(item.id)}>Delete</button>
                </motion.li>
              ))}
            </ul>
          ) : <p className="rounded-xl border border-dashed border-slate-700 p-3 text-sm text-slate-400">No items yet. Tap Add to log your first food.</p>}
        </section>
      ))}

      <AnimatePresence>
        {sheetOpen ? (
          <FoodSheet
            mealType={openMeal}
            recents={recentQuery.data || []}
            favorites={favoritesQuery.data || []}
            onClose={() => setSheetOpen(false)}
            isSaving={isSaving}
            onAdd={async (payload) => {
              try {
                setIsSaving(true);
                await logMutation.mutateAsync({ ...payload, mealType: openMeal });
                pushToast('Saved ✓', 'success');
                await queryClient.invalidateQueries({ queryKey: nutritionKeys.day(userId, localDate) });
                await queryClient.invalidateQueries({ queryKey: nutritionKeys.recent(userId, localDate) });
                setSheetOpen(false);
              } catch (e) {
                pushToast(`Save failed: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error');
              } finally {
                setIsSaving(false);
              }
            }}
            onFavorite={(payload) =>
              saveFavoriteMutation.mutate(payload, {
                onSuccess: () => pushToast('Added to favorites', 'success'),
                onError: (err) => pushToast((err as Error).message, 'error'),
              })
            }
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function NutritionSkeleton() { return <div className="space-y-3 p-4"><div className="h-44 animate-pulse rounded-2xl bg-slate-800" /><div className="h-24 animate-pulse rounded-2xl bg-slate-800" /><div className="h-24 animate-pulse rounded-2xl bg-slate-800" /></div>; }
function SummaryStat({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-800 p-3"><p className="text-xs uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>; }

function Progress({ label, value, target }: { label: string; value: number; target: number }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return <div className="mt-3"><div className="mb-1 flex justify-between text-xs text-slate-300"><span>{label}</span><span>{pct}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${pct}%` }} /></div></div>;
}

function FoodSheet({ onClose, onAdd, onFavorite, recents, favorites, mealType, isSaving }: {
  onClose: () => void;
  onAdd: (payload: { foodName: string; calories: number; protein: number; carbs?: number; fat?: number }) => Promise<void>;
  onFavorite: (payload: { foodName: string; calories: number; protein: number; carbs?: number; fat?: number; servingLabel?: string }) => void;
  recents: FavoriteFood[];
  favorites: FavoriteFood[];
  mealType: MealType;
  isSaving: boolean;
}) {
  const [tab, setTab] = useState<'recent' | 'favorites' | 'search'>('recent');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selected, setSelected] = useState<FavoriteFood | null>(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(id);
  }, [query]);

  const searchResults = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return FOOD_LIBRARY;
    return FOOD_LIBRARY.filter((row) => row.food_name.toLowerCase().includes(q));
  }, [debouncedQuery]);

  const list = tab === 'recent' ? recents : tab === 'favorites' ? favorites : searchResults;

  return (
    <>
      <motion.div className="fixed inset-0 z-40 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 260 }} className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl border border-white/10 bg-slate-950 p-4">
        <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-slate-700" />
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Add to {mealType}</p>
        <input className="mt-3 w-full rounded-xl bg-slate-800 px-4 py-3 text-base" placeholder="Search foods" value={query} onChange={(e) => setQuery(e.target.value)} />

        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
          {[['recent', 'Recent'], ['favorites', 'Favorites'], ['search', 'Search']].map(([key, label]) => (
            <button key={key} className={`rounded-lg px-3 py-2 ${tab === key ? 'bg-indigo-500' : 'bg-slate-800'}`} onClick={() => setTab(key as any)}>{label}</button>
          ))}
        </div>

        <div className="mt-3 space-y-2">
          {list.length ? list.map((food) => (
            <button key={food.id + food.food_name} className="flex w-full items-center justify-between rounded-xl bg-slate-800 px-3 py-3 text-left" onClick={() => setSelected(food)}>
              <div><p className="text-sm font-medium">{food.food_name}</p><p className="text-xs text-slate-400">{macroFmt(food.calories)} kcal • {macroFmt(food.protein)}p</p></div>
              <span className="text-xs text-slate-300">Select</span>
            </button>
          )) : <p className="rounded-xl border border-dashed border-slate-700 p-3 text-sm text-slate-400">No foods found.</p>}
        </div>

        {selected ? (
          <div className="mt-4 rounded-xl bg-slate-800 p-3">
            <p className="text-sm font-semibold">{selected.food_name}</p>
            <div className="mt-2 flex items-center gap-3">
              <label className="text-sm">Qty</label>
              <input type="number" min={0.5} step={0.5} value={qty} onChange={(e) => setQty(Number(e.target.value || 1))} className="w-20 rounded-lg bg-slate-700 px-3 py-2" />
              <button className="ml-auto rounded-lg bg-slate-700 px-3 py-2 text-sm" onClick={() => onFavorite({ foodName: selected.food_name, calories: selected.calories, protein: selected.protein, carbs: selected.carbs, fat: selected.fat, servingLabel: selected.serving_label || undefined })}>☆ Favorite</button>
            </div>
            <button className="mt-3 w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold disabled:opacity-60" disabled={isSaving} onClick={() => onAdd({ foodName: selected.food_name, calories: selected.calories * qty, protein: selected.protein * qty, carbs: selected.carbs * qty, fat: selected.fat * qty })}>
              {isSaving ? 'Saving…' : 'Add'}
            </button>
          </div>
        ) : null}
      </motion.div>
    </>
  );
}
