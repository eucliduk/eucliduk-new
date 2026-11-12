const links = [...document.querySelectorAll('[data-region]')];
function highlight(region, active) {
  for (const link of links) if (link.dataset.region === region) link.classList.toggle('is-highlighted', active);
}
for (const link of links) {
  link.addEventListener('pointerenter', () => highlight(link.dataset.region, true));
  link.addEventListener('pointerleave', () => highlight(link.dataset.region, link.matches(':focus-visible')));
  link.addEventListener('focus', () => highlight(link.dataset.region, true));
  link.addEventListener('blur', () => highlight(link.dataset.region, false));
}
const fullscreen = document.getElementById('map-fullscreen');
const credits = document.querySelector('.map-credit');
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && credits.open) {
    credits.open = false;
    credits.querySelector('summary').focus();
    event.preventDefault();
  }
});
document.addEventListener('pointerdown', event => {
  if (credits.open && !credits.contains(event.target)) credits.open = false;
});
if (document.fullscreenEnabled) {
  fullscreen.hidden = false;
  fullscreen.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { /* Fullscreen can be declined by the browser; the map stays usable. */ }
  });
  document.addEventListener('fullscreenchange', () => fullscreen.setAttribute('aria-label', document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen'));
}
