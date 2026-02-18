const NS = 'http://www.w3.org/2000/svg';

export function createProgressRing({ label, value, max, tone = 'var(--bl)' }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const radius = 26;
  const circumference = 2 * Math.PI * radius;

  const wrap = document.createElement('div');
  wrap.className = 'ring-card';

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 64 64');
  svg.classList.add('ring-svg');

  const bg = document.createElementNS(NS, 'circle');
  bg.setAttribute('cx', '32'); bg.setAttribute('cy', '32'); bg.setAttribute('r', String(radius));
  bg.setAttribute('class', 'ring-bg');

  const fg = document.createElementNS(NS, 'circle');
  fg.setAttribute('cx', '32'); fg.setAttribute('cy', '32'); fg.setAttribute('r', String(radius));
  fg.setAttribute('class', 'ring-fg');
  fg.style.stroke = tone;
  fg.style.strokeDasharray = String(circumference);
  fg.style.strokeDashoffset = String(circumference);

  const txt = document.createElement('div');
  txt.className = 'ring-center';
  txt.innerHTML = `<strong>${Math.round(pct * 100)}%</strong><span>${value}/${max}</span>`;

  wrap.innerHTML = `<div class="ring-label">${label}</div>`;
  svg.append(bg, fg);
  wrap.append(svg, txt);

  requestAnimationFrame(() => {
    fg.style.strokeDashoffset = String(circumference * (1 - pct));
  });

  return wrap;
}
