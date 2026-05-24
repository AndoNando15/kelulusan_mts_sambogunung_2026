// countdown.js
// Countdown timer: triggers 5 seconds after page load
document.addEventListener('DOMContentLoaded', () => {
  const target = Date.now() + 5 * 1000; // 5 seconds from now
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');

  const interval = setInterval(() => {
    const now = Date.now();
    const diff = target - now;
    if (diff <= 0) {
      clearInterval(interval);
      // hide countdown, show search
      const countdownSection = document.getElementById('countdown-section');
      const searchSection = document.getElementById('search-section');
      if (countdownSection) countdownSection.classList.add('hidden');
      if (searchSection) searchSection.classList.remove('hidden');
      return;
    }
    const totalSeconds = Math.floor(diff / 1000);
    const d = Math.floor(totalSeconds / (24 * 3600));
    const h = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (daysEl) daysEl.textContent = String(d).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(h).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(m).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(s).padStart(2, '0');
  }, 1000);
});
