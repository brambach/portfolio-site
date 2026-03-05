# Portfolio Redesign Plan

## Vision
Transform the portfolio from a clean-but-safe glassmorphism site into a cinematic, interactive experience that creates a genuine "wow" moment. Dark theme, dramatic animations, scroll-driven storytelling, and magnetic interactions.

## Stack
No changes needed. React + Vite + Tailwind v4 + Motion + TypeScript handles everything. Custom hooks for mouse tracking and text effects — no extra dependencies.

If scroll-pinning gets complex, we may add GSAP + ScrollTrigger as a targeted addition.

---

## Phase 1 — Foundation & Vibe Shift
> Goal: Make the site feel completely different in one pass.

- [ ] **Dark theme rebrand**
  - Near-black background (#0A0A0B or similar)
  - Light text (white/neutral-300 for body, white for headings)
  - Replace all glassmorphism cards with dark glass (white/5 borders, dark fills)
  - Update selection colors, scrollbar, etc.
- [ ] **Noise/grain texture overlay**
  - SVG noise filter as a fixed overlay with low opacity
  - Adds analog warmth and texture
- [ ] **Animated gradient mesh background**
  - Replace static blobs with slowly morphing gradient orbs
  - Richer colors: deep blues, purples, teals on dark background
  - Subtle mouse-position reactivity (optional, can defer to Phase 3)
- [ ] **Typography refresh**
  - Increase contrast and drama — larger hero text, bolder weights
  - Consider a display font for the hero (or just lean harder into Inter's weight range)
- [ ] **Update Navbar for dark theme**
  - Dark glass effect on scroll
  - Adjust link colors and hover states

---

## Phase 2 — Motion & Scroll
> Goal: Make scrolling through the site feel like an experience, not just reading.

- [ ] **Cinematic hero intro**
  - "Bryce Rambach" animates letter-by-letter with spring physics
  - Tagline types itself in or fades word-by-word
  - Status badge fades in last with a subtle scale
  - Entire sequence ~2s, feels intentional not slow
- [ ] **Scroll-driven section animations**
  - Sections use `useScroll` + `useTransform` for parallax
  - Text reveals word-by-word or line-by-line on scroll
  - Cards stagger in from alternating sides
  - Subtle scale/opacity transforms tied to scroll position
- [ ] **Marquee skill ticker**
  - Replace static skill grid with infinite horizontal scrolling rows
  - Multiple rows scrolling at different speeds/directions
  - CSS animation (performant, no JS needed)
- [ ] **Horizontal scroll portfolio**
  - Portfolio section pins to viewport
  - Cards scroll horizontally as user scrolls vertically
  - Each card is larger, more detailed, takes up ~80% viewport width
  - Progress indicator showing which project you're on

---

## Phase 3 — Interaction & Polish
> Goal: Add the details that make people want to show the site to others.

- [ ] **Custom cursor**
  - Small dot (8px) + larger following circle (40px) with spring physics
  - Circle morphs on hover: grows on buttons, shrinks on text, blends on cards
  - Hide on mobile (touch devices)
- [ ] **Magnetic buttons & nav links**
  - Interactive elements pull toward cursor within ~50px radius
  - Smooth spring-based return to original position
  - Apply to: nav links, CTA buttons, social links
- [ ] **3D tilt on portfolio cards**
  - Cards rotate on X/Y axis based on mouse position
  - Subtle glare/reflection effect that follows the tilt
  - Smooth spring transitions
- [ ] **Text scramble on section headings**
  - Section headings ("About", "Skills", etc.) scramble through random characters before resolving
  - Triggered on scroll-into-view
  - Characters cycle through symbols/letters before landing
- [ ] **Final polish**
  - Page load transition (fade from black)
  - Smooth scroll behavior tuning
  - Performance audit (will-change, GPU layers, reduce repaints)
  - Mobile responsiveness pass (disable heavy effects on mobile)
  - Accessibility pass (prefers-reduced-motion support)

---

## Notes
- Each phase leaves the site in a deployable state
- Review after each phase before moving to the next
- Mobile: disable cursor effects, reduce particle counts, simplify scroll animations
- Always respect `prefers-reduced-motion` — provide graceful fallbacks
