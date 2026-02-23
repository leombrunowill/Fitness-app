export type AdherenceDayInput = {
  date: string;
  completedWorkout?: boolean;
  bodyweightLogged?: boolean;
  calorieTargetReached?: boolean;
};

export function getLocalDateKey(input: string, locale: string) {
  return new Intl.DateTimeFormat(locale || undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(new Date(input));
}

export function getAdherenceDays(entries: AdherenceDayInput[], locale: string) {
  const keyed = new Map<string, boolean>();

  entries.forEach((entry) => {
    const key = getLocalDateKey(entry.date, locale);
    const adherent = Boolean(entry.completedWorkout || entry.bodyweightLogged || entry.calorieTargetReached);
    if (!adherent) {
      if (!keyed.has(key)) keyed.set(key, false);
      return;
    }
    keyed.set(key, true);
  });

  const days = Array.from(keyed.entries())
    .map(([date, adherent]) => ({ date, adherent }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  return days;
}

export function getStreakStats(entries: AdherenceDayInput[], locale: string) {
  const days = getAdherenceDays(entries, locale);

  if (!days.length) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let longest = 0;
  let running = 0;

  days.forEach((day) => {
    if (day.adherent) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  });

  let current = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    if (!days[i].adherent) break;
    current += 1;
  }

  return {
    currentStreak: current,
    longestStreak: longest,
  };
}
