// Shared behaviour for the clean portfolio mockups (clean-e.html and clean-e-project.html). Not part of the site build.
// Exposes window.Sky: entrances, smooth scrolling, the halftone horizons, click ripples and the water reflection.
(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = t => t * t * (3 - 2 * t);
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgb = c => `rgb(${c.join(" ")})`;
  const WHITE = [255, 255, 255];

  // oklch to sRGB, so the canvas dots can match the CSS sky exactly.
  function oklch(L, C, h) {
    const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
    const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
    return lin.map(x => { x = clamp(x, 0, 1); return Math.round(255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055)); });
  }
  // The same four stops as --bg0..--bg3 in clean-e.css.
  const SKY = [[0.17, 0.028, 262], [0.205, 0.022, 285], [0.205, 0.014, 262], [0.225, 0.026, 28]].map(s => oklch(...s));
  const WARM = { rise: [[222, 140, 98], [246, 200, 116]], set: [[214, 116, 88], [244, 168, 92]] };
  const BASE = { rise: mix(mix(SKY[0], SKY[1], 0.8), WHITE, 0.2), set: mix(SKY[3], WHITE, 0.2) };

  // Split a heading into letters for the rise. The heading keeps its text as a label for screen readers.
  function letters(el) {
    const text = el.textContent;
    el.setAttribute("aria-label", text); el.textContent = "";
    [...text].forEach((ch, k) => {
      const s = document.createElement("span");
      s.className = "ch"; s.setAttribute("aria-hidden", "true"); s.style.setProperty("--k", k);
      s.textContent = ch === " " ? " " : ch; el.append(s);
    });
  }

  // Anything marked data-in gets .seen when it reaches the screen. A delay lets the first screen finish first.
  function watchIn(delay = 0, now = false) {
    const all = () => document.querySelectorAll("[data-in]:not(.seen)");
    if (reduce || now) { all().forEach(el => el.classList.add("seen")); return; }
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("seen"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -6% 0px" });
    setTimeout(() => all().forEach(el => io.observe(el)), delay);
  }

  // Smooth scrolling: the wheel sets a target and the page eases toward it. Keys, the scrollbar and touch stay
  // native, and it's off when the system asks for reduced motion.
  function smoothScroll() {
    if (reduce) return;
    let target = scrollY, cur = scrollY, running = false;
    const maxY = () => root.scrollHeight - innerHeight;
    function step() {
      cur += (target - cur) * 0.11;
      if (Math.abs(target - cur) < 0.4) { cur = target; running = false; }
      scrollTo(0, cur);
      if (running) requestAnimationFrame(step);
    }
    addEventListener("wheel", e => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (!running) target = cur = scrollY;
      target = clamp(target + e.deltaY * (e.deltaMode === 1 ? 32 : 1), 0, maxY());
      if (!running) { running = true; requestAnimationFrame(step); }
    }, { passive: false });
  }

  // ---- The horizons ------------------------------------------------------------------------------------------
  // A halftone grid where a dot's size is the light reaching it. Above the line: the sun as a disc of full dots, a
  // glow around it and a band of light along the horizon. Below: water as flattened dashes, with the sun's reflection
  // shimmering in a column that widens toward you. Point at or tap the water and it ripples.
  // "rise" climbs into place when it first shows and keeps climbing as you scroll away from it (it must sit at the
  // top of the page). "set" sinks as you reach the end of the page. Nothing is drawn more than a few sun-widths above
  // the horizon, so words above it never sit on dots.
  const scenes = [];
  let raf = 0;
  function layout(s) {
    const narrow = root.clientWidth < 700, dpr = Math.min(2, devicePixelRatio || 1);
    s.W = s.host.clientWidth; s.H = s.host.clientHeight;
    s.canvas.width = Math.round(s.W * dpr); s.canvas.height = Math.round(s.H * dpr);
    s.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    s.R = (narrow ? s.opt.Rs : s.opt.R) ?? (narrow ? 28 : 46);
    s.gap = narrow ? 9 : 11;
    s.hz = s.H - ((narrow ? s.opt.waters : s.opt.water) ?? (narrow ? 84 : 130));
    s.sx = s.W * ((narrow ? s.opt.xs : s.opt.x) ?? (s.kind === "rise" ? (narrow ? 0.7 : 0.64) : (narrow ? 0.3 : 0.36)));
  }
  function sunY(s, now) {
    if (s.kind === "rise") {
      const age = reduce ? 1 : !s.born ? 0 : 1 - Math.pow(1 - clamp((now - s.born) / 3200, 0, 1), 3);
      const away = clamp(scrollY / s.H, 0, 1);
      return s.hz + s.R * 1.15 - (s.R * 1.15 + s.R * 0.55) * age - s.R * 1.6 * away;
    }
    const top = s.host.getBoundingClientRect().top + scrollY;
    const p = clamp((scrollY + innerHeight - top) / Math.max(1, root.scrollHeight - top), 0, 1);
    return s.hz - s.R * 1.8 + s.R * 2.25 * smooth(p);
  }
  function draw(s, now) {
    const { ctx, W, H, hz, R, gap, sx } = s, t = now / 1000;
    const [mid, high] = WARM[s.kind === "rise" ? "rise" : "set"], base = BASE[s.kind === "rise" ? "rise" : "set"];
    const sy = sunY(s, now);
    const light = clamp((hz - sy) / R + 1.1, 0.15, 1);
    const maxR = gap * 0.46, NB = 12;
    const dots = Array.from({ length: NB }, () => new Path2D()), dashes = Array.from({ length: NB }, () => new Path2D());
    s.ripples = s.ripples.filter(rp => t - rp.t0 < 2.8);
    const top = Math.max(0, Math.min(hz, sy) - R * 4.5);
    const y0 = gap / 2 + Math.ceil((top - gap / 2) / gap) * gap;
    ctx.clearRect(0, 0, W, H);
    // A faint wash of warm light around the sun, above the line only.
    const wash = ctx.createRadialGradient(sx, sy, R * 0.6, sx, sy, R * 5);
    wash.addColorStop(0, `rgb(${high.join(" ")} / ${(0.12 * light).toFixed(3)})`);
    wash.addColorStop(1, `rgb(${high.join(" ")} / 0)`);
    ctx.fillStyle = wash; ctx.fillRect(0, 0, W, hz);
    for (let y = y0, row = 0; y < H; y += gap, row++) {
      const water = y >= hz;
      const depth = water ? (y - hz) / (H - hz) : 0;
      const up = water ? 1 - smooth(clamp((depth - 0.55) / 0.45, 0, 1)) : smooth(clamp((y - top) / (R * 2.5), 0, 1));
      const offset = water && row % 2 ? gap / 2 : 0;
      for (let x = gap / 2 + offset; x < W; x += gap) {
        const dx = x - sx;
        let B;
        if (!water) {
          const d = Math.hypot(dx, y - sy);
          const disc = d < R ? 1 : 0;
          const glow = d >= R ? Math.exp(-(d - R) / (R * 1.4)) * 0.7 * light : 0;
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
  }
  const painters = new Set();   // other animated canvases (the reflection) share the same frame loop
  function frame(now) {
    raf = 0;
    let any = false;
    scenes.forEach(s => { if (s.visible) { draw(s, now); any = true; } });
    painters.forEach(p => { if (p.visible) { p.paint(now); any = true; } });
    if (any && !reduce && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function kick() {
    if (reduce) { const now = performance.now(); scenes.forEach(s => s.visible && draw(s, now)); painters.forEach(p => p.visible && p.paint(now)); return; }
    if (!raf) raf = requestAnimationFrame(frame);
  }
  const sceneIO = new IntersectionObserver(es => es.forEach(e => {
    const s = scenes.find(x => x.host === e.target) || [...painters].find(x => x.host === e.target);
    if (!s) return;
    s.visible = e.isIntersecting;
    if (s.visible) { if (!s.born) s.born = performance.now(); kick(); }
  }));
  function horizon(host, kind, opt = {}) {
    const canvas = host.querySelector("canvas");
    const s = { kind, host, canvas, ctx: canvas.getContext("2d"), opt, visible: false, born: null, ripples: [], last: 0 };
    scenes.push(s); layout(s); sceneIO.observe(host);
    const local = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const ripple = (x, y) => {
      if (reduce || y < s.hz) return;
      s.ripples.push({ x, y, t0: performance.now() / 1000 });
      if (s.ripples.length > 14) s.ripples.shift();
      kick();
    };
    host.addEventListener("pointermove", e => {
      const [x, y] = local(e), now = performance.now();
      if (now - s.last > 110) { s.last = now; ripple(x, y); }
    });
    host.addEventListener("pointerdown", e => ripple(...local(e)));
    return s;
  }
  const relayout = () => { scenes.forEach(layout); painters.forEach(p => p.layout()); kick(); };
  addEventListener("resize", relayout);
  document.fonts.ready.then(relayout);
  addEventListener("scroll", () => { if (reduce) kick(); }, { passive: true });
  document.addEventListener("visibilitychange", kick);

  // ---- Click ripples ---------------------------------------------------------------------------------------
  // A ring of small gold dots spreads from wherever you press, and fades. The horizons ripple on their own.
  function clickRipples() {
    if (reduce) return;
    const c = document.createElement("canvas"); c.className = "ripples"; c.setAttribute("aria-hidden", "true");
    document.body.append(c);
    const ctx = c.getContext("2d");
    let rings = [], loop = 0;
    function size() {
      const dpr = Math.min(2, devicePixelRatio || 1);
      c.width = innerWidth * dpr; c.height = innerHeight * dpr; c.style.width = innerWidth + "px"; c.style.height = innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size(); addEventListener("resize", size);
    function tick(now) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      rings = rings.filter(r => now - r.t0 < 900);
      for (const r of rings) {
        const a = (now - r.t0) / 900, e = 1 - Math.pow(1 - a, 3);
        const rad = 5 + e * 40, n = 16, dot = 0.5 + 1.5 * (1 - a);
        ctx.fillStyle = `rgb(233 184 96 / ${(0.8 * (1 - a)).toFixed(3)})`;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const th = (i / n) * Math.PI * 2, x = r.x + Math.cos(th) * rad, y = r.y + Math.sin(th) * rad;
          ctx.moveTo(x + dot, y); ctx.arc(x, y, dot, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      loop = rings.length ? requestAnimationFrame(tick) : 0;
    }
    addEventListener("pointerdown", e => {
      if (e.target.closest(".bar, .lit")) return;
      rings.push({ x: e.clientX, y: e.clientY, t0: performance.now() });
      if (!loop) loop = requestAnimationFrame(tick);
    }, { passive: true });
  }

  // ---- Reflection ------------------------------------------------------------------------------------------
  // The picture above, mirrored into halftone water: each dash takes the colour of the pixel it reflects and its
  // size from how bright that pixel is. It shimmers, fades with depth, and ripples where you point.
  function reflection(picture, canvas) {
    const ctx = canvas.getContext("2d");
    const src = document.createElement("canvas"), sctx = src.getContext("2d", { willReadFrequently: true });
    const p = { host: canvas, visible: false, born: null, samples: null, ripples: [], last: 0 };
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
      // Draw the picture as it appears on screen into a small canvas, one pixel per dash column.
      const pr = picture.getBoundingClientRect();
      if (!pr.width) return;
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
        // Row r of the water reflects the picture from its bottom edge upward, a little compressed.
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
          let x = c * gx + gx / 2 + (reduce ? 0 : Math.sin(y * 0.6 + t * 1.2 + c * 0.15) * 1.2);
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
    const ripple = (x, y) => {
      if (reduce) return;
      const now = performance.now();
      if (now - p.last < 110) return;
      p.last = now; p.ripples.push({ x, y, t0: now / 1000 });
      if (p.ripples.length > 12) p.ripples.shift();
      kick();
    };
    // Pointing at the picture drops a ripple at the water's edge below it; pointing at the water drops one there.
    picture.addEventListener("pointermove", e => { const r = canvas.getBoundingClientRect(); ripple(e.clientX - r.left, 3); });
    canvas.addEventListener("pointermove", e => { const r = canvas.getBoundingClientRect(); ripple(e.clientX - r.left, e.clientY - r.top); });
    painters.add(p); sceneIO.observe(canvas);
    const imgs = [...picture.querySelectorAll("img")];
    Promise.all(imgs.map(img => img.complete ? null : new Promise(res => { img.onload = img.onerror = res; }))).then(() => requestAnimationFrame(p.layout));
    if (!imgs.length) requestAnimationFrame(p.layout);
    return p;
  }

  window.Sky = { root, reduce, fine, clamp, smooth, letters, watchIn, smoothScroll, horizon, clickRipples, reflection, kick };
})();
