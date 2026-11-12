# Accessibility requirements and release checklist

Last updated: 12 November 2026.

## Release preparation · 12 November 2026

Checked using Google Chrome 157.0.8103.52, Playwright 1.56.1 and axe-core 4.14.0 on macOS. Targeted checks passed for the homepage (22 scans), Science (6), Scientists (6), Humans fingerprint selection (4), the north/south DR1 viewers (4), and the orbit/gallery explorer smoke checks. Reports are under `.build/accessibility/final-index.html`, `final-science.html`, `scientists-layout`, `people-selection`, `private-explorer-startup` and `orbit-final-cleanup/interactives`.

Checks covered native click/tap/keyboard profile selection (face hover no longer opens profiles), missing-content regressions, both themes and high-contrast variants, 320 CSS pixel reflow, 200% text, keyboard controls, reduced motion, forced colours, and pre-rendered no-script content. The private viewers retained preview images while tiles loaded, painted each detail scene without interaction, and exposed both southern region circles to the keyboard. Science copy and the shared orbit logo received an additional smoke check after their last edits.

Incomplete axe results were reviewed as unresolved manual items: image/gradient background colour contrast, accessible-name matching for graphic arrow controls. The redundant label on the generic portrait-filter wrapper (`aria-prohibited-attr`) was removed; its native button group retains the visible label. The standard artwork colours retain the documented limitations; passing high-contrast checks are not a standard-version conformance result. Actual 400% browser zoom, screen readers, speech control, Safari, third-party player captions and audio description have not been newly verified in this pass and remain on the release checklist below. These checks do not establish WCAG conformance.


The self-contained handover subsequently passed the full shared-site command
from its own website folder: 20 pages, 106 scans, followed by all five
explorer/gallery/orbit smoke scans. The integrated DR1 viewers separately
passed four scans and all image scenes, delayed tile startup and keyboard
region selection. Final reports are in `.build/accessibility/handover-selfcontained`
and `handover-viewers`. A transient gallery colour result in an earlier run
was not reproduced by the isolated check or the complete self-contained rerun.
The mobile menu now stays open when a queued resize event still leaves it in
mobile layout; portrait-filter labels use the existing native button group.
No conformance claim is made; the manual release checklist still applies.

## Larger shared footer · 11 November 2026

The shared footer now uses the available page width, with larger Anton headings,
Space Grotesk body copy and links, larger social icons and partner logos, and
more readable credits. The logo area is wider, with larger partner marks; the
three link columns are grouped more tightly at the right. Desktop columns
distribute the content across the page;
compact layouts retain flexible wrapping and stack at phone widths. Typography
uses relative sizes; no fixed text heights or hidden overflow were introduced.
Visual review covered 1920, 1440, 390 and 320 CSS pixel widths. The standard
colours, both themes, native links and high-contrast control are preserved.
At widths up to 47.5rem the Quick Links, Resources and Stay Connected columns
are hidden, including their links, and the footer becomes a single compact
introduction with a two-column partner-logo grid and credits. The contrast link
remains visible and is aligned left to avoid the fixed back-to-top control on
narrow phones. Desktop footer navigation remains available. The final mobile follow-up passed
six scans in `.build/accessibility/footer-mobile-compact`, including reflow,
enlarged text, keyboard access, forced colours and the no-script fallback.
Phone screenshots at 320 and 390 CSS pixels were reviewed.

The initial footer-scale pass covered 19 pages / 102 scans and interactive smoke
checks; the Space Grotesk follow-up passed six scans. Reviewed incomplete footer
results were colour-contrast checks requiring manual assessment. Reports are
in `.build/accessibility/footer-scale`,
`.build/accessibility/footer-space-grotesk` and
`.build/accessibility/footer-logo-layout` (the final logo follow-up also passed
six scans); neither report establishes WCAG
conformance. Native Safari and assistive-technology testing remain outstanding.

## Resource cards and homepage image carousel · 11 November 2026

Restyled Resources using the RMSC planetarium card reference: larger image
panels, left-aligned Anton headings, Space Grotesk copy, and plain audience rows
with decorative tag icons. Light-mode card bodies use the search control’s
cream surface; dark resource cards retain their purple surface. High contrast
uses its own text and surface variables. Labels and category filters remain
native, visible and keyboard operable. The coming-soon model card remains
non-interactive.

The hover overlay and darkening were removed. Linked card images zoom to 104%
inside a fixed 3:2 frame. Hovering or keyboard focus also gives the linked card
a soft shadow and a two-pixel lift; headings no longer gain an underline.
Reduced motion suppresses both movement and transitions while retaining visible
keyboard focus. Only images are clipped; card copy wraps freely.

The homepage now says “Latest stories”. Its former dark-matter banner is replaced
by “Here’s looking at Euclid”, a manually browsable strip of six images. Native
previous/next buttons retain focus, expose unavailable ends with aria-disabled,
and announce a concise image range after navigation settles. Native links open
the full-size images; keyboard focus scrolls off-screen links into view. Touch
scrolling and the native scrollbar remain available. There is no autoplay.
All six links remain in the no-script homepage, with inactive controls hidden.
The generated homepage and euclid-home.html fallback remain identical.

The reflow checker now treats this intentionally horizontal image strip as its
own viewport while checking each caption against its card boundaries. Whole-page
horizontal overflow checks remain active, including at 320 CSS pixels, doubled
text size and increased text spacing. New interaction checks cover keyboard
navigation, focus retention, end positions and off-screen link access.

Chromium 157.0.8103.40: the resource follow-up passed six scans in
`.build/accessibility/resource-cards-zoom-final`; the homepage passed 22 scans in
`.build/accessibility/home-image-cards-final`. Direct follow-ups verified hover
zoom, clipped image frames, shadows/lift, absence of underlining, matching cream
surfaces, retained dark surfaces, phone dimensions, reduced motion and returning
to the first image. Desktop/mobile and both theme screenshots were reviewed.
Reviewed incomplete axe checks include shaped arrow backgrounds and arrow
symbols with spoken previous/next names; these require manual assessment.
These results do not establish WCAG conformance. Actual 400% browser zoom,
native Safari, screen readers and speech control remain unverified.

## Featured resource grid cleanup · 11 November 2026

Added Hunt for Dark Matter (https://gravitational-lensing.explored.info), using
the external page’s title and a decorative local Euclid Einstein-ring thumbnail.
It appears in Secondary school, Public engagement and All. The external viewer
has not been audited in this change.

At the user’s request, removed the complete older “A Universe to explore”,
“Explore and take part” and “Watch and explore” sections from Resources. Their
underlying pages remain available through their existing URLs. The resource
library now consists of eight featured cards: two primary-school entries, two
secondary-school entries, two citizen-science entries and six public-engagement
entries. Filter and no-script checks were updated to the requested content,
including the absence of the old chapter grid; other accessibility assertions
were retained. The Hunt for Dark Matter card was visually reviewed. Its final image uses the
supplied title artwork recomposed as a square asset, displayed in the same 3:2
frame as the other cards by cropping background space. Both title lines remain
visible. The live heading repeats the title; the image is decorative. The copy
identifies it as an online game about weak gravitational lensing and explains
that term. Desktop and mobile image dimensions were compared directly. The final
resource-page run passed six Chromium scans in
`.build/accessibility/resources-featured-only`, covering both themes and
contrast versions, keyboard filtering, narrow reflow, enlarged text and the
no-script fallback. Photographic contrast and incomplete automated results
still require the documented manual review.

## Euclid Image Explorer resource · 11 November 2026

Added the external Euclid Image Explorer as a native-link resource card using
the existing card layout and a decorative thumbnail from the local Euclid image
collection. It is tagged Public engagement and included in All, with 17 total
resources and 15 public-engagement entries. Existing keyboard filter tests and
the no-script resource count include the new card. The card was visually checked
and the resource-page checks cover both themes, contrast versions, narrow
reflow, enlarged text and keyboard access. The linked external viewer has not
been audited for accessibility by this change.

## Shared navigation and news updates · 11 November 2026

Mobile (up to 45rem) now hides the rotating announcement, partner logos and
utility FAQ link. The social links remain at the left and the theme switch at
the right. Hidden announcement rotation is stopped. Desktop announcements and
links remain available.

The compact navigation trigger is a labelled hamburger. With JavaScript it
opens a native full-screen dialog, using the selected theme’s surface and text
colours. The dialog makes the background inert, contains keyboard focus, scrolls
when content is taller than the screen, closes with the close button or Escape,
and returns focus to the hamburger. Escape first dismisses an open submenu.
Crossing a responsive breakpoint closes the dialog and restores navigation to
its normal location. Existing native details navigation remains usable without
JavaScript.

Carousel controls keep the same position across slides. Their right edge aligns
with the search button at the desktop and phone widths checked. Only the right
arrow’s decorative panel is mirrored; its arrow glyph still points right.
Pointer hover no longer draws a rectangular outline; visible keyboard focus is
retained.

The white rectangular search overlay and matching purple accent now apply to
all shared-design pages. The field and separate search trigger have equal
heights (56px desktop / 44px compact). Covered navigation remains inert while
search is open. The utility theme switch is a white icon without a panel fill.

The exhibition news card links to a local article with adapted text. Its large
header now uses the supplied 1512 × 1071 entrance photograph, with the original
1024 × 768 team photograph moved into the body after the paragraph describing
the team. Both JPEGs are copied without recompression; the smaller team WebP
is retained for the news card. The original closing paragraph beginning
“Euclid: The Dark Universe Detective will tour” has been restored, with the
exhibit title italicised. The closing text section has
been replaced with a single Explore the exhibition button link. Its category is Public Engagement. The
Events page includes a native link card to the Royal Society recording, with a
Watch recording tab and official thumbnail. It does not embed or autoplay the
external player; its captions and controls still need manual review.

Chromium 157.0.8103.40: the final homepage checks passed 22 scans, including
320 CSS pixel reflow, doubled text, text spacing, both themes, forced colours,
full-screen menu geometry, keyboard containment/return and no-script fallback.
The full shared-navigation pass covered 19 pages / 102 scans, with the explorer,
gallery and orbit smoke checks also passing; the Events
follow-up passed six scans. Reports: `.build/accessibility/mobile-navigation-final`,
`.build/accessibility/mobile-navigation-shared`, and
`.build/accessibility/events-recording-final`.

Reviewed incomplete axe results: colour-contrast checks include photographic
backgrounds and shaped controls, which require visual/manual assessment; the
label-content-name-mismatch results include directional arrow glyphs with
spoken previous/next labels. The final open mobile menu scan had no incomplete
results. These observations do not establish WCAG conformance. Actual browser
400% zoom, native Safari, screen readers and speech control remain unverified.
The npm launcher is unavailable in this runtime, so the package’s accessibility
script was invoked directly with Node and the installed browser dependencies.

## Page scroll controls · 11 November 2026

Shared-design pages have a Back to top button that appears after scrolling more
than 400 CSS pixels or three quarters of the viewport, whichever is larger.
It returns to the top and places keyboard focus on the homepage link. It is
hidden again at the top. A centred glowing chevron below the carousel links to
the next section and moves keyboard focus there. The cue’s introductory movement
runs twice for 4.8 seconds and then stops, leaving the static glow; reduced motion
and high contrast suppress the movement. Both controls retain visible focus,
44px-or-larger targets and system colours in forced-colour mode. Reduced motion
also disables smooth scrolling. Phone slide controls are raised slightly to
keep the down-arrow target separate from the indicator dots.

Final Chromium follow-ups passed: homepage 22 scans, resources six scans and
exhibition article six scans. Reports are in `.build/accessibility/scroll-controls-home`,
`.build/accessibility/scroll-controls-resources` and
`.build/accessibility/exhibition-article-final`. No incomplete axe nodes targeted
the new scroll controls. The supplied JPEG dimensions, exhibition destination,
keyboard focus on both scroll actions, reduced-motion handling and separation
of the down arrow from the slide dots were checked. Visual screenshots were
reviewed for the phone arrows and the large article image.

The shared navigation pass and targeted scroll-control/article checks are
separate results; standard decorative colours still retain their documented
contrast limitations. Actual Safari and assistive-technology review remain open.

## Homepage search fade overlay · 11 November 2026

Replaced the leftward search reveal with a 200ms opacity fade over the homepage
navigation. Desktop menu layout remains in place invisibly so the search button
keeps its horizontal position; covered navigation is inert until search closes.
Compact layouts allocate enough input width, retaining the existing temporary
replacement of the logo row on phones. The standard search trigger is unchanged.

The search field and results panel are square-cornered white rectangles with
2px purple (#8b68b7) borders and no decorative shadow. Input focus is indicated
by an additional adjoining purple outline on the field container, rather than
a second black rectangle inside it. Other controls retain individual visible
focus indicators. Forced colours use system colours and a Highlight focus
outline. Reduced motion and forced colours suppress the fade. Native input,
label, query retention, Escape, focus return and keyboard results access remain.

Inspected desktop/mobile screenshots. Additional checks at 1440, 900, 390 and
320px confirmed readable input space, no horizontal overflow, fixed trigger
horizontal placement, the fade animation and visible container focus indicator;
reduced-motion checks confirmed animation is disabled. The homepage suite passed
22 scans in Chromium 157.0.8103.40, including covered-menu inertness, search
positioning/white fill, keyboard interactions, themes/contrast variants, reflow,
enlarged text/text spacing and no-JavaScript fallback. index.html and
euclid-home.html remain identical. Reviewed existing axe incomplete contrast and
accessible-name comparisons; manual review remains necessary. Actual 400%
browser zoom, native Safari, screen readers and speech control were not tested.

## Refined stars, restored search panel and Edinburgh news · 11 November 2026

Measured bright-core centres and six-ray orientations directly in both source
images. Corrected all four DR1 glow centres (one was between two stars) and
rotations to approximately −20.5° through −22.1°. Refined all four M78 centres
and rotations to approximately 9.2° through 10.1°. The portrait DR1 overlay uses
the same measurements transformed through the image's 90° rotation. Pixel
sampling at the rendered glow positions confirmed bright image cores at all
16 tested positions (both slides at desktop/mobile sizes). Peak-animation and
source-star crops were reviewed visually. Motion preference handling is retained.

At the user's request, the experimental telescope-shaped search button has been
removed. The homepage now uses exactly the same panel decoration, magnifier,
colours and responsive button sizing as other shared-design pages. The homepage
search field reveals from its right edge towards the left over 260ms, joining
the trigger. It has a compact cream surface and simplified results/close control.
Reduced motion and forced colours suppress the reveal. Labelled native input,
visible keyboard focus, results status, Escape, query retention, outside-click
closing and focus return are retained. On narrow screens the field temporarily
replaces the logo/navigation row to preserve input space; closing restores it.
An overlap found with enlarged menu text during the larger-button experiment
was corrected, and the final standard-button version was rechecked.

Added the University of Edinburgh exhibition article, dated 15 July 2026, between
the November 2026 and March 2025 stories. It uses the same news-feature layout,
a local version of the source photograph, descriptive alt text and Read more
link to the original article. Image provenance is in images/news/README.md.
Desktop and 320px card screenshots were inspected.

The final homepage suite passed 22 scans and Latest News passed six scans in
Chromium 157.0.8103.40, including search keyboard behavior, field/trigger
positioning, reflow, enlarged text/text spacing, themes/contrast variants,
opening-slide fit and no-JavaScript fallback. index.html and euclid-home.html
remain identical. Reviewed existing axe incomplete contrast and accessible-name
comparisons; manual review is still needed. Actual 400% browser zoom, native
Safari, screen-reader and speech-control testing were not performed.

## Search silhouette, release glows and hover menus · 11 November 2026

The homepage's native Search button now has an inline SVG silhouette following
the envelope of the existing projected Euclid spacecraft outline. The cream
face, purple fold/shadow, icon colour and hover palette are retained; the native
button, accessible name, expanded state, focus ring and 44px mobile target remain.
Other pages keep their previous search shape. Forced colours use system fills
and an outline rather than relying on the decorative colours.

Slide one now has four staggered six-point star glows, using the established
3.6-second infinite twinkle. Separate decorative SVG overlays align to the wide
image and its rotated portrait source, with unique gradient IDs. Only stars in
the active slide animate. Image readiness is tracked separately for slides one
and four; reduced motion, remembered motion choice, high contrast, forced colours
and background-tab stopping remain in effect. Images are unchanged.

Removed the plus/minus decorations from the Science/Tech summaries. On desktop
with a fine hover pointer, their native details open on pointer entry. The
180ms reveal uses opacity and a small translation; reduced motion and forced
colours suppress it. Pointer transfer into the submenu remains possible, and
hover-open menus close after pointer exit unless focus remains within them.
Escape dismisses a hover-open menu even when focus is elsewhere, without moving
the pointer. Native click, touch, Enter, Tab and Escape operation remain.

Inspected desktop/menu and mobile screenshots. The homepage suite passed 22
scans in Chromium 157.0.8103.40. Extended checks cover hover entry, pointer
transfer, Escape without pointer movement, keyboard submenu links, both slides'
looping/active-only stars and mobile overlay selection, alongside existing
search, reflow, text spacing, reduced-motion, theme/contrast and no-JavaScript
checks. Generated index.html and euclid-home.html are identical. Reviewed
existing axe incomplete contrast and accessible-name comparisons; these still
need manual assessment. Actual 400% browser zoom, native Safari, screen readers
and speech-control software were not tested for this change.

## Restored divider and lighter carousel · 11 November 2026

Restored the original seven-segment homepage divider, its 10vw sizing and the
original carousel bottom spacing, undoing both reference-outline experiments.
The restoration passed 22 homepage scans before further carousel adjustments.

Reduced standard-theme hero shading from .72/.5 opacity to .42/.26 on desktop,
and replaced the compact layout's .55 solid overlay with a softer gradient.
Reduced the standard masthead gradient as well. Existing high-contrast,
increased-contrast and forced-colour rules remain in place; standard-theme
contrast limitations still apply.

The first slide uses a 1080×1920 portrait image at widths up to 42rem, generated
by rotating the existing M81/NGC 3077 image clockwise and resizing it uniformly.
No galaxies were composited or moved within the image. This keeps both galaxy
positions within a portrait frame and puts the large galaxy lower in the image.
Desktop retains the original wide image. Native picture/source selection also
works without JavaScript; index.html and euclid-home.html remain identical.

Inspected desktop light/dark and mobile screenshots. The final homepage suite
passed 22 scans in Chromium 157.0.8103.40, including reflow, enlarged text/text
spacing, keyboard access, no-JavaScript fallback, theme/contrast variants and
opening-screen fit for all slides. Existing axe incomplete contrast and
accessible-name checks remain subject to manual review. Actual 400% browser
zoom, native Safari, screen readers and speech control were not tested here.

## Simplified spectroscopy controls · 11 November 2026

Removed the comparison's visible drag/keyboard instruction paragraph and central
arrow handle. A thin image divider remains. The labelled native range input,
its percentage value text, keyboard operation and image dragging are retained.
The removed paragraph's `aria-describedby` reference was also removed.
Desktop/mobile screenshots were inspected. The release suite passed six scans
in Chromium 157.0.8103.40, including keyboard endpoints, dragging, text reflow
and both themes/contrast variants. Existing incomplete checks and manual-testing
limitations below still apply.

## Tighter head crops · 11 November 2026

Adjusted 17 thumbnail crops to show more head and less clothing/background;
the two already tight portraits retain their crops. Reviewed every crop through
a circular mask. Original profile images and alternative text remain unchanged.
Thumbnail URLs now include a content hash so refreshed pages receive the latest
crops, including in Safari. The 192px outputs and existing responsive circle
sizes are retained.
Desktop light/dark and mobile views were inspected. The Humans suite passed
ten scans in Chromium 157.0.8103.40, including image loading, interaction,
reduced-motion and reflow checks. Existing incomplete checks and manual-testing
limitations below still apply.

## Larger portrait circles · 11 November 2026

Increased featured headshots from 56px to 88px at the default desktop text
size, and from 32px to 56px on smaller screens. Sizes use rem units. The
featured native button grows with its visible portrait; inactive fingerprints
retain smaller targets so nearby marks remain selectable. Portrait dimensions
stay constant during their fade-out, avoiding a shrinking image. Desktop
light/dark and mobile screenshots were inspected; existing tests confirmed
touch targets do not overlap at 320px and that profile controls still work.
The Humans suite passed ten scans in Chromium 157.0.8103.40, including
keyboard, touch, reduced motion, selection/pause behavior and text reflow.
Existing incomplete checks and manual-testing limitations below still apply.

## Softer fingerprints and portrait invitations · 11 November 2026

The 937 traced fingerprint marks now use rounded quadratic contours instead
of straight pixel-step segments, preserving their positions, IDs and internal
contours. Highlighted marks also use round stroke joins. The same vector
artwork serves Humans of Euclid and the standalone artwork page.

Each existing fingerprint/profile button now contains a circular 192px head
crop from its existing portrait. The original photographs, 19 profile pairings
and joint profile remain. Crops are recorded in
`data/fingertip-galaxy/portrait-crops.json` and generated by
`scripts/build_people_thumbnails.py`. Three portraits on desktop, or two on
mobile, gently crossfade every 7.5 seconds with 1.8-second opacity transitions.
The faces stay upright when the galaxy rotates on portrait screens.

Hover/focus temporarily holds the sequence on that person's portrait. Selecting
a person stops cycling until Resume portraits is chosen, including after their
profile is closed. A native Pause/Resume portraits button also controls the
sequence. Reduced motion and forced colours use still portraits and hide the
playback control; reduced motion removes perceptible fading. Cycling pauses
when the artwork is outside the viewport or the document is hidden. Portrait
images are decorative within existing named buttons, adding no tab stops.
The name picker and list remain available, including all profiles without
JavaScript. Mobile targets are 32px and tested for non-overlap at 320px; the
alternative named buttons remain at least 44px high.

Chromium 157.0.8103.40 passed the Humans suite with ten scans, including all
19 mappings, keyboard/hover/touch profiles, pause/resume, changing portraits,
selection stopping the sequence, changed reduced-motion preferences, both
themes/contrast variants, 320px reflow, enlarged text, text spacing, forced
colours and no-JavaScript access. Desktop light/dark and portrait mobile views,
and all head crops, were visually inspected. The standalone artwork suite
passed six scans and verified the retained vector marks and transcript.
Reviewed incomplete contrast results concern existing curved SVG lettering,
shaped-button labels and popup quotes over their inherited solid theme surface;
the new portrait controls add no incomplete results. Actual 400% browser zoom,
native Safari, screen readers and speech control were not tested for this
revision; these results do not establish conformance.

## Artifact InSPECtor resource · 11 November 2026

Added “Zooniverse - Artifact InSPECtor” under All and Citizen science, using
the project's official 299px avatar from the public Zooniverse project API
(project 30908). The local WebP preserves the complete logo; adjacent visible
text identifies it, so the image is decorative. The description explains image
artefacts in plain language. The native whole-card link opens the supplied
project URL. There are now 16 resources and two Citizen science entries.
Desktop and 320px screenshots were inspected; filter and no-JavaScript counts
include the new resource.
The resources suite passed six scans in Chromium 157.0.8103.40, including
theme/contrast variants, keyboard filters, narrow reflow, enlarged text and
text spacing. Existing incomplete contrast/icon-label checks and manual-testing
limitations remain; these checks do not establish conformance.

## Build your own Euclid placeholder · 11 November 2026

Added a “Build your own Euclid!” card under All, Primary school and Public
engagement. The existing spacecraft illustration is decorative beside the
title and model-making description. A visible Coming soon label explains that
the resource is not available yet; the card has no inactive link, button or
tab stop. The total is now 15 resources, including eight primary-school and
14 public-engagement items. Filter and no-JavaScript checks cover these counts.
The resources suite passed six scans in Chromium 157.0.8103.40, including
theme/contrast variants, keyboard filters, 320px reflow, enlarged text and text
spacing. Desktop and 320px placeholder screenshots were inspected. Existing
incomplete contrast/icon-label checks and manual-testing limitations remain.

## App Store download badge · 11 November 2026

Replaced the GravyLensing app card's “Available on the App Store” sentence
with the existing official black US/UK SVG download badge, preserving its
proportions and clear space. The image alt text is “Download on the App Store”;
it remains within the card's existing native link, with no nested link or extra
tab stop. Desktop and 320px screenshots were visually inspected.
The resources suite passed six scans in Chromium 157.0.8103.40, including
reflow, enlarged text, keyboard access and both themes/contrast variants.
Existing incomplete contrast/icon-label checks and manual-testing limitations
recorded below still apply.

## GravyLensing App Store resource · 11 November 2026

Added a separate “GravyLensing app” card under All and Public engagement,
bringing the resource total to 14. It uses the official 512px App Store icon,
stored locally, with text identifying iPhone/iPad support and the App Store
destination. The icon is decorative beside the named native card link.
The original GravyLensing website card remains. The four-card desktop grid
and 320px app card were visually inspected; audience counts and checks include
the new card.
The resources suite passed six scans in Chromium 157.0.8103.40, covering
audience filters, both themes/contrast variants, keyboard access, 320px reflow,
enlarged text, text spacing and the no-JavaScript fallback. Existing incomplete
contrast/icon-label checks remain. Native Safari, actual browser zoom and
assistive technology were not tested for this addition.

## Dropdown overview entries removed · 11 November 2026

Removed the “The Science” and “The Technology” overview links from the shared
Science and Tech dropdowns, retaining their native disclosure controls and
remaining topic links. The same navigation is generated for desktop, mobile
and compatibility pages. Source checks confirmed the intended link sets on
38 generated shared-navigation pages and identical no-JavaScript homepage
fallback content.
The homepage suite passed 22 scans in Chromium 157.0.8103.40, including
desktop/mobile keyboard menus and the no-JavaScript fallback. Existing
incomplete contrast/icon-label checks and manual-testing limitations remain.

## Spectroscopy comparison and media cards · 11 November 2026

The DR1 release now includes a manual sky/spectra wipe above the paragraph
beginning “Beyond the standard one-dimensional spectra”. Both matching source
images retain their registration and are delivered as 2560px WebP copies.
Pointer dragging and a labelled native range input control the same reveal;
arrow keys, Home and End provide keyboard operation. Native slider activation
also supplies an alternative to dragging. Vertical touch scrolling remains
available. There is no automatic animation. Visible labels, image descriptions,
caption, credit and concise keyboard instructions explain the comparison.
Without JavaScript both images appear side by side with the caption.

Latest News media coverage now uses responsive cards with one native link per
article, publisher/date text and decorative publisher logos. Chronological
order and all seven destinations remain. Publisher artwork uses its suitable
light or dark logo background in both page themes; publisher names remain
available in text when images or colours are overridden. Source provenance is
recorded in `images/news/publishers/README.md`.

The spectroscopy suite passed six scans in Chromium 157.0.8103.40, including
pointer dragging, keyboard endpoints, image loading, no-JavaScript alternatives,
both themes/contrast variants, 320px reflow, 200% text and text spacing. Desktop
and mobile comparison screenshots were inspected. The media-card suite also
passed six scans with publisher-image loading and retained article links;
desktop, 320px and dark-theme screenshots were inspected. Reviewed incomplete
results concern existing title-image/button contrast and shared homepage icon
labels, not the new slider or media cards. Actual browser zoom, native
Safari, screen readers and speech control were not tested; this is not a
conformance claim.

## Press-release PDF link · 11 November 2026

Added a native link at the bottom of the DR1 release, before Back to latest news.
Its visible label identifies the PDF format and 472 KB size. The supplied PDF
was copied unchanged and the preview serves it successfully as application/pdf.
The PDF itself has not been audited for accessibility; the HTML release remains
available as the text version.
The updated HTML release passed six scans and shared interaction/reflow checks
in Chromium 157.0.8103.40. Existing incomplete checks and the manual-testing
limitations recorded below still apply.

## DR1 press-release copy revision · 11 November 2026

Reconciled the release against the latest supplied text. Added its three
spectroscopy paragraphs, including the Oxford GELSA work and 160 million
sources, before the strong-lensing section. The existing lens image follows
the paragraph introducing strong lenses. Both image assets, headline, issue
date, embargo and five quotation blocks remain. Media contacts remain omitted
under the user's standing instruction. The unused spectroscopy image caption
is not included without an accompanying image. All 15 supplied narrative
paragraphs were checked against the page source.
The release-page suite passed six scans in Chromium 157.0.8103.40, including
both themes/contrast variants, keyboard checks, narrow reflow, enlarged text
and text spacing. Existing incomplete contrast and shared homepage icon-label
checks remain; native Safari, actual browser zoom and assistive technology
were not tested for this copy revision. These checks do not establish conformance.

## Humans of Euclid fingerprint profiles · 10 November 2026

The shared Humans page embeds the Fingertip Galaxy and pairs its 19 existing
portrait profiles to highlighted marks. Pairings are explicitly illustrative;
the joint Elena/Carolyn portrait remains a joint profile. The original cards
remain in an optional List view; Meet the team and the past-event section
have been removed. Native buttons over the marks and in
a name-list disclosure open the same nonmodal photo/name/role/quote popup. Hover
and focus reveal it, click/tap pins it, and Escape, Close or outside activation
dismisses it. Hover content remains hoverable, keyboard activation reaches the
popup controls, and closing from within returns focus. The popup has no focus
trap; its team-list link reveals the list and focuses the corresponding full profile. Without
JavaScript the controls stay hidden and all original profiles are available.
The background-free galaxy follows light/dark page ink colours, extends beside
the desktop title and introduction, and rotates with its hit areas on portrait
mobile screens. The introduction follows the drawing on smaller screens.
Desktop popups sit beside their associated fingerprint and switch sides near
the screen edge.
Interactive marks use light blue in light mode and light purple in dark mode,
with no persistent circles.
This decorative accent has limited contrast in standard light mode; the
high-contrast version uses page ink, and equivalent named controls remain.

Chromium 157.0.8103.40 checks passed for desktop sidebar text, nearby popup
positioning, theme accents, portrait/landscape rotation, list toggling and
no-JavaScript fallback, plus all 19 pairings, hover persistence,
click pinning, Escape/focus restoration, touch access, nonoverlapping 24px map
targets at 320 CSS pixels, 44px-high alternative name buttons, enlarged popup
text, forced colours, light/dark themes and high contrast. Ten axe scans passed
with no violations; recorded incomplete background/curved-lettering contrast
checks were reviewed: popup text and button labels use the shared ink on a
solid surface; curved artwork lettering retains a readable SVG description and
an ESA background link. The standalone artwork page contains the full
transcript. Desktop and mobile popup screenshots
were inspected. Actual browser zoom, native Safari, screen readers and speech
control were not tested; these results do not establish conformance.

## Fingertip Galaxy recreation · 9 November 2026

The standalone artwork page fills the first viewport with a perspective-corrected
vector tracing of the supplied plaque photograph. Its 937 traced components
are individual SVG paths, with no animation or pointer-only actions. A keyboard
skip link targets the native transcript disclosure below the artwork. Readable
HTML provides the curved lettering, credits and a description; shared footer
navigation, light/dark themes and the remembered high-contrast preference remain.
The graphic preserves its proportions on mobile, while its transcript reflows.

Chromium 157.0.8103.40 checks passed for both themes/contrast variants, keyboard
disclosure and skip-link access, 320 CSS-pixel reflow, 200% text, WCAG text spacing,
font overrides, forced colours and no-JavaScript access. Four artwork axe scans
and two shared-homepage scans passed with no violations. Incomplete contrast
checks on the SVG lettering/gradient remain recorded for manual review; they
are not a conformance pass. Desktop and mobile screenshots were visually
inspected. Native Safari, actual browser zoom, screen readers and speech control
were not tested. See `docs/fingertip-galaxy.md` for trace details and credits.

## DR1 press-release copy revision · 9 November 2026

The latest supplied press-release copy replaces the DR1-Foundation headline,
body and revised quotations; the Latest News preview uses its headline and lead.
Both existing image elements, the quote styling, issue date and embargo remain.
The standing preference to keep contact details off release pages is preserved.

The release-page suite passed six axe scans and shared interaction checks in
Chromium 157.0.8103.40, including both themes/high contrast, narrow reflow,
enlarged text and text spacing. Existing contrast and homepage icon-label
incomplete results remain subject to manual review. The mobile title banner
was visually inspected. These checks do not establish conformance or replace
native Safari, actual browser zoom or assistive-technology testing.

## Resource card spacing · 11 November 2026

Featured cards now share flexible columns across the available content width,
with equal heights and wrapping down to one column on narrow screens. Images
remain uncropped and have a height limit when filtering leaves a single card.
The Space Warps heading is now “Zooniverse - Space Warps”. Desktop and 320px
screenshots were inspected. The layout suite passed six scans in Chromium
157.0.8103.40, including theme/contrast, keyboard and text reflow checks.
Existing incomplete results and manual-testing limitations below still apply.

## GravyLensing resource card · 11 November 2026

Added GravyLensing as the thirteenth resource, under All and Public engagement.
The card uses the supplied 512 × 512 WebP unchanged and the shared featured-card
layout. Its native link is named by the visible heading, description and tag;
the adjacent image is decorative. Desktop and 320 CSS pixel screenshots were
visually reviewed. Filter checks now cover its destination and audience visibility.
Chromium 157.0.8103.40 passed the resources suite with six scans and no failures,
including both themes/contrast variants, keyboard access, narrow reflow, enlarged
text, text spacing and the no-JavaScript fallback. Reviewed incomplete results
concern existing gradient/button contrast and homepage carousel icon labels;
none identify the new card. Native Safari, actual browser zoom and assistive
technology were not tested for this addition; this is not a conformance claim.

## Resource audience filters · 10 November 2026

All 12 resource items now show audience tags. Native buttons filter All,
Primary school, Secondary school, Citizen science and Public engagement, using `aria-pressed`
and a visible check mark for the selected option. Resources can have multiple
audiences. Filtering retains focus on the selected button, removes nonmatching
items from reading/tab order using `hidden`, hides empty sections and announces
the result count through a concise status message. Without JavaScript the
controls stay hidden and all tagged resources remain available. The redundant
Primary Schools heading and Resources breadcrumb have been removed.

Space Warps is tagged Citizen science and Public engagement while retaining
its existing Secondary school tag. Its Zooniverse destination is unchanged.
It now shares the ESERO image-card layout in the Featured resources grid,
using the supplied 190 × 190 PNG at `images/resources/space-warps.png`.
The whole card is one native link labelled by its visible text; its image is decorative
because the adjacent heading identifies the resource. Both cards appear under
All by default and remain visible without JavaScript.
The new Citizen science filter shows this one resource and announces the
singular result count; no duplicate resource was added.
On 10 November, Chromium 157.0.8103.40 passed the resources-page suite
with six axe scans and no failures. This includes the new category, both
themes/high contrast, keyboard activation and enlarged 320px reflow; the
320px filter layout was also visually inspected.
The subsequent Space Warps image-card update also passed six scans with no
failures. Both featured cards were visually reviewed at desktop and 320px
widths. Existing gradient/button contrast incomplete checks remain recorded;
the image card uses the shared solid surface and ink colours.

Chromium 157.0.8103.39 checks passed for all audience selections, keyboard
activation, retained focus, section hiding, both themes/high contrast, enlarged
text, forced colours and the no-JavaScript fallback. The resources suite passed
six axe scans; existing background-contrast and homepage icon-label incomplete
results remain, with no new filter failures. Desktop and mobile screenshots
were inspected. Final mobile spacing and heading checks confirmed no overflow
at 320 CSS pixels with 200% text and WCAG text spacing. Native Safari, actual
browser zoom and assistive-technology checks were not performed for this change.

## Primary-school resource tile · 9 November 2026

The Primary Schools section now has an ESERO-UK Euclid resource card, using the
user-supplied `images/resources/esero-team-logo.svg` unchanged. One native link
wraps the artwork, title, description and category; its accessible name comes
from the visible text. The redundant logo has empty alt text. The link opens
the existing STEM Learning Euclid teaching-resources destination.

Light/dark screenshots were visually inspected in Chromium 157.0.8103.39.
Targeted checks confirmed no horizontal page overflow at 320 CSS pixels with
200% text and WCAG text spacing. The resources-page accessibility suite passed
six axe scans across both themes and contrast variants, plus shared interaction
checks. Remaining incomplete results concern existing background-contrast and
icon-label checks, not the new card. Native Safari and assistive-technology checks
were not performed for this change.

## Carousel text clipping · 9 November 2026

The carousel text viewport now spans the full banner width, matching the image
viewport. Text retains its existing inset within each slide and is clipped only
at the banner edge during horizontal movement. This fixes the early clipping
caused by the former inset text viewport; it does not hide page overflow.

Targeted Chromium 157.0.8103.39 checks verified matching text/image positions
during touch dragging and button transitions at 1440, 390 and 320 CSS pixels,
with no horizontal page overflow. A separate ten-second automatic transition
check verified both incoming and outgoing layers remain aligned. Desktop drag
and transition screenshots were visually inspected. Native Safari, actual
browser zoom and assistive-technology testing were not performed for this fix.
Existing automatic-motion and image/gradient contrast limitations remain.
The complete shared-site check passed for 18 pages and 90 axe scans in the same
Chromium version, including keyboard navigation, reduced motion, forced colours,
both themes, high contrast, enlarged text, text spacing and the no-JavaScript
fallback. Homepage incomplete results were reviewed: contrast checks could not
resolve image/pseudo-element backgrounds, and icon-only arrow/close controls
retain descriptive accessible names. These results do not establish conformance.

## Homepage introduction · 4 November 2026

The shared top bar now alternates the release announcement with white UK Space
Agency and ESA logos every ten seconds. It reserves space for both frames to
avoid layout shifts and pauses on hover or keyboard focus. The top-bar and
carousel pause buttons have been removed at the user's request. Hidden tabs
suspend rotation. Reduced motion and
forced colours keep the announcement static; the no-JavaScript fallback shows
both items statically.
The partner artwork is cropped from the existing official white logo assets;
the originals remain unchanged.

The “Exploring the dark universe” heading, introduction and two mission/team
links now sit beside the telescope illustration, replacing the previous welcome
copy. The carousel now shows M81/NGC 3077, NGC 1291, the Galactic Bulge Survey,
then M78. The first slide introduces DR1-Foundation with the supplied heading,
description and “Explore the data” link. That link currently retains its image
gallery destination until a dedicated release destination is supplied. The NGC
1291 slide is image-only. M78 has the “A dark universe
detective” heading, temporary copy and a working mission link, with its existing
six-pointed star animation and credit. The original introduction is not duplicated. Both static
homepage URLs include the relocated introduction and links without JavaScript.
The existing button styles and theme choices are retained. The carousel advances
every ten seconds while visible and idle, wrapping from slide four to slide one.
It pauses while hovered, keyboard-focused or dragged, when off screen or in a
hidden tab, and when reduced motion, high contrast or forced colours are active.
Previously saved stopped-motion preferences remain respected. Manual navigation resets the ten-second
interval. Automatic changes do not move focus or announce every slide.
Standard carousel overlays have been softened, with a lighter gradient on the
image-only slide. The standard header gradient now fades gradually across its
full height, retaining the five-rem feather below the menu. Its appearance stays
consistent before and during scrolling. The high-contrast version, increased
contrast preference and forced-colour treatment are unchanged.

Without dedicated pause controls, the standard automatic rotation and continuing
decorative motion have a known WCAG 2.2.2 limitation. Hover/focus suspension and
reduced-motion support do not replace a persistent pause/stop mechanism.

The two new background images come from the user's embargo-labelled local DR1
assets. They are for the local preview and must not be published before the
authorised release. Original source images are unchanged; local WebP copies are
used by the carousel.

Homepage checks on 4 November 2026 passed in Chromium 157.0.8103.39 and WebKit
26.5 (22 axe scans per engine), including the new slide order, M78 motion on
slide four, keyboard/touch controls, both themes, high contrast, 320 CSS-pixel
reflow, enlarged text, text spacing and the no-JavaScript fallback. Desktop and
390 CSS-pixel layouts were also visually inspected. Incomplete image/gradient
contrast results remain subject to manual review; these engine checks do not
replace native Safari, actual browser zoom or assistive-technology testing.
Ten-second automatic rotation was subsequently checked in Chromium 157.0.8103.39
and WebKit 26.5, including wraparound, keyboard-focus pause, the remembered shared
pause control, off-screen pause and reduced-motion suppression. Both homepage
suites passed with 22 axe scans per engine.

## Main website migration · 7 October 2026

The approved site design is now the main website. The two homepage URLs share
identical static content; the previous React renderer is no longer loaded.
Navigation uses native disclosures, the search field is inline, and the carousel
supports buttons, keyboard input, dragging and touch swipes alongside pausable
ten-second automatic rotation.
The footer motion block has been removed. The decorative star animation loops,
with a compact pause/play icon beside the carousel controls. Pausing is remembered
after reload and also stops pointer-driven telescope movement. Decorative motion
respects reduced motion, forced colours, high contrast, and previously remembered
preferences. Telescope movement responds only to the visitor's pointer.
On 16 October 2026, the star timing was corrected: all four glows now start with
non-negative, staggered delays and loop smoothly. The animation stops on inactive
slides and hidden tabs. Display preferences override the pause/play control.

The Galactic Centre explorer deliberately keeps its original full-screen image,
toolbar, hotspots, status display, minimap and video playlist. Styling changes
are isolated in `css/euclid-galactic-centre-theme.css`; it does not use the ordinary
page header/footer layout. Its video overlay now uses a native modal dialog;
Escape closes it, pauses playback and returns focus. Image keyboard shortcuts
are scoped to the focused image, and feature zoom respects reduced motion.

Automated checks on 7 October 2026 used Chromium 154.0.8037.98 (15 main pages,
78 axe scans) and WebKit 26.5 (homepage, 22 axe scans). Separate interaction checks
cover the restored explorer, gallery and orbit in both engines. These exercise
320 CSS-pixel reflow, enlarged text, text spacing, keyboard input, both themes,
contrast choices, motion settings, inline search and the no-JavaScript homepage.
Results are saved under `.build/accessibility/main-site` and
`.build/accessibility/main-site-webkit`. These are browser-engine tests, not a
native Safari, actual 400% zoom, screen-reader or speech-control audit.

Incomplete axe results were inspected: gradients, image backgrounds and canvas
graphics need manual contrast review; symbol-only buttons have explicit names;
generic named containers are being corrected to meaningful groups. The existing
video playlist has no supplied caption tracks and still needs verified captions,
transcripts and any required audio description before release. Newsletter signup
has been removed from the website.
The original yellow navigation-hover treatment retains its documented contrast
limitations on light surfaces; the high-contrast styling is not evidence that the
standard version conforms. Linked legacy activities also require manual review.

The earlier shared-design review and release requirements follow.

## Our target

The website should be usable by as many people as possible, including people who
change fonts and colours, zoom to 400%, use a keyboard or speech recognition,
or read with JAWS, NVDA or VoiceOver. Use WCAG 2.2 Level AA as the technical target
and plain-language content as the editorial target. This is a development policy,
not a claim that every page is already fully conformant.

Visitors can find practical device-setting advice at
[AbilityNet: My Computer My Way](https://mcmw.abilitynet.org.uk/).

## Changes made in this accessibility pass

- Shared theme-aware focus indicators. Standard mode retains the original
  pre-audit contrast and palette; every shared-design footer links to a
  high-contrast version of the current page.
- Relative text sizing, measured header/banner heights, wrapping headings and
  low-height layouts for zoom. Added forced-colour, higher-contrast and
  reduced-motion support.
- Mobile menu initial focus, background inertness, scroll locking, Escape and
  return focus. Social links follow the menu options in the actual reading order.
- Skip links explicitly move keyboard focus. Mobile navigation remains visible
  without JavaScript, including the dropdown page links.
- Native modal dialogs for the sonification and 3D model, no automatic sound,
  and a pause/resume button for the decorative homepage video.
- The model no longer automatically spins or floats. Added labelled buttons to
  rotate and zoom it instead of relying on dragging.
- Added keyboard instructions for the dark matter reveal, and permanent orbit
  object buttons and readable selected-date/distance summaries below the scene.
- The visible "Survey progress" label is included in its accessible name.
- Date sliders expose meaningful dates rather than numeric sample indices;
  timeline playback does not continuously announce every frame. Contact tables
  have distinct accessible names and captions. Theme changes avoid briefly
  displaying old-theme text colours against the new background.

## Contrast versions

Select **High contrast version** at the bottom of any shared-design page to
use stronger foreground/background colours. The same page opens with
`?contrast=high`; the choice is remembered across page navigation when local
storage is available. Select **Standard contrast version** in the footer to
restore the original palette. Both options work with light and dark themes.
The controls preserve other query parameters and the current URL fragment.
These are display versions of the same content, not separately maintained pages.
The preference requires JavaScript; forced-colour and increased-contrast device
settings remain supported independently.

The high-contrast version includes darker backing behind text over videos and
image captions. The standard hero retains its original brightness and gradient,
without added text shadows. Keyboard, zoom, motion and semantic improvements
remain enabled in both versions.

## Automated checks

Install Node 20 or newer, then run:

```sh
npm install
npx playwright install chromium
npm run check:accessibility
```

The script discovers all new shared-design HTML pages by their common footer
stylesheet. It records standard-mode axe results, then checks the high-contrast
version in both themes, desktop and 320-by-256 layouts, enlarged text,
text-spacing overrides, keyboard menu/skip links, dialogs and forced colours.
It verifies the footer links and preference persistence. Standard-mode contrast
violations remain visible as known design limitations in the report and output;
all other violations, and every high-contrast violation, fail the check.
Reports, including axe items requiring human judgement, are written to
`.build/accessibility/report.json`.
The GitHub workflow runs the same checks on pushes and pull requests once pushed.
The JavaScript-disabled homepage check verifies rendered content and navigation;
axe itself requires JavaScript and is not run in that mode.

For a preinstalled test runtime, the script accepts `EUCLID_PLAYWRIGHT_PATH`,
`EUCLID_AXE_PATH`, `EUCLID_BROWSER_PATH` and `EUCLID_A11Y_OUTPUT` overrides.

Earlier result, 6 October 2026, before the brighter homepage styling was restored:
all 15 shared-design pages passed 64 axe scans
with zero reported violations and zero test failures using Chrome 154.0.8037.98
and axe-core 4.14.0. Keyboard, dialog, reflow, font/spacing overrides and the
JavaScript-disabled homepage checks also passed. The local run used bundled
Playwright 1.62.1 rather than the declared CI dependency; CI is not yet verified.
Items marked incomplete remain for human review, including contrast over imagery,
media captions and some accessible-name/attribute checks. This result is not a
conformance certification or a substitute for the manual checks below.

The subsequently requested standard styling restores the original colours.
Checks identify insufficient contrast for some original highlighted text;
the earlier zero-violation result no longer describes standard mode.
High-contrast mode is validated separately and is not evidence that the original
palette meets the contrast requirements.
Hero text over changing video imagery still requires manual contrast review.
The compact pause/play icon retains its accessible name, keyboard activation
and a 44-by-44-pixel target; these were separately verified in Chromium.

Latest result, 6 October 2026: 94 scans across the 15 shared-design pages,
including 64 high-contrast scans with zero reported violations. The 30 standard
desktop scans retain two contrast warnings (one report per homepage theme).
Footer switching, restoring standard mode, cross-page persistence, reflow,
keyboard and dialog tests passed. The outstanding manual checks still apply.

The orbit is tested using its HTML/UI shell with the WebGL engine removed, not
as a live astronomical renderer. External fonts, embeds and videos are blocked
in the automated run. Review those separately in a real browser. The 320-pixel
test is a reflow proxy, not a claim that actual browser zoom was tested.

## Required manual release checks

- [ ] Open every page in Chromium, Firefox and Safari. Test desktop/mobile and
  both themes and contrast versions. Check content while images, fonts or
  JavaScript fail to load. Verify the footer contrast links and saved preference.
- [ ] Set actual browser zoom to 200% and 400%. Check that text, menus, forms,
  pop-ups and controls remain readable/reachable, not merely hidden off-screen.
- [ ] Increase the browser's default font size to 200%; try user-defined fonts
  and text/background colours. Use Windows High Contrast and increased contrast.
- [ ] Apply 1.5 line height, 2em paragraph spacing, .12em letter spacing and .16em
  word spacing. Inspect every heading, label, button and text overlay.
- [ ] Use only Tab, Shift+Tab, Enter, Space, arrow keys and Escape. Check focus
  order, dropdowns, full-screen menu, modals, forms, model controls and sliders.
  Ensure sticky headers and overlays never cover focused controls.
- [ ] Test VoiceOver with Safari (macOS and iOS), NVDA with Firefox/Chrome, and
  JAWS with Edge/Chrome. Record installed versions and actual results. Check
  landmarks, headings, reading order, names, current-page state, image alt text,
  forms, error messages and status announcements.
- [ ] Test macOS/iOS Voice Control or Windows Voice Access. Confirm that visible
  button/link text can be spoken to activate it; icon-only controls are named.
- [ ] Run the live orbit with keyboard/screen reader support: select objects,
  change dates, start/pause playback, read date and distance summaries, reset the
  view, open information and take the guided tour. Compare descriptions to the
  rendered content, including the survey layer and manoeuvre list.
- [ ] Review every media item: accurate captions/transcripts, speaker labels,
  meaningful sounds and descriptions of important visuals. Validate the Vimeo
  player, sonification video, external model viewer and any other embedded tool.
- [ ] Confirm there is no autoplay sound, uncontrolled motion or hazardous
  flashing. Test with reduced motion enabled both before and after page load.
- [ ] Review alt text, terminology and copy with representative users. Automated
  tools cannot tell whether a scientific explanation is understandable.

## Known limits and outstanding verification

The automated scope is the 15 new shared-design pages, not the legacy `index.html`,
`rssse.html`, `media.html`, `scientists.html`, exhibition pages, standalone gallery
or external sites. They need separate review before migration/publication.

JAWS, NVDA, VoiceOver and speech-control compatibility has not been manually
verified in this pass. External videos/iframes have not been audited for captions,
transcripts, audio description or player behaviour. The live WebGL scenes still
need manual assistive-technology and touch testing; a text alternative does not
make every spatial visual feature equivalently available. Newsletter signup is
no longer included in the website.

Do not publish a blanket "fully accessible" claim until outstanding tests and
failures are resolved. Keep a dated record of any remaining limitations, responsible
owners and planned fixes, and provide an approved contact route for feedback.

## Reference criteria

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Reflow and the 400% requirement](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
- [Minimum text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [Pause, stop or hide automatic movement](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
- [WAI: evaluating website accessibility](https://www.w3.org/WAI/test-evaluate/)

Article image-layout follow-up (11 November 2026): six Chromium scans passed in
`.build/accessibility/exhibition-image-layout`. The entrance photo dimensions,
team photo in the body, exhibition button, both themes, contrast variants and
narrow reflow were checked; the desktop header crop was visually inspected.
Photographic text contrast still requires manual assessment in the standard
version; this result is not a conformance claim.

Search focus follow-up (11 November 2026): removed the inner purple underline.
Keyboard focus now outlines the complete field; forced colours retain the
system focus indicator. The combined resource/search run passed six Chromium
scans in `.build/accessibility/hunt-game-artwork-search`. An earlier run timed
out trying to focus a mobile submenu; the complete follow-up passed without
relaxing that assertion. Direct desktop/mobile checks confirmed the input has
no inset shadow, visible field focus remains, and the final game artwork frame
matches the other resource images. Native Safari remains unverified.


## Shared editorial cards and compact headers · 11 November 2026

Resources now places its introduction beside the heading and keeps wrapping
audience filters within the header. Humans of Euclid preserves the galaxy,
19 fingerprint profiles, hover/touch/keyboard access and list fallback, with
restyled profile cards, previews and controls. Events and the seven In the media
cards share the cream/purple surfaces, Anton headings, restrained corners and
subtle lift/image zoom. Reduced motion disables the added movement.

The package accessibility script was run directly with the bundled Node runtime
(npm is unavailable) using Chromium 157.0.8103.40. Targeted runs passed: Resources
6 scans, Humans 10 scans, Events 6 scans and Latest news 6 scans. Reports are in
`.build/accessibility/editorial-{resources,humans,events,press}-final`. Checks
include both themes and contrast versions, 320 CSS-pixel reflow, 200% text size,
text spacing, browser font overrides, keyboard/menu access and no-JavaScript
fallbacks. The profile-name assertion now compares source text because visible
headings are uppercased by CSS while the list is hidden; all profile names,
photos, quotations and adjacent preview positions remain checked.

Desktop/mobile Resources and desktop Humans/Events/media layouts were visually
reviewed, including dark cards and a dark fingerprint preview. Direct browser
checks confirmed reduced motion prevents portrait zoom. Homepage and
`euclid-home.html` remain byte-identical after regeneration.

Reviewed axe incomplete results concern shaped button/heading backgrounds,
pseudo-element backgrounds and arrow symbols versus accessible names; these
remain manual review items. Existing decorative standard-version contrast
limitations still apply. No automated result establishes WCAG conformance.
Native Safari, actual 400% browser zoom, screen readers and speech control
were not tested in this update and remain release checklist items.

Resources and media follow-up · 11 November 2026: the Resources introduction is
right-aligned; filter ticks and visible result counts have been removed. The
selected filter retains `aria-pressed`, a filled surface and a visible border;
there is no selected-text underline. A visually hidden live region announces
the audience without a count. Keyboard checks still verify all five audience
filters and the exact displayed cards. The page scan now waits for hover-opened
navigation to dismiss after leaving it; this prevents an intentional open menu
from obscuring filter targets during baseline scans. Earlier runs exposed this
open-menu scan state and a mobile focus assertion; the complete follow-up runs
passed without removing those checks.

Added dated IFLScience (15 October 2026) and Observer (10 July 2026) cards with
local publisher logos, bringing In the media to nine stories in date order.
Card previews were visually reviewed; both logos loaded and 320 CSS-pixel
reflow passed. Targeted accessibility runs passed six scans each for Resources
and Latest news using Chromium 157.0.8103.40. Reports:
`.build/accessibility/final-resources-filters-media` and
`.build/accessibility/final-press-filters-media`. Remaining incomplete axe items
relate to shaped/pseudo-element backgrounds and arrow labels, as above; manual
assistive-technology and actual browser-zoom release checks remain outstanding.

Floating portrait follow-up · 11 November 2026: circular Humans of Euclid
portraits now drift vertically by at most .45rem, using staggered 6/8/9-second
loops. The native button moves with its image so the hit area follows it.
Existing pause, profile selection/hover, page visibility and viewport state
freeze the animation. Reduced motion and forced colours disable floating;
mobile portrait orientation keeps the movement vertical on screen. Extended
fingerprint checks verify the small displacement, seamless loop, varied timing,
pause and selection behaviour. The main Humans run passed 10 Chromium scans in
`.build/accessibility/people-floating-portraits`; the final timing/mobile/forced
colours follow-up also passed in `.build/accessibility/people-floating-final`.
Manual screen-reader, speech-control and actual zoom checks remain outstanding.

Card brand colours · 11 November 2026: shared cards now use the website's light
blue/slate palette in light mode and its deep-purple/lavender palette in dark
mode. Resource cards and the homepage image cards use the same shared colour
variables as Humans profiles, Events and In the media; high-contrast and forced
colour overrides are preserved. Ten scoped axe scans across those five pages
and both themes found no violations, and 320 CSS-pixel page reflow passed.
The only incomplete scoped checks concern the existing shaped image-carousel
next-arrow background contrast, which remains a manual review item. The full
Resources run passed six Chromium 157.0.8103.40 scans. Reports are in
`.build/accessibility/brand-card-palette/`. These checks do not establish
conformance; manual assistive-technology/actual zoom checks remain outstanding.

First mosaic resource card · 11 November 2026: renamed the card to “Explore
Euclid’s first mosaic” and replaced the Deep Field South thumbnail with the
existing 2400 × 758 first 1% southern-sky mosaic. The full panorama is contained
within the standard card frame on black, with its scan outline visible; the
interactive destination and audience remain unchanged. Direct browser checks
verified the title, artwork dimensions, uncropped fit and link, and the card was
visually reviewed. The full Resources run passed six Chromium scans in
`.build/accessibility/resources-first-mosaic`. Manual release checks and the
previously documented incomplete automated findings still apply.

Image-led homepage cards · 11 November 2026: Here’s looking at Euclid now keeps
all six names and removes the secondary captions. Names appear in white over
rounded images, with a local dark fade behind the text and no coloured card
panel. Descriptive image alternatives and full-size image links remain. The
high-contrast version gives captions a solid theme surface, and forced colours
retain system text/background colours. Grid-overlaid captions can increase the
card height when text grows, rather than being absolutely positioned and clipped.
Desktop, 390px and 320px previews were visually checked; carousel controls,
keyboard access, enlarged text, text spacing and no-JavaScript fallbacks passed
in the full homepage run (22 Chromium 157.0.8103.40 scans), stored in
`.build/accessibility/home-overlay-image-cards`. `index.html` and
`euclid-home.html` remain identical. Axe left photographic caption/background
contrast, shaped controls and symbol/accessible-name comparisons incomplete;
these need manual review, alongside the existing release checklist. No
conformance or assistive-technology compatibility claim is made.

Chronological homepage image cards and title · 11 November 2026: the browser
title is exactly “Euclid UK” in both homepage files. The image carousel now
uses a dated catalogue of 38 distinct observing views, from the existing
DR1-Foundation embargo preview back to the July 2023 commissioning images.
Wide survey mosaics, sky maps, diagrams, hardware, artwork and annotated
duplicates are excluded. Each entry records its release date, source, full
credit, descriptive alternative text and actual image dimensions. Individual
credits and source links are available in a native disclosure below the cards;
the cards retain white object names without secondary captions.

The full homepage check passed 22 Chromium 157.0.8103.40 scans with no failures
or standard-contrast warnings, recorded in
`.build/accessibility/home-release-catalogue/report.json`. Keyboard previous/next
and last-card access, chronological ordering, 320 CSS-pixel reflow, enlarged
text, text spacing, both themes/contrast settings, reduced motion and the
no-JavaScript fallback were checked. Desktop, 390px and 320px card previews
were visually reviewed; all 38 card images decoded successfully. Both homepage
files remain identical. Axe's incomplete contrast findings concern image and
pseudo-element backgrounds; incomplete label/name checks concern symbol
controls. Their existing accessible names and arrow meanings were inspected;
photographic contrast still needs manual review. These checks do not replace
actual browser zoom, screen-reader or speech-control release checks.

Events recording destination · 11 November 2026: the “What are the Universe’s
greatest mysteries?” card now points to the Royal Society recording page.
The existing visible “Watch recording” label, card image, keyboard link and
top-right tab placement are preserved. The targeted Events check passed six
Chromium 157.0.8103.40 scans, with no failures or standard-contrast warnings,
in `.build/accessibility/events-royal-society-recording/report.json`.
Existing incomplete contrast/name findings and manual release checks still
apply; this does not establish the accessibility of the third-party player.

Homepage image selection · 11 November 2026: removed the 12 requested cards
from the image carousel and its credits, leaving 26 in chronological order.
“Deep Field South 17x” was matched to the existing 16× close-up; the 70×
view remains. Both homepage files are identical and include the same selection
without JavaScript. The full homepage run passed 22 Chromium 157.0.8103.40
scans in `.build/accessibility/home-curated-images/report.json`, including
keyboard carousel controls, last-card focus, 320px reflow, enlarged text, text
spacing and both themes/contrast settings. Existing incomplete photographic
and pseudo-element contrast findings and symbol/name comparisons still require
manual review. Actual zoom and assistive-technology release checks remain
outstanding; no conformance claim is made.

Mobile hero spacing · 11 November 2026: added a fluid bottom margin to the
mobile hero text stage so slide copy sits higher above the pagination. At
390×844 the text moved up 33px; at 375×667 it moved up 28px, with controls
unchanged in both cases. Desktop measurements were identical. At 320×568 the
content remains in normal flow and the banner grows to accommodate it rather
than overlapping the menu or clipping text. Mobile first/third/fourth slide
previews were captured, and the first and third were visually inspected.
The full homepage check passed 22 Chromium 157.0.8103.40 scans, including
320px reflow, 200% text, text spacing, keyboard navigation and no-JavaScript
fallback, in `.build/accessibility/home-mobile-slide-spacing/report.json`.
Existing incomplete contrast and icon/name checks and the manual release
checklist remain applicable; actual zoom and assistive-technology checks
were not performed for this spacing change.

Homepage image drift and Events sections · 11 November 2026: removed the
image-credits disclosure and added “Explore a gallery of our favourite images
from the Euclid mission so far.” beneath the image strip. Native horizontal
overflow remains available, with the visual scrollbar hidden and previous/next
buttons retained. Automatic drift eases up to 18px per second; fractional-pixel
correction avoids whole-pixel stepping in browsers that round scroll offsets.
Pointer/wheel activity pauses it, continued native scrolling resets the idle
timer, and movement resumes after 1.6 seconds of inactivity. Keyboard-visible
focus holds it still. Reduced motion, forced colours, the saved motion choice,
high contrast, off-screen placement and hidden tabs suspend automatic drift.
No live announcement is made for each automatic movement.

The separate Pause/Resume control was removed at the user's explicit request.
There is therefore no dedicated persistent pause control in the standard view;
temporary interaction pauses and preference-based static modes remain. This
limitation requires manual motion-accessibility review and is not a WCAG
conformance claim.

Events now has labelled Upcoming events and Past events sections. No future
event dates were invented; the upcoming section has an announcement placeholder.
The existing recording and exhibition content are retained under past events
with sequential headings and their existing links.

The homepage run passed 22 Chromium 157.0.8103.40 scans and Events passed six,
with no failures or standard-contrast warnings, recorded in
`.build/accessibility/home-image-autoscroll/report.json` and
`.build/accessibility/events-upcoming-past/report.json`. New interaction checks
cover fractional movement, idle restart even with the pointer over the cards,
continued manual scrolling, keyboard focus, forced colours, reduced motion,
no repeated announcements and off-screen suspension. Existing text/reflow,
keyboard and no-JavaScript checks passed. The final “selection” to “gallery”
copy-only edit was checked separately after the full runs. Incomplete contrast
checks concern photographic/pseudo-element backgrounds, and incomplete label
checks concern arrow controls; their prior manual-review limitations remain.
Actual 400% browser zoom, native Safari and assistive-technology release checks
were not performed.

Homepage news cards · 11 November 2026: renamed the section “Latest tales from
across the Universe” and replaced its three generic stories with the three
articles from Latest News. The build reads the news-page source so story order,
images, titles, dates, article links and embargo wording remain aligned.
Rounded cards use the shared light/dark editorial colours, and All news links
to Latest News. The news strip has native manual horizontal scrolling with
previous/next buttons only when its contents overflow. It has no autoplay or
requestAnimationFrame loop, and all stories remain linked without JavaScript.

The reflow checker now treats the news strip as an intentional horizontal
carousel and checks every card's text against that card's bounds, rather than
flagging deliberately off-screen stories as page overflow. Existing page-width
and text-spacing guards remain. Checks cover article destinations and dates,
mobile keyboard next/previous and last-card focus, controls hidden when all
three cards fit, no-JavaScript links, and absence of automatic scrolling even
with device motion enabled. Desktop, 390px and 320px previews were captured;
desktop and 390px were visually reviewed, and all card images decoded. A dark
preview was also captured.

The full homepage run passed 22 Chromium 157.0.8103.40 scans, with no failures
or standard-contrast warnings, in
`.build/accessibility/home-latest-news-carousel/report.json`. Both homepage
files are identical. Remaining incomplete contrast findings concern existing
image/pseudo-element backgrounds; symbol/accessible-name comparisons include
the manual carousel arrows and retain descriptive labels. Those findings,
actual browser zoom, screen readers and speech control remain manual release
checks. No WCAG conformance claim is made.

Homepage layout and search focus · 11 November 2026: the image and news
carousel viewports now reach the window edges, with initial cards and headings
aligned to the text gutter. At 1440, 390 and 320 CSS pixels the page did not
overflow horizontally. Full-width and raised mobile hero checks each passed
22 Chromium 157.0.8103.40 scans with no failures or standard-contrast warnings
(`home-full-width-carousels` and `home-mobile-hero-raised` report directories).
The mobile hero copy moves approximately 49–51 pixels higher on typical phones;
shorter screens retain natural vertical reflow. The 390px first-slide preview
was visually reviewed. Both generated homepage files remain identical.

Search now uses a single contiguous border when the field has keyboard focus:
the existing border darkens and thickens inward instead of adding a separate
outer purple ring. Forced colours retain a system-coloured focus indicator.
No device-theme option was added. Existing theme logic was checked separately
with simulated light/dark device defaults, live preference changes and manual
override persistence during device changes; this was a script-level check,
not native operating-system testing. Release checks for actual browser zoom,
screen readers, speech control and native Safari remain outstanding.

The final search run passed 22 Chromium 157.0.8103.40 scans with no failures
or standard-contrast warnings in
`.build/accessibility/search-single-border/report.json`. Keyboard checks verify
that the field receives focus, no external outline is drawn, the border gains
an inward focus treatment, and its usual accent returns on blur. The search
preview was visually reviewed. Incomplete axe findings still involve
pseudo-element/image backgrounds and symbol names (including the × control
named “Close search”); these automated uncertainties do not establish contrast
or assistive-technology conformance.

Mobile hero centering and themed search · 11 November 2026: mobile slide
content and captions are now centered vertically in the banner, with symmetric
space reserved for the masthead and the bottom controls. Checks at 390×844,
375×812, 375×667 and 320×568 verified centering, menu/control clearance and no
page-width overflow on all three text-bearing slides. Short screens allow the
banner to grow naturally. The 390px first-slide preview was visually reviewed.

The focused search border now retains the icon's light purple (#bba9cb), with
its inward thickness indicating focus. Dark mode uses a black field, white
input/placeholder text and a white close symbol/focus indicator. A focused dark
preview was visually reviewed; computed colours match the requested palette,
and forced colours remove the decorative inset shadow. The full homepage
check passed 22 Chromium 157.0.8103.40 scans with no failures or standard-contrast
warnings in `.build/accessibility/centered-hero-themed-search/report.json`.
Incomplete background-contrast and symbol-name findings remain as above;
native Safari and manual assistive-technology release checks remain outstanding.

Resources-only publication preparation · 11 November 2026: created an isolated
27-file package based on GitHub main at 85558a10. No existing published file is
changed. The publication copy removes the unreleased announcement and replaces
the full shared search index with resource text and descriptions of existing
public pages. Navigation targets current public pages. Only the eight resource
cards' artwork, required styles/scripts, original vector logos, favicon files
and licensed fonts are included. The full local redesign is unchanged.

The repository Resources check passed six Chromium 157.0.8103.40 scans with no
failures or standard-contrast warnings (`resources-publish-source/report.json`).
The exact publication package passed eight additional scans with no failures,
warnings or asset-loading errors (`resources-publication/report.json`). Checks
covered all filter counts, resource search, keyboard menu/Escape focus return,
320px reflow with 200% text and spacing, image decoding and no-JavaScript access.
The desktop light preview was visually reviewed with all images decoded.
Incomplete search contrast/symbol findings remain manual review items; the
mobile aria-controls finding references a closed dialog whose ID was confirmed
present. Actual browser zoom, native Safari, screen-reader and speech-control
checks remain outstanding; this is not a conformance claim.

Commit 97696957 was prepared in isolation, but the push failed because GitHub
HTTPS authentication was unavailable and the SSH agent had no identities.
Nothing was uploaded. A recoverable bundle and manifest are saved locally in
`.build/releases/resources-only/`, which is ignored by Git.

Homepage mission sections · 11 November 2026: replaced the curiosity destination
grid with three independently labelled sections: The Science, The Technology
and The People. Each has a level-two heading, concise introduction, informative
image and descriptive native link. Desktop imagery alternates sides; mobile
keeps the copy before its image in a single column. The people section uses the
existing exhibition team photograph. Both themes, forced colours and the
high-contrast version retain their shared settings. Removed the Stay curious /
Space for everyone block and its two buttons; reduced the news section's extra
bottom space that had accommodated that removed block.

Both generated homepages are identical and show all sections without JavaScript.
Checks verify the three section destinations and image decoding, and that the
removed sections do not return in the fallback. The full homepage run passed
22 Chromium 157.0.8103.52 scans with no failures or standard-contrast warnings
in `.build/accessibility/home-mission-sections/report.json`, including narrow
reflow, enlarged text, spacing and keyboard checks. Desktop science and mobile
technology/people previews were visually reviewed, including dark mode. Axe's
remaining incomplete background-contrast and symbol-name findings are the
existing manual-review items; actual browser zoom, native Safari, screen readers
and speech control have not been verified. No conformance claim is made.

Homepage news heading · 11 November 2026: renamed the section “Latest news”
and removed the All news link. The three story links and native carousel
controls remain. Both generated homepages match, including the no-JavaScript
fallback. Existing carousel checks now expect the requested heading and verify
that the removed link is absent. No new interaction pattern was introduced.
The homepage run passed 22 Chromium 157.0.8103.52 scans
with no failures and 0 standard-contrast warnings, recorded in
`.build/accessibility/home-latest-news-label/report.json`. Remaining incomplete
background-contrast and symbol-name findings retain their manual-review status;
this does not establish WCAG conformance.

Homepage science introduction · 11 November 2026: replaced the short science
summary with the four requested paragraphs and their strong emphasis. Removed
the visible large heading while keeping a visually hidden level-two heading
to name the section. The existing image and Explore the science link remain.
Desktop and 390px section previews were reviewed; both generated homepages
match. No new interaction pattern was introduced.
The homepage check passed 22 Chromium 157.0.8103.52 scans,
with no failures and 0 standard-contrast warnings, in
`.build/accessibility/home-science-copy/report.json`. Checks include narrow
reflow, enlarged text and spacing, keyboard navigation and no-script content.
Remaining incomplete contrast and symbol-name findings retain the existing
manual-review limitations; this does not establish WCAG conformance.

Homepage science summary · 11 November 2026: replaced the four-paragraph
science introduction with the requested single paragraph beginning “Euclid is
designed to explore the composition and evolution of the dark Universe.” The
image, hidden section heading and Explore the science link are unchanged.
Generated homepage and no-script fallback content remain identical.
The homepage check passed 22 Chromium 157.0.8103.52 scans
with no failures and 0 standard-contrast warnings, in
`.build/accessibility/home-science-summary/report.json`. Existing incomplete
contrast and symbol-name findings remain manual-review items. No assistive-
technology or WCAG conformance claim is made.

Merged homepage introduction · 11 November 2026: moved the science summary into
the existing Exploring the dark universe section, below its UK-team lead text.
Removed the separate science section and galaxy photograph. The introduction
uses the existing decorative, theme-aware Euclid outline with its established
reduced-motion behaviour. Explore the mission and Meet the team are removed;
Explore the science remains as the single native link. Technology and people
remain separate sections. Both generated homepages match. Desktop layout was
visually reviewed; mobile previews were captured. Existing checks were updated
for the merged content and single introduction action.

Homepage M78 section removal · 11 November 2026: removed the Stellar Nursery
M78 heading, paragraph and Explore the images link from the homepage additions.
Rebuilt the site; index.html and euclid-home.html remain identical. The homepage
checker passed 22 scans in Chromium 157.0.8103.52 with no failures;
report: `.build/accessibility/home-remove-m78/report.json`. Existing incomplete
contrast and symbol-name checks still require manual review. This content
removal does not establish WCAG conformance; manual assistive-technology and
actual browser-zoom testing remain outstanding.

Build your own Euclid resource photo · 11 November 2026: replaced the
spacecraft illustration with the supplied paper-model photograph, cropped
to the existing 3:2 card ratio. Visually inspected the crop and supplied
descriptive alt text. Resources checks passed 6 scans in Chromium 157.0.8103.52;
report: `.build/accessibility/resources-model-photo/report.json`. Existing
incomplete contrast checks require manual review; this does not establish
WCAG conformance or assistive-technology compatibility.

Events map, festival cards and shared alignment · 11 November 2026: added
New Scientist Live, Orkney, Swansea and Edinburgh event cards. Retained the
Royal Society recording with revised body copy and independent team links;
removed the exhibition blocks. Added a theme-aware Natural Earth UK silhouette
with native keyboard-accessible city links, 44px minimum targets, focus/hover
place labels and static pin symbols. Orkney states Recording coming soon.
Map extends into the header on desktop; later cards use all three columns
below it. Compact card width is capped at 22rem without row stretching.
Shared headings and content use the masthead gutter; original Humans hero
photo is now used by the homepage People section. Homepage and fallback match.

Full shared-site checks passed 19 pages / 102 scans in Chromium 157.0.8103.52
with zero failures and zero standard contrast warnings. Report:
`.build/accessibility/shared-alignment-events/report.json`. Final event grid
checks passed 6 scans in `.build/accessibility/events-final-layout/report.json`.
Follow-up browser checks verified compact widths, the third column below the
map, image loading and 320px reflow with 200% text and WCAG text spacing.
Heading/logo alignment was checked on 16 pages at 1440px and 320px. Desktop
and mobile previews were reviewed in light mode; dark preview was captured.
Existing incomplete contrast and label/name checks remain manual-review items.
Safari, actual 400% browser zoom, screen readers and speech control were not
verified in this change; no WCAG conformance claim is made.

Events map sizing and consistent card heights · 11 November 2026: limited
desktop map width using available viewport height; verified the entire map
fits at 1440 × 768 and 1440 × 900. Event cards retain the 22rem width cap
and use equal flexible row heights, allowing content to expand rather than
clipping it. Removed the introductory telescope sentence from the recording
card. Verified all five card heights match, the image assets load, later
cards fill the third column, and 320px reflow with 200% text plus text spacing.
Events checks passed 6 scans in Chromium 157.0.8103.52; report:
`.build/accessibility/events-sized-map/report.json`. Existing incomplete
contrast/name checks remain manual-review items; assistive-technology and
actual browser-zoom testing remain outstanding.

Resources-based events layout · 11 November 2026: supersedes the sidebar
and mobile map disclosure above. Events now use the Resources card grid,
matching its card widths and image ratio, with All/Upcoming/Past filters.
The visible header map has independent native city links and extends slightly
below the header on desktop. Cards start below its bottom edge. Map links
reveal past cards if the Upcoming filter has hidden them. No continuing
animation was added. Mobile markers have 24px targets (desktop 44px), with
non-overlapping hit areas verified at 320px and 390px. Markers retain explicit
accessible names while the visible place labels appear on hover/focus.

Desktop header height was measured against Resources: both are approximately
232.56px at 1440px and 1280px viewport widths. Smaller-screen headers reflow
to fit their respective copy. Final event checks passed 6 scans in Chromium
157.0.8103.52; report `.build/accessibility/events-header-match/report.json`.
Visuals were reviewed at 1440/390/320px; browser checks also covered 1280px,
exact resource-card width matching, equal flexible heights, map clearance,
non-overlapping pins, 320px with 200% text/spacing and no-script fallback.
Existing incomplete contrast/name findings, actual browser zoom and manual
assistive-technology review remain outstanding; this is not a conformance claim.

Homepage UK contribution copy · 11 November 2026: replaced the technology
summary with the two supplied paragraphs about UK Space Agency investment,
VIS leadership and data processing. Homepage section headings are now
Contributing UK expertise and To an international mission. Native links,
section labels and the selected photographs remain intact. Both generated
homepages match. The homepage checker passed 22 scans in Chromium
157.0.8103.52; report `.build/accessibility/home-contributing-expertise/report.json`.
Existing incomplete checks and manual-review limits remain as recorded above.

Events and Resources title alignment · 11 November 2026: aligned both
header titles to the same top and left edge, independent of description
length and map dimensions. Corrected the 4px mobile padding difference.
Measured matching title x/y coordinates and font-box heights at viewport
widths 1440, 1280, 1024, 768, 390 and 320px in Chromium 157.0.8103.52.
Both pages passed their 6-scan checks (12 total); reports are
`.build/accessibility/events-aligned-titles/report.json` and
`.build/accessibility/resources-aligned-titles/report.json`. Existing incomplete
contrast/name findings and manual assistive-technology review remain outstanding.

Humans profile grid and event artwork · 11 November 2026: removed the galaxy
caption, list/name controls and repeated profile heading; linked the curved
artwork title with a keyboard-accessible native SVG link. All 19 profiles
remain in the resource-style grid, with original event filters (All, RAS
London 2023, Rome 2024, RAS London 2024, Leiden 2025). Filter buttons use
native pressed states and a concise status; without JavaScript all cards
remain available. Profile preview links restore All if their card is filtered
out. The introduction now lists project management and press and journalism.
With the portrait control removed, decorative introductory motion finishes
within 4.5 seconds; reduced motion/forced colours keep it still. New Scientist
Live uses the supplied complete logo on a light card frame. Shortened the
IFLScience headline. Chromium 157.0.8103.52: Humans grid passed 10 scans and
Events passed 6 scans; screenshots reviewed at desktop and 320px widths.
Final Humans filters also passed 10 scans. Report: `.build/accessibility/humans-event-filters/report.json`.
Existing incomplete contrast/name checks require human review. Actual 400%
browser zoom, Safari, screen readers and speech control remain untested for
these changes. No publication or conformance claim is implied.

Dynamic Earth exhibition card · 11 November 2026: added the 14–22 February
2026 exhibition to Past Events, with the supplied Science Festival artwork, concise summary
and native link to the organiser. Artwork is contained in the common 3:2
frame so its lettering is retained. Six past cards remain filterable; checked
at 320px with no horizontal overflow and reviewed the rendered card.
Report: `.build/accessibility/events-dynamic-earth-exhibition/report.json`.
The Edinburgh map location is shared with the existing Edinburgh festival
entry. The same manual review limitations above still apply.

Event image revision: Edinburgh Science Festival uses a 3:2 crop of the
supplied header’s left-hand festival lettering. Dynamic Earth exhibition
uses the same supplied header in full, as subsequently requested. Both have
decorative alt text because the adjacent card headings identify the events.
Final Events check passed 6 scans in Chromium 157.0.8103.52. After the image
revision, both replacement images decoded successfully; reviewed the
rendered cards and confirmed no horizontal overflow at 320px.

Orkney card logo revision: replaced the event image with the supplied
International Orkney Science Festival logo. Contained the full logo on white
inside the existing card frame; decorative alt text and the recording-coming-
soon label remain. Chromium mobile check at 320px confirmed image decode,
contained sizing, retained label and no horizontal overflow.

Royal Society Summer Science Exhibition card · 11 November 2026: added a
separate past event for 30 June–5 July 2026 using the supplied artwork and a
native link to `rssse.html`. The image is contained in the common card frame
with a matching red background so all artwork lettering and dates remain
visible. Decorative alt text avoids repeating the adjacent event heading.
Desktop/mobile card screenshots reviewed; checked at 320px, image decode,
link destination and Past/Upcoming filtering. Report:
`.build/accessibility/events-royal-society-exhibition/report.json`.
Manual review limitations recorded above still apply.
Events checker passed 6 scans in Chromium 157.0.8103.52 after this addition;
remaining automated incomplete checks are colour contrast and visible-label
name review. This does not establish WCAG conformance.

Dynamic Earth logo replacement · 11 November 2026: replaced the exhibition
card image with the supplied vector logo, contained on white in both themes.
Retained the event heading, decorative alt text, dates and destination.
Chromium 157.0.8103.52 targeted checks verified SVG decode, contained image
sizing, white backdrop and no horizontal overflow at 320px in light/dark
modes; rendered screenshot reviewed. Earlier Events 6-scan check covered
the unchanged card structure and filters. Manual review limits remain.

New Scientist Live image background · 11 November 2026: explicitly set the
transparent logo image’s background to white, retaining the contained logo
and card dimensions. Targeted Chromium checks confirmed the white backdrop
in light/dark modes and no horizontal overflow at 320px.

Swansea Science Festival artwork · 11 November 2026: replaced the event
card image with the supplied bilingual festival artwork, contained in the
existing card frame with a matching blue background. Retained decorative
alt text, event heading and destination. Targeted Chromium checks confirmed
image decoding, contained sizing and no horizontal overflow at 320px in
both themes; mobile screenshot reviewed.

Events year filters and Seeing into Space · 11 November 2026: added the
November 2025 online Glasgow Science Centre session with a Watch recording
tag and native link to its recording page. Replaced Past with 2026 and 2025
filters beside All and Upcoming. Native pressed buttons and concise status
announcements remain; map links reveal their target’s year before following
the anchor. Corrected the grid display rule so individually hidden cards
remain hidden. All eight cards remain available without JavaScript.
Chromium 157.0.8103.52 passed 6 scans; report:
`.build/accessibility/events-year-filters/report.json`. Also tested all four
filters and map links at 1440px and 320px: All 8, 2026 7, 2025 1, Upcoming 0.
The user-supplied white Glasgow Science Centre logo retains transparency,
is contained with 2rem padding, and uses #58448a from the organiser’s public
gsc-innovation/css/style.css (Innovation/event background). Targeted final
checks confirmed this colour, smaller logo, Watch recording tag and no
horizontal overflow in both themes at 320px; screenshots reviewed. Existing
automated incomplete checks and manual review limitations remain.

Festival of Speed 2025 and supplied purple swatch · 11 November 2026:
added a Goodwood Festival of Speed card under 2025, with the Sussex
article’s team photograph, informative alt text, concise event summary
and native article link. All shows nine cards; 2025 shows two and 2026
shows seven. Sampled the user’s solid swatch as #2e2d42 (46,45,66) and
applied it behind the smaller transparent Glasgow Science Centre logo.
Targeted Chromium desktop/320px checks verified the card image, destination,
year filtering, exact background colour and no horizontal overflow;
rendered card screenshot reviewed. Full report:
`.build/accessibility/events-goodwood-2025/report.json`. Existing automated
incomplete checks and manual review limitations remain applicable.
Events checks passed 6 scans in Chromium 157.0.8103.52 for this addition;
this is automated evidence only, not a conformance claim.

AI and the Sky planetarium card · 11 November 2026: added What’s Up: AI
and the Sky under 2026 with the organiser’s 14 February–31 May 2026 dates,
original artwork, concise explanation of artificial intelligence and a
Planetarium show tag. Native link opens the organiser’s event page. The
contained decorative image retains the full lettering, with the adjacent
heading providing its text equivalent. Targeted Chromium 320px checks
verified decoding, visible tag, both themes, year filtering and no
horizontal overflow; rendered card screenshot reviewed. Full report:
`.build/accessibility/events-ai-sky/report.json`. Existing incomplete
automated checks and manual review limitations remain.

2025 planetarium shows and Upcoming message · 11 November 2026: added
What’s Up: Dark Matter Detectives (3 September–28 November 2025) and
What’s Up: Spring (March 2025) under 2025, each tagged Planetarium show
and linked to the supplied organiser/Instagram page. The spring post
confirms Q1 images and UK science content; reused the existing high-resolution
Q1 Deep Field South image because the post’s downloadable preview cuts off
its lettering. Dark Matter Detectives uses the organiser’s complete artwork
contained on black. Decorative lettering images have empty alt text; the Q1
photograph has descriptive alt text. All 12, 2026 8, 2025 4, Upcoming 0.
The 2027 tour message now appears only when Upcoming is selected, outside
the header. There is no separate 2027 filter. Native pressed states and a
concise live status remain; without JavaScript all cards are available and
inactive controls/message are hidden. Desktop and 320px checks confirmed
filter counts, message visibility, no horizontal overflow, image decoding
and show tags; screenshots reviewed. AI and the Sky and the additional 2025
show checks each passed 6 scans in Chromium 157.0.8103.52. Latest report:
`.build/accessibility/events-upcoming-shows/report.json`. Existing incomplete
checks and manual assistive-technology/actual zoom review limits remain.
Final Upcoming-only message check passed 6 scans in Chromium 157.0.8103.52;
this automated result does not establish conformance.

Scientists directory, article alignment and Events header · 11 November
2026: compared the complete live Scientists page with the local content.
Rebuilt it as a compact shared-design page with six native section links,
11 contact groups (25 entries), six coordination members, UK-specific
membership guidance and links, historical IRIS allocation and eight past
meetings with all seven supplied meeting links. Verified all 31 entries
against the live source’s names, role identifiers and institutions; corrected
the source’s Londonn typo and replaced the superseded coordination entry
with Rebecca Bowler. Native lists and headings replace repetitive tables,
with Anton headings and Space Grotesk text. No contact details were invented.
The UK membership guide remains on the existing live site.
Restored centred 65rem article reading columns inside a centred 90rem body
on DR1-Foundation, Q1 and Royal Society pages; paragraphs remain left
aligned for reading and quotes retain the same body width. Verified all
three column centres at 1440px. Moved Events filters to a full-width row
matching Resources: same left edge, width and bottom inset at 1440, 390
and 320px. Raised the map by .5rem. Corrected enlarged-text overflow by
letting its header text wrap and limiting the map reservation proportionally.
Scientists, DR1 and Events each passed six scans in Chromium 157.0.8103.52.
Reports: `.build/accessibility/scientists-directory-layout/report.json`,
`.build/accessibility/dr1-foundation-directory-layout/report.json`,
`.build/accessibility/events-header-filters/report.json`. Screenshots reviewed
for Scientists desktop/mobile; tested forced colours and mobile reflow.
Automated incomplete colour-contrast and visible-label/name checks remain;
manual assistive technology, actual 400% browser zoom and Safari review
are still outstanding. No WCAG conformance claim is made.

Humans neutral portrait cards · 11 November 2026: changed profile cards
to white backgrounds with black headings, location labels and quotes in
both standard themes. The galaxy previews retain their existing style.
Explicit high-contrast mode still uses its selected readable palette; forced
colours use Canvas/CanvasText without disabling system overrides. Extended
the profile checks to verify card background and all text colours in both
standard themes. Reviewed a rendered card in both themes. Final report:
`.build/accessibility/humans-neutral-cards/report.json`. Existing manual
review limits remain applicable.
Humans checks passed 10 scans in Chromium 157.0.8103.52, including profile
interaction and no-script fallback tests; manual review remains outstanding.


For Media layout and homepage gallery · 12 November 2026: reorganised the
media page into press releases, a UK expert directory and More information.
Compared all 13 live contact rows (names, institutions, emails and expertise)
against the new source; all match. Restored ESA and consortium image links.
Release cards derive from the Latest News source to preserve titles, dates
and embargo notices. Registration remains a labelled disabled placeholder.
Six automated scans passed in Chromium 157.0.8103.52, including both themes,
high contrast, narrow reflow, enlarged/spaced text, navigation and keyboard
checks: `.build/accessibility/media-redesign/report.json`. Reviewed desktop
light and 320px dark screenshots; images decoded and keyboard section links
worked in both themes and sizes. The incomplete heading contrast item is
caused by the shared background layering and needs manual contrast review;
no automated result establishes standard-version conformance. Actual browser
400% zoom, Safari, screen reader and speech-control review remain outstanding.
Removed image links and directional link arrows from the homepage image
gallery, retaining semantic figures, captions, native scroll and arrow controls.
The no-script homepage is regenerated alongside the main homepage.

Follow-up theme and membership updates: portrait cards now use white/black
in standard light mode and black/white in standard dark mode, superseding
the preceding white-in-both-themes note. High contrast and forced colours
retain their own palettes. Humans checks passed 10 scans:
`.build/accessibility/humans-neutral-themes/report.json`. Added the local
membership guide, retaining the live procedure, links, categories and FTE
thresholds, and the supplied IRIS logo in Scientists. Six scans each passed:
`.build/accessibility/membership-redesign/report.json` and
`.build/accessibility/scientists-membership-iris/report.json`. Local guide
navigation, logo decoding, no-script membership content, 320px reflow,
enlarged/spaced text and forced colours were checked. Events map is now
12.25rem wide at top -1.25rem on desktop, with responsive mobile dimensions;
six scans passed at `.build/accessibility/events-larger-raised-map/report.json`.
Manual review limitations above remain applicable to these automated results.

Homepage gallery final verification: removed links and link-arrow decorations
from every image in both generated homepages. The list itself has tabindex=0
so native arrow-key scrolling remains possible; previous/next buttons remain.
Verified native right-arrow scrolling and no links in the gallery; reviewed a
rendered screenshot. Final check passed 22 scans in Chromium 157.0.8103.52:
`.build/accessibility/home-gallery-unlinked/report.json`, including the
no-script fallback and motion preferences. No manual conformance claim.
Media follow-up: renamed Images and photos to More information, updated its
section shortcut, removed both requested section descriptions, and reduced
release cards to a responsive 18rem minimum auto-fill grid with 1.4rem titles
and 1rem inner padding. At 1440px cards are 316px wide rather than 652px;
reviewed the rendered compact section and retained wrapping at small widths.
Final compact Media check passed six scans in Chromium 157.0.8103.52:
`.build/accessibility/media-compact-releases/report.json`. Existing incomplete
contrast review and manual assistive-technology/actual zoom limits remain.

Integrated directory header tabs and mobile menu · 12 November 2026:
Media and Scientists section links now sit in the same subtle header bar
and use the library filter sizing/spacing. They remain native anchor links,
not ARIA tabs or content filters. Reviewed desktop headers and verified
keyboard section links and mobile wrapping. Media and Scientists each passed
six scans in Chromium 157.0.8103.52: `.build/accessibility/media-header-tabs/`
and `.build/accessibility/scientists-header-tabs/` report.json files.
The native modal menu now begins below the masthead, with a transparent
backdrop above it preserving the visible logo/search/utility rows. The
background remains inert while open. Close menu uses an accessible button
with an SVG cross, rounded line caps and a 44px target. The modal retains
focus containment, Escape/submenu handling, focus return, theme, forced
colours and responsive scrolling. Reviewed the light mobile screenshot and
verified placement in both themes. Homepage checks passed 22 scans:
`.build/accessibility/mobile-menu-header/report.json`. Manual assistive
technology, Safari and actual 400% zoom reviews remain outstanding.
Replaced the homepage UK expertise illustration with the supplied VIS photo,
retaining its 667x460 intrinsic dimensions and descriptive alternative text.
Updated both main and no-script homepages; verified image decoding at 1440px
and 320px with JavaScript disabled and reviewed the narrow section screenshot.

Homepage section imagery and science content · 12 November 2026: expertise
and international mission photographs now fill their desktop section height
and reach the left/right viewport edge respectively, with square corners.
On mobile the photographs sit below their text at full viewport width;
text containers retain their usual gutter and grow with enlarged text.
Verified geometry at 1440px and 320px, no horizontal overflow and image
decoding; reviewed both desktop sections. Expertise uses a subtle 30% brand
blue tint over the light surface, and the existing selected purple surface
in dark mode; the people section uses the base surface. High contrast and
forced colours retain their explicit overrides.
Moved A missing matter mystery and Finding the cosmic clues to Science,
replacing the overlapping mission introduction while preserving its content
and #introduction anchor. The two requested blocks are absent from both
homepages and present once on Science; verified without JavaScript. Science
passed six scans in Chromium 157.0.8103.52:
`.build/accessibility/science-moved-introduction/report.json`. An earlier
homepage run timed out in the existing auto-scroll resume test after the
layout change; the final combined homepage run is recorded separately below.
Manual assistive-technology and actual zoom limitations remain applicable.

The final homepage run also timed out waiting for gallery auto-scroll to resume
after keyboard focus was blurred. A separate reproduction of the complete
auto-scroll scenario passed; diagnostic output showed focus returned to body
and the gallery resumed with state running. No assertions were suppressed.
A further final run is recorded below. Dark-theme computed backgrounds were
verified as #1f1730 (expertise) and #0e0a18 (people), and its screenshot reviewed.

Final homepage check passed 22 scans in Chromium 157.0.8103.52:
`.build/accessibility/home-alternating-sections-final/report.json`, including
the unchanged gallery resume assertion. Earlier intermittent timeouts are
retained above rather than concealed. Replaced the VIS image at the user's
request with the supplied 768x1024 computing-facility photograph, with updated
intrinsic dimensions and descriptive alternative text. Verified decoding in
the no-script homepage at 1440px and 320px, and reviewed the desktop crop.
Full-height, square-corner and edge alignment styles are retained. Automated
passes do not establish accessibility conformance; manual review remains.

Homepage expertise image and gallery edits · 12 November 2026: replaced
computing photo with the supplied 2394x1344 spacecraft clean-room image,
encoded as WebP at the original dimensions. Updated descriptive alt text
and both generated homepages; verified decoding and reviewed desktop crop.
Gallery catalogue now labels NGC 1291, The dark cloud, 70x Zoom and Abell 3381;
removed the DR1 gravitational lenses card. Verified all four headings and
absence of the removed card in the no-script homepage at 1440px and 320px.
An earlier run had started with 26 catalogue entries before the requested
removal and failed its fallback count against the newly generated 25-entry
page; no assertion was suppressed. A fresh combined run follows below.
Expertise paragraphs now fill their grid column rather than stopping at
38rem. At 1920px verified text width 821.8px and section height 595.1px,
down from 652.7px with the prior width cap; checked 320px no overflow.
Updated the homepage investment figure to £54 million as requested and
verified it in the no-script fallback at both widths. Existing manual
assistive-technology, actual browser zoom and Safari review limits remain.
Fresh combined homepage check passed 22 scans in Chromium 157.0.8103.52:
`.build/accessibility/home-expertise-gallery-final/report.json`. No accessibility
conformance claim is made on this automated result.

Lensing banner, fixed filter card widths and explorer controls · 12 November
2026: slide 2 now uses the 54-lens DR1 collage, requested tag/headline/copy,
Learn more link to Science and Space Warps project link. The no-script
highlights retain both destinations. Expanded its description width to 48rem
so the longer text does not increase the opening banner height; confirmed
1280x720, 390x844 and 375x812 fit. Tags use the filter button's .35rem radius.
Resource and Humans grids now use auto-fill; Events already used auto-fill.
Media coverage grid follows the same pattern. Compared every filter at
1440px and 320px on Resources, Events and Humans: visible card widths match
All within 1px, including single-result and empty states.
Final automated reports in Chromium 157.0.8103.52: homepage 22 scans,
Resources 6 scans, Humans 10 scans, all passed, under
`.build/accessibility/{index,resources,humans}-fixed-filter-cards-final/`.
Events page/theme/reflow checks completed, but its suite timed out in the
shared homepage auto-scroll resume test. The separate homepage suite passed
that same assertion; no failure was suppressed. Prior runs before widening
the new banner copy failed the 1280x720 opening-screen height assertion;
corrected the layout and rechecked rather than changing the assertion.
Q2 toolbar is centred above the explorer title, wraps as filter-style controls
with Anton labels, rounded corners and native links/buttons. Added Euclid UK
homepage link, renamed the existing viewport reset to Reset view, changed
distance label to Space Grotesk weight 600 and 28,000 light-years from Earth.
Original controls and viewer behaviour remain. Explorer/gallery/orbit smoke
checks passed: `.build/accessibility/q2-filter-controls/interactives/`.
Reviewed desktop/mobile screenshots and verified centred toolbar, homepage
link, narrow reflow and 200% enlarged/spaced text without horizontal overflow.
Removed Euclid UK eyebrow above the homepage introduction and visible Sky
image/Spectra headings above the DR1 comparison. The comparison's native
labelled range input, image alternatives and caption remain.
Existing incomplete contrast and manual assistive-technology/actual zoom/
Safari review limitations remain; no conformance claim is made.
DR1 comparison label removal check passed six scans in Chromium 157.0.8103.52:
`.build/accessibility/dr1-comparison-no-labels/report.json`, including range
keyboard interaction and no-script comparison fallback.


### 12 November 2026 — consolidated menus, explorer controls and content

Science and Tech labels are native links to their main pages. Their submenu
links now use section anchors within science.html and technology.html; the
story/orbit/data content is available on those pages. Hover still opens the
submenus. Native disclosure controls remain keyboard accessible (and visible
as “Sections” within the mobile menu); Arrow Down on a desktop page label
opens its submenu. Removed the added decorative chevrons and restored label
spacing. Earlier nested link/disclosure markup failed axe's nested-interactive
check and was replaced with separate controls before completion.

Science now includes the existing dark-matter/dark-energy Vimeo videos and
Abell 2390 reveal. Pointer/touch movement has labelled horizontal/vertical
range equivalents, plus a full-map toggle. Sound requires an explicit opt-in,
starts silent, and fades when leaving, hiding or scrolling away from the scene.
A textual explanation and two static images remain without JavaScript. The
magnifier uses relative image geometry, fixing an initial resize-overflow
failure at 320px. Technology includes mission statistics, the existing text
and a titled, non-autospinning Sketchfab model with a text description/link.
Third-party player keyboard behaviour, captions, transcripts and audio
description have NOT been manually verified; review these before publication.

Giuseppe's card label is Edinburgh. Homepage people wording is the supplied
“Over 2,000 people across over 18 countries…” text in both index.html and the
no-script euclid-home.html fallback. Mobile mission photos now precede their
copy visually. FAQs is temporarily unavailable: its original source remains,
while navigation/footer/search omit it and direct URLs show a placeholder.
All 43 generated shared footers label the resources destination Education.

Q2 explorer buttons are compact white/black controls (44px minimum targets),
with a monochrome Raw VIS switch, no pointer-press outline, and an inset
keyboard focus indicator. The group is centred across the viewport; the
heading aligns at its top on desktop, with wrapping rows on narrow screens.
The white Euclid Consortium UK logo links home. The native video dialog has
rounded corners, no border, a plain white close X, and wrapping video choices
below its player. Native focus containment, Escape/return focus and existing
video selection were checked. A first popup reflow assertion measured the
background map's off-screen hotspot overlays instead of the modal; replaced
it with an assertion of the modal bounds and its own scrolling width.
DR1 map controls match filter corners, typography, padding and dark palette;
secondary region descriptions remain available to assistive technology.

Chromium 157.0.8103.52: Science and Technology each passed six automated
scans, both themes/contrast variants, 320px reflow, 200% text, text-spacing,
keyboard/menu checks (reports: science-consolidated and
technology-consolidated). Targeted menu clicks/anchor targets, Giuseppe label
and both no-script homepages passed. Q2/gallery/orbit smoke checks and DR1
map/links/keyboard/mobile/enlarged text checks passed. Desktop/mobile
screenshots of the reveal, explorer, dialog and map were visually reviewed.
The inactive FAQs page's individual checks passed; two runs subsequently
hit the pre-existing homepage gallery focus/auto-scroll resume timeout.
Changed its focusout refresh to the next task so it reads the settled focus
state rather than the outgoing element; the final homepage run is recorded
below. No failed assertion was suppressed.

Reviewed axe incomplete entries: image-backed colour contrast needs visual
review; carousel arrow-name checks concern symbolic arrows with explicit
previous/next names. The Q2 close control similarly uses × with “Close videos”.
The video-caption entry requires manual media review. Standard decorative
palette limitations and previous incomplete/third-party results still apply.
Actual 400% browser zoom, screen readers, speech control, Safari and browser
colour overrides still need the release checklist; these checks do not
establish WCAG conformance.

Also recorded from the preceding edits: DR1 collage and spectra figures now
match the 65rem text width (1440px/320px geometry checked, six scans passed);
Q1 additional-resources block removed (six scans passed); Royal Society
original 1512×1071 header restored with title text shadow, disabled in forced
colours/high contrast (six scans passed). Reports: dr1-text-width-figures,
q1-release-article-updates and royal-society-header-shadow.
Final homepage verification passed 22 scans in Chromium 157.0.8103.52:
`.build/accessibility/home-mobile-photos-menu-final/report.json`, including
mobile image-before-copy order and the unchanged automatic gallery checks.
The focusout timing fix resolved the repeated resume failure in that run.

Final popup refinement removes its surrounding panel/background/border/shadow,
retains the video’s 9:16 proportions, and places equal-height question controls
to its left on desktop; controls stack below on mobile. Its white X remains
unframed with a visible keyboard-only focus indicator. Supersedes the earlier
rounded-panel/below-player desktop layout described above.
Latest Q2 unframed dialog checks passed, including natural video proportions,
equal button heights, left-column desktop choices, mobile bounds and existing
modal keyboard behaviour. DR1 controls were subsequently changed to the same
white/black palette as Q2; partner logos are now a separate bottom-left group,
with region links, information and fullscreen grouped at bottom right. Native
links, names and keyboard highlights remain. This supersedes the prior dark
DR1 button palette; forced-colour system styles remain supported.

Top announcement logos are now native links to the supplied UK Space Agency
and ESA Euclid pages, with image alt text as their accessible names. Their
44px targets fit the compact top bar. Final shared-page checks passed six
scans in `faqs-inactive-footer-education/`; the targeted logo destinations
are included in the test. Initially the link targets plus padding exceeded
the header-height check; removed redundant padding and rechecked.
DR1 partner logos now wrap at 200% font size on 320px layouts, resolving the
new footer min-content overflow. Final DR1 checks passed after that correction.
Information panels use Space Grotesk, Anton headings, rounded corners and no
white outer border.

The separate local image explorers at 127.0.0.1:8766 (both north and south,
including all their current detail scenes) use the same compact white/black
controls, centred toolbars, Euclid UK homepage logos and restyled information
panels. Backups are stored under
`/Users/jfawcet2/Euclid-DR1-PRIVATE/design-backup-20261112/`.
Matching override source is `assets/site/dr1-explorer.css` (copied into the
private project's public/explorer-design.css); private tiles and scripts were
not copied or published. Existing source descriptions still explicitly require
editorial review. Tests in `scripts/check_private_explorer_design.mjs` passed
all existing scene routes, zoom/reset, native dialog Escape/focus restoration,
320px and 200% modal reflow, and automated scans. Desktop/mobile screenshots
reviewed under `.build/accessibility/private-explorer-design/`.
Plain close X controls use an underline for keyboard focus, avoiding a square
outline while retaining a visible focus state. Manual release checks remain.


### 12 November 2026 — DR1 startup and simplified explorer controls

North #wide hides its decorative visible title while retaining its descriptive
page title, h1 and named image region. Removed About this image controls and
their information dialogs from both private image explorers, including the
unused dialog listeners. Their short keyboard help remains associated with
the image region; southern detail-image choices are native visible controls
below the toolbar, so the E-key alternative does not depend on the removed
dialog. Existing zoom, pan, reset, detail/back and southern Moon actions remain.

The previous startup removed the overview on OpenSeadragon's open event,
before tiles necessarily painted. The overview now survives initialization
and delayed tile requests, and is removed only after the tiled image is loaded
and has had drawing frames. Initial fitting is immediate, resizes/redraws are
requested on open and after fonts settle, and switching scenes clears the
startup poster. Backups of both source pages and viewer scripts are under
`/Users/jfawcet2/Euclid-DR1-PRIVATE/startup-backup-20261112/`.
OpenSeadragon programmatically focuses its internal, non-tab-stop canvas on
pointer clicks; its outline is suppressed while the surrounding image region
retains keyboard focus styling. Ctrl/Command browser zoom remains available.

Fullscreen uses the identical four-corner SVG, viewBox and stroke styling in
q2release.html, dr1-data.html and both private explorers. Native button names
and fullscreen behaviour remain.

Chromium 157.0.8103.52 checks passed: blocking all initial image tiles leaves
the overview visible; releasing them produces real non-black canvas pixels
without zoom input. Three fresh loads at each of 1440px and 320px, on each
explorer, painted without zoom input. All existing detail scenes loaded;
pointer clicks produced no viewer outline; native controls, keyboard pan/zoom,
200% text reflow, removed info controls and identical SVG geometry passed.
Four axe scans passed with incomplete checks retained for manual review in
`.build/accessibility/private-explorer-startup/report.json`.
The test's first delayed-request implementation mishandled route cleanup and
was corrected; the first pointer-focus assertion exposed OpenSeadragon's
focus-visible canvas state, which was fixed before the passing run.
No assistive-technology, actual 400% browser zoom or Safari conformance claim
is implied; manual release checks and editorial image descriptions remain.
