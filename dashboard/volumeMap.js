export function initVolumeMap(mount, muscleVolumes, targets) {
  if (!mount) return;
  const muscles = Object.keys(targets || {});
  mount.innerHTML = `
    <section class="card dash-card">
      <button class="collapse-btn" id="volume-toggle" aria-expanded="false">Recovery / Volume Dashboard</button>
      <div id="volume-body" class="volume-body" hidden></div>
    </section>
  `;

  const body = mount.querySelector('#volume-body');
  body.innerHTML = muscles.map((muscle) => {
    const sets = muscleVolumes[muscle] || 0;
    const target = targets[muscle] || 0;
    const pct = target ? Math.min(100, Math.round((sets / target) * 100)) : 0;
    const tone = sets < target * 0.7 ? 'blue' : sets > target * 1.15 ? 'red' : 'green';
    return `<div class="vm-row ${tone}"><span>${muscle}</span><div class="vm-bar"><span style="width:${pct}%"></span></div><strong>${sets} / ${target}${sets > target ? ' ⚠' : ''}</strong></div>`;
  }).join('');

  mount.querySelector('#volume-toggle').addEventListener('click', (e) => {
    const expanded = e.currentTarget.getAttribute('aria-expanded') === 'true';
    e.currentTarget.setAttribute('aria-expanded', String(!expanded));
    body.hidden = expanded;
  });
}
