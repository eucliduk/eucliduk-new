(() => {
  const galaxy = document.querySelector('[data-people-galaxy]');
  if (!galaxy) return;
  const panel = galaxy.querySelector('.people-profile-preview');
  const closeButton = panel.querySelector('.people-preview-close');
  const buttons = [...galaxy.querySelectorAll('button[data-person]')];
  const markers = [...galaxy.querySelectorAll('.people-marker')];
  const profiles = new Map([...document.querySelectorAll('.portrait-card')].map(card => [card.id.replace('human-', ''), card]));
  const discovery = galaxy.closest('.people-discovery');
  const introduction = discovery.querySelector('.people-introduction');
  const heading = discovery.querySelector('.people-hero');
  const sizeIntroduction = () => {
    discovery.style.setProperty('--people-copy-height', `${heading.offsetHeight + introduction.offsetHeight + 16}px`);
  };
  new ResizeObserver(sizeIntroduction).observe(introduction);
  new ResizeObserver(sizeIntroduction).observe(heading);
  sizeIntroduction();
  discovery.classList.add('is-ready');
  let activeKey = '', activeTrigger = null, pinned = false, closeTimer, restoringFocus = false;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const forcedColors = matchMedia('(forced-colors: active)');
  const motionEndsAt = performance.now() + 4500;
  let portraitTimer, portraitStep = 0, selectedPortrait = '', inView = true;
  const updatePortraits = () => {
    clearTimeout(portraitTimer);
    const staticPreference = reducedMotion.matches || forcedColors.matches;
    const featured = activeKey || selectedPortrait;
    const count = matchMedia('(max-width: 45rem)').matches ? 2 : 3;
    const indices = Array.from({ length: count }, (_, index) => (portraitStep + index * 6) % markers.length);
    markers.forEach((marker, index) => marker.classList.toggle('is-featured', featured ? marker.dataset.person === featured : indices.includes(index)));
    const running = !staticPreference && performance.now() < motionEndsAt && !featured && !document.hidden && inView;
    galaxy.dataset.portraits = running ? 'playing' : 'paused';
    if (running) portraitTimer = setTimeout(updatePortraits, Math.max(0, motionEndsAt - performance.now()));
  };
  reducedMotion.addEventListener('change', updatePortraits);
  forcedColors.addEventListener('change', updatePortraits);
  document.addEventListener('visibilitychange', updatePortraits);
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting; updatePortraits(); }).observe(galaxy.querySelector('.people-galaxy-stage'));

  const positionPanel = () => {
    if (panel.hidden || !activeTrigger) return;
    const anchor = activeTrigger.getBoundingClientRect();
    const bounds = panel.getBoundingClientRect();
    const mobile = matchMedia('(max-width: 45rem)').matches;
    const left = mobile ? 12 : Math.max(12, Math.min(innerWidth - bounds.width - 12, anchor.right + bounds.width + 26 < innerWidth ? anchor.right + 14 : anchor.left - bounds.width - 14));
    const top = mobile ? Math.max(12, innerHeight - bounds.height - 12) : Math.max(12, Math.min(innerHeight - bounds.height - 12, anchor.top - 36));
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  };
  const close = (returnFocus = false) => {
    clearTimeout(closeTimer);
    const previous = activeTrigger;
    const focusWasInside = panel.contains(document.activeElement);
    panel.hidden = true;
    buttons.forEach(button => button.setAttribute('aria-expanded', 'false'));
    galaxy.querySelectorAll('.people-profile-mark.is-selected').forEach(mark => mark.classList.remove('is-selected'));
    activeKey = ''; activeTrigger = null; pinned = false;
    updatePortraits();
    if (returnFocus && focusWasInside && previous?.isConnected) {
      restoringFocus = true; previous.focus({ preventScroll: true }); restoringFocus = false;
    }
  };
  const show = (button, pin = false) => {
    clearTimeout(closeTimer);
    const key = button.dataset.person;
    const card = profiles.get(key);
    if (!card) return;
    if (activeKey !== key) {
      const portrait = card.querySelector('img');
      panel.querySelector('.people-preview-image').src = portrait.getAttribute('src');
      panel.querySelector('.people-preview-image').alt = portrait.alt;
      panel.querySelector('#people-preview-name').textContent = card.querySelector('.portrait-name').textContent;
      panel.querySelector('.people-preview-role').textContent = card.querySelector('.portrait-tag').textContent;
      panel.querySelector('.people-preview-quote').textContent = card.querySelector('.portrait-quote').textContent;
      panel.querySelector('.people-preview-link').href = `#${card.id}`;
    }
    activeKey = key; activeTrigger = button; pinned = pin;
    if (pin) selectedPortrait = key;
    buttons.forEach(option => option.setAttribute('aria-expanded', String(option.dataset.person === key)));
    markers.forEach(marker => document.getElementById(marker.dataset.mark)?.classList.toggle('is-selected', marker.dataset.person === key));
    panel.hidden = false;
    updatePortraits();
    positionPanel();
  };
  const scheduleClose = () => {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (!pinned && !panel.matches(':hover') && !panel.contains(document.activeElement) && !activeTrigger?.matches(':hover, :focus')) close();
    }, 220);
  };
  buttons.forEach(button => {
    button.addEventListener('pointerleave', scheduleClose);
    button.addEventListener('focus', () => { if (!restoringFocus) show(button); });
    button.addEventListener('blur', scheduleClose);
    button.addEventListener('click', event => {
      if (pinned && activeKey === button.dataset.person) { close(); return; }
      show(button, true);
      if (event.detail === 0) closeButton.focus({ preventScroll: true });
    });
  });
  panel.addEventListener('pointerenter', () => clearTimeout(closeTimer));
  panel.addEventListener('pointerleave', scheduleClose);
  panel.addEventListener('focusin', () => clearTimeout(closeTimer));
  panel.addEventListener('focusout', scheduleClose);
  closeButton.addEventListener('click', () => close(true));
  panel.querySelector('.people-preview-link').addEventListener('click', () => {
    const card = profiles.get(activeKey);
    close();
    if (card.hidden) document.querySelector('[data-people-library] [data-resource-filter="all"]').click();
    card.tabIndex = -1;
    card.focus();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); event.stopPropagation(); close(true); }
  }, true);
  document.addEventListener('pointerdown', event => {
    if (!panel.hidden && !panel.contains(event.target) && !buttons.some(button => button.contains(event.target))) close();
  });
  document.addEventListener('focusin', event => {
    if (!panel.hidden && !panel.contains(event.target) && !buttons.includes(event.target)) close();
  });
  addEventListener('resize', () => { positionPanel(); updatePortraits(); });
  addEventListener('scroll', positionPanel, { passive: true });
  galaxy.querySelectorAll('[data-people-controls]').forEach(element => { element.hidden = false; });
  updatePortraits();
})();
