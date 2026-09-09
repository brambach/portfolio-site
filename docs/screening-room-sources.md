# Screening-room source ledger

Inspected and captured locally on 8 September 2026. These are portfolio demonstrations, not current production acceptance claims.

## AgentSky

`public/project-lab/` contains the original concept's sky, interface captures and 33-second WebM recording. Source: `../agentsky-concept/qa/` and its public sky image. The accepted screening treatment and illustrative interaction are shared with the original project lab. See `project-presentation-prototypes.md` for the earlier provenance record. No agent services are called.

## Dervo

Three unchanged PNG captures from `../dervo-fable-experiment/dervo/design-experiment/app-v3/shots/`:

- `state-6-decision-1440.png` → `public/projects/dervo/decision.png`
- `evidence-panel-1440.png` → `public/projects/dervo/evidence.png`
- `state-8-revised-1440.png` → `public/projects/dervo/settled.png`

Inspected the images and `src/dervo/state/scenario.ts`, which defines eight fixture states, sample receipts and the baseline decision. The portfolio's accept button selects the captured settled state. It doesn't alter a repository. Names, model labels, claims and test counts in the images belong to that scenario.

The source README records MIT adaptations from Beautiful UI, Twenty UI and Motion Primitives, plus prototype-only AGPL transcriptions from Twenty and Midday. No implementation from that experiment was transplanted. The visible study credits the references and labels the captures as a design experiment.

## Arro

Source: `../arro/design/Arro.dc.html`, `Arro-Spec.html`, and the React Native source under `../arro/src/`. The public Today and weekly Trail frames use fictional names and initials, recaptured from a sanitised local copy of the original design. Personal names and location text were replaced before capture. The original personal captures are no longer in the served public directory. Frames are indices 13 and 14 among the 390×844 phone frames. Missing external `image-slot` support was replaced only for circle slots with the source placeholder's initial, matching the native source's documented initial-avatar fallback. No photos were fabricated.

The portfolio milestone is a new typographic interpretation of the source's 30-day milestone idea. Its cheer is a local toggle. It is labelled as an interpretation, not a captured native screen. Fixture data is used throughout. The app's source explicitly lacks backend and Strava connections.

## Lucid

Source: `../lucid/app/preview/spec/page.tsx`, `components/spec/SpecViewer.tsx`, and the preview layout. Captured `/preview/spec` on a local preview-only server, with browser API requests blocked. The initial Turbopack server entered an HMR error loop; a webpack preview server rendered the same fixture successfully. No app source was changed.

`public/projects/lucid/spec.png` shows the specification opening. `mapping.png` shows the five field mappings and risk flag. The sample maps the finance system to the HR system. The portfolio's brief and field-review sequence uses this same direction, mappings and confidence categories. Holding the inferred field is a new illustrative portfolio interaction. Fixture confidence labels aren't independent verification of vendor APIs. No credential, database or integration action was performed.

## Integration portal

Source: `../studio-site/src/content/case-study.ts` and `src/components/work/frames.tsx`. The source remains in `anonymised` mode. Captured the three redrawn surfaces on `/work`, after their reveal animations completed: Today, client hub and monitoring. These use the fictional cast Halden Logistics, Orrin Health, Tamsin & Co, Redgate Foods, Priya and Mark Ellis.

The portfolio adds a deliberately simplified fictional mapping → testing → live sequence. It runs only in React state. It doesn't depict a real release or send any action to the employer's systems. No real screenshots, vendor logos or current production counts were exported. The role and employer ownership boundary remain explicit.

## Port

Source timing comes from `../archive/port/Port/PortOpenView.swift`, `CollapseView.swift` and `PortClosedView.swift`. The original `Port/Sounds/port-close.wav` is copied unchanged. The browser interpretation follows the one-second hold, 830ms compression, sound at 380ms, 16ms line settle, 420ms contraction and 400ms pause. Keyboard activation and reduced motion can skip the timed hold/animation. Native haptics, widget persistence and device behavior aren't claimed as browser features.

## Archive films

Sources in `../archive/bryce-digital-demos/`:

- `cryptoDashboardDemo.mp4` → `public/projects/archive/crypto.mp4`
- `devMetricsDemo.mov` → `public/projects/archive/devmetrics.mp4`

Encoded locally as 1280-pixel-wide H.264 at 30fps, CRF 25, with fast-start metadata and no audio. Still previews are extracted at eight seconds. Sampled the recordings at eight and eighteen seconds to review their displayed content. Their historical figures and interface states aren't presented as current. The Crypto clip is dark in the original recording; the portfolio doesn't alter its interface or invent a brighter live product.

The archive's other entries are grounded in `project-discovery-deep.md`. The research report preserves Brian Ly and Kien Tu as coauthors. Unrecovered workspace names remain separate from built work.
