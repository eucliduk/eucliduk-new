(() => {
  "use strict";

  const data = window.EUCLID_ORBIT_DATA;
  const starCatalogue = window.EUCLID_STAR_CATALOG;
  const surveyProgressData = window.EUCLID_SURVEY_PROGRESS_DATA;
  const lunarEphemeris = window.EUCLID_LUNAR_EPHEMERIS;
  const THREE = window.THREE;
  const host = document.getElementById("space-view");
  const loadingScreen = document.getElementById("loading-screen");
  const loadingMessage = document.getElementById("loading-message");
  const fallbackMessage = document.getElementById("fallback-message");
  const slider = document.getElementById("time");
  const dateOutput = document.getElementById("date");
  const playButton = document.getElementById("play");
  const returnToNowButton = document.getElementById("return-to-now");
  const gestureHint = document.getElementById("gesture-hint");
  const infoDialog = document.getElementById("info-dialog");
  const screenReaderStatus = document.getElementById("screen-reader-status");
  const ephemerisStatus = document.getElementById("ephemeris-status");
  const timelineEndLabel = document.getElementById("timeline-end-label");
  const sourceBoundaryMarker = document.getElementById("source-boundary-marker");
  const firstMosaicReleaseMarker = document.getElementById(
    "first-mosaic-release-marker"
  );
  const galacticReleaseMarker = document.getElementById("galactic-release-marker");
  const galacticCentreHotspot = document.getElementById(
    "galactic-centre-hotspot"
  );
  const firstMosaicHotspot = document.getElementById(
    "first-mosaic-hotspot"
  );
  const surveyProgressToggle = document.getElementById("survey-progress-toggle");
  const surveyProgressCaption = document.getElementById("survey-progress-caption");
  const surveyProgressKey = document.getElementById("survey-progress-key");
  const manoeuvreTooltip = document.getElementById("manoeuvre-tooltip");
  const manoeuvreKicker = manoeuvreTooltip
    ? manoeuvreTooltip.querySelector("span")
    : null;
  const manoeuvreDateLabel = document.getElementById("manoeuvre-date");
  const manoeuvreDeltaVLabel = document.getElementById("manoeuvre-delta-v");
  const manoeuvreListItems = document.getElementById("manoeuvre-list-items");

  if (!data || !THREE || !host || !slider) {
    showFallback("The trajectory or 3D renderer could not be loaded.");
    return;
  }

  const pointCount = Math.min(
    data.x.length,
    data.y.length,
    data.z.length,
    data.dates.length
  );
  const lastIndex = pointCount - 1;
  const sourceBoundaryIndex = Math.max(
    0,
    Math.min(
      lastIndex,
      Number.isInteger(data.sourceBoundaryIndex)
        ? data.sourceBoundaryIndex
        : lastIndex
    )
  );
  const sourceBoundaryTime = Number.isFinite(Date.parse(data.sourceBoundary))
    ? Date.parse(data.sourceBoundary)
    : Number.POSITIVE_INFINITY;
  const WORLD_SCALE = 1 / 1_000_000;
  const WORLD_CENTRE_X = 830_000;
  const EARTH_RADIUS = 0.12;
  const MOON_RADIUS = EARTH_RADIUS * (1_737.4 / 6_371);
  // Keep the spacecraft's visible size independent of the units used by its
  // source model. The detailed asset is centred and normalised when loaded.
  const SPACECRAFT_DISPLAY_SIZE = 0.08;
  const MOON_ORBIT_DAYS = 27.321661;
  const GALACTIC_BULGE_RA_DEGREES = 268.23737449126725;
  const GALACTIC_BULGE_DEC_DEGREES = -29.3696927990939;
  const GALACTIC_BULGE_FOV_DEGREES = 2.8;
  const GALACTIC_BULGE_SKY_RADIUS = 296;
  const GALACTIC_BULGE_FOOTPRINT_SKY_RADIUS = 301;
  const GALACTIC_BULGE_OBSERVATION_COMPLETE_TIME = Date.parse(
    "2025-03-24T12:00:00Z"
  );
  const GALACTIC_BULGE_RELEASE_TIME = Date.parse("2026-06-24T10:00:00Z");
  const FIRST_MOSAIC_RELEASE_TIME = Date.parse("2024-10-15T16:15:00Z");
  // Explorer metadata matching ESA's published Galactic position (l=246.7, b=-24.7).
  const FIRST_MOSAIC_RA_DEGREES = 92.2270833333;
  const FIRST_MOSAIC_DEC_DEGREES = -39.7957777778;
  // The explorer's 31.9° × 10.1° / 285.6° values are rounded. These
  // plate-carrée values preserve its centre and register the released
  // 260-observation silhouette to the corresponding RSD2026a polygons.
  const FIRST_MOSAIC_FOV_X_DEGREES = 31.75;
  const FIRST_MOSAIC_FOV_Y_DEGREES = 10.01;
  const FIRST_MOSAIC_SKY_ROLL_DEGREES = 74.27656;
  const FIRST_MOSAIC_SKY_RADIUS = 298;
  const SURVEY_PROGRESS_SKY_RADIUS = 304;
  const SURVEY_FOCUS_ECLIPTIC_LONGITUDE_DEGREES = 52.4;
  const SURVEY_FOCUS_ECLIPTIC_LATITUDE_DEGREES = -57.2;
  const SURVEY_SCHEDULE_EPOCH_TIME = Date.parse(
    surveyProgressData && surveyProgressData.scheduleEpoch
  );
  const SURVEY_SCHEDULE_START_TIME = Date.parse(
    surveyProgressData && surveyProgressData.scheduleStart
  );
  const SURVEY_SCHEDULE_END_TIME = Date.parse(
    surveyProgressData && surveyProgressData.scheduleEnd
  );
  const MOON_LONGITUDE_RADIUS_TERMS = [
    [0, 0, 1, 0, 6288774, -20905355],
    [2, 0, -1, 0, 1274027, -3699111],
    [2, 0, 0, 0, 658314, -2955968],
    [0, 0, 2, 0, 213618, -569925],
    [0, 1, 0, 0, -185116, 48888],
    [0, 0, 0, 2, -114332, -3149],
    [2, 0, -2, 0, 58793, 246158],
    [2, -1, -1, 0, 57066, -152138],
    [2, 0, 1, 0, 53322, -170733],
    [2, -1, 0, 0, 45758, -204586],
    [0, 1, -1, 0, -40923, -129620],
    [1, 0, 0, 0, -34720, 108743],
    [0, 1, 1, 0, -30383, 104755],
    [2, 0, 0, -2, 15327, 10321],
    [0, 0, 1, 2, -12528, 0],
    [0, 0, 1, -2, 10980, 79661],
    [4, 0, -1, 0, 10675, -34782],
    [0, 0, 3, 0, 10034, -23210],
    [4, 0, -2, 0, 8548, -21636],
    [2, 1, -1, 0, -7888, 24208]
  ];
  const MOON_LATITUDE_TERMS = [
    [0, 0, 0, 1, 5128122],
    [0, 0, 1, 1, 280602],
    [0, 0, 1, -1, 277693],
    [2, 0, 0, -1, 173237],
    [2, 0, -1, 1, 55413],
    [2, 0, -1, -1, 46271],
    [2, 0, 0, 1, 32573],
    [0, 0, 2, 1, 17198],
    [2, 0, 1, -1, 9266],
    [0, 0, 2, -1, 8822],
    [2, -1, 0, -1, 8216],
    [2, 0, -2, -1, 4324],
    [2, 0, 1, 1, 4200],
    [2, 1, 0, -1, -3359],
    [2, -1, -1, 1, 2463],
    [2, -1, 0, 1, 2211],
    [2, -1, -1, -1, 2065],
    [0, 1, -1, -1, -1870],
    [4, 0, -1, -1, 1828],
    [0, 1, 0, 1, -1794]
  ];
  const EARTH_POSITION = new THREE.Vector3(-WORLD_CENTRE_X * WORLD_SCALE, 0, 0);
  const L2_POSITION = new THREE.Vector3((1_500_000 - WORLD_CENTRE_X) * WORLD_SCALE, 0, 0);
  const SUN_POSITION = new THREE.Vector3(EARTH_POSITION.x - 149.6, 0, 0);
  const SUNWARD_DIRECTION = new THREE.Vector3()
    .subVectors(SUN_POSITION, EARTH_POSITION)
    .normalize();
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let prefersReducedMotion = motionPreference.matches;
  const isCompact = () => window.matchMedia("(max-width: 760px)").matches;

  slider.max = String(lastIndex);
  slider.value = String(lastIndex);
  if (sourceBoundaryMarker) {
    sourceBoundaryMarker.style.setProperty(
      "--source-boundary",
      `${(sourceBoundaryIndex / lastIndex) * 100}%`
    );
  }

  let scene;
  let camera;
  let renderer;
  let controls;

  try {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000205);

    camera = new THREE.PerspectiveCamera(43, 1, 0.002, 420);
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
  } catch (error) {
    console.error(error);
    showFallback("WebGL is unavailable in this browser.");
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isCompact() ? 1.5 : 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.13;
  renderer.physicallyCorrectLights = true;
  renderer.domElement.id = "orbit-webgl";
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.prepend(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !prefersReducedMotion;
  controls.dampingFactor = 0.065;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.8;
  controls.panSpeed = 0.65;

  const ambientLight = new THREE.AmbientLight(0x9ab0c1, 0.34);
  const sunlight = new THREE.DirectionalLight(0xfff4d7, 3.9);
  sunlight.position.copy(SUN_POSITION);
  sunlight.target.position.copy(EARTH_POSITION);
  const craftRimLight = new THREE.DirectionalLight(0xbbd8f2, 1.2);
  craftRimLight.position.set(4, 3, 5);
  scene.add(ambientLight, sunlight, sunlight.target, craftRimLight);

  function trajectoryPoint(index) {
    return new THREE.Vector3(
      (data.x[index] - WORLD_CENTRE_X) * WORLD_SCALE,
      data.z[index] * WORLD_SCALE,
      data.y[index] * WORLD_SCALE
    );
  }

  const orbitPoints = Array.from({ length: pointCount }, (_, index) => trajectoryPoint(index));
  const trajectoryTimes = data.dates.map((value) =>
    Date.parse(`${value.replace(" ", "T")}:00Z`)
  );
  const galacticReleaseState = trajectoryStateAt(GALACTIC_BULGE_RELEASE_TIME);
  const galacticReleaseProgress =
    galacticReleaseState.lowerIndex +
    (galacticReleaseState.upperIndex - galacticReleaseState.lowerIndex) *
      galacticReleaseState.fraction;
  // Release buttons always choose the first trajectory sample at or after
  // publication. The first-mosaic release falls 15 minutes after that day's
  // 16:00 sample, so rounding would reveal it too early.
  const galacticReleaseIndex = galacticReleaseState.fraction > 0
    ? galacticReleaseState.upperIndex
    : galacticReleaseState.lowerIndex;
  const firstMosaicReleaseState = trajectoryStateAt(FIRST_MOSAIC_RELEASE_TIME);
  const firstMosaicReleaseProgress =
    firstMosaicReleaseState.lowerIndex +
    (
      firstMosaicReleaseState.upperIndex -
      firstMosaicReleaseState.lowerIndex
    ) *
      firstMosaicReleaseState.fraction;
  const firstMosaicReleaseIndex = firstMosaicReleaseState.fraction > 0
    ? firstMosaicReleaseState.upperIndex
    : firstMosaicReleaseState.lowerIndex;
  if (firstMosaicReleaseMarker) {
    firstMosaicReleaseMarker.style.setProperty(
      "--timeline-event-position",
      `${(firstMosaicReleaseProgress / lastIndex) * 100}%`
    );
  }
  if (galacticReleaseMarker) {
    galacticReleaseMarker.style.setProperty(
      "--timeline-event-position",
      `${(galacticReleaseProgress / lastIndex) * 100}%`
    );
  }
  const manoeuvreData = normaliseManoeuvreData(data.manoeuvres);
  const initialTrajectory = trajectoryStateAt(Date.now());
  const latestPosition = initialTrajectory.position.clone();
  let currentIndex = initialTrajectory.lowerIndex;
  let currentCraftPosition = latestPosition.clone();
  let spacecraftModel = null;
  let activeView = "l2";
  let lastChosenView = "l2";
  let cameraTransition = null;
  let playing = false;
  let playbackAccumulator = 0;
  let previousFrameTime = performance.now();
  let statusTimer = 0;
  let lastSceneMinute = -1;
  let lastSceneMode = null;
  let lastClockMinute = -1;
  let lastMoonOrbitDay = -1;
  let showingCurrentTime = true;
  let lastSurveyProgressHour = -1;
  let surveyProgressVisible = false;
  let surveyProgressLoaded = false;
  let lastObjectView = "l2";

  const starField = makeStarField();
  const milkyWay = makeMilkyWay();
  const surveyProgress = makeSurveyProgress();
  const galacticObservationFootprint = makeGalacticObservationFootprint();
  const galacticCentreFeature = makeGalacticCentreFeature();
  const firstMosaicFeature = makeFirstMosaicFeature();
  starField.add(
    milkyWay.mesh,
    surveyProgress.mesh,
    galacticObservationFootprint.group,
    galacticCentreFeature.group,
    firstMosaicFeature.group
  );
  scene.add(starField);

  const earth = makeEarth();
  scene.add(earth.group);

  const moon = makeMoon();
  scene.add(moon.orbit, moon.group);

  const sun = makeSun();
  scene.add(sun);

  const orbit = makeOrbit();
  scene.add(orbit);

  const manoeuvreLayer = makeManoeuvreMarkers();
  scene.add(manoeuvreLayer.group);

  const spacecraftAnchor = new THREE.Group();
  const spacecraftAntiSunAxis = new THREE.Vector3();
  const spacecraftTelescopeAxis = new THREE.Vector3();
  const spacecraftRightAxis = new THREE.Vector3();
  const spacecraftAttitudeBasis = new THREE.Matrix4();
  spacecraftAnchor.position.copy(latestPosition);
  scene.add(spacecraftAnchor);
  updateSpacecraftAttitude(latestPosition);

  const craftLocator = new THREE.Mesh(
    new THREE.SphereGeometry(0.011, 20, 14),
    new THREE.MeshBasicMaterial({
      color: 0xd99c2b,
      transparent: true,
      opacity: 0.85
    })
  );
  spacecraftAnchor.add(craftLocator);

  const earthLabel = document.getElementById("earth-label");
  const earthNowLabel = document.getElementById("earth-now");
  const l2Label = document.getElementById("l2-label");
  const euclidLabel = document.getElementById("euclid-label");
  const euclidDistanceLabel = document.getElementById("euclid-distance");
  const moonLabel = document.getElementById("moon-label");
  const moonNowLabel = document.getElementById("moon-now");
  const sunLabel = document.getElementById("sun-label");
  const distanceLabel = document.getElementById("distance-label");

  const labelPosition = {
    earth: EARTH_POSITION.clone().add(new THREE.Vector3(0, 0.105, 0)),
    moon: moon.group.position.clone().add(new THREE.Vector3(0, 0.052, 0)),
    l2: L2_POSITION.clone().add(new THREE.Vector3(0, 0.045, 0)),
    euclid: latestPosition.clone().add(new THREE.Vector3(0, 0.064, 0)),
    sun: SUN_POSITION.clone().add(new THREE.Vector3(0, 0.9, 0)),
    distance: EARTH_POSITION.clone().lerp(L2_POSITION, 0.5).add(new THREE.Vector3(0, -0.05, 0))
  };

  const manoeuvreProjected = new THREE.Vector3();
  const manoeuvreRay = new THREE.Ray();
  const manoeuvreRayDirection = new THREE.Vector3();
  const manoeuvreIntersection = new THREE.Vector3();
  const manoeuvreEarthSphere = new THREE.Sphere(
    EARTH_POSITION.clone(),
    EARTH_RADIUS * 1.01
  );
  const manoeuvreMoonSphere = new THREE.Sphere(
    moon.group.position.clone(),
    MOON_RADIUS * 1.01
  );
  const skyFeatureProjected = new THREE.Vector3();
  const skyFeatureWorldPosition = new THREE.Vector3();
  const skyFeatureRay = new THREE.Ray();
  const skyFeatureRayDirection = new THREE.Vector3();
  const skyFeatureIntersection = new THREE.Vector3();
  const skyFeatureAxisWorldA = new THREE.Vector3();
  const skyFeatureAxisWorldB = new THREE.Vector3();
  const skyFeatureAxisProjectedA = new THREE.Vector3();
  const skyFeatureAxisProjectedB = new THREE.Vector3();
  const skyFeaturePicker = new THREE.Raycaster();
  const skyFeaturePointer = new THREE.Vector2();
  const objectPicker = new THREE.Raycaster();
  const objectPointer = new THREE.Vector2();
  const objectPickSphere = new THREE.Sphere();
  const objectPickPosition = new THREE.Vector3();
  const objectPickIntersection = new THREE.Vector3();
  const activePointerIds = new Set();
  let activeManoeuvreSelection = null;
  let pinnedManoeuvreSelection = null;
  let lastHoverPointer = null;
  let pointerStart = null;
  let controlsActive = false;
  let lastEmptyTap = null;

  const guidedTour = window.EuclidOrbitTour
    ? window.EuclidOrbitTour.create({
        host,
        onStart: stopPlayback,
        onFocus: (view) => {
          stopPlayback();
          setView(view, true);
        }
      })
    : null;

  document.querySelectorAll("[data-focus-object]").forEach((button) => {
    if (button.closest(".orbit-object-controls")) button.disabled = false;
    button.addEventListener("click", () => {
      focusSceneObject(button.dataset.focusObject);
    });
  });
  function adjustCamera(action) {
    cameraTransition = null;
    const offset = camera.position.clone().sub(controls.target);
    if (action === 'in' || action === 'out') {
      offset.setLength(Math.max(controls.minDistance, Math.min(controls.maxDistance, offset.length() * (action === 'in' ? .8 : 1.25))));
    } else if (action === 'up' || action === 'down') {
      const right = camera.up.clone().cross(offset).normalize();
      offset.applyAxisAngle(right, action === 'up' ? Math.PI / 12 : -Math.PI / 12);
    } else offset.applyAxisAngle(camera.up, action === 'left' ? -Math.PI / 12 : Math.PI / 12);
    camera.position.copy(controls.target).add(offset); controls.update();
  }
  host.addEventListener('keydown', event => {
    if (event.target !== host || event.altKey || event.ctrlKey || event.metaKey) return;
    const actions = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', '+': 'in', '=': 'in', '-': 'out' };
    if (actions[event.key]) { event.preventDefault(); adjustCamera(actions[event.key]); }
    else if (/^[1-6]$/.test(event.key)) {
      event.preventDefault(); focusSceneObject(['euclid', 'earth', 'moon', 'sun', 'l2', 'solar'][Number(event.key) - 1]);
    }
  });
  bindSkyFeatureHotspot(galacticCentreHotspot, galacticCentreFeature);
  bindSkyFeatureHotspot(firstMosaicHotspot, firstMosaicFeature);

  controls.addEventListener("start", () => {
    cameraTransition = null;
    controlsActive = true;
    if (!pinnedManoeuvreSelection) setActiveManoeuvre(null);
    setSkyFeatureHighlighted(galacticCentreFeature, false, "canvas");
    setSkyFeatureHighlighted(firstMosaicFeature, false, "canvas");
    renderer.domElement.style.cursor = "";
    dismissGestureHint();
  });

  controls.addEventListener("change", () => {
    if (controlsActive && !cameraTransition && activeView) {
      activeView = null;
    }
  });

  controls.addEventListener("end", () => {
    controlsActive = false;
  });

  slider.addEventListener("input", () => {
    stopPlayback();
    setTrajectoryIndex(Number(slider.value), true);
  });

  if (returnToNowButton) {
    returnToNowButton.addEventListener("click", () => {
      stopPlayback();
      setTrajectoryNow(false);
    });
  }

  if (firstMosaicReleaseMarker) {
    firstMosaicReleaseMarker.addEventListener("click", () => {
      stopPlayback();
      setTrajectoryIndex(firstMosaicReleaseIndex, false);
      setView("first-mosaic", true);
      window.clearTimeout(statusTimer);
      statusTimer = window.setTimeout(() => {
        screenReaderStatus.textContent =
          "Euclid’s first 1% sky mosaic was released on 15 October 2024. " +
          "The view is now centred on its real position in the sky.";
      }, 220);
    });
  }

  if (galacticReleaseMarker) {
    galacticReleaseMarker.addEventListener("click", () => {
      stopPlayback();
      setTrajectoryIndex(galacticReleaseIndex, false);
      setView("galactic-centre", true);
      window.clearTimeout(statusTimer);
      statusTimer = window.setTimeout(() => {
        screenReaderStatus.textContent =
          "Euclid’s Galactic Bulge Survey image was released on 24 June 2026. " +
          "The view is now centred on its real position in the sky.";
      }, 220);
    });
  }

  if (surveyProgressToggle) {
    surveyProgressToggle.addEventListener("click", () => {
      setSurveyProgressVisible(!surveyProgressVisible, true);
    });
  }

  playButton.addEventListener("click", () => {
    if (playing) {
      stopPlayback();
      return;
    }
    if (showingCurrentTime || currentIndex >= lastIndex) {
      setTrajectoryIndex(0, false);
    }
    playing = true;
    playButton.classList.add("playing");
    playButton.setAttribute("aria-label", "Pause Euclid's journey");
  });

  infoDialog?.addEventListener("click", (event) => {
    if (event.target === infoDialog) infoDialog.close();
  });

  if (gestureWasDismissed()) gestureHint.classList.add("dismissed");
  renderer.domElement.addEventListener("pointerdown", dismissGestureHint, { once: true });
  renderer.domElement.addEventListener("wheel", dismissGestureHint, { once: true, passive: true });
  renderer.domElement.addEventListener("pointerdown", beginManoeuvrePointer);
  renderer.domElement.addEventListener("pointermove", hoverManoeuvrePointer);
  renderer.domElement.addEventListener("pointerleave", leaveManoeuvrePointer);
  document.addEventListener("pointerup", selectManoeuvrePointer);
  document.addEventListener("pointercancel", cancelManoeuvrePointer);

  window.addEventListener("resize", resize);
  motionPreference.addEventListener("change", event => {
    prefersReducedMotion = event.matches;
    controls.enableDamping = !prefersReducedMotion;
    if (prefersReducedMotion) {
      stopPlayback();
      if (cameraTransition) setView(cameraTransition.view, false);
    }
  });
  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.defaultPrevented || infoDialog?.open || guidedTour?.isActive()) return;
    if (pinnedManoeuvreSelection) {
      pinnedManoeuvreSelection = null;
      setActiveManoeuvre(null);
      renderer.domElement.style.cursor = "";
    } else {
      focusSceneObject("solar");
    }
  });
  window.addEventListener("focus", () => refreshSceneTime(true));
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshSceneTime(true);
  });
  resize();
  setView("l2", false);
  setTrajectoryNow(false);
  updateEphemerisLabels();
  populateManoeuvreList();

  Promise.allSettled([
    loadEarthTextures(),
    loadMoonTexture(),
    loadMilkyWayTexture(),
    loadSpacecraftModel(),
    loadGalacticCentreTexture(),
    loadFirstMosaicTexture(),
    loadSurveyProgressTexture(),
    loadSunTexture()
  ]).then((results) => {
    const modelResult = results[3];
    if (modelResult.status === "rejected") {
      console.error("Euclid model failed to load:", modelResult.reason);
      loadingMessage.textContent = "The spacecraft model could not be loaded";
      window.setTimeout(() => loadingScreen.classList.add("loaded"), 1400);
      return;
    }
    loadingScreen.classList.add("loaded");
    guidedTour?.setReady(true);
  });

  requestAnimationFrame(animate);

  function showFallback(message) {
    document.querySelectorAll(".orbit-object-controls button").forEach(button => { button.disabled = true; });
    ["orbit-summary-date", "orbit-summary-distance"].forEach(id => {
      const summary = document.getElementById(id);
      if (summary) summary.textContent = "Position data is unavailable. The explanation below still works.";
    });
    if (loadingScreen) loadingScreen.hidden = true;
    if (fallbackMessage) {
      const paragraph = fallbackMessage.querySelector("p");
      if (paragraph) paragraph.textContent = message;
      fallbackMessage.hidden = false;
    }
  }

  function makeStarField() {
    const group = new THREE.Group();
    const catalogueData = starCatalogue && starCatalogue.data;
    if (!catalogueData || !catalogueData.length) {
      console.warn("The Bright Star Catalogue could not be loaded.");
      return group;
    }

    const bins = [
      { maximum: 0.5, size: 3.6, opacity: 1 },
      { maximum: 1.5, size: 2.85, opacity: 0.98 },
      { maximum: 2.5, size: 2.25, opacity: 0.94 },
      { maximum: 3.5, size: 1.75, opacity: 0.88 },
      { maximum: 4.5, size: 1.34, opacity: 0.8 },
      { maximum: 5.5, size: 1.02, opacity: 0.72 },
      { maximum: 6.6, size: 0.78, opacity: 0.62 }
    ];
    const starTexture = makeStarTexture();
    const buckets = bins.map(() => ({ positions: [], colours: [] }));
    const degreesToRadians = Math.PI / 180;
    const obliquity = 23.4392911 * degreesToRadians;
    const cosineObliquity = Math.cos(obliquity);
    const sineObliquity = Math.sin(obliquity);
    const radius = 300;
    const stride = starCatalogue.stride || 4;

    for (let index = 0; index < catalogueData.length; index += stride) {
      const rightAscension = catalogueData[index] * degreesToRadians;
      const declination = catalogueData[index + 1] * degreesToRadians;
      const magnitude = catalogueData[index + 2];
      const bvColourIndex = catalogueData[index + 3];
      const cosineDeclination = Math.cos(declination);
      const equatorialX = cosineDeclination * Math.cos(rightAscension);
      const equatorialY = cosineDeclination * Math.sin(rightAscension);
      const equatorialZ = Math.sin(declination);
      const eclipticX = equatorialX;
      const eclipticY =
        equatorialY * cosineObliquity +
        equatorialZ * sineObliquity;
      const eclipticZ =
        -equatorialY * sineObliquity +
        equatorialZ * cosineObliquity;
      const matchedBin = bins.findIndex(
        (bin) => magnitude <= bin.maximum
      );
      const binIndex = matchedBin === -1 ? bins.length - 1 : matchedBin;
      const bucket = buckets[binIndex];

      // At zero solar longitude the page basis is [-ecliptic X, Z, -Y].
      // Rotating the group about world Y then follows the real sky in the
      // same Sun–Earth frame used by the trajectory.
      bucket.positions.push(
        -eclipticX * radius,
        eclipticZ * radius,
        -eclipticY * radius
      );

      const colour = starColourFromBV(bvColourIndex);
      const lowerMagnitude = binIndex === 0 ? -1.5 : bins[binIndex - 1].maximum;
      const range = Math.max(0.01, bins[binIndex].maximum - lowerMagnitude);
      const withinBin = Math.max(
        0,
        Math.min(1, (bins[binIndex].maximum - magnitude) / range)
      );
      const brightness = 0.72 + withinBin * 0.28;
      bucket.colours.push(
        colour.r * brightness,
        colour.g * brightness,
        colour.b * brightness
      );
    }

    buckets.forEach((bucket, index) => {
      if (!bucket.positions.length) return;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(bucket.positions, 3)
      );
      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(bucket.colours, 3)
      );
      const points = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
          map: starTexture,
          size: bins[index].size * 1.5,
          sizeAttenuation: false,
          vertexColors: true,
          transparent: true,
          opacity: bins[index].opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false,
          toneMapped: false
        })
      );
      points.renderOrder = -10;
      group.add(points);
    });

    return group;
  }

  function makeStarTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 30);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.2, "rgba(255,255,255,1)");
    gradient.addColorStop(0.45, "rgba(255,255,255,.6)");
    gradient.addColorStop(0.7, "rgba(255,255,255,.15)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    return texture;
  }

  function makeMilkyWay() {
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: makeSolidTexture(0, 0, 0),
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
      fog: false,
      toneMapped: false
    });

    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          [
            "#include <common>",
            "varying vec3 vMilkyWayDirection;"
          ].join("\n")
        )
        .replace(
          "#include <begin_vertex>",
          [
            "#include <begin_vertex>",
            "vMilkyWayDirection = normalize(position);"
          ].join("\n")
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          [
            "#include <common>",
            "varying vec3 vMilkyWayDirection;"
          ].join("\n")
        )
        .replace(
          "#include <map_fragment>",
          [
            "#ifdef USE_MAP",
            "  vec3 pageDirection = normalize(vMilkyWayDirection);",
            "  const float sineObliquity = 0.3977771559;",
            "  const float cosineObliquity = 0.9174820621;",
            "  vec3 equatorialDirection = vec3(",
            "    -pageDirection.x,",
            "    -sineObliquity * pageDirection.y - cosineObliquity * pageDirection.z,",
            "     cosineObliquity * pageDirection.y - sineObliquity * pageDirection.z",
            "  );",
            "  vec3 galacticDirection = vec3(",
            "    dot(equatorialDirection, vec3(-0.0548755604, -0.8734370902, -0.4838350155)),",
            "    dot(equatorialDirection, vec3( 0.4941094279, -0.4448296300,  0.7469822445)),",
            "    dot(equatorialDirection, vec3(-0.8676661490, -0.1980763734,  0.4559837762))",
            "  );",
            "  float galacticLongitude = atan(galacticDirection.y, galacticDirection.x);",
            "  float galacticLatitude = asin(clamp(galacticDirection.z, -1.0, 1.0));",
            "  vec2 galacticUv = vec2(",
            "    fract(0.5 - galacticLongitude / 6.28318530718),",
            "    0.5 + galacticLatitude / 3.14159265359",
            "  );",
            "  vec4 texelColor = texture2D(map, galacticUv);",
            "  texelColor = mapTexelToLinear(texelColor);",
            "  diffuseColor *= texelColor;",
            "#endif"
          ].join("\n")
        );
    };
    material.customProgramCacheKey = () => "gaia-milky-way-j2000-v1";

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(
        405,
        isCompact() ? 64 : 96,
        isCompact() ? 32 : 48
      ),
      material
    );
    mesh.renderOrder = -20;
    mesh.frustumCulled = false;

    return { mesh, material };
  }

  function eclipticVectorToPage(longitudeDegrees, latitudeDegrees) {
    const degreesToRadians = Math.PI / 180;
    const longitude = longitudeDegrees * degreesToRadians;
    const latitude = latitudeDegrees * degreesToRadians;
    const cosineLatitude = Math.cos(latitude);
    return new THREE.Vector3(
      -cosineLatitude * Math.cos(longitude),
      Math.sin(latitude),
      -cosineLatitude * Math.sin(longitude)
    ).normalize();
  }

  function makeSurveyProgress() {
    const fallbackTexture = new THREE.DataTexture(
      new Uint8Array([0, 0, 0, 255]),
      1,
      1,
      THREE.RGBAFormat
    );
    fallbackTexture.encoding = THREE.LinearEncoding;
    fallbackTexture.minFilter = THREE.NearestFilter;
    fallbackTexture.magFilter = THREE.NearestFilter;
    fallbackTexture.needsUpdate = true;

    const textureWidth =
      Number(surveyProgressData && surveyProgressData.textureWidth) || 4096;
    const textureHeight =
      Number(surveyProgressData && surveyProgressData.textureHeight) || 2048;
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uScheduleTexture: { value: fallbackTexture },
        uCutoffHour: { value: 0 },
        uTexelSize: {
          value: new THREE.Vector2(1 / textureWidth, 1 / textureHeight)
        },
        uColour: { value: new THREE.Color(0xbbd8f2) },
        uOpacity: { value: 1 }
      },
      vertexShader: [
        "varying vec3 vSkyDirection;",
        "void main() {",
        "  vSkyDirection = normalize(position);",
        "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
        "}"
      ].join("\n"),
      fragmentShader: [
        "precision highp float;",
        "uniform sampler2D uScheduleTexture;",
        "uniform float uCutoffHour;",
        "uniform vec2 uTexelSize;",
        "uniform vec3 uColour;",
        "uniform float uOpacity;",
        "varying vec3 vSkyDirection;",
        "float scheduledCoverage(vec2 uv) {",
        "  vec4 encoded = texture2D(",
        "    uScheduleTexture,",
        "    vec2(fract(uv.x), clamp(uv.y, 0.0, 1.0))",
        "  );",
        "  float hourCode =",
        "    floor(encoded.r * 255.0 + 0.5) +",
        "    floor(encoded.g * 255.0 + 0.5) * 256.0;",
        "  return step(0.5, hourCode) * step(hourCode, uCutoffHour + 0.5);",
        "}",
        "void main() {",
        "  vec3 pageDirection = normalize(vSkyDirection);",
        "  vec3 eclipticDirection = vec3(",
        "    -pageDirection.x,",
        "    -pageDirection.z,",
        "     pageDirection.y",
        "  );",
        "  float longitude = atan(eclipticDirection.y, eclipticDirection.x);",
        "  float latitude = asin(clamp(eclipticDirection.z, -1.0, 1.0));",
        "  vec2 uv = vec2(",
        "    fract(longitude / 6.28318530718 + 1.0),",
        "    0.5 + latitude / 3.14159265359",
        "  );",
        "  float centre = scheduledCoverage(uv);",
        "  if (centre < 0.5) discard;",
        "  float neighbours = min(",
        "    min(",
        "      scheduledCoverage(uv + vec2(uTexelSize.x, 0.0)),",
        "      scheduledCoverage(uv - vec2(uTexelSize.x, 0.0))",
        "    ),",
        "    min(",
        "      scheduledCoverage(uv + vec2(0.0, uTexelSize.y)),",
        "      scheduledCoverage(uv - vec2(0.0, uTexelSize.y))",
        "    )",
        "  );",
        "  float edge = 1.0 - neighbours;",
        "  float alpha = mix(0.2, 0.62, edge) * uOpacity;",
        "  gl_FragColor = vec4(uColour, alpha);",
        "}"
      ].join("\n"),
      side: THREE.BackSide,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      fog: false,
      toneMapped: false
    });

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(
        SURVEY_PROGRESS_SKY_RADIUS,
        isCompact() ? 72 : 104,
        isCompact() ? 36 : 52
      ),
      material
    );
    mesh.visible = false;
    mesh.renderOrder = -15;
    mesh.frustumCulled = false;

    return {
      mesh,
      material,
      fallbackTexture,
      focusDirection: eclipticVectorToPage(
        SURVEY_FOCUS_ECLIPTIC_LONGITUDE_DEGREES,
        SURVEY_FOCUS_ECLIPTIC_LATITUDE_DEGREES
      )
    };
  }

  function equatorialVectorToPage(vector) {
    const obliquity = 23.4392911 * (Math.PI / 180);
    const cosineObliquity = Math.cos(obliquity);
    const sineObliquity = Math.sin(obliquity);
    const eclipticY =
      vector.y * cosineObliquity +
      vector.z * sineObliquity;
    const eclipticZ =
      -vector.y * sineObliquity +
      vector.z * cosineObliquity;
    return new THREE.Vector3(
      -vector.x,
      eclipticZ,
      -eclipticY
    ).normalize();
  }

  function makeEquatorialSkyFrame(
    rightAscensionDegrees,
    declinationDegrees,
    radius
  ) {
    const degreesToRadians = Math.PI / 180;
    const rightAscension = rightAscensionDegrees * degreesToRadians;
    const declination = declinationDegrees * degreesToRadians;
    const cosineDeclination = Math.cos(declination);
    const sineDeclination = Math.sin(declination);
    const direction = equatorialVectorToPage(
      new THREE.Vector3(
        cosineDeclination * Math.cos(rightAscension),
        cosineDeclination * Math.sin(rightAscension),
        sineDeclination
      )
    );
    const east = equatorialVectorToPage(
      new THREE.Vector3(
        -Math.sin(rightAscension),
        Math.cos(rightAscension),
        0
      )
    );
    const north = equatorialVectorToPage(
      new THREE.Vector3(
        -sineDeclination * Math.cos(rightAscension),
        -sineDeclination * Math.sin(rightAscension),
        cosineDeclination
      )
    );
    const west = east.clone().negate();
    const tangentBasis = new THREE.Matrix4().makeBasis(
      west,
      north,
      direction
    );
    const group = new THREE.Group();
    group.position.copy(direction).multiplyScalar(radius);
    group.quaternion.setFromRotationMatrix(tangentBasis);
    return { group, direction };
  }

  function makeCarSkyPatchGeometry(
    radius,
    fieldWidthDegrees,
    fieldHeightDegrees,
    rollDegrees
  ) {
    const horizontalSegments = isCompact() ? 64 : 96;
    const verticalSegments = isCompact() ? 20 : 32;
    const columns = horizontalSegments + 1;
    const rows = verticalSegments + 1;
    const degreesToRadians = Math.PI / 180;
    const fieldWidth = fieldWidthDegrees * degreesToRadians;
    const fieldHeight = fieldHeightDegrees * degreesToRadians;
    const roll = rollDegrees * degreesToRadians;
    const cosineRoll = Math.cos(roll);
    const sineRoll = Math.sin(roll);
    const positions = new Float32Array(columns * rows * 3);
    const textureCoordinates = new Float32Array(columns * rows * 2);
    const indices = [];
    let positionOffset = 0;
    let textureOffset = 0;

    for (let row = 0; row <= verticalSegments; row += 1) {
      const v = row / verticalSegments;
      const latitude = (v - 0.5) * fieldHeight;
      const sineLatitude = Math.sin(latitude);
      const cosineLatitude = Math.cos(latitude);

      for (let column = 0; column <= horizontalSegments; column += 1) {
        const u = column / horizontalSegments;
        const longitude = (u - 0.5) * fieldWidth;
        const imageX = cosineLatitude * Math.sin(longitude);
        const imageY = sineLatitude;
        const centre = cosineLatitude * Math.cos(longitude);
        const localX =
          imageX * cosineRoll - imageY * sineRoll;
        const localY =
          imageX * sineRoll + imageY * cosineRoll;

        positions[positionOffset] = radius * localX;
        positions[positionOffset + 1] = radius * localY;
        positions[positionOffset + 2] = radius * (centre - 1);
        positionOffset += 3;

        textureCoordinates[textureOffset] = u;
        textureCoordinates[textureOffset + 1] = v;
        textureOffset += 2;
      }
    }

    for (let row = 0; row < verticalSegments; row += 1) {
      for (let column = 0; column < horizontalSegments; column += 1) {
        const lowerLeft = row * columns + column;
        const lowerRight = lowerLeft + 1;
        const upperLeft = lowerLeft + columns;
        const upperRight = upperLeft + 1;
        indices.push(
          lowerLeft,
          lowerRight,
          upperLeft,
          lowerRight,
          upperRight,
          upperLeft
        );
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    geometry.setAttribute(
      "uv",
      new THREE.BufferAttribute(textureCoordinates, 2)
    );
    geometry.setIndex(indices);
    geometry.computeBoundingSphere();
    return geometry;
  }

  function makeGalacticCentreFeature() {
    const degreesToRadians = Math.PI / 180;
    const skyFrame = makeEquatorialSkyFrame(
      GALACTIC_BULGE_RA_DEGREES,
      GALACTIC_BULGE_DEC_DEGREES,
      GALACTIC_BULGE_SKY_RADIUS
    );
    const group = skyFrame.group;
    const angularSize = GALACTIC_BULGE_FOV_DEGREES * degreesToRadians;
    const planeSize =
      2 * GALACTIC_BULGE_SKY_RADIUS * Math.tan(angularSize / 2);
    group.visible = false;

    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: makeSolidTexture(0, 0, 0),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.18,
      alphaTest: 0.015,
      depthTest: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
      toneMapped: false
    });
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(planeSize, planeSize, 1, 1),
      material
    );
    mesh.renderOrder = -5;
    group.add(mesh);

    return {
      group,
      mesh,
      material,
      direction: skyFrame.direction,
      releaseTime: GALACTIC_BULGE_RELEASE_TIME,
      textureReady: false,
      planeWidth: planeSize,
      planeHeight: planeSize,
      compactHotspot: false,
      highlighted: false,
      visuals: [
        {
          material,
          restingOpacity: 0.18,
          highlightedOpacity: 0.72
        }
      ]
    };
  }

  function makeGalacticObservationFootprint() {
    const degreesToRadians = Math.PI / 180;
    const skyFrame = makeEquatorialSkyFrame(
      GALACTIC_BULGE_RA_DEGREES,
      GALACTIC_BULGE_DEC_DEGREES,
      GALACTIC_BULGE_FOOTPRINT_SKY_RADIUS
    );
    const angularSize = GALACTIC_BULGE_FOV_DEGREES * degreesToRadians;
    const planeSize =
      2 *
      GALACTIC_BULGE_FOOTPRINT_SKY_RADIUS *
      Math.tan(angularSize / 2);
    const fallbackTexture = makeSolidTexture(0, 0, 0);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uMaskTexture: { value: fallbackTexture },
        uTexelSize: { value: new THREE.Vector2(1 / 1024, 1 / 1024) },
        uColour: { value: new THREE.Color(0xd99c2b) }
      },
      vertexShader: [
        "varying vec2 vUv;",
        "void main() {",
        "  vUv = uv;",
        "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
        "}"
      ].join("\n"),
      fragmentShader: [
        "precision highp float;",
        "uniform sampler2D uMaskTexture;",
        "uniform vec2 uTexelSize;",
        "uniform vec3 uColour;",
        "varying vec2 vUv;",
        "float footprintMask(vec2 uv) {",
        "  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {",
        "    return 0.0;",
        "  }",
        "  return texture2D(uMaskTexture, uv).a;",
        "}",
        "void main() {",
        "  float centre = footprintMask(vUv);",
        "  float interior = smoothstep(0.02, 0.2, centre);",
        "  if (interior < 0.01) discard;",
        "  vec2 outlineStep = uTexelSize * 24.0;",
        "  float neighbours = min(",
        "    min(",
        "      footprintMask(vUv + vec2(outlineStep.x, 0.0)),",
        "      footprintMask(vUv - vec2(outlineStep.x, 0.0))",
        "    ),",
        "    min(",
        "      footprintMask(vUv + vec2(0.0, outlineStep.y)),",
        "      footprintMask(vUv - vec2(0.0, outlineStep.y))",
        "    )",
        "  );",
        "  float edge = interior * (1.0 - smoothstep(0.18, 0.86, neighbours));",
        "  float alpha = max(interior * 0.18, edge * 0.9);",
        "  gl_FragColor = vec4(uColour, alpha);",
        "}"
      ].join("\n"),
      side: THREE.DoubleSide,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      fog: false,
      toneMapped: false
    });
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(planeSize, planeSize, 1, 1),
      material
    );
    mesh.renderOrder = -10;
    skyFrame.group.visible = false;
    skyFrame.group.add(mesh);

    return {
      group: skyFrame.group,
      mesh,
      material,
      fallbackTexture,
      textureReady: false
    };
  }

  function makeFirstMosaicFeature() {
    const degreesToRadians = Math.PI / 180;
    const skyFrame = makeEquatorialSkyFrame(
      FIRST_MOSAIC_RA_DEGREES,
      FIRST_MOSAIC_DEC_DEGREES,
      FIRST_MOSAIC_SKY_RADIUS
    );
    const planeWidth =
      2 *
      FIRST_MOSAIC_SKY_RADIUS *
      Math.tan(FIRST_MOSAIC_FOV_X_DEGREES * degreesToRadians / 2);
    const planeHeight =
      2 *
      FIRST_MOSAIC_SKY_RADIUS *
      Math.tan(FIRST_MOSAIC_FOV_Y_DEGREES * degreesToRadians / 2);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: makeSkyFrameTexture(),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.18,
      depthTest: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
      toneMapped: false
    });
    const mesh = new THREE.Mesh(
      makeCarSkyPatchGeometry(
        FIRST_MOSAIC_SKY_RADIUS,
        FIRST_MOSAIC_FOV_X_DEGREES,
        FIRST_MOSAIC_FOV_Y_DEGREES,
        FIRST_MOSAIC_SKY_ROLL_DEGREES
      ),
      material
    );
    mesh.renderOrder = -7;
    mesh.frustumCulled = false;
    skyFrame.group.visible = false;
    skyFrame.group.add(mesh);

    return {
      group: skyFrame.group,
      mesh,
      material,
      direction: skyFrame.direction,
      releaseTime: FIRST_MOSAIC_RELEASE_TIME,
      textureReady: false,
      planeWidth,
      planeHeight,
      compactHotspot: true,
      highlighted: false,
      visuals: [
        {
          material,
          restingOpacity: 0.18,
          highlightedOpacity: 0.72
        }
      ]
    };
  }

  function starColourFromBV(value) {
    const bv = Number.isFinite(value)
      ? Math.max(-0.4, Math.min(2, value))
      : 0.65;
    const temperature =
      4_600 *
      (
        1 / (0.92 * bv + 1.7) +
        1 / (0.92 * bv + 0.62)
      );
    const scaledTemperature = temperature / 100;
    let red;
    let green;
    let blue;

    if (scaledTemperature <= 66) {
      red = 255;
      green =
        99.4708025861 * Math.log(Math.max(scaledTemperature, 1)) -
        161.1195681661;
    } else {
      red =
        329.698727446 *
        Math.pow(scaledTemperature - 60, -0.1332047592);
      green =
        288.1221695283 *
        Math.pow(scaledTemperature - 60, -0.0755148492);
    }

    if (scaledTemperature >= 66) {
      blue = 255;
    } else if (scaledTemperature <= 19) {
      blue = 0;
    } else {
      blue =
        138.5177312231 * Math.log(scaledTemperature - 10) -
        305.0447927307;
    }

    const clampChannel = (channel) =>
      Math.max(0, Math.min(255, channel)) / 255;
    const colour = new THREE.Color(
      clampChannel(red),
      clampChannel(green),
      clampChannel(blue)
    );
    return colour.convertSRGBToLinear();
  }

  function makeEarth() {
    const group = new THREE.Group();
    group.position.copy(EARTH_POSITION);

    const surfaceGroup = new THREE.Group();
    const surfaceGeometry = new THREE.SphereGeometry(
      EARTH_RADIUS,
      isCompact() ? 72 : 128,
      isCompact() ? 48 : 80
    );
    const nightMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(2.6, 2.6, 2.6),
      map: makeSolidTexture(4, 10, 18),
      toneMapped: false
    });
    const sphere = new THREE.Mesh(surfaceGeometry, nightMaterial);
    sphere.renderOrder = 1;
    surfaceGroup.add(sphere);

    const terminator = makeTerminatorTexture();
    const dayMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: makeSolidTexture(43, 105, 145),
      alphaMap: terminator.texture,
      transparent: true,
      depthWrite: false,
      toneMapped: false
    });
    const daySphere = new THREE.Mesh(surfaceGeometry, dayMaterial);
    daySphere.scale.setScalar(1.0015);
    daySphere.renderOrder = 2;
    surfaceGroup.add(daySphere);
    group.add(surfaceGroup);

    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColour: { value: new THREE.Color(0x62b5ef) },
        sunDirectionWorld: { value: SUNWARD_DIRECTION.clone() }
      },
      vertexShader: `
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;
        void main() {
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColour;
        uniform vec3 sunDirectionWorld;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;
        void main() {
          vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
          vec3 worldNormal = normalize(vWorldNormal);
          float rim = pow(1.0 - max(dot(worldNormal, viewDirection), 0.0), 3.1);
          float sunlight = smoothstep(
            -0.14,
            0.18,
            dot(worldNormal, normalize(sunDirectionWorld))
          );
          float illumination = mix(0.025, 1.0, sunlight);
          gl_FragColor = vec4(glowColour, rim * 0.58 * illumination);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide
    });
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(
        EARTH_RADIUS * 1.047,
        isCompact() ? 64 : 96,
        isCompact() ? 40 : 64
      ),
      atmosphereMaterial
    );
    atmosphere.renderOrder = 3;
    group.add(atmosphere);

    return {
      group,
      sphere,
      daySphere,
      surfaceGroup,
      dayMaterial,
      nightMaterial,
      terminator,
      atmosphereMaterial
    };
  }

  function makeMoon() {
    const group = new THREE.Group();
    group.position.copy(EARTH_POSITION);

    const sunDirectionWorld = SUNWARD_DIRECTION.clone();
    const material = new THREE.MeshStandardMaterial({
      color: 0xb9b7ae,
      roughness: 1,
      metalness: 0
    });
    material.userData.sunDirectionWorld = sunDirectionWorld;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.moonSunDirectionWorld = {
        value: sunDirectionWorld
      };
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        [
          "#include <common>",
          "uniform vec3 moonSunDirectionWorld;"
        ].join("\n")
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;",
        [
          "vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;",
          "vec3 moonSunDirectionView = normalize((viewMatrix * vec4(moonSunDirectionWorld, 0.0)).xyz);",
          "float moonSunCosine = dot(geometry.normal, moonSunDirectionView);",
          "float moonDaylight = smoothstep(-0.02, 0.04, moonSunCosine);",
          "outgoingLight *= mix(0.012, 1.0, moonDaylight);"
        ].join("\n")
      );
    };
    material.customProgramCacheKey = () => "moon-solar-shadow-v1";
    const surface = new THREE.Mesh(
      new THREE.SphereGeometry(
        MOON_RADIUS,
        isCompact() ? 48 : 72,
        isCompact() ? 32 : 48
      ),
      material
    );
    group.add(surface);

    const orbit = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({
        color: 0x9cabb5,
        transparent: true,
        opacity: 0.42,
        depthWrite: false
      })
    );

    return { group, surface, material, orbit };
  }

  function makeSolidTexture(red, green, blue) {
    const texture = new THREE.DataTexture(
      new Uint8Array([red, green, blue, 255]),
      1,
      1,
      THREE.RGBAFormat
    );
    texture.encoding = THREE.sRGBEncoding;
    texture.needsUpdate = true;
    return texture;
  }

  function makeTerminatorTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = isCompact() ? 512 : 1024;
    canvas.height = isCompact() ? 256 : 512;
    const context = canvas.getContext("2d");
    const image = context.createImageData(canvas.width, canvas.height);
    const latitudeSines = new Float32Array(canvas.height);
    const latitudeCosines = new Float32Array(canvas.height);
    const longitudeSines = new Float32Array(canvas.width);
    const longitudeCosines = new Float32Array(canvas.width);
    for (let row = 0; row < canvas.height; row += 1) {
      const latitude = Math.PI / 2 - row / (canvas.height - 1) * Math.PI;
      latitudeSines[row] = Math.sin(latitude);
      latitudeCosines[row] = Math.cos(latitude);
    }
    for (let column = 0; column < canvas.width; column += 1) {
      const longitude = column / (canvas.width - 1) * Math.PI * 2 - Math.PI;
      longitudeSines[column] = Math.sin(longitude);
      longitudeCosines[column] = Math.cos(longitude);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    return { canvas, context, image, texture, latitudeSines, latitudeCosines,
      longitudeSines, longitudeCosines };
  }

  function loadTexture(source) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        source,
        (texture) => {
          texture.encoding = THREE.sRGBEncoding;
          texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 12);
          texture.needsUpdate = true;
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }

  async function loadEarthTextures() {
    const resolution = isCompact() ? 2048 : 4096;
    const embeddedDayTexture = window.EUCLID_EARTH_TEXTURE_BASE64;
    const embeddedNightTexture = window.EUCLID_EARTH_NIGHT_TEXTURE_BASE64;
    const daySource = embeddedDayTexture
      ? `data:image/jpeg;base64,${embeddedDayTexture}`
      : `assets/textures/earth-blue-marble-${resolution}.jpg`;
    const nightSource = embeddedNightTexture
      ? `data:image/jpeg;base64,${embeddedNightTexture}`
      : `assets/textures/earth-black-marble-2016-${resolution}.jpg`;

    if (embeddedDayTexture) window.EUCLID_EARTH_TEXTURE_BASE64 = null;
    if (embeddedNightTexture) window.EUCLID_EARTH_NIGHT_TEXTURE_BASE64 = null;

    const results = await Promise.allSettled([
      loadTexture(daySource),
      loadTexture(nightSource)
    ]);
    const [dayResult, nightResult] = results;

    if (dayResult.status === "fulfilled") {
      const fallback = earth.dayMaterial.map;
      earth.dayMaterial.map = dayResult.value;
      earth.dayMaterial.needsUpdate = true;
      fallback.dispose();
    } else {
      console.warn("Earth day texture failed to load:", dayResult.reason);
    }

    if (nightResult.status === "fulfilled") {
      const fallback = earth.nightMaterial.map;
      earth.nightMaterial.map = nightResult.value;
      earth.nightMaterial.needsUpdate = true;
      fallback.dispose();
    } else {
      console.warn("Earth night texture failed to load:", nightResult.reason);
    }

    if (dayResult.status === "rejected" && nightResult.status === "rejected") {
      throw new Error("Earth imagery could not be loaded.");
    }

    return results;
  }

  async function loadSunTexture() {
    const embeddedTexture = window.EUCLID_SUN_TEXTURE_BASE64;
    const source = embeddedTexture
      ? `data:image/jpeg;base64,${embeddedTexture}`
      : "assets/textures/sun-nasa-sdo-stereo-2048.jpg";
    if (embeddedTexture) window.EUCLID_SUN_TEXTURE_BASE64 = null;

    try {
      const texture = await loadTexture(source);
      texture.wrapS = THREE.RepeatWrapping;
      const material = sun.userData.surfaceMaterial;
      const fallback = material.map;
      material.map = texture;
      material.needsUpdate = true;
      fallback.dispose();
      return texture;
    } catch (error) {
      console.warn("NASA Sun texture failed to load:", error);
      return null;
    }
  }

  async function loadMoonTexture() {
    const embeddedTexture = window.EUCLID_MOON_TEXTURE_BASE64;
    const source = embeddedTexture
      ? `data:image/jpeg;base64,${embeddedTexture}`
      : "assets/textures/moon-lroc-2k.jpg";
    if (embeddedTexture) window.EUCLID_MOON_TEXTURE_BASE64 = null;

    try {
      const texture = await loadTexture(source);
      moon.material.map = texture;
      moon.material.color.set(0xffffff);
      moon.material.needsUpdate = true;
      return texture;
    } catch (error) {
      console.warn("Moon texture failed to load:", error);
      return null;
    }
  }

  async function loadMilkyWayTexture() {
    const embeddedTexture = window.EUCLID_MILKY_WAY_TEXTURE_BASE64;
    const source = embeddedTexture
      ? `data:image/jpeg;base64,${embeddedTexture}`
      : "assets/textures/milky-way-gaia-edr3-2048.jpg";
    if (embeddedTexture) window.EUCLID_MILKY_WAY_TEXTURE_BASE64 = null;

    try {
      const texture = await loadTexture(source);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.anisotropy = Math.min(
        renderer.capabilities.getMaxAnisotropy(),
        8
      );
      texture.needsUpdate = true;
      const fallback = milkyWay.material.map;
      milkyWay.material.map = texture;
      milkyWay.material.needsUpdate = true;
      fallback.dispose();
      return texture;
    } catch (error) {
      console.warn("Milky Way texture failed to load:", error);
      return null;
    }
  }

  async function loadGalacticCentreTexture() {
    const embeddedTexture = window.EUCLID_GALACTIC_BULGE_TEXTURE_BASE64;
    const source = embeddedTexture
      ? `data:image/webp;base64,${embeddedTexture}`
      : "assets/textures/euclid-galactic-bulge-sky-1024.webp";
    if (embeddedTexture) {
      window.EUCLID_GALACTIC_BULGE_TEXTURE_BASE64 = null;
    }

    try {
      const texture = await loadTexture(source);
      texture.anisotropy = Math.min(
        renderer.capabilities.getMaxAnisotropy(),
        8
      );
      texture.needsUpdate = true;
      const fallback = galacticCentreFeature.material.map;
      galacticCentreFeature.material.map = texture;
      galacticCentreFeature.material.needsUpdate = true;
      galacticCentreFeature.textureReady = true;
      const imageWidth =
        texture.image.naturalWidth || texture.image.width || 1024;
      const imageHeight =
        texture.image.naturalHeight || texture.image.height || 1024;
      galacticObservationFootprint.material.uniforms.uMaskTexture.value =
        texture;
      galacticObservationFootprint.material.uniforms.uTexelSize.value.set(
        1 / imageWidth,
        1 / imageHeight
      );
      galacticObservationFootprint.textureReady = true;
      galacticObservationFootprint.fallbackTexture.dispose();
      updateSurveyProgressForDate(surveyDateForTimeline(), true);
      fallback.dispose();
      return texture;
    } catch (error) {
      console.warn("Euclid Galactic Bulge image failed to load:", error);
      return null;
    }
  }

  async function loadFirstMosaicTexture() {
    const embeddedTexture = window.EUCLID_FIRST_MOSAIC_TEXTURE_BASE64;
    const source = embeddedTexture
      ? `data:image/webp;base64,${embeddedTexture}`
      : "assets/textures/euclid-first-one-percent-mosaic-2048.webp";
    if (embeddedTexture) {
      window.EUCLID_FIRST_MOSAIC_TEXTURE_BASE64 = null;
    }

    try {
      const texture = await loadTexture(source);
      texture.anisotropy = Math.min(
        renderer.capabilities.getMaxAnisotropy(),
        8
      );
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.needsUpdate = true;
      const fallback = firstMosaicFeature.material.map;
      firstMosaicFeature.material.map = texture;
      firstMosaicFeature.material.needsUpdate = true;
      firstMosaicFeature.textureReady = true;
      updateReleasedSkyFeatures(surveyDateForTimeline());
      fallback.dispose();
      return texture;
    } catch (error) {
      console.warn("Euclid first 1% mosaic failed to load:", error);
      return null;
    }
  }

  async function loadSurveyProgressTexture() {
    if (!surveyProgressData) {
      if (surveyProgressCaption) {
        surveyProgressCaption.textContent = "Reference map unavailable";
      }
      if (surveyProgressToggle) {
        surveyProgressToggle.disabled = true;
        surveyProgressToggle.dataset.unavailable = "true";
        surveyProgressToggle.setAttribute(
          "aria-label",
          "Euclid survey progress map is unavailable"
        );
      }
      return null;
    }

    const embeddedTexture = window.EUCLID_SURVEY_PROGRESS_TEXTURE_BASE64;
    const source = embeddedTexture
      ? `data:image/png;base64,${embeddedTexture}`
      : "assets/textures/euclid-survey-progress-rg.png?v=20260729-2";
    if (embeddedTexture) {
      window.EUCLID_SURVEY_PROGRESS_TEXTURE_BASE64 = null;
    }

    try {
      const texture = await loadTexture(source);
      const sourceWidth =
        texture.image.naturalWidth || texture.image.width;
      const sourceHeight =
        texture.image.naturalHeight || texture.image.height;
      const maximumTextureSize = renderer.capabilities.maxTextureSize;
      let uploadWidth = sourceWidth;
      let uploadHeight = sourceHeight;

      if (sourceWidth > maximumTextureSize) {
        uploadWidth = maximumTextureSize;
        uploadHeight = Math.round(
          sourceHeight * (uploadWidth / sourceWidth)
        );
        const canvas = document.createElement("canvas");
        canvas.width = uploadWidth;
        canvas.height = uploadHeight;
        const context = canvas.getContext("2d");
        context.imageSmoothingEnabled = false;
        context.drawImage(texture.image, 0, 0, uploadWidth, uploadHeight);
        texture.image = canvas;
      }

      texture.encoding = THREE.LinearEncoding;
      texture.format = THREE.RGBFormat;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
      texture.anisotropy = 1;
      texture.needsUpdate = true;

      surveyProgress.material.uniforms.uScheduleTexture.value = texture;
      surveyProgress.material.uniforms.uTexelSize.value.set(
        1 / uploadWidth,
        1 / uploadHeight
      );
      surveyProgress.fallbackTexture.dispose();
      surveyProgressLoaded = true;
      if (surveyProgressToggle) {
        surveyProgressToggle.disabled = false;
        delete surveyProgressToggle.dataset.unavailable;
      }
      updateSurveyProgressForDate(surveyDateForTimeline(), true);
      return texture;
    } catch (error) {
      console.warn("Euclid survey progress texture failed to load:", error);
      if (surveyProgressCaption) {
        surveyProgressCaption.textContent = "Reference map unavailable";
      }
      if (surveyProgressToggle) {
        surveyProgressToggle.disabled = true;
        surveyProgressToggle.dataset.unavailable = "true";
        surveyProgressToggle.setAttribute(
          "aria-label",
          "Euclid survey progress map is unavailable"
        );
      }
      return null;
    }
  }

  function wrapDegrees360(value) {
    return ((value % 360) + 360) % 360;
  }

  function wrapDegrees180(value) {
    return wrapDegrees360(value + 180) - 180;
  }

  function solarStateUTC(date) {
    const degreesToRadians = Math.PI / 180;
    const radiansToDegrees = 180 / Math.PI;
    const julianDay = date.getTime() / 86_400_000 + 2_440_587.5;
    const centuries = (julianDay - 2_451_545) / 36_525;

    const meanLongitude = wrapDegrees360(
      280.46646 + centuries * (36_000.76983 + 0.0003032 * centuries)
    );
    const meanAnomalyDegrees =
      357.52911 + centuries * (35_999.05029 - 0.0001537 * centuries);
    const meanAnomaly = meanAnomalyDegrees * degreesToRadians;
    const eccentricity =
      0.016708634 - centuries * (0.000042037 + 0.0000001267 * centuries);
    const centre =
      Math.sin(meanAnomaly) *
        (1.914602 - centuries * (0.004817 + 0.000014 * centuries)) +
      Math.sin(2 * meanAnomaly) * (0.019993 - 0.000101 * centuries) +
      Math.sin(3 * meanAnomaly) * 0.000289;
    const omega = (125.04 - 1934.136 * centuries) * degreesToRadians;
    const apparentLongitudeDegrees =
      meanLongitude + centre - 0.00569 - 0.00478 * Math.sin(omega);
    const obliquitySeconds =
      21.448 -
      centuries * (46.815 + centuries * (0.00059 - centuries * 0.001813));
    const meanObliquityDegrees = 23 + (26 + obliquitySeconds / 60) / 60;
    const obliquityDegrees =
      meanObliquityDegrees + 0.00256 * Math.cos(omega);
    const apparentLongitude = apparentLongitudeDegrees * degreesToRadians;
    const obliquity = obliquityDegrees * degreesToRadians;
    const declination = Math.asin(
      Math.sin(obliquity) * Math.sin(apparentLongitude)
    );
    const equationFactor = Math.tan(obliquity / 2) ** 2;
    const meanLongitudeRadians = meanLongitude * degreesToRadians;
    const equationOfTimeMinutes =
      4 *
      radiansToDegrees *
      (
        equationFactor * Math.sin(2 * meanLongitudeRadians) -
        2 * eccentricity * Math.sin(meanAnomaly) +
        4 *
          eccentricity *
          equationFactor *
          Math.sin(meanAnomaly) *
          Math.cos(2 * meanLongitudeRadians) -
        0.5 *
          equationFactor *
          equationFactor *
          Math.sin(4 * meanLongitudeRadians) -
        1.25 * eccentricity * eccentricity * Math.sin(2 * meanAnomaly)
      );
    const utcMinutes =
      date.getUTCHours() * 60 +
      date.getUTCMinutes() +
      date.getUTCSeconds() / 60 +
      date.getUTCMilliseconds() / 60_000;
    const subsolarLongitudeDegrees = wrapDegrees180(
      (720 - utcMinutes - equationOfTimeMinutes) / 4
    );

    return {
      subsolarLatitudeDegrees: declination * radiansToDegrees,
      subsolarLongitudeDegrees,
      apparentLongitudeDegrees: wrapDegrees360(apparentLongitudeDegrees),
      obliquityDegrees
    };
  }

  function lunarStateUTC(date) {
    const degreesToRadians = Math.PI / 180;
    const julianDay = date.getTime() / 86_400_000 + 2_440_587.5;
    const centuries = (julianDay - 2_451_545) / 36_525;
    const centuries2 = centuries * centuries;
    const centuries3 = centuries2 * centuries;
    const centuries4 = centuries3 * centuries;
    const meanLongitude = wrapDegrees360(
      218.3164477 +
        481267.88123421 * centuries -
        0.0015786 * centuries2 +
        centuries3 / 538841 -
        centuries4 / 65194000
    );
    const elongation = wrapDegrees360(
      297.8501921 +
        445267.1114034 * centuries -
        0.0018819 * centuries2 +
        centuries3 / 545868 -
        centuries4 / 113065000
    );
    const solarAnomaly = wrapDegrees360(
      357.5291092 +
        35999.0502909 * centuries -
        0.0001536 * centuries2 +
        centuries3 / 24490000
    );
    const lunarAnomaly = wrapDegrees360(
      134.9633964 +
        477198.8675055 * centuries +
        0.0087414 * centuries2 +
        centuries3 / 69699 -
        centuries4 / 14712000
    );
    const argumentOfLatitude = wrapDegrees360(
      93.272095 +
        483202.0175233 * centuries -
        0.0036539 * centuries2 -
        centuries3 / 3526000 +
        centuries4 / 863310000
    );
    const auxiliary1 = wrapDegrees360(119.75 + 131.849 * centuries);
    const auxiliary2 = wrapDegrees360(53.09 + 479264.29 * centuries);
    const auxiliary3 = wrapDegrees360(313.45 + 481266.484 * centuries);
    const eccentricity =
      1 - 0.002516 * centuries - 0.0000074 * centuries2;

    let longitudeCorrection =
      3958 * Math.sin(auxiliary1 * degreesToRadians) +
      1962 *
        Math.sin((meanLongitude - argumentOfLatitude) * degreesToRadians) +
      318 * Math.sin(auxiliary2 * degreesToRadians);
    let radiusCorrection = 0;

    MOON_LONGITUDE_RADIUS_TERMS.forEach(
      ([d, m, lunarM, f, longitudeCoefficient, radiusCoefficient]) => {
        const scale = eccentricity ** Math.abs(m);
        const argument =
          (
            d * elongation +
            m * solarAnomaly +
            lunarM * lunarAnomaly +
            f * argumentOfLatitude
          ) *
          degreesToRadians;
        longitudeCorrection +=
          scale * longitudeCoefficient * Math.sin(argument);
        radiusCorrection += scale * radiusCoefficient * Math.cos(argument);
      }
    );

    let latitudeCorrection =
      -2235 * Math.sin(meanLongitude * degreesToRadians) +
      382 * Math.sin(auxiliary3 * degreesToRadians) +
      175 *
        Math.sin((auxiliary1 - argumentOfLatitude) * degreesToRadians) +
      175 *
        Math.sin((auxiliary1 + argumentOfLatitude) * degreesToRadians) +
      127 *
        Math.sin((meanLongitude - lunarAnomaly) * degreesToRadians) -
      115 *
        Math.sin((meanLongitude + lunarAnomaly) * degreesToRadians);

    MOON_LATITUDE_TERMS.forEach(([d, m, lunarM, f, coefficient]) => {
      const argument =
        (
          d * elongation +
          m * solarAnomaly +
          lunarM * lunarAnomaly +
          f * argumentOfLatitude
        ) *
        degreesToRadians;
      latitudeCorrection +=
        eccentricity ** Math.abs(m) * coefficient * Math.sin(argument);
    });

    const ascendingNode =
      (
        125.04452 -
        1934.136261 * centuries +
        0.0020708 * centuries2 +
        centuries3 / 450000
      ) *
      degreesToRadians;
    const nutationDegrees = -0.00478 * Math.sin(ascendingNode);

    return {
      longitudeDegrees: wrapDegrees360(
        meanLongitude +
          longitudeCorrection / 1_000_000 +
          nutationDegrees
      ),
      latitudeDegrees: latitudeCorrection / 1_000_000,
      distanceKilometres: 385000.56 + radiusCorrection / 1000
    };
  }

  function sampleJplPosition(body, date) {
    if (!lunarEphemeris || !Number.isInteger(lunarEphemeris.sampleCount) ||
        lunarEphemeris.sampleCount < 2 || !(lunarEphemeris.stepSeconds > 0)) return null;
    const positions = lunarEphemeris[`${body}Positions`];
    const velocities = lunarEphemeris[`${body}Velocities`];
    const count = lunarEphemeris.sampleCount;
    if (!positions || !velocities || positions.length !== count * 3 ||
        velocities.length !== count * 3) return null;
    const sampleIndex = (date.getTime() - lunarEphemeris.startMs) /
      (lunarEphemeris.stepSeconds * 1000);
    if (!Number.isFinite(sampleIndex) || sampleIndex < 0 || sampleIndex > count - 1) return null;
    const lower = Math.min(count - 2, Math.floor(sampleIndex));
    const fraction = sampleIndex - lower;
    const fraction2 = fraction * fraction;
    const fraction3 = fraction2 * fraction;
    const firstPositionWeight = 2 * fraction3 - 3 * fraction2 + 1;
    const lastPositionWeight = -2 * fraction3 + 3 * fraction2;
    const firstVelocityWeight = (fraction3 - 2 * fraction2 + fraction) * lunarEphemeris.stepSeconds;
    const lastVelocityWeight = (fraction3 - fraction2) * lunarEphemeris.stepSeconds;
    const result = new THREE.Vector3();
    for (let axis = 0; axis < 3; axis += 1) {
      const first = lower * 3 + axis;
      const last = first + 3;
      result.setComponent(axis,
        firstPositionWeight * positions[first] + lastPositionWeight * positions[last] +
        firstVelocityWeight * velocities[first] + lastVelocityWeight * velocities[last]
      );
    }
    return Number.isFinite(result.lengthSq()) ? result : null;
  }

  function lunarSceneOffset(date, frameSolarLongitudeDegrees) {
    const jplPosition = sampleJplPosition("moon", date);
    if (jplPosition) {
      const solarLongitude = frameSolarLongitudeDegrees * Math.PI / 180;
      const cosine = Math.cos(solarLongitude);
      const sine = Math.sin(solarLongitude);
      return {
        state: { distanceKilometres: jplPosition.length(), source: "JPL Horizons" },
        offset: new THREE.Vector3(
          -jplPosition.x * cosine - jplPosition.y * sine,
          jplPosition.z,
          jplPosition.x * sine - jplPosition.y * cosine
        ).multiplyScalar(WORLD_SCALE)
      };
    }
    const state = lunarStateUTC(date);
    state.source = "approximate";
    const degreesToRadians = Math.PI / 180;
    const longitude = state.longitudeDegrees * degreesToRadians;
    const latitude = state.latitudeDegrees * degreesToRadians;
    const cosineLatitude = Math.cos(latitude);
    const eclipticX = cosineLatitude * Math.cos(longitude);
    const eclipticY = cosineLatitude * Math.sin(longitude);
    const eclipticZ = Math.sin(latitude);
    const solarLongitude =
      frameSolarLongitudeDegrees * degreesToRadians;
    const cosineSolarLongitude = Math.cos(solarLongitude);
    const sineSolarLongitude = Math.sin(solarLongitude);
    const distance = state.distanceKilometres * WORLD_SCALE;

    return {
      state,
      offset: new THREE.Vector3(
        -eclipticX * cosineSolarLongitude -
          eclipticY * sineSolarLongitude,
        eclipticZ,
        eclipticX * sineSolarLongitude -
          eclipticY * cosineSolarLongitude
      ).multiplyScalar(distance)
    };
  }

  function updateMoonForDate(date, frameSolarLongitudeDegrees, force, mode) {
    const previousPosition = moon.group.position.clone();
    const moonState = lunarSceneOffset(
      date,
      frameSolarLongitudeDegrees
    );
    moon.group.position.copy(EARTH_POSITION).add(moonState.offset);
    if (activeView === "moon" && !cameraTransition) {
      const movement = moon.group.position.clone().sub(previousPosition);
      camera.position.add(movement);
      controls.target.add(movement);
    }
    moon.group.lookAt(EARTH_POSITION);
    // The map's centre (0° lunar longitude) lies on SphereGeometry's local
    // +X axis; Object3D.lookAt points local +Z at Earth.
    moon.group.rotateY(-Math.PI / 2);
    moon.material.userData.sunDirectionWorld
      .subVectors(SUN_POSITION, moon.group.position)
      .normalize();
    labelPosition.moon
      .copy(moon.group.position)
      .add(new THREE.Vector3(0, MOON_RADIUS + 0.025, 0));

    if (moonNowLabel) {
      const distance = Math.round(
        moonState.state.distanceKilometres / 100
      ) * 100;
      moonNowLabel.textContent =
        `${distance.toLocaleString("en-GB")} km from Earth · ${mode}` +
        (moonState.state.source === "approximate" ? " · approximate" : "");
    }

    const utcDay = Math.floor(date.getTime() / 86_400_000);
    if (force || utcDay !== lastMoonOrbitDay) {
      lastMoonOrbitDay = utcDay;
      rebuildMoonOrbit(date, frameSolarLongitudeDegrees);
    } else {
      moon.orbit.rotation.y = (frameSolarLongitudeDegrees -
        moon.orbit.userData.frameSolarLongitudeDegrees) * Math.PI / 180;
    }
  }

  function rebuildMoonOrbit(date, frameSolarLongitudeDegrees) {
    const points = [];
    const sampleCount = 128;
    const halfOrbitMilliseconds =
      (MOON_ORBIT_DAYS * 86_400_000) / 2;

    for (let index = 0; index <= sampleCount; index += 1) {
      const progress = index / sampleCount;
      const sampleDate = new Date(
        date.getTime() -
          halfOrbitMilliseconds +
          progress * halfOrbitMilliseconds * 2
      );
      const sample = lunarSceneOffset(
        sampleDate,
        frameSolarLongitudeDegrees
      );
      points.push(sample.offset);
    }

    moon.orbit.geometry.dispose();
    moon.orbit.geometry = new THREE.BufferGeometry().setFromPoints(points);
    moon.orbit.position.copy(EARTH_POSITION);
    moon.orbit.rotation.y = 0;
    moon.orbit.userData.frameSolarLongitudeDegrees = frameSolarLongitudeDegrees;
  }

  function orientEarthForUTC(date) {
    const degreesToRadians = Math.PI / 180;
    const state = solarStateUTC(date);
    const obliquity = state.obliquityDegrees * degreesToRadians;
    const solarLongitude =
      state.apparentLongitudeDegrees * degreesToRadians;
    const subsolarLongitude =
      state.subsolarLongitudeDegrees * degreesToRadians;
    const north = new THREE.Vector3(
      -Math.sin(obliquity) * Math.sin(solarLongitude),
      Math.cos(obliquity),
      Math.sin(obliquity) * Math.cos(solarLongitude)
    ).normalize();
    const noonEquator = SUNWARD_DIRECTION.clone()
      .addScaledVector(north, -north.dot(SUNWARD_DIRECTION))
      .normalize();
    const eastAtNoon = new THREE.Vector3()
      .crossVectors(north, noonEquator)
      .normalize();
    const cosineLongitude = Math.cos(subsolarLongitude);
    const sineLongitude = Math.sin(subsolarLongitude);
    const primeMeridian = noonEquator.clone()
      .multiplyScalar(cosineLongitude)
      .addScaledVector(eastAtNoon, -sineLongitude);
    const localZ = noonEquator.clone()
      .multiplyScalar(-sineLongitude)
      .addScaledVector(eastAtNoon, -cosineLongitude);
    const rotation = new THREE.Matrix4().makeBasis(
      primeMeridian,
      north,
      localZ
    );

    earth.surfaceGroup.quaternion.setFromRotationMatrix(rotation);
    return state;
  }

  function updateTerminatorTexture(state) {
    const { canvas, context, image, texture, latitudeSines, latitudeCosines,
      longitudeSines, longitudeCosines } = earth.terminator;
    const pixels = image.data;
    const width = canvas.width;
    const height = canvas.height;
    const degreesToRadians = Math.PI / 180;
    const solarLatitude =
      state.subsolarLatitudeDegrees * degreesToRadians;
    const solarLongitude =
      state.subsolarLongitudeDegrees * degreesToRadians;
    const sineSolarLatitude = Math.sin(solarLatitude);
    const cosineSolarLatitude = Math.cos(solarLatitude);
    const sineSolarLongitude = Math.sin(solarLongitude);
    const cosineSolarLongitude = Math.cos(solarLongitude);
    let offset = 0;

    for (let y = 0; y < height; y += 1) {
      const sineLatitude = latitudeSines[y];
      const cosineLatitude = latitudeCosines[y];

      for (let x = 0; x < width; x += 1) {
        const sunAmount =
          sineLatitude * sineSolarLatitude +
          cosineLatitude *
            cosineSolarLatitude *
            (longitudeCosines[x] * cosineSolarLongitude +
             longitudeSines[x] * sineSolarLongitude);
        const linearBlend = Math.max(
          0,
          Math.min(1, (sunAmount + 0.075) / 0.15)
        );
        const daylight =
          linearBlend * linearBlend * (3 - 2 * linearBlend);
        const value = Math.round(daylight * 255);
        pixels[offset] = value;
        pixels[offset + 1] = value;
        pixels[offset + 2] = value;
        pixels[offset + 3] = 255;
        offset += 4;
      }
    }

    context.putImageData(image, 0, 0);
    texture.needsUpdate = true;
  }

  function surveyDateForTimeline() {
    if (showingCurrentTime) {
      const now = new Date();
      const state = trajectoryStateAt(now.getTime());
      return state.withinRange
        ? now
        : new Date(trajectoryTimes[state.lowerIndex]);
    }
    const boundedIndex = Math.max(
      0,
      Math.min(lastIndex, Math.round(currentIndex))
    );
    return new Date(trajectoryTimes[boundedIndex]);
  }

  function updateReleasedSkyFeatures(date) {
    const selectedTime = date instanceof Date ? date.getTime() : NaN;
    if (!Number.isFinite(selectedTime)) return;

    [firstMosaicFeature, galacticCentreFeature].forEach((feature) => {
      const visible =
        feature.textureReady &&
        selectedTime >= feature.releaseTime;
      feature.group.visible = visible;
      if (!visible) {
        setSkyFeatureHighlighted(feature, false);
        setSkyFeatureHotspotVisible(feature.hotspotElement, false);
      }
    });
  }

  function updateGalacticObservationFootprint(date) {
    const selectedTime = date instanceof Date ? date.getTime() : NaN;
    const observationComplete =
      Number.isFinite(selectedTime) &&
      selectedTime >= GALACTIC_BULGE_OBSERVATION_COMPLETE_TIME;
    const visible =
      surveyProgressLoaded &&
      surveyProgressVisible &&
      galacticObservationFootprint.textureReady &&
      observationComplete;
    galacticObservationFootprint.group.visible = visible;
    if (surveyProgressKey) surveyProgressKey.hidden = !visible;
    return {
      observationComplete,
      visible,
      available: galacticObservationFootprint.textureReady
    };
  }

  function updateSurveyProgressForDate(date, force = false) {
    updateReleasedSkyFeatures(date);
    const galacticFootprintState =
      updateGalacticObservationFootprint(date);
    if (
      !surveyProgressLoaded ||
      !Number.isFinite(SURVEY_SCHEDULE_EPOCH_TIME) ||
      !Number.isFinite(SURVEY_SCHEDULE_START_TIME) ||
      !Number.isFinite(SURVEY_SCHEDULE_END_TIME)
    ) {
      return;
    }

    const utcHour = Math.floor(date.getTime() / 3_600_000);
    if (!force && utcHour === lastSurveyProgressHour) return;
    lastSurveyProgressHour = utcHour;

    const selectedTime = date.getTime();
    const boundedTime = Math.max(
      SURVEY_SCHEDULE_EPOCH_TIME,
      Math.min(selectedTime, SURVEY_SCHEDULE_END_TIME)
    );
    const cutoffHour =
      selectedTime < SURVEY_SCHEDULE_START_TIME
        ? 0
        : Math.floor(
            (boundedTime - SURVEY_SCHEDULE_EPOCH_TIME) / 3_600_000
          ) + (selectedTime >= SURVEY_SCHEDULE_END_TIME ? 1 : 0);
    surveyProgress.material.uniforms.uCutoffHour.value = cutoffHour;

    const formattedDate = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Europe/London"
    }).format(date);
    const beforeSchedule = selectedTime < SURVEY_SCHEDULE_START_TIME;
    const afterSchedule = selectedTime >= SURVEY_SCHEDULE_END_TIME;
    if (surveyProgressCaption) {
      surveyProgressCaption.textContent = beforeSchedule
        ? `Not started · ${formattedDate}`
        : afterSchedule
          ? `Full reference plan · ${formattedDate}`
          : `Scheduled through · ${formattedDate}`;
    }
    if (surveyProgressToggle) {
      const dateContext = beforeSchedule
        ? `coverage; none is scheduled by ${formattedDate}`
        : afterSchedule
          ? `coverage; full reference plan reached by ${formattedDate}`
          : `coverage through ${formattedDate}`;
      const galacticFootprintContext =
        galacticFootprintState.available &&
        galacticFootprintState.observationComplete
          ? "; outlined amber marks the special Galactic Centre observation"
          : "";
      surveyProgressToggle.setAttribute(
        "aria-label",
        `Survey progress: ${surveyProgressVisible ? "hide" : "show"} Euclid planned survey ` +
          dateContext +
          galacticFootprintContext
      );
    }
    return {
      formattedDate,
      beforeSchedule,
      afterSchedule,
      galacticFootprintVisible: galacticFootprintState.visible
    };
  }

  function setSurveyProgressVisible(visible, moveCamera) {
    if (!surveyProgressLoaded || !surveyProgressToggle) return;
    surveyProgressVisible = Boolean(visible);
    surveyProgress.mesh.visible = surveyProgressVisible;
    host.classList.toggle(
      "survey-progress-active",
      surveyProgressVisible
    );
    surveyProgressToggle.setAttribute(
      "aria-pressed",
      String(surveyProgressVisible)
    );
    const selectedDate = surveyDateForTimeline();
    const progressState = updateSurveyProgressForDate(selectedDate, true);

    if (surveyProgressVisible && moveCamera) {
      setView("survey", true);
    } else if (
      !surveyProgressVisible &&
      moveCamera &&
      (
        activeView === "survey" ||
        (!activeView && lastChosenView === "survey")
      )
    ) {
      setView(lastObjectView, true);
    }

    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => {
      if (!screenReaderStatus) return;
      if (!surveyProgressVisible) {
        screenReaderStatus.textContent =
          "Euclid planned survey coverage hidden.";
        return;
      }
      const coverageAnnouncement =
        progressState && progressState.beforeSchedule
          ? `No Euclid reference-schedule coverage exists by ` +
            `${progressState.formattedDate}.`
          : progressState && progressState.afterSchedule
            ? `Showing the full Euclid RSD2026a reference survey plan by ` +
              `${progressState.formattedDate}.`
          : `Showing Euclid planned survey coverage through ` +
            `${progressState ? progressState.formattedDate : "the selected date"}, ` +
            "based on the RSD2026a reference schedule.";
      screenReaderStatus.textContent =
        coverageAnnouncement +
        (
          progressState && progressState.galacticFootprintVisible
            ? " The outlined amber area marks the Galactic Centre " +
              "special observation completed on 24 March 2025."
            : ""
        );
    }, 80);
  }

  function updateSceneForDate(date, force = false, mode = showingCurrentTime ? "now" : "selected") {
    const sceneMinute = Math.floor(date.getTime() / 60_000);
    if (!force && sceneMinute === lastSceneMinute && mode === lastSceneMode) return;
    lastSceneMinute = sceneMinute;
    lastSceneMode = mode;
    const sunPosition = sampleJplPosition("sun", date);
    if (sunPosition) {
      const previousPosition = sun.position.clone();
      SUN_POSITION.set(
        EARTH_POSITION.x - Math.hypot(sunPosition.x, sunPosition.y) * WORLD_SCALE,
        sunPosition.z * WORLD_SCALE,
        0
      );
      sun.position.copy(SUN_POSITION);
      sunlight.position.copy(SUN_POSITION);
      SUNWARD_DIRECTION.subVectors(SUN_POSITION, EARTH_POSITION).normalize();
      earth.atmosphereMaterial.uniforms.sunDirectionWorld.value.copy(SUNWARD_DIRECTION);
      labelPosition.sun.copy(SUN_POSITION).add(new THREE.Vector3(0, 0.9, 0));
      if (activeView === "sun" && !cameraTransition) {
        const movement = sun.position.clone().sub(previousPosition);
        camera.position.add(movement);
        controls.target.add(movement);
      }
    }
    const state = orientEarthForUTC(date);
    updateTerminatorTexture(state);
    const frameSolarLongitude = sunPosition
      ? wrapDegrees360(Math.atan2(sunPosition.y, sunPosition.x) * 180 / Math.PI)
      : state.apparentLongitudeDegrees;
    starField.rotation.y =
      frameSolarLongitude * (Math.PI / 180);
    updateMoonForDate(date, frameSolarLongitude, force, mode);
    updateSpacecraftAttitude(currentCraftPosition);

    if (earthNowLabel) {
      earthNowLabel.textContent = `Day/night ${mode} · ${formatUKTime(date)}`;
    }
  }

  function refreshSceneTime(force = false) {
    if (!showingCurrentTime) return;
    const date = new Date();
    const clockMinute = Math.floor(date.getTime() / 60_000);
    if (!force && clockMinute === lastClockMinute) return;
    lastClockMinute = clockMinute;
    setTrajectoryNow(false, date);
  }

  function makeSun() {
    const group = new THREE.Group();
    group.position.copy(SUN_POSITION);
    const material = new THREE.MeshBasicMaterial({
      map: makeSolidTexture(255, 150, 40),
      color: 0xffffff,
      toneMapped: false
    });
    const surface = new THREE.Mesh(
      new THREE.SphereGeometry(0.696, 64, 40),
      material
    );
    group.userData.surfaceMaterial = material;
    group.add(surface);
    return group;
  }

  function makeSkyFrameTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 160;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.shadowColor = "rgba(255,255,255,0.55)";
    context.shadowBlur = 12;
    context.strokeStyle = "rgba(255,255,255,0.72)";
    context.lineWidth = 2;
    context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    context.restore();
    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    return texture;
  }

  function normaliseManoeuvreData(records) {
    if (!Array.isArray(records)) return [];

    return records.map((record, index) => {
      const x = Number(record && record.x);
      const y = Number(record && record.y);
      const z = Number(record && record.z);
      const deltaV = Number(record && record.deltaV);
      const sourceDate = String(record && record.date || "").trim();
      const isoDate = sourceDate.replace(" ", "T");
      const timestamp = Date.parse(
        /(?:Z|[+-]\d{2}:\d{2})$/i.test(isoDate)
          ? isoDate
          : `${isoDate}Z`
      );

      if (
        ![x, y, z, deltaV, timestamp].every(Number.isFinite) ||
        !sourceDate
      ) {
        return null;
      }

      return {
        index,
        timestamp,
        deltaV: deltaV.toFixed(5),
        position: new THREE.Vector3(
          (x - WORLD_CENTRE_X) * WORLD_SCALE,
          z * WORLD_SCALE,
          y * WORLD_SCALE
        )
      };
    }).filter(Boolean);
  }

  function makeManoeuvrePointTexture(halo) {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    const gradient = context.createRadialGradient(32, 32, 2, 32, 32, 31);

    if (halo) {
      gradient.addColorStop(0, "rgba(255,238,198,.96)");
      gradient.addColorStop(0.22, "rgba(217,156,43,.9)");
      gradient.addColorStop(0.48, "rgba(217,156,43,.3)");
      gradient.addColorStop(1, "rgba(217,156,43,0)");
    } else {
      gradient.addColorStop(0, "rgba(255,239,204,1)");
      gradient.addColorStop(0.5, "rgba(231,174,65,1)");
      gradient.addColorStop(0.72, "rgba(217,156,43,1)");
      gradient.addColorStop(0.76, "rgba(0,2,5,.9)");
      gradient.addColorStop(1, "rgba(0,2,5,0)");
    }

    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.encoding = THREE.sRGBEncoding;
    return texture;
  }

  function makeManoeuvreMarkers() {
    const group = new THREE.Group();
    group.name = "Euclid commanded orbit manoeuvres";

    const positions = [];
    manoeuvreData.forEach((event) => {
      positions.push(event.position.x, event.position.y, event.position.z);
    });

    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    if (positions.length) pointGeometry.computeBoundingSphere();

    const points = new THREE.Points(
      pointGeometry,
      new THREE.PointsMaterial({
        color: 0xffffff,
        map: makeManoeuvrePointTexture(false),
        size: isCompact() ? 6 : 5,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.9,
        alphaTest: 0.08,
        depthTest: true,
        depthWrite: false,
        toneMapped: false
      })
    );
    points.renderOrder = 10;
    group.add(points);

    const haloPositions = new Float32Array(
      Math.max(1, manoeuvreData.length) * 3
    );
    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(haloPositions, 3)
    );
    haloGeometry.setDrawRange(0, 0);

    const halo = new THREE.Points(
      haloGeometry,
      new THREE.PointsMaterial({
        color: 0xffffff,
        map: makeManoeuvrePointTexture(true),
        size: isCompact() ? 14 : 12,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.96,
        alphaTest: 0.02,
        depthTest: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false
      })
    );
    halo.frustumCulled = false;
    halo.renderOrder = 11;
    halo.visible = false;
    group.add(halo);

    return { group, points, halo };
  }

  function setManoeuvreHalo(selection) {
    const halo = manoeuvreLayer.halo;
    const geometry = halo.geometry;
    const attribute = geometry.getAttribute("position");

    if (!selection) {
      geometry.setDrawRange(0, 0);
      halo.visible = false;
      return;
    }

    const highlightedEvents = selection.highlightEvents || selection.events;
    highlightedEvents.forEach((event, index) => {
      event.position.toArray(attribute.array, index * 3);
    });
    attribute.needsUpdate = true;
    geometry.setDrawRange(0, highlightedEvents.length);
    halo.visible = Boolean(highlightedEvents.length);
  }

  function isManoeuvreOccluded(position) {
    manoeuvreRayDirection.subVectors(position, camera.position);
    const markerDistance = manoeuvreRayDirection.length();
    if (markerDistance <= 0.001) return false;

    manoeuvreRay.set(
      camera.position,
      manoeuvreRayDirection.multiplyScalar(1 / markerDistance)
    );
    manoeuvreMoonSphere.center.copy(moon.group.position);

    const earthHit = manoeuvreRay.intersectSphere(
      manoeuvreEarthSphere,
      manoeuvreIntersection
    );
    if (
      earthHit &&
      earthHit.distanceTo(camera.position) < markerDistance - 0.004
    ) {
      return true;
    }

    const moonHit = manoeuvreRay.intersectSphere(
      manoeuvreMoonSphere,
      manoeuvreIntersection
    );
    return Boolean(
      moonHit &&
      moonHit.distanceTo(camera.position) < markerDistance - 0.002
    );
  }

  function pickManoeuvreSelection(clientX, clientY, radius) {
    if (!manoeuvreData.length) return null;

    const bounds = renderer.domElement.getBoundingClientRect();
    if (
      clientX < bounds.left ||
      clientX > bounds.right ||
      clientY < bounds.top ||
      clientY > bounds.bottom
    ) {
      return null;
    }

    const visibleEvents = [];
    manoeuvreData.forEach((event) => {
      manoeuvreProjected.copy(event.position).project(camera);
      if (
        manoeuvreProjected.z <= -1 ||
        manoeuvreProjected.z >= 1 ||
        Math.abs(manoeuvreProjected.x) > 1 ||
        Math.abs(manoeuvreProjected.y) > 1 ||
        isManoeuvreOccluded(event.position)
      ) {
        return;
      }

      const x =
        bounds.left +
        (manoeuvreProjected.x * 0.5 + 0.5) * bounds.width;
      const y =
        bounds.top +
        (-manoeuvreProjected.y * 0.5 + 0.5) * bounds.height;
      const dx = x - clientX;
      const dy = y - clientY;
      visibleEvents.push({
        event,
        x,
        y,
        depth: manoeuvreProjected.z,
        distanceSquared: dx * dx + dy * dy
      });
    });

    const candidates = visibleEvents
      .filter((candidate) => candidate.distanceSquared <= radius * radius)
      .sort((first, second) =>
        first.distanceSquared - second.distanceSquared ||
        first.depth - second.depth
      );
    if (!candidates.length) return null;

    const nearest = candidates[0];
    if (lastChosenView === "solar") {
      return {
        key: `solar-summary:${nearest.event.index}`,
        summary: true,
        events: manoeuvreData,
        highlightEvents: [nearest.event],
        position: nearest.event.position
      };
    }

    const clusterRadius = isCompact() ? 7 : 6;
    const clusteredEvents = visibleEvents
      .filter((candidate) =>
        Math.hypot(candidate.x - nearest.x, candidate.y - nearest.y) <=
        clusterRadius
      )
      .sort((first, second) => first.event.timestamp - second.event.timestamp)
      .map((candidate) => candidate.event);

    return {
      key: clusteredEvents.map((event) => event.index).join(","),
      events: clusteredEvents,
      position: nearest.event.position
    };
  }

  function focusSceneObject(view) {
    lastEmptyTap = null;
    if (surveyProgressVisible) setSurveyProgressVisible(false, false);
    setView(view, true);
    const name = view === "solar" ? "Sun–Earth overview" : view === "l2" ? "Earth and L2" :
      view === "euclid" ? "Euclid" : view.charAt(0).toUpperCase() + view.slice(1);
    screenReaderStatus.textContent = `Camera focused on ${name}.`;
  }

  function pickSceneObject(clientX, clientY, radius = 10) {
    const bounds = renderer.domElement.getBoundingClientRect();
    if (clientX < bounds.left || clientX > bounds.right ||
        clientY < bounds.top || clientY > bounds.bottom) return null;
    camera.updateMatrixWorld();
    objectPointer.set(
      ((clientX - bounds.left) / bounds.width) * 2 - 1,
      -((clientY - bounds.top) / bounds.height) * 2 + 1
    );
    objectPicker.setFromCamera(objectPointer, camera);
    const objects = [
      { view: "earth", mesh: earth.sphere, radius: EARTH_RADIUS },
      { view: "moon", mesh: moon.surface, radius: MOON_RADIUS },
      { view: "sun", mesh: sun.children[0], radius: 0.696 },
      { view: "euclid", mesh: spacecraftModel || craftLocator,
        radius: spacecraftModel ? spacecraftModel.userData.fadeRadius : 0.011 }
    ];
    let nearest = null;
    objects.forEach((object) => {
      object.mesh.updateWorldMatrix(true, true);
      const hit = objectPicker.intersectObject(object.mesh, true)[0];
      if (hit && (!nearest || hit.distance < nearest.distance)) {
        nearest = { view: object.view, distance: hit.distance };
      }
    });
    if (nearest) return nearest.view;

    const pixelsToWorld = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) /
      bounds.height;
    objects.forEach((object) => {
      object.mesh.getWorldPosition(objectPickPosition);
      const viewDepth = objectPickPosition.clone().applyMatrix4(camera.matrixWorldInverse).z;
      if (viewDepth >= -camera.near || viewDepth <= -camera.far) return;
      objectPickSphere.set(
        objectPickPosition,
        Math.max(object.radius, -viewDepth * pixelsToWorld * radius)
      );
      const hit = objectPicker.ray.intersectSphere(objectPickSphere, objectPickIntersection);
      if (!hit) return;
      const distance = hit.distanceTo(camera.position);
      if (!nearest || distance < nearest.distance) {
        nearest = { view: object.view, distance };
      }
    });
    return nearest ? nearest.view : null;
  }

  function beginManoeuvrePointer(event) {
    if (event.button !== 0) return;
    activePointerIds.add(event.pointerId);
    if (activePointerIds.size > 1) lastEmptyTap = null;
    pointerStart = activePointerIds.size === 1
      ? {
          pointerId: event.pointerId,
          pointerType: event.pointerType,
          x: event.clientX,
          y: event.clientY,
          moved: false
        }
      : null;
  }

  function hoverManoeuvrePointer(event) {
    if (pointerStart && pointerStart.pointerId === event.pointerId &&
        Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 8) {
      pointerStart.moved = true;
    }
    if (
      event.pointerType === "touch" ||
      event.buttons !== 0 ||
      controlsActive
    ) {
      return;
    }

    lastHoverPointer = {
      pointerType: event.pointerType,
      x: event.clientX,
      y: event.clientY
    };
    refreshHoveredManoeuvre();
  }

  function selectManoeuvrePointer(event) {
    const wasOnlyPointer = activePointerIds.size === 1;
    activePointerIds.delete(event.pointerId);
    if (
      !pointerStart ||
      pointerStart.pointerId !== event.pointerId ||
      !wasOnlyPointer
    ) {
      pointerStart = null;
      return;
    }

    const movement = Math.hypot(
      event.clientX - pointerStart.x,
      event.clientY - pointerStart.y
    );
    const pointerType = pointerStart.pointerType;
    const moved = pointerStart.moved;
    pointerStart = null;
    if (moved || movement > 8) {
      lastEmptyTap = null;
      return;
    }

    const radius = pointerType === "touch"
      ? 22
      : pointerType === "pen"
        ? 18
        : 10;
    const objectView = pickSceneObject(event.clientX, event.clientY, radius);
    if (objectView) {
      focusSceneObject(objectView);
      return;
    }
    const skyFeature = pickSkyFeature(event.clientX, event.clientY);
    if (skyFeature && skyFeature.hotspotElement) {
      lastEmptyTap = null;
      pinnedManoeuvreSelection = null;
      setActiveManoeuvre(null);
      skyFeature.hotspotElement.click();
      return;
    }
    const selection = pickManoeuvreSelection(
      event.clientX,
      event.clientY,
      radius
    );

    if (!selection) {
      pinnedManoeuvreSelection = null;
      setActiveManoeuvre(null);
      renderer.domElement.style.cursor = "";
      const now = performance.now();
      if (lastEmptyTap && now - lastEmptyTap.time < 400 &&
          Math.hypot(event.clientX - lastEmptyTap.x, event.clientY - lastEmptyTap.y) < 24) {
        focusSceneObject("solar");
      } else {
        lastEmptyTap = { time: now, x: event.clientX, y: event.clientY };
      }
      return;
    }

    lastEmptyTap = null;
    const toggledOff =
      pinnedManoeuvreSelection &&
      pinnedManoeuvreSelection.key === selection.key;
    pinnedManoeuvreSelection = toggledOff ? null : selection;
    setActiveManoeuvre(
      pinnedManoeuvreSelection ||
        (pointerType === "touch" ? null : selection),
      !toggledOff
    );
  }

  function cancelManoeuvrePointer(event) {
    lastEmptyTap = null;
    activePointerIds.delete(event.pointerId);
    if (pointerStart && pointerStart.pointerId === event.pointerId) {
      pointerStart = null;
    }
  }

  function leaveManoeuvrePointer(event) {
    if (event.pointerType === "touch") return;
    lastHoverPointer = null;
    setSkyFeatureHighlighted(galacticCentreFeature, false, "canvas");
    setSkyFeatureHighlighted(firstMosaicFeature, false, "canvas");
    renderer.domElement.style.cursor = "";
    setActiveManoeuvre(pinnedManoeuvreSelection);
  }

  function refreshHoveredManoeuvre() {
    if (!lastHoverPointer || controlsActive) return;
    const radius = lastHoverPointer.pointerType === "pen" ? 18 : 10;
    const objectView = pickSceneObject(lastHoverPointer.x, lastHoverPointer.y, radius);
    const skyFeature = objectView ? null : pickSkyFeature(
      lastHoverPointer.x,
      lastHoverPointer.y
    );
    setSkyFeatureHighlighted(
      galacticCentreFeature,
      skyFeature === galacticCentreFeature,
      "canvas"
    );
    setSkyFeatureHighlighted(
      firstMosaicFeature,
      skyFeature === firstMosaicFeature,
      "canvas"
    );
    const selection = skyFeature || objectView
      ? null
      : pickManoeuvreSelection(
          lastHoverPointer.x,
          lastHoverPointer.y,
          radius
        );
    renderer.domElement.style.cursor =
      objectView || skyFeature || selection ? "pointer" : "";
    setActiveManoeuvre(selection || pinnedManoeuvreSelection);
  }

  function setActiveManoeuvre(selection, announce) {
    const unchanged =
      activeManoeuvreSelection &&
      selection &&
      activeManoeuvreSelection.key === selection.key;
    activeManoeuvreSelection = selection;

    if (!unchanged) {
      setManoeuvreHalo(selection);
      updateManoeuvreTooltipContent(selection);
    }

    if (announce && selection) announceManoeuvre(selection);
    if (!selection && manoeuvreTooltip) {
      manoeuvreTooltip.style.opacity = "0";
      manoeuvreTooltip.setAttribute("aria-hidden", "true");
    }
  }

  function updateManoeuvreTooltipContent(selection) {
    if (
      !manoeuvreTooltip ||
      !manoeuvreKicker ||
      !manoeuvreDateLabel ||
      !manoeuvreDeltaVLabel
    ) {
      return;
    }

    if (!selection) {
      manoeuvreTooltip.style.opacity = "0";
      manoeuvreTooltip.setAttribute("aria-hidden", "true");
      return;
    }

    if (selection.summary) {
      manoeuvreKicker.textContent = "Orbit manoeuvres";
      manoeuvreDateLabel.textContent =
        `${selection.events.length} recorded points`;
      manoeuvreDeltaVLabel.textContent =
        "Choose Earth + L2 to inspect individual manoeuvres";
      return;
    }

    if (selection.events.length > 1) {
      manoeuvreKicker.textContent = "Orbit manoeuvres";
      manoeuvreDateLabel.textContent =
        `${selection.events.length} manoeuvres close together`;
      manoeuvreDeltaVLabel.textContent = selection.events
        .map((event) =>
          `${formatManoeuvreDate(event, true)} · Δv ${event.deltaV}`
        )
        .join("\n");
      return;
    }

    const event = selection.events[0];
    manoeuvreKicker.textContent = "Orbit manoeuvre";
    manoeuvreDateLabel.textContent = formatManoeuvreDate(event, false);
    manoeuvreDeltaVLabel.textContent =
      `Commanded Δv: ${event.deltaV}`;
  }

  function updateManoeuvreTooltip() {
    if (!manoeuvreTooltip || !activeManoeuvreSelection) return;

    manoeuvreProjected
      .copy(activeManoeuvreSelection.position)
      .project(camera);
    const visible =
      manoeuvreProjected.z > -1 &&
      manoeuvreProjected.z < 1 &&
      Math.abs(manoeuvreProjected.x) <= 1.04 &&
      Math.abs(manoeuvreProjected.y) <= 1.04 &&
      !isManoeuvreOccluded(activeManoeuvreSelection.position);
    if (!visible) {
      manoeuvreTooltip.style.opacity = "0";
      manoeuvreTooltip.setAttribute("aria-hidden", "true");
      return;
    }

    const width = host.clientWidth;
    const height = host.clientHeight;
    const markerX = (manoeuvreProjected.x * 0.5 + 0.5) * width;
    const markerY = (-manoeuvreProjected.y * 0.5 + 0.5) * height;
    const tooltipWidth = manoeuvreTooltip.offsetWidth || 178;
    const tooltipHeight = manoeuvreTooltip.offsetHeight || 70;
    const halfWidth = tooltipWidth / 2;
    const topClearance = 88;
    const bottomClearance = isCompact() ? 202 : 118;
    const contentBottom = Math.max(
      topClearance + tooltipHeight,
      height - bottomClearance
    );
    const x = Math.max(
      12 + halfWidth,
      Math.min(width - 12 - halfWidth, markerX)
    );
    const arrowX = Math.max(
      12,
      Math.min(tooltipWidth - 12, markerX - (x - halfWidth))
    );
    manoeuvreTooltip.style.setProperty(
      "--tooltip-arrow-x",
      `${arrowX}px`
    );
    const canPlaceAbove =
      markerY - 14 - tooltipHeight >= topClearance;

    if (canPlaceAbove) {
      const anchorY = Math.max(
        topClearance + tooltipHeight,
        Math.min(contentBottom, markerY - 14)
      );
      manoeuvreTooltip.dataset.placement = "above";
      manoeuvreTooltip.style.transform =
        `translate3d(${x}px, ${anchorY}px, 0) translate(-50%, -100%)`;
    } else {
      const top = Math.max(
        topClearance,
        Math.min(contentBottom - tooltipHeight, markerY + 14)
      );
      manoeuvreTooltip.dataset.placement = "below";
      manoeuvreTooltip.style.transform =
        `translate3d(${x}px, ${top}px, 0) translate(-50%, 0)`;
    }

    manoeuvreTooltip.style.opacity = "1";
    manoeuvreTooltip.setAttribute("aria-hidden", "false");
  }

  function formatManoeuvreDate(event, compact) {
    const date = new Date(event.timestamp);
    const dateLabel = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: compact ? "short" : "long",
      year: "numeric",
      timeZone: "Europe/London"
    }).format(date);
    return `${dateLabel} · ${formatUKTime(date, true)}`;
  }

  function announceManoeuvre(selection) {
    if (!screenReaderStatus) return;
    if (selection.summary) {
      screenReaderStatus.textContent =
        `${selection.events.length} commanded orbit manoeuvres. ` +
        "Choose the Earth and L2 view to inspect them.";
      return;
    }

    const descriptions = selection.events.map((event) =>
      `${formatManoeuvreDate(event, false)}, commanded delta-v ` +
      `${event.deltaV}`
    );
    screenReaderStatus.textContent =
      `${descriptions.join("; ")}. The source does not state the delta-v unit.`;
  }

  function populateManoeuvreList() {
    if (!manoeuvreListItems || !manoeuvreData.length) return;
    const fragment = document.createDocumentFragment();
    manoeuvreData.forEach((event) => {
      const item = document.createElement("li");
      item.textContent =
        `${formatManoeuvreDate(event, false)} — commanded delta-v ` +
        `${event.deltaV}; source unit not stated.`;
      fragment.appendChild(item);
    });
    manoeuvreListItems.replaceChildren(fragment);
  }

  function makeOrbit() {
    const group = new THREE.Group();
    const spacecraftFade = { value: new THREE.Vector4() };
    group.userData.spacecraftFade = spacecraftFade;
    group.userData.fadePosition = new THREE.Vector3();
    group.userData.fadeViewPosition = new THREE.Vector3();
    group.userData.fadeViewport = new THREE.Vector2();

    function addOrbitSegment(points, pathOpacity) {
      if (points.length < 2) return;
      const curve = new THREE.CatmullRomCurve3(
        points,
        false,
        "centripetal",
        0.35
      );
      const segments = Math.min(points.length - 1, 1350);
      const path = new THREE.Mesh(
        new THREE.TubeGeometry(curve, segments, 0.0018, 6, false),
        new THREE.MeshBasicMaterial({
          color: 0xdce2e6,
          transparent: true,
          opacity: pathOpacity,
          depthWrite: false,
          toneMapped: false
        })
      );
      path.material.onBeforeCompile = (shader) => {
        shader.uniforms.uSpacecraftFade = spacecraftFade;
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            "#include <common>\nuniform vec4 uSpacecraftFade;"
          )
          .replace(
            "#include <color_fragment>",
            [
              "#include <color_fragment>",
              "if (uSpacecraftFade.z > 0.0) {",
              "  float distanceToCraft = distance(gl_FragCoord.xy, uSpacecraftFade.xy);",
              "  float orbitVisibility = smoothstep(0.0, uSpacecraftFade.z, distanceToCraft);",
              "  diffuseColor.a *= mix(uSpacecraftFade.w, 1.0, orbitVisibility);",
              "}"
            ].join("\n")
          );
      };
      path.material.customProgramCacheKey = () => "orbit-spacecraft-fade-v1";
      group.add(path);
    }

    addOrbitSegment(
      orbitPoints.slice(0, sourceBoundaryIndex + 1),
      0.72
    );
    addOrbitSegment(
      orbitPoints.slice(sourceBoundaryIndex),
      0.36
    );
    return group;
  }

  function updateOrbitSpacecraftFade() {
    const fade = orbit.userData.spacecraftFade.value;
    const projected = orbit.userData.fadePosition;
    const viewPosition = orbit.userData.fadeViewPosition;
    const viewport = orbit.userData.fadeViewport;
    camera.updateMatrixWorld();
    spacecraftAnchor.getWorldPosition(projected);
    viewPosition.copy(projected).applyMatrix4(camera.matrixWorldInverse);
    projected.project(camera);
    if (viewPosition.z >= 0 || projected.z <= -1 || projected.z >= 1) {
      fade.z = 0;
      return;
    }
    renderer.getDrawingBufferSize(viewport);
    const pixelRatio = renderer.getPixelRatio();
    const worldRadius = spacecraftModel
      ? spacecraftModel.userData.fadeRadius
      : craftLocator.geometry.parameters.radius;
    const projectedRadius = worldRadius * camera.projectionMatrix.elements[5] *
      viewport.y / (2 * -viewPosition.z);
    fade.set(
      (projected.x * 0.5 + 0.5) * viewport.x,
      (projected.y * 0.5 + 0.5) * viewport.y,
      Math.max(18 * pixelRatio, projectedRadius * 1.8 + 8 * pixelRatio),
      0.25
    );
  }

  function loadSpacecraftModel() {
    loadingMessage.textContent = "Loading the Euclid spacecraft";
    const loader = new THREE.GLTFLoader();

    return new Promise((resolve, reject) => {
      const onLoad = (gltf) => {
        const sourceModel = gltf.scene;
        sourceModel.updateMatrixWorld(true);

        const bounds = new THREE.Box3().setFromObject(sourceModel);
        const size = bounds.getSize(new THREE.Vector3());
        const centre = bounds.getCenter(new THREE.Vector3());
        const maxExtent = Math.max(size.x, size.y, size.z);
        if (!Number.isFinite(maxExtent) || maxExtent <= 0) {
          reject(new Error("The Euclid spacecraft model has invalid bounds."));
          return;
        }

        const centredModel = new THREE.Group();
        centredModel.add(sourceModel);
        centredModel.position.copy(centre).multiplyScalar(-1);

        spacecraftModel = new THREE.Group();
        spacecraftModel.add(centredModel);
        spacecraftModel.scale.setScalar(SPACECRAFT_DISPLAY_SIZE / maxExtent);
        spacecraftModel.userData.fadeRadius =
          size.length() * 0.5 * SPACECRAFT_DISPLAY_SIZE / maxExtent;

        const maxAnisotropy = Math.min(
          8,
          renderer.capabilities.getMaxAnisotropy()
        );
        spacecraftModel.traverse((object) => {
          if (!object.isMesh) return;
          object.frustumCulled = false;
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.filter(Boolean).forEach((material) => {
            material.envMapIntensity = 0.7;
            [
              material.map,
              material.normalMap,
              material.metalnessMap,
              material.roughnessMap
            ]
              .filter(Boolean)
              .forEach((texture) => {
                texture.anisotropy = maxAnisotropy;
                texture.needsUpdate = true;
              });
            material.needsUpdate = true;
          });
        });
        spacecraftAnchor.add(spacecraftModel);
        craftLocator.visible = false;
        resolve(spacecraftModel);
      };

      if (window.EUCLID_SPACECRAFT_GLB_BASE64) {
        try {
          const encoded = window.EUCLID_SPACECRAFT_GLB_BASE64;
          window.EUCLID_SPACECRAFT_GLB_BASE64 = null;
          const binary = window.atob(encoded);
          const bytes = new Uint8Array(binary.length);
          for (let index = 0; index < binary.length; index += 1) {
            bytes[index] = binary.charCodeAt(index);
          }
          loader.parse(bytes.buffer, "", onLoad, reject);
        } catch (error) {
          reject(error);
        }
        return;
      }

      loader.load(
        "assets/models/euclid/euclid-spacecraft.glb?v=20260730-2",
        onLoad,
        (event) => {
          if (!event.total) return;
          const percentage = Math.round((event.loaded / event.total) * 100);
          loadingMessage.textContent = `Loading the Euclid spacecraft · ${percentage}%`;
        },
        reject
      );
    });
  }

  function cameraPreset(view) {
    if (view === "earth" || view === "moon" || view === "sun") {
      const target = view === "earth" ? EARTH_POSITION.clone() :
        view === "moon" ? moon.group.position.clone() : SUN_POSITION.clone();
      const radius = view === "earth" ? EARTH_RADIUS : view === "moon" ? MOON_RADIUS : 0.696;
      const direction = camera.position.clone().sub(controls.target).normalize();
      if (direction.lengthSq() === 0) direction.set(0.8, 0.5, 1).normalize();
      return {
        position: target.clone().addScaledVector(direction, radius * (isCompact() ? 6 : 5)),
        target,
        minDistance: radius * 1.6,
        maxDistance: 290,
        fov: 43
      };
    }
    if (view === "first-mosaic") {
      const skyDirection = firstMosaicFeature.direction
        .clone()
        .applyQuaternion(starField.quaternion)
        .normalize();
      const position = camera.position.clone();
      return {
        position,
        target: position.clone().addScaledVector(skyDirection, 10),
        minDistance: 4,
        maxDistance: 24,
        fov: isCompact() ? 51 : 48
      };
    }

    if (view === "galactic-centre") {
      const skyDirection = galacticCentreFeature.direction
        .clone()
        .applyQuaternion(starField.quaternion)
        .normalize();
      const position = camera.position.clone();
      return {
        position,
        target: position.clone().addScaledVector(skyDirection, 10),
        minDistance: 4,
        maxDistance: 24,
        fov: 43
      };
    }

    if (view === "survey") {
      const skyDirection = surveyProgress.focusDirection
        .clone()
        .applyQuaternion(starField.quaternion)
        .normalize();
      const position = camera.position.clone();
      return {
        position,
        target: position.clone().addScaledVector(skyDirection, 10),
        minDistance: 4,
        maxDistance: 24,
        fov: isCompact() ? 56 : 60
      };
    }

    if (view === "solar") {
      return {
        position: new THREE.Vector3(-74, isCompact() ? 32 : 47, isCompact() ? 118 : 142),
        target: new THREE.Vector3(-75, 0, 0),
        minDistance: 30,
        maxDistance: 290,
        fov: 43
      };
    }

    if (view === "euclid") {
      return {
        position: currentCraftPosition.clone().add(
          isCompact()
            ? new THREE.Vector3(0.28, 0.15, 0.38)
            : new THREE.Vector3(0.24, 0.13, 0.32)
        ),
        target: currentCraftPosition.clone().add(new THREE.Vector3(0, 0.015, 0)),
        minDistance: 0.28,
        maxDistance: 290,
        fov: 43
      };
    }

    return {
      position: isCompact()
        ? new THREE.Vector3(1.05, 1.65, 4.8)
        : new THREE.Vector3(0.85, 1.28, 4.15),
      target: isCompact()
        ? new THREE.Vector3(0.11, 0.04, 0)
        : new THREE.Vector3(0.08, 0.035, 0),
      minDistance: 0.55,
      maxDistance: 290,
      fov: 43
    };
  }

  function setView(view, animateChange) {
    const preset = cameraPreset(view);
    if (["solar", "l2", "euclid", "earth", "moon", "sun"].includes(view)) {
      lastObjectView = view;
    }
    lastChosenView = view;
    activeView = view;
    lastHoverPointer = null;
    setSkyFeatureHighlighted(galacticCentreFeature, false, "canvas");
    setSkyFeatureHighlighted(firstMosaicFeature, false, "canvas");
    renderer.domElement.style.cursor = "";
    if (pinnedManoeuvreSelection || activeManoeuvreSelection) {
      pinnedManoeuvreSelection = null;
      setActiveManoeuvre(null);
    }

    controls.minDistance = preset.minDistance;
    controls.maxDistance = preset.maxDistance;
    controls.enablePan =
      view !== "solar" &&
      view !== "first-mosaic" &&
      view !== "galactic-centre" &&
      view !== "survey";

    if (!animateChange || prefersReducedMotion) {
      camera.position.copy(preset.position);
      controls.target.copy(preset.target);
      camera.fov = preset.fov;
      camera.updateProjectionMatrix();
      cameraTransition = null;
      controls.update();
      return;
    }

    cameraTransition = {
      started: performance.now(),
      duration: 650,
      fromPosition: camera.position.clone(),
      fromTarget: controls.target.clone(),
      fromFov: camera.fov,
      toPosition: preset.position,
      toTarget: preset.target,
      toFov: preset.fov,
      view
    };
  }

  function updateCameraTransition(time) {
    if (!cameraTransition) return;
    if (["euclid", "moon", "sun"].includes(cameraTransition.view)) {
      const target = cameraTransition.view === "euclid"
        ? currentCraftPosition.clone().add(new THREE.Vector3(0, 0.015, 0))
        : cameraTransition.view === "moon" ? moon.group.position.clone() : SUN_POSITION.clone();
      const movement = target.clone().sub(cameraTransition.toTarget);
      cameraTransition.toPosition.add(movement);
      cameraTransition.toTarget.copy(target);
    }
    const elapsed = (time - cameraTransition.started) / cameraTransition.duration;
    const progress = Math.min(1, Math.max(0, elapsed));
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    camera.position.lerpVectors(
      cameraTransition.fromPosition,
      cameraTransition.toPosition,
      eased
    );
    controls.target.lerpVectors(
      cameraTransition.fromTarget,
      cameraTransition.toTarget,
      eased
    );
    camera.fov =
      cameraTransition.fromFov +
      (cameraTransition.toFov - cameraTransition.fromFov) * eased;
    camera.updateProjectionMatrix();

    if (progress >= 1) cameraTransition = null;
  }

  function trajectoryStateAt(timestamp) {
    if (timestamp <= trajectoryTimes[0]) {
      return {
        position: orbitPoints[0].clone(),
        lowerIndex: 0,
        upperIndex: 0,
        fraction: 0,
        withinRange: false
      };
    }
    if (timestamp >= trajectoryTimes[lastIndex]) {
      return {
        position: orbitPoints[lastIndex].clone(),
        lowerIndex: lastIndex,
        upperIndex: lastIndex,
        fraction: 0,
        withinRange: false
      };
    }

    let low = 0;
    let high = lastIndex;
    while (low + 1 < high) {
      const middle = Math.floor((low + high) / 2);
      if (trajectoryTimes[middle] <= timestamp) {
        low = middle;
      } else {
        high = middle;
      }
    }

    const interval = trajectoryTimes[high] - trajectoryTimes[low];
    const fraction = interval
      ? (timestamp - trajectoryTimes[low]) / interval
      : 0;
    return {
      position: orbitPoints[low].clone().lerp(orbitPoints[high], fraction),
      lowerIndex: low,
      upperIndex: high,
      fraction,
      withinRange: true
    };
  }

  function updateSpacecraftAttitude(position) {
    // The supplied model's photovoltaic sunshield faces local -Z and the
    // telescope looks along local +Y. Keep the solar side pointed toward the
    // Sun while choosing a stable, representative telescope direction in the
    // plane perpendicular to the Sun-spacecraft line.
    const antiSunAxis = spacecraftAntiSunAxis
      .subVectors(position, SUN_POSITION)
      .normalize();
    const telescopeAxis = spacecraftTelescopeAxis
      .set(0, 1, 0)
      .addScaledVector(antiSunAxis, -antiSunAxis.y);

    if (telescopeAxis.lengthSq() < 1e-8) {
      telescopeAxis
        .set(0, 0, 1)
        .addScaledVector(antiSunAxis, -antiSunAxis.z);
    }
    telescopeAxis.normalize();

    const rightAxis = spacecraftRightAxis
      .crossVectors(telescopeAxis, antiSunAxis)
      .normalize();
    telescopeAxis.crossVectors(antiSunAxis, rightAxis).normalize();

    spacecraftAttitudeBasis.makeBasis(
      rightAxis,
      telescopeAxis,
      antiSunAxis
    );
    spacecraftAnchor.quaternion.setFromRotationMatrix(
      spacecraftAttitudeBasis
    );
  }

  function setTrajectoryNow(announce, suppliedDate) {
    const date = suppliedDate || new Date();
    const state = trajectoryStateAt(date.getTime());
    const delta = state.position.clone().sub(currentCraftPosition);
    const progressIndex =
      state.lowerIndex +
      (state.upperIndex - state.lowerIndex) * state.fraction;
    currentIndex = state.lowerIndex;
    currentCraftPosition.copy(state.position);
    spacecraftAnchor.position.copy(state.position);
    updateSpacecraftAttitude(state.position);
    labelPosition.euclid
      .copy(state.position)
      .add(new THREE.Vector3(0, 0.064, 0));
    showingCurrentTime = true;

    if (activeView === "euclid" && !cameraTransition) {
      camera.position.add(delta);
      controls.target.add(delta);
    }

    slider.value = String(Math.round(progressIndex));
    slider.style.setProperty(
      "--progress",
      `${(progressIndex / lastIndex) * 100}%`
    );

    const displayDate = state.withinRange
      ? date
      : new Date(trajectoryTimes[state.lowerIndex]);
    updateSceneForDate(displayDate, false, state.withinRange ? "now" : "latest");
    updateSurveyProgressForDate(displayDate, true);
    updateDateReadoutForDate(displayDate, state.withinRange);
    updateCurrentPositionStatus(displayDate, state.withinRange);
    updateEuclidDistance(
      state.position,
      state.withinRange ? "now" : "latest"
    );

    if (announce) {
      window.clearTimeout(statusTimer);
      statusTimer = window.setTimeout(() => {
        screenReaderStatus.textContent =
          `Euclid's interpolated position for ${formatFullUKDate(displayDate)}.`;
      }, 220);
    }
  }

  function setTrajectoryIndex(index, announce) {
    const bounded = Math.max(0, Math.min(lastIndex, Math.round(index)));
    const nextPosition = orbitPoints[bounded];
    const delta = nextPosition.clone().sub(currentCraftPosition);
    currentIndex = bounded;
    currentCraftPosition.copy(nextPosition);
    spacecraftAnchor.position.copy(nextPosition);
    updateSpacecraftAttitude(nextPosition);
    labelPosition.euclid.copy(nextPosition).add(new THREE.Vector3(0, 0.064, 0));
    showingCurrentTime = false;
    updateSceneForDate(new Date(trajectoryTimes[bounded]), false, "selected");

    if (activeView === "euclid" && !cameraTransition) {
      camera.position.add(delta);
      controls.target.add(delta);
    }

    slider.value = String(bounded);
    slider.style.setProperty("--progress", `${(bounded / lastIndex) * 100}%`);
    updateSurveyProgressForDate(
      new Date(trajectoryTimes[bounded]),
      true
    );
    updateDateReadout(bounded);
    updateEuclidDistance(nextPosition, "selected");
    if (ephemerisStatus) {
      const { dateLabel } = formattedDate(bounded);
      ephemerisStatus.textContent =
        `${trajectorySourceLabel(trajectoryTimes[bounded])} · ${dateLabel}`;
    }

    if (announce) {
      window.clearTimeout(statusTimer);
      statusTimer = window.setTimeout(() => announcePosition(bounded), 220);
    }
  }

  function updateDateReadout(index) {
    const { dateLabel, timeLabel } = formattedDate(index);
    slider.setAttribute("aria-valuetext", `${dateLabel}, ${timeLabel}`);
    dateOutput.querySelector(".date-day").textContent = dateLabel;
    dateOutput.querySelector(".date-time").textContent = timeLabel;
    const summary = document.getElementById("orbit-summary-date");
    if (summary) summary.textContent = `${dateLabel}, ${timeLabel}`;
    if (returnToNowButton) returnToNowButton.hidden = false;
  }

  function updateDateReadoutForDate(date, isCurrent = true) {
    const dateLabel = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/London"
    }).format(date);
    const timeLabel = formatUKTime(date);
    slider.setAttribute("aria-valuetext", `${dateLabel}, ${timeLabel}`);
    const summary = document.getElementById("orbit-summary-date");
    if (summary) summary.textContent = `${dateLabel}, ${timeLabel}`;
    dateOutput.querySelector(".date-day").textContent = dateLabel;
    dateOutput.querySelector(".date-time").textContent =
      `${timeLabel} · ${isCurrent ? "now" : "latest"}`;
    if (returnToNowButton) returnToNowButton.hidden = true;
  }

  function formatUKTime(date, includeSeconds = false) {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      ...(includeSeconds ? { second: "2-digit" } : {}),
      hour12: false,
      timeZone: "Europe/London",
      timeZoneName: "short"
    }).format(date);
  }

  function formatFullUKDate(date) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/London",
      timeZoneName: "short"
    }).format(date);
  }

  function updateCurrentPositionStatus(date, isCurrent) {
    if (!ephemerisStatus) return;
    const dateLabel = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Europe/London"
    }).format(date);
    const sourceLabel = trajectorySourceLabel(date.getTime());
    ephemerisStatus.textContent = isCurrent
      ? `${sourceLabel} now · ${dateLabel}`
      : `Latest ${sourceLabel} · ${dateLabel}`;
  }

  function trajectorySourceLabel(timestamp) {
    return timestamp <= sourceBoundaryTime
      ? "WebMUST orbit history"
      : "JPL/ESA predicted position";
  }

  function updateEphemerisLabels() {
    if (!timelineEndLabel) return;
    const finalDate = new Date(trajectoryTimes[lastIndex]);
    const finalLabel = new Intl.DateTimeFormat("en-GB", {
      month: "short",
      year: "numeric",
      timeZone: "Europe/London"
    }).format(finalDate);
    timelineEndLabel.textContent = `JPL forecast · ${finalLabel}`;
  }

  function formattedDate(index) {
    const date = new Date(trajectoryTimes[index]);
    const dateLabel = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/London"
    }).format(date);
    return { dateLabel, timeLabel: formatUKTime(date) };
  }

  function announcePosition(index) {
    const earthDistance = Math.hypot(data.x[index], data.y[index], data.z[index]);
    const l2Distance = Math.hypot(
      data.x[index] - 1_500_000,
      data.y[index],
      data.z[index]
    );
    const { dateLabel, timeLabel } = formattedDate(index);
    const selectedTimestamp = trajectoryTimes[index];
    let surveyContext = "";
    if (surveyProgressVisible) {
      surveyContext = selectedTimestamp < SURVEY_SCHEDULE_START_TIME
        ? " No main-survey coverage is scheduled by this date."
        : selectedTimestamp >= SURVEY_SCHEDULE_END_TIME
          ? " The full main-survey reference plan is shown."
          : " Main-survey reference-plan coverage is shown through this selected date.";
    }
    screenReaderStatus.textContent =
      `Euclid on ${dateLabel} at ${timeLabel}, ` +
      `${formatDistance(earthDistance)} from Earth and ` +
      `${formatDistance(l2Distance)} from L2.${surveyContext}`;
  }

  function formatDistance(kilometres) {
    if (kilometres >= 1_000_000) return `${(kilometres / 1_000_000).toFixed(2)} million kilometres`;
    return `${Math.round(kilometres).toLocaleString("en-GB")} kilometres`;
  }

  function updateEuclidDistance(position, context) {
    if (!euclidDistanceLabel) return;
    const kilometres =
      position.distanceTo(EARTH_POSITION) / WORLD_SCALE;
    const roundedKilometres = Math.round(kilometres / 100) * 100;
    const summary = document.getElementById("orbit-summary-distance");
    if (summary) summary.textContent = formatDistance(kilometres);
    const suffix = context === "now"
      ? " · now"
      : context === "latest"
        ? " · latest"
        : "";
    euclidDistanceLabel.textContent =
      `${roundedKilometres.toLocaleString("en-GB")} km from Earth${suffix}`;
  }

  function stopPlayback() {
    playing = false;
    playbackAccumulator = 0;
    playButton.classList.remove("playing");
    playButton.setAttribute("aria-label", "Play Euclid's journey");
  }

  function updatePlayback(deltaMilliseconds) {
    if (!playing) return;
    playbackAccumulator += deltaMilliseconds;
    const millisecondsPerPoint = 34;
    if (playbackAccumulator < millisecondsPerPoint) return;

    const step = Math.max(1, Math.floor(playbackAccumulator / millisecondsPerPoint));
    playbackAccumulator %= millisecondsPerPoint;
    const nextIndex = currentIndex + step;

    if (nextIndex >= lastIndex) {
      setTrajectoryIndex(lastIndex, true);
      stopPlayback();
      return;
    }
    setTrajectoryIndex(nextIndex, false);
  }

  function resize() {
    const width = host.clientWidth;
    const height = host.clientHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isCompact() ? 1.5 : 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    manoeuvreLayer.points.material.size = isCompact() ? 6 : 5;
    manoeuvreLayer.halo.material.size = isCompact() ? 14 : 12;

    if (!cameraTransition && activeView) {
      const preset = cameraPreset(activeView);
      camera.fov = preset.fov;
      camera.updateProjectionMatrix();
      if (activeView === "l2") {
        camera.position.copy(preset.position);
        controls.target.copy(preset.target);
      }
    }
  }

  function projectLabel(element, position, options = {}) {
    const projected = position.clone().project(camera);
    const interactive = element.hasAttribute("data-focus-object");
    const visible = projected.z > -1 && projected.z < 1 && options.visible !== false &&
      (!interactive || (Math.abs(projected.x) <= 1 && Math.abs(projected.y) <= 1));
    if (interactive) {
      element.setAttribute("aria-hidden", String(!visible));
      element.tabIndex = visible ? 0 : -1;
      element.disabled = !visible;
      element.style.pointerEvents = visible ? "auto" : "none";
    }
    if (!visible) {
      element.style.opacity = "0";
      return;
    }

    const width = host.clientWidth;
    const height = host.clientHeight;
    let x = (projected.x * 0.5 + 0.5) * width + (options.x || 36);
    let y = (-projected.y * 0.5 + 0.5) * height + (options.y || -10);
    x = Math.max(42, Math.min(width - (options.maxRight || 92), x));
    y = Math.max(86, Math.min(height - 124, y));
    element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    element.style.opacity = "1";
  }

  function bindSkyFeatureHotspot(element, feature) {
    if (!element || !feature) return;
    feature.hotspotElement = element;
    element.addEventListener("focus", () => {
      setSkyFeatureHighlighted(feature, true, "hotspot-focus");
    });
    element.addEventListener("blur", () => {
      setSkyFeatureHighlighted(feature, false, "hotspot-focus");
    });
  }

  function setSkyFeatureHighlighted(feature, highlighted, source) {
    if (!feature) return;
    if (!feature.highlightSources) feature.highlightSources = new Set();
    if (!source) {
      feature.highlightSources.clear();
    } else if (highlighted) {
      feature.highlightSources.add(source);
    } else {
      feature.highlightSources.delete(source);
    }
    feature.highlighted = feature.highlightSources.size > 0;
  }

  function updateSkyFeatureHighlights(deltaMilliseconds) {
    const blend = prefersReducedMotion
      ? 1
      : 1 - Math.exp(-Math.max(deltaMilliseconds, 0) / 85);
    [galacticCentreFeature, firstMosaicFeature].forEach((feature) => {
      feature.visuals.forEach((visual) => {
        const target = feature.highlighted
          ? visual.highlightedOpacity
          : visual.restingOpacity;
        visual.material.opacity +=
          (target - visual.material.opacity) * blend;
      });
    });
  }

  function setSkyFeatureHotspotVisible(element, visible) {
    if (!element) return;
    if (!visible && document.activeElement === element) {
      element.blur();
    }
    element.style.opacity = visible ? "1" : "0";
    element.tabIndex = visible ? 0 : -1;
    element.setAttribute("aria-hidden", String(!visible));
  }

  function isSkyFeatureOccluded(position) {
    skyFeatureRayDirection
      .subVectors(position, camera.position)
      .normalize();
    skyFeatureRay.set(camera.position, skyFeatureRayDirection);
    const featureDistance = camera.position.distanceTo(position);
    const earthHit = skyFeatureRay.intersectSphere(
      manoeuvreEarthSphere,
      skyFeatureIntersection
    );
    if (
      earthHit &&
      earthHit.distanceTo(camera.position) < featureDistance
    ) {
      return true;
    }

    manoeuvreMoonSphere.center.copy(moon.group.position);
    const moonHit = skyFeatureRay.intersectSphere(
      manoeuvreMoonSphere,
      skyFeatureIntersection
    );
    return Boolean(
      moonHit &&
      moonHit.distanceTo(camera.position) < featureDistance
    );
  }

  function updateSkyFeatureHotspot(element, feature) {
    if (!element || !feature.group.visible) {
      setSkyFeatureHotspotVisible(element, false);
      setSkyFeatureHighlighted(feature, false);
      return;
    }

    feature.mesh.getWorldPosition(skyFeatureWorldPosition);
    skyFeatureProjected.copy(skyFeatureWorldPosition).project(camera);
    if (
      skyFeatureProjected.z <= -1 ||
      skyFeatureProjected.z >= 1 ||
      isSkyFeatureOccluded(skyFeatureWorldPosition)
    ) {
      setSkyFeatureHotspotVisible(element, false);
      setSkyFeatureHighlighted(feature, false);
      return;
    }

    const width = host.clientWidth;
    const height = host.clientHeight;
    const centreX = (skyFeatureProjected.x * 0.5 + 0.5) * width;
    const centreY = (-skyFeatureProjected.y * 0.5 + 0.5) * height;

    skyFeatureAxisWorldA.set(-feature.planeWidth / 2, 0, 0);
    skyFeatureAxisWorldB.set(feature.planeWidth / 2, 0, 0);
    feature.mesh.localToWorld(skyFeatureAxisWorldA);
    feature.mesh.localToWorld(skyFeatureAxisWorldB);
    skyFeatureAxisProjectedA.copy(skyFeatureAxisWorldA).project(camera);
    skyFeatureAxisProjectedB.copy(skyFeatureAxisWorldB).project(camera);
    const leftX =
      (skyFeatureAxisProjectedA.x * 0.5 + 0.5) * width;
    const leftY =
      (-skyFeatureAxisProjectedA.y * 0.5 + 0.5) * height;
    const rightX =
      (skyFeatureAxisProjectedB.x * 0.5 + 0.5) * width;
    const rightY =
      (-skyFeatureAxisProjectedB.y * 0.5 + 0.5) * height;
    const projectedWidth = Math.hypot(rightX - leftX, rightY - leftY);
    const angle = Math.atan2(rightY - leftY, rightX - leftX);

    skyFeatureAxisWorldA.set(0, -feature.planeHeight / 2, 0);
    skyFeatureAxisWorldB.set(0, feature.planeHeight / 2, 0);
    feature.mesh.localToWorld(skyFeatureAxisWorldA);
    feature.mesh.localToWorld(skyFeatureAxisWorldB);
    skyFeatureAxisProjectedA.copy(skyFeatureAxisWorldA).project(camera);
    skyFeatureAxisProjectedB.copy(skyFeatureAxisWorldB).project(camera);
    const bottomX =
      (skyFeatureAxisProjectedA.x * 0.5 + 0.5) * width;
    const bottomY =
      (-skyFeatureAxisProjectedA.y * 0.5 + 0.5) * height;
    const topX =
      (skyFeatureAxisProjectedB.x * 0.5 + 0.5) * width;
    const topY =
      (-skyFeatureAxisProjectedB.y * 0.5 + 0.5) * height;
    const projectedHeight = Math.hypot(topX - bottomX, topY - bottomY);
    const cosine = Math.abs(Math.cos(angle));
    const sine = Math.abs(Math.sin(angle));
    const boundsWidth =
      cosine * projectedWidth + sine * projectedHeight;
    const boundsHeight =
      sine * projectedWidth + cosine * projectedHeight;
    const footprintInViewport =
      centreX + boundsWidth / 2 > 0 &&
      centreX - boundsWidth / 2 < width &&
      centreY + boundsHeight / 2 > 0 &&
      centreY - boundsHeight / 2 < height;
    const centreInViewport =
      centreX >= 22 &&
      centreX <= width - 22 &&
      centreY >= 22 &&
      centreY <= height - 22;
    const inViewport = feature.compactHotspot
      ? centreInViewport
      : footprintInViewport;

    if (!inViewport) {
      setSkyFeatureHotspotVisible(element, false);
      if (!footprintInViewport) {
        setSkyFeatureHighlighted(feature, false);
      }
      return;
    }

    const hotspotWidth = feature.compactHotspot
      ? 44
      : Math.max(44, projectedWidth);
    const hotspotHeight = feature.compactHotspot
      ? 44
      : Math.max(44, projectedHeight);
    const hotspotAngle = feature.compactHotspot ? 0 : angle;
    element.style.width = `${hotspotWidth}px`;
    element.style.height = `${hotspotHeight}px`;
    element.style.transform =
      `translate3d(${centreX - hotspotWidth / 2}px, ` +
      `${centreY - hotspotHeight / 2}px, 0) ` +
      `rotate(${hotspotAngle}rad)`;
    setSkyFeatureHotspotVisible(element, true);
  }

  function pickSkyFeature(clientX, clientY) {
    const bounds = renderer.domElement.getBoundingClientRect();
    if (
      clientX < bounds.left ||
      clientX > bounds.right ||
      clientY < bounds.top ||
      clientY > bounds.bottom
    ) {
      return null;
    }

    skyFeaturePointer.set(
      ((clientX - bounds.left) / bounds.width) * 2 - 1,
      -((clientY - bounds.top) / bounds.height) * 2 + 1
    );
    starField.updateMatrixWorld(true);
    skyFeaturePicker.setFromCamera(skyFeaturePointer, camera);
    const features = [galacticCentreFeature, firstMosaicFeature]
      .filter((feature) => feature.group.visible);
    const intersections = skyFeaturePicker.intersectObjects(
      features.map((feature) => feature.mesh),
      false
    );
    if (!intersections.length) return null;
    const feature = features.find(
      (candidate) => candidate.mesh === intersections[0].object
    );
    if (!feature) return null;
    feature.mesh.getWorldPosition(skyFeatureWorldPosition);
    return isSkyFeatureOccluded(skyFeatureWorldPosition)
      ? null
      : feature;
  }

  function updateLabels() {
    const solarView = activeView === "solar";
    const euclidView = activeView === "euclid";
    const skyView =
      activeView === "first-mosaic" ||
      activeView === "galactic-centre" ||
      activeView === "survey";

    projectLabel(earthLabel, labelPosition.earth, {
      x: solarView ? 24 : 46,
      y: solarView ? -85 : -24,
      visible: !skyView
    });
    projectLabel(moonLabel, labelPosition.moon, {
      x: solarView ? 24 : 34,
      y: solarView ? -35 : -18,
      visible: !skyView
    });
    projectLabel(l2Label, labelPosition.l2, {
      x: solarView ? 24 : 36,
      y: solarView ? 15 : -22,
      visible: !skyView
    });
    projectLabel(euclidLabel, labelPosition.euclid, {
      x: solarView ? 24 : euclidView ? 82 : 42,
      y: solarView ? 65 : euclidView ? -56 : -24,
      visible: !skyView
    });
    projectLabel(sunLabel, labelPosition.sun, {
      x: 54,
      y: -22,
      maxRight: 70,
      visible: !skyView
    });
    projectLabel(distanceLabel, labelPosition.distance, {
      x: -38,
      y: 16,
      maxRight: 110,
      visible: activeView === "l2"
    });
    updateSkyFeatureHotspot(
      galacticCentreHotspot,
      galacticCentreFeature
    );
    updateSkyFeatureHotspot(firstMosaicHotspot, firstMosaicFeature);
  }

  function animate(time) {
    const delta = Math.min(100, time - previousFrameTime);
    previousFrameTime = time;
    refreshSceneTime();
    updatePlayback(delta);
    updateCameraTransition(time);
    controls.update();
    starField.position.copy(camera.position);
    updateSkyFeatureHighlights(delta);
    refreshHoveredManoeuvre();
    updateLabels();
    updateManoeuvreTooltip();
    updateOrbitSpacecraftFade();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  function dismissGestureHint() {
    if (!gestureHint) return;
    gestureHint.classList.add("dismissed");
    try {
      localStorage.setItem("euclid-orbit-gesture-seen", "true");
    } catch (_) {
      // Private browsing can disable storage; the hint still dismisses for this visit.
    }
  }

  function gestureWasDismissed() {
    try {
      return localStorage.getItem("euclid-orbit-gesture-seen") === "true";
    } catch (_) {
      return false;
    }
  }
})();
