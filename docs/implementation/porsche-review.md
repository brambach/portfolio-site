# Porsche preview review

## Guided journey update

Updated 6 September 2026. Active. This update implements Bryce's guided-journey feedback; it isn't whole-site acceptance.

The latest direction supersedes the earlier optional-first-stop flow: a short mandatory cabin introduction, then driving, then a mandatory lake-inspired lake turnout with Bryce's family connection and clear project access. Keep text brief and the jokes occasional. Bryce wants pacing and personal discoveries, not long descriptions. Coffee and tennis remain optional destinations. The lake ends the first trip; continuing around the road is an explicit choice afterward.

Implemented: welcome, contact card, racket, photo board and physical project laptop before unlocking ignition; direct town-to-lake cruise at an 18 m/s ceiling (157 seconds in simulation); first-approach assistance that preserves braking and pause/resume; lake copy and both laptop and full-portfolio links; two small sign jokes. The recorded acceleration bed now fades into a steady recorded spectrum near redline. Lower-rev tuning and engine/drivetrain ratios are preserved.

Current verification: 269 tests across 58 files passed before promoting the town route to the plain homepage. The 22 route-selection, Entrance and town-drive tests pass afterward, along with TypeScript and production build. Current direct-trip driving evidence records 67.854 fps with no intervals over 50 ms on the available M4 Mac. First-card preparation now waits before lifting; a default check recorded max 17.5 ms motion interval after a 282 ms preparation. Final visual/audio review and physical-device evidence remain open. No purchases, commits, pushes or deployments.

Earlier benchmark/listening permission blockers are resolved. Don't re-open them or call the goal blocked on those old questions. Preserve the accepted town layout and driving feel.


[Open the town preview](http://localhost:3003/?town). The direction connects a neighbourhood café and optional tennis club to the forest and lake, viewed from the car. Bryce's “Love it!” is recorded as approval of this town direction. The ordinary URL now starts this complete town journey. The older forest start remains available at `?forest`. The city and older multi-stop experiments remain available separately.

Bryce confirmed that driving feels good. Steering, acceleration, gears, Cruise, Turbo and pull-over tuning are unchanged. C holds speed while you steer, Q/E changes gear, H honks, and Space pulls over. Gas or brake releases speed hold. Steering, gas or brake takes control from Turbo.

## What changed

The town has a café and tennis courts with a clubhouse. Clearance checks replaced broad gaps in the building row, restoring 12 sites for 49 street buildings. The route map connects both stops to Lakeside. Café and court parking occurs earlier along the access lane, with painted bays and a view that includes the road. Continue to lake names the next destination explicitly. A complete café, tennis and lake journey passed before infill; the café-to-tennis moving leg also passed after infill, with no browser warnings or errors.

The laptop remains on the passenger seat and is the fourth guided-tour object. Escape returns focus to the cabin. The ignition unlocks after the tour; direct portfolio access remains available.

A generated alpine panorama now gives the distant ridges more detail. The nearby shoreline and water remain rendered geometry. Their latest material pass replaces pale turquoise and the broad brown strip with slate-blue water and cooler granite sand.

Young firs and low grass now fill part of the roadside bank using existing assets and bounded rendering. The attempted wholesale mature-tree replacement was rejected because its high foliage left too much bare trunk beside the cabin.

AgentSky now leads the laptop and [lightweight project reader](http://localhost:3001/projects). Its [design study](http://localhost:3001/projects/agentsky) has four current screenshots and clearly labels simulated interactions. Opening the full study from the physical laptop keeps the cabin page in place. The Trace note links to its verified public source.

The scenic route now keeps its canvas allocation fixed when adaptive quality changes. Low-density object clicks, reader alignment, viewport resizing and context disposal were checked before enabling it. This removes the measured reallocation mechanism; it doesn't establish consistent 60 fps.

## Current evidence

Hardware rechecked on 6 September: Apple M4, 16 GiB memory, macOS 26.5.2. Browser checks use the Codex in-app browser. This confirms the earlier M4/16 GiB record; it doesn't add evidence for phones or weaker laptops.

An earlier forest-only route reached Lakeside at **69.7 fps across 9,360 measured driving frames**, with a **42.9 ms maximum** and no intervals above 50 ms. A quality change reduced effective density from 1.35 to 1.2 without a recorded long render callback. The 1280 x 720 run was muted. This predates the town and latest traffic geometry. [Raw measurement](/Users/bryce/.codex/worktrees/abf6/bryce-rambach-portfolio/.codex/review/fixed-default-full-route.json).

The latest café-to-tennis-to-lake benchmark ran with both saved preview engines verified off before and after. It completed all three stops without browser errors. Across 21,120 retained driving frames, the weighted average was 80.8 fps, the lowest window was 52.2 fps, and 27 intervals exceeded 50 ms, with a 333.2 ms maximum. Effective pixel density fell to .85 and ended at 1.05. The profiler keeps 60 windows, so the saved stop snapshots don't retain every intervening window; this isn't a complete-route average. [Raw capture](/Users/bryce/.codex/worktrees/abf6/bryce-rambach-portfolio/.codex/review/approved-town-single-active-run.json). The run was muted and used development instrumentation on the M4/16 GiB machine at 1280 × 720. Hitches remain an open issue.

Prior sessions measured lower averages, including 45–54 fps. This clean run doesn't establish consistent performance on all sessions or devices. The old canvas-reallocation path produced directly attributed stalls; the scenic default now avoids that mechanism.

Bryce's latest feedback is “driving feels good.” Preserve the current driving controls and tuning. Town layout and representative visual acceptance are the current review priorities.

The latest cleanup pass fixed resource collection skipping court net and fence lines. Browser unmount released the context and left zero canvases and geometry counters. Two texture and six program counters remained after disposal. This doesn't measure memory bytes. [Cleanup evidence](/Users/bryce/.codex/worktrees/abf6/bryce-rambach-portfolio/.codex/review/town-current-cleanup.json).

The earlier town regression run passed **249 tests across 54 files**, including the current town infill, manual junctions, parking, resource cleanup and held-pedal checks. [Full-suite output](/Users/bryce/.codex/worktrees/abf6/bryce-rambach-portfolio/.codex/review/approved-town-regression.log). TypeScript and the latest production build pass. The build still warns about the large Entrance bundle.

The faster staged traffic encounter registered contact after a 97 km/h telemetry sample, then returned to the lane under Cruise at 35 km/h. That check didn't capture the exact impact frame or angle. [Recovery evidence](/Users/bryce/.codex/worktrees/abf6/bryce-rambach-portfolio/.codex/review/fast-traffic-recovery.json).

## Review route

1. Enter the Porsche and follow the contact card, racket, photo board and laptop tour. The keys unlock afterward; the quiet project reader remains available directly.
2. Before ignition, the café invitation offers Pull in or Keep going. Coffee and tennis are optional. Their moving invitations disappear before braking and alignment room runs out.
3. Drive manually, use Cruise or Turbo, or hold a steady speed. The first lake approach guides the car into its turnout while retaining braking and pause/resume.
4. At the lake, read the brief family connection and finish through projects or Say hello. Continue exploring is an explicit choice.
5. The menu has an independent Radio music switch. The original quiet music and short optional phone ring still need a listening review. No spoken recording of Bryce is included.

## Representative views

These captures come from separate review runs. They aren't a recording of one trip.

The café image uses the default parked camera direction after infill. The earlier `town-infill-cafe-view.jpg` was manually turned toward the street and wasn't the automatic arrival composition.

![Default café framing](/Users/bryce/.codex/worktrees/abf6/bryce-rambach-portfolio/.codex/review/town-infill-cafe-default-view.jpg)

![Moving main street after infill](/Users/bryce/.codex/worktrees/abf6/bryce-rambach-portfolio/.codex/review/town-infill-main-street.jpg)

![Tennis arrival after infill](/Users/bryce/.codex/worktrees/abf6/bryce-rambach-portfolio/.codex/review/town-infill-tennis-arrival.jpg)

![Projects inside the cabin](/Users/bryce/.codex/worktrees/abf6/bryce-rambach-portfolio/.codex/review/town-cabin-projects.jpg)

![Cabin and lower roadside growth](/Users/bryce/.codex/worktrees/abf6/bryce-rambach-portfolio/.codex/review/understory-seat.jpg)

![Current lake arrival](/Users/bryce/.codex/worktrees/abf6/bryce-rambach-portfolio/.codex/review/fixed-default-arrival.jpg)

![Keyboard access to the project study on a narrow laptop screen](/Users/bryce/.codex/worktrees/abf6/bryce-rambach-portfolio/.codex/review/agentsky-cabin-narrow.jpg)

## Still open

- Town performance is now measured with both saved engines off. Investigate the retained long frame intervals and the 67.9 ms render callback that coincided with new detailed-fir shader programs. Larger intervals weren't attributed to a cause. The current direct first trip has complete totals: 67.854 fps across 10,354 driving frames, max 33.8 ms, no intervals above 50 ms. Entry/object transitions still showed stalls; see the latest performance section. The old three-stop route is not a like-for-like timing comparison.
- The town direction is approved. Preserve the layout while completing performance, device and final whole-journey checks.
- Forest repetition, broad bare terrain, panorama sharpness and seams, traffic models and close-up car materials need visual acceptance.
- Engine sound is approved: Bryce said it “sounds fire”. Preserve the tuning. The credited recording is a Porsche 911 of unspecified trim, not a verified GT3 recording.
- Physical-phone input, weaker hardware and long-session memory bytes aren't verified.
- Other projects need verified screenshots or demos. No unsupported outcome metrics have been added.
- Bryce hasn't accepted the completed site's visual polish.

No purchases, commits, pushes or deployments have been made for these changes.

[Milestone plan](/Users/bryce/.codex/worktrees/abf6/bryce-rambach-portfolio/docs/implementation/porsche-journey-goal.md) · [Quality list](/Users/bryce/.codex/worktrees/abf6/bryce-rambach-portfolio/docs/implementation/porsche-quality-list.md) · [Verification record](/Users/bryce/.codex/worktrees/abf6/bryce-rambach-portfolio/src/prototype/VERIFICATION.md)

## Bounded smoothness follow-up, 6 September

Whole-trip driving totals now survive the 60-window history limit and include the unfinished final window when driving stops. Totals retain frame count, summed intervals, correctly weighted FPS, slow-frame count, maximum interval, mean submission work and density range in constant memory. They measure visible driving frames, not parked or hidden-tab time. The rolling windows remain available for local detail.

One representative detailed fir now participates in the existing pre-entry render warmup, with its visibility restored even if rendering fails. This targets the previous first-tree draw stall. Focused browser evidence in `.codex/review/town-first-tree-warmup.json` shows 85 programs ready before entry, versus the earlier benchmark's 83 before the forest and 85 afterward. The scene reached ready in 3.565 seconds in this one probe, with no browser warnings/errors. This isn't a loading-time comparison or evidence that all long frame intervals are fixed.

Five focused tests pass, covering total rollover/partial batches, warmup visibility restoration and existing tree behavior. TypeScript and production build pass. No new full-route FPS or weaker-device claim. The previous 27 slow frames and 333 ms maximum remain the latest complete historical stutter evidence, subject to that run's missing-window limitation. The layout, handling and guided-tour flow weren't changed by this follow-up.

## Paper materials and optional interactions, 6 September

The current goal preserves the approved town and journey, with UI/material polish and a clear portfolio finish. Race track, time trial and leaderboard remain outside the written goal; Bryce questioned that separation but hasn't yet replaced that clause.

Added warm paper materials and restrained tour footers, coherent instrument controls, earlier optional stop invitations, a clear the lake thank-you and contact link, original synthesized radio music with an independent switch, and one optional original phone-ring interaction. The call currently shows a short text reply, not a voice recording. The quiet radio and new ring haven't been auditioned by Bryce.

Browser checks: desktop welcome/contact material; 390-pixel contact/racket/photo board; 320 x 568 keyboard scrolling to the photo-board footer; laptop text/touch refinement with a measured 44.14-pixel key-handoff target; compact three-row driving controls; persistent pre-ignition café invitation; successful Pull in arrival and engine-off at the café. Viewport override reset and test tab closed. These are browser viewport checks, not physical-phone evidence. An editing-time React dependency-array warning occurred during hot reload; the subsequent tour and café check ran after a full reload. No claim of a clean full-route console/performance run from this test.

Evidence: `.codex/review/paper-racket-390.jpg`, `paper-board-keyboard-320.jpg`, `driving-controls-grid-320.jpg`, `cafe-invitation-before-ignition-320.jpg`, `cafe-invitation-arrival-320.jpg`.

Full suite: 259 tests across 57 files passed before the final narrow-screen and invitation timing refinements. The 14 affected invitation/Entrance tests then passed, as did TypeScript and production build. Logs: `/tmp/polish-current-regression.log`, `/tmp/narrow-polish-tests.log`, `/tmp/narrow-polish-build.log`. Remaining: complete-trip performance with current counters, final lifecycle/audio checks, real touch hardware, weaker devices and Bryce's visual/audio acceptance.

## Current first-trip performance, 6 September

A fresh normal-motion run of `http://localhost:3001/?town&profile=journey` completed the mandatory cabin tour, skipped optional stops, followed normal Cruise to the mandatory the lake turnout and opened the five-folder laptop from the finish. Codex browser, Apple M4 / 16 GiB, 1280 x 720, muted with radio enabled. The saved preview was stationary, parked and switched off under prior permission before the run, and Engine off was reverified afterward. No tests, builds or edits ran during driving. Other desktop applications remained open.

Complete cumulative driving totals, including the 34-frame final partial window: 10,354 frames, 152,591.3 ms summed driving intervals, 67.854 fps, maximum 33.8 ms, zero intervals above 50 ms. Density ranged 1.15-1.35. Mean submission was 3.482 ms. This is a single-machine result for the current direct first trip, not a like-for-like comparison to the older three-stop route. No browser warnings or errors were captured in this run.

Motion outside driving still has issues: entry averaged 54.9 fps with two intervals over 50 ms, maximum 58.3 ms and one 55.7 ms render callback. One object transition recorded 266.4 ms. Its long-frame record includes 26.6 ms of React work with 25.7 ms forced layout, plus 5.8 ms in the renderer; that does not explain the full interval. Do not attribute the remainder to tree shaders. Ignition and automatic parking had no intervals over 50 ms in this run.

Evidence: `.codex/review/current-first-trip-complete-totals.json` and `current-first-trip-finish.jpg`. The test tab was closed and the saved preview left parked/off. Navigation away produced a zero-canvas document, but this wasn't an instrumented SPA-disposal or memory-byte check. Separate focused audio lifecycle coverage now has 13 passing tests, including cancellation of scheduled ringing and stopping voices at disposal; TypeScript passes. Logs: `/tmp/phone-cleanup-tests.log`, `/tmp/phone-cleanup-typecheck.log`.

Next work should target the entry/object stalls, final reduced-motion/cleanup checks and human visual/audio acceptance. Current driving performance has evidence; physical phones and weaker hardware remain unverified.


## the lake finish and reduced motion, 6 September

Moved the desktop finish card to the lower left and shortened the closing sentence so the lake and mountain view stays visible. Portfolio and contact links share a compact row. A fresh reduced-motion browser journey completed all four mandatory cabin objects, handed over the keys, skipped the optional café and arrived at the lake. The finish displayed every action at 1280 x 720. Evidence: `.codex/review/lake-finish-reduced-desktop.jpg`.

The finish's full-portfolio link loaded `/projects` with all five folders, contact and biography. Opening arro displayed its project notes. This verifies the fallback navigation and content, not memory cleanup or every project's source material. Restored Movement to Follow device and closed the test tab; the saved user preview stayed open.

TypeScript and 12 Entrance tests pass (`/tmp/finish-layout-check.log`, `/tmp/finish-layout-tests.log`). Production build passes (`/tmp/lake-finish-build.log`) with the existing large-chunk warning. This check didn't audition audio or test a physical phone. Bryce's final visual/audio review remains open.


## Laptop keyboard focus, 6 September

Returning from project notes now restores focus after the folder list renders, without scheduling an uncancelled animation frame. The effect skips inactive laptops. Five object/laptop tests pass, including opening arro with focus on its notes and using Escape to return focus to its folder; TypeScript passes. Logs: `/tmp/laptop-focus-tests.log`, `/tmp/laptop-focus-types.log`. This is a keyboard/lifecycle refinement, not evidence that the recorded object-transition stall is fixed.

The transition source inspection found synchronous native `showModal()` at object mount and focus restoration at unmount. The photo board's four JPEGs total about 209 KB and have CSS-constrained dimensions; no measured decoding attribution was established. Keep the stall open until a focused browser trace identifies its cause.


## Entry/card pause reproduced, 6 September

A bounded normal-motion development-preview check reproduced the first-card pause: 265.8 ms maximum interval, 13.7 ms maximum submission. The associated long-animation-frame record contains a 13.9 ms render callback and no recorded React callback; this weakens the earlier React-layout explanation without identifying the remaining time. Entry recorded a 76.1 ms render-work stall, with 75.7 ms in draw and geometries increasing from 339 to 340 while programs stayed at 85.

Evidence: `.codex/review/entry-card-repeat.json`. This isn't a production measurement or a sustained-driving rerun. No source edits or builds ran during the transitions. The test tab was closed.

The opt-in first-draw diagnostic previously watched only meshes. It now also watches lines, points and sprites and records object type, so the next bounded entry trace can check whether one of those explains the unnamed geometry upload. TypeScript passes (`/tmp/transition-profile-types.log`). No rendering or handling change, and no claim that the pauses are fixed.


## Entry line-buffer warmup, 6 September

Expanded diagnostics identified a LineSegments/LineBasicMaterial first draw during entry, with geometry count 339 to 340 and 35.7 ms in draw. Evidence: `.codex/review/entry-line-first-draw.json`. The existing pre-entry seat warmup now temporarily disables frustum culling for lines, points and sprites as well as meshes, restoring each original culled state afterward.

A fresh bounded browser check reached ready at 3.534 seconds with 341 geometries already uploaded. Entry kept that count constant, averaged 67.7 fps, and had a 33.2 ms maximum interval with zero intervals above 50 ms. Recorded slow work no longer showed a new geometry or a long first-line draw. Evidence: `.codex/review/entry-lines-warmed.json`. This supports removal of that particular deferred upload, not universal entry performance or a fix for the separate card pause. No builds or edits ran during entry. The test tab was closed. TypeScript passes; production build log: `/tmp/entry-lines-build.log`.


## Card GPU attribution and rejected warmup, 6 September

The browser supports the optional GPU timer. A bounded first-card trace recorded a 183.083 ms GPU sample alongside the 183.4 ms object interval, with max JavaScript submission 7.3 ms. Evidence: `.codex/review/card-gpu-baseline.json`. This identifies GPU time during the pause without separating scene work from other GPU contention.

An experimental pre-entry render of the card reading pose did not remove it: the first-card transition still reached 258 ms, with a 229.158 ms GPU sample. Geometry, texture and program counts were already stable at 341/72/85. Evidence: `.codex/review/card-reading-warmup-rejected.json`. The additional card warmup was reverted completely; the verified line-buffer warmup remains. No tests or builds ran during either transition. Both test tabs were closed.

Next isolation: separate native dialog opening from the physical card animation to test compositor involvement. Don't repeat the rejected reading-pose warmup or claim that more precompiled scene geometry fixes this pause.


## Card dialog and shadow isolation, 6 September

Two temporary development-only experiments were run and fully removed. Suppressing the card dialog left the physical animation's pause intact: 257.7 ms interval and 259.737 ms GPU sample, with zero open dialogs. Evidence: `.codex/review/card-without-dialog.json`. The dialog isn't required to reproduce this pause.

Restoring the dialog but suppressing shadow-map refresh during card motion also retained the pause: 267 ms interval, 215.049 ms GPU sample. Evidence: `.codex/review/card-without-shadow-refresh.json`. The render call count fell to 372, but the large GPU sample remained. Don't remove the dialog or moving shadows as a purported fix.

Both experiment switches were removed and test tabs closed. No production behavior changed. The next useful isolation is the moving card mesh versus its camera motion and newly visible scene, since dialog composition and shadow refresh alone don't explain the GPU stall.


## Card mesh/camera isolation, 6 September

Hiding the physical card while retaining camera movement and dialog still produced a 224.2 ms interval and 226.362 ms GPU sample (`.codex/review/card-hidden-mesh.json`). Restoring the card while suppressing reading-camera movement retained a 266.7 ms interval and 240.645 ms GPU sample (`.codex/review/card-fixed-camera.json`). Neither card geometry nor camera movement alone is necessary to reproduce the observed pause. Both switches were removed and test tabs closed.

Across these isolation runs the pause repeatedly lands on object sample 4. Before further scene changes, isolate the automated interaction/observation timing from animation startup. A delayed development-only UI trigger would let the browser tool return before motion begins. This hasn't been tested, and automation interference is a hypothesis rather than an explanation.


## Delayed card trigger, 6 September

A temporary two-second delay separated the browser click tool from first-card motion. The pause persisted: 200 ms maximum object interval, 189.27 ms GPU sample, 7.6 ms maximum JavaScript submission. It moved from sample 4 to sample 2. Evidence: `.codex/review/card-delayed-trigger.json`. This does not support attributing the pause solely to the overlapping click tool. The delay was removed completely and the test tab closed.

Pause investigation is bounded here. Dialog suppression, shadow suppression, mesh/camera isolation, reading-pose warmup and delayed triggering did not resolve it. Retain the recorded GPU issue, preserve the verified line-upload fix, and continue remaining interaction/acceptance checks. A future fix needs a stronger GPU-level hypothesis rather than another arbitrary scene subtraction.


## Phone interruption behavior, 6 September

The optional call now starts only while its controls can be shown. Opening the menu, map, laptop or another cabin object, or leaving the seat, dismisses an active call and stops its ring. Previously the panel could hide Answer/Ignore while the ringtone kept playing. A regression test starts the call, opens the menu, verifies audio stop and then confirms returning to the road doesn't ring again. All 13 Entrance tests and TypeScript pass (`/tmp/phone-panels-tests.log`, `/tmp/phone-panels-types.log`). This is automated interaction coverage; no new listening acceptance is claimed. Production build log: `/tmp/phone-panels-build.log`.


## Advance stop signs and regression, 6 September

Added separate COFFEE AHEAD / TENNIS AHEAD signs 108 metres before the optional turnoffs, using the existing sign material and dimensions. The original turn-in signs remain. Their brief subtitle reads “100 M · OPTIONAL STOP”. This supplies a physical advance cue in addition to the speed-aware invitations; it doesn't force either stop. Driving camera readability and nearby geometry clearance still need a browser check.

The full regression suite passed 262 tests across 57 files before these static signs were added (`/tmp/current-polish-full-tests.log`). TypeScript and production build pass after the signs (`/tmp/advance-sign-types.log`, `/tmp/advance-sign-build.log`). No new sustained-performance or subjective-acceptance claim.


## Advance-sign placement correction, 6 September

The initial café advance sign was behind the town start (76.3 m versus 101.4 m). It now sits at 134.3 m, 50 m before the café access; its subtitle correctly says 50 M. Tennis retains its 108 m lead-in. No road or building position changed.

Sampling the 3.8 m sign widths against conservative above-ground building envelopes gives about 0.77 m café and 0.82 m tennis clearance. Their footprints overlap front paving, which is appropriate for roadside signs; paving was excluded from the above-ground envelope rather than treated as empty space. Evidence: `.codex/review/advance-sign-clearance.json`. This measures placement, not driving-camera readability, which remains unchecked. Logs: `/tmp/sign-placement-types.log`, `/tmp/sign-placement-build.log`.


## Production stop-cue check, 6 September

The current production preview completed the normal-motion four-object tour and key handoff, showed the initial café invitation, started normal Cruise and showed the tennis invitation at 63 km/h. The physical advance sign was visible along the street. Its small text wasn't established as readable at driving speed. The tennis invitation expired before the automated Pull in click reached it, so this run does not verify tennis pull-in. The tool returned a stale-node error rather than a successful navigation.

The screenshot saved as `.codex/review/tennis-invitation-production.jpg` was taken after the earlier live observation and may show a later position; don't use it as proof of the invitation window or its duration. The test car was pulled over, its engine switched off and its tab closed. The saved user preview was left open. This was a visual/interaction check, not a performance or audio listening benchmark. Further sign readability and tennis pull-in verification remain open.


## Production tennis invitation arrival verified, 6 September

A fresh production journey completed the cabin tour, skipped café and accepted the live tennis Pull in control directly, without a separate intervening browser snapshot. Cruise entered the tennis access road, slowed and parked at Tennis club. The arrival offered Continue to lake and Route map. Switching off the engine produced the disabled Engine off control. Evidence: `.codex/review/tennis-pull-in-production.jpg`. The parked/off test tab was closed.

This completes the tennis invitation-to-parking functional check that earlier stale-node clicks did not establish. The existing court sign is partly outside the default arrival view, so its full joke still requires looking around. No changed parking geometry, physical-touch claim, listening review or fresh performance benchmark. Advance-sign small-text readability at speed remains unverified.


## Driving-key focus after optional interactions, 6 September

Three new regression tests reproduced keyboard focus leaving the canvas after Answer, Ignore and declining an optional stop. Driving key listeners belong to the canvas, so losing focus prevents immediate keyboard control. Each action now restores canvas focus without scrolling. All 16 Entrance tests pass after the fix (`/tmp/interaction-focus-after.log`), versus three failures before (`/tmp/interaction-focus-before.log`). TypeScript and build pass (`/tmp/interaction-focus-types.log`, `/tmp/interaction-focus-build.log`). These checks use DOM keyboard/focus behavior, not a new physical-device or audio listening check.


## Current cleanup and milestone reconciliation, 6 September

Source review confirms releaseRenderer traverses the complete scene before resource disposal, covering the new advance-sign geometries, materials and canvas textures. The 17 resource/audio lifecycle tests pass (`/tmp/current-resource-audio-tests.log`), including shared line/material cleanup, late loader cleanup, radio switching, ring cancellation and audio disposal. This is source plus automated lifecycle evidence, not a new browser memory measurement.

The milestone plan's current verification paragraph now names the latest whole-trip counters, reduced-motion/fallback results, optional-stop arrivals and interaction-focus regressions, replacing stale claims that current driving measurement was still pending. All remaining acceptance requirements stay open. Supporting repo/demo links or local paths for arro, throughline and bryce-os have been requested; don't invent them or count their short descriptions as source verification.


## Advance-sign typography, 6 September

Advance signs now use 96 px destination lettering and 38 px subtitles on their existing 1024 x 256 textures, versus 52/24 px for the stop labels. Other stop signs keep their existing typography. Dimensions, placement and resource counts are unchanged.

A browser check completed the cabin tour, dismissed the initial café invitation and selected Face forward. COFFEE AHEAD is readable from the starting seat roughly 33 m before its sign; the small subtitle isn't established as readable at that distance. Evidence: `.codex/review/coffee-advance-readable-seat.jpg`. This is a stationary driver-view check, not proof that every line can be read at speed. The test tab was closed. TypeScript and production build pass (`/tmp/sign-type-types.log`, `/tmp/sign-type-build.log`).


## Lake/menu keyboard continuation, 6 September

Stay a little longer and Face forward now restore canvas focus when their panels disappear. Tests cover lake dismissal, menu centering and pressing K directly after the key handoff. All 18 Entrance tests pass; production build passes (`/tmp/handoff-focus-after.log`, `/tmp/handoff-focus-build.log`). TypeScript passed for these focus changes (`/tmp/handoff-focus-types.log`).

The initial key-handoff test failure came from its mock: the real scene's allowIgnition already focuses the canvas. The mock now reflects that behavior and the unnecessary duplicate handoff focus change was removed. Don't describe the key handoff as a newly fixed production bug. The lake/menu focus restoration is the retained behavior change.


## Route-map first-trip copy and focus, 6 September

The map no longer says that no stops are required during the mandatory first journey. Before the lake visit it says the first trip ends at the lake and café/tennis are optional. Afterward it offers another stop or continued exploration.

Destination selection now restores cabin focus when the map unmounts, matching ordinary map dismissal. Previously destination selection explicitly suppressed restoration, while navigation during an existing drive didn't restore it elsewhere. Two focused map tests cover first-trip copy and destination-selection focus. Those plus all 18 Entrance tests pass, as do TypeScript and production build (`/tmp/map-continuation-tests.log`, `/tmp/map-continuation-types.log`, `/tmp/map-continuation-build.log`). No route geometry or driving behavior changed.


## Narrow production map verified, 6 September

At 390 x 844, the updated production route map fits all three optional/required destination entries and the first-trip note. Measured button heights: Close 46.4 px; destination buttons 67.8 px. At 320 x 568 the dialog scrolls; keyboard Tab reaches Lakeside and scrolls it plus the first-trip note into view. Escape closes the dialog and returns focus to CANVAS, with zero open dialogs.

Evidence: `.codex/review/map-first-trip-390.jpg` and `map-first-trip-320-keyboard.jpg`. The test tab was closed and browser viewport override reset. These are responsive-browser and keyboard checks, not physical-phone or multi-touch evidence. No code change was needed after this check.


## First-card GPU preparation retained, 6 September

Preparing one scene frame and waiting for the existing GPU fence before the first card lift removed the mid-animation pause in a bounded browser check. Preparation took 192 ms. The subsequent card animation averaged 80.4 fps, max interval 25 ms, zero intervals above 50 ms and max JavaScript submission 11.8 ms. No slow GPU sample occurred during the card motion. Evidence: `.codex/review/card-gpu-prepared.json`.

This moves the preparation delay before the lift; it doesn't eliminate total interaction latency or establish a driver-level root cause. The pattern is retained for the first normal-motion card inspection. Reduced motion bypasses it. Duplicate preparation is guarded; completion after disposal or leaving the seat doesn't open the card; failed preparation falls back to inspection rather than leaving it pending.

The existing five GPU-fence tests and all 18 Entrance tests pass, as do TypeScript and production build (`/tmp/card-preparation-tests.log`, `/tmp/card-preparation-types.log`, `/tmp/card-preparation-build.log`). The browser evidence used the experimental switch before it was promoted; the final default/cancellation guards still need a fresh browser check. Don't rerun a full driving benchmark for this pre-motion-only change.


## Default first-card preparation verified, 6 September

A fresh normal-motion development preview used the promoted default without the experimental card switch. First-card preparation took 282 ms, followed by 75 motion samples at 78.9 fps, max interval 17.5 ms, zero intervals above 50 ms and max JavaScript submission 18.1 ms. No large GPU sample occurred during the card lift. Evidence: `.codex/review/card-default-prepared.json`.

The same run then advanced through racket, photo board and project laptop, handed over the keys and exposed ignition plus the optional café invitation. Canvas focus was retained. The test tab was closed. No builds, edits or tests ran during the measured entry/card phases. This verifies the default's animation behavior on the available Mac; the 282 ms pre-lift delay remains part of perceived response and needs Bryce's review. It isn't a production GPU measurement or a weaker-device result.


## Pending card cancellation, 6 September

The first-card preparation now checks that the card is still requested before opening it. Other object inspection, opening the laptop/map, putting an object down and leaving the seat clear that request. This prevents a stale preparation callback from reopening the card after a different action. The existing disposed/moving/seat guards remain.

TypeScript and production build pass (`/tmp/card-cancellation-types.log`, `/tmp/card-cancellation-build.log`). Full regression output: `/tmp/polish-final-regression.log`. The cancellation check was verified in source, not by a browser race test; the earlier default preparation timing still measures the same normal path.


## Complete journey promoted to homepage, 6 September

The plain homepage previously selected the older forest starting position, bypassing the optional town stops until another loop. It now uses the same town journey as `?town`. A shared route-selection helper keeps the UI and car controller consistent. Explicit `?forest`, `?city` and `?journey` preserve the older prototypes.

The 22 affected route-selection, Entrance and town-drive tests pass; TypeScript and production build pass (`/tmp/default-town-tests.log`, `/tmp/default-town-types.log`, `/tmp/default-town-build.log`). The later plain-production-homepage check verifies its entry, tour, handoff and route map. The existing saved user preview hasn't been refreshed or moved.


## Plain production homepage verified, 6 September

A fresh `http://localhost:3003/` tab with no query parameters opened in town, completed car entry and all four cabin-tour objects, handed over the keys and showed the initial café invitation. Focus was on CANVAS. The map showed café, tennis and Lakeside, with the correct first-trip note. Evidence: `.codex/review/plain-homepage-handoff.json` and `plain-homepage-map.jpg`.

This verifies the default URL's starting route and handoff; the previously measured town driving controller is unchanged. It isn't a new full driving or performance run. The engine wasn't started, the test tab was closed and the saved user preview wasn't refreshed.


## Phone review access prepared, 6 September

The desktop production server binds only to 127.0.0.1:3003. A separate Vite production preview now binds to the current network interface at 172.20.10.2:3004 (PID 24643, command session 31483). HTTP 200 and the listening interface were verified from the Mac. The desktop server and saved browser tab weren't changed. This is a local preview, not a deployment.

Bryce has been asked to test the tour, simultaneous accelerator/steering and parking on a phone on the same network, reporting device/browser and behavior. Phone reachability and actual touch remain unverified until that result arrives. Don't poll the idle preview server as if it were a background verification job. Stop the extra phone server once review no longer needs it.
