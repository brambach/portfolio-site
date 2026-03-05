# Creative Overhaul — Phased Plan

## The Problem
Every section uses the same 4/8 grid, same glass card, same padding. The interactions (cursor, magnetic, tilt, scramble) are strong but the visual design is generic. Goal: agency-quality experience with rhythm, variety, and wow factor.

## What We're Keeping
- All interaction components (CustomCursor, Magnetic, TextScramble, ScrollReveal/Parallax)
- Dark theme, Inter font, Motion library
- Portfolio horizontal scroll mechanism
- All reduced-motion / accessibility handling

---

## Phase 1 — Foundation & Hero
> Highest visual impact. Sets the tone for everything else.

### index.css
- [ ] Add `.text-gradient` utility (white→gray gradient text)
- [ ] Add `.text-gradient-accent` utility (blue→purple→emerald gradient text)
- [ ] Add `.animate-orbit` keyframe + `.animate-spin-slow` (30s rotation)
- [ ] Add `.animate-float` keyframe (gentle up/down bob)
- [ ] Add all new animations to the `prefers-reduced-motion` block

### App.tsx
- [ ] Remove global `<main className="max-w-6xl mx-auto...">` wrapper
- [ ] Each section will own its own width constraints
- [ ] Add inline `DotGrid` component — SVG dot pattern behind Hero, fades on scroll
- [ ] Add inline `SectionDivider` component — animated gradient line

### Hero.tsx
- [ ] Two-column grid on desktop (`lg:grid-cols-2`), wider container (`max-w-7xl`)
- [ ] Name: `text-7xl md:text-9xl` with `.text-gradient`
- [ ] Tagline: word "systems" gets `.text-gradient-accent` (first color moment)
- [ ] New `OrbitalSystem` inline component (~50 lines):
  - 3 concentric SVG circle rings
  - 3-4 colored orbiting dots on CSS animation
  - One larger dot with glow
  - Fades in during name animation
- [ ] Hidden on mobile (`hidden lg:flex`)
- [ ] Increase to `min-h-screen`

### Checkpoint
Run `npm run dev`. The Hero should feel dramatically different — gradient text, orbital visual, dot grid fading on scroll. Rest of site may look slightly off (sections lost their wrapper) but should still function.

---

## Phase 2 — About & Contact (the bookends)
> These frame the middle of the site. Both get completely new layouts.

### About.tsx
- [ ] Remove 4/8 grid entirely
- [ ] `py-32 md:py-48`, `max-w-6xl mx-auto` internal
- [ ] No `border-t` — clean whitespace transition from Hero
- [ ] Block 1: `text-3xl md:text-5xl font-light text-white/90` — big statement
- [ ] Block 2: `border-l-2 border-white/10 pl-8 ml-auto max-w-2xl` — right-aligned
- [ ] Block 3: closing line with "the city" in `.text-gradient-accent`
- [ ] Each block in `<ScrollReveal>` with alternating `slideFrom`

### Contact.tsx
- [ ] Remove glass card entirely
- [ ] Full-bleed: `py-40 md:py-56`, centered text
- [ ] Large gradient circle behind text (decorative blur)
- [ ] Heading: `text-5xl md:text-7xl lg:text-8xl`, "together" in `.text-gradient-accent`
- [ ] Primary CTA: gradient button (`from-blue-500 to-purple-500`) with glow hover
- [ ] Decorative horizontal lines extending from viewport edges

### Checkpoint
About should feel typographic and expansive. Contact should feel like a dramatic finale. The contrast between these and the unchanged middle sections will be stark — that's fine, it confirms the approach is working.

---

## Phase 3 — Skills & Work (the middle)
> These create the rhythm between the bookends.

### Skills.tsx
- [ ] `py-16 md:py-24` (tight — contrast with large About above)
- [ ] Centered header instead of 4/8 grid
- [ ] Add stats row: 3 big numbers ("15+", "6", "3+") with labels
- [ ] Thin SVG circuit line between stats and marquee
- [ ] Marquee goes full-bleed (edge-to-edge)

### Work.tsx
- [ ] `py-32 md:py-40`, `max-w-5xl mx-auto` (narrower than other sections)
- [ ] Centered header
- [ ] Vertical timeline line (gradient, center of page on desktop)
- [ ] Cards alternate left/right with timeline dots
- [ ] Card 1: glass card with `border-t-2 border-blue-500/30`
- [ ] Card 2: no card, just `border-l-2 border-purple-500/30 pl-6`
- [ ] Mobile: timeline on left edge, cards stack normally

### Checkpoint
The full page rhythm should now be: dramatic → expansive → tight → pause → intimate → interactive → grand finale → quiet. Each section feels distinct.

---

## Phase 4 — Portfolio Polish & Cleanup
> Enhance what's already working. Final touches.

### Portfolio.tsx
- [ ] Ghost numbers in each card (`text-7xl font-black text-white/[0.03]`)
- [ ] Colored accent line at top of each card (per-project gradient)
- [ ] Small colored dot before each tagline
- [ ] Stagger card heights (alternate `mt-0` / `mt-8`)
- [ ] Progress indicator: add fraction counter from scrollYProgress

### Footer.tsx
- [ ] Gradient top border (`from-transparent via-white/10 to-transparent`)
- [ ] Add "BR." logo mark
- [ ] Increase to `py-16`

### Cleanup
- [ ] Delete `FadeIn.tsx` (unused)
- [ ] Final mobile responsiveness pass
- [ ] Performance check (no layout shifts, no overflow-x)
- [ ] Test `prefers-reduced-motion`

---

## Session Guide

| Phase | Start a new session with... |
|-------|---------------------------|
| 1 | "Read CREATIVE_OVERHAUL.md and execute Phase 1" |
| 2 | "Read CREATIVE_OVERHAUL.md and execute Phase 2" |
| 3 | "Read CREATIVE_OVERHAUL.md and execute Phase 3" |
| 4 | "Read CREATIVE_OVERHAUL.md and execute Phase 4" |

Review the site after each phase before moving on. Adjust the plan if needed.
