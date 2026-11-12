# Euclid UK website development

Accessibility is a requirement for every change, not an optional finishing step.
Use WCAG 2.2 Level AA as the engineering target. Do not claim conformance or
screen-reader compatibility on the basis of automated tests alone.

## Preserve these requirements

- Keep browser zoom available. Use relative text sizes (`rem`/`em`), flexible
  containers and wrapping text. Verify reflow at 320 CSS pixels (the equivalent
  of a 1280-pixel-wide window at 400% zoom), 200% text size and WCAG text spacing.
  Do not conceal overflow to disguise clipped text. Maps and data tables may
  need two-dimensional layouts, but their surrounding text must reflow.
- Honour forced colours, increased contrast and reduced motion. Do not use
  `forced-color-adjust: none` to defeat user settings. Do not add font or colour
  settings that override a visitor's explicit browser/device preferences.
- Use native links, buttons, inputs and dialogs. Keep their accessible names
  consistent with visible labels so speech-control users can activate them.
  Every pointer interaction needs a keyboard alternative. Avoid positive
  tabindex values and `role="application"`.
- Ensure visible keyboard focus, logical focus order, usable skip links, and
  no accidental traps. A modal must contain focus, make the background inert,
  close with Escape and return focus to its trigger. Only one modal may be open.
- Do not communicate meaning solely through colour, position or hover. Text
  needs at least 4.5:1 contrast (3:1 for qualifying large text); essential UI
  indicators and graphics need 3:1. The requested standard design retains its
  original decorative colours, with documented contrast limitations. Provide
  readable equivalents in the footer-linked high-contrast version; do not
  present a passing high-contrast check as a standard-version conformance pass.
  Prefer touch targets of at least 44 by 44 CSS pixels.
- Use one descriptive page title and one h1, meaningful landmarks and sequential
  headings. Give informative images useful alt text; hide decorative imagery
  from assistive technology. Keep accessible names for icon-only controls.
- Label form fields explicitly, identify required fields and explain errors in
  text. Preserve entered data and announce submission results appropriately.
- Avoid unsolicited sound, flashing and unpausable automatic motion. Provide
  pause/stop controls for continuing animation. For new media, supply accurate
  captions, transcripts and audio description when required; verify third-party
  players manually before publication.
- Provide plain-language text/data equivalents for canvases and 3D scenes.
  Hidden or off-screen scene labels must not be the only way to use an action.
  Keep status announcements concise; do not announce every animation frame.
- Write concise, plain-language copy. Explain specialist terms where introduced.

## Shared design and verification

- New shared-design pages must include `css/euclid-accessibility.css` after the
  other styles, followed by `css/euclid-high-contrast.css`, plus
  `euclid-accessibility.js`, the skip link and shared navigation.
  Preserve the common footer, its `data-contrast-toggle` link, both light/dark
  themes, and the remembered `euclid-contrast-choice` preference.
- Keep the pre-rendered `euclid-home.html` fallback aligned with the React
  homepage content. Test it with JavaScript disabled after changing content.
- Run `npm run check:accessibility` after installing the development dependencies
  and Playwright Chromium. Extend `scripts/check_accessibility.mjs` when adding
  new interaction patterns. Do not silence failures to get a passing result.
- Review axe checks marked `incomplete`; automated passes are not proof that
  alt text, reading order, captions or usability are correct.
- Use the manual checklist in `docs/accessibility.md` before release. Test
  keyboard-only access, browser font/colour overrides, actual 400% browser zoom,
  screen readers and speech control. Record the actual software versions/results.
- Legacy pages outside the shared design also need review before being linked
  or migrated. Do not describe them as audited just because shared pages pass.
- Preserve unrelated user changes. Do not add branches or commits unless asked.
