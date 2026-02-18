export function initTodayFocus(data) {
  const insights = [];
  const muscleVolumes = data.muscleVolumes || {};
  const targets = data.targets || {};

  Object.keys(targets).forEach((muscle) => {
    const cur = muscleVolumes[muscle] || 0;
    const tgt = targets[muscle] || 0;
    if (!tgt) return;
    if (cur < tgt * 0.75) insights.push({ priority: 1, text: `${muscle} volume below target — add ${Math.max(1, Math.ceil((tgt - cur) / 2))} sets this week.` });
    else if (cur > tgt * 1.2) insights.push({ priority: 1, text: `You are above MRV for ${muscle.toLowerCase()} — consider a deload.` });
  });

  (data.exerciseProgress || []).forEach((row) => {
    if (row.prReady) insights.push({ priority: 2, text: `PR ready on ${row.exercise}.` });
  });

  return insights.sort((a, b) => a.priority - b.priority).slice(0, 3);
}
