(function () {
const ACCENT_VARIANTS = {
  'missing-matter': [{
    kind: 'galaxy',
    top: '4%',
    left: '2%',
    size: 36,
    rotate: -16
  }, {
    kind: 'star',
    top: '12%',
    right: '2%',
    size: 44
  }, {
    kind: 'star',
    top: '24%',
    left: '3%',
    size: 26
  }, {
    kind: 'galaxy',
    top: '34%',
    right: '1.5%',
    size: 24,
    rotate: -6
  }, {
    kind: 'star',
    top: '46%',
    left: '1.5%',
    size: 38
  }, {
    kind: 'star',
    top: '58%',
    right: '4%',
    size: 28
  }, {
    kind: 'galaxy',
    top: '70%',
    right: '2.5%',
    size: 40,
    rotate: 18
  }, {
    kind: 'star',
    top: '78%',
    left: '2%',
    size: 32
  }, {
    kind: 'star',
    bottom: '8%',
    right: '6%',
    size: 24
  }, {
    kind: 'star',
    bottom: '4%',
    left: '4%',
    size: 36
  }],
  'cosmic-clues': [{
    kind: 'star',
    top: '6%',
    right: '4%',
    size: 48
  }, {
    kind: 'star',
    top: '18%',
    left: '5%',
    size: 30
  }, {
    kind: 'galaxy',
    top: '28%',
    left: '3%',
    size: 40,
    rotate: 14
  }, {
    kind: 'star',
    top: '40%',
    right: '6%',
    size: 24
  }, {
    kind: 'star',
    top: '50%',
    right: '3%',
    size: 38
  }, {
    kind: 'galaxy',
    top: '58%',
    right: '8%',
    size: 22,
    rotate: 8
  }, {
    kind: 'star',
    top: '68%',
    left: '5%',
    size: 28
  }, {
    kind: 'galaxy',
    top: '76%',
    right: '3%',
    size: 32,
    rotate: -22
  }, {
    kind: 'star',
    top: '88%',
    left: '3%',
    size: 42
  }, {
    kind: 'star',
    bottom: '6%',
    right: '5%',
    size: 30
  }, {
    kind: 'star',
    bottom: '12%',
    left: '7%',
    size: 22
  }],
  'detective': [{
    kind: 'star',
    top: '4%',
    left: '4%',
    size: 26
  }, {
    kind: 'galaxy',
    top: '6%',
    right: '3%',
    size: 38,
    rotate: -18
  }, {
    kind: 'star',
    top: '18%',
    left: '2%',
    size: 40
  }, {
    kind: 'star',
    top: '32%',
    right: '2%',
    size: 30
  }, {
    kind: 'galaxy',
    top: '44%',
    right: '5%',
    size: 22,
    rotate: -4
  }, {
    kind: 'star',
    top: '52%',
    left: '5%',
    size: 28
  }, {
    kind: 'galaxy',
    top: '62%',
    left: '2.5%',
    size: 28,
    rotate: 10
  }, {
    kind: 'star',
    top: '76%',
    left: '3%',
    size: 36
  }, {
    kind: 'galaxy',
    top: '84%',
    right: '4%',
    size: 24,
    rotate: -10
  }, {
    kind: 'star',
    bottom: '12%',
    right: '2%',
    size: 50
  }, {
    kind: 'star',
    bottom: '4%',
    left: '6%',
    size: 30
  }],
  'humans': [{
    kind: 'star',
    top: '14%',
    left: '4%',
    size: 84
  }, {
    kind: 'star',
    top: '20%',
    right: '5%',
    size: 72
  }, {
    kind: 'galaxy',
    top: '46%',
    right: '9%',
    size: 24,
    rotate: -14
  }, {
    kind: 'star',
    top: '56%',
    left: '8%',
    size: 26
  }, {
    kind: 'galaxy',
    top: '66%',
    left: '5%',
    size: 20,
    rotate: 6
  }, {
    kind: 'star',
    top: '74%',
    right: '7%',
    size: 30
  }]
};
const CONTENT_MAX = {
  'missing-matter': 1200,
  'cosmic-clues': 760,
  'detective': 1200,
  'humans': 1200
};
const SECTION_PADDING = {
  'missing-matter': 'clamp(20px, 6vw, 80px)',
  'cosmic-clues': 'clamp(20px, 6vw, 80px)',
  'detective': 'clamp(20px, 6vw, 80px)',
  'humans': 'clamp(20px, 6vw, 60px)'
};
const CONTENT_GAP = 16;
function SectionAccents({
  variant
}) {
  const items = ACCENT_VARIANTS[variant] || [];
  const halfContent = (CONTENT_MAX[variant] || 1200) / 2;
  const padding = SECTION_PADDING[variant] || 'clamp(20px, 6vw, 80px)';
  const contentEdge = `max(${padding}, calc(50% - ${halfContent}px))`;
  return React.createElement("div", {
    className: "euclid-accents",
    "aria-hidden": "true"
  }, items.map((it, i) => {
    const angle = it.kind === 'galaxy' ? it.rotate || 0 : 0;
    const cls = `euclid-accent euclid-accent--${it.kind}`;
    const safeMax = `calc(${contentEdge} - ${CONTENT_GAP}px - ${it.size}px)`;
    const left = it.left != null ? `min(${it.left}, ${safeMax})` : undefined;
    const right = it.right != null ? `min(${it.right}, ${safeMax})` : undefined;
    return React.createElement("span", {
      key: i,
      className: cls,
      style: {
        top: it.top,
        bottom: it.bottom,
        left,
        right,
        width: it.size,
        height: it.size,
        transform: `rotate(${angle}deg)`
      }
    }, it.kind === 'star' ? React.createElement(BrightStar, null) : React.createElement(Galaxy, null));
  }));
}
function BrightStar() {
  return React.createElement("svg", {
    viewBox: "208 315 180 195",
    xmlns: "http://www.w3.org/2000/svg",
    fill: "currentColor",
    style: {
      width: '100%',
      height: '100%',
      display: 'block'
    }
  }, React.createElement("path", {
    d: "M230.5,353.8l66.1,53.5,15.7-85-11.5,86,78.7-28.3-77.6,33.6,63,56.7-66.1-53.5-15.7,85,11.5-86-78.7,28.3,77.6-33.6-63-56.7Z"
  }), React.createElement("circle", {
    cx: "298.7",
    cy: "411.5",
    r: "8.4"
  }));
}
function Galaxy() {
  return React.createElement("svg", {
    viewBox: "263 386 87 64",
    xmlns: "http://www.w3.org/2000/svg",
    fill: "currentColor",
    style: {
      width: '100%',
      height: '100%',
      display: 'block'
    }
  }, React.createElement("path", {
    d: "M319.6,389.4s.5,0,1,.5c.5,0,1,.5,1.5,1,1.5,1.5,3,3,3.5,5,2,5,.5,11-2,16-1.5,3-3.5,5.5-5.5,7.5-3.5,3.5-7.5,6.5-12,9-1.5,1-3.5,1.5-5,2.5-1,0-2,1-3.5,1.5-1,0-2,.5-3,1h-5.5c-3,0-6.5-.5-9-3.5,0,0-.5-1-1-1.5,0-.5,0-1.5-.5-2.5v4c0,1,1,2,2,3,1.5,1,3,2,5,2,3,.5,6.5,0,9.5,0,3-.5,5.5-1.5,8-3,.5,0,1.5-.5,2-1,5-2.5,9.5-6,13.5-9.5,2.5-2,4.5-4.5,6-7.5.5-1,1-2,1.5-3,1.5-4,3-8,2-12.5,0-1,0-1.5-1-2.5-.5-1-1-2.5-2-3.5s-2-1.5-3-2c-.5,0-1.5-.5-2-1h-1M266.6,413.9s0-.5.5-1c0-.5,1-1,1.5-1.5,2-2,3.5-3.5,5.5-5,3.5-3,7.5-5.5,12-7.5,5-2,10-4,15-4.5,2,0,4,0,6,.5,1.5,0,3,1,4.5,2,1,.5,2,1.5,3,2.5s1,1.5,1,2v1.5c1,5-1.5,9.5-4.5,13.5-.5.5-1.5,1.5-2,2-1,1-2,1.5-3,2.5-4,3-8.5,5.5-14,5.5s-2.5,0-3.5-1-1-2.5-.5-3.5c0,0,0-1,.5-1,0,.5,1,1,1.5,1.5,2.5,2.5,6,2.5,9,1,1.5-1,3-2.5,3.5-4v-2l.5-.5s1-1,1-1.5c1.5-2,3-4,3-6.5s-.5-3-1.5-4c-.5-.5-1.5-1-2.5-1h-4.5c-2,0-4,0-6,1-2.5.5-4.5,2-6.5,3-4.5,2.5-8,6-11,10-2,3-4,6.5-4.5,10v3.5c0,1,.5,2,1,2.5,0,.5,1,1.5,1,2,2,2,4,3.5,7,4.5h1c2,0,4,.5,6,.5,4,0,8-1,12-2.5,6.5-2.5,12-5.5,17.5-10,2-1.5,4-3.5,6-6,0-.5,1-1,1.5-1.5,0,0,.5-.5,1-1,0,0-.5.5-1,1-.5.5-1.5,1.5-2,2-1.5,2-3.5,3.5-5.5,5-4.5,4-10,7-16,9-4.5,1.5-9,3-14,2.5-1.5,0-3.5,0-5-1h-.5c-1,0-2-1-2.5-1.5-2-1.5-3.5-3.5-4-6v-2.5c0-1.5,0-3,1-4.5,1-3,3-5.5,5-7.5,3-3,6.5-6,10.5-7.5,2-1,4.5-1.5,7-1.5h2.5c1,0,2,1.5,2,2.5v2h0v-.5l-1.5-1.5c-2-1.5-5.5-2-8-1-1.5,1-3,2-3.5,4v2l-.5.5-1.5,1.5c-1.5,1.5-3,4-3,6.5s0,3,1.5,4c0,0,1,.5,1,1,.5,0,1.5.5,2,.5h3.5c2,0,4-.5,6.5-1,2-.5,4-1.5,6-3,4.5-2.5,9-6.5,12-11,2-2.5,3.5-6,4-9.5v-4c0-1-.5-2-1-3-.5-1-1-2-2-2.5l-.5-.5c-.5-.5-1.5-1-2-1.5-2-1-4.5-2-7-2h-3c-3,0-6,.5-9,1.5-2,.5-4,1.5-6,2-5,2.5-10,5-14.5,9-2,1.5-4,3.5-5.5,5.5,0,.5-1,1-1.5,1.5l-.5,1M271.6,445.9h-1c-.5,0-1-.5-1.5-1-1.5-1-2.5-2.5-3.5-4.5-2.5-5.5-1-12,2-17.5,2.5-4,5.5-8,9.5-11,3.5-3,7.5-5.5,12-7.5,2-1,4-1.5,6-2.5,2-.5,4.5-1,7-1s3.5,0,5.5,1c1.5.5,3,1.5,3.5,3,0,0,.5,1,.5,1.5v2-1.5c0-2-1-4-2.5-5s-3-1.5-4.5-2c-3-.5-6.5,0-9.5,0s-4,1-5.5,2c-1,0-2,1-3,1.5-5,2.5-9.5,5.5-14,9-4,3.5-7,7.5-9,12-2,4-3,9-1.5,13.5.5,1.5,1.5,3,2.5,4.5,1,1,2,1.5,3,2,1,0,1.5.5,2.5,1h1l.5.5Z"
  }));
}
const HERO_BACKGROUNDS = {
  light: {
    video: 'images/orig-2301_026_AR_EN_hero.mp4',
    poster: 'images/orig-2301_026_AR_EN_hero_poster.jpg'
  },
  dark: {
    video: 'images/CosmicWeb_hero.mp4',
    poster: 'images/CosmicWeb_hero_poster.jpg'
  }
};
function HeroBackground({
  theme,
  isNarrow
}) {
  const videoRef = React.useRef(null);
  const [shouldLoadVideo, setShouldLoadVideo] = React.useState(false);
  const [videoReady, setVideoReady] = React.useState(false);
  const [motionPaused, setMotionPaused] = React.useState(false);
  const activeTheme = theme === 'dark' ? 'dark' : 'light';
  const background = HERO_BACKGROUNDS[activeTheme];
  React.useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = event => { if (event.matches) setMotionPaused(true); };
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  React.useEffect(() => {
    setVideoReady(false);
    const saveData = Boolean(navigator.connection && navigator.connection.saveData);
    const reducedMotion = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (saveData || reducedMotion) {
      setShouldLoadVideo(false);
      return undefined;
    }
    const start = () => setShouldLoadVideo(true);
    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(start, {
        timeout: 900
      });
      return () => window.cancelIdleCallback(idleId);
    }
    const timer = window.setTimeout(start, 350);
    return () => window.clearTimeout(timer);
  }, [activeTheme]);
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoadVideo) return undefined;
    const tryPlay = () => {
      if (motionPaused) {
        video.pause();
        return;
      }
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') playPromise.catch(() => {});
    };
    if (!('IntersectionObserver' in window)) {
      tryPlay();
      return undefined;
    }
    const observer = new IntersectionObserver(entries => {
      const visible = entries[0] && entries[0].isIntersecting;
      if (visible) {
        tryPlay();
      } else {
        video.pause();
      }
    }, {
      threshold: 0.08
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, [shouldLoadVideo, background.video, motionPaused]);
  return React.createElement(React.Fragment, null, React.createElement("div", {
    className: `slide-bg slide-bg-1 ${activeTheme === 'dark' ? 'slide-bg-1--cosmic-web' : ''}`,
    "aria-hidden": "true",
    style: {
      backgroundImage: `url("${background.poster}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center center'
    }
  }), shouldLoadVideo && React.createElement("video", {
    key: background.video,
    ref: videoRef,
    className: `slide-bg slide-bg-1 ${activeTheme === 'dark' ? 'slide-bg-1--cosmic-web' : ''}`,
    src: background.video,
    poster: background.poster,
    autoPlay: !motionPaused,
    muted: true,
    loop: true,
    playsInline: true,
    preload: "metadata",
    "aria-hidden": "true",
    onCanPlay: () => setVideoReady(true),
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      objectPosition: 'center center',
      opacity: videoReady ? 1 : 0,
      transition: 'opacity 500ms var(--ease-space)'
    }
  }), shouldLoadVideo && React.createElement("button", {
    className: "hero-motion-toggle",
    type: "button",
    "aria-label": motionPaused ? "Resume background animation" : "Pause background animation",
    title: motionPaused ? "Resume background animation" : "Pause background animation",
    onClick: () => setMotionPaused(paused => !paused)
  }, React.createElement("svg", {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    focusable: "false"
  }, motionPaused ? React.createElement("path", {
    d: "M7 4v16l14-8z"
  }) : React.createElement(React.Fragment, null, React.createElement("rect", {
    x: 6, y: 4, width: 4, height: 16
  }), React.createElement("rect", {
    x: 14, y: 4, width: 4, height: 16
  })))));
}
function EuclidHero({
  theme
}) {
  const [isNarrow, setIsNarrow] = React.useState(typeof window !== 'undefined' && window.innerWidth < 720);
  React.useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 720);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start'
    });
  }
  return React.createElement("section", {
    id: "top",
    "aria-label": "Euclid UK",
    className: "euclid-slide is-active",
    style: {
      position: 'relative',
      minHeight: isNarrow ? '100svh' : '100vh',
      height: isNarrow ? '100svh' : undefined,
      paddingTop: 64,
      display: 'flex',
      overflow: 'hidden',
      background: 'var(--space-black)'
    }
  }, React.createElement(HeroBackground, {
    theme: theme,
    isNarrow: isNarrow
  }), React.createElement("div", {
    className: "hero-scrim",
    "aria-hidden": true,
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 1,
      pointerEvents: 'none',
      background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.32) 45%, rgba(0,0,0,0.12) 80%, rgba(0,0,0,0) 100%)'
    }
  }), React.createElement("div", {
    className: "hero-content",
    style: {
      position: 'relative',
      zIndex: 2,
      margin: 'auto',
      maxWidth: isNarrow ? 680 : 920,
      padding: isNarrow ? '74px 18px 42px' : 'clamp(72px, 12vh, 140px) clamp(20px, 6vw, 80px) clamp(48px, 8vh, 96px)',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: isNarrow ? 18 : 'clamp(18px, 3vh, 32px)'
    }
  }, React.createElement("img", {
    src: "images/logos/euclid_wordmark.png",
    alt: "Euclid",
    style: {
      display: 'block',
      width: isNarrow ? 'min(58vw, 250px)' : 'auto',
      height: isNarrow ? 'auto' : 'clamp(80px, 15vw, 196px)',
      maxWidth: isNarrow ? '100%' : '95%'
    }
  }), React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-heading)',
      fontSize: isNarrow ? '2.125rem' : 'clamp(1.875rem, 4.8vw, 3.625rem)',
      fontWeight: 700,
      color: '#FFFFFF',
      lineHeight: isNarrow ? 0.98 : 0.94,
      letterSpacing: 0,
      textWrap: 'balance',
      margin: 0
    }
  }, "UK"), React.createElement("p", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: isNarrow ? '1.0625rem' : 'clamp(1rem, 1.5vw, 1.1875rem)',
      fontWeight: 500,
      color: '#FFFFFF',
      lineHeight: isNarrow ? 1.45 : 1.65,
      maxWidth: isNarrow ? 500 : 620,
      textWrap: 'pretty',
      margin: 0
    }
  }, "We are the UK based team working on the European Space Agency's Euclid space telescope, on a mission to map the dark Universe!"), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginTop: 4
    }
  }, React.createElement("button", {
    onClick: () => scrollToId('missing-matter'),
    style: primaryCta(),
    onMouseEnter: e => {
      e.currentTarget.style.background = 'var(--purple-light)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = 'var(--purple-primary)';
      e.currentTarget.style.transform = 'none';
    }
  }, "Explore the mission ", React.createElement("span", {
    style: {
      marginLeft: 6
    }
  }, "\u2192")), React.createElement("a", {
    href: "euclid-humans.html",
    style: outlineCta(),
    onMouseEnter: e => {
      e.currentTarget.style.background = 'rgba(255,255,255,0.14)';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.65)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
    }
  }, "Meet the Team ", React.createElement("span", {
    style: {
      marginLeft: 6
    }
  }, "\u2192")))), React.createElement("button", {
    onClick: () => scrollToId('missing-matter'),
    "aria-label": "Scroll to next section",
    style: {
      position: 'absolute',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 3,
      width: 36,
      height: 36,
      padding: 0,
      background: 'transparent',
      border: 'none',
      color: '#FFFFFF',
      opacity: 0.85,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      animation: 'euclid-scroll-cue 2.4s ease-in-out infinite'
    }
  }, React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "22",
    height: "22",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, React.createElement("polyline", {
    points: "6 9 12 15 18 9"
  }))), React.createElement("style", null, `
        @keyframes euclid-scroll-cue {
          0%, 100% { transform: translate(-50%, 0); opacity: 0.7; }
          50%      { transform: translate(-50%, 6px); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          [aria-label="Scroll to next section"] { animation: none !important; }
        }
      `));
}
function primaryCta() {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'var(--purple-primary)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 0,
    fontFamily: 'var(--font-body)',
    fontSize: '0.9375rem',
    fontWeight: 600,
    padding: '14px 28px',
    cursor: 'pointer',
    textDecoration: 'none',
    letterSpacing: '0.02em',
    transition: 'all 220ms var(--ease-space)'
  };
}
function outlineCta() {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.04)',
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: 0,
    fontFamily: 'var(--font-body)',
    fontSize: '0.9375rem',
    fontWeight: 600,
    padding: '13px 26px',
    cursor: 'pointer',
    textDecoration: 'none',
    letterSpacing: '0.02em',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    transition: 'all 220ms var(--ease-space)'
  };
}
function ScienceSection() {
  return React.createElement(React.Fragment, null, React.createElement("section", {
    id: "missing-matter",
    "aria-labelledby": "missing-matter-title",
    style: {
      position: 'relative',
      background: 'var(--space-deep)',
      padding: 'clamp(64px, 8vw, 110px) clamp(20px, 6vw, 80px)',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      overflow: 'hidden'
    }
  }, React.createElement(SectionAccents, {
    variant: "missing-matter"
  }), React.createElement("div", {
    style: {
      position: 'relative',
      maxWidth: 1200,
      margin: '0 auto'
    }
  }, React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
      columnGap: 'clamp(32px, 5vw, 64px)',
      rowGap: 24,
      alignItems: 'start'
    }
  }, React.createElement("div", null, React.createElement("div", {
    className: "section-pill",
    style: {
      marginBottom: 14
    }
  }, "Dark Matter and Dark Energy"), React.createElement("h2", {
    id: "missing-matter-title",
    className: "section-headline",
    style: {
      fontFamily: 'var(--font-heading)',
      fontSize: 'clamp(2.625rem, 6.8vw, 5.75rem)',
      fontWeight: 700,
      color: 'var(--cream)',
      lineHeight: 0.92,
      letterSpacing: 0,
      marginBottom: 24
    }
  }, React.createElement("span", {
    className: "section-headline__kicker",
    style: {
      display: 'block',
      fontSize: '0.38em',
      lineHeight: 1.12
    }
  }, "A missing matter"), React.createElement("span", {
    className: "big-type-word section-headline__word",
    style: {
      display: 'block',
      fontFamily: 'var(--font-accent)',
      color: 'var(--purple-light)',
      fontWeight: 700
    }
  }, "mystery")), React.createElement("p", {
    style: {
      fontSize: '1.0rem',
      color: 'var(--grey-mid)',
      lineHeight: 1.75,
      marginBottom: 18
    }
  }, "Until 20 to 30 years ago, scientists thought that the Universe was composed of ordinary matter: protons, neutrons and electrons. Now we know that this accounts for only ", React.createElement("strong", {
    style: {
      color: 'var(--cream)',
      fontWeight: 600
    }
  }, "5% of the Universe's mass-energy budget"), "."), React.createElement("p", {
    style: {
      fontSize: '1.0rem',
      color: 'var(--grey-mid)',
      lineHeight: 1.75,
      marginBottom: 18
    }
  }, "The rest is composed of two mysterious components \u2014 ", React.createElement("strong", {
    style: {
      color: 'var(--orange-glow)',
      fontWeight: 600
    }
  }, "dark matter"), " and ", React.createElement("strong", {
    style: {
      color: 'var(--purple-light)',
      fontWeight: 600
    }
  }, "dark energy"), " \u2014 which are causing the expansion of the Universe to accelerate, and which cannot be adequately explained by our current knowledge of fundamental physics."), React.createElement("p", {
    style: {
      fontSize: '1.0rem',
      color: 'var(--grey-mid)',
      lineHeight: 1.75,
      marginBottom: 18
    }
  }, "The European Space Agency's Euclid mission is designed to explore the composition and evolution of the dark Universe. The space telescope will create a great map of the large-scale structure of the Universe across space and time by observing billions of galaxies out to 10 billion light-years, across more than a third of the sky."), React.createElement("p", {
    style: {
      fontSize: '1.0rem',
      color: 'var(--grey-mid)',
      lineHeight: 1.75,
      marginBottom: 18
    }
  }, "Euclid will explore how the Universe has expanded and how structure has formed over cosmic history, revealing more about the role of gravity and the nature of dark energy and dark matter."), React.createElement("p", {
    style: {
      fontSize: '0.9375rem',
      color: 'var(--cream)',
      lineHeight: 1.65,
      marginBottom: 18,
      paddingLeft: 16,
      borderLeft: '2px solid var(--purple-light)'
    }
  }, "Watch the videos to find out more, and meet some of the people involved in the Euclid mission ahead of this year's Royal Society Summer Science Exhibition.")), React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: 20,
      alignItems: 'start'
    }
  }, React.createElement(VimeoCard, {
    label: "What is dark matter?",
    id: "1119049471",
    accent: "orange"
  }), React.createElement(VimeoCard, {
    label: "What is dark energy?",
    id: "1119049937",
    accent: "purple"
  })), React.createElement("div", {
    style: {
      gridColumn: '1 / 2'
    }
  }, React.createElement("p", {
    style: {
      fontSize: '0.9375rem',
      color: 'var(--cream)',
      lineHeight: 1.65,
      marginBottom: 24,
      paddingLeft: 16,
      borderLeft: '2px solid var(--purple-light)'
    }
  }, "Move the magnifying glass above the image of Abell 2390 to search for the dark matter that Euclid has found so far. You can also toggle the audio button to hear a sonification of this data."), React.createElement("a", {
    href: "https://www.euclid-ec.org/euclid-starts-seeing-darkness/",
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: 'transparent',
      color: 'var(--cream)',
      border: '1px solid var(--purple-primary)',
      borderRadius: 0,
      textDecoration: 'none',
      fontFamily: 'var(--font-body)',
      fontSize: '0.9375rem',
      fontWeight: 600,
      padding: '13px 26px',
      letterSpacing: '0.02em',
      transition: 'all 220ms var(--ease-space)'
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = 'var(--card-tint-hover)';
      e.currentTarget.style.borderColor = 'var(--purple-light)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.borderColor = 'var(--purple-primary)';
      e.currentTarget.style.transform = 'none';
    }
  }, "Euclid starts seeing darkness ", React.createElement("span", null, "\u2197")))))));
}
function VimeoCard({
  label,
  id,
  accent
}) {
  const [hovered, setHovered] = React.useState(false);
  return React.createElement("figure", {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    style: {
      background: 'var(--space-mid)',
      borderRadius: 0,
      padding: 12,
      border: `1px solid ${hovered ? accent === 'orange' ? 'var(--orange-primary)' : 'var(--purple-light)' : 'var(--border)'}`,
      transition: 'all 240ms var(--ease-space)',
      transform: hovered ? 'translateY(-2px)' : 'none',
      margin: 0
    }
  }, React.createElement("figcaption", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: '1.0rem',
      fontWeight: 600,
      color: accent === 'orange' ? 'var(--orange-glow)' : 'var(--purple-primary)',
      letterSpacing: 0,
      padding: '6px 8px 12px',
      textAlign: 'center'
    }
  }, label), React.createElement("div", {
    style: {
      position: 'relative',
      aspectRatio: '9 / 16',
      borderRadius: 0,
      overflow: 'hidden',
      background: 'var(--space-black)'
    }
  }, React.createElement("iframe", {
    src: `https://player.vimeo.com/video/${id}?autoplay=0&title=0&byline=0&portrait=0`,
    title: label,
    loading: "lazy",
    frameBorder: "0",
    allow: "autoplay; fullscreen; picture-in-picture",
    allowFullScreen: true,
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      border: 0
    }
  })));
}
function NewsSection() {
  return React.createElement(React.Fragment, null, React.createElement(CosmicCluesImageCarousel, null), React.createElement("section", {
    id: "cosmic-clues",
    "aria-labelledby": "cosmic-clues-title",
    style: {
      background: 'var(--space-black)',
      padding: 'clamp(64px, 8vw, 110px) clamp(20px, 6vw, 80px)',
      position: 'relative',
      overflow: 'hidden'
    }
  }, React.createElement(SectionAccents, {
    variant: "cosmic-clues"
  }), React.createElement("div", {
    style: {
      position: 'relative',
      maxWidth: 760,
      margin: '0 auto',
      textAlign: 'center'
    }
  }, React.createElement("div", {
    className: "section-pill",
    style: {
      marginBottom: 16
    }
  }, "Gravitational Lensing"), React.createElement("h2", {
    id: "cosmic-clues-title",
    className: "section-headline",
    style: {
      fontFamily: 'var(--font-heading)',
      fontSize: 'clamp(3.0rem, 7.4vw, 6.5rem)',
      fontWeight: 700,
      color: 'var(--cream)',
      lineHeight: 0.92,
      letterSpacing: 0,
      marginBottom: 24
    }
  }, React.createElement("span", {
    className: "section-headline__kicker",
    style: {
      display: 'block',
      fontSize: '0.42em',
      lineHeight: 1.1
    }
  }, "Finding the cosmic"), React.createElement("span", {
    className: "big-type-word section-headline__word",
    style: {
      display: 'block',
      fontFamily: 'var(--font-accent)',
      color: 'var(--purple-light)',
      fontWeight: 700
    }
  }, "clues")), React.createElement("p", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(1.1875rem, 2vw, 1.5rem)',
      fontWeight: 500,
      color: 'var(--cream)',
      lineHeight: 1.4,
      letterSpacing: 0,
      marginBottom: 36,
      textWrap: 'balance'
    }
  }, "Imagine a galaxy, behind another galaxy. Think you won't see it? Think again."), React.createElement("div", {
    style: {
      textAlign: 'left'
    }
  }, React.createElement("p", {
    style: {
      fontSize: '1.0rem',
      color: 'var(--grey-mid)',
      lineHeight: 1.75,
      marginBottom: 16
    }
  }, "While we can't see dark matter directly, Euclid can see clues of its presence. One such clue is where galaxies appear as warped or distorted illusions of their true selves \u2014 an effect known as ", React.createElement("strong", {
    style: {
      color: 'var(--cream)',
      fontWeight: 600
    }
  }, "gravitational lensing"), "."), React.createElement("p", {
    style: {
      fontSize: '1.0rem',
      color: 'var(--grey-mid)',
      lineHeight: 1.75,
      marginBottom: 16
    }
  }, "This happens when massive objects bend and magnify light, revealing otherwise hidden mass \u2014 including dark matter."), React.createElement("p", {
    style: {
      fontSize: '1.0rem',
      color: 'var(--grey-mid)',
      lineHeight: 1.75,
      marginBottom: 16
    }
  }, "Astronomers and software developers at ", React.createElement("strong", {
    style: {
      color: 'var(--cream)',
      fontWeight: 600
    }
  }, "The University of Edinburgh"), " lead on Euclid's gravitational lensing data analysis."), React.createElement("p", {
    style: {
      fontSize: '1.0rem',
      color: 'var(--grey-mid)',
      lineHeight: 1.75,
      marginBottom: 16
    }
  }, "Euclid's data is revolutionising the study of strong lensing. New techniques using machine learning and AI have been developed to find these rare objects. Citizen science has also contributed significantly, with over ", React.createElement("strong", {
    style: {
      color: 'var(--cream)',
      fontWeight: 600
    }
  }, "1,000 volunteers"), " participating in visual inspections, and you can get involved too. Head over to the Zooniverse Space Warps project to make your own discoveries of strong gravitational lenses!"), React.createElement("p", {
    style: {
      fontSize: '0.9375rem',
      color: 'var(--cream)',
      lineHeight: 1.65,
      marginBottom: 32,
      paddingLeft: 16,
      borderLeft: '2px solid var(--purple-light)'
    }
  }, "At this year's Royal Society Summer Science Exhibition you'll experience gravitational lensing firsthand \u2014 watching the cosmos warp as light bends around you, mimicking Euclid's ability to detect distant galaxies distorted by gravity.")), React.createElement("div", {
    className: "cosmic-cta-row",
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 24,
      alignItems: 'flex-end',
      width: '100%'
    }
  }, React.createElement("div", {
    className: "cosmic-cta-lockup"
  }, React.createElement("a", {
    href: "https://www.zooniverse.org/projects/aprajita/space-warps-esa-euclid",
    target: "_blank",
    rel: "noopener noreferrer",
    "aria-label": "Zooniverse Space Warps",
    className: "cosmic-cta-logo-slot"
  }, React.createElement("img", {
    src: "assets/zooniverse_logo_light.png",
    alt: "Zooniverse: People-Powered Research",
    className: "logo-img logo-img--light-only",
    style: {
      width: 'min(236px, 68vw)',
      height: 'auto',
      display: 'block'
    }
  }), React.createElement("img", {
    src: "assets/zooniverse_logo_dark.png",
    alt: "Zooniverse: People-Powered Research",
    className: "logo-img logo-img--dark-only",
    style: {
      width: 'min(236px, 68vw)',
      height: 'auto',
      display: 'block'
    }
  })), React.createElement("a", {
    href: "https://www.zooniverse.org/projects/aprajita/space-warps-esa-euclid",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "cosmic-cta",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: 'var(--orange-primary)',
      color: '#fff',
      border: 'none',
      borderRadius: 0,
      textDecoration: 'none',
      fontFamily: 'var(--font-body)',
      fontSize: '0.9375rem',
      fontWeight: 600,
      padding: '14px 28px',
      letterSpacing: '0.02em',
      transition: 'all 220ms var(--ease-space)'
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = 'var(--orange-glow)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = 'var(--orange-primary)';
      e.currentTarget.style.transform = 'none';
    }
  }, "Take me to Space Warps ", React.createElement("span", null, "\u2197"))), React.createElement("div", {
    className: "cosmic-cta-lockup cosmic-cta-lockup--selfie"
  }, React.createElement("div", {
    className: "cosmic-cta-logo-slot cosmic-cta-logo-slot--selfie"
  }, React.createElement("a", {
    href: "https://eucliduk.net/gravitational-lens.html",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "instawarp-cta-logo",
    "aria-label": "Instawarp"
  }, "instawarp")), React.createElement("a", {
    href: "https://eucliduk.net/gravitational-lens.html",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "cosmic-cta cosmic-cta--selfie",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: 'transparent',
      color: 'var(--cream)',
      border: '1px solid var(--purple-primary)',
      borderRadius: 0,
      textDecoration: 'none',
      fontFamily: 'var(--font-body)',
      fontSize: '0.9375rem',
      fontWeight: 600,
      padding: '13px 26px',
      letterSpacing: '0.02em',
      transition: 'all 220ms var(--ease-space)'
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = 'var(--card-tint-hover)';
      e.currentTarget.style.borderColor = 'var(--purple-light)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.borderColor = 'var(--purple-primary)';
      e.currentTarget.style.transform = 'none';
    }
  }, "Take a spacetime selfie!"), React.createElement("a", {
    href: "https://apps.apple.com/gb/app/gravylensing/id6783065795",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "app-store-link",
    "aria-label": "Download GravyLensing on the App Store",
    style: {
      display: 'inline-flex',
      marginTop: 14,
      lineHeight: 0,
      transition: 'opacity 220ms var(--ease-space), transform 220ms var(--ease-space)'
    },
    onMouseEnter: e => {
      e.currentTarget.style.opacity = '0.88';
      e.currentTarget.style.transform = 'translateY(-2px)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.opacity = '1';
      e.currentTarget.style.transform = 'none';
    }
  }, React.createElement("img", {
    src: "images/Download_on_App_Store/White_lockup/SVG/Download_on_the_App_Store_Badge_US-UK_RGB_wht_092917.svg",
    alt: "Download on the App Store",
    className: "logo-img logo-img--light-only",
    style: {
      width: 'min(190px, 62vw)',
      height: 'auto',
      display: 'block'
    }
  }), React.createElement("img", {
    src: "images/Download_on_App_Store/Black_lockup/SVG/Download_on_the_App_Store_Badge_US-UK_RGB_blk_092917.svg",
    alt: "Download on the App Store",
    className: "logo-img logo-img--dark-only",
    style: {
      width: 'min(190px, 62vw)',
      height: 'auto',
      display: 'block'
    }
  })))))), React.createElement(FullBleedImage, {
    src: "images/Euclid_s_new_image_of_star-forming_region_Messier_78.jpg",
    alt: "Euclid's image of the star-forming region Messier 78",
    label: "Star-forming region \xB7 Messier 78",
    actionVideoSrc: "https://dlmultimedia.esa.int/download/public/videos/2024/12/033/2412_033_AR_EN.mp4",
    actionLabel: "Listen to M78 sonification",
    expandTitle: "Stellar Nursery M78",
    expandDistance: "1,300 light-years from Earth",
    expandText: `In May 2024, stunning new views of the nearby
Universe as seen by the Euclid space
telescope were revealed.

Here we see a beautiful cloud of glowing interstellar
gas and dust giving birth to brand new stars. Known
as Messier 78, this stellar nursery had never before
been captured in its entirety with such clarity.

300,000 new objects were uncovered in this image
alone, including newly forming planets.

Usually hidden from view behind the dust, Euclid
used its infrared camera to see through the clouds.
Scientists will use this data to learn more about how
populations of stars form and change over time.`
  }));
}
const NEWS_IMG_BASE = 'images';
const A2390_VISIBLE = `${NEWS_IMG_BASE}/A2390/Abell2390.jpg`;
const A2390_DARK_MATTER = `${NEWS_IMG_BASE}/A2390/Abell2390_dark_matter_purple.jpg`;
const A2390_PURPLE_INTENSITY = [[0.016, 0.015, 0.01, 0.009, 0.008, 0.008, 0.007, 0.006, 0.007, 0.004, 0.005, 0.002, 0.003, 0.01, 0.021, 0.016, 0.015, 0.021, 0.031, 0.03, 0.03, 0.041, 0.059, 0.048], [0.026, 0.013, 0.006, 0.006, 0.01, 0.015, 0.011, 0.004, 0.005, 0.004, 0, 0, 0.008, 0.016, 0.023, 0.021, 0.021, 0.027, 0.023, 0.026, 0.016, 0.024, 0.042, 0.036], [0.036, 0.02, 0.013, 0.018, 0.029, 0.03, 0.019, 0.009, 0.008, 0.005, 0.01, 0.022, 0.042, 0.049, 0.057, 0.056, 0.064, 0.045, 0.031, 0.018, 0.017, 0.032, 0.021, 0.028], [0.028, 0.032, 0.035, 0.045, 0.04, 0.033, 0.026, 0.02, 0.021, 0.04, 0.074, 0.124, 0.172, 0.185, 0.175, 0.168, 0.142, 0.114, 0.065, 0.04, 0.029, 0.024, 0.025, 0.029], [0.02, 0.032, 0.038, 0.016, 0.026, 0.014, 0.015, 0.042, 0.064, 0.101, 0.18, 0.286, 0.382, 0.463, 0.436, 0.361, 0.268, 0.183, 0.127, 0.069, 0.043, 0.039, 0.044, 0.031], [0.015, 0.021, 0.021, 0.029, 0.031, 0.015, 0.036, 0.132, 0.204, 0.261, 0.408, 0.6, 0.732, 0.752, 0.654, 0.583, 0.44, 0.33, 0.215, 0.116, 0.064, 0.053, 0.038, 0.026], [0.018, 0.02, 0.024, 0.038, 0.058, 0.097, 0.164, 0.299, 0.46, 0.61, 0.793, 0.942, 1, 0.887, 0.786, 0.688, 0.613, 0.461, 0.311, 0.163, 0.096, 0.045, 0.024, 0.016], [0.01, 0.014, 0.004, 0.008, 0.053, 0.11, 0.215, 0.403, 0.631, 0.806, 0.971, 0.974, 0.943, 0.883, 0.744, 0.655, 0.534, 0.462, 0.305, 0.185, 0.089, 0.038, 0.02, 0.014], [0.015, 0.016, 0.009, 0.022, 0.052, 0.146, 0.246, 0.391, 0.646, 0.835, 0.849, 0.754, 0.823, 0.791, 0.656, 0.472, 0.249, 0.243, 0.179, 0.132, 0.068, 0.031, 0.021, 0.018], [0.018, 0.017, 0.024, 0.033, 0.074, 0.138, 0.181, 0.356, 0.533, 0.637, 0.656, 0.635, 0.603, 0.527, 0.434, 0.301, 0.166, 0.074, 0.048, 0.037, 0.045, 0.029, 0.028, 0.025], [0.025, 0.032, 0.043, 0.058, 0.093, 0.141, 0.176, 0.278, 0.369, 0.411, 0.48, 0.47, 0.383, 0.311, 0.219, 0.141, 0.06, 0.026, 0.023, 0.031, 0.041, 0.043, 0.037, 0.044], [0.034, 0.045, 0.061, 0.097, 0.127, 0.13, 0.124, 0.191, 0.147, 0.162, 0.366, 0.376, 0.258, 0.186, 0.118, 0.067, 0.033, 0.022, 0.019, 0.027, 0.041, 0.04, 0.051, 0.059], [0.028, 0.015, 0.019, 0.046, 0.089, 0.133, 0.134, 0.154, 0.184, 0.242, 0.223, 0.222, 0.171, 0.142, 0.091, 0.056, 0.029, 0.015, 0.012, 0.012, 0.016, 0.019, 0.021, 0.025], [0.017, 0.006, 0.002, 0.026, 0.066, 0.081, 0.097, 0.087, 0.115, 0.14, 0.126, 0.101, 0.061, 0.037, 0.022, 0.021, 0.012, 0.008, 0.007, 0.003, 0.007, 0.008, 0.008, 0.012], [0.008, 0.007, 0.018, 0.028, 0.039, 0.036, 0.037, 0.059, 0.094, 0.085, 0.073, 0.038, 0.007, 0.003, 0.009, 0.01, 0.009, 0.008, 0.009, 0.002, 0.003, 0.004, 0.008, 0.008]];
function CosmicCluesImageCarousel() {
  const [activeSlide, setActiveSlide] = React.useState(() => typeof window !== 'undefined' && window.location.hash === '#einstein-ring' ? 1 : 0);
  const goToSlide = React.useCallback(direction => {
    setActiveSlide(current => (current + direction + 2) % 2);
  }, []);
  const targetSlideLabel = activeSlide === 0 ? 'Show Einstein ring image' : 'Show Abell 2390 dark matter image';
  return React.createElement("div", {
    id: "cosmic-clues-carousel",
    role: "region",
    "aria-label": "Gravitational lensing image carousel",
    style: {
      position: 'relative',
      background: '#000'
    }
  }, activeSlide === 0 ? React.createElement(A2390DarkMatterSlide, null) : React.createElement(EinsteinRingSlide, null), React.createElement(CarouselArrow, {
    direction: "previous",
    ariaLabel: targetSlideLabel,
    onClick: () => goToSlide(-1)
  }), React.createElement(CarouselArrow, {
    direction: "next",
    ariaLabel: targetSlideLabel,
    onClick: () => goToSlide(1)
  }));
}
function EinsteinRingSlide() {
  return React.createElement(FullBleedImage, {
    src: `${NEWS_IMG_BASE}/Euclid_image_of_a_bright_Einstein_ring_around_galaxy_NGC_6505.jpg`,
    alt: "A bright Einstein ring of distorted light around galaxy NGC 6505, captured by Euclid",
    label: "Einstein ring \xB7 NGC 6505",
    expandTitle: "One Einstein Ring to rule them all",
    expandTitlePrefix: "One",
    expandTitleEmphasis: "Einstein Ring",
    expandTitleSuffix: "to rule them all",
    expandDistance: "4.42 billion light-years from Earth",
    modelSrc: `${NEWS_IMG_BASE}/EinsteinRing.stl`,
    modelLabel: "Touch astronomical objects.",
    modelLogoSrc: "assets/tactile_universe_device_purple.png",
    modelLogoAlt: "Tactile Universe",
    modelDescription: React.createElement(React.Fragment, null, "Thanks to the ", React.createElement("a", {
      href: "https://tactileuniverse.org",
      target: "_blank",
      rel: "noopener noreferrer"
    }, "Tactile Universe"), " project, you can explore astronomical objects like stars, galaxies and gravitational lenses through 3D-printed tactile representations at this year's Royal Society Summer Science Exhibition. The models give us more insight into Euclid's discoveries, and enable everyone to discover the space telescope's incredible data."),
    modelCredit: React.createElement(React.Fragment, null, "Credit: Coleman Krawczyk, & Tactile Universe. (2018, October 26). TactileUniverse/3D-Printed-Galaxy-Software. Zenodo. ", React.createElement("a", {
      href: "http://doi.org/10.5281/zenodo.814181",
      target: "_blank",
      rel: "noopener noreferrer"
    }, "http://doi.org/10.5281/zenodo.814181")),
    expandText: `In February 2025, ESA’s Euclid space telescope saw
this beautiful example of an Einstein Ring.

A ring of light is surrounding the centre of a galaxy
known as NGC 6505, which acts as a gravitational
lens and distorts the light from a galaxy far behind it.

NGC 6505 is lined up almost perfectly with the
background galaxy when viewed by Euclid, so it
bends and magnifies the other galaxy’s light
into this spectacular ring.

Euclid can take incredibly wide images of space, so
in this view we see the the Einstein ring surrounded
by colourful foreground stars and
background galaxies.`
  });
}
function A2390DarkMatterSlide() {
  const [spot, setSpot] = React.useState({
    x: 50,
    y: 55
  });
  const [active, setActive] = React.useState(false);
  const [locked, setLocked] = React.useState(false);
  const [audioEnabled, setAudioEnabled] = React.useState(false);
  const [radius, setRadius] = React.useState(150);
  const frameRef = React.useRef(null);
  const audioRef = React.useRef(null);
  React.useEffect(() => {
    const syncRadius = () => {
      const rect = frameRef.current ? frameRef.current.getBoundingClientRect() : {
        width: window.innerWidth,
        height: window.innerHeight
      };
      setRadius(Math.max(96, Math.min(190, Math.min(rect.width, rect.height) * 0.2)));
    };
    syncRadius();
    window.addEventListener('resize', syncRadius);
    return () => window.removeEventListener('resize', syncRadius);
  }, []);
  React.useEffect(() => () => {
    if (!audioRef.current) return;
    const {
      ctx,
      carrier,
      shimmer
    } = audioRef.current;
    try {
      carrier.stop();
      shimmer.stop();
      ctx.close();
    } catch (error) {}
    audioRef.current = null;
  }, []);
  const rimWidth = Math.max(12, radius * 0.14);
  const revealRadius = Math.max(58, radius - rimWidth);
  const getAudioEngine = React.useCallback(() => {
    if (typeof window === 'undefined') return null;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!audioRef.current) {
      const ctx = new AudioContext();
      const carrier = ctx.createOscillator();
      const shimmer = ctx.createOscillator();
      const carrierGain = ctx.createGain();
      const shimmerGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const master = ctx.createGain();
      carrier.type = 'sine';
      shimmer.type = 'triangle';
      carrier.frequency.value = 180;
      shimmer.frequency.value = 360;
      carrierGain.gain.value = 0.7;
      shimmerGain.gain.value = 0.06;
      filter.type = 'bandpass';
      filter.frequency.value = 520;
      filter.Q.value = 7;
      master.gain.value = 0;
      carrier.connect(carrierGain);
      shimmer.connect(shimmerGain);
      carrierGain.connect(filter);
      shimmerGain.connect(filter);
      filter.connect(master);
      master.connect(ctx.destination);
      carrier.start();
      shimmer.start();
      audioRef.current = {
        ctx,
        carrier,
        shimmer,
        carrierGain,
        shimmerGain,
        filter,
        master
      };
    }
    if (audioRef.current.ctx.state === 'suspended') {
      audioRef.current.ctx.resume().catch(() => {});
    }
    return audioRef.current;
  }, []);
  const primeSonification = React.useCallback(() => {
    const engine = getAudioEngine();
    if (!engine) return;
    const now = engine.ctx.currentTime;
    engine.master.gain.setTargetAtTime(0.001, now, 0.04);
  }, [getAudioEngine]);
  const fadeAudio = React.useCallback(() => {
    const engine = audioRef.current;
    if (!engine) return;
    engine.master.gain.setTargetAtTime(0, engine.ctx.currentTime, 0.12);
  }, []);
  const measurePurpleIntensity = React.useCallback((xPercent, yPercent, screenRadius) => {
    const frame = frameRef.current;
    if (!frame) return 0;
    const rect = frame.getBoundingClientRect();
    const map = A2390_PURPLE_INTENSITY;
    const rows = map.length;
    const cols = map[0].length;
    const displayedWidth = Math.max(rect.width, rect.height);
    const displayedHeight = displayedWidth;
    const offsetX = (rect.width - displayedWidth) / 2;
    const offsetY = (rect.height - displayedHeight) / 2;
    const centerX = (xPercent / 100 * rect.width - offsetX) / displayedWidth;
    const centerY = (yPercent / 100 * rect.height - offsetY) / displayedHeight;
    const sampleRadiusX = screenRadius / displayedWidth;
    const sampleRadiusY = screenRadius / displayedHeight;
    const sampleSteps = 4;
    let total = 0;
    let count = 0;
    function sampleMap(nx, ny) {
      const x = Math.max(0, Math.min(1, nx)) * (cols - 1);
      const y = Math.max(0, Math.min(1, ny)) * (rows - 1);
      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      const x1 = Math.min(cols - 1, x0 + 1);
      const y1 = Math.min(rows - 1, y0 + 1);
      const tx = x - x0;
      const ty = y - y0;
      const top = map[y0][x0] * (1 - tx) + map[y0][x1] * tx;
      const bottom = map[y1][x0] * (1 - tx) + map[y1][x1] * tx;
      return top * (1 - ty) + bottom * ty;
    }
    for (let gy = -sampleSteps; gy <= sampleSteps; gy++) {
      for (let gx = -sampleSteps; gx <= sampleSteps; gx++) {
        const dx = gx / sampleSteps;
        const dy = gy / sampleSteps;
        if (dx * dx + dy * dy > 1) continue;
        total += sampleMap(centerX + dx * sampleRadiusX, centerY + dy * sampleRadiusY);
        count++;
      }
    }
    return count ? Math.min(1, total / count) : 0;
  }, []);
  const playSonification = React.useCallback((xPercent, yPercent, enabled = true) => {
    if (!enabled) {
      fadeAudio();
      return;
    }
    const engine = getAudioEngine();
    if (!engine) return;
    const intensity = measurePurpleIntensity(xPercent, yPercent, revealRadius);
    const shaped = Math.pow(Math.max(0, Math.min(1, intensity)), 0.58);
    const now = engine.ctx.currentTime;
    engine.master.gain.setTargetAtTime(0.018 + shaped * 0.16, now, 0.055);
    engine.carrier.frequency.setTargetAtTime(95 + shaped * 1050, now, 0.055);
    engine.shimmer.frequency.setTargetAtTime(180 + shaped * 2300, now, 0.055);
    engine.filter.frequency.setTargetAtTime(260 + shaped * 3600, now, 0.055);
    engine.filter.Q.setTargetAtTime(4 + shaped * 16, now, 0.055);
    engine.shimmerGain.gain.setTargetAtTime(0.01 + shaped * 0.19, now, 0.055);
  }, [fadeAudio, getAudioEngine, measurePurpleIntensity, revealRadius]);
  const updateSpot = React.useCallback(event => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * 100;
    const y = (event.clientY - rect.top) / rect.height * 100;
    const nextSpot = {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    };
    setSpot(nextSpot);
    playSonification(nextSpot.x, nextSpot.y, audioEnabled);
  }, [audioEnabled, playSonification]);
  const handleAudioToggle = React.useCallback(() => {
    const nextAudioEnabled = !audioEnabled;
    setAudioEnabled(nextAudioEnabled);
    if (nextAudioEnabled) {
      setActive(true);
      primeSonification();
      playSonification(spot.x, spot.y, true);
    } else {
      fadeAudio();
    }
  }, [audioEnabled, fadeAudio, playSonification, primeSonification, spot.x, spot.y]);
  React.useEffect(() => {
    if (!audioEnabled) fadeAudio();
  }, [audioEnabled, fadeAudio]);
  const handleKeyDown = event => {
    if (event.target !== event.currentTarget) return;
    const step = event.shiftKey ? 10 : 4;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(true);
      setSpot(prev => {
        const nextSpot = {
          x: Math.max(0, Math.min(100, prev.x + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0))),
          y: Math.max(0, Math.min(100, prev.y + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0)))
        };
        playSonification(nextSpot.x, nextSpot.y, audioEnabled);
        return nextSpot;
      });
    }
  };
  const revealed = active || locked;
  const magnifierViewBox = 512;
  const glassCenter = 184;
  const glassRadius = 136;
  const glassStroke = 38;
  const glassOuterRadius = glassRadius + glassStroke / 2;
  const magnifierSize = radius * 2 * magnifierViewBox / (glassOuterRadius * 2);
  const magnifierOffset = `${glassCenter / magnifierViewBox * 100}%`;
  const lensMask = locked ? 'circle(150% at 50% 50%)' : `circle(${revealed ? revealRadius : 0}px at ${spot.x}% ${spot.y}%)`;
  return React.createElement("section", {
    ref: frameRef,
    "aria-label": "Abell 2390 dark matter map reveal",
    "aria-describedby": "dark-matter-instructions",
    tabIndex: 0,
    onPointerMove: event => {
      setActive(true);
      if (audioEnabled) primeSonification();
      updateSpot(event);
    },
    onPointerEnter: event => {
      setActive(true);
      if (audioEnabled) primeSonification();
      updateSpot(event);
    },
    onPointerDown: event => {
      setActive(true);
      if (event.pointerType !== 'mouse' && event.currentTarget.setPointerCapture) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      if (audioEnabled) primeSonification();
      updateSpot(event);
    },
    onPointerUp: event => {
      if (event.pointerType !== 'mouse') {
        if (event.currentTarget.releasePointerCapture) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        setActive(false);
        fadeAudio();
      }
    },
    onPointerCancel: () => {
      setActive(false);
      fadeAudio();
    },
    onPointerLeave: () => {
      if (!locked) setActive(false);
      fadeAudio();
    },
    onFocus: () => setActive(true),
    onBlur: () => {
      if (!locked) setActive(false);
      fadeAudio();
    },
    onKeyDown: handleKeyDown,
    style: {
      position: 'relative',
      width: '100%',
      minHeight: 'clamp(360px, 75vh, 800px)',
      overflow: 'hidden',
      background: '#000',
      cursor: locked ? 'default' : 'none',
      touchAction: 'pan-y pinch-zoom'
    }
  }, React.createElement("p", {
    id: "dark-matter-instructions",
    className: "visually-hidden"
  }, "Use the arrow keys to move the reveal window. Hold Shift to move further. The map shows dark matter inferred from the distortion of background galaxies; it is not a photograph of dark matter."), React.createElement("img", {
    src: A2390_VISIBLE,
    alt: "",
    "aria-hidden": "true",
    loading: "lazy",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      objectPosition: 'center',
      display: 'block'
    }
  }), React.createElement("img", {
    src: A2390_DARK_MATTER,
    alt: "",
    "aria-hidden": "true",
    loading: "lazy",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      objectPosition: 'center',
      display: 'block',
      opacity: revealed ? 1 : 0,
      clipPath: lensMask,
      transition: 'none',
      willChange: 'clip-path'
    }
  }), !locked && React.createElement("svg", {
    "aria-hidden": "true",
    focusable: "false",
    viewBox: "0 0 512 512",
    style: {
      position: 'absolute',
      left: `${spot.x}%`,
      top: `${spot.y}%`,
      width: magnifierSize,
      height: magnifierSize,
      overflow: 'visible',
      transform: `translate(-${magnifierOffset}, -${magnifierOffset})`,
      opacity: revealed ? 1 : 0,
      pointerEvents: 'none',
      transition: 'none',
      zIndex: 2
    }
  }, React.createElement("line", {
    x1: "290",
    y1: "290",
    x2: "438",
    y2: "438",
    stroke: "rgba(3,3,5,0.96)",
    strokeWidth: "62",
    strokeLinecap: "round"
  }), React.createElement("circle", {
    cx: glassCenter,
    cy: glassCenter,
    r: glassRadius,
    fill: "none",
    stroke: "rgba(3,3,5,0.96)",
    strokeWidth: glassStroke
  })), React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 1,
      pointerEvents: 'none',
      background: 'linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.5) 90%, rgba(0,0,0,0.75) 100%)'
    }
  }), React.createElement("div", {
    className: "image-caption",
    style: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 4,
      padding: 'clamp(16px, 2.5vw, 28px) clamp(20px, 6vw, 80px)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      fontFamily: 'var(--font-body)',
      fontSize: '0.75rem',
      fontWeight: 500,
      color: '#F2F2F2',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      gap: 12,
      flexWrap: 'wrap',
      pointerEvents: 'none'
    }
  }, React.createElement("span", null, "ABELL 2390"), React.createElement("span", null, "ESA / EUCLID")), React.createElement("a", {
    href: "https://www.euclid-ec.org/euclid-starts-seeing-darkness/",
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      position: 'absolute',
      right: 'clamp(16px, 3vw, 32px)',
      bottom: 'clamp(54px, 8vw, 84px)',
      zIndex: 5,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      background: 'var(--nav-bg-scrolled)',
      color: 'var(--cream)',
      border: '1px solid rgba(255,255,255,0.28)',
      borderRadius: 0,
      textDecoration: 'none',
      fontFamily: 'var(--font-body)',
      fontSize: '0.875rem',
      fontWeight: 700,
      lineHeight: 1,
      letterSpacing: '0.02em',
      padding: '13px 18px',
      minHeight: 42,
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      boxShadow: '0 16px 38px rgba(0,0,0,0.28)',
      transition: 'all 220ms var(--ease-space)'
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = 'var(--card-tint)';
      e.currentTarget.style.borderColor = 'var(--purple-light)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = 'var(--nav-bg-scrolled)';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)';
      e.currentTarget.style.transform = 'none';
    }
  }, "Learn more"), React.createElement(TopRightIconButton, {
    ariaLabel: audioEnabled ? 'Turn Abell 2390 sonification off' : 'Turn Abell 2390 sonification on',
    pressed: audioEnabled,
    onClick: handleAudioToggle,
    rightOffset: "calc(clamp(16px, 3vw, 32px) + 60px)"
  }, audioEnabled ? React.createElement("svg", {
    "aria-hidden": "true",
    viewBox: "0 0 24 24",
    width: "22",
    height: "22",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, React.createElement("polygon", {
    points: "11 5 6 9 2 9 2 15 6 15 11 19 11 5"
  }), React.createElement("path", {
    d: "M15.5 8.5a5 5 0 0 1 0 7"
  }), React.createElement("path", {
    d: "M19 5a10 10 0 0 1 0 14"
  })) : React.createElement("svg", {
    "aria-hidden": "true",
    viewBox: "0 0 24 24",
    width: "22",
    height: "22",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, React.createElement("polygon", {
    points: "11 5 6 9 2 9 2 15 6 15 11 19 11 5"
  }), React.createElement("line", {
    x1: "22",
    y1: "9",
    x2: "16",
    y2: "15"
  }), React.createElement("line", {
    x1: "16",
    y1: "9",
    x2: "22",
    y2: "15"
  }))), React.createElement(TopRightIconButton, {
    ariaLabel: locked ? 'Hide full dark matter map' : 'Reveal full dark matter map',
    pressed: locked,
    onClick: () => {
      setLocked(value => !value);
      setActive(true);
    }
  }, locked ? React.createElement("svg", {
    "aria-hidden": "true",
    viewBox: "0 0 24 24",
    width: "22",
    height: "22",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, React.createElement("path", {
    d: "M3 3l18 18"
  }), React.createElement("path", {
    d: "M10.6 10.6A2 2 0 0 0 13.4 13.4"
  }), React.createElement("path", {
    d: "M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 9 5 10 8a14.6 14.6 0 0 1-2.1 3.6"
  }), React.createElement("path", {
    d: "M6.6 6.6A14.2 14.2 0 0 0 2 12c1 3 5 8 10 8a10.7 10.7 0 0 0 4.1-.8"
  })) : React.createElement("svg", {
    "aria-hidden": "true",
    viewBox: "0 0 24 24",
    width: "22",
    height: "22",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, React.createElement("path", {
    d: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"
  }), React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  }))));
}
function TopRightIconButton({
  ariaLabel,
  pressed,
  onClick,
  children,
  rightOffset = 'clamp(16px, 3vw, 32px)'
}) {
  return React.createElement("button", {
    type: "button",
    "aria-label": ariaLabel,
    "aria-pressed": pressed,
    onClick: onClick,
    style: {
      position: 'absolute',
      top: 'clamp(16px, 3vw, 32px)',
      right: rightOffset,
      zIndex: 5,
      width: 48,
      height: 48,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: pressed ? 'var(--purple-primary)' : 'var(--nav-bg-scrolled)',
      color: 'var(--cream)',
      border: '1px solid var(--border)',
      borderRadius: '50%',
      padding: 0,
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      boxShadow: '0 16px 38px rgba(0,0,0,0.28)',
      transition: 'all 220ms var(--ease-space)',
      cursor: 'pointer'
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = pressed ? 'var(--purple-primary)' : 'var(--card-tint)';
      e.currentTarget.style.borderColor = 'var(--purple-light)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = pressed ? 'var(--purple-primary)' : 'var(--nav-bg-scrolled)';
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.transform = 'none';
    }
  }, children);
}
function CarouselArrow({
  direction,
  ariaLabel,
  onClick
}) {
  const isNext = direction === 'next';
  return React.createElement("button", {
    type: "button",
    "aria-label": ariaLabel,
    onClick: onClick,
    style: {
      position: 'absolute',
      top: '50%',
      [isNext ? 'right' : 'left']: 'clamp(16px, 3vw, 32px)',
      zIndex: 6,
      width: 36,
      height: 36,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      color: '#FFFFFF',
      opacity: 0.82,
      border: 'none',
      borderRadius: 0,
      padding: 0,
      transform: 'translateY(-50%)',
      textShadow: '0 2px 14px rgba(0,0,0,0.55)',
      filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.5))',
      transition: 'opacity 180ms var(--ease-space), transform 180ms var(--ease-space)',
      cursor: 'pointer'
    },
    onMouseEnter: e => {
      e.currentTarget.style.opacity = '1';
      e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.opacity = '0.82';
      e.currentTarget.style.transform = 'translateY(-50%)';
    }
  }, React.createElement("svg", {
    "aria-hidden": "true",
    viewBox: "0 0 24 24",
    width: "24",
    height: "24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, isNext ? React.createElement("polyline", {
    points: "9 6 15 12 9 18"
  }) : React.createElement("polyline", {
    points: "15 6 9 12 15 18"
  })));
}
function FullBleedImage({
  src,
  alt,
  label,
  credit = 'ESA / Euclid',
  srcDark,
  altDark,
  labelDark,
  aspectRatio,
  minHeight = 'clamp(360px, 75vh, 800px)',
  objectFit = 'cover',
  objectPosition = 'center',
  className,
  background = '#000',
  actionVideoSrc,
  actionLabel,
  expandTitle,
  expandTitlePrefix,
  expandTitleEmphasis,
  expandTitleSuffix,
  expandDistance,
  expandText,
  modelSrc,
  modelLabel = 'Interactive 3D model',
  modelLogoSrc,
  modelLogoAlt = '',
  modelDescription = null,
  modelCredit
}) {
  const [actionOpen, setActionOpen] = React.useState(false);
  const [modelOpen, setModelOpen] = React.useState(false);
  const [expandOpen, setExpandOpen] = React.useState(false);
  const [expandedHeight, setExpandedHeight] = React.useState(typeof window !== 'undefined' ? `${window.innerHeight}px` : '100vh');
  const sectionRef = React.useRef(null);
  const videoDialogRef = React.useRef(null);
  const modelDialogRef = React.useRef(null);
  const modalTriggerRef = React.useRef(null);
  React.useEffect(() => {
    const dialog = actionOpen ? videoDialogRef.current : modelOpen ? modelDialogRef.current : null;
    if (!dialog) return undefined;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      modalTriggerRef.current?.focus({ preventScroll: true });
    };
  }, [actionOpen, modelOpen]);
  const openExpand = React.useCallback(() => {
    setExpandOpen(open => {
      const next = !open;
      if (next) {
        setExpandedHeight(`${window.innerHeight}px`);
        window.requestAnimationFrame(() => {
          if (sectionRef.current) {
            sectionRef.current.scrollIntoView({
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
              block: 'start'
            });
          }
        });
      }
      return next;
    });
  }, []);
  React.useEffect(() => {
    if (!actionOpen && !expandOpen && !modelOpen) return undefined;
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        setActionOpen(false);
        setModelOpen(false);
        setExpandOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [actionOpen, expandOpen, modelOpen]);
  React.useEffect(() => {
    if (!expandOpen) return undefined;
    const syncHeight = () => setExpandedHeight(`${window.innerHeight}px`);
    syncHeight();
    window.addEventListener('resize', syncHeight);
    return () => window.removeEventListener('resize', syncHeight);
  }, [expandOpen]);
  const isExpandedImage = expandOpen && expandTitle && expandText;
  const sizing = isExpandedImage ? {
    minHeight: expandedHeight
  } : aspectRatio ? {
    aspectRatio
  } : className ? {} : {
    minHeight
  };
  const containerStyle = {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    background,
    zIndex: isExpandedImage ? 121 : 'auto',
    transition: 'min-height 650ms var(--ease-space), height 650ms var(--ease-space)',
    ...sizing
  };
  const imgStyle = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit,
    objectPosition,
    display: 'block'
  };
  return React.createElement("section", {
    ref: sectionRef,
    "aria-label": alt,
    className: className,
    style: containerStyle
  }, srcDark ? React.createElement(React.Fragment, null, React.createElement("img", {
    src: src,
    alt: alt,
    loading: "lazy",
    className: "logo-img logo-img--light-only",
    style: imgStyle
  }), React.createElement("img", {
    src: srcDark,
    alt: altDark || alt,
    loading: "lazy",
    className: "logo-img logo-img--dark-only",
    style: imgStyle
  })) : React.createElement("img", {
    src: src,
    alt: alt,
    loading: "lazy",
    style: imgStyle
  }), React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background: 'linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.5) 90%, rgba(0,0,0,0.75) 100%)'
    }
  }), expandTitle && expandText && React.createElement("button", {
    type: "button",
    "aria-label": expandOpen ? `Collapse ${expandTitle} image` : `Expand ${expandTitle} image`,
    "aria-expanded": expandOpen,
    onClick: openExpand,
    style: {
      position: 'absolute',
      top: 'clamp(16px, 3vw, 32px)',
      right: actionVideoSrc || modelSrc ? 'calc(clamp(16px, 3vw, 32px) + 60px)' : 'clamp(16px, 3vw, 32px)',
      zIndex: 3,
      width: 48,
      height: 48,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--nav-bg-scrolled)',
      color: 'var(--cream)',
      border: '1px solid var(--border)',
      borderRadius: '50%',
      padding: 0,
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      boxShadow: '0 16px 38px rgba(0,0,0,0.28)',
      transition: 'all 220ms var(--ease-space)',
      cursor: 'pointer'
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = 'var(--card-tint)';
      e.currentTarget.style.borderColor = 'var(--purple-light)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = 'var(--nav-bg-scrolled)';
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.transform = 'none';
    }
  }, expandOpen ? React.createElement("svg", {
    "aria-hidden": "true",
    viewBox: "0 0 24 24",
    width: "22",
    height: "22",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, React.createElement("path", {
    d: "m15 9 6-6"
  }), React.createElement("path", {
    d: "M21 9V3h-6"
  }), React.createElement("path", {
    d: "m9 15-6 6"
  }), React.createElement("path", {
    d: "M3 15v6h6"
  })) : React.createElement("svg", {
    "aria-hidden": "true",
    viewBox: "0 0 24 24",
    width: "22",
    height: "22",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, React.createElement("path", {
    d: "M8 3H3v5"
  }), React.createElement("path", {
    d: "M16 3h5v5"
  }), React.createElement("path", {
    d: "M21 16v5h-5"
  }), React.createElement("path", {
    d: "M8 21H3v-5"
  }))), modelSrc && React.createElement("button", {
    type: "button",
    "aria-label": `Open ${modelLabel}`,
    "aria-expanded": modelOpen,
    onClick: event => {
      modalTriggerRef.current = event.currentTarget;
      setModelOpen(true);
    },
    style: {
      position: 'absolute',
      top: 'clamp(16px, 3vw, 32px)',
      right: 'clamp(16px, 3vw, 32px)',
      zIndex: 3,
      width: 48,
      height: 48,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--nav-bg-scrolled)',
      color: 'var(--cream)',
      border: '1px solid var(--border)',
      borderRadius: '50%',
      padding: 0,
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      boxShadow: '0 16px 38px rgba(0,0,0,0.28)',
      transition: 'all 220ms var(--ease-space)',
      cursor: 'pointer'
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = 'var(--card-tint)';
      e.currentTarget.style.borderColor = 'var(--purple-light)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = 'var(--nav-bg-scrolled)';
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.transform = 'none';
    }
  }, React.createElement("svg", {
    "aria-hidden": "true",
    viewBox: "0 0 24 24",
    width: "22",
    height: "22",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, React.createElement("path", {
    d: "M18 11V7a2 2 0 0 0-4 0v3"
  }), React.createElement("path", {
    d: "M14 10V6a2 2 0 0 0-4 0v6"
  }), React.createElement("path", {
    d: "M10 12V8a2 2 0 0 0-4 0v7"
  }), React.createElement("path", {
    d: "M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-16 0"
  }))), actionVideoSrc && actionLabel && React.createElement("button", {
    type: "button",
    "aria-label": `${actionLabel} from ESA`,
    "aria-expanded": actionOpen,
    onClick: event => {
      modalTriggerRef.current = event.currentTarget;
      setActionOpen(true);
    },
    style: {
      position: 'absolute',
      top: 'clamp(16px, 3vw, 32px)',
      right: 'clamp(16px, 3vw, 32px)',
      zIndex: 3,
      width: 48,
      height: 48,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--nav-bg-scrolled)',
      color: 'var(--cream)',
      border: '1px solid var(--border)',
      borderRadius: '50%',
      padding: 0,
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      boxShadow: '0 16px 38px rgba(0,0,0,0.28)',
      transition: 'all 220ms var(--ease-space)',
      cursor: 'pointer'
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = 'var(--card-tint)';
      e.currentTarget.style.borderColor = 'var(--purple-light)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = 'var(--nav-bg-scrolled)';
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.transform = 'none';
    }
  }, React.createElement("svg", {
    "aria-hidden": "true",
    viewBox: "0 0 24 24",
    width: "22",
    height: "22",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, React.createElement("path", {
    d: "M11 5 6 9H3v6h3l5 4V5Z"
  }), React.createElement("path", {
    d: "M15.5 8.5a5 5 0 0 1 0 7"
  }), React.createElement("path", {
    d: "M18.5 5.5a9 9 0 0 1 0 13"
  }))), actionOpen && actionVideoSrc && React.createElement("dialog", {
    ref: videoDialogRef,
    className: "media-dialog",
    onCancel: event => { event.preventDefault(); setActionOpen(false); },
    role: "dialog",
    "aria-modal": "true",
    "aria-label": actionLabel,
    onClick: () => setActionOpen(false),
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 1200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(18px, 4vw, 40px)',
      background: 'color-mix(in srgb, var(--space-black) 86%, transparent)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)'
    }
  }, React.createElement("button", {
    type: "button",
    "aria-label": "Close sonification video",
    onClick: () => setActionOpen(false),
    style: {
      position: 'fixed',
      top: 'clamp(16px, 3vw, 32px)',
      right: 'clamp(16px, 3vw, 32px)',
      zIndex: 1201,
      width: 48,
      height: 48,
      borderRadius: '50%',
      border: '1px solid var(--border)',
      background: 'var(--nav-bg-scrolled)',
      color: 'var(--cream)',
      fontFamily: 'var(--font-body)',
      fontSize: '1.75rem',
      lineHeight: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      boxShadow: '0 12px 32px rgba(0,0,0,0.28)'
    }
  }, "\xD7"), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: 'relative',
      width: 'min(92vw, 820px)',
      color: 'var(--cream)'
    }
  }, React.createElement("div", {
    style: {
      aspectRatio: '649 / 360',
      width: '100%',
      background: '#000',
      border: '1px solid var(--border)',
      borderRadius: 0,
      overflow: 'hidden',
      boxShadow: '0 24px 70px rgba(0,0,0,0.42)'
    }
  }, React.createElement("video", {
    controls: true,
    autoPlay: false,
    playsInline: true,
    preload: "metadata",
    src: actionVideoSrc,
    "aria-label": actionLabel,
    style: {
      width: '100%',
      height: '100%',
      display: 'block',
      background: '#000'
    }
  }, React.createElement("a", {
    href: actionVideoSrc
  }, "Open the ESA sonification video"))), React.createElement("div", {
    style: {
      padding: '18px 0 0'
    }
  }, React.createElement("h3", {
    style: {
      margin: '0 0 8px',
      fontFamily: 'var(--font-heading)',
      fontSize: 'clamp(1.125rem, 2.4vw, 1.5rem)',
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: 0
    }
  }, "Cosmic jingles: listen to Euclid\u2019s image of M78"), React.createElement("p", {
    style: {
      margin: 0,
      color: 'var(--grey-mid)',
      fontFamily: 'var(--font-body)',
      fontSize: '0.8125rem',
      lineHeight: 1.5
    }
  }, "Credit: ESA/Euclid/Euclid Consortium/NASA, image processing by J.-C. Cuillandre (CEA Paris-Saclay) and G. Anselmi, sonification by K. Nielsen (DTU Space/Maple Pools).")))), modelOpen && modelSrc && React.createElement("dialog", {
    ref: modelDialogRef,
    className: "media-dialog",
    onCancel: event => { event.preventDefault(); setModelOpen(false); },
    role: "dialog",
    "aria-modal": "true",
    "aria-label": modelLabel,
    onClick: () => setModelOpen(false),
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 1200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(18px, 4vw, 40px)',
      background: 'color-mix(in srgb, var(--space-black) 86%, transparent)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)'
    }
  }, React.createElement("button", {
    type: "button",
    "aria-label": "Close 3D model",
    onClick: () => setModelOpen(false),
    style: {
      position: 'fixed',
      top: 'clamp(16px, 3vw, 32px)',
      right: 'clamp(16px, 3vw, 32px)',
      zIndex: 1201,
      width: 48,
      height: 48,
      borderRadius: '50%',
      border: '1px solid var(--border)',
      background: 'var(--nav-bg-scrolled)',
      color: 'var(--cream)',
      fontFamily: 'var(--font-body)',
      fontSize: '1.75rem',
      lineHeight: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      boxShadow: '0 12px 32px rgba(0,0,0,0.28)'
    }
  }, "\xD7"), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: 'relative',
      width: 'min(92vw, 900px)',
      color: 'var(--cream)'
    }
  }, React.createElement("div", {
    style: {
      height: 'min(70vh, 620px)',
      minHeight: 360,
      width: '100%',
      border: '1px solid var(--border)',
      borderRadius: 0,
      overflow: 'hidden',
      position: 'relative',
      background: 'radial-gradient(circle at 50% 42%, var(--card-tint-hover), var(--space-black) 62%)',
      boxShadow: '0 24px 70px rgba(0,0,0,0.42)'
    }
  }, React.createElement(StlModelViewer, {
    src: modelSrc,
    label: modelLabel
  }), modelLogoSrc && React.createElement("img", {
    src: modelLogoSrc,
    alt: modelLogoAlt,
    style: {
      position: 'absolute',
      top: 'clamp(14px, 2vw, 22px)',
      right: 'clamp(14px, 2vw, 22px)',
      width: 'clamp(74px, 11vw, 126px)',
      height: 'auto',
      opacity: 0.9,
      filter: 'var(--tactile-logo-filter, drop-shadow(0 10px 24px rgba(0,0,0,0.24)))',
      pointerEvents: 'none',
      userSelect: 'none'
    }
  })), React.createElement("h3", {
    style: {
      margin: '18px 0 0',
      fontFamily: 'var(--font-heading)',
      fontSize: 'clamp(1.125rem, 2.4vw, 1.5rem)',
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: 0
    }
  }, modelLabel), modelDescription && React.createElement("p", {
    style: {
      margin: '10px 0 0',
      maxWidth: 760,
      color: 'var(--grey-mid)',
      fontFamily: 'var(--font-body)',
      fontSize: 'clamp(0.875rem, 1.7vw, 1.0rem)',
      lineHeight: 1.6
    }
  }, modelDescription), modelCredit && React.createElement("p", {
    style: {
      margin: '14px 0 0',
      maxWidth: 760,
      color: 'var(--grey-dark)',
      fontFamily: 'var(--font-body)',
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0.02em'
    }
  }, modelCredit))), expandTitle && expandText && React.createElement("div", {
    "aria-hidden": !expandOpen,
    style: {
      position: 'absolute',
      inset: 0,
      opacity: expandOpen ? 1 : 0,
      pointerEvents: 'none',
      transition: 'opacity 360ms var(--ease-space)'
    }
  }, React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(90deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.34) 30%, rgba(0,0,0,0.04) 58%, rgba(0,0,0,0.10) 100%), linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.04) 46%, rgba(0,0,0,0.42) 100%)'
    }
  }), React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 1,
      minHeight: '100%',
      display: 'flex',
      alignItems: 'center',
      padding: 'clamp(76px, 9vh, 96px) clamp(24px, 7vw, 96px) clamp(34px, 6vh, 58px)',
      color: '#F2F2F2'
    }
  }, React.createElement("div", {
    style: {
      maxWidth: 540,
      textShadow: '0 2px 16px rgba(0,0,0,0.46)'
    }
  }, React.createElement("h2", {
    style: {
      margin: '0 0 12px',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      lineHeight: 1,
      letterSpacing: 0
    }
  }, expandTitleEmphasis ? React.createElement(React.Fragment, null, expandTitlePrefix && React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
      lineHeight: 0.95
    }
  }, expandTitlePrefix), React.createElement("span", {
    style: {
      display: 'block',
      width: 'max-content',
      maxWidth: '118%',
      fontSize: 'clamp(3.0rem, 7.2vw, 5.75rem)',
      lineHeight: 0.78,
      letterSpacing: 0,
      transform: 'scaleX(0.82)',
      transformOrigin: 'left center'
    }
  }, expandTitleEmphasis), expandTitleSuffix && React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
      lineHeight: 0.95,
      marginTop: 6
    }
  }, expandTitleSuffix)) : React.createElement("span", {
    style: {
      fontSize: 'clamp(2.25rem, 5vw, 4.125rem)'
    }
  }, expandTitle)), expandDistance && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'clamp(0.9375rem, 1.5vw, 1.125rem)',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--purple-lighter)'
    }
  }, expandDistance), React.createElement("div", {
    "aria-hidden": true,
    style: {
      width: 'min(320px, 58vw)',
      height: 2,
      margin: expandTitleEmphasis ? '10px 0 14px' : '12px 0 20px',
      background: 'linear-gradient(90deg, var(--purple-light), rgba(242,242,242,0.18))'
    }
  })), React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: expandTitleEmphasis ? 500 : 430,
      fontFamily: 'var(--font-body)',
      fontSize: expandTitleEmphasis ? 'clamp(0.75rem, 1vw, 0.8125rem)' : 'clamp(0.875rem, 1.15vw, 0.9375rem)',
      fontWeight: 500,
      lineHeight: expandTitleEmphasis ? 1.34 : 1.44,
      whiteSpace: 'pre-line',
      color: 'rgba(242,242,242,0.9)'
    }
  }, expandText)))), React.createElement("div", {
    className: "image-caption",
    style: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 'clamp(16px, 2.5vw, 28px) clamp(20px, 6vw, 80px)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      fontFamily: 'var(--font-body)',
      fontSize: '0.75rem',
      fontWeight: 500,
      color: '#F2F2F2',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      gap: 12,
      flexWrap: 'wrap',
      opacity: expandOpen ? 0 : 1,
      transition: 'opacity 220ms var(--ease-space)',
      pointerEvents: expandOpen ? 'none' : 'auto'
    }
  }, labelDark ? React.createElement(React.Fragment, null, React.createElement("span", {
    className: "logo-img--light-only"
  }, label), React.createElement("span", {
    className: "logo-img--dark-only"
  }, labelDark)) : React.createElement("span", null, label), React.createElement("span", null, credit)));
}
function loadScriptOnce(src) {
  window.__euclidScriptPromises = window.__euclidScriptPromises || {};
  if (!window.__euclidScriptPromises[src]) {
    window.__euclidScriptPromises[src] = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener('load', resolve, {
          once: true
        });
        existing.addEventListener('error', reject, {
          once: true
        });
        if (existing.dataset.loaded === 'true') resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => {
        script.dataset.loaded = 'true';
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return window.__euclidScriptPromises[src];
}
function StlModelViewer({
  src,
  label
}) {
  const mountRef = React.useRef(null);
  const modelActionsRef = React.useRef(null);
  const [status, setStatus] = React.useState('Loading 3D model…');
  React.useEffect(() => {
    let disposed = false;
    let renderer;
    let controls;
    let animationId;
    let resizeObserver;
    async function init() {
      try {
        const importModule = window.__euclidImportModule || (window.__euclidImportModule = new Function('url', 'return import(url)'));
        const THREE = await importModule('https://esm.sh/three@0.128.0');
        const {
          STLLoader
        } = await importModule('https://esm.sh/three@0.128.0/examples/jsm/loaders/STLLoader.js');
        const {
          OrbitControls
        } = await importModule('https://esm.sh/three@0.128.0/examples/jsm/controls/OrbitControls.js');
        if (disposed || !mountRef.current) return;
        const mount = mountRef.current;
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.domElement.style.touchAction = 'none';
        renderer.domElement.style.cursor = 'grab';
        mount.appendChild(renderer.domElement);
        const themeValue = (name, fallback) => getComputedStyle(document.getElementById('home-content')).getPropertyValue(name).trim() || fallback;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
        camera.position.set(0, 0.12, 5.6);
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        controls.dampingFactor = 0.08;
        controls.enablePan = true;
        controls.screenSpacePanning = true;
        controls.enableZoom = true;
        controls.minDistance = 1.8;
        controls.maxDistance = 10;
        controls.autoRotate = false;
        controls.autoRotateSpeed = 0.45;
        controls.target.set(0, 0, 0);
        controls.update();
        controls.addEventListener('start', () => {
          controls.autoRotate = false;
          renderer.domElement.style.cursor = 'grabbing';
        });
        controls.addEventListener('end', () => {
          renderer.domElement.style.cursor = 'grab';
        });
        scene.add(new THREE.HemisphereLight('#FFFFFF', themeValue('--space-mid', '#35204D'), 0.9));
        const key = new THREE.DirectionalLight('#FFFFFF', 1.15);
        key.position.set(3, 4, 5);
        scene.add(key);
        const rim = new THREE.DirectionalLight(themeValue('--tactile-model-rim', '#C9A9F0'), 0.7);
        rim.position.set(-4, 1.5, -2);
        scene.add(rim);
        const group = new THREE.Group();
        scene.add(group);
        modelActionsRef.current = action => {
          if (action === 'left' || action === 'right') group.rotation.y += action === 'left' ? -Math.PI / 8 : Math.PI / 8;
          if (action === 'in' || action === 'out') {
            const offset = camera.position.clone().sub(controls.target);
            const distance = Math.max(controls.minDistance, Math.min(controls.maxDistance, offset.length() * (action === 'in' ? 0.8 : 1.25)));
            camera.position.copy(controls.target).add(offset.setLength(distance));
          }
          controls.update();
        };
        const resize = () => {
          if (!mount) return;
          const rect = mount.getBoundingClientRect();
          const width = Math.max(rect.width, 1);
          const height = Math.max(rect.height, 1);
          renderer.setSize(width, height, true);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(mount);
        resize();
        new STLLoader().load(src, geometry => {
          if (disposed) return;
          geometry.computeVertexNormals();
          geometry.computeBoundingBox();
          const box = geometry.boundingBox;
          const center = new THREE.Vector3();
          const size = new THREE.Vector3();
          box.getCenter(center);
          box.getSize(size);
          geometry.translate(-center.x, -center.y, -center.z);
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const material = new THREE.MeshStandardMaterial({
            color: themeValue('--tactile-model-color', '#9F7ADA'),
            roughness: 0.62,
            metalness: 0.02,
            emissive: themeValue('--tactile-model-emissive', '#1B102A'),
            emissiveIntensity: 0.05,
            side: THREE.DoubleSide
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.scale.setScalar(2.2 / maxDim);
          mesh.rotation.x = -Math.PI / 2;
          mesh.rotation.z = -0.04;
          group.add(mesh);
          setStatus('');
        }, undefined, error => {
          window.__euclidStlViewerError = error && error.message ? error.message : String(error || '');
          if (!disposed) setStatus('The 3D model could not be loaded.');
        });
        const animate = () => {
          animationId = window.requestAnimationFrame(animate);
          if (controls) controls.update();
          renderer.render(scene, camera);
        };
        animate();
      } catch (error) {
        window.__euclidStlViewerError = error && error.message ? error.message : String(error || '');
        if (!disposed) setStatus('The 3D viewer could not be started.');
      }
    }
    init();
    return () => {
      disposed = true;
      modelActionsRef.current = null;
      if (animationId) window.cancelAnimationFrame(animationId);
      if (resizeObserver) resizeObserver.disconnect();
      if (controls) controls.dispose();
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
  }, [src]);
  return React.createElement("div", {
    "aria-label": label,
    role: "region",
    style: {
      position: 'relative',
      width: '100%',
      height: '100%'
    }
  }, React.createElement("div", {
    ref: mountRef,
    style: {
      position: 'absolute',
      inset: 0,
      touchAction: 'none'
    }
  }), status && React.createElement("div", {
    role: "status",
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--cream)',
      fontFamily: 'var(--font-body)',
      fontSize: '0.875rem',
      letterSpacing: '0.04em',
      textTransform: 'uppercase'
    }
  }, status), React.createElement("div", {
    className: "model-keyboard-controls",
    role: "group",
    "aria-label": "3D model controls"
  }, [['left', 'Rotate left'], ['right', 'Rotate right'], ['in', 'Zoom in'], ['out', 'Zoom out']].map(([action, text]) => React.createElement("button", {
    key: action,
    type: "button",
    disabled: Boolean(status),
    onClick: () => modelActionsRef.current?.(action)
  }, text))));
}
function DetectiveSection() {
  return React.createElement(React.Fragment, null, React.createElement("section", {
    id: "detective",
    "aria-labelledby": "detective-title",
    style: {
      position: 'relative',
      background: 'var(--space-deep)',
      padding: 'clamp(64px, 8vw, 110px) clamp(20px, 6vw, 80px)',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      overflow: 'hidden'
    }
  }, React.createElement(SectionAccents, {
    variant: "detective"
  }), React.createElement("div", {
    style: {
      position: 'relative',
      maxWidth: 1200,
      margin: '0 auto'
    }
  }, React.createElement("div", {
    className: "detective-grid",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
      gap: 'clamp(32px, 5vw, 64px)',
      alignItems: 'stretch'
    }
  }, React.createElement("div", {
    className: "detective-copy"
  }, React.createElement("div", {
    className: "detective-intro"
  }, React.createElement("div", {
    className: "section-pill",
    style: {
      marginBottom: 14
    }
  }, "Euclid Space Telescope"), React.createElement("h2", {
    id: "detective-title",
    className: "section-headline",
    style: {
      fontFamily: 'var(--font-heading)',
      fontSize: 'clamp(2.75rem, 6.8vw, 6.0rem)',
      fontWeight: 700,
      color: 'var(--cream)',
      lineHeight: 0.92,
      letterSpacing: 0,
      marginBottom: 28
    }
  }, React.createElement("span", {
    className: "section-headline__kicker",
    style: {
      display: 'block',
      fontSize: '0.36em',
      lineHeight: 1.1
    }
  }, "Designing a dark universe"), React.createElement("span", {
    className: "big-type-word section-headline__word",
    style: {
      display: 'block',
      fontFamily: 'var(--font-accent)',
      color: 'var(--purple-light)',
      fontWeight: 700
    }
  }, "detective")), React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: 16,
      marginBottom: 32,
      paddingBottom: 28,
      borderBottom: '1px solid var(--border)'
    }
  }, [{
    n: '1.2m',
    l: 'Mirror diameter'
  }, {
    n: 'L2',
    l: 'Orbit · 1.5M km from Earth'
  }, {
    n: '6 yrs',
    l: 'Mission duration'
  }].map(s => React.createElement("div", {
    key: s.n
  }, React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(1.375rem, 3vw, 1.875rem)',
      fontWeight: 600,
      color: 'var(--cream)',
      lineHeight: 1,
      letterSpacing: 0
    }
  }, s.n), React.createElement("div", {
    style: {
      fontSize: '0.875rem',
      color: 'var(--grey-mid)',
      marginTop: 6,
      letterSpacing: '0.04em'
    }
  }, s.l))))), React.createElement("div", {
    className: "detective-body"
  }, React.createElement("p", {
    style: {
      fontSize: '1.0rem',
      color: 'var(--grey-mid)',
      lineHeight: 1.75,
      marginBottom: 16
    }
  }, "Euclid is a flagship space telescope launched by the ", React.createElement("strong", {
    style: {
      color: 'var(--cream)',
      fontWeight: 600
    }
  }, "European Space Agency in July 2023"), ". While its main mirror is only about half the size of the Hubble Space Telescope's at 1.2 m, Euclid can image a much larger part of the sky in one go \u2014 observing more of the Universe in a few days than Hubble will ever see."), React.createElement("p", {
    style: {
      fontSize: '1.0rem',
      color: 'var(--grey-mid)',
      lineHeight: 1.75,
      marginBottom: 16
    }
  }, "Euclid is based at ", React.createElement("strong", {
    style: {
      color: 'var(--cream)',
      fontWeight: 600
    }
  }, "L2"), ", a dark and calm spot four times further from Earth than the Moon, following Earth's orbit around the Sun. It is creating a map of the deep Universe over six years, covering all of the sky not obscured by our own galaxy."), React.createElement("p", {
    style: {
      fontSize: '1.0rem',
      color: 'var(--grey-mid)',
      lineHeight: 1.75,
      marginBottom: 16
    }
  }, "On board Euclid are two instruments: the visible light instrument, ", React.createElement("strong", {
    style: {
      color: 'var(--purple-light)',
      fontWeight: 600
    }
  }, "VIS"), ", is among the largest digital cameras ever to go into space. ", React.createElement("strong", {
    style: {
      color: 'var(--cream)',
      fontWeight: 600
    }
  }, "University College London (UCL)"), " contributed to its design and build. A second camera, ", React.createElement("strong", {
    style: {
      color: 'var(--purple-light)',
      fontWeight: 600
    }
  }, "NISP"), ", captures infrared light that usually gets blocked by Earth's atmosphere."), React.createElement("p", {
    style: {
      fontSize: '1.0rem',
      color: 'var(--grey-mid)',
      lineHeight: 1.75,
      marginBottom: 16
    }
  }, "Scientists at the ", React.createElement("strong", {
    style: {
      color: 'var(--cream)',
      fontWeight: 600
    }
  }, "University of Edinburgh"), " lead the UK's involvement in Euclid's data analysis and host the UK's Science Data Centre, processing huge amounts of data ready for astronomers to make discoveries."), React.createElement("p", {
    style: {
      fontSize: '0.9375rem',
      color: 'var(--cream)',
      lineHeight: 1.65,
      marginBottom: 32,
      paddingLeft: 16,
      borderLeft: '2px solid var(--purple-light)'
    }
  }, "At this year's Royal Society Summer Science Exhibition you'll be able to get up close to a scale model of the Euclid space telescope."), React.createElement("a", {
    href: "euclid-humans.html",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: 'var(--purple-primary)',
      color: "#000000",
      border: 'none',
      borderRadius: 0,
      textDecoration: 'none',
      fontFamily: 'var(--font-body)',
      fontSize: '0.9375rem',
      fontWeight: 600,
      padding: '14px 28px',
      letterSpacing: '0.02em',
      transition: 'all 220ms var(--ease-space)'
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = 'var(--purple-light)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = 'var(--purple-primary)';
      e.currentTarget.style.transform = 'none';
    }
  }, "Meet the Team"))), React.createElement("div", {
    className: "detective-model",
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, React.createElement("div", {
    style: {
      position: 'relative',
      width: '100%',
      flex: '1 1 auto',
      minHeight: 'min(560px, 90vw)',
      overflow: 'hidden',
      background: 'transparent'
    }
  }, React.createElement("iframe", {
    title: "Interactive 3D model of the Euclid space telescope",
    frameBorder: "0",
    loading: "lazy",
    allowFullScreen: true,
    allowtransparency: "true",
    allow: "fullscreen; xr-spatial-tracking",
    src: "https://sketchfab.com/models/9a442399d7734a0898c379011af2e984/embed?autospin=0&autostart=0&preload=0&transparent=1&ui_theme=dark&ui_infos=0&ui_controls=1&ui_watermark=0",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      border: 0,
      background: 'transparent'
    }
  })))))), React.createElement(NewsletterSignup, null));
}
function NewsletterSignup() {
  const dialogRef = React.useRef(null);
  const launchRef = React.useRef(null);
  const previousOverflow = React.useRef("");
  const closeTimer = React.useRef(null);
  const config = window.EUCLID_NEWSLETTER || {};
  const ready = /^https:\/\//.test(config.signupAction || "") && /^https:\/\//.test(config.privacyUrl || "");

  React.useEffect(() => () => {
    window.clearTimeout(closeTimer.current);
    if (dialogRef.current?.open) document.body.style.overflow = previousOverflow.current;
  }, []);

  function openSignup() {
    if (!dialogRef.current || dialogRef.current.open) return;
    dialogRef.current.classList.remove("is-closing");
    previousOverflow.current = document.body.style.overflow;
    dialogRef.current.showModal();
    dialogRef.current.querySelector("#newsletter-dialog-title")?.focus({ preventScroll: true });
    document.body.style.overflow = "hidden";
  }

  function closeSignup() {
    const dialog = dialogRef.current;
    if (!dialog?.open || dialog.classList.contains("is-closing")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      dialog.close();
      return;
    }
    dialog.classList.add("is-closing");
    closeTimer.current = window.setTimeout(() => dialog.close(), 350);
  }

  function restoreScrolling() {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
    dialogRef.current?.classList.remove("is-closing");
    document.body.style.overflow = previousOverflow.current;
    launchRef.current?.focus({ preventScroll: true });
  }

  return React.createElement("section", {
    className: "newsletter-section",
    id: "newsletter",
    "aria-labelledby": "newsletter-title"
  }, React.createElement("div", { className: "newsletter-inner" },
    React.createElement("div", { className: "newsletter-copy" },
      React.createElement("p", { className: "newsletter-kicker" }, "Stay curious"),
      React.createElement("h2", { id: "newsletter-title" }, "Get the latest news and more about Euclid"),
      React.createElement("p", null, "Discover new images, mission updates, events and the science behind the dark Universe. Join the Euclid UK newsletter and stay in the loop.")
    ),
    React.createElement("button", {
      className: "newsletter-button",
      ref: launchRef,
      type: "button",
      "aria-haspopup": "dialog",
      "aria-controls": "newsletter-dialog",
      onClick: openSignup
    }, "Sign up", React.createElement("span", { "aria-hidden": "true" }, "→"))
  ), React.createElement("dialog", {
    className: "newsletter-dialog",
    id: "newsletter-dialog",
    ref: dialogRef,
    "aria-labelledby": "newsletter-dialog-title",
    "aria-describedby": "newsletter-dialog-intro",
    onClose: restoreScrolling,
    onCancel: event => {
      event.preventDefault();
      closeSignup();
    },
    onAnimationEnd: event => {
      if (event.target === event.currentTarget && event.animationName === "euclid-newsletter-close") dialogRef.current?.close();
    },
    onClick: event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeSignup();
    }
  }, React.createElement("button", {
    className: "newsletter-close",
    type: "button",
    "aria-label": "Close newsletter signup",
    onClick: closeSignup
  }, React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "24",
    height: "24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    "aria-hidden": "true"
  }, React.createElement("path", { d: "m5 5 14 14M19 5 5 19" }))),
  React.createElement("div", { className: "newsletter-dialog-panel", tabIndex: 0, role: "region", "aria-label": "Newsletter details" },
  React.createElement("h2", { id: "newsletter-dialog-title", tabIndex: -1 }, "Stay in the Euclid loop"),
  React.createElement("p", { id: "newsletter-dialog-intro" }, "News, discoveries and more from Euclid UK, straight to your inbox."),
  !ready && React.createElement("p", { className: "newsletter-notice", role: "status" }, "Newsletter signup is being prepared. No information is sent or saved while the mailing service and privacy information are being connected."),
  React.createElement("form", {
    method: "post",
    action: ready ? config.signupAction : undefined,
    target: "_blank",
    onSubmit: event => { if (!ready) event.preventDefault(); }
  }, React.createElement("fieldset", { disabled: !ready },
    React.createElement("legend", { className: "newsletter-form-legend" }, "Your newsletter details"),
    React.createElement("label", { htmlFor: "newsletter-email" }, "Email address"),
    React.createElement("input", { id: "newsletter-email", name: "EMAIL", type: "email", autoComplete: "email", required: true }),
    React.createElement("div", { className: "newsletter-name-fields" },
      React.createElement("div", null,
        React.createElement("label", { htmlFor: "newsletter-first-name" }, "First name (optional)"),
        React.createElement("input", { id: "newsletter-first-name", name: "FNAME", type: "text", autoComplete: "given-name" })
      ),
      React.createElement("div", null,
        React.createElement("label", { htmlFor: "newsletter-last-name" }, "Last name (optional)"),
        React.createElement("input", { id: "newsletter-last-name", name: "LNAME", type: "text", autoComplete: "family-name" })
      )
    ),
    React.createElement("label", { htmlFor: "newsletter-interest" }, "Most interested in"),
    React.createElement("select", { id: "newsletter-interest", name: "INTERESTED", defaultValue: "For Everyone" },
      ["For Everyone", "Primary Schools", "Secondary Schools", "STEM For Engagement"].map(interest => React.createElement("option", { key: interest, value: interest }, interest))
    ),
    React.createElement("label", { className: "newsletter-consent", htmlFor: "newsletter-consent" },
      React.createElement("input", { id: "newsletter-consent", name: "AGREE_TO_TERMS", type: "checkbox", value: "1", required: true }),
      React.createElement("span", null, "I’d like to receive the Euclid UK newsletter. I can unsubscribe at any time.")
    ),
    ready && React.createElement("p", { className: "newsletter-privacy" }, "Read how your information is used in our ", React.createElement("a", { href: config.privacyUrl, target: "_blank", rel: "noopener noreferrer" }, "privacy notice"), "."),
    React.createElement("button", { className: "newsletter-submit", type: "submit" }, ready ? "Sign up" : "Signup coming soon")
  )))));
}

function BackToTopButton() {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.75);
    onScroll();
    window.addEventListener('scroll', onScroll, {
      passive: true
    });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const scrollTop = () => {
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    const top = document.getElementById('top');
    if (top) top.scrollIntoView({
      behavior,
      block: 'start'
    });else window.scrollTo({
      top: 0,
      behavior
    });
  };
  return React.createElement("button", {
    type: "button",
    "aria-label": "Back to top",
    tabIndex: visible ? 0 : -1,
    "aria-hidden": !visible,
    onClick: scrollTop,
    style: {
      position: 'fixed',
      right: 'clamp(16px, 3vw, 32px)',
      bottom: 'clamp(16px, 3vw, 32px)',
      zIndex: 10,
      width: 48,
      height: 48,
      borderRadius: '50%',
      border: '1px solid var(--border)',
      background: 'var(--nav-bg-scrolled)',
      color: 'var(--cream)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 12px 32px rgba(0,0,0,0.28)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? 'auto' : 'none',
      transform: visible ? 'translateY(0)' : 'translateY(10px)',
      transition: 'opacity 220ms var(--ease-space), transform 220ms var(--ease-space), background 220ms var(--ease-space)'
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = 'var(--card-tint-hover)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = 'var(--nav-bg-scrolled)';
      e.currentTarget.style.transform = visible ? 'translateY(0)' : 'translateY(10px)';
    }
  }, React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "22",
    height: "22",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, React.createElement("path", {
    d: "M12 19V5"
  }), React.createElement("path", {
    d: "M5 12l7-7 7 7"
  })));
}
function useHomeTheme() {
  const [theme, setTheme] = React.useState(() => document.documentElement.dataset.theme || 'light');
  React.useEffect(() => {
    const observer = new MutationObserver(() => setTheme(document.documentElement.dataset.theme || 'light'));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
    return () => observer.disconnect();
  }, []);
  return theme;
}
function HomeContent() {
  const theme = useHomeTheme();
  return React.createElement(React.Fragment, null, React.createElement(EuclidHero, {
    theme: theme
  }), React.createElement(ScienceSection, null), React.createElement(NewsSection, null), React.createElement(DetectiveSection, null), React.createElement(BackToTopButton, null));
}
ReactDOM.createRoot(document.getElementById('home-content')).render(React.createElement(HomeContent));
})();
