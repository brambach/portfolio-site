# Screening-room implementation

Local review build, 8 September 2026. Nothing has been deployed.

## Delivered

The physical Porsche laptop, fallback object dialog and standalone `/projects` route share a six-project collection. Each cover opens a full-screen native dialog outside the transformed laptop screen. Closing restores the selected project. Direct project URLs, browser history and next-project navigation are supported.

- **AgentSky:** the selected screening-room treatment, original concept film, chapter navigation and illustrative agent/workspace/output interaction.
- **Dervo:** three original design-experiment captures, evidence inspection and a sample baseline decision with a visible resulting state.
- **Lucid:** a request → mapping → scope sequence, selectable field reasoning, a local field-hold interaction and original specification captures.
- **Arro:** captured Today and weekly Trail designs, a separate typographic milestone and a sample cheer interaction.
- **Port:** a distinct dark presentation with hold/cancel, source-timed compression and contraction, opt-in original sound and an accessible keyboard alternative.
- **Integration portal:** an anonymised fictional mapping → testing → live journey, plus the existing redrawn specialist, client and monitoring screens.

Ten additional archive entries distinguish source, concepts and recovered recordings. DevMetrics and Crypto Command Center have on-demand historical films. Unrecovered Unity and OTP workspace names remain separate from completed work.

## Verification

`npm run lint`, `npm test` and `npm run build` are the local code gates. The suite has 97 tests across 23 files. The Vite build retains the existing warning about the large Three.js entrance chunk; project routes load independently of that entrance.

`scripts/check-projects.mjs` checks six direct routes, desktop and mobile demonstrations, nested dialogs, image inspection, focus restoration, browser history, next-project navigation, on-demand film loading, archive film cleanup, Port hold/cancel, reduced motion and layouts at 320, 390, 768 and 1440 pixels.

`scripts/check-porsche-projects.mjs` uses the real WebGL scene. It checks keyboard entry, a pointer selection on the physical laptop, the full-screen project and return, closing the laptop, and a mobile fallback journey when model requests fail. On this Mac the headless browser needs its Metal renderer for a responsive real-scene run.

Screenshots and the latest build log are in `output/projects/`. Source provenance, adaptation boundaries and capture details are in `screening-room-sources.md`.

## Review boundaries

This verifies the local portfolio experience. It doesn't establish current production operation of the projects shown, execute external agents or integrations, verify a native iPhone build, or test on a physical phone. Viewport and browser tests are local Chromium checks. Sample interactions and fictional data are labelled in each study. The original quiet-idle loader, Porsche scene and scene attribution remain in place.
