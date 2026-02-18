let timerId = null;

export function initRestTimer() {
  let mount = document.getElementById('rest-timer-float');
  if (mount) return;
  mount = document.createElement('aside');
  mount.id = 'rest-timer-float';
  mount.className = 'rest-float';
  mount.innerHTML = '<div class="rest-ring"></div><div class="rest-copy"><strong>Rest</strong><span id="rest-msg">Ready to match last set</span><span id="rest-time">0s</span></div>';
  document.body.appendChild(mount);
}

export function startRestTimer(mode) {
  initRestTimer();
  const mount = document.getElementById('rest-timer-float');
  const timeEl = document.getElementById('rest-time');
  const duration = mode === 'strength' ? 150 : 75;
  let left = duration;
  mount.classList.add('on');

  clearInterval(timerId);
  timerId = setInterval(() => {
    left -= 1;
    if (timeEl) timeEl.textContent = `${left}s`;
    mount.style.setProperty('--rest-progress', `${(left / duration) * 100}%`);
    if (left <= 0) {
      clearInterval(timerId);
      mount.classList.remove('on');
    }
  }, 1000);

  if (timeEl) timeEl.textContent = `${left}s`;
}
