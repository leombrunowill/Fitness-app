'use client';

const KEY = 'nutrition_diagnostics_last_api';

export type NutritionDiagnosticsSnapshot = {
  payload: unknown;
  response: unknown;
  at: string;
};

export function saveNutritionDiagnostics(snapshot: NutritionDiagnosticsSnapshot) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(snapshot));
}

export function readNutritionDiagnostics(): NutritionDiagnosticsSnapshot | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as NutritionDiagnosticsSnapshot;
  } catch {
    return null;
  }
}
