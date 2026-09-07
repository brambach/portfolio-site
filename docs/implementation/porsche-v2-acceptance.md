# Porsche v2 acceptance audit

7 September 2026. Application deployed through c1cc2c8; later commits record verification. This audit does not mark the goal complete.

| Requirement | Evidence and boundary | Status |
| --- | --- | --- |
| Preserve handling, sound and route | V2 kept driving constants and audio assets; actual outward trip and two manual finishes completed. Focus guard changes only parking focus. Audio stayed muted in these new runs. | Preserved; subjective audio acceptance relies on Bryce's earlier approval |
| Desktop loading and sustained performance | Local ready 3.204 s; full outward 9,255 frames over 152.6 s, mean 60.66 FPS, four frames above 50 ms. Environment and sampling limits in milestone plan. | Measured locally |
| Representative phone loading and touch | 390px layouts reviewed, but desktop GPU is not a phone. Phone/browser feedback requested, no reply yet. | Not verified |
| Smaller initial payload | GLB views byte-verified; production compressed bytes fell 10.2%; no controlled loading-time improvement claimed. | Verified |
| Short mandatory introduction and pacing | Normal-origin first trip completed one card, ignition, autopilot, mandatory the lake and laptop. Racket/project depth remains accessible at stops/menu. | Functional path verified; Bryce's pacing review pending |
| Return state and reset | Memory tests cover onboarding, discoveries, coffee, corrupt/blocked storage and reset isolation. Real return shortcut and post-finish retry reached countdown with zero speed and first gear. | Verified within documented scope |
| Personal best and finish | Actual 58.215 s then 56.751 s correctly produced a new local best. Retry, SVG download and clipboard exercised. Server target and next-place lookup tested. No QA score posted. | Verified |
| AI attribution and competition limits | Public board labels Astra exhibition. Server checks and plausible-time fabrication limit assessed in plan. | Verified; casual competition only |
| Featured project evidence | Original AgentSky README and implementation support before/after decisions and Bryce's role. Revised study keeps simulated-work labels and concrete screenshots. | Source and rendered introduction verified |
| Personal world reactions | Coffee order and the lake return change existing short lines based on stored actions; no invented biography. | Implemented; subjective review pending |
| Garage outcomes and privacy | Bounded event names, per-session dedup, source buckets, expiry and clear definitions. Production anonymous request returns 401. Server auth and event tests pass. | Technical checks pass; authenticated owner review pending |
| Accessibility and fallback | Actual graphics-loss fallback and retry reload; reduced-motion intro previously tested; real finish retains heading focus after parking fix. | Tested paths pass; physical touch and final user review pending |
| Cleanup | Cancellation and remount tested in browser; RAF/listener/audio disposal inspected. Context lost and canvas removed. Some renderer counters persist after disposal, so no zero-heap claim. | Bounded checks documented; not a memory-byte audit |
| Regression and build | Final 325 tests across 69 files, TypeScript and production build pass. Large scene chunk warning documented. | Passed |
| Bryce's completed-v2 review | Phone and desktop/garage questions are pending. No answer inferred from elapsed time. | Required before completion |

The pending phone, authenticated-owner and subjective reviews are the current acceptance dependency. Don't invent more scenery or mechanics to fill that wait. Address any resulting issues when Bryce responds. Cold browser/network measurements remain a useful follow-up; current network evidence is curl transfer plus local scene profiling, not a controlled cold-browser benchmark.
