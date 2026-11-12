const root = document.documentElement;
const contrastChoice = new URL(location.href).searchParams.get('contrast');
try {
  root.dataset.contrast = ['standard', 'high'].includes(contrastChoice) ? contrastChoice : localStorage.getItem('euclid-contrast-choice') || 'standard';
  localStorage.setItem('euclid-contrast-choice', root.dataset.contrast);
} catch {
  root.dataset.contrast = ['standard', 'high'].includes(contrastChoice) ? contrastChoice : 'standard';
}
const stage = document.getElementById('comparison-stage');
const fallback = document.getElementById('comparison-fallback');
const spectraLayer = document.getElementById('spectra-clip');
const skyLabel = document.getElementById('sky-label');
const spectraLabel = document.getElementById('spectra-label');
const status = document.getElementById('load-status');
const detail = document.getElementById('detail-state');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let comparisonReady = false;
let loadingFailed = false;
let requestedView = reducedMotion.matches ? 'sky' : 'animate';
let transitionAnimations = [];
let comparisonAnimating = false;
stage.hidden = false;
fallback.hidden = true;
detail.textContent = 'Loading local image tiles…';

const options = {
  showNavigationControl: false, showNavigator: false,
  animationTime: reducedMotion.matches ? 0 : .5, blendTime: 0,
  minPixelRatio: .5, maxZoomPixelRatio: 1, minZoomImageRatio: 1,
  visibilityRatio: .8, constrainDuringPan: true, imageLoaderLimit: 6,
  gestureSettingsMouse: { scrollToZoom: true, clickToZoom: false, dblClickToZoom: false },
  gestureSettingsTouch: { dragToPan: true, scrollToZoom: false, pinchToZoom: true, zoomToRefPoint: true, pinchRotate: false, clickToZoom: false, dblClickToZoom: false, dblClickDragToZoom: false, flickEnabled: true },
};
const skyViewer = OpenSeadragon({ ...options, id: 'sky-viewer', tileSources: 'spectroscopy-sky.dzi' });
const spectraViewer = OpenSeadragon({ ...options, id: 'spectra-viewer', tileSources: 'spectroscopy-spectra.dzi', mouseNavEnabled: false });
for (const viewer of [skyViewer, spectraViewer]) {
  viewer.canvas.tabIndex = -1;
  viewer.addHandler('canvas-key', event => { event.preventDefaultAction = true; });
  viewer.addHandler('open-failed', showFailure);
  viewer.addHandler('tile-load-failed', () => {
    detail.textContent = 'An image tile could not load. Reload this local page to retry.';
    status.textContent = 'An image tile could not load.';
  });
  viewer.addHandler('open', () => {
    viewer.world.getItemAt(0).source.hasTransparency = () => false;
    viewer.world.getItemAt(0).addHandler('fully-loaded-change', updateDetail);
    initialiseComparison();
  });
}
skyViewer.addHandler('canvas-scroll', event => {
  if (event.originalEvent.ctrlKey || event.originalEvent.metaKey) {
    event.preventDefaultAction = true;
    event.preventDefault = false;
  }
});

function initialiseComparison() {
  if (loadingFailed || skyViewer.world.getItemCount() !== 1 || spectraViewer.world.getItemCount() !== 1) return;
  comparisonReady = true;
  stage.setAttribute('aria-busy', 'false');
  document.querySelectorAll('button[disabled], input[disabled]').forEach(control => { control.disabled = false; });
  skyViewer.viewport.maxZoomLevel = skyViewer.world.getItemAt(0).imageToViewportZoom(1);
  spectraViewer.viewport.maxZoomLevel = spectraViewer.world.getItemAt(0).imageToViewportZoom(1);
  skyViewer.viewport.goHome(true);
  synchroniseViews();
  updateDetail();
  selectView(requestedView, false);
  status.textContent = 'Image comparison ready. Choose a still view or animate the transition.';
}
function synchroniseViews() {
  if (!comparisonReady) return;
  spectraViewer.viewport.fitBounds(skyViewer.viewport.getBounds(true), true);
  updateDetail();
}
function updateDetail() {
  if (!comparisonReady || loadingFailed) return;
  const loaded = [skyViewer, spectraViewer].every(viewer => viewer.world.getItemAt(0).getFullyLoaded());
  if (loaded && requestedView === 'animate' && !transitionAnimations.length) startLoop();
  const native = skyViewer.viewport.viewportToImageZoom(skyViewer.viewport.getZoom(true)) >= .999;
  detail.textContent = !loaded ? 'Loading finer detail from this computer…' : native ? 'Original image detail · Both views aligned' : 'Both views aligned · Zoom to explore finer detail';
}
function showFailure() {
  cancelTransition();
  loadingFailed = true;
  comparisonReady = false;
  fallback.hidden = false;
  stage.hidden = true;
  document.querySelectorAll('#fit-image, #zoom-in, #zoom-out, button[data-view], [data-pan]').forEach(control => { control.disabled = true; });
  detail.textContent = 'The interactive comparison could not load. The two static previews are available instead.';
  status.textContent = detail.textContent;
}
// Both tiled images keep their original registration; only the spectra layer's
// opacity changes. The sky remains the input surface for pan and pinch gestures.
const transitionTargets = [spectraLayer, skyLabel, spectraLabel];
function cancelTransition() {
  for (const animation of transitionAnimations) animation.cancel();
  transitionAnimations = [];
  comparisonAnimating = false;
}
function setOpacity(value) {
  spectraLayer.style.opacity = value;
  skyLabel.style.opacity = 1 - value;
  spectraLabel.style.opacity = value;
}
function animateLayers(frames, timing) {
  const start = document.timeline.currentTime;
  transitionAnimations = transitionTargets.map((element, index) => {
    const values = frames.map(frame => ({ ...frame, opacity: index === 1 ? 1 - frame.opacity : frame.opacity }));
    const animation = element.animate(values, { ...timing, fill: 'both' });
    animation.startTime = start;
    return animation;
  });
  updatePlayback();
}
function startLoop() {
  if (!comparisonReady || loadingFailed || requestedView !== 'animate' || transitionAnimations.length) return;
  if (![skyViewer, spectraViewer].every(viewer => viewer.world.getItemAt(0).getFullyLoaded())) return;
  comparisonAnimating = true;
  animateLayers([
    { opacity: 0, offset: 0 },
    { opacity: 0, offset: .125, easing: 'cubic-bezier(.45,0,.55,1)' },
    { opacity: 1, offset: .5 },
    { opacity: 1, offset: .625, easing: 'cubic-bezier(.45,0,.55,1)' },
    { opacity: 0, offset: 1 },
  ], { duration: 12000, iterations: Infinity });
}
function updatePlayback() {
  const paused = document.hidden || document.getElementById('about-dialog').open;
  for (const animation of transitionAnimations) {
    if (paused) animation.pause();
    else if (animation.playState === 'paused') animation.play();
  }
}
function selectView(view, manual = true) {
  const current = Number(getComputedStyle(spectraLayer).opacity);
  cancelTransition();
  requestedView = view;
  stage.dataset.view = view;
  document.querySelectorAll('button[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
  const description = view === 'animate' ? 'Animated transition · sky image ↔ spectra' : view === 'spectra' ? 'Spectra illustration' : 'Sky image';
  document.getElementById('view-description').textContent = description;
  if (manual) status.textContent = description;
  if (view === 'animate') {
    setOpacity(0);
    startLoop();
  } else {
    const target = view === 'spectra' ? 1 : 0;
    setOpacity(target);
    if (manual && !reducedMotion.matches && Math.abs(current-target) > .001) {
      animateLayers([{ opacity: current }, { opacity: target }], { duration: 1100, easing: 'ease-in-out' });
    }
  }
}
setOpacity(0);
document.querySelectorAll('button[data-view]').forEach(button => button.addEventListener('click', () => selectView(button.dataset.view)));
document.addEventListener('visibilitychange', updatePlayback);
skyViewer.addHandler('animation', synchroniseViews);
skyViewer.addHandler('update-viewport', synchroniseViews);
function resizeComparison() {
  if (!comparisonReady) return;
  skyViewer.viewport.maxZoomLevel = skyViewer.world.getItemAt(0).imageToViewportZoom(1);
  spectraViewer.viewport.maxZoomLevel = spectraViewer.world.getItemAt(0).imageToViewportZoom(1);
  skyViewer.viewport.applyConstraints(true);
  synchroniseViews();
}
skyViewer.addHandler('resize', resizeComparison);
spectraViewer.addHandler('resize', synchroniseViews);
function zoomBy(factor) {
  if (!comparisonReady) return;
  skyViewer.viewport.zoomBy(factor, null, reducedMotion.matches);
  skyViewer.viewport.applyConstraints(reducedMotion.matches);
  synchroniseViews();
}
function home() {
  if (!comparisonReady) return;
  skyViewer.viewport.goHome(reducedMotion.matches);
  synchroniseViews();
}
function pan(direction) {
  if (!comparisonReady) return;
  const offsets = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
  const distance = .08 / skyViewer.viewport.getZoom();
  skyViewer.viewport.panBy(new OpenSeadragon.Point(offsets[direction][0] * distance, offsets[direction][1] * distance), reducedMotion.matches);
  skyViewer.viewport.applyConstraints(reducedMotion.matches);
  synchroniseViews();
}
document.getElementById('fit-image').addEventListener('click', home);
document.getElementById('zoom-in').addEventListener('click', () => zoomBy(1.6));
document.getElementById('zoom-out').addEventListener('click', () => zoomBy(1 / 1.6));
document.querySelectorAll('[data-pan]').forEach(button => button.addEventListener('click', () => pan(button.dataset.pan)));
stage.addEventListener('keydown', event => {
  if (event.target.closest('button') || event.altKey || event.ctrlKey || event.metaKey || !comparisonReady) return;
  const directions = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
  if (directions[event.key]) pan(directions[event.key]);
  else if (['+', '='].includes(event.key)) zoomBy(1.35);
  else if (['-', '_'].includes(event.key)) zoomBy(1 / 1.35);
  else if (['Home', 'h', 'H', '0'].includes(event.key)) home();
  else if (['n', 'N'].includes(event.key)) {
    skyViewer.viewport.zoomTo(skyViewer.viewport.imageToViewportZoom(1), null, reducedMotion.matches);
    skyViewer.viewport.applyConstraints(reducedMotion.matches);
    synchroniseViews();
  } else return;
  event.preventDefault();
});
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches && requestedView === 'animate') {
    selectView(Number(getComputedStyle(spectraLayer).opacity) >= .5 ? 'spectra' : 'sky');
  }
  for (const viewer of [skyViewer, spectraViewer]) {
    viewer.animationTime = reducedMotion.matches ? 0 : .5;
    for (const name of ['centerSpringX', 'centerSpringY', 'zoomSpring', 'degreesSpring']) viewer.viewport[name].animationTime = viewer.animationTime;
  }
});
const about = document.getElementById('about-dialog');
const aboutOpen = document.getElementById('about-open');
aboutOpen.setAttribute('aria-expanded', 'false');
aboutOpen.addEventListener('click', () => {
  about.showModal();
  updatePlayback();
  aboutOpen.setAttribute('aria-expanded', 'true');
  document.getElementById('about-close').focus();
});
document.getElementById('about-close').addEventListener('click', () => about.close());
about.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const controls = [...about.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), [tabindex="0"]')].filter(control => control.getClientRects().length > 0);
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
about.addEventListener('close', () => {
  updatePlayback();
  aboutOpen.setAttribute('aria-expanded', 'false');
  aboutOpen.focus();
});
const fullscreen = document.getElementById('fullscreen');
fullscreen.hidden = !document.fullscreenEnabled;
fullscreen.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await root.requestFullscreen();
  } catch { status.textContent = 'Fullscreen is not available in this browser.'; }
});
document.addEventListener('fullscreenchange', () => {
  const label = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';
  fullscreen.setAttribute('aria-label', label);
  fullscreen.title = label;
  if (!document.fullscreenElement) fullscreen.focus();
});
