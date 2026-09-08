# Screening-room acceptance audit

Scope: the local portfolio presentation requested in the active goal. It doesn't include deployment or fresh production verification of the featured products.

| Requirement | Evidence |
| --- | --- |
| Preserve the accepted entrance | QuietIdleLoader and car-scene implementation retained. The real-scene browser journey loads the Porsche, enters it and uses the physical laptop. Existing scene, motion and audio tests pass. |
| Replace the four text folders | ProjectLaptop now renders the shared six-cover ProjectCollection. The real laptop screenshot is `output/projects/physical-laptop.png`. |
| Full-screen showcase and return | ProjectViewer is a native dialog portalled to document.body. Browser checks verify its parent, Escape handling, restored cover focus and the visible physical collection after closing. |
| Six individual presentations | AgentSky film and sample workspace; Dervo evidence/decision sequence; Lucid mapping/scope interaction; Arro Today/week/milestone; Port hold/collapse; anonymised portal mapping/testing/live journey. All six routes and demonstrations are exercised in `check-projects.mjs`. |
| Project contribution, stage and story | Each study has visible authorship, prototype or employment status, design/engineering explanation and demonstration boundaries. |
| Secondary archive | Ten source-labelled entries, two on-demand historical films, separate unrecovered Unity/OTP leads. Research coauthors retained. |
| Source verification and privacy | `screening-room-sources.md` records original paths, inspected fixture sources, captures, adaptations and limitations. Portal captures use the source's anonymised mode and fictional cast. No live customer export or integration action is included. |
| Direct access without 3D | `/projects` and all six `/projects/:id` routes load the same content through ProjectReader. Lazy route selection in main.tsx avoids requiring entrance loading. Browser back/forward and next-project navigation are checked. |
| Desktop and mobile | Browser layout checks at 320, 390, 768 and 1440 pixels. The four new demonstrations are exercised at both desktop and mobile widths. Desktop and mobile screenshot review recorded in `output/projects/`. |
| Navigation and keyboard | Native dialog focus containment, nested Escape, image/film return focus, project return focus, next-project routing and cabin shortcut isolation checked. Mobile model-failure fallback remains usable. |
| Reduced motion and media | Port skips timed compression with reduced motion. AgentSky sample timing respects the preference. Cover motion is disabled. Films mount only after a watch action; Port sound is opt-in. Close cleanup pauses media and restores focus. |
| Local validation | TypeScript, 97 tests across 23 files, Vite production build and the browser verification scripts. The existing Three.js chunk-size warning remains documented. |
| Reviewable local delivery | Main preview: `http://localhost:3000/projects`. Source, screenshots, scripts and build output remain in the workspace. Nothing was deployed or sent externally. |

## Limits

Browser checks use Chromium, with viewport emulation for mobile and the Metal renderer for the real Porsche scene. A physical phone, Safari and native iOS builds weren't tested. The product demonstrations are scoped in their visible copy: prototype fixtures, independent concepts, historical recordings and fictional redrawn employee work. They aren't claims of current production operation.

Final results: TypeScript passed; all 97 tests passed; production build passed; the six-project browser suite passed against both the development server and the built preview. The real Porsche journey passed, including pressing the car's K shortcut inside a project without activating it. A separate built-preview check confirmed that background controls can't take focus through the modal, forward/backward keyboard navigation doesn't enter the background page, and the direct project route requests no car model.
