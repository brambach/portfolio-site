# Porsche quality and acceptance

Updated 6 September 2026. This is the current queue. [Earlier observations and experiments](porsche-quality-history-2026-09-06.md) remain preserved, including failures and superseded results.

## Scope and accepted behavior

Bryce completed the guided journey and called it incredible, then requested cleaner UI/materials, more noticeable optional stops, small personal interactions and a clearer finish. Preserve the approved town and handling. The current polish, radio and phone interaction still need review. The main engine sound was previously accepted; the newer steady redline layer needs listening feedback. Earlier permission blockers are resolved.

## Required work still open

| ID | Status | Current evidence and next action |
| --- | --- | --- |
| Q01 | UI/material review pending | Paper objects, tour footers and compact instrument controls are implemented. Desktop and 390/320-pixel browser checks are recorded in porsche-review.md. Preserve the approved town layout. Bryce still needs to review this pass. |
| Q02 | Driving measured; entry/object stalls open | Current direct first trip: 10,354 frames, 67.854 fps, max 33.8 ms, no intervals over 50 ms. A deferred line-buffer upload during entry is now warmed before entry; a fresh check had max 33.2 ms and no intervals over 50 ms. First-card GPU preparation now waits before the lift: one check recorded 192 ms preparation, then max 25 ms animation interval with no intervals over 50 ms. The promoted default also passed: 282 ms preparation, max 17.5 ms lift interval, then the complete tour reached the keys. Subjective response and weaker hardware still need review. Earlier isolation failures remain documented in porsche-review.md. See current-first-trip-complete-totals.json. Physical phones and weaker devices remain unverified. |
| B02 | Traffic edge cases open | Simulations cover merging, following traffic, normal/Turbo arrival and crawl parking. Low-speed staged contact allowed manual steering away and Cruise recovery. A faster staged oncoming encounter registered contact after a 97 km/h telemetry sample, then recovered to Cruise at 35 km/h without browser errors. [Evidence](../../.codex/review/fast-traffic-recovery.json). Exact impact frame/angle and natural manual cut-ins remain unverified. |
| Q03 | New audio listening pending | Main engine character was accepted. The steady high-RPM layer, original radio music and optional original phone ring need listening review. Music has an independent off switch. No spoken voice recording is present. |
| Q04 | Subjective discovery and physical touch open | Direct door, laptop, card and racket clicks pass at .85 effective density. Escape restores cabin focus. Keyboard and responsive reader checks pass. Physical-phone input and Bryce's final object/discovery review remain open. |
| Q05 | Navigable town first pass, review open | `/?town&profile=journey` starts before the café, connects café/courts/lake through the filtered map, and is now the ordinary homepage default; `?forest` retains the earlier start. Simulated arrivals, park, engine-off and resume pass. Browser café arrival/departure pass. The current production tennis invitation also leads to a verified parked arrival and engine-off state; see tennis-pull-in-production.jpg. A later production run also parked at tennis, switched off, restarted and returned to the forest with no console errors. The court sign/net obstruction is fixed and its corrected seat view is captured. Manual turnoffs, touch and final visual acceptance remain open. Updated town mount/unmount and context release pass; memory bytes remain unmeasured. |
| Q06 | Continuous lighting/audio acceptance open | Scenic daylight and fog progress along the route, and endpoint views were reviewed. The full moving atmosphere and engine sound still need subjective acceptance. |
| Q07 | Hardware boundary open | Available checks use this Mac and the in-app browser. Viewport overrides aren't physical-phone tests. Other browsers, weaker hardware and memory bytes remain unverified. |
| Q08 | Project evidence incomplete | AgentSky has a verified local concept, four screenshots and an explicit simulated-interaction disclosure. Trace has a verified public source link. Other projects need real screenshots, demos or deeper source evidence. No matching local project folders were found in the known personal-projects directory during the latest check. |
| B05 | Historical startup outliers open | Earlier loads took 48.4/52.1 seconds; subsequent loads were much faster. GPU/compilation markers didn't establish a cause. Investigate if reproduced in a controlled session; don't describe every startup as fixed. |
| B04 | Historical crash / long-session evidence open | An old city preview crashed. Later lifecycle checks and routes succeed, but long-session stability and retained GPU/process memory bytes aren't established. |
| Q09 | Final polish acceptance open | Bryce accepted the guided journey direction enthusiastically, then requested this polish pass. That praise does not establish acceptance of the subsequently changed materials, overlays or audio. |
| Q10 | Representative geometry review incomplete | Cabin objects and several angles have been inspected. Remaining close-up materials, clipping and reflection issues need a bounded representative audit under final lighting. |

## Verified fixes to preserve

| Item | Evidence |
| --- | --- |
| Canvas quality-change stalls | Fixed allocation replaces the scenic canvas-reallocation path. The matched candidate had a 34.3 ms maximum versus 166.7 ms in the original path. The promoted full route had no long quality-change callback. |
| Panorama dashed wrap line | Corrected texture derivatives at the longitude wrap. Matching and adjacent browser angles no longer show the strip. Glass, antenna and color-blend experiments weren't the fix and were reverted. |
| Low-density input and resize | Direct object clicks, portrait/landscape laptop alignment, scrolling and restored seat focus pass. The focus border stays on the scene boundary. |
| B01: tested resource cleanup | Current town mount reaches 339 geometries, 72 textures and 83 programs. After fixing line-object collection, unmount leaves zero geometries and canvases, two texture/six program counters and a lost context. Counters aren't memory-byte measurements. Earlier shader cancellation/retry checks pass. |
| B03: duplicate-Three warning | Not reproduced in recent fresh browser checks. Preserve production verification; this isn't a claim that every old reload path was diagnosed. |
| Reduced-motion arrival state | Phase changes now bypass the telemetry throttle. Fresh keyboard-selected tennis and lake arrivals show the correct destination without needing another input, and focus returns to the cabin. |
| Narrow parked controls | At 320 pixels, wrapped buttons retain an 8-pixel gap and 44-pixel height. Phone-width map and landscape keyboard navigation pass; physical touch remains unverified. |
| Driving invitation and content | Sticky-note invitation removed. Ignition and menu are available. AgentSky leads the laptop and lightweight reader; its study preserves the cabin when opened. |

## Current evidence index

- [Current full regression](../../.codex/review/current-regression-2026-09-06.log): 245 tests across 53 files pass after the traffic, parking, line-resource and held-pedal changes. TypeScript and production build pass.

- [Promoted full route](../../.codex/review/fixed-default-full-route.json) and [arrival](../../.codex/review/fixed-default-arrival.jpg).
- [Fixed-allocation candidate](../../.codex/review/fixed-viewport-short-drive.json) and [matched original renderer](../../.codex/review/fixed-viewport-matched-baseline.json).
- [Minimum-density cleanup](../../.codex/review/fixed-input-cleanup.json) and [narrow reader](../../.codex/review/fixed-input-narrow.jpg).
- [Corrected panorama](../../.codex/review/panorama-gradient-side.jpg) and [rejected far-bank shape](../../.codex/review/far-bank-rejected.jpg).
- Latest full regression: 240 tests across 52 files pass. TypeScript and production build pass. Reverted terrain experiment: 10 focused tests passed before rejection, then production was rebuilt with the original terrain.
- [Detailed verification record](../../src/prototype/VERIFICATION.md) and [preview guide](porsche-review.md).

No purchases, commits, pushes or deployments are authorized. Keep speculative imagery, unsupported project outcomes and unverified hardware claims out of the website.

Latest bounded traffic check: 26 tests in three driving/traffic suites and TypeScript pass. Browser review used development-only `?drivingReview&trafficReview=head-on&profile=journey`; the oncoming car was deliberately staged in the player lane. [Cruise recovery screenshot](../../.codex/review/head-on-cruise-recovery.jpg). This does not establish every collision, physical touch or audio behavior.

Town first-pass evidence and limitations: [milestone](porsche-town-milestone.md). Full suite: 242 tests across 53 files. Subsequent static-prop batching and pavement-rock exclusion: four focused tests, TypeScript and production build pass. Batched production performance and lifecycle checks remain open.

Latest town check: [corrected court](../../.codex/review/town-tennis-corrected.jpg), [forest return](../../.codex/review/town-forest-return.jpg). Eighteen route tests, TypeScript and production build pass after the court correction. Production diagnostics are disabled; this flow check provides no sustained frame-time result.

Town architecture pass: pitched roofs, porch depth and local surface maps are implemented. A 4,320-frame town-to-tennis run averaged 61.52 fps at density 1.35, maximum interval 41.7 ms, no intervals over 50 ms. This is local partial-route evidence. [Measurements](../../.codex/review/town-architecture-route.json), [cleanup](../../.codex/review/town-architecture-cleanup.json). Visual acceptance and other hardware remain open.

Café/clubhouse now share the street palette; café counter/sign visibility, supported seating and court boundary mesh are reviewed in the browser. [Café](../../.codex/review/town-cafe-materials.jpg), [clubhouse](../../.codex/review/town-clubhouse-materials.jpg). Preliminary town-layout feedback is pending. Don't infer approval or completion from silence.

After the café/clubhouse integration, the full regression suite passes 242 tests across 53 files. TypeScript and production build also pass.

Responsive town evidence: [320-pixel controls](../../.codex/review/town-controls-320.jpg), [landscape map](../../.codex/review/town-map-landscape.jpg). Ten town/scenic tests and TypeScript pass after the arrival telemetry fix. Continue to lake now names the primary continuation explicitly; tennis remains optional through the map.

Traffic silhouette update: sloped screens, narrower roof, wheel arches and small trim/hubs. Eighteen driving/traffic tests and build pass; controller behavior is unchanged. [Front view](../../.codex/review/traffic-body-front.jpg), [bounds](../../.codex/review/traffic-body-bounds.json). Next visual priority is measured parking clearance and street context at the café/courts, based on supervision's still-image concern.

Parking composition: café/courts now stop about 10 m earlier on their loops, with bay markings and more street context. Conservative body-envelope measurements show about 1 m clearance from paving; no forecourt body overlap was established. [Café](../../.codex/review/town-cafe-offset.jpg), [courts](../../.codex/review/town-tennis-offset.jpg), [bay](../../.codex/review/town-parking-bay.jpg). Ten route tests and TypeScript pass. A fresh moving café-to-tennis-to-lake browser journey also completed with correct arrival labels. Its concurrent user preview prevents a clean performance claim.

Updated town cleanup: fixed resource collection skipping court net/fence Line objects. Four resource tests, TypeScript and build pass. Browser unmount leaves zero geometries and canvases, two texture/six program counters and a lost context, without browser errors. [Evidence](../../.codex/review/town-current-cleanup.json). Memory bytes and long-session hardware stability remain unverified.

Held controls: fixed missing release when a menu removes the pedal buttons. A failing component test reproduced the missing release before the fix. Sixteen control/entrance tests, TypeScript and build pass. Held input survives telemetry renders and releases on unmount. Physical multi-touch remains unverified.

Café arrival-facing wall now has a closed entrance with frame, glazing and handle. [Parked view](../../.codex/review/town-cafe-side-entrance.jpg). TypeScript, build and browser appearance/error check pass. This static detail follows the 245-test full-suite run; town visual acceptance remains pending.

Town composition: replaced blanket stop-area building gaps with access-road clearance checks, restoring 12 sites for 49 street buildings. A separate half-metre road sampling test verifies at least 1 m of clearance to their building/paving envelopes. Rear windows address the walls exposed from the café loop. [View](../../.codex/review/town-infill-cafe-view.jpg), [sites](../../.codex/review/town-infill-sites.json). Two layout tests, TypeScript and build pass. Material batching remains at seven town meshes. Updated sustained performance and moving visual review remain open.

The moving café-to-tennis leg now passes after infill, with main-street and court-arrival views saved and no browser errors. [Default café view](../../.codex/review/town-infill-cafe-default-view.jpg) shows the unchanged automatic framing. The earlier infill café image was manually turned toward the street; it wasn't the arrival composition. [Moving street](../../.codex/review/town-infill-main-street.jpg), [tennis arrival](../../.codex/review/town-infill-tennis-arrival.jpg). Clean performance, physical-device checks and subjective approval remain open.

Manual town junctions: the scenic manual-entry test now covers café, tennis and lake using each current access road. All enter and rejoin the main road under simulated steering/pedal input, remain in manual mode and stay below 0.3 m displacement per 1/60-second step. Twelve scenic/town tests pass. [Output](../../.codex/review/town-manual-junctions.log). This isolates road continuity without traffic; natural manual browser turnoffs and physical touch remain open. The saved user preview was rechecked and still has its engine running at 900 RPM, so a concurrent test still wouldn't establish clean sustained performance.


## Final polish pass, 7 September 2026

Implemented a loading overlay tied to scene readiness, a visible Get in button, and a short repeat-visit fade with reduced-motion support. Added Race times in the menu, the actual time to beat at the lake, a top-five finish board with the entrant's rank, and locally saved results that can be reopened. Leaderboard failures have retry controls. Three spaced honks trigger one short passenger joke; the radio has small personal copy. The phone trigger now has a wider route window when cabin interaction delays it.

Finished-result views block ignition/rev shortcuts and hide the underlying ignition control. Existing editable-field shortcut protection remains. Driving physics and the route weren't changed in this pass.

Validation: 289 tests across 63 files pass, TypeScript passes, and production builds. The existing large-bundle warning remains. Browser review confirmed the reduced-motion cabin tour reaches the lake, which displays the real shared score `bryce :) / 0:41.106`. Race times loads the same score, closes with Escape, and is centered at a 390-pixel viewport. Evidence: `.codex/review/final-polish-leaderboard-mobile.jpg`. The normal motion preference was restored after testing. User-owned race tabs weren't reloaded.

Remaining acceptance: Bryce's review of the opening, revised audio balance and small jokes; a physical phone check; and a clean sustained performance run without concurrent scene tabs. This pass doesn't establish new frame-time results or stronger race anti-cheat. Shared Redis works locally, but the site hasn't been deployed or linked to a Vercel project. The existing live portfolio belongs to another repository. The original 41.106-second result remains on the shared board.
