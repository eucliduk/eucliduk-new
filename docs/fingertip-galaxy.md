# Fingertip Galaxy recreation

Preview: `http://127.0.0.1:8767/fingertip-galaxy.html`.

This is a static, full-viewport vector recreation of the plaque in the supplied
600 × 338 photograph. It corrects the photographed perspective to a landscape
A5 proportion, traces the light fingertip impressions against their local
background, and resets the curved lettering in a typewriter face. It preserves
the observed arrangement rather than generating a substitute spiral. Small
photographic details remain limited by the supplied image resolution; a higher
resolution or original engraving file would allow a more exact trace.

The artwork has no movement, click targets, tracking or external asset requests.
Its first viewport contains only the plaque. A native disclosure below it holds
the readable text transcript, description and credits; shared footer navigation,
remembered high contrast and light/dark themes are retained. The artwork itself
keeps the original dark-panel palette in the standard version. Forced colours
and high contrast override the palette. The graphic retains its full proportions
on narrow screens; the accompanying text reflows independently.

## Sources and regeneration

- Supplied photograph: `data/fingertip-galaxy/reference.jpg`.
- Tracer: `scripts/build_fingertip_galaxy.py` (Pillow and NumPy).
- Editable vector: `assets/fingertip-galaxy/galaxy.svg`.
- Individual mark geometry: `data/fingertip-galaxy/marks.json`.
- Page source: `data/site/fingertip-galaxy.page.html`.
- Presentation: `assets/site/fingertip-galaxy.css`.
- Generated page: `fingertip-galaxy.html` via `scripts/build_site.mjs`.

The current trace has 937 separate mark components. IDs such as
`fingerprint-0001` identify traced shapes, not individual contributors; a single
painted fingerprint can contain several disconnected components. No attribution
of individual marks to people is inferred. Stable IDs are tied to this trace;
a new source or threshold can change component numbering. Future interactive
features can use the stored paths and centroids, but will also need visible,
keyboard-accessible equivalents and appropriate contributor metadata.

Artwork: Lisa Pettibone, Tom Kitching and the participating Euclid scientists
and engineers. Poem excerpt: Simon Barraclough, *Unextraordinary Light
(For Euclid)*. Background and credit verification:
https://www.esa.int/ESA_Multimedia/Videos/2022/07/The_Fingertip_Galaxy_Reflecting_Euclid_in_art

## Humans of Euclid profile integration

`humans.html` embeds the same artwork with 19 highlighted marks paired to the
19 existing portrait profiles. Elena and Carolyn retain their shared portrait
and quotation as one joint profile. All original portrait cards remain behind
a List view toggle; the Meet the team and past-event sections have been removed.
Pairings are illustrative, not verified identities of
the people who made the physical prints; the page says so explicitly.

`data/fingertip-galaxy/people.json` records the mark/profile mappings. The page
builder validates each mark and creates native buttons over its position plus
an equivalent list of name buttons in a native disclosure. Profile contents are read from
the existing portrait cards by `assets/site/people-galaxy.js`, keeping photos,
locations/roles and quotations aligned with the fallback list. The reusable
popup is nonmodal. Hover/focus reveals it; click/tap pins it; Close, Escape and
outside activation dismiss it. It is hoverable and scrollable, with no focus
trap. Keyboard activation reaches its controls, and dismissal returns focus.
The team-list link reveals the list and focuses the matching full profile.

The galaxy is the primary view directly beneath the page title on smaller
screens and extending beside it on wide screens. Its plaque background and
border are removed; fingerprints and curved lettering use the shared page ink
colour, dark on light and light on dark. The interactive fingerprints retain
a light blue accent in light mode and light purple in dark mode, without decorative circles; a focus outline
appears for keyboard use. The light blue has limited contrast on the
standard light background. The footer-linked high-contrast version uses page
ink for these marks; equivalent name buttons and the list view remain available.
Portrait screens below 45rem rotate
the entire fitted coordinate plane by 90 degrees, including marker buttons.
Landscape screens retain the horizontal composition. Only the artwork stage
clips the empty overflow from the unrotated layout box; all surrounding copy
reflows independently and the full transformed drawing remains visible.
The requested introduction sits below the title to the left of the artwork on
desktop, and follows the artwork on mobile. Its final sentence is a separate
paragraph. The desktop stage grows to accommodate enlarged introduction text.
The creator credit remains at the bottom. Without JavaScript the full portrait list is visible.

Map targets are 44 CSS pixels on desktop and 24 CSS pixels on narrow screens,
with nonoverlapping touch areas. The equivalent name buttons provide targets
of at least 44 CSS pixels high. Controls stay hidden without JavaScript; the
artwork and all portrait cards remain available. High contrast, forced colours,
enlarged text and browser font overrides are retained. The ESA hyperlink and
Lisa Pettibone creator credit appear on both pages.

`scripts/check_people_galaxy.mjs` covers all 19 photo/quote pairings, hover
persistence, keyboard focus/activation/dismissal, click pinning, touch target
separation, enlarged mobile popup text, both themes/high contrast and static
fallbacks, list toggling and auto-reveal, theme-matched artwork, portrait
rotation and landscape restoration. It is included in the accessibility suite.

## Verification results

The accessibility suite includes `scripts/check_fingertip_galaxy.mjs`.
Browser-engine checks cover individual vector marks, curved-text bounds,
keyboard access to the transcript, both themes/high contrast, forced colours,
320 CSS-pixel reflow with 200% text and text spacing, and no-JavaScript access.
Desktop and mobile screenshots have been visually reviewed. These checks do
not establish WCAG conformance or replace actual browser zoom, native Safari,
screen-reader and speech-control testing before release.
