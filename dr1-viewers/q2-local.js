const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const imageRegion = document.getElementById('viewer');
const root = document.documentElement;
const status = document.getElementById('load-status');
const store = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
const contrast = new URL(location.href).searchParams.get('contrast');
root.dataset.contrast = ['high', 'standard'].includes(contrast) ? contrast : read('euclid-contrast-choice') || 'standard';
store('euclid-contrast-choice', root.dataset.contrast);
const MAX_IMAGE_ZOOM = 1;
const EUCLID_FIELD_OF_VIEW_SQ_DEG = 0.5;
const FEATURE_ZOOM_DURATION_MS = 4200;
let featureZoomAnimationFrame = null;
let portalClickBlockedUntil = 0;
const sceneDefinitions = window.EUCLID_DR1_SCENES;
let skyFootprint = null;
let skyFootprintFailed = false;
const requestedScene = location.hash.slice(1);
let activeSceneName = Object.hasOwn(sceneDefinitions, requestedScene) ? requestedScene : 'wide';
let activeScene = sceneDefinitions[activeSceneName];
const rememberedViews = new Map();
let pendingRestore = null;
let pendingFocus = null;
let startupPoster = activeSceneName === 'wide' ? imageRegion.querySelector('#overview') : null;
const viewer = OpenSeadragon({
  id: 'viewer', tileSources: activeScene.tileSource,
  showNavigationControl: false, showNavigator: true,
  navigatorPosition: 'BOTTOM_RIGHT', navigatorSizeRatio: .16,
  navigatorMaintainSizeRatio: true, navigatorAutoFade: false,
  animationTime: reducedMotion.matches ? 0 : .65, springStiffness: 6.5,
  blendTime: 0, minPixelRatio: .5,
  constrainDuringPan: true, visibilityRatio: .8,
  minZoomImageRatio: .42, maxZoomPixelRatio: MAX_IMAGE_ZOOM, homeFillsViewer: false,
  imageLoaderLimit: 8, maxImageCacheCount: 300,
  gestureSettingsMouse: { scrollToZoom: true, clickToZoom: false, dblClickToZoom: false, pinchToZoom: true },
  gestureSettingsTouch: { dragToPan: true, scrollToZoom: false, pinchToZoom: true, zoomToRefPoint: true, pinchRotate: false, clickToZoom: false, dblClickToZoom: false, dblClickDragToZoom: false, flickEnabled: true },
});
if (startupPoster) { startupPoster.setAttribute('aria-hidden', 'true'); imageRegion.append(startupPoster); }
let ready = false;
let failed = false;
viewer.canvas.tabIndex = -1;
viewer.addHandler('canvas-key', event => { event.preventDefaultAction = true; });
viewer.addHandler('canvas-scroll', event => {
  if (event.originalEvent.ctrlKey || event.originalEvent.metaKey) {
    event.preventDefaultAction = true;
    event.preventDefault = false;
  }
});
viewer.navigator.element.setAttribute('aria-hidden', 'true');
viewer.navigator.element.inert = true;
function formatFieldOfView(value) {
  if (value <= 0) return '0';
  if (value >= .1) return `~${value.toFixed(2)}`;
  const reciprocal = 1 / value;
  const lower = Math.floor(reciprocal);
  const upper = Math.ceil(reciprocal);
  const denominator = Math.abs(value - 1 / lower) < Math.abs(value - 1 / upper) ? lower : upper;
  return `~1/${denominator}`;
}
function visibleImageBounds() {
  const bounds = viewer.viewport.viewportToImageRectangle(viewer.viewport.getBounds(true));
  const left = Math.max(0, bounds.x);
  const top = Math.max(0, bounds.y);
  const right = Math.min(activeScene.width, bounds.x + bounds.width);
  const bottom = Math.min(activeScene.height, bounds.y + bounds.height);
  return { left, top, right: Math.max(left, right), bottom: Math.max(top, bottom) };
}
function footprintIntegralAt(horizontal, vertical) {
  const metadata = sceneDefinitions.wide.footprint;
  const width = sceneDefinitions.wide.width;
  const height = sceneDefinitions.wide.height;
  horizontal = Math.max(0, Math.min(width, horizontal));
  vertical = Math.max(0, Math.min(height, vertical));
  const column = Math.min(Math.floor(horizontal / metadata.cellSize), metadata.columns - 1);
  const row = Math.min(Math.floor(vertical / metadata.cellSize), metadata.rows - 1);
  const fractionX = (horizontal - column * metadata.cellSize) / Math.min(metadata.cellSize, width - column * metadata.cellSize);
  const fractionY = (vertical - row * metadata.cellSize) / Math.min(metadata.cellSize, height - row * metadata.cellSize);
  const stride = metadata.columns + 1;
  const offset = row * stride + column;
  const top = skyFootprint[offset] * (1 - fractionX) + skyFootprint[offset + 1] * fractionX;
  const bottom = skyFootprint[offset + stride] * (1 - fractionX) + skyFootprint[offset + stride + 1] * fractionX;
  return top * (1 - fractionY) + bottom * fractionY;
}
function footprintPixelsInBounds(left, top, right, bottom) {
  return Math.max(0, footprintIntegralAt(right, bottom) - footprintIntegralAt(left, bottom) - footprintIntegralAt(right, top) + footprintIntegralAt(left, top));
}
function fieldOfViewCount() {
  const bounds = visibleImageBounds();
  let visibleFraction;
  if (activeScene.footprint) {
    if (!skyFootprint) return null;
    visibleFraction = footprintPixelsInBounds(bounds.left, bounds.top, bounds.right, bounds.bottom) / activeScene.footprint.totalPixels;
  } else visibleFraction = (bounds.right - bounds.left) * (bounds.bottom - bounds.top) / (activeScene.width * activeScene.height);
  return visibleFraction * activeScene.areaSqDeg / EUCLID_FIELD_OF_VIEW_SQ_DEG;
}
function updateStatus() {
  if (!ready) return;
  const ratio = viewer.viewport.viewportToImageZoom(viewer.viewport.getZoom(true));
  const fieldCount = fieldOfViewCount();
  document.getElementById('fov-value').textContent = fieldCount === null ? '—' : formatFieldOfView(fieldCount);
  const item = viewer.world.getItemAt(0);
  const loaded = item.getFullyLoaded();
  if (loaded) failed = false;
  const native = ratio >= MAX_IMAGE_ZOOM * .99;
  document.getElementById('detail-state').textContent = failed ? ' · Tile loading failed' : fieldCount === null ? skyFootprintFailed ? ' · Sky-area information unavailable' : ' · Loading sky-area information…' : !loaded ? ' · Loading finer detail…' : native ? ' · Original detail' : ' · Detail loaded';
  const hotspot = document.getElementById('detail-hotspot');
  if (hotspot && activeScene.portal) {
    const position = viewer.viewport.pixelFromPoint(viewer.viewport.imageToViewportCoordinates(...activeScene.portal.center), true);
    const size = viewer.viewport.getContainerSize();
    const outside = position.x < 0 || position.y < 0 || position.x > size.x || position.y > size.y;
    if (outside && document.activeElement === hotspot) imageRegion.focus({ preventScroll: true });
    hotspot.hidden = outside;
  }
}
function zoomBy(factor) {
  stopFeatureZoom();
  if (!ready) return;
  viewer.viewport.zoomBy(factor, null, reducedMotion.matches);
  viewer.viewport.applyConstraints(reducedMotion.matches);
}
function home() {
  stopFeatureZoom();
  if (!ready) return;
  viewer.viewport.fitBounds(viewer.viewport.imageToViewportRectangle(0, 0, activeScene.width, activeScene.height), reducedMotion.matches);
  viewer.viewport.applyConstraints(reducedMotion.matches);
}
function nativeDetail() {
  stopFeatureZoom();
  if (!ready) return;
  viewer.viewport.zoomTo(viewer.viewport.imageToViewportZoom(MAX_IMAGE_ZOOM), null, reducedMotion.matches);
  viewer.viewport.applyConstraints(reducedMotion.matches);
}
function pan(direction) {
  stopFeatureZoom();
  if (!ready) return;
  const offsets = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
  const distance = .06 / viewer.viewport.getZoom();
  viewer.viewport.panBy(new OpenSeadragon.Point(offsets[direction][0] * distance, offsets[direction][1] * distance), reducedMotion.matches);
  viewer.viewport.applyConstraints(reducedMotion.matches);
}
function updateSceneControls() {
  const parent = activeScene.parent && sceneDefinitions[activeScene.parent];
  const back = document.getElementById('scene-back');
  back.hidden = !parent;
  const backLabel = parent ? `Back to ${parent.shortTitle}` : 'Back to previous image';
  back.setAttribute('aria-label', backLabel);
  back.title = backLabel;
  back.disabled = !ready;
  document.querySelector('h1').textContent = `${activeScene.title} Explorer`;
  document.title = `${activeScene.title} Explorer`;
  imageRegion.setAttribute('aria-label', `${activeScene.title}, zoomable image`);
  imageRegion.setAttribute('aria-busy', String(!ready));
  ['home', 'zoom-in', 'zoom-out'].forEach(id => { document.getElementById(id).disabled = !ready; });
}
function addScenePortal() {
  if (!activeScene.child || !activeScene.portal) return;
  const portal = activeScene.portal;
  const child = sceneDefinitions[activeScene.child];
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'detail-hotspot';
  button.className = 'feature-hotspot feature-hotspot--ready';
  button.setAttribute('aria-label', `Explore ${child.shortTitle}`);
  button.title = `Explore ${child.shortTitle}`;
  const ring = document.createElement('span');
  ring.className = 'feature-hotspot__ring';
  ring.setAttribute('aria-hidden', 'true');
  button.append(ring);
  button.addEventListener('pointerdown', event => { if (event.pointerType !== 'touch') event.stopPropagation(); });
  button.addEventListener('pointerup', event => { if (event.pointerType !== 'touch') event.stopPropagation(); });
  button.addEventListener('click', event => {
    event.stopPropagation();
    if (event.detail > 0 && performance.now() < portalClickBlockedUntil) { event.preventDefault(); return; }
    exploreRegion();
  });
  viewer.addOverlay({ element: button, location: viewer.viewport.imageToViewportCoordinates(...portal.center), placement: OpenSeadragon.Placement.CENTER, checkResize: true });
}
function stopFeatureZoom() {
  if (featureZoomAnimationFrame !== null) cancelAnimationFrame(featureZoomAnimationFrame);
  featureZoomAnimationFrame = null;
}
function currentView() {
  const bounds = viewer.viewport.viewportToImageRectangle(viewer.viewport.getBounds(true));
  return { bounds: [bounds.x, bounds.y, bounds.width, bounds.height], focusId: document.activeElement.id };
}
function exploreRegion() {
  if (!ready || !activeScene.child || featureZoomAnimationFrame !== null) return;
  const childName = activeScene.child;
  const previousView = currentView();
  if (reducedMotion.matches) {
    switchScene(childName, previousView);
    return;
  }
  const startRect = viewer.viewport.viewportToImageRectangle(viewer.viewport.getBounds(true));
  const horizontal = activeScene.portal.polygon.map(point => point[0]);
  const vertical = activeScene.portal.polygon.map(point => point[1]);
  const size = viewer.viewport.getContainerSize();
  const width = Math.max(Math.max(...horizontal) - Math.min(...horizontal), size.x / MAX_IMAGE_ZOOM);
  const height = Math.max(Math.max(...vertical) - Math.min(...vertical), size.y / MAX_IMAGE_ZOOM);
  const targetRect = { x: activeScene.portal.center[0] - width / 2, y: activeScene.portal.center[1] - height / 2, width, height };
  const startTime = performance.now();
  const step = now => {
    const progress = Math.min((now - startTime) / FEATURE_ZOOM_DURATION_MS, 1);
    const easedProgress = Math.sin((progress * Math.PI) / 2);
    const nextRect = Object.fromEntries(['x', 'y', 'width', 'height'].map(key => [key, startRect[key] + (targetRect[key] - startRect[key]) * easedProgress]));
    viewer.viewport.fitBounds(viewer.viewport.imageToViewportRectangle(nextRect.x, nextRect.y, nextRect.width, nextRect.height), true);
    viewer.viewport.applyConstraints(true);
    updateStatus();
    if (progress < 1) featureZoomAnimationFrame = requestAnimationFrame(step);
    else {
      featureZoomAnimationFrame = null;
      switchScene(childName, previousView);
    }
  };
  featureZoomAnimationFrame = requestAnimationFrame(step);
}
function switchScene(sceneName, previousView = null) {
  if (!Object.hasOwn(sceneDefinitions, sceneName) || sceneName === activeSceneName) return;
  stopFeatureZoom();
  if (ready) {
    rememberedViews.set(activeSceneName, previousView || currentView());
  }
  const returning = activeScene.parent === sceneName;
  pendingRestore = rememberedViews.get(sceneName) || null;
  pendingFocus = returning ? pendingRestore?.focusId || 'viewer' : 'viewer';
  startupPoster?.remove(); startupPoster = null;
  ready = false;
  failed = false;
  activeSceneName = sceneName;
  activeScene = sceneDefinitions[sceneName];
  viewer.clearOverlays();
  updateSceneControls();
  document.getElementById('fov-value').textContent = '—';
  document.getElementById('detail-state').textContent = ' · Loading local image…';
  status.textContent = `Loading ${activeScene.shortTitle} from this computer.`;
  const address = new URL(location.href);
  address.hash = sceneName === 'wide' ? '' : sceneName;
  history.replaceState(null, '', address);
  window.dispatchEvent(new Event('euclid-contrast-change'));
  viewer.open(activeScene.tileSource);
}
document.getElementById('scene-back').addEventListener('click', () => switchScene(activeScene.parent));
window.addEventListener('hashchange', () => switchScene(location.hash.slice(1) || 'wide'));
updateSceneControls();
viewer.addHandler('open', () => {
  viewer.world.getItemAt(0).source.hasTransparency = () => false;
  ready = true;
  viewer.forceResize();
  if (pendingRestore) {
    viewer.viewport.fitBounds(viewer.viewport.imageToViewportRectangle(...pendingRestore.bounds), true);
    viewer.viewport.applyConstraints(true);
  } else {
    viewer.viewport.fitBounds(viewer.viewport.imageToViewportRectangle(0, 0, activeScene.width, activeScene.height), true);
    viewer.viewport.applyConstraints(true);
  }
  viewer.forceRedraw();
  pendingRestore = null;
  updateSceneControls();
  addScenePortal();
  const loadedItem = viewer.world.getItemAt(0);
  loadedItem.addHandler('fully-loaded-change', event => {
    if (!ready || viewer.world.getItemAt(0) !== loadedItem) return;
    requestAnimationFrame(updateStatus);
    if (event.fullyLoaded) { viewer.forceRedraw(); removePosterAfterPaint(); status.textContent = 'Image detail loaded from this computer.'; }
  });
  updateStatus();
  status.textContent = `${activeScene.shortTitle} ready. Zoom to load finer detail from this computer.`;
  if (pendingFocus) (document.getElementById(pendingFocus) || imageRegion).focus({ preventScroll: true });
  pendingFocus = null;
});
viewer.addHandler('open-failed', () => { status.textContent = 'The local image could not load. Reload this local preview.'; });
viewer.addHandler('tile-load-failed', event => { failed = true; console.warn('Local image tile load failed:', event.message); status.textContent = 'An image tile failed to load. Reload this local preview.'; updateStatus(); });
viewer.addHandler('animation', updateStatus);
viewer.addHandler('animation-finish', updateStatus);
viewer.addHandler('canvas-drag', stopFeatureZoom);
viewer.addHandler('canvas-pinch', () => {
  portalClickBlockedUntil = performance.now() + 350;
  stopFeatureZoom();
});
viewer.addHandler('canvas-scroll', event => { if (!event.originalEvent.ctrlKey && !event.originalEvent.metaKey) stopFeatureZoom(); });
reducedMotion.addEventListener('change', stopFeatureZoom);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && featureZoomAnimationFrame !== null) {
    stopFeatureZoom();
    status.textContent = 'Zoom stopped.';
  }
});
let posterRemovalScheduled = false;
function removePosterAfterPaint() {
  if (!startupPoster || posterRemovalScheduled || !ready || !viewer.world.getItemAt(0)?.getFullyLoaded()) return;
  posterRemovalScheduled = true;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    posterRemovalScheduled = false;
    if (!ready || !viewer.world.getItemAt(0)?.getFullyLoaded()) return;
    startupPoster?.remove(); startupPoster = null;
  }));
}
viewer.addHandler('tile-drawn', () => { updateStatus(); removePosterAfterPaint(); });
viewer.addHandler('update-viewport', removePosterAfterPaint);
document.fonts.ready.then(() => { if (ready) { viewer.forceResize(); viewer.viewport.applyConstraints(true); viewer.forceRedraw(); } });
document.getElementById('zoom-in').addEventListener('click', () => zoomBy(1.7));
document.getElementById('zoom-out').addEventListener('click', () => zoomBy(1 / 1.7));
document.getElementById('home').addEventListener('click', home);
document.querySelectorAll('[data-pan]').forEach(button => button.addEventListener('click', () => pan(button.dataset.pan)));
imageRegion.addEventListener('keydown', event => {
  if (event.target.closest('button') || event.altKey || event.ctrlKey || event.metaKey) return;
  const directions = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
  if (directions[event.key]) pan(directions[event.key]);
  else if (['+', '='].includes(event.key)) zoomBy(1.35);
  else if (['-', '_'].includes(event.key)) zoomBy(1 / 1.35);
  else if (['h', 'H', '0', 'Home'].includes(event.key)) home();
  else if (['n', 'N'].includes(event.key)) nativeDetail();
  else if (['e', 'E'].includes(event.key)) exploreRegion();
  else return;
  event.preventDefault();
});
document.getElementById('fov-toggle').addEventListener('click', event => {
  const collapsed = document.getElementById('fov-status').classList.toggle('status--collapsed');
  event.currentTarget.setAttribute('aria-expanded', String(!collapsed));
  event.currentTarget.setAttribute('aria-label', `${collapsed ? 'Show' : 'Hide'} field of view information`);
});
const fullscreen = document.getElementById('fullscreen');
if (!document.fullscreenEnabled) fullscreen.hidden = true;
fullscreen.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await root.requestFullscreen();
  } catch { status.textContent = 'Fullscreen is not available in this browser.'; }
});
document.addEventListener('fullscreenchange', () => {
  const name = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';
  fullscreen.setAttribute('aria-label', name);
  fullscreen.title = name;
  if (!document.fullscreenElement) fullscreen.focus();
});
reducedMotion.addEventListener('change', () => {
  viewer.animationTime = reducedMotion.matches ? 0 : .65;
  ['centerSpringX', 'centerSpringY', 'zoomSpring', 'degreesSpring'].forEach(name => { if (viewer.viewport[name]) viewer.viewport[name].animationTime = viewer.animationTime; });
});
window.addEventListener('resize', () => { if (ready) viewer.viewport.applyConstraints(true); });
async function loadSkyFootprint() {
  try {
    const metadata = sceneDefinitions.wide.footprint;
    const response = await fetch(metadata.url);
    if (!response.ok) throw new Error('Local sky footprint unavailable');
    const data = new Uint32Array(await response.arrayBuffer());
    if (data.length !== (metadata.columns + 1) * (metadata.rows + 1) || data[data.length - 1] !== metadata.totalPixels) throw new Error('Invalid local sky footprint');
    skyFootprint = data;
    updateStatus();
  } catch {
    skyFootprintFailed = true;
    updateStatus();
    status.textContent = 'The local sky-area information could not load. Reload this private preview.';
  }
}
loadSkyFootprint();
