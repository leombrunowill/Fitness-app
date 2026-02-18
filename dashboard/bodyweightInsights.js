const cache = new Map();

export function initBodyweightInsights(logs, goalWeight) {
  const key = JSON.stringify((logs || []).map((x) => [x.date, x.weight]));
  if (cache.has(key)) return cache.get(key);

  const sorted = (logs || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  const current = sorted.length ? +sorted[sorted.length - 1].weight : 0;
  const last7 = sorted.slice(-7).map((x) => +x.weight);
  const prev7 = sorted.slice(-14, -7).map((x) => +x.weight);
  const avg7 = last7.length ? last7.reduce((a, b) => a + b, 0) / last7.length : current;
  const prevAvg = prev7.length ? prev7.reduce((a, b) => a + b, 0) / prev7.length : avg7;
  const weeklyChange = avg7 - prevAvg;

  const diff = Math.abs((goalWeight || current) - current);
  const weeks = Math.abs(weeklyChange) > 0.01 ? Math.ceil(diff / Math.abs(weeklyChange)) : null;

  const result = { current, avg7, weeklyChange, weeks };
  cache.set(key, result);
  return result;
}
