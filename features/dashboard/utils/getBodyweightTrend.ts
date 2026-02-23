export type BodyweightTrend = 'up' | 'down' | 'flat' | 'insufficient_data';

export type BodyweightEntry = {
  loggedAt: string;
  value: number;
};

const MS_IN_DAY = 24 * 60 * 60 * 1000;

export function getBodyweightTrend(entries: BodyweightEntry[]): BodyweightTrend {
  const cutoff = Date.now() - 14 * MS_IN_DAY;
  const recent = entries
    .filter((entry) => new Date(entry.loggedAt).getTime() >= cutoff)
    .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime());

  if (recent.length < 3) return 'insufficient_data';

  const delta = recent[recent.length - 1].value - recent[0].value;
  if (Math.abs(delta) < 0.15) return 'flat';

  return delta > 0 ? 'up' : 'down';
}
