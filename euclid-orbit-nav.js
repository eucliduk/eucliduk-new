(() => {
  const navigationLinks = document.querySelectorAll(".header-nav a");
  const navigation = document.querySelector(".header-links");
  const menuToggle = document.querySelector(".header-menu-toggle");
  const header = document.querySelector(".app-header");
  const themeToggle = document.getElementById("theme-toggle");
  const headerTools = document.querySelector(".header-tools");
  const headerNav = document.querySelector(".header-nav");
  const mobileLayout = window.matchMedia("(max-width: 760px)");
  const hoverNavigation = window.matchMedia("(hover: hover) and (pointer: fine)");
  const backgroundElements = new Map();
  let previousOverflow = "";
  const dropdowns = Array.from(document.querySelectorAll(".header-nav-item"))
    .map((item) => ({ item, toggle: item.querySelector("button[aria-controls]"), submenu: item.querySelector(".header-submenu") }))
    .filter(({ toggle, submenu }) => toggle && submenu);

  function positionThemeToggle() {
    if (!themeToggle || !headerTools || !header || !menuToggle) return;
    if (mobileLayout.matches) {
      header.insertBefore(themeToggle, menuToggle);
      navigation?.append(headerTools);
    } else {
      headerTools.append(themeToggle);
      if (headerNav) navigation?.insertBefore(headerTools, headerNav);
    }
  }

  function setDropdownOpen(dropdown, open, restoreFocus = false) {
    if (open) {
      dropdowns.filter((other) => other !== dropdown).forEach((other) => setDropdownOpen(other, false));
    }
    dropdown.toggle.setAttribute("aria-expanded", String(open));
    dropdown.submenu.hidden = !open;
    header?.classList.toggle("is-submenu-open", dropdowns.some(({ submenu }) => !submenu.hidden));
    if (restoreFocus) dropdown.toggle.focus();
  }

  function setMenuOpen(open, restoreFocus = false) {
    if (!navigation || !menuToggle || !header) return;
    const isOpen = mobileLayout.matches && open;
    if (!isOpen) dropdowns.forEach((dropdown) => setDropdownOpen(dropdown, false));
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    header.classList.toggle("is-menu-open", isOpen);
    navigation.inert = mobileLayout.matches && !isOpen;
    if (isOpen && backgroundElements.size === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      let branch = header;
      while (branch && branch !== document.body) {
        Array.from(branch.parentElement.children).forEach((element) => {
          if (element === branch || ["SCRIPT", "STYLE", "LINK"].includes(element.tagName)) return;
          backgroundElements.set(element, element.inert);
          element.inert = true;
        });
        branch = branch.parentElement;
      }
    } else if (!isOpen && backgroundElements.size > 0) {
      backgroundElements.forEach((inert, element) => { element.inert = inert; });
      backgroundElements.clear();
      document.body.style.overflow = previousOverflow;
    }
    if (mobileLayout.matches) {
      navigation.setAttribute("aria-hidden", String(!isOpen));
    } else {
      navigation.removeAttribute("aria-hidden");
    }
    if (isOpen) requestAnimationFrame(() => requestAnimationFrame(() => {
      if (menuToggle.getAttribute("aria-expanded") === "true") headerNav?.querySelector("button, a")?.focus();
    }));
    else if (restoreFocus && mobileLayout.matches) menuToggle.focus();
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
    });
  }

  document.addEventListener("keydown", (event) => {
    const openDropdown = dropdowns.find(({ submenu }) => !submenu.hidden);
    if (event.key === "Escape" && openDropdown) {
      event.preventDefault();
      setDropdownOpen(openDropdown, false, true);
      return;
    }
    if (menuToggle?.getAttribute("aria-expanded") !== "true") return;
    if (event.key === "Escape") {
      event.preventDefault();
      setMenuOpen(false, true);
    } else if (event.key === "Tab" && header) {
      const focusableItems = Array.from(header.querySelectorAll("a[href], button:not(:disabled), [tabindex='0']"))
        .filter((item) => item.getClientRects().length > 0);
      const firstItem = focusableItems[0];
      const lastItem = focusableItems[focusableItems.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem?.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem?.focus();
      }
    }
  });

  document.addEventListener("pointerdown", (event) => {
    dropdowns.forEach((dropdown) => {
      if (!dropdown.item.contains(event.target)) setDropdownOpen(dropdown, false);
    });
    if (header && !header.contains(event.target)) setMenuOpen(false);
  });

  mobileLayout.addEventListener("change", () => {
    positionThemeToggle();
    setMenuOpen(false);
  });
  positionThemeToggle();
  setMenuOpen(false);
  document.documentElement.classList.add("navigation-ready");

  dropdowns.forEach((dropdown) => {
    const { item, toggle, submenu } = dropdown;
    toggle.addEventListener("click", () => {
      setDropdownOpen(dropdown, toggle.getAttribute("aria-expanded") !== "true");
    });
    toggle.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowDown") return;
      event.preventDefault();
      setDropdownOpen(dropdown, true);
      submenu.querySelector("a")?.focus();
    });
    item.addEventListener("mouseenter", () => {
      if (hoverNavigation.matches && !mobileLayout.matches) setDropdownOpen(dropdown, true);
    });
    item.addEventListener("mouseleave", () => {
      if (hoverNavigation.matches && !mobileLayout.matches && !item.contains(document.activeElement)) {
        setDropdownOpen(dropdown, false);
      }
    });
    item.addEventListener("focusout", (event) => {
      if (!mobileLayout.matches && !item.contains(event.relatedTarget)) setDropdownOpen(dropdown, false);
    });
  });

  navigationLinks.forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });
})();
