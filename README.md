# eucliduk.github.io
Euclid UK website

## Website design

The main website uses the approved Euclid UK design, including the four-slide
homepage, Anton headings, spacecraft-panel controls, and shared light/dark themes.
The Galactic Centre explorer remains at `q2release.html`. Older public, media,
and `euclid-*` page URLs remain available in the new design.
The explorer retains its original full-screen layout and controls; its visual
updates live separately in `css/euclid-galactic-centre-theme.css`.

Edit the durable content fragments in `data/site/`, the shared presentation in
`assets/site/`, and page-specific styles in `css/`. `scripts/build_site.mjs`
regenerates the public HTML pages with `npm run build:site`. It can also generate
an apply_patch patch without writing files:

```
node scripts/build_site.mjs > /tmp/euclid-site.patch
apply_patch < /tmp/euclid-site.patch
```

`index.html` and `euclid-home.html` use identical pre-rendered content. The previous
React homepage renderer is no longer loaded: all page text is available without
JavaScript, while the shared script progressively enhances navigation, search,
and the carousel. Newsletter signups have been removed. Existing interactive activities remain linked
from Resources; they need their own manual accessibility review before publication.

## Accessibility

Use WCAG 2.2 AA as the development target. Requirements and the manual release
checklist are in [docs/accessibility.md](docs/accessibility.md), with development
rules in [AGENTS.md](AGENTS.md).

Run `npm install`, `npx playwright install chromium`, then
`npm run check:accessibility`. Automated checks cover the new shared-design pages;
passing them does not certify screen-reader compatibility or the linked activities.
