import { createProgressRing } from '../components/ProgressRing.js';

export function initProgressRings(mount, data) {
  if (!mount) return;
  mount.innerHTML = '<section class="card dash-card"><h2 class="dash-title">Daily Progress</h2><div id="ring-grid" class="ring-grid"></div></section>';
  const grid = mount.querySelector('#ring-grid');

  const rings = [
    createProgressRing({ label: 'Workouts', value: data.weekly.workoutsDone, max: data.weekly.workoutsPlanned || 1, tone: 'var(--gn)' }),
    createProgressRing({ label: 'Sets vs target', value: data.weekly.setsDone, max: data.weekly.setsTarget || 1, tone: 'var(--bl)' }),
    createProgressRing({ label: 'Calories', value: data.weekly.calories, max: data.weekly.calTarget || 1, tone: 'var(--pk)' })
  ];

  const frag = document.createDocumentFragment();
  rings.forEach((r) => frag.appendChild(r));
  grid.appendChild(frag);
}
