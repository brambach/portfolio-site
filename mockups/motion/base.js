// Shared behaviour for the motion mockups in mockups/motion/. Not part of the site build. A plain-script port of the
// live sky site (src/sky/light.ts, parts.tsx, SkyHome.tsx) so each direction can start from the real thing and add
// one idea. Exposes window.Sky.
(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = t => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgb = c => `rgb(${c.join(" ")})`;
  const WHITE = [255, 255, 255];
  const pad = n => String(n).padStart(2, "0");
  const page = id => `/projects/${id}`;

  // ---- The work, as the live site shows it (src/sky/work.ts and src/projects/catalog.ts) ----------------------
  const WORK = [
    { id: "dervo", name: "Dervo", line: "Run more agents than you can watch.", kind: "Mac app", hero: { src: "/projects/dervo/catch-up.jpg" } },
    { id: "integration-portal", name: "Integration portal", line: "Make the complex legible.", kind: "Employee work", hero: { src: "/projects/portal/today.png" } },
    { id: "lucid", name: "Lucid", line: "From conversation to clarity.", kind: "In development", hero: { src: "/projects/lucid/spec.png" } },
    { id: "arro", name: "Arro", line: "Every day forward. Together.", kind: "React Native", hero: { src: "/projects/arro/today-sample.png", tall: true } },
    { id: "port", name: "Port", line: "A moment to close.", kind: "SwiftUI", hero: { port: true } },
    { id: "agentsky", name: "AgentSky", line: "A little closer to the cloud.", kind: "Design study", hero: { src: "/sky/agentsky-sky.jpg", pos: "50% 40%" } },
  ];
  // The picture a project opens on, as used in the hover card and the touch preview.
  const shot = p => `<div class="shot${p.hero.tall ? " tall" : ""}">${p.hero.port
    ? '<div class="port-tile"><i class="ring"></i><span>Hold to close</span></div>'
    : `<img src="${p.hero.src}" alt="" ${p.hero.pos ? `style="--pos:${p.hero.pos}"` : ""}>`}</div>`;

  // oklch to sRGB, so canvas colours can match the CSS sky exactly.
  function oklch(L, C, h) {
    const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
    const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
    return lin.map(x => { x = clamp(x, 0, 1); return Math.round(255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055)); });
  }
  const SKY = [[0.17, 0.028, 262], [0.205, 0.022, 285], [0.205, 0.014, 262], [0.225, 0.026, 28]].map(s => oklch(...s));
  const SUN = { rise: [[222, 140, 98], [246, 200, 116]], set: [[214, 116, 88], [244, 168, 92]] };
  const MOON = [[138, 154, 186], [226, 232, 242]];
  const BASE = { rise: mix(mix(SKY[0], SKY[1], 0.8), WHITE, 0.2), set: mix(SKY[3], WHITE, 0.2) };

  // ---- Small pieces ---------------------------------------------------------------------------------------------
  // Split text into letters for the rise. The element keeps its text as a label for screen readers.
  function letters(el, step) {
    const text = el.textContent;
    el.setAttribute("aria-label", text); el.textContent = "";
    [...text].forEach((ch, k) => {
      const s = document.createElement("span");
      s.className = "ch"; s.setAttribute("aria-hidden", "true"); s.style.setProperty("--k", k);
      if (step) s.style.setProperty("--step", step + "ms");
      s.textContent = ch === " " ? " " : ch; el.append(s);
    });
    return [...el.children];
  }

  // Anything marked data-in gets .seen when it reaches the screen. A delay lets the first screen finish first.
  function watchIn(delay = 0) {
    const all = () => document.querySelectorAll("[data-in]:not(.seen)");
    if (reduce) { all().forEach(el => el.classList.add("seen")); return; }
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("seen"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -6% 0px" });
    setTimeout(() => all().forEach(el => io.observe(el)), delay);
  }

  // Smooth scrolling: the wheel sets a target and the page eases toward it. Keys, the scrollbar and touch stay
  // native, and it's off with reduced motion.
  function smoothScroll() {
    if (reduce) return;
    let target = scrollY, cur = scrollY, running = false;
    const step = () => {
      cur += (target - cur) * 0.11;
      if (Math.abs(target - cur) < 0.4) { cur = target; running = false; }
      scrollTo(0, cur);
      if (running) requestAnimationFrame(step);
    };
    addEventListener("wheel", e => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.target.closest?.("[data-own-scroll]")) return;
      e.preventDefault();
      if (!running) target = cur = scrollY;
      target = clamp(target + e.deltaY * (e.deltaMode === 1 ? 32 : 1), 0, root.scrollHeight - innerHeight);
      if (!running) { running = true; requestAnimationFrame(step); }
    }, { passive: false });
    addEventListener("scroll", () => { if (!running) target = cur = scrollY; }, { passive: true });
  }

  // The scroll hint goes once you've scrolled.
  function scrolledFlag() {
    const check = () => { if (scrollY > 40) document.body.classList.add("scrolled"); };
    check(); addEventListener("scroll", check, { passive: true });
  }

  // ---- One frame loop for every canvas ------------------------------------------------------------------------
  // Capped at 30 frames a second, and only runs while something is on screen and something is happening (an
  // entrance, a ripple, or scrolling and pointing in the last few seconds). A painter is
  // { target, visible, layout(), paint(now), busy(now) }; add your own with Sky.addPainter.
  // A page can raise the cap with Sky.frameRate(60) when its sun moves and should glide.
  const IDLE_MS = 5000;
  let FRAME_MS = 31;
  const frameRate = fps => { FRAME_MS = 1000 / fps - 2; };
  const painters = new Set();
  let raf = 0, lastDraw = 0, lastActive = performance.now();
  function frame(now) {
    raf = 0;
    const shown = [...painters].filter(p => p.visible);
    if (!shown.length) return;
    if (now - lastDraw >= FRAME_MS) { lastDraw = now; shown.forEach(p => p.paint(now)); }
    const happening = now - lastActive < IDLE_MS || shown.some(p => p.busy && p.busy(now));
    if (happening && !document.hidden && !reduce) raf = requestAnimationFrame(frame);
  }
  function kick() {
    if (reduce) { const now = performance.now(); painters.forEach(p => p.visible && p.paint(now)); return; }
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function wake() { lastActive = performance.now(); kick(); }
  const seeIO = new IntersectionObserver(es => es.forEach(e => {
    const p = [...painters].find(x => x.target === e.target);
    if (!p) return;
    p.visible = e.isIntersecting;
    if (p.visible) { if (p.born == null) p.born = performance.now(); wake(); }
  }));
  function addPainter(p) {
    p.visible = p.visible ?? false; painters.add(p);
    if (p.always) { p.visible = true; p.born = performance.now(); } else seeIO.observe(p.target);
    p.layout?.(); kick();
    return p;
  }
  addEventListener("scroll", wake, { passive: true });
  addEventListener("pointermove", wake, { passive: true });
  addEventListener("resize", () => { painters.forEach(p => p.layout?.()); kick(); });
  document.addEventListener("visibilitychange", kick);
  document.fonts?.ready.then(() => { painters.forEach(p => p.layout?.()); kick(); });

  // ---- Horizons -------------------------------------------------------------------------------------------------
  // A halftone grid where a dot's size is the light reaching it. Above the line: the sun as a disc of full dots, a
  // glow and a band of light along the horizon. Below: water as flattened dashes, the sun's reflection shimmering in
  // a column that widens toward you. Point at or tap the water and it ripples.
  // "rise" climbs into place when it first shows and keeps climbing as you scroll away (it must sit at the top of the
  // page); "set" sinks as you reach the end. Options: R, water (px of water), x (0..1 across), and hooks
  //   sun(s, now) -> { x, y }   put the sun anywhere (canvas pixels); y can go below the line or far above it
  //   night() -> bool           a silver moon instead of the sun
  //   light() -> 0..1           override how much light there is (default: from the sun's height)
  //   top() -> px               the highest row to draw (default: a few sun-widths above the sun or the line)
  //   disc(s) -> px             the size of the disc and its glow, if it should differ from R (R still sets how
  //                             wide the reflection is)
  function horizon(host, kind, opt = {}) {
    const canvas = host.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    const s = { kind, host, canvas, ctx, opt, ripples: [], last: 0, W: 0, H: 0, R: 0, gap: 0, hz: 0, sx: 0 };
    s.layout = () => {
      const narrow = root.clientWidth < 700, dpr = Math.min(2, devicePixelRatio || 1);
      s.W = host.clientWidth; s.H = host.clientHeight;
      canvas.width = Math.round(s.W * dpr); canvas.height = Math.round(s.H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      s.R = (narrow ? opt.Rs : opt.R) ?? (narrow ? 28 : 46);
      s.gap = opt.gap ?? (narrow ? 9 : 11);
      s.hz = s.H - ((narrow ? opt.waters : opt.water) ?? (narrow ? 84 : 130));
      s.sx = s.W * ((narrow ? opt.xs : opt.x) ?? (kind === "rise" ? (narrow ? 0.7 : 0.64) : (narrow ? 0.3 : 0.36)));
    };
    const sunAt = now => {
      if (opt.sun) return opt.sun(s, now);
      const { R, hz } = s;
      if (kind === "rise") {
        const age = reduce ? 1 : s.born == null ? 0 : 1 - Math.pow(1 - clamp((now - s.born) / 3200, 0, 1), 3);
        const away = clamp(scrollY / Math.max(1, s.H), 0, 1);
        return { x: s.sx, y: hz + R * 1.15 - (R * 1.15 + R * 0.55) * age - R * 1.6 * away };
      }
      const top = host.getBoundingClientRect().top + scrollY;
      const p = clamp((scrollY + innerHeight - top) / Math.max(1, root.scrollHeight - top), 0, 1);
      return { x: s.sx, y: hz - R * 1.8 + R * 2.25 * smooth(p) };
    };
    s.paint = now => {
      const { W, H, hz, R, gap } = s, t = now / 1000;
      if (!W || !H) return;
      const { x: sx, y: sy } = sunAt(now);
      s.sunX = sx; s.sunY = sy;
      const night = opt.night ? opt.night() : false;
      const [mid, high] = night ? MOON : SUN[kind], base = BASE[kind];
      const light = opt.light ? opt.light(s) : clamp((hz - sy) / R + 1.1, 0.15, 1);
      const Rd = opt.disc ? Math.max(0.01, opt.disc(s)) : R;
      const maxR = gap * 0.46, NB = 12;
      const dots = Array.from({ length: NB }, () => new Path2D()), dashes = Array.from({ length: NB }, () => new Path2D());
      s.ripples = s.ripples.filter(rp => t - rp.t0 < 2.8);
      const top = opt.top ? opt.top(s) : Math.max(0, Math.min(hz, sy) - Math.max(Rd, 30) * 4.5);
      const y0 = gap / 2 + Math.ceil((top - gap / 2) / gap) * gap;
      ctx.clearRect(0, 0, W, H);
      const wash = ctx.createRadialGradient(sx, sy, Rd * 0.6, sx, sy, Rd * 5);
      wash.addColorStop(0, `rgb(${high.join(" ")} / ${(0.12 * light).toFixed(3)})`);
      wash.addColorStop(1, `rgb(${high.join(" ")} / 0)`);
      ctx.fillStyle = wash; ctx.fillRect(0, 0, W, hz);
      for (let y = y0, row = 0; y < H; y += gap, row++) {
        const water = y >= hz;
        const depth = water ? (y - hz) / (H - hz) : 0;
        const up = water ? 1 - smooth(clamp((depth - 0.55) / 0.45, 0, 1)) : smooth(clamp((y - top) / (Math.max(Rd, 30) * 2.5), 0, 1));
        const offset = water && row % 2 ? gap / 2 : 0;
        for (let x = gap / 2 + offset; x < W; x += gap) {
          const dx = x - sx;
          let B;
          if (!water) {
            const d = Math.hypot(dx, y - sy);
            const disc = d < Rd ? 1 : 0;
            const glow = d >= Rd ? Math.exp(-(d - Rd) / (Rd * 1.4)) * 0.7 * light : 0;
            const band = 0.42 * Math.exp(-(hz - y) / 24) * Math.exp(-Math.abs(dx) / (W * 0.32)) * light;
            const haze = 0.05 * Math.exp(-(hz - y) / 70);
            B = Math.max(disc, (glow + band + haze) * up);
          } else {
            const spread = R * 0.75 + depth * R * 2.4;
            const above = clamp((hz + R - sy) / R, 0, 1);
            const shimmer = reduce ? 0.8 : 0.62 + 0.38 * Math.sin(x * 0.05 + y * 0.6 - t * 1.6) * Math.sin(x * 0.011 - t * 0.55 + y * 0.15);
            B = (Math.exp(-Math.abs(dx) / spread) * (1 - depth * 0.65) * light * above * shimmer * 0.95 + 0.07 * (1 - depth) * light + 0.045) * up;
            for (const rp of s.ripples) {
              const a = t - rp.t0, ring = 10 + a * 80;
              const de = Math.hypot(x - rp.x, (y - rp.y) * 2.4);
              B += Math.exp(-((de - ring) ** 2) / 110) * Math.exp(-a * 1.4) * 0.6 * up;
            }
          }
          const k = clamp(B, 0, 1);
          const r = maxR * Math.pow(k, 0.8);
          if (r < 0.4) continue;
          const b = Math.min(NB - 1, Math.floor(k * NB));
          if (water) { const rx = Math.min(r * 1.7, gap * 0.47), ry = r * 0.5; dashes[b].moveTo(x + rx, y); dashes[b].ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }
          else { dots[b].moveTo(x + r, y); dots[b].arc(x, y, r, 0, Math.PI * 2); }
        }
      }
      for (let b = 0; b < NB; b++) {
        const k = (b + 0.5) / NB;
        ctx.fillStyle = rgb(k < 0.45 ? mix(base, mid, k / 0.45) : mix(mid, high, (k - 0.45) / 0.55));
        ctx.fill(dots[b]); ctx.fill(dashes[b]);
      }
    };
    s.busy = now => (s.born != null && now - s.born < 3400) || s.ripples.length > 0;
    s.target = host;
    s.ripple = (x, y) => {
      if (reduce || y < s.hz) return;
      s.ripples.push({ x, y, t0: performance.now() / 1000 });
      if (s.ripples.length > 14) s.ripples.shift();
      kick();
    };
    const local = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    host.addEventListener("pointermove", e => { const [x, y] = local(e), now = performance.now(); if (now - s.last > 110) { s.last = now; s.ripple(x, y); } });
    host.addEventListener("pointerdown", e => s.ripple(...local(e)));
    new ResizeObserver(() => { s.layout(); kick(); }).observe(host);
    return addPainter(s);
  }

  // ---- The picture mirrored into halftone water -------------------------------------------------------------
  // Each dash takes the colour of the pixel it reflects and its size from how bright it is. It shimmers, fades with
  // depth, and ripples where you point. Call .layout() again after the picture changes.
  function reflection(picture, canvas) {
    const ctx = canvas.getContext("2d");
    const src = document.createElement("canvas"), sctx = src.getContext("2d", { willReadFrequently: true });
    const p = { target: canvas, samples: null, ripples: [], last: 0 };
    let W = 0, H = 0, cols = 0, rows = 0;
    const gapX = () => (root.clientWidth < 700 ? 6 : 8), GY = 6;
    function cover(img, w, h) {
      const [px, py] = (getComputedStyle(img).objectPosition || "0 0").split(" ").map(v => parseFloat(v) / 100 || 0);
      const ir = img.naturalWidth / img.naturalHeight, br = w / h;
      let sw = img.naturalWidth, sh = img.naturalHeight;
      if (ir > br) sw = sh * br; else sh = sw / br;
      sctx.drawImage(img, (img.naturalWidth - sw) * px, (img.naturalHeight - sh) * py, sw, sh, 0, 0, w, h);
    }
    p.layout = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.floor(W / gapX()); rows = Math.floor(H / GY);
      const pr = picture.getBoundingClientRect();
      if (!pr.width || !cols) return;
      const k = cols / pr.width;
      src.width = cols; src.height = Math.max(1, Math.round(pr.height * k));
      sctx.fillStyle = getComputedStyle(picture).backgroundColor; sctx.fillRect(0, 0, src.width, src.height);
      try {
        picture.querySelectorAll("img").forEach(img => {
          if (!img.complete || !img.naturalWidth) return;
          if (getComputedStyle(img).objectFit === "cover") cover(img, src.width, src.height);
          else { const r = img.getBoundingClientRect(); sctx.drawImage(img, (r.left - pr.left) * k, (r.top - pr.top) * k, r.width * k, r.height * k); }
        });
        const ring = picture.querySelector(".ring");
        if (ring) { const r = ring.getBoundingClientRect(); sctx.strokeStyle = "rgb(255 255 255 / 0.7)"; sctx.lineWidth = Math.max(1, 2 * k); sctx.beginPath(); sctx.arc((r.left - pr.left + r.width / 2) * k, (r.top - pr.top + r.height / 2) * k, r.width / 2 * k, 0, Math.PI * 2); sctx.stroke(); }
        const data = sctx.getImageData(0, 0, src.width, src.height).data;
        p.samples = Array.from({ length: rows }, (_, r) => {
          const y = clamp(src.height - 1 - Math.round(r * GY * 1.6 * k), 0, src.height - 1);
          return Array.from({ length: cols }, (_, c) => { const i = (y * src.width + c) * 4; return [data[i], data[i + 1], data[i + 2]]; });
        });
      } catch { p.samples = null; }
      kick();
    };
    p.paint = now => {
      if (!p.samples) return;
      const t = now / 1000, gx = gapX();
      ctx.clearRect(0, 0, W, H);
      p.ripples = p.ripples.filter(rp => t - rp.t0 < 2.6);
      for (let r = 0; r < rows; r++) {
        const y = r * GY + GY / 2, depth = r / rows;
        const fade = Math.pow(1 - depth, 1.5) * 0.55;
        if (fade < 0.02) continue;
        const line = p.samples[r];
        for (let c = 0; c < cols; c++) {
          const [R, G, B] = line[c];
          const lum = (0.2126 * R + 0.7152 * G + 0.0722 * B) / 255;
          let k = (0.25 + 0.75 * lum) * (reduce ? 0.85 : 0.78 + 0.22 * Math.sin(c * gx * 0.05 + y * 0.55 - t * 1.5));
          const x = c * gx + gx / 2 + (reduce ? 0 : Math.sin(y * 0.6 + t * 1.2 + c * 0.15) * 1.2);
          let a = fade;
          for (const rp of p.ripples) {
            const age = t - rp.t0, ring = 8 + age * 70;
            const de = Math.hypot(x - rp.x, (y - rp.y) * 2.4);
            const boost = Math.exp(-((de - ring) ** 2) / 90) * Math.exp(-age * 1.5);
            k += boost * 0.6; a += boost * 0.35;
          }
          const rx = Math.min(gx * 0.48, gx * 0.46 * k), ry = Math.max(0.5, rx * 0.32);
          if (rx < 0.5) continue;
          ctx.globalAlpha = Math.min(1, a);
          ctx.fillStyle = `rgb(${R} ${G} ${B})`;
          ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };
    p.busy = () => p.ripples.length > 0;
    p.ripple = (x, y) => {
      if (reduce) return;
      const now = performance.now();
      if (now - p.last < 110) return;
      p.last = now; p.ripples.push({ x, y, t0: now / 1000 });
      if (p.ripples.length > 12) p.ripples.shift();
      kick();
    };
    picture.addEventListener("pointermove", e => { const r = canvas.getBoundingClientRect(); p.ripple(e.clientX - r.left, 3); });
    canvas.addEventListener("pointermove", e => { const r = canvas.getBoundingClientRect(); p.ripple(e.clientX - r.left, e.clientY - r.top); });
    new ResizeObserver(() => p.layout()).observe(picture);
    picture.querySelectorAll("img").forEach(img => { if (!img.complete) img.addEventListener("load", () => requestAnimationFrame(p.layout), { once: true }); });
    return addPainter(p);
  }

  // ---- Click ripples: a ring of small gold dots spreads from wherever you press ------------------------------
  function clickRipples(color = "233 184 96") {
    if (reduce) return;
    const c = document.createElement("canvas"); c.className = "ripples"; c.setAttribute("aria-hidden", "true");
    document.body.append(c);
    const ctx = c.getContext("2d");
    let rings = [], loop = 0;
    const size = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      c.width = innerWidth * dpr; c.height = innerHeight * dpr; c.style.width = innerWidth + "px"; c.style.height = innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size(); addEventListener("resize", size);
    const tick = now => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      rings = rings.filter(r => now - r.t0 < 900);
      for (const r of rings) {
        const a = (now - r.t0) / 900, e = 1 - Math.pow(1 - a, 3);
        const rad = 5 + e * 40, n = 16, dot = 0.5 + 1.5 * (1 - a);
        ctx.fillStyle = `rgb(${typeof color === "function" ? color() : color} / ${(0.8 * (1 - a)).toFixed(3)})`;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const th = (i / n) * Math.PI * 2, x = r.x + Math.cos(th) * rad, y = r.y + Math.sin(th) * rad;
          ctx.moveTo(x + dot, y); ctx.arc(x, y, dot, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      loop = rings.length ? requestAnimationFrame(tick) : 0;
    };
    addEventListener("pointerdown", e => {
      if (e.target.closest(".bar, .lit, [data-no-ripple]")) return;
      rings.push({ x: e.clientX, y: e.clientY, t0: performance.now() });
      if (!loop) loop = requestAnimationFrame(tick);
    }, { passive: true });
  }

  // ---- The work list -----------------------------------------------------------------------------------------
  // Fills `list` with the quiet rows, and on a mouse a small card follows the cursor showing the picture the project
  // opens on. On touch the first tap opens the preview in place and the second opens the project. `meta` reads out
  // where you are ("02 / 06"). Returns { show(i, event), hide(), peek } so In short can use the same card.
  function workList(list, meta) {
    const peek = document.createElement("div");
    peek.className = "peek"; peek.setAttribute("aria-hidden", "true");
    peek.innerHTML = `<div class="stack">${WORK.map(shot).join("")}</div>`;
    document.body.append(peek);
    const stack = peek.firstElementChild;
    WORK.forEach((p, i) => {
      const row = document.createElement("div");
      row.className = "row"; row.dataset.i = i; row.dataset.id = p.id; row.dataset.in = "";
      row.style.setProperty("--d", 160 + i * 80 + "ms");
      row.innerHTML = `<a class="head" href="${page(p.id)}"><span class="no">${pad(i + 1)}</span> <span class="nm">${p.name}</span> <span class="ln">${p.line}</span> <span class="kd">${p.kind}</span></a>
        <div class="drop"><div><div class="inner">${shot(p)}<a class="go u" href="${page(p.id)}">Open ${p.name}</a></div></div></div>`;
      list.append(row);
    });
    const end = document.createElement("div");
    end.className = "end"; end.dataset.in = ""; end.style.setProperty("--d", 160 + WORK.length * 80 + "ms");
    list.append(end);
    const total = pad(WORK.length);
    const point = i => { if (meta) meta.innerHTML = i == null ? total : `<b>${pad(+i + 1)}</b> / ${total}`; };
    point(null);

    const W = 272, H = 170, GAP = 30;
    let tx = 0, ty = 0, x = 0, y = 0, on = false, loop = 0;
    const aim = (cx, cy) => {
      tx = cx + 14 + W + 16 > innerWidth ? cx - W - 14 : cx + 14;
      ty = cy + GAP + H + 12 > innerHeight ? cy - GAP - H : cy + GAP;
    };
    const tick = () => {
      const k = reduce ? 1 : 0.12;
      x += (tx - x) * k; y += (ty - y) * k;
      peek.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      loop = on || Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(tick) : 0;
    };
    addEventListener("mousemove", e => aim(e.clientX, e.clientY), { passive: true });
    const api = {
      peek,
      show(i, e) {
        if (!fine) return;
        if (e) aim(e.clientX, e.clientY);
        if (!on) { x = tx; y = ty; }
        on = true; peek.classList.add("on");
        stack.style.transform = `translateY(${-H * i}px)`;
        if (!loop) loop = requestAnimationFrame(tick);
      },
      hide() { on = false; peek.classList.remove("on"); },
    };
    if (fine) {
      list.addEventListener("mouseover", e => { const row = e.target.closest(".row"); if (row) { api.show(+row.dataset.i, e); point(row.dataset.i); } });
      list.addEventListener("mouseleave", () => { api.hide(); point(null); });
    } else {
      list.addEventListener("click", e => {
        const head = e.target.closest(".head"); if (!head) return;
        const row = head.closest(".row");
        if (row.hasAttribute("data-open")) return;
        e.preventDefault();
        list.querySelectorAll(".row[data-open]").forEach(r => r.removeAttribute("data-open"));
        row.setAttribute("data-open", ""); point(row.dataset.i);
      });
    }
    list.addEventListener("focusin", e => { const row = e.target.closest(".row"); if (row) point(row.dataset.i); });
    return api;
  }

  // ---- In short ----------------------------------------------------------------------------------------------
  // Words come up from faint as you scroll. The three that name a project then get an underline made of the
  // horizon's dots and a glint runs across them once. Point at one and its dots turn to water, and the picture
  // follows the cursor like the list. Markup: <p class="about"> with <a data-peek="i"> around the project words.
  function inShort(about, peekApi) {
    const words = [];
    (function split(node, link) {
      [...node.childNodes].forEach(child => {
        if (child.nodeType !== 3) { split(child, child.matches?.("a[data-peek]") ? child : link); return; }
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (!part.trim()) { frag.append(part); return; }
          const w = document.createElement("span");
          w.textContent = part; w.link = link; words.push(w); frag.append(w);
        });
        child.replaceWith(frag);
      });
    })(about, null);
    words.forEach((w, i) => { w.closes = w.link && (words[i + 1] || {}).link !== w.link; });
    about.querySelectorAll("a[data-peek]").forEach(a => {
      a.querySelectorAll("span").forEach((w, j) => { w.classList.add("pw"); w.style.setProperty("--wd", j * 90 + "ms"); w.style.setProperty("--gd", j * 70 + "ms"); });
      if (peekApi) { a.addEventListener("mouseenter", e => peekApi.show(+a.dataset.peek, e)); a.addEventListener("mouseleave", () => peekApi.hide()); }
    });
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = about.getBoundingClientRect();
      const p = clamp((innerHeight * 0.9 - r.top) / (innerHeight * 0.55), 0, 1);
      const n = words.length, width = 6;
      words.forEach((w, i) => {
        const t = reduce ? 1 : clamp((p * (n + width) - i) / width, 0, 1);
        w.style.opacity = (0.16 + 0.84 * smooth(t)).toFixed(3);
        if (w.closes) {
          const on = t >= 1, a = w.link;
          if (on && !a.classList.contains("lit-up")) { a.classList.add("lit-up"); if (!reduce && !a.dataset.glinted) { a.dataset.glinted = "1"; a.classList.add("glint"); } }
          else if (!on) a.classList.remove("lit-up");
        }
      });
    };
    update();
    addEventListener("scroll", () => { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
    addEventListener("resize", update);
  }

  // ---- The bar: switch between the directions (mockups only) --------------------------------------------------
  const DIRECTIONS = [
    ["now.html", "Now"], ["day-horizon.html", '<span class="long">Day + Horizon</span><span class="short">1+5</span>'],
    ["a-day.html", "Day", 1], ["held-sun.html", "Sun", 2], ["print.html", "Print", 3], ["big-type.html", "Type", 4], ["one-horizon.html", "Horizon", 5],
  ];
  function bar(current) {
    const nav = document.createElement("nav");
    nav.className = "bar"; nav.setAttribute("aria-label", "Directions");
    nav.innerHTML = `<a href="index.html">All</a>` + DIRECTIONS.map(([href, label, n]) =>
      `<a href="${href}"${href === current ? ' aria-current="page"' : ""}>${n ? `<b>${n}</b>` : ""}${label}</a>`).join("");
    document.body.append(nav);
  }

  window.Sky = {
    root, reduce, fine, clamp, smooth, lerp, mix, rgb, oklch, pad, page, WORK, shot, SKY, SUN, MOON,
    letters, watchIn, smoothScroll, scrolledFlag, addPainter, kick, wake, frameRate, horizon, reflection, clickRipples, workList, inShort, bar,
  };
})();
