(() => {
  "use strict";

  const stops = [
    {
      view: "solar",
      title: "Euclid’s neighbourhood",
      description: "Follow Euclid, Earth and the Moon around the Sun. Objects are enlarged so you can see them, while the distances between their centres remain to scale. You can still drag and zoom at each stop."
    },
    {
      view: "sun",
      title: "Start with the Sun",
      description: "Sunlight illuminates this scene and shapes the day and night sides of Earth and the Moon. Euclid’s sunshield faces the Sun to protect the telescope on the other side."
    },
    {
      view: "earth",
      title: "Our home planet",
      description: "Earth is the reference point for Euclid’s neighbourhood. Its rotation and day/night boundary follow the date shown on the timeline, rather than a fixed illustration."
    },
    {
      view: "moon",
      title: "The Moon, for perspective",
      description: "The Moon helps put Euclid’s distance from Earth in perspective. Its position and illuminated phase also follow the selected date. Earth and the Moon keep their real size ratio in this view."
    },
    {
      view: "l2",
      title: "Parking a space telescope",
      description: "About 1.5 million kilometres beyond Earth, away from the Sun, lies L2. Euclid follows a wide halo orbit around this point, rather than sitting still at it."
    },
    {
      view: "euclid",
      title: "Meet Euclid",
      description: "The spacecraft model is enlarged so you can explore its details. Its sunshield stays sunward, but its exact pointing and roll are representative—not reconstructed attitude telemetry."
    },
    {
      view: "l2",
      title: "Explore the journey",
      description: "The timeline lets you explore Euclid’s journey, and the gold markers show recorded orbit manoeuvres. Finish the tour to continue freely: click objects or their labels to focus on them, or use the timeline to change the date."
    }
  ];

  function create({ host, onStart, onFocus }) {
    const launch = document.getElementById("tour-launch");
    const panel = document.getElementById("orbit-tour");
    if (!launch || !panel) return null;

    const heading = document.getElementById("tour-title");
    const description = document.getElementById("tour-description");
    const progress = document.getElementById("tour-progress");
    const announcement = document.getElementById("tour-announcement");
    const previous = document.getElementById("tour-previous");
    const next = document.getElementById("tour-next");
    const close = document.getElementById("tour-close");
    const details = document.getElementById("tour-details");
    let active = false;
    let ready = false;
    let current = 0;
    let expanded = true;

    function showStop(index) {
      current = Math.max(0, Math.min(stops.length - 1, index));
      const stop = stops[current];
      heading.textContent = stop.title;
      description.textContent = stop.description;
      progress.textContent = `Stop ${current + 1} of ${stops.length}`;
      previous.disabled = current === 0;
      next.textContent = current === stops.length - 1 ? "Finish tour" : "Next stop";
      onFocus(stop.view);
      heading.focus({ preventScroll: true });
      announcement.textContent = `Stop ${current + 1} of ${stops.length}. ${stop.description}`;
    }

    function setExpanded(value) {
      expanded = value;
      description.hidden = !expanded;
      details.setAttribute("aria-expanded", String(expanded));
      details.setAttribute("aria-label", expanded ? "Hide tour explanation" : "Show tour explanation");
      details.title = expanded ? "Hide explanation" : "Show explanation";
      details.textContent = expanded ? "−" : "+";
    }

    function finish() {
      if (!active) return;
      active = false;
      panel.hidden = true;
      launch.hidden = !ready;
      launch.setAttribute("aria-expanded", "false");
      announcement.textContent = "Guided tour ended. Continue exploring the scene freely.";
      launch.focus({ preventScroll: true });
    }

    launch.addEventListener("click", () => {
      if (!ready || active) return;
      onStart();
      active = true;
      panel.hidden = false;
      launch.hidden = true;
      launch.setAttribute("aria-expanded", "true");
      setExpanded(true);
      host.scrollIntoView({ behavior: "auto", block: "start" });
      showStop(0);
    });

    previous.addEventListener("click", () => {
      if (active && current > 0) showStop(current - 1);
    });
    next.addEventListener("click", () => {
      if (!active) return;
      if (current === stops.length - 1) finish();
      else showStop(current + 1);
    });
    close.addEventListener("click", finish);
    details.addEventListener("click", () => setExpanded(!expanded));
    document.addEventListener("keydown", (event) => {
      if (!active || event.key !== "Escape" || event.defaultPrevented) return;
      if (document.querySelector("dialog[open], .app-header.is-menu-open")) return;
      event.preventDefault();
      finish();
    });

    return {
      isActive: () => active,
      setReady(value) {
        ready = Boolean(value);
        launch.disabled = !ready;
        if (!ready) finish();
        launch.hidden = !ready || active;
      }
    };
  }

  window.EuclidOrbitTour = { create };
})();
