import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const directory = resolve(root, "assets/site");
const telescopeOutline = readFileSync(resolve(directory, "euclid-outline.svg"), "utf8").trim().replace("<svg ", '<svg class="euclid-outline" aria-hidden="true" focusable="false" ');
const versionedAsset = file => `assets/site/${file}?v=${createHash("sha256").update(readFileSync(resolve(directory, file))).digest("hex").slice(0, 12)}`;
const heroLogo = readFileSync(resolve(directory, "logo-dark.svg"), "utf8").trim().replace("<svg ", '<svg class="hero-logo" role="img" aria-label="Euclid consortium UK" ').replace('fill="#ffffff"', 'fill="currentColor"');
const sourceDirectory = resolve(root, "data/site");
const pages = ["index.html", "science.html", "story.html", "dark-matter.html", "dark-energy.html", "orbit.html", "technology.html", "telescope.html", "big-data.html", "humans.html", "resources.html", "events.html", "press.html", "media.html", "dr1-foundation.html", "q1-release.html", "royal-society-exhibition.html", "faqs.html", "scientists.html", "membership.html"];
const arrow = '<span class="arrow" aria-hidden="true">↗</span>';
const panel = '<span class="control-panel" aria-hidden="true"><span class="control-panel-outline"></span><span class="control-panel-face"></span><span class="control-panel-fold"></span></span>';
const link = (href, text, style = "") => `<a class="pill-link ${style}" href="${href}">${text}${arrow}</a>`;
const routes = new Map(pages.map(file => [`euclid-${file === "index.html" ? "home.html" : file}`, file]));
const titles = new Map(pages.map(file => {
  const source = (file === "index.html" ? "<h1>Euclid UK</h1>" : readFileSync(resolve(sourceDirectory, file), "utf8"));
  const title = file === "index.html" ? "Euclid UK" : source.match(/<h1\b[^>]*>(.*?)<\/h1>/)?.[1] || (file === "press.html" ? "Latest news" : "For Scientists");
  return [file, title];
}));
const navLink = (file, current) => `<a href="${file}"${file === current ? ' aria-current="page"' : ""}>${file === "press.html" ? "Latest news" : titles.get(file)}</a>`;
const inactivePages = new Set(["faqs.html"]);
const comingSoonPages = new Set(["technology.html", "telescope.html", "big-data.html", "story.html"]);
const searchEntries = pages.filter(file => !inactivePages.has(file)).map(file => {
  const source = (file === "index.html" ? "<h1>Euclid UK</h1>" : readFileSync(resolve(sourceDirectory, file), "utf8"));
  const main = pageContent(file, source);
  const text = main.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
  return { href: file, title: file === "press.html" ? "Latest news" : titles.get(file), text };
});
for (const [file, title] of [["q2release", "Galactic Centre Explorer"], ["euclid-image-gallery", "Image gallery"], ["euclid-orbit", "Euclid’s orbit"]]) {
  const source = readFileSync(resolve(sourceDirectory, `${file}.${file === "q2release" ? "source" : "main"}.html`), "utf8");
  searchEntries.push({ href: `${file}.html`, title, text: source.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() });
}
const searchMarkup = `<form role="search" aria-label="Search Euclid UK" class="site-search-form" id="site-search-panel" hidden><label class="visually-hidden" for="site-search-query">Search Euclid UK</label><input type="search" id="site-search-query" name="q" placeholder="Search" maxlength="120" autocomplete="off" aria-describedby="site-search-help"><span class="visually-hidden" id="site-search-help">Search Euclid UK. Press Escape to close.</span><button type="button" class="search-close" aria-label="Close search">${panel}<span aria-hidden="true">×</span></button></form>`;
const searchSuggestions = `<section class="search-suggestions" aria-label="Search results" hidden><p class="search-status" role="status" aria-live="polite" aria-atomic="true"></p><ol class="search-results" hidden></ol></section>`;

function relocate(markup) {
  return markup.replace(/(href|src)="([^"#?]+)([^\"]*)"/g, (match, attribute, path, suffix) => {
    if (/^(?:https?:|mailto:|tel:|\.\.\/)/.test(path)) return match;
    return `${attribute}="${routes.get(path) || path}${suffix}"`;
  });
}

const footer = relocate(readFileSync(resolve(sourceDirectory, "footer.html"), "utf8").match(/<footer\b[\s\S]*?<\/footer>/)[0]).replace(/<a href="faqs\.html">FAQs<\/a>/, "");
const socialLinks = [...footer.match(/<nav class="site-footer-column site-footer-socials"[\s\S]*?<\/nav>/)[0].matchAll(/<a\b[\s\S]*?<\/a>/g)].map(([markup]) => markup.replace("<a ", '<a class="utility-social-link" ').replace(/<span>[\s\S]*?<\/span>/g, "").replace("<svg ", '<svg focusable="false" ')).join("");
const socialNavigation = `<nav class="utility-socials" aria-label="Euclid UK social media">${socialLinks}</nav>`;
const announcement = readFileSync(resolve(sourceDirectory, "announcement.html"), "utf8").trim();
const themeToggle = readFileSync(resolve(sourceDirectory, "theme-toggle.html"), "utf8").trim();

function navigation(current) {
  const group = (file, label, sections) => `<div class="nav-group"><a href="${file}"${current === file ? ' aria-current="page"' : ''}>${label}</a><details><summary aria-label="${label} sections">Sections</summary><div class="nav-submenu">${sections.map(([id, text]) => `<a href="${file === "science.html" && id === "orbit" ? "euclid-orbit.html" : `${file}#${id}`}">${text}</a>`).join("")}</div></details></div>`;
  return `<nav aria-label="Website navigation" class="primary-nav">
    ${group("science.html", "The Science", [["story", "Story so far"], ["dark-matter", "Dark Matter"], ["dark-energy", "Dark Energy"], ["orbit", "Where is Euclid?"]])}
    <div class="nav-group"><a href="technology.html"${current === "technology.html" ? ' aria-current="page"' : ""}>The Tech</a></div>
    ${["humans.html", "resources.html", "events.html", "press.html"].map(file => navLink(file, current)).join("")}
  </nav>`;
}

function pageContent(file, source) {
  if (inactivePages.has(file)) return `<section class="page-hero"><h1>FAQs</h1><p>This page is temporarily unavailable.</p><a href="index.html">Return to Euclid UK</a></section>`;
  if (comingSoonPages.has(file)) return `<section class="page-hero"><h1>${titles.get(file)}</h1><p>Coming soon</p></section>`;
  if (file === "science.html") source = source.replace(/(<section\b[^>]*id="story"[^>]*>)[\s\S]*?<\/section>/, '$1<h2>Story so far</h2><p>Coming soon</p></section>');
  if (file === "index.html") return home();
  if (file === "humans.html") source = source.replace("{{people-galaxy}}", () => peopleGalaxy(source));
  if (file === "media.html") source = source.replace("{{media-press-releases}}", () => mediaPressReleases());
  if (!/<h1\b/.test(source)) return `<section class="page-hero"><p class="eyebrow">Euclid UK</p><h1>${titles.get(file)}</h1></section>${source}`;
  return source.replace('class="talk-meta" aria-label="Event details"', 'class="talk-meta" role="group" aria-label="Event details"');
}

function peopleGalaxy(source) {
  const pairs = JSON.parse(readFileSync(resolve(root, "data/fingertip-galaxy/people.json"), "utf8"));
  const profiles = [...source.matchAll(/<article class="portrait-card"[\s\S]*?<\/article>/g)].map(([article]) => ({
    key: article.match(/src="images\/humans_of_euclid\/([^".]+)\./)[1],
    name: article.match(/class="portrait-name">(.*?)<\/h[23]>/)[1]
  }));
  let svg = readFileSync(resolve(root, "assets/fingertip-galaxy/galaxy.svg"), "utf8")
    .replace(/id="([^"]+)"/g, 'id="people-$1"')
    .replace(/href="#([^"]+)"/g, 'href="#people-$1"')
    .replace('aria-labelledby="fingertip-svg-title fingertip-svg-description"', 'aria-labelledby="people-fingertip-svg-title people-fingertip-svg-description"')
    .replace('role="img"', 'role="group"')
    .replace(/<text([^>]*)>(<textPath href="#people-title-curve">Fingertip Galaxy<\/textPath>)<\/text>/, '<a class="people-galaxy-title-link" href="https://www.esa.int/media/the-fingertip-galaxy-reflecting-euclid-in-art" aria-label="Fingertip Galaxy" tabindex="0"><text$1>$2</text></a>')
    .replace(/<desc id="people-fingertip-svg-description">[\s\S]*?<\/desc>/, '<desc id="people-fingertip-svg-description">A spiral galaxy made from fingertip marks. Highlighted marks are paired with the featured Euclid profiles. Choose a highlighted fingerprint to meet someone; all portraits also appear below.</desc>');
  for (const pair of pairs) {
    if (!svg.includes(`id="people-${pair.mark}"`)) throw new Error(`Missing fingerprint mark: ${pair.mark}`);
    svg = svg.replace(`id="people-${pair.mark}"`, `id="people-${pair.mark}" class="people-profile-mark"`);
  }
  const buttons = profiles.map(profile => {
    const pair = pairs.find(pair => pair.profile === profile.key);
    if (!pair) throw new Error(`Missing Fingertip Galaxy mapping for ${profile.key}`);
    const thumbnail = `images/humans_of_euclid/thumbnails/${profile.key}.webp`;
    const thumbnailVersion = createHash("sha256").update(readFileSync(resolve(root, thumbnail))).digest("hex").slice(0, 12);
    return `<button type="button" class="people-marker" data-person="${profile.key}" data-mark="people-${pair.mark}" style="left:${pair.x / 14}%;top:${pair.y / 9.9}%" aria-label="Meet ${profile.name}" aria-expanded="false" aria-controls="people-profile-preview"><span class="people-avatar" aria-hidden="true"><img src="${thumbnail}?v=${thumbnailVersion}" width="192" height="192" alt="" decoding="async"></span><span class="visually-hidden">Meet ${profile.name}</span></button>`;
  }).join("");
  return `<section class="people-galaxy" aria-label="Fingertip Galaxy" data-people-galaxy>
    <div class="people-galaxy-stage"><div class="people-galaxy-artwork">${svg}<div class="people-markers" data-people-controls hidden>${buttons}</div></div></div>
    <section class="people-profile-preview" id="people-profile-preview" aria-labelledby="people-preview-name" hidden tabindex="-1">
      <button type="button" class="people-preview-close">Close profile <span aria-hidden="true">×</span></button>
      <img class="people-preview-image" width="640" height="480" alt="">
      <div class="people-preview-body"><p class="people-preview-role"></p><h3 id="people-preview-name"></h3><blockquote class="people-preview-quote"></blockquote><a class="people-preview-link">View profile below</a></div>
    </section>
  </section>`;
}

function imageCardCarousel() {
  const { images: releases } = JSON.parse(readFileSync(resolve(sourceDirectory, "home-image-releases.json"), "utf8"));
  const images = [...releases].sort((a, b) => b.date.localeCompare(a.date));
  const escape = value => String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  return `<section class="section image-card-carousel" aria-labelledby="image-card-title" data-image-card-carousel>
    <div class="section-heading"><h2 id="image-card-title">Here’s looking at Euclid</h2><div class="image-card-controls" hidden><button type="button" class="carousel-arrow image-card-arrow" data-image-card-direction="-1" aria-label="Previous images" aria-controls="euclid-image-cards" aria-disabled="true">${panel}<span aria-hidden="true">←</span></button><button type="button" class="carousel-arrow image-card-arrow" data-image-card-direction="1" aria-label="Next images" aria-controls="euclid-image-cards" aria-disabled="false">${panel}<span aria-hidden="true">→</span></button></div></div>
    <ul class="image-card-track" id="euclid-image-cards" tabindex="0" aria-label="Euclid images, newest first">${images.map(image => `<li data-release-date="${image.date}"><figure><img src="${escape(image.thumbnail)}" srcset="${escape(image.thumbnail)} ${image.thumbnailWidth}w, ${escape(image.image)} ${image.width}w" sizes="(max-width: 45rem) 85vw, (max-width: 75rem) 44vw, 29vw" width="${image.width}" height="${image.height}" alt="${escape(image.alt)}" loading="lazy" decoding="async"><figcaption><h3>${escape(image.title)}</h3></figcaption></figure></li>`).join("")}</ul>
    <p class="image-card-introduction">Explore a gallery of our favourite images from the Euclid mission so far.</p>
    <div class="image-card-footer"><p>Credit: ESA / Euclid / Euclid Consortium / NASA</p><a href="euclid-image-gallery.html">Explore all images <span aria-hidden="true">↗</span></a></div>

    <p class="visually-hidden" role="status" aria-live="polite" aria-atomic="true" data-image-card-status></p>
  </section>`;
}

function mediaPressReleases() {
  const source = readFileSync(resolve(sourceDirectory, "press.html"), "utf8");
  const cards = [...source.matchAll(/<article class="news-feature">([\s\S]*?)<\/article>/g)].flatMap(([, article]) => {
    const heading = article.match(/<h2><a href="([^"]+)">([\s\S]*?)<\/a><\/h2>/);
    if (!["dr1-foundation.html", "q1-release.html"].includes(heading[1])) return [];
    const image = article.match(/<img\b[^>]*>/)[0].replace(/ loading="lazy"/g, "").replace(/>$/, ' loading="lazy" decoding="async">');
    const metadata = article.match(/<p class="eyebrow">[\s\S]*?<\/p>/)[0];
    const embargo = article.match(/<p class="release-embargo">[\s\S]*?<\/p>/)?.[0] || "";
    return [`<article class="news-story-card"><a href="${heading[1]}"><div class="news-story-image">${image}</div><div class="news-story-body">${metadata}<h3>${heading[2]}</h3>${embargo}<span class="news-story-action">Read more ${arrow}</span></div></a></article>`];
  });
  return `<div class="media-release-grid">${cards.join("")}</div>`;
}

function newsCardCarousel() {
  const source = readFileSync(resolve(sourceDirectory, "press.html"), "utf8");
  const stories = [...source.matchAll(/<article class="news-feature">([\s\S]*?)<\/article>/g)].map(([, article]) => {
    const heading = article.match(/<h2><a href="([^"]+)">([\s\S]*?)<\/a><\/h2>/);
    const image = article.match(/<img\b[^>]*>/)[0].replace(/ loading="lazy"/g, "").replace(/>$/, ' loading="lazy" decoding="async">');
    const metadata = article.match(/<p class="eyebrow">[\s\S]*?<\/p>/)[0];
    const embargo = article.match(/<p class="release-embargo">[\s\S]*?<\/p>/)?.[0] || "";
    return `<li><article class="news-story-card"><a href="${heading[1]}"><div class="news-story-image">${image}</div><div class="news-story-body">${metadata}<h3>${heading[2]}</h3>${embargo}<span class="news-story-action">Read more ${arrow}</span></div></a></article></li>`;
  });
  return `<section class="section stories" aria-labelledby="stories-title" data-news-card-carousel>
    <div class="section-heading"><h2 id="stories-title">Latest news</h2><div class="news-card-navigation"><div class="news-card-controls" hidden><button type="button" class="carousel-arrow image-card-arrow" data-news-direction="-1" aria-label="Previous stories" aria-controls="home-news-cards" aria-disabled="true">${panel}<span aria-hidden="true">←</span></button><button type="button" class="carousel-arrow image-card-arrow" data-news-direction="1" aria-label="Next stories" aria-controls="home-news-cards" aria-disabled="false">${panel}<span aria-hidden="true">→</span></button></div></div></div>
    <ul class="news-card-track" id="home-news-cards" aria-label="Latest news, newest first">${stories.join("")}</ul>
    <p class="visually-hidden" role="status" aria-live="polite" aria-atomic="true" data-news-card-status></p>
  </section>`;
}

function home() {
  const stars = [[1354.653, 713.4, 0, 9.5], [1049.04, 1019.913, 0.35, 9.3], [1273.313, 768.513, 0.7, 9.2], [1434.0, 466.613, 1.05, 10.1]];
  const introduction = { title: "Exploring the<br>dark universe", tag: "Euclid UK", description: "We are the UK based team working on the European Space Agency's Euclid space telescope, on a mission to map the dark Universe!", scienceDescription: "Euclid is designed to explore the composition and evolution of the dark Universe. The space telescope is creating a great map of the large-scale structure of the Universe across space and time by observing billions of galaxies out to 10 billion light-years, across more than a third of the sky. Euclid is exploring how the Universe has expanded and how structure has formed over cosmic history, revealing more about the role of gravity and the nature of dark energy and dark matter.", href: "science.html", action: "Explore the science" };
  const highlights = [
    { title: "EUCLID BEGINS TO UNRAVEL<br>MAP OF THE UNIVERSE", tag: "DR1-Foundation", description: "Explore Euclid's latest data release and learn more about the involvement of the UK's leading scientists and engineers", image: "4_Euclid-EWS-DR1-NorthPR_M81NGC3077-R3-EQU-16K9K.4K.webp", href: "dr1-data.html", action: "Explore the data", secondaryHref: "dr1-foundation.html", secondaryAction: "Read the press release", caption: "M81 and NGC 3077 · ESA / Euclid / Euclid Consortium / NASA", name: "Euclid begins to unravel map of the Universe", stars: true },
    { title: "Finding the cosmic clues", wideCopy: true, tag: "DR1-Foundation", description: "UK astronomers have led the discovery of more than 15,000 strong gravitational lenses in the first major data release from the European Space Agency’s Euclid mission – the largest catalogue of its kind ever produced, bigger than all previous catalogues combined.", image: "strong-gravitational-lenses.webp", imageDirectory: "images/news/dr1-foundation", href: "science.html", action: "Learn more", secondaryHref: "https://www.zooniverse.org/projects/aprajita/space-warps-esa-euclid", secondaryAction: "Space Warps", caption: "Strong gravitational lenses · ESA / Euclid / Euclid Consortium / NASA · Image processing: N. Lines and T. Li", name: "Finding the cosmic clues" },
    { title: "Journey to the centre<br>of the Milky Way", tag: "The Galactic Bulge Survey", description: "Explore Euclid’s view of the crowded heart of the Milky Way—the central region of our own galaxy.", image: "09-galactic-bulge.webp", href: "q2release.html", action: "Explore the survey", caption: "Euclid’s view of the Galactic Bulge · ESA / Euclid / Euclid Consortium / NASA", name: "Journey to the centre of the Milky Way" },
    { title: "A dark universe<br>detective", tag: "Euclid UK", description: "More about Euclid’s search for the dark Universe is coming soon.", image: "05-messier-78.webp", href: "science.html", action: "Find out more", caption: "Star-forming region Messier 78 · ESA / Euclid / Euclid Consortium / NASA", name: "A dark universe detective", stars: true }
  ];
  const missionSections = [
    { id: "technology", title: "Contributing UK expertise", image: "images/euclid-uk-spacecraft-cleanroom.webp", width: 2394, height: 1344, alt: "Euclid spacecraft hardware in a clean room, with black panels, gold insulation and testing cables.", paragraphs: ["The UK has played a central role in the conception and development of Euclid. The UK Space Agency has invested £54 million in the mission, supporting world-class UK science and funding research teams in 7 different institutions across the UK to contribute to the Euclid mission.", "The production and operation of Euclid’s imager for visible light, VIS, is led by University College London’s Mullard Space Science Laboratory, and researchers across the country have developed data processing pipelines to analyse the data, including the gravitational lensing analysis that will create maps of dark matter from VIS images."], href: "technology.html", action: "Explore the technology" },
    { id: "people", title: "To an international mission", image: "images/Euclid-Symposium-2025_032_naor.studio.jpg", alt: "Euclid scientists and collaborators gathered in an auditorium at the 2025 Euclid Symposium.", description: "Over 2,000 people across over 18 countries are involved in ESA's Euclid space telescope. Meet the humans behind the mission to uncover the mysteries of the dark Universe and discover the varied careers involved.", href: "humans.html", action: "Meet the people" }
  ];
  const m78Overlay = `<svg class="hero-stars" viewBox="0 0 1600 1600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs><radialGradient id="m78-star-halo"><stop stop-color="#fff" stop-opacity=".85"/><stop offset=".18" stop-color="#e8dcff" stop-opacity=".45"/><stop offset="1" stop-color="#e8dcff" stop-opacity="0"/></radialGradient><radialGradient id="m78-star-rays" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="84"><stop stop-color="#fff"/><stop offset=".12" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#e7d6ff" stop-opacity="0"/></radialGradient></defs>${stars.map(([horizontal, vertical, delay, rotation]) => `<g transform="translate(${horizontal} ${vertical}) rotate(${rotation})"><g class="star-glow" style="--star-delay: ${delay}s"><circle r="28" fill="url(#m78-star-halo)"/>${[0, 60, 120, 180, 240, 300].map(angle => `<path class="star-ray" d="M0-84 1.5-3 0 0-1.5-3Z" transform="rotate(${angle})" fill="url(#m78-star-rays)"/>`).join("")}<circle r="2" fill="#fff"/></g></g>`).join("")}</svg>`;
  // Measured image-pixel centres and diffraction-spike rotations; portrait adds 90 degrees.
  const releaseStars = [[984.74, 955.41, 0, -20.5], [1205.62, 1887.92, 0.35, -20.6], [3337.03, 929.02, 0.7, -21.9], [2279.3, 196.69, 1.05, -22.1]];
  const releaseOverlay = portrait => {
    const prefix = portrait ? "dr1-portrait" : "dr1-wide";
    return `<svg class="hero-stars hero-stars-dr1 ${portrait ? "hero-stars-portrait" : "hero-stars-wide"}" viewBox="0 0 ${portrait ? "2160 3840" : "3840 2160"}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs><radialGradient id="${prefix}-halo"><stop stop-color="#fff" stop-opacity=".85"/><stop offset=".18" stop-color="#e8dcff" stop-opacity=".45"/><stop offset="1" stop-color="#e8dcff" stop-opacity="0"/></radialGradient><radialGradient id="${prefix}-rays" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="168"><stop stop-color="#fff"/><stop offset=".12" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#e7d6ff" stop-opacity="0"/></radialGradient></defs>${releaseStars.map(([x, y, delay, rotation]) => `<g transform="translate(${portrait ? 2160 - y : x} ${portrait ? x : y}) rotate(${rotation + (portrait ? 90 : 0)})"><g class="star-glow" style="--star-delay: ${delay}s"><circle r="56" fill="url(#${prefix}-halo)"/>${[0, 60, 120, 180, 240, 300].map(angle => `<path class="star-ray" d="M0-168 3-6 0 0-3-6Z" transform="rotate(${angle})" fill="url(#${prefix}-rays)"/>`).join("")}<circle r="4" fill="#fff"/></g></g>`).join("")}</svg>`;
  };

  return `<section class="hero" aria-label="Euclid highlights" aria-roledescription="carousel" data-active-slide="0" data-star-slides="${highlights.flatMap((highlight, index) => highlight.stars ? [index] : []).join(" ")}">
    <h1 class="visually-hidden">Euclid UK · Exploring the dark universe</h1>
    <div class="hero-visuals" aria-hidden="true">${highlights.map((highlight, index) => `<div class="hero-visual${index === 0 ? " is-active" : ""}"><picture>${index === 0 ? '<source media="(max-width: 42rem)" srcset="images/euclid-gallery/m81-ngc3077-portrait.webp">' : ""}<img class="hero-image" src="${highlight.imageDirectory || "images/euclid-gallery"}/${highlight.image}" alt="" draggable="false" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy" fetchpriority="low"'}></picture>${highlight.stars ? (index === 0 ? releaseOverlay(false) + releaseOverlay(true) : m78Overlay) : ""}</div>`).join("")}</div>
    <div class="hero-stage">${highlights.map((highlight, index) => `<div class="hero-slide${index === 0 ? " is-active" : ""}" role="group" aria-roledescription="slide" aria-label="${index + 1} of ${highlights.length}: ${highlight.name}" data-slide-name="${highlight.name}"${highlight.title ? "" : " data-image-only"}${index ? " hidden inert" : ""}>
      <div class="hero-content${highlight.wideCopy ? " hero-content-wide" : ""}">${highlight.title ? `<p class="eyebrow tag">${highlight.tag}</p><h2 class="hero-title" id="hero-title-${index + 1}">${highlight.title}</h2><p class="hero-description">${highlight.description}</p><div class="hero-actions">${link(highlight.href, highlight.action, "coral")}${highlight.secondaryHref ? link(highlight.secondaryHref, highlight.secondaryAction, "blue") : ""}</div>` : ""}</div>
      <p class="hero-caption">${highlight.caption}${highlight.stars ? '<span class="visually-hidden">. Decorative star glows added to the unchanged Euclid image.</span>' : ""}</p>
    </div>`).join("")}</div>
    <div class="carousel-controls" hidden><div class="carousel-pagination" role="group" aria-label="Choose a slide">${highlights.map((highlight, index) => `<button type="button" class="carousel-page" data-slide="${index}" aria-label="Show slide ${index + 1}: ${highlight.name}" aria-current="${index === 0 ? "true" : "false"}"><span class="carousel-dot" aria-hidden="true"></span></button>`).join("")}</div><button type="button" class="carousel-arrow" data-carousel-direction="-1" aria-label="Previous slide">${panel}<span aria-hidden="true">←</span></button><button type="button" class="carousel-arrow" data-carousel-direction="1" aria-label="Next slide">${panel}<span aria-hidden="true">→</span></button><p class="visually-hidden" role="status" aria-live="polite" aria-atomic="true" data-carousel-status></p></div>
    <a class="hero-scroll-cue" href="#welcome" aria-label="Explore below"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 9 7 7 7-7"/></svg></a>
    <noscript><nav class="carousel-fallback" aria-label="More Euclid highlights">${highlights.slice(1).map(highlight => `<a href="${highlight.href}">${highlight.name}</a>${highlight.secondaryHref ? `<a href="${highlight.secondaryHref}">${highlight.secondaryAction}</a>` : ""}`).join("")}</nav></noscript>
  </section>
  <section id="welcome" class="welcome section" aria-labelledby="welcome-title" tabindex="-1"><svg class="scan-edge" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 78L111 68L113 84L508 50L510 71L692 55L695 84L1000 57V100H0Z"/></svg><div class="welcome-grid"><div class="telescope-illustration" aria-hidden="true">${telescopeOutline}</div><div><h2 id="welcome-title">${introduction.title}</h2><p class="welcome-description"><strong>${introduction.description}</strong></p><p class="welcome-science">${introduction.scienceDescription}</p><div class="welcome-actions">${link(introduction.href, introduction.action, "blue")}</div></div></div></section>
  ${missionSections.map(section => `<section class="section mission-feature mission-feature-${section.id}" aria-labelledby="mission-${section.id}-title"><div class="mission-feature-copy"><h2 id="mission-${section.id}-title">${section.title}</h2>${(section.paragraphs || [section.description]).map(paragraph => `<p>${paragraph}</p>`).join("")}${link(section.href, section.action, section.id === "technology" ? "coral" : "blue")}</div><div class="mission-feature-media"><img src="${section.image}" alt="${section.alt}" loading="lazy" decoding="async" width="${section.width || (section.id === "people" ? "1024" : "800")}" height="${section.height || (section.id === "people" ? "768" : "600")}"></div></section>`).join("\n")}
  ${imageCardCarousel()}
  ${newsCardCarousel()}`;
}

const outputPages = new Map();
for (const file of pages) {
  const original = (file === "index.html" ? "<h1>Euclid UK</h1>" : readFileSync(resolve(sourceDirectory, file), "utf8"));
  const main = pageContent(file, original).replace(/(<a\b[^>]*class="pill-link[^\"]*"[^>]*>)([^<]*)(<span\b[^>]*>[\s\S]*?<\/span>)(<\/a>)/g, `$1${panel}<span class="panel-label">$2</span>$3$4`);
  const html = `<!doctype html>
<html lang="en" data-theme="light" data-contrast="standard"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${file === "index.html" ? "Euclid UK" : `${titles.get(file)} — Euclid UK`}</title>
<meta name="description" content="Explore the dark Universe with Euclid UK, the UK team working on the European Space Agency’s Euclid space telescope.">
<link rel="icon" type="image/x-icon" href="euclid-consortium-black-f414d4824370.ico">
<link rel="icon" type="image/png" sizes="32x32" href="euclid-consortium-black-f414d4824370.png">
<link rel="apple-touch-icon" sizes="180x180" href="euclid-consortium-black-f414d4824370-touch.png">
<script src="euclid-orbit-theme.js"></script>
<link rel="stylesheet" href="css/euclid-footer.css"><link rel="stylesheet" href="${versionedAsset("style.css")}">
<link rel="stylesheet" href="css/euclid-site-migration.css?v=20261007-1">
${["science.html", "technology.html"].includes(file) ? `<link rel="stylesheet" href="${versionedAsset("mission-pages.css")}"><script src="${versionedAsset("mission-pages.js")}" defer></script>` : ""}
${file === "humans.html" ? `<link rel="stylesheet" href="${versionedAsset("people-galaxy.css")}"><script src="${versionedAsset("people-galaxy.js")}" defer></script>` : ""}
<link rel="stylesheet" href="css/euclid-accessibility.css"><link rel="stylesheet" href="css/euclid-high-contrast.css"><link rel="stylesheet" href="${versionedAsset("contrast.css")}">
<script src="${versionedAsset("site.js")}" defer></script><script src="euclid-accessibility.js" defer></script></head>
<body class="euclid-site${file === "index.html" ? " home-hero-header" : ""}"><a class="skip-link" href="#main-content">Skip to content</a>
<div class="site-masthead">
<div class="utility-bar"><aside class="utility-announcement" aria-label="Euclid announcement"><div class="announcement-frames"><p class="announcement-message">${announcement}</p><div class="announcement-partners"><a href="https://www.gov.uk/government/case-studies/euclid"><img src="assets/site/partner-uksa-white.png" width="1763" height="492" alt="UK Space Agency"></a><a href="https://www.esa.int/missions/about-us/directorates/science/euclid"><img src="assets/site/partner-esa-white.png" width="1970" height="709" alt="European Space Agency (ESA)"></a></div></div></aside><div class="utility-controls">${socialNavigation}${themeToggle}</div><nav class="audience-tabs" aria-label="Audience navigation"><a class="audience-tab audience-tab-scientists" href="scientists.html"${file === "scientists.html" ? ' aria-current="page"' : ""}>For Scientists</a><a class="audience-tab audience-tab-media" href="media.html"${file === "media.html" ? ' aria-current="page"' : ""}>For Media</a></nav></div>
<header class="app-header"><a class="brand" href="index.html">${file === "index.html" ? heroLogo : `<img class="logo-light" src="${versionedAsset("logo-light.svg")}" alt="Euclid consortium UK" width="1477" height="644"><img class="logo-dark" src="${versionedAsset("logo-dark.svg")}" alt="Euclid consortium UK" width="1477" height="644">`}<span class="visually-hidden">Home</span></a><div class="header-tools"><details class="menu"><summary aria-label="Menu"><svg class="hamburger-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 6h18M3 12h18M3 18h18"/></svg><span class="menu-label">Menu</span></summary>${navigation(file)}</details><div class="desktop-navigation">${navigation(file)}</div>${searchMarkup}<button type="button" class="site-search-button" aria-label="Search" aria-expanded="false" aria-controls="site-search-panel" hidden>${panel}<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><circle cx="13" cy="13" r="9"/><path d="m20 20 8 8"/></svg></button>${searchSuggestions}</div></header>
</div><script type="application/json" id="site-search-index">${JSON.stringify(searchEntries).replace(/</g, "\\u003c")}</script><main id="main-content" tabindex="-1">${main}</main>
${footer}<button type="button" class="back-to-top" aria-label="Back to top" hidden>${panel}<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20V4m-7 7 7-7 7 7"/></svg></button></body></html>\n`;
  outputPages.set(file, html);
  outputPages.set(`euclid-${file === "index.html" ? "home.html" : file}`, html);
}
outputPages.set("public.html", outputPages.get("science.html"));
const mapRegions = JSON.parse(readFileSync(resolve(sourceDirectory, "dr1-map-regions.json"), "utf8"));
outputPages.set("fingertip-galaxy.html", readFileSync(resolve(sourceDirectory, "fingertip-galaxy.page.html"), "utf8")
  .replace("{{shared-style}}", versionedAsset("style.css"))
  .replace("{{artwork-style}}", versionedAsset("fingertip-galaxy.css"))
  .replace("{{contrast-style}}", versionedAsset("contrast.css"))
  .replace("{{artwork}}", () => readFileSync(resolve(root, "assets/fingertip-galaxy/galaxy.svg"), "utf8"))
  .replace("{{footer}}", () => footer));
const mapPath = points => `M${points.map(point => point.join(",")).join("L")}Z`;
outputPages.set("dr1-data.html", readFileSync(resolve(sourceDirectory, "dr1-data.page.html"), "utf8")
  .replace("{{style}}", versionedAsset("dr1-map.css"))
  .replace("{{script}}", versionedAsset("dr1-map.js"))
  .replace("{{logo}}", versionedAsset("logo-dark.svg"))
  .replace("{{north}}", mapPath(mapRegions.north))
  .replace("{{south}}", mapPath(mapRegions.south)));
for (const [name, title, styles] of [
  ["euclid-image-gallery", "Image gallery", ["css/euclid-image-gallery.css"]],
  ["euclid-orbit", "Where is Euclid?", ["css/euclid-orbit.css"]]
]) {
  let main = readFileSync(resolve(sourceDirectory, `${name}.main.html`), "utf8");
  if (name === "euclid-orbit") main = main.replace(/(<button[^>]*class="object-label[^>]*?)aria-label="([^"]+)"/g, "$1title=\"$2\"").replace(/(<button[^>]*id="survey-progress-toggle"[^>]*?)aria-label="[^"]+"/g, "$1aria-labelledby=\"survey-progress-title survey-progress-caption survey-progress-key\"").replace("<strong>Survey progress</strong>", '<strong id="survey-progress-title">Survey progress</strong>');
  if (name === "euclid-image-gallery") main = main.replace('class="sensor-grid"', 'class="sensor-grid" role="group"');
  const extras = readFileSync(resolve(sourceDirectory, `${name}.extras.html`), "utf8");
  const scripts = readFileSync(resolve(sourceDirectory, `${name}.scripts.html`), "utf8");
  let document = outputPages.get("orbit.html");
  document = document.replace(/<title>.*?<\/title>/, `<title>${title} — Euclid UK</title>`);
  document = document.replace('<link rel="stylesheet" href="css/euclid-footer.css">', `${styles.map(file => `<link rel="stylesheet" href="${file}?v=20261007-site">`).join("")}<link rel="stylesheet" href="css/euclid-footer.css">`);
  document = document.replace(/<main id="main-content"[^>]*>[\s\S]*?<\/main>/, `<main id="main-content" tabindex="-1">${main}</main>`);
  document = document.replace("</body>", `${extras}${scripts}</body>`);
  if (name === "euclid-orbit") document = document.replace('<html lang="en"', '<html class="orbit-document" lang="en"').replace('body class="euclid-site', 'body class="euclid-site orbit-page');
  if (name === "euclid-image-gallery") document = document.replace('body class="euclid-site', 'body class="euclid-site gallery-site');
  outputPages.set(`${name}.html`, document);
}
let galacticExplorer = readFileSync(resolve(sourceDirectory, "q2release.source.html"), "utf8");
galacticExplorer = galacticExplorer.replace(/<link rel="preconnect"[^>]*>\s*/g, "").replace(/<link\s+href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/g, "");
galacticExplorer = galacticExplorer.replace('<title>Galactic Centre Explorer</title>', '<title>Galactic Centre Explorer — Euclid UK</title>');
galacticExplorer = galacticExplorer.replace('<body>', '<body class="galactic-page"><a class="skip-link" href="#viewer">Skip to image explorer</a>');
galacticExplorer = galacticExplorer.replace('<main id="app">', '<main id="app"><h1 class="visually-hidden">Galactic Centre Explorer</h1>');
galacticExplorer = galacticExplorer.replace('<link rel="stylesheet" href="styles.css?v=19" />', `<link rel="stylesheet" href="styles.css?v=19"><link rel="stylesheet" href="css/euclid-galactic-centre-theme.css?v=${createHash("sha256").update(readFileSync(resolve(root, "css/euclid-galactic-centre-theme.css"))).digest("hex").slice(0, 12)}">`);
galacticExplorer = galacticExplorer.replace(/<section class="video-overlay"[^>]*>/, '<dialog class="video-overlay" id="astronomer-overlay" aria-labelledby="astronomer-title">').replace(/(<\/div>\s*)<\/section>(\s*<\/main>)/, "$1</dialog>$2");
galacticExplorer = galacticExplorer.replace('class="video-dialog" role="dialog" aria-modal="true" aria-labelledby="astronomer-title"', 'class="video-dialog"');
galacticExplorer = galacticExplorer.replace('class="video-playlist" role="list"', 'class="video-playlist" role="group"');
galacticExplorer = galacticExplorer.replace('class="partner-logos" aria-label=', 'class="partner-logos" role="group" aria-label=').replace('class="distance-marker" aria-label="28,000 light-years from Earth"', 'class="distance-marker"');
galacticExplorer = galacticExplorer.replace('src="viewer.js?v=35"', 'src="viewer.js?v=20261007-style"');
galacticExplorer = galacticExplorer.replace(/(<button\b[^>]*class="(?:text-button|icon-button|mode-switch)[^>]*>)([\s\S]*?)(<\/button>)/g, `$1${panel}<span class="panel-label">$2</span>$3`);
outputPages.set("q2release.html", galacticExplorer);
for (const file of pages) {
  outputPages.set(`experiments/jodrell-bank/${file}`, `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Euclid UK</title><meta http-equiv="refresh" content="0;url=../../${file}"><link rel="canonical" href="../../${file}"></head><body><p>Euclid UK has moved to its main website. <a href="../../${file}">Continue to Euclid UK</a>.</p></body></html>\n`);
}
// Retain the original labels, with a visible hover/focus status and no destination.
function comingSoonLabel(label) {
  return `<span class="coming-soon-label"><span class="coming-soon-original">${label}</span><span class="coming-soon-hover" aria-hidden="true">COMING SOON</span></span>`;
}
for (const [file, html] of outputPages) {
  let output = html.replace(/<a\b([^>]*?)href="(?:technology\.html(?:#[^"]*)?|euclid-technology\.html(?:#[^"]*)?|science\.html#story|story\.html|euclid-story\.html)"([^>]*)>([\s\S]*?)<\/a>/g, (_, before, after, contents) => {
    let attributes = (before + after).replace(/\s+(?:title|aria-description)="[^"]*"/g, "");
    if (/class="/.test(attributes)) attributes = attributes.replace(/class="/, 'class="coming-soon-control ');
    else attributes += ' class="coming-soon-control"';
    const label = contents.includes('class="panel-label"') ? contents.replace(/(<span class="panel-label">)([\s\S]*?)(<\/span>)/, (_, open, text, close) => open + comingSoonLabel(text) + close) : comingSoonLabel(contents);
    return `<button type="button"${attributes} aria-disabled="true" aria-description="Coming soon">${label}</button>`;
  });
  output = output.replace(/<a\b[^>]*href="(?:science\.html#story|story\.html|euclid-story\.html)"[^>]*>/g, tag => tag.replace(/>$/, ' title="Coming soon" aria-description="Coming soon">'));
  outputPages.set(file, output);
}
if (process.argv.includes("--write")) {
  for (const [file, html] of outputPages) {
    mkdirSync(dirname(resolve(root, file)), { recursive: true });
    writeFileSync(resolve(root, file), html);
  }
  console.log(`Built ${outputPages.size} website pages and compatibility URLs.`);
} else {
  console.log("*** Begin Patch");
  for (const [file, html] of outputPages) {
    console.log(`${existsSync(resolve(root, file)) ? "*** Update File:" : "*** Add File:"} ${file}`);
    if (existsSync(resolve(root, file))) {
      console.log("@@");
      for (const line of readFileSync(resolve(root, file), "utf8").trimEnd().split("\n")) console.log(`-${line}`);
    }
    for (const line of html.trimEnd().split("\n")) console.log(`+${line}`);
  }
  console.log("*** End Patch");
}
