# Screening room on Porsche v2

## Correct baseline

This integration starts at `origin/main` commit `4b294a3` on branch `codex/screening-v2`.

Working checkout: `/Users/bryce/claude-hub/personal-projects/bryce-rambach-portfolio-screening-v2`.

The earlier screening implementation lived on `redesign/fog-forest` at `ffea153`. That checkout remains intact, but its acceptance wasn't evidence of compatibility with Porsche v2. This integration replaces that claim with the checks below.

Localhost port 3000 now serves this v2 checkout. The previous forest Vite process was stopped. Run `npm run dev -- --strictPort` from this directory for future reviews.

## Changes

- Quiet Idle overhead Porsche loader, with animated exhaust and a direct projects link.
- Six shared project presentations and ten archive entries, available through `/projects`, direct project URLs and the physical cabin laptop.
- AgentSky uses the selected screening presentation, with its film and illustrative interaction.
- The laptop preserves v2's optional introduction action and focused-control scrolling when resized. Project dialogs keep keyboard input away from the car and return focus to the selected cover.
- The short introduction now says “Before we go”, “Meet Bryce” and “Start the journey”. Its existing sequence remains intact.
- Current town scene, car model, driving, race, analytics, garage and developer review routes are retained. Car-scene and experience-mode source are unchanged from the baseline.

## Verified locally, 8 September 2026

- TypeScript check and production build passed. Vite still reports the large entrance chunk warning.
- All 325 tests across 69 files passed. Old folder assertions were updated for project dialogs. Explicit introduction-action and driving-key isolation checks cover the new laptop wrapper.
- `scripts/check-projects.mjs` passed against both the development server and the local production build: six presentations, their demos, direct routes, browser history, nested dialogs, focus restoration, image inspection, on-demand media, reduced motion and responsive layouts.
- `scripts/check-porsche-projects.mjs` passed on the real WebGL v2 scene: keyboard entry, short introduction, physical laptop, full-screen AgentSky, focus return, close laptop and mobile WebGL failure fallback. The test allows the entry pause and contact-card animation to settle before opening the laptop.
- The in-app browser visibly showed Quiet Idle followed by the current town and Porsche at localhost:3000.
- Visual evidence is in `output/projects/`. Source provenance is in `docs/screening-room-sources.md`.

## Not checked in this integration

No deployment, physical-phone run, authenticated garage review or complete outward-trip-and-return-race replay was performed. Those boundaries remain separate from the loader and showcase integration. Showcase demos and anonymised portal examples aren't evidence of current production outcomes.
