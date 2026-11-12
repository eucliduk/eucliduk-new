(() => {
  "use strict";

  const images = [
    {
      slug: "01-deep-field-south",
      title: "Euclid Deep Field South",
      alt: "A wide Euclid deep-field view filled with distant stars and galaxies.",
      position: "50% 50%",
    },
    {
      slug: "02-deep-field-detail",
      title: "Deep Field South — detail",
      alt: "A closer view into Euclid Deep Field South showing many faint distant galaxies.",
      position: "53% 48%",
    },
    {
      slug: "03-einstein-ring",
      title: "Einstein ring around NGC 6505",
      alt: "A bright circular Einstein ring surrounding the galaxy NGC 6505.",
      position: "50% 50%",
    },
    {
      slug: "04-southern-sky",
      title: "Southern Sky mosaic",
      alt: "A long mosaic of Euclid observations across the Southern Sky.",
      position: "52% 50%",
    },
    {
      slug: "05-messier-78",
      title: "Messier 78",
      alt: "Euclid's view of the star-forming region Messier 78, with luminous clouds of dust and gas.",
      position: "49% 47%",
    },
    {
      slug: "06-perseus-cluster",
      title: "Perseus galaxy cluster",
      alt: "Euclid's view of the Perseus cluster, dense with galaxies and foreground stars.",
      position: "50% 50%",
    },
    {
      slug: "07-strong-lenses",
      title: "Strong gravitational lenses",
      alt: "A collection of strong gravitational lenses captured by Euclid.",
      position: "50% 50%",
    },
    {
      slug: "08-cats-eye",
      title: "Cat’s Eye Nebula",
      alt: "Euclid's detailed view of the Cat's Eye Nebula surrounded by a field of stars.",
      position: "50% 50%",
    },
    {
      slug: "09-galactic-bulge",
      title: "The Milky Way’s galactic bulge",
      alt: "A dense Euclid view of the Milky Way's galactic bulge filled with countless stars.",
      position: "50% 50%",
    },
    {
      slug: "10-ic-342",
      title: "Spiral galaxy IC 342",
      alt: "Euclid's view of the face-on spiral galaxy IC 342.",
      position: "50% 50%",
    },
    {
      slug: "11-horsehead",
      title: "Horsehead Nebula",
      alt: "Euclid's view of the Horsehead Nebula, dark against glowing clouds and stars.",
      position: "50% 47%",
    },
    {
      slug: "12-abell-2390",
      title: "Galaxy cluster Abell 2390",
      alt: "Euclid image of galaxy cluster Abell 2390 and its surrounding galaxies.",
      position: "50% 50%",
    },
    {
      slug: "13-dark-matter-map",
      title: "Abell 2390 — dark matter map",
      alt: "Abell 2390 overlaid with a purple visualization of its dark matter distribution.",
      position: "50% 50%",
    },
    {
      slug: "14-shear-field",
      title: "Abell 2390 — shear field",
      alt: "Abell 2390 with a scientific shear-field visualization across the image.",
      position: "50% 50%",
    },
    {
      slug: "15-cosmic-web",
      title: "Mapping the cosmic web",
      alt: "An astronomical visualization of the large-scale cosmic web.",
      position: "50% 50%",
    },
    {
      slug: "16-euclid-spacecraft",
      title: "Euclid in space",
      alt: "An artist's view of the Euclid spacecraft observing the Universe.",
      position: "50% 54%",
    },
    {
      slug: "17-euclid-liftoff",
      title: "Euclid liftoff",
      alt: "The rocket carrying Euclid lifting off through a bright plume of smoke.",
      position: "50% 50%",
    },
    {
      slug: "18-vis-instrument",
      title: "The VIS focal plane",
      alt: "The blue 36-sensor focal plane of Euclid's VIS instrument in its metal housing.",
      position: "48% 52%",
    },
  ].map((image, index) => ({
    ...image,
    index,
    thumb: `images/euclid-gallery/${image.slug}-thumb.webp`,
    full: `images/euclid-gallery/${image.slug}.webp`,
  }));

  const sensorGrid = document.querySelector("#sensor-grid");
  const sensorReadout = document.querySelector("#sensor-readout");
  const galleryPage = document.querySelector("#gallery-page");
  const siteHeader = document.querySelector(".site-masthead");
  const siteFooter = document.querySelector(".site-footer");
  const viewer = document.querySelector("#image-viewer");
  const viewerStage = document.querySelector("#viewer-stage");
  const viewerImage = document.querySelector("#viewer-image");
  const sensorGridImage = document.querySelector("#sensor-grid-image");
  const sensorGridImageSource = document.querySelector("#sensor-grid-image-source");
  const viewerTitle = document.querySelector("#viewer-title");
  const viewerMeta = document.querySelector("#viewer-meta");
  const viewerCount = document.querySelector("#viewer-count");
  const closeButton = document.querySelector("#viewer-close");
  const previousButton = document.querySelector("#viewer-previous");
  const nextButton = document.querySelector("#viewer-next");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const sensorButtons = new Map();
  const preloaded = new Set();
  let activeIndex = 0;
  let originButton = null;
  let state = "closed";
  let sequenceToken = 0;
  let imageToken = 0;
  let gridImageResetTimer = 0;

  const pad = (value) => String(value).padStart(2, "0");
  const activeSlots = Array.from({ length: 36 }, (_, slot) => slot).filter((slot) => {
    const row = Math.floor(slot / 6);
    const column = slot % 6;
    return (row + column) % 2 === 0;
  });

  function defaultReadout() {
    sensorReadout.innerHTML = '18 active image sensors <span aria-hidden="true">·</span> select an illuminated frame';
  }

  function showReadout(image, sensorNumber) {
    sensorReadout.innerHTML = `Sensor ${pad(sensorNumber)} <span aria-hidden="true">·</span> ${image.title}`;
  }

  function preloadImage(image) {
    if (preloaded.has(image.full)) return;
    preloaded.add(image.full);
    const preload = new Image();
    preload.src = image.full;
  }

  function buildSensorGrid() {
    const imageBySlot = new Map(activeSlots.map((slot, index) => [slot, images[index]]));
    const fragment = document.createDocumentFragment();

    for (let slot = 0; slot < 36; slot += 1) {
      const sensorNumber = slot + 1;
      const image = imageBySlot.get(slot);

      if (!image) {
        const empty = document.createElement("span");
        empty.className = "sensor sensor--empty";
        empty.dataset.sensor = pad(sensorNumber);
        empty.setAttribute("aria-hidden", "true");
        fragment.appendChild(empty);
        continue;
      }

      const button = document.createElement("button");
      button.className = "sensor sensor--active";
      button.type = "button";
      button.dataset.imageIndex = String(image.index);
      button.dataset.sensorNumber = String(sensorNumber);
      button.setAttribute("aria-label", `Open ${image.title}, sensor ${pad(sensorNumber)}`);

      const thumbnail = document.createElement("img");
      thumbnail.src = image.thumb;
      thumbnail.alt = "";
      thumbnail.width = 480;
      thumbnail.height = 480;
      thumbnail.loading = image.index < 6 ? "eager" : "lazy";
      thumbnail.decoding = "async";
      thumbnail.style.objectPosition = image.position;
      button.appendChild(thumbnail);

      button.addEventListener("click", () => openViewer(image.index, button));
      button.addEventListener("pointerenter", () => {
        showReadout(image, sensorNumber);
        preloadImage(image);
      });
      button.addEventListener("pointerleave", defaultReadout);
      button.addEventListener("focus", () => {
        showReadout(image, sensorNumber);
        preloadImage(image);
      });
      button.addEventListener("blur", defaultReadout);

      sensorButtons.set(image.index, button);
      fragment.appendChild(button);
    }

    sensorGrid.appendChild(fragment);
  }

  function setBackgroundInteractive(interactive) {
    const elements = [document.querySelector("#main-content"), siteHeader, siteFooter];
    elements.forEach((element) => {
      if (!element) return;
      if (interactive) {
        element.removeAttribute("inert");
        element.removeAttribute("aria-hidden");
      } else {
        element.setAttribute("inert", "");
        element.setAttribute("aria-hidden", "true");
      }
    });
  }

  function setGridImageRect(rect) {
    sensorGridImage.style.left = `${rect.left}px`;
    sensorGridImage.style.top = `${rect.top}px`;
    sensorGridImage.style.width = `${rect.width}px`;
    sensorGridImage.style.height = `${rect.height}px`;
  }

  function getGridBounds() {
    return {
      left: 0,
      top: 0,
      width: sensorGrid.clientWidth,
      height: sensorGrid.clientHeight,
    };
  }

  function getGridRelativeRect(element) {
    const gridRect = sensorGrid.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    return {
      left: elementRect.left - gridRect.left,
      top: elementRect.top - gridRect.top,
      width: elementRect.width,
      height: elementRect.height,
    };
  }

  function getCurrentGridImageRect() {
    const gridRect = sensorGrid.getBoundingClientRect();
    const imageRect = sensorGridImage.getBoundingClientRect();
    return {
      left: imageRect.left - gridRect.left,
      top: imageRect.top - gridRect.top,
      width: imageRect.width,
      height: imageRect.height,
    };
  }

  function prepareGridImage(image, rect) {
    window.clearTimeout(gridImageResetTimer);
    sensorGridImage.classList.remove("is-animated");
    setGridImageRect(rect);
    sensorGridImageSource.src = image.thumb;
    sensorGridImageSource.style.objectPosition = image.position;
    sensorGridImage.classList.add("is-active");
    sensorGrid.classList.add("is-transitioning");
  }

  function nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  function wait(duration) {
    return new Promise((resolve) => window.setTimeout(resolve, duration));
  }

  async function animateGridImage(fromRect, toRect) {
    sensorGridImage.classList.remove("is-animated");
    setGridImageRect(fromRect);
    sensorGridImage.classList.add("is-active");
    sensorGrid.classList.add("is-transitioning");
    void sensorGridImage.offsetWidth;
    sensorGridImage.classList.add("is-animated");
    await nextFrame();
    setGridImageRect(toRect);
    await wait(reducedMotion.matches ? 1 : 700);
  }

  function updateViewerLabels(image) {
    const button = sensorButtons.get(image.index);
    const sensorNumber = Number(button?.dataset.sensorNumber || image.index + 1);
    viewerTitle.textContent = image.title;
    viewerMeta.textContent = `Sensor ${pad(sensorNumber)} · VIS image array`;
    viewerCount.textContent = `${pad(image.index + 1)} / ${pad(images.length)}`;
  }

  function setViewerImage(image, immediate = false) {
    const token = ++imageToken;
    updateViewerLabels(image);
    viewerImage.alt = image.alt;

    if (immediate) {
      viewerImage.src = image.full;
      return;
    }

    viewerStage.classList.add("is-switching");
    const nextImage = new Image();

    const applyImage = (source) => {
      if (token !== imageToken) return;
      viewerImage.src = source;
      viewerImage.alt = image.alt;
      requestAnimationFrame(() => viewerStage.classList.remove("is-switching"));
    };

    nextImage.onload = () => applyImage(image.full);
    nextImage.onerror = () => applyImage(image.thumb);
    nextImage.src = image.full;
    window.setTimeout(() => applyImage(nextImage.complete && nextImage.naturalWidth ? image.full : image.thumb), 900);
  }

  async function openViewer(index, button) {
    if (state !== "closed") return;

    const token = ++sequenceToken;
    const image = images[index];
    const startRect = getGridRelativeRect(button);
    const targetRect = getGridBounds();

    state = "opening";
    activeIndex = index;
    originButton = button;
    document.body.style.overflow = "hidden";

    viewer.hidden = false;
    viewer.className = "image-viewer";
    viewer.focus({ preventScroll: true });
    setBackgroundInteractive(false);
    setViewerImage(image, true);
    prepareGridImage(image, startRect);

    if (reducedMotion.matches) {
      setGridImageRect(targetRect);
      viewer.classList.add("is-revealing", "is-final");
      state = "open";
      closeButton.focus({ preventScroll: true });
      return;
    }

    await animateGridImage(startRect, targetRect);
    if (token !== sequenceToken) return;

    viewer.classList.add("is-revealing");
    await wait(340);
    if (token !== sequenceToken) return;

    viewer.classList.add("is-final");
    await wait(280);
    if (token !== sequenceToken) return;

    state = "open";
    closeButton.focus({ preventScroll: true });
  }

  function finishClose() {
    viewer.hidden = true;
    viewer.className = "image-viewer";
    viewerStage.classList.remove("is-switching");
    viewerImage.removeAttribute("src");
    viewerImage.alt = "";
    document.body.style.overflow = "";
    setBackgroundInteractive(true);
    sensorGrid.classList.remove("is-transitioning");
    sensorGridImage.classList.remove("is-animated");
    state = "closed";

    const focusTarget = originButton;
    originButton = null;
    focusTarget?.focus({ preventScroll: true });

    gridImageResetTimer = window.setTimeout(() => {
      if (state !== "closed") return;
      sensorGridImage.classList.remove("is-active");
      sensorGridImage.removeAttribute("style");
      sensorGridImageSource.removeAttribute("src");
      sensorGridImageSource.removeAttribute("style");
    }, 180);
  }

  async function closeViewer() {
    if (state === "closed" || state === "closing") return;

    const token = ++sequenceToken;
    state = "closing";

    if (reducedMotion.matches) {
      finishClose();
      return;
    }

    const currentRect = getCurrentGridImageRect();
    const targetButton = sensorButtons.get(activeIndex) || originButton;
    const targetRect = targetButton ? getGridRelativeRect(targetButton) : currentRect;
    const image = images[activeIndex];

    prepareGridImage(image, currentRect);
    viewer.classList.remove("is-final");

    await wait(380);
    if (token !== sequenceToken) return;

    viewer.classList.remove("is-revealing");
    await wait(340);
    if (token !== sequenceToken) return;

    await animateGridImage(currentRect, targetRect);
    if (token !== sequenceToken) return;

    finishClose();
  }

  function showAdjacentImage(direction) {
    if (state !== "open") return;
    activeIndex = (activeIndex + direction + images.length) % images.length;
    originButton = sensorButtons.get(activeIndex) || originButton;
    const image = images[activeIndex];
    prepareGridImage(image, getGridBounds());
    setViewerImage(image);
  }

  function trapFocus(event) {
    if (event.key !== "Tab" || state !== "open") return;
    const controls = Array.from(viewer.querySelectorAll("[data-viewer-control]")).filter(
      (control) => !control.disabled && control.offsetParent !== null,
    );
    if (!controls.length) return;

    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  closeButton.addEventListener("click", closeViewer);
  previousButton.addEventListener("click", () => showAdjacentImage(-1));
  nextButton.addEventListener("click", () => showAdjacentImage(1));

  document.addEventListener("keydown", (event) => {
    if (state === "closed") return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeViewer();
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showAdjacentImage(-1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showAdjacentImage(1);
      return;
    }

    trapFocus(event);
  });

  buildSensorGrid();
})();
