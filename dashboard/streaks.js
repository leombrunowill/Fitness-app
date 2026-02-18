function dayDiff(a, b) {
  return Math.round((new Date(a) - new Date(b)) / 86400000);
}

export function initStreaks(workoutDates, prsThisWeek, adherencePct) {
  const sorted = (workoutDates || []).slice().sort().reverse();
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0,0,0,0);

  for (let i = 0; i < sorted.length; i += 1) {
    const d = new Date(`${sorted[i]}T00:00:00`);
    const diff = dayDiff(cursor, d);
    if (diff === 0 || diff === 1) {
      streak += 1;
      cursor = d;
    } else break;
  }

  return { streak, prsThisWeek: prsThisWeek || 0, adherencePct: Math.max(0, Math.min(100, Math.round(adherencePct || 0))) };
}
