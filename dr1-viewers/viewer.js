(() => {
  const root = document.documentElement;
  const status = document.getElementById('status');
  const stage = document.getElementById('viewer');
  const explorer = document.getElementById('explorer');
  const themeButton = document.getElementById('theme');
  const fullscreenButton = document.getElementById('fullscreen');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const stored = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  root.dataset.theme = stored('euclid-theme') || 'dark';
  const contrast = new URL(location.href).searchParams.get('contrast');
  root.dataset.contrast = contrast === 'high' || contrast === 'standard' ? contrast : stored('euclid-contrast-choice') || 'standard';
  save('euclid-contrast-choice', root.dataset.contrast);
  function updateTheme() {
    const dark = root.dataset.theme === 'dark';
    themeButton.textContent = dark ? 'Light theme' : 'Dark theme';
    themeButton.setAttribute('aria-pressed', String(!dark));
  }
  updateTheme();
  themeButton.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    save('euclid-theme', root.dataset.theme);
    updateTheme();
  });
  if (!window.OpenSeadragon) {
    status.textContent = 'The local zoom library could not load. The overview image is still available.';
    document.querySelectorAll('#zoom-in, #zoom-out, #home, [data-pan]').forEach(button => { button.disabled = true; });
    return;
  }
  const viewer = OpenSeadragon({
    id: 'viewer', tileSources: 'north-west.dzi', showNavigationControl: false,
    showNavigator: true, navigatorId: 'navigator', navigatorAutoFade: false,
    navigatorDisplayRegionColor: '#ffe060', navigatorBackground: '#000',
    animationTime: motion.matches ? 0 : .55, blendTime: motion.matches ? 0 : .15,
    maxZoomPixelRatio: 2, visibilityRatio: 1, constrainDuringPan: true,
    gestureSettingsMouse: { scrollToZoom: true, clickToZoom: false, dblClickToZoom: true },
    gestureSettingsTouch: { pinchToZoom: true, clickToZoom: false },
    zoomPerScroll: 1.2,
  });
  viewer.addHandler('canvas-key', event => { event.preventDefaultAction = true; });
  viewer.addHandler('canvas-scroll', event => {
    if (event.originalEvent.ctrlKey || event.originalEvent.metaKey) {
      event.preventDefaultAction = true;
      event.preventDefault = false;
    }
  });
  viewer.canvas.tabIndex = -1;
  let ready = false;
  const instant = () => motion.matches;
  function zoom(factor) {
    if (!ready) return;
    viewer.viewport.zoomBy(factor, null, instant());
    viewer.viewport.applyConstraints(instant());
  }
  function pan(direction) {
    if (!ready) return;
    const bounds = viewer.viewport.getBounds();
    const offsets = { left: [-bounds.width * .18, 0], right: [bounds.width * .18, 0], up: [0, -bounds.height * .18], down: [0, bounds.height * .18] };
    viewer.viewport.panBy(new OpenSeadragon.Point(...offsets[direction]), instant());
    viewer.viewport.applyConstraints(instant());
  }
  const home = () => { if (ready) viewer.viewport.goHome(instant()); };
  document.getElementById('zoom-in').addEventListener('click', () => zoom(1.5));
  document.getElementById('zoom-out').addEventListener('click', () => zoom(1 / 1.5));
  document.getElementById('home').addEventListener('click', home);
  document.querySelectorAll('[data-pan]').forEach(button => button.addEventListener('click', () => pan(button.dataset.pan)));
  stage.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const directions = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    if (directions[event.key]) pan(directions[event.key]);
    else if (['+', '='].includes(event.key)) zoom(1.5);
    else if (event.key === '-') zoom(1 / 1.5);
    else if (event.key === '0' || event.key === 'Home') home();
    else return;
    event.preventDefault();
  });
  viewer.addHandler('open', () => {
    ready = true;
    stage.querySelector('.fallback')?.remove();
    status.textContent = 'Ready. All image tiles load from this computer only.';
  });
  viewer.addHandler('open-failed', () => { status.textContent = 'The image could not load. Start the supplied local server and reload this page.'; });
  viewer.addHandler('tile-load-failed', () => { status.textContent = 'An image tile could not load. Reset the view or reload the local preview.'; });
  viewer.addHandler('animation-finish', () => {
    if (ready) document.getElementById('zoom-level').textContent = `${(viewer.viewport.getZoom() / viewer.viewport.getHomeZoom()).toFixed(1)}× full view`;
  });
  motion.addEventListener('change', () => {
    viewer.animationTime = motion.matches ? 0 : .55;
    viewer.blendTime = motion.matches ? 0 : .15;
    if (viewer.viewport) {
      ['centerSpringX', 'centerSpringY', 'zoomSpring', 'degreesSpring'].forEach(name => {
        if (viewer.viewport[name]) viewer.viewport[name].animationTime = viewer.animationTime;
      });
    }
    if (ready && motion.matches) viewer.viewport.panTo(viewer.viewport.getCenter(), true);
  });
  if (!document.fullscreenEnabled) fullscreenButton.hidden = true;
  fullscreenButton.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await explorer.requestFullscreen();
    } catch { status.textContent = 'Fullscreen is not available in this browser.'; }
  });
  document.addEventListener('fullscreenchange', () => {
    const active = !!document.fullscreenElement;
    fullscreenButton.textContent = active ? 'Exit fullscreen' : 'Fullscreen';
    fullscreenButton.setAttribute('aria-pressed', String(active));
    if (!active) fullscreenButton.focus();
  });
})();
