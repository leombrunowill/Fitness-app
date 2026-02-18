export function renderInsightCard(insights) {
  const items = (insights || []).slice(0, 3);
  return `
    <section class="card dash-card" aria-label="Today's Focus">
      <div class="dash-head">
        <h2 class="dash-title">🧠 Today's Focus</h2>
      </div>
      <ul class="insight-list">
        ${items.map((it) => `<li class="insight-item priority-${it.priority || 3}">${it.text}</li>`).join('') || '<li class="insight-item">Keep going — you are on track this week.</li>'}
      </ul>
    </section>
  `;
}
