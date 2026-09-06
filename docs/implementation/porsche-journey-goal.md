# Porsche first-version goal

## Current polish milestone

Preserve the guided cabin-to-lake journey, approved town and handling. Finish paper/object materials, coherent controls, earlier optional café/tennis invitations, a few personal interactions and the portfolio/contact ending. Music and one optional phone interaction were subsequently requested and are implemented for review. Bryce explicitly added mandatory outward autopilot and an optional lake-to-start manual time trial with a shared leaderboard on 7 September. Those features are in scope; the older saved goal exclusion is superseded by his instructions. Local implementation, remote storage verification and human acceptance are separate milestones.

The latest implementation and evidence are in porsche-review.md. The current direct first trip has complete measured driving evidence. Reduced-motion tour, the lake arrival and the quiet portfolio link also pass in the browser. Entry/object transition stalls, final cleanup/audio checks, physical touch/weaker hardware and Bryce's review remain open. Don't treat historical approval questions or the earlier three-stop route as current blockers or the current benchmark.

Updated 7 September 2026. This update implements Bryce's guided-journey feedback; it isn't whole-site acceptance.

The latest direction supersedes the earlier optional-first-stop flow: a short mandatory cabin introduction, then driving, then a mandatory lake-inspired lake turnout with Bryce's family connection and clear project access. Keep text brief and the jokes occasional. Bryce wants pacing and personal discoveries, not long descriptions. Coffee and tennis remain optional destinations. The lake ends the first trip; continuing around the road is an explicit choice afterward.

Implemented: welcome, contact card, racket, photo board and physical project laptop before unlocking ignition; direct town-to-lake cruise at an 18 m/s ceiling (157 seconds in simulation); first-approach assistance that preserves braking and pause/resume; lake copy and both laptop and full-portfolio links; two small sign jokes. The recorded acceleration bed now fades into a steady recorded spectrum near redline. Lower-rev tuning and engine/drivetrain ratios are preserved.

Current verification: 262 tests across 57 files passed before the final interaction-focus fix. All 16 Entrance tests pass after that fix, including three regressions that failed beforehand. TypeScript and production build pass. The current direct first trip has complete cumulative driving evidence: 10,354 frames, 67.854 fps, max 33.8 ms and no intervals over 50 ms on this M4 Mac. Reduced-motion tour and lake-to-quiet-portfolio navigation pass. Current production café and tennis invitations have verified arrivals. Entry's deferred line upload is warmed before motion; the first card now prepares the GPU before lifting, with a verified default max 17.5 ms motion interval after a 282 ms wait.

Remaining acceptance: Bryce's final materials/audio review; physical touch and weaker-device behavior; advance-sign readability at speed; perceived first-card preparation latency; deeper supporting evidence for arro, throughline and bryce-os. A request for those projects' repo/demo links or local paths is pending. Existing lifecycle tests and browser cleanup evidence don't measure retained memory bytes. No purchases, commits, pushes or deployment.

Earlier benchmark/listening permission blockers are resolved. Don't re-open them or call the goal blocked on those old questions. Preserve the accepted town layout and driving feel.

## Earlier scope, superseded by the current polish goal

Bryce approved the next milestone through Website direction: a small town connecting a neighbourhood café, his flat-white stop, and a tennis club to the existing scenic driving experience. The proposal specified simple destinations viewed from the car; Bryce replied “yes”. This expands the earlier cabin, scenic route and lake-inspired overlook scope. Preserve the active goal and the earlier work. Don't falsely complete the goal to replace its stored text.

Build a coherent, navigable first pass of the town before further discretionary lake polish. Compose the road, building groups and recognizable café and courts together, then refine architecture, lighting and materials. Visitors arrive, park, look from the seat and resume. Walking, ordering systems, missions, inventory and additional destinations aren't part of this update. The earlier multi-stop prototype remains reference material, not an accepted town design.

Keep the handling Bryce accepted, the fixed-allocation renderer, cabin objects, AgentSky portfolio and accessible fallback. The website still needs to explain who Bryce is, show real work and make contact easy. Rendering, loading, accessibility, cleanup and subjective review remain acceptance requirements.

## Required sequence and acceptance evidence

1. Brief, wordless overhead-to-door approach. The handle/door is the primary generous pointer target, with keyboard and touch access. Entry moves continuously through the opening door into the seat. Returning visitors can skip the approach. Verify the moving sequence and reduced motion, not only parked screenshots.
2. Three main physical objects: laptop for projects, tennis racket for his story, contact card. Use consistent inspection and return interactions, grounded props, restrained cues and one fading hint. No persistent bottom navigation. Portfolio and contact remain immediately reachable without driving or completing object interactions. Use real existing content; record missing personal facts rather than inventing them.
3. Ignition invites the visitor to leave the reading and go for a drive. Put inspected objects away and settle into driving naturally. Preserve manual gears, responsive steering, acceleration, braking, parking and coherent licensed engine/road/wind sound. No sticky-note invitation. Respect audio activation, mute and volume preferences.
4. One continuous route connects the small-town café and optional tennis club with the scenic forest drive and lake-inspired overlook. The existing forest-to-overlook section takes roughly two to three minutes; town visits extend that journey. Progress from warm afternoon toward evening. Visitors can park, switch off the engine, look from the seat, resume or return. No walking or mandatory activities. Review representative moving viewpoints for scenery, scale, clipping and camera continuity.
5. Convincing close-up car/interior materials and art direction. Fix floating props, see-through geometry, awkward camera paths and crude scenery. Investigate licensed alternatives if geometry fundamentally blocks realism. Don't purchase without authorization.
6. Establish a frame-time baseline on the available hardware/browser. Aim for 60 fps on recent laptops and a stable reduced-quality mode for weaker devices. Measure entry/loading hitches, sustained driving and repeated object use. Adaptive rendering must retain composition and interaction quality without oscillation or conspicuous popping. Stage loading and retain a graceful lightweight portfolio fallback. Don't claim untested hardware support.
7. Meaningful automated and full-flow browser verification covers keyboard/touch, resize, reduced motion, mute, entry/exit, reading, starting/stopping/parking/resuming, fallback and cleanup. Resolve known required defects. Keep explicit device and listening boundaries. Tests don't establish visual acceptance.
8. Deliver a reviewable preview with evidence against these criteria. Bryce judges subjective visual and driving quality before overall acceptance. Don't mark complete while required work or important known defects remain.

## Added driving requirements, 6 September

Bryce requested optional Turbo cruise and a convincing steered pull-over. Keep normal Cruise at its existing relaxed pace. Turbo should accelerate on clear straights, brake before bends and traffic, and yield control when the visitor steers, accelerates or brakes. Pull-over must show the car following a steering arc, with the wheel turning into the shoulder and straightening before the stop. Preserve these accepted controls as the town joins the route. Destination activities remain outside scope.

## Current milestone

Current implementation: [small-town milestone](porsche-town-milestone.md). A navigable café/courts/lake first pass is available at `/?town&profile=journey`; geometry, navigation and simulated continuity are implemented, with browser and visual acceptance still incomplete. The café and tennis club expansion is approved. Stop waiting for destination clarification. Historical measurements below describe earlier builds; current acceptance and evidence are tracked in `porsche-quality-list.md`.


Bryce confirmed that driving feels good on 6 September. Preserve the current steering, acceleration, gears, Cruise, Turbo and pull-over tuning. Treat this as acceptance of the present driving feel, not overall visual, audio or hardware acceptance.

The production cabin-to-road flow passes entry, contact-card pickup/return with restored keyboard focus, ignition, Cruise, Turbo and requested pull-over. The current single scenic route reaches Lakeside in both simulation and browser checks. Normal Cruise takes roughly 141 seconds in simulation; Turbo is optional and faster. The current full regression suite passes 229 tests across 51 files. TypeScript and the latest production build pass.

Performance evidence improved on the available browser. Starting the canvas at density 1.35 produced a full route averaging 65.36 fps across 8,640 measured frames, with range 58.5-80 fps, a 26.4 ms maximum driving interval and no intervals above 50 ms. Density stayed fixed throughout. The preceding 1.5-start run had one 75 ms resize interval. Entry, ignition and parking remained below 26 ms in the new run. This sequential comparison supports the starting-density change locally, not a controlled speedup or a guarantee across devices. Readiness was 3,824 ms and shadow preparation 176/237 ms; loading remains variable. Ten controller tests, TypeScript and build pass after the last full 219-test suite.

Visual review of the production parked view still shows broad bare slopes, sparse trees and a muted sky. Improve forest composition and lighting before claiming a convincing scenic environment. The cabin/contact flow works, but passing controls doesn't establish material or animation quality. Crawl-speed pull-over now uses gentle forward creep after simulation exposed near-sideways movement. The new shallow-arc test and all 214 regression tests pass; slowed browser captures now confirm the angled car, countersteering and centered parked wheel. Normal-speed feel and traffic interaction remain open.

Physical-phone handling, weaker hardware, audio listening, real project screenshots/outcomes, richer supplied personal details and Bryce's subjective acceptance remain open. The original preview tab is stuck on a connection-error page that the browser tool's URL policy won't select; the separate working scenic tab was verified ready and queued for display. No deployment or overall acceptance is claimed.

## Evidence and boundaries

Before the scope replacement, 148 tests across 32 files, TypeScript and production build passed. The branch work includes an acceleration-aware traffic merge check and a complete simulated six-stop route without contact. This is reusable history, not proof of the revised first-version sequence. Available forest performance samples and browser checks are in `src/prototype/VERIFICATION.md`. No physical phone, weaker-hardware or final engine listening acceptance is claimed.

No purchases, commits, pushes or deployment without specific authorization. Focused subagents are authorized for independent bounded work; root owns integration and acceptance.


## Next visual implementation

Use a shared scenic road profile for paved width, shoulder, lane centres, parking position and traffic count. Preserve prototype defaults. The current 5.5 m approach lane, 5.4 m parking offset, outer traffic lanes and lake-branch endpoints must change together; narrowing only the asphalt would strand the car outside the road. Remove intermediate lane dividers, update the scenic access geometry and stop reserving terrain/tree space for hidden activities. Verify both junctions, oncoming clearance, high-speed braking and reduced-motion parking before accepting the narrower road.

The content audit found only two supplied tennis statements. A richer personal story needs Bryce's actual details; retain the existing concise copy while independent visual/performance work continues. Existing project descriptions have no verified demo URLs, screenshots or outcome metrics, so don't invent them.


## Two-lane road and object picking, 6 September

The preceding goal turn made implementation progress. This continuation integrated a shared scenic road profile: 3.8 m paved half-width, 6 m gravel shoulder, one lane each way at +/-1.9 m, twelve traffic cars and shoulder parking at 4.6 m. The lake access endpoints and merge checks use the same profile. Prototype geometry and traffic retain their previous configuration. Terrain rises closer to the scenic road and no longer reserves hidden stop/trail clearings. The white overlook slab is removed.

The contact card is clipped to the glovebox front, with a larger invisible target. Browser clicking found that the hidden experimental coffee holder intercepted rays; picking now excludes invisible ancestors while respecting visible opaque obstructions. The scenic release no longer constructs the coffee holder. Direct card selection and the corrected overlook surface were verified in the browser. All 162 tests across 36 files, TypeScript and build pass.

The full scenic drive still takes about 141 seconds in simulation. Tests cover manual entry/rejoin without jumps, blocked merging, braking beyond the branch endpoint, oncoming lane layout, rendered shoulder clearance and reduced-motion arrival. A fresh full-route browser performance run is next; don't claim the final visual quality or broad device support from these functional checks.


## Full-route timing and stable rendering, 6 September

The two-lane baseline completed the route at approximately 60.45 fps across 8,160 measured driving frames, with low-50s opening windows. The adjusted controller completed the same route at approximately 66.06 fps across 8,880 measured frames. Its ratio stayed at 1.35 through driving, parked project reading, racket inspection and resume. Neither measured drive had a frame above 50 ms. Full figures and limits are in VERIFICATION.md. All 163 tests across 36 files, TypeScript and build pass.

This establishes functional progress and one measured local device, not full acceptance. Next, measure entry/loading hitches and review the complete moving visual sequence, then address the remaining landscape/material and object-handling shortcomings. Keep the approved single-drive scope. Don't resume expanding the preserved multi-stop experiment.


## Entry warmup progress, 6 September

Initial world placement, hidden view warmup and an asynchronous GPU completion fence reduced the measured approach maximum from 824.2 ms to 25.9 ms on the available browser. Keeping canvas resolution steady during entry/exit reduced entry maximum to 66.7 ms, with one frame above 50 ms still remaining. TypeScript, 170 tests and build pass. The first scene becomes ready after the warmup, so this is smoother visible entry rather than a claim of faster download.

Two laptop opens reproduce an approximately 192 ms stall; closing peaks at 50 ms. Investigate object-opening frame timing next, then complete the outstanding full-flow, scenery, materials, audio and lifetime checks. Exact evidence and hardware limits are in VERIFICATION.md. Overall acceptance remains open.


## Interaction measurement follow-up, 6 September

Development-only frame attribution now distinguishes slow frame positions and browser-reported script/layout work. Startup remains smooth in repeated measurements, but entry and laptop stalls vary with input method and aren't closed. The best entry sample must not be treated as a guaranteed bound. Compare the same scene in standalone Chrome next, then continue the required physical-object, visual, audio, full-flow and lifetime work. Raw evidence and limitations are in VERIFICATION.md.


## Chrome input fix, 6 September

Standalone Chrome identified a 360.3 ms pointer-up task caused by triangle testing the whole car for exterior entry. Cached exterior bounds now handle entry and hover; precise cabin picking is retained. The transformed hit/miss test passes, and fresh Chrome entry no longer reports that script stall. Worst entry frame improved from 358.3 to 108.3 ms, but average entry FPS was 45.8 at 1200 x 729. Keep entry/laptop performance open and avoid treating a single best frame maximum as acceptance. All 171 tests, TypeScript and build pass. Continue the remaining complete-flow, object, scenery/material, audio and lifetime requirements without expanding the approved first-version scope.


## Lake composition follow-up, 6 September

Terrain, granite, water and distant ridges have a first material pass. Scenic parking now directs the seated gaze toward the lake without a cut; resume restores the forward target. The new view exposes too much flat forecourt and too little visible water. Next review shoreline distance, basin shaping and access-road clearance to improve the actual vista. The ridge silhouettes and lake composition are still provisional. All 172 tests, TypeScript and build pass. Broader performance, accessibility, listening and visual acceptance remain open.


## Shoreline geometry progress, 6 September

The scenic basin now brings water within about 17 m of the parked car while keeping sampled road and access margins dry. A local fine terrain patch removes the jagged near-bank outline; tests check its boundary and texture continuity. Browser entry and resume work from the lake review. The experimental journey lake is preserved. All 174 tests, TypeScript and build pass. Next, consolidate the complete current release sequence and its remaining performance/accessibility/resource checks; the illustrative horizon and interior materials still need visual judgement. No overall acceptance is claimed.


## Lifecycle and keyboard progress, 6 September

Repeated real mounts now have bounded recorded resource/context evidence. The shader-compilation cancellation exception is fixed by separating immediate interaction shutdown from delayed renderer destruction. Context release is explicit. A development review reproduces the boundary and is absent from the production bundle. A fresh production keyboard smoke covers entry, one menu Tab transition, project/racket/contact inspection and return focus. All 174 tests plus final TypeScript/build checks pass. Keep process-memory, touch/reduced-motion/driving-key audits, current performance, audio listening and subjective visual acceptance open.


## Motion settings and shift-key progress, 6 September

A saved visitor motion setting now supplements the device preference, with immediate scene/object transitions and stationary travel. The change handler also fixes a possible entry stall when the system preference changes during animation. Production checks covered reduced entry/reading/travel and persistence, then restored Follow device and verified K ignition, Q/E gear/RPM changes and Space parking. All 175 tests, TypeScript and build pass. Continue current full-flow/performance, physical touch, listening and visual acceptance work; these checks don't close those broader requirements.


## Manual driving feedback, 6 September

Bryce wants to keep driving and add small interactions. Contact and redline corrections are implemented. After his follow-up that steering had become too weak, steering response increased moderately and C speed hold now maintains the selected pace with manual steering. Gas or brake releases it. H honks a bounded two-tone horn. All 184 tests, TypeScript and build pass; development browser checks cover capture, cancellation and horn execution. Read VERIFICATION.md for limits. The overall goal remains active, with hands-on steering/audio judgement and the existing full-flow, performance, touch and visual acceptance work open.


## Current route measurement, 6 September

Two complete current scenic runs reach the lake. Resolution recovery now waits for thirty seconds of substantial frame-time headroom, eliminating the observed repeated up/down density changes in the repeat run. Sustained rendering stays around 66 fps on the available M4 in-app browser. All 185 tests, TypeScript and build pass. One driving frame still reaches 74.5 ms, and entry remains inconsistent with a 232.4 ms sample-four hitch. Investigate that transition before claiming smoothness; continue the outstanding visual, touch, listening and Bryce acceptance checks.


Entry attribution follow-up: timestamped development diagnostics reproduced 199.6 to 315.8 ms entry gaps with little JavaScript submission and no overlapping long blocking script. Delayed input and disabled audio startup didn't eliminate the gap; disabling shadows reduced it in one run but didn't eliminate it. Normal audio and shadows are restored. The root cause remains unresolved. Raw comparisons and limits are in VERIFICATION.md and entry-attribution-comparisons.json. Standalone Chrome wasn't connected. Continue graphics/compositor attribution and the outstanding acceptance checks; the goal remains active.


Keyboard feedback progress: unrelated key releases no longer release a held pedal. Speed hold now explains availability/release and announces the captured speed without repeating changing telemetry. Production C capture at 35 km/h, the release button and Space parking were checked with a clean console. All 187 tests, TypeScript and build pass. Actual screen-reader listening, physical touch, entry hitch attribution and broader visual/audio acceptance remain open.


Cabin discovery progress: first scenic entry now settles toward the passenger-side laptop, racket and contact card instead of hiding the first two outside the initial view. Direct laptop/card selection, return, forward ignition and immediate reduced-motion entry work in production. Follow device was restored. All 188 tests, TypeScript and build pass. The new landscape composition is saved in cabin-discovery-view.png. Portrait/touch framing, entry hitch timing and broader visual/audio acceptance remain open.


Compact viewport progress: portrait first entry now frames the laptop/racket; contact stays reachable through the menu. Short landscape driving controls form a row above the pedals instead of covering menu/sound buttons, and the menu scrolls within the viewport. Browser iframe reviews cover 390 x 660 and 660 x 390. All 189 tests, TypeScript and build pass; the review harness is absent from production. These aren't physical-phone, multi-touch or mobile performance acceptance. See VERIFICATION.md for screenshots, the reused development-tab warning and remaining limits.


Engine response progress: the shared engine model now receives applied fractional throttle from Cruise and speed hold, rather than treating both as coasting. Gear/engine updates run alongside the fixed movement steps after tests exposed a frame-rate dependency. All 191 tests, TypeScript and build pass without weakening timing assertions. Audio listening and current browser performance after this change remain unverified; broader acceptance stays open.


Roadside planting progress: the scenic route reuses the credited 784-triangle fern variant in a bounded nearby batch, outside lanes and water, without shadow casting. All 193 tests, TypeScript and build pass. Current short browser runs are slow with and without planting (44.77/43.91 fps across the first six windows); this doesn't isolate the cause and isn't a performance pass. Raw comparisons and limits are in VERIFICATION.md. Keep current performance, entry hitch, repeated resource counts, broader scenery and subjective/audio acceptance open.


Development lifecycle progress: main.tsx unmounts its outgoing React root during hot replacement. Two updates, including one during entry, return to one ready canvas without console warnings. TypeScript/build and ten focused tests pass. This doesn't prove the cause of the current driving slowdown or zero retained memory. Bryce's feedback on the current driving controls/audio is pending; continue independent required work without assuming acceptance.


## Current lifecycle evidence, 6 September

Three full mounts of the planted scene return identical ready/disposed renderer counts and explicitly release their contexts. Cancellation during shader compilation and the following remount succeed. Fresh browser console is clear. B01 is verified for these tested cycles while process/GPU memory bytes and longer sessions remain open. See current-scene-lifetime.json and VERIFICATION.md. Current driving performance is unresolved: the latest short samples are around 44-45 fps, superseding earlier approximately 66 fps figures as the latest observation. Keep entry timing, visual/physical-device/listening work and Bryce's pending review open.


Adaptive geometry progress: sustained slow rendering at minimum canvas density now reduces detailed nearby trees from four to two for the visit, retaining other trees as baked views. All 195 tests, TypeScript and build pass. A forced development review shows the lighter scene, but varying/unrecorded viewport conditions prevent a controlled speedup claim. The normal run recovered before fallback activation. Current performance variability, transition appearance, entry hitch, physical hardware and subjective/audio acceptance remain open.


Car geometry indexing: addCarParts now restores shared vertices after splitting the body, door and seat components, retaining normals and UV seams. Geometry-only measurement of the actual GLB assembly reports 243,496 output triangles, 730,488 expanded vertices versus 155,684 indexed vertices, and 27,850,896 versus 7,357,504 attribute/index bytes (73.58% smaller). This measures assembled geometry buffers, not total GPU memory or frame-rate improvement. A regression fixture checks exact expanded position, normal and UV equality. All 196 tests across 44 files, TypeScript and production build pass; the existing large-chunk build warning remains. A fresh 1280 x 720 development browser review shows the exterior and seated cabin intact after entry, with no reported warning/error logs. Audio listening, controlled performance comparison and broader acceptance remain open. Raw measurement: .codex/review/car-buffer-measurement.json; reproduction: .codex/review/measure-car-buffers.ts.


Horn acknowledgment: keyboard H and the horn button now share one handler. The nearest same-direction car within 35 m ahead and 3 m laterally responds with two delayed amber indicator flashes. A four-second cooldown prevents repeated honks restarting the response. This doesn't change traffic speed, lanes or braking. Indicators use one instanced mesh without shadow casting. Four added tests cover selection, ignored cars, physical proximity across the route seam, cooldown and timing. All 200 tests across 44 files, TypeScript and production build pass (existing bundle-size warning remains). The fresh browser check reached scene compilation but had not reached the entry control when inspected; no warning/error logs were returned. In-motion flash visibility and horn listening aren't verified. The subsequent check reported that tab 36 was no longer part of the browser session, so it cannot be treated as a live pending check. A fresh visual check is required before acceptance. Goal remains active.


Current route and horn browser evidence: the normal scenic route reached Lakeside at 1280 x 720, device DPR 2. The 37 completed windows contain 8,880 frames and approximately 135.25 measured seconds, averaging 65.66 fps (window range 58.5 to 77), maximum driving interval 34.2 ms, no driving frames above 50 ms, and canvas density 1.5 throughout. Partial windows aren't included, so this isn't exact wall-clock journey duration. Entry and ignition still reached 166.7/190.8 ms with low submission time; those defects remain open. This single current run doesn't isolate the cause of earlier slow samples. Raw: .codex/review/indexed-car-full-route.json.

A development-only hornReview fixture then put one slower car ahead. Button and H input both recorded horn-acknowledged, and the amber rear indicator was visibly lit while Cruise followed at about 22 km/h. Horn listening remains unverified. The viewport changed to 1272 x 864 during that separate check; don't combine its timing with the normal route. Evidence: .codex/review/horn-browser-check.json and horn-acknowledgement.png. TypeScript/build passed and hornReview was absent from production output before subsequent contact-card work. Goal remains active.


Physical contact-card inspection: the card now releases from its glovebox clip before moving into a held reading pose, and reverses that path when put down. The clip stays on the glovebox. Object switching and ignition wait for the card to return; reduced motion applies the settled pose and refreshes shadows immediately. Desktop contact notes sit beside the visible card. At 390 x 660 the note sits below it, scrolls, keeps its close bar visible and shows email/GitHub before the biography. Accessible links and the quiet fallback remain available. Two new geometry/projection tests cover cabin bounds, release clearance and framing. The full suite passed 202 tests in 45 files, with five relevant tests repeated after the contact-link ordering change; TypeScript and production build passed. Browser checks cover desktop pickup/return, reduced motion with Follow device restored, subsequent ignition and the 390 x 660 iframe layout/close action. No warning/error logs were returned. Screenshots: .codex/review/physical-contact-card.png (final production view) and physical-contact-card-phone.png. This isn't physical-touch or final subjective acceptance; sustained performance measurements above precede this card change. Final production entry and card inspection also passed with no reported console warnings/errors. Remaining timing, listening, physical-device and subjective acceptance gates stay open.


Shoreline material pass: scenic terrain now uses the existing credited Forest Ground 04 normal map, four-metre texture repeats and up to 4x anisotropy. Access gravel has separate two-repeat texture transforms instead of inheriting the terrain's 160/140 repeat scale. No new assets were downloaded. Eleven low granite pieces follow the actual terrain/water boundary near the overlook, share the existing instanced rock draw, and add 1,584 triangles per submitted pass. Road and access clearances remain covered by the two passing landscape tests. TypeScript and build pass; the full suite wasn't repeated for this material/placement change.

The lake view and resume were checked in a fresh development scene with no reported warning/error logs. At 654 x 864, DPR 2, 4320 measured frames over approximately 47.16 seconds averaged 91.60 fps, with a 34 ms maximum and no frames above 50 ms. Canvas density stayed 1.5. This narrower viewport and different route segment aren't comparable to the earlier 1280 x 720 full drive, and don't prove a speedup. Park was requested afterward. Raw evidence: .codex/review/ground-material-resume.json and shore-ground-and-granite.png. The broad bank, dark rock appearance and illustrative horizon still need art-direction acceptance; this isn't a finished scenery claim. Normal maps add texture/shader work, so full-size sustained performance and resource-lifetime checks remain open.


Development reset investigation: a fresh scene stayed seated through a JSON evidence write, a documentation file containing an unused Tailwind utility, a screenshot save, pointer parking/resume, keyboard Space parking and removal of both probe files. Initial loading stages stayed identical (ready at 2,542 ms), one canvas remained, and no warning/error logs were returned. Both parking cycles ended with Back on the road and Turn engine off controls. Raw: .codex/review/preview-reset-check.json. The prior unexpected exterior view wasn't reproduced, so its cause remains unknown; don't claim a reset fix or attribute it to artifact writes. No application code changed, and tests/build weren't repeated for this browser investigation. Temporary probes were removed.


Turbo cruise and steered pull-over: normal Cruise retains its original speed. Optional Turbo targets up to 28 m/s on open straights, uses a cached curvature plan to brake before bends, and includes an earlier traffic braking envelope. Steering, accelerator or brake input cancels automatic control; the Turbo button re-engages it correctly afterward. Simulated scenic arrival: normal 140.98 seconds / 35.25 km/h peak, Turbo 94.65 seconds / 98.24 km/h peak, both Lakeside. These are simulation results, not browser journey timings. Turbo's full-route test asserts no traffic contact and stays within the road bound; an additional test stops behind a stationary car from 28 m/s without contact.

Parking completes its lateral move before the final stopping segment, derives body heading from the path, and derives wheel steering from yaw rate. The wheel turns back as the car straightens and rests centered when parked. Tests cover both steering directions, heading/path agreement, final alignment and existing access-road parking behavior. The 206-test full suite passed, then the added stopped-car scenario passed with the other three new tests; TypeScript/build passed after final UI copy and parked-wheel changes. Production browser checks cover Turbo on, steering takeover, Turbo re-engagement, visible wheel/body turn during parking and a centered wheel at rest, with no reported warning/error logs. Screenshot: .codex/review/steered-pull-over.png. Short development driving showed Turbo respecting slower traffic. Full browser Turbo-route timing, phone controls, listening and Bryce's handling acceptance remain open. The durable goal now includes these two requested behaviors; overall completion remains unproven.


Turbo compact controls: the 660 x 390 iframe review fits Cruise, Turbo, speed hold, horn and gears above the pedals, with menu/sound still separate. Turbo activation succeeds and pointer Brake changes both Cruise and Turbo to off. Screenshot: .codex/review/turbo-phone-landscape.png. This isn't physical-device or multi-touch verification. No source changes or test reruns were needed. The following full-route attempt was interrupted by a browser connection/session restart before ignition and has no timing result; the surviving preview was ready outside.


Turbo browser route follow-up: after the browser session restarted, port 3001 had no listener and the old development-server process was gone. The server was restarted and a fresh localhost tab loaded successfully. The trip began in normal Cruise, then Turbo was enabled shortly afterward. It reached Lakeside and parked with Back on the road and Turn engine off available. Observed speeds included 98 km/h on an open stretch and 50 km/h later. No warning/error logs were returned.

At 1280 x 720, device DPR 2, the 28 completed driving windows contain 6,720 frames over approximately 88.12 measured seconds, averaging 76.26 fps. Window rates range from 52.5 to 93.2 fps, with a maximum interval of 141.6 ms and two frames above 50 ms. Sampled canvas densities were 1.35, 1.05 and 1.15. This is adaptive-resolution performance, not a fixed-resolution comparison or exact wall-clock journey duration. The full test suite ran concurrently during the beginning of the trip, so early performance is also confounded by that workload. All 207 tests across 46 files passed. No source changes were made during this verification pass. Evidence: .codex/review/turbo-browser-route.json and turbo-browser-arrival.png. Physical touch, audio listening, entry/ignition stalls and Bryce's handling/visual acceptance remain open. The broader goal remains active.


Current texture/card/traffic cleanup follow-up: two complete browser mounts each reached 276 geometries, 58 textures and 77 programs. The first included cabin entry and contact-card pickup/return. Both unmounts reported zero geometries, two textures and five programs with contextLost=true. A separate shader-compilation cancellation reported zero geometries, one texture and zero programs with contextLost=true; no canvas remained afterward. No warning/error logs were returned. Evidence: .codex/review/turbo-card-ground-lifetime.json. These are renderer counters and explicit context release, not GPU byte measurements or proof of zero retained JavaScript/audio memory. No application changes or repeat test/build runs were needed. Longer sessions, physical hardware, audio listening, entry/ignition stalls and visual acceptance remain open.


Granite material follow-up: scenic rocks now use a deterministic 128 x 128 neutral mineral-grain texture instead of the brown forest-floor map. The material no longer multiplies that map by the previous brown base tint; final stone colour is restrained grey after a brighter first pass was rejected in browser review. Normals are recomputed after the rock vertices are shaped. The existing instanced geometry/count remains unchanged. The texture is generated locally with mipmaps and is collected through the existing scene material resource traversal. TypeScript, both landscape clearance tests and the final production build pass; the existing bundle-size warning remains. A fresh lake fixture was entered and inspected at 1280 x 720 with no warning/error logs. Screenshot: .codex/review/granite-material-final.png. The broad bank and visibly faceted rocks still need further visual work. This material pass doesn't establish scenery acceptance or a new sustained-performance/resource-lifetime result.


Overlook contour follow-up: the scenic lake no longer preserves an unused circular building forecourt. Its dry bank follows the access road with an 8-to-13-metre terrain blend; the prototype retains its original forecourt. The measured centre-view shoreline is now 10 metres from the parked car, previously 17. The Lakeside sign moves four metres toward the dry access side. Shoreline rocks now reserve the actual road shoulder instead of the unused stop marker area, with a six-metre lane-centre clearance plus each rock's horizontal radius. Their total count is now 631 rather than 594, adding 5,328 triangles per submitted pass in the same existing instanced draw.

All ten terrain/landscape tests pass, including dry main pavement/access shoulders, dry sign footing, shoreline distance, lake sightline and rock clearance. TypeScript and the final production build pass with the existing chunk warning. Fresh browser entry at the lake shows the central mound removed; no warning/error logs were returned. Evidence: .codex/review/shoreline-contour-final.png. The rock line still looks too regular and the horizon remains illustrative, so visual acceptance stays open. Full-route performance and cleanup measurements precede this contour/placement change. The browser review tab disappeared once during this pass; the server was confirmed live and a fresh tab was used without restarting it.


Shore rock composition follow-up: shoreline pieces now form deterministic groups, leave a central opening toward the lake, vary their water-edge offset and use smaller sizes. Shared normals across duplicate positions soften the shading without changing polygon count or UV seams. Total rock instances fell from 631 to 607, removing 3,456 triangles per submitted pass in the same instanced draw. Both landscape clearance tests, TypeScript and build pass. Fresh 1280 x 720 browser entry at the lake confirms an open water view and smaller side groups, with no warning/error logs. Evidence: .codex/review/shore-rock-clusters.png. The distant mountain silhouette remains visibly illustrative, and this pass doesn't establish overall visual acceptance or fresh sustained performance. No full-suite repeat was needed for this isolated material/placement change.


Distant ridge follow-up: the scenic sky shader now adds finer ridge edges and restrained slope shading to its existing two mountain layers. An initially blotchy version was reduced after browser inspection. No meshes, textures or draw calls were added, though fragment arithmetic increased. TypeScript and final production build pass; actual shader compilation and lake entry were checked in the browser. Final screenshot: .codex/review/ridge-shading-final.png. Resume reached the main road with no warning/error logs. One observed 240-frame window at 1280 x 720, DPR 2, canvas density 1.5 ran at 73.5 fps with a 17.6 ms maximum and no frames above 50 ms. Raw subsequent profile: .codex/review/ridge-resume-profile.json. This is a short moving spot check, not a full-route or controlled performance comparison. Pull-over was requested afterward. The background remains procedural and overall scenery acceptance is still open; don't describe this as photographic terrain. Full tests weren't repeated for the isolated shader change.


Entry draw-hitch investigation: added opt-in development timing checkpoints for simulation, audio/instruments, camera/objects, world updates and draw submission. Slow work captures include before/after renderer resource counters and first-drawn mesh descriptions, bounded to sixteen records. Production uses no-op profiling methods. A fresh entry reproduced a 73.3 ms callback with 72.9 ms in draw submission while renderer counts increased from 276 geometries / 77 programs to 278 / 78. A subsequent trace identified two MeshStandardMaterial BufferGeometry meshes directly in the road-world group. Extra camera warmup views did not fix it and were reverted.

The final change temporarily disables mesh frustum culling only for the first hidden warmup render, restoring each previously enabled flag immediately afterward, including on errors. This uploads off-camera road buffers before the visible approach. The next entry had no work stalls above 20 ms and maximum application work of 7 ms. Readiness was recorded at 3,221 ms. This moves work before the approach; it isn't a faster-loading claim. A separate early entry interval still reached 216.6 ms with 5.1 ms of application work, and ignition reached 233.4 ms with at most 10.1 ms of application work. Both were the fourth motion sample. Their cause is unresolved, so entry/ignition hitch acceptance stays open. The desktop viewport was 1280 x 720, DPR 2; no warning/error logs were returned. Pull-over was requested after saving evidence.

Evidence: .codex/review/entry-work-first.json, entry-resource-hitch-before.json, entry-first-mesh-hitch.json, entry-road-warmup-after.json and entry-road-warmup-ignition.json. TypeScript and production build passed. Full regression suite result follows separately. No physical-device, long-session or audio listening acceptance is claimed.

Warmup regression result: all 207 tests across 46 files passed after the final change. The separate early-frame stalls remain open.


Early-stall comparison follow-up: the existing two-second delayed-entry control still produced a 191.6 ms interval at motion sample three, with maximum application work of 8.9 ms. A temporary development-only audio-initialization bypass produced a 199.2 ms interval at sample three with maximum application work of 14.8 ms. Removing backdrop blur from the persistent menu/sound buttons produced a 278.8 ms interval at sample four; its trace also showed a separate 27.7 ms work sample, without new renderer resources. These are separate local runs with variable load, not controlled effect-size measurements. Neither bypass eliminated the early interval stall.

Both temporary experiments were reverted. The audio bypass query is no longer supported. The existing road-buffer warmup fix remains. Evidence at 1280 x 720, DPR 2: .codex/review/delayed-entry-audio-on.json, delayed-entry-audio-off.json and delayed-entry-no-button-blur.json. The silent comparison returned no warning/error logs. No final application changes were retained, so the preceding 207-test/TypeScript/build result remains the last regression result; tests weren't rerun for the reverted comparisons. Direct GPU/compositor timing is the next useful evidence, and the cause of the early entry/ignition stalls remains unresolved.


GPU timing follow-up: the available browser exposes EXT_disjoint_timer_query_webgl2. The opt-in development profiler now brackets draw submission with asynchronous elapsed-time queries, permits at most four pending queries, reads only available results, discards disjoint measurements and releases queries on disposal. Unsupported contexts continue without GPU timing. Recent samples are bounded to 600, with a separate 32-sample slow history so later driving doesn't erase an early stall. No synchronous GPU wait was added. Production output contains none of sceneGpu, sceneCapabilities or sceneWorkStalls.

The first browser capture at 1280 x 720, DPR 2 recorded an early entry draw of 90.536 ms on the GPU, followed by approximately 14-to-19-ms draws. Entry's maximum frame interval was 108.4 ms while maximum application callback work was 9.8 ms. This establishes a graphics-side delay in that capture, not its underlying driver or rendering-pass cause. Ignition later reached a 157.4-ms interval with at most 4.8 ms of application work, but its corresponding GPU samples had rolled out before collection; don't infer an ignition GPU duration from that run. The separate slow history was added afterward to avoid that evidence loss. Entry/ignition acceptance remains open.

Evidence: .codex/review/entry-gpu-timing.json and ignition-gpu-timing.json. No warning/error logs were returned during entry/ignition. Four new timer tests pass, covering unavailable results, pending-query limits/disposal, disjoint samples and unavailable extensions. TypeScript and final production build pass. Full regression result follows separately. No physical-device, subjective visual or audio listening acceptance is claimed.

GPU profiler regression result: all 211 tests across 47 files passed after the final sample-retention change.


Stationary shadow preparation: a temporary no-shadow comparison completed entry with a 33.4 ms maximum interval and no frames above 50 ms, unlike the earlier GPU spike. That switch was removed and normal shadows restored. Entry and ignition now request a shadow render while the camera is stationary and asynchronously wait for the existing bounded GPU fence before beginning their animation. This preserves shadows and moves the graphics preparation before visible movement. Repeated entry/start/exit requests are guarded while preparation is pending; disposed scenes don't resume after the wait. The animation clock resets before movement. Reduced motion skips preparation entirely.

The first prepared entry waited 214 ms before movement, then reached a 25.9 ms maximum interval without frames above 50 ms. The final direct-input check waited 277 ms for entry and 183 ms for ignition. Their animation maxima were 34.1 and 33.4 ms respectively, again with no frames above 50 ms. These are local measurements at 1280 x 720, DPR 2. This is a tradeoff of a short stationary response delay for smoother animation, not a claim of eliminating that preparation cost or improving all frame rates. Fresh physical-device and subjective acceptance remain necessary. The existing fence can time out after three seconds on a slow or unresponsive GPU, so that worst-case response delay still needs hardware review.

Browser checks confirmed entry, ignition, parking, reduced-motion exit/re-entry and engine restart. The reduced-motion actions added no shadow-preparation stages, and Follow device was restored. No warning/error logs were returned during the final normal-motion check. All 211 tests across 47 files, TypeScript and the final production build pass; the existing chunk warning remains. Evidence: .codex/review/entry-no-shadows.json, entry-shadow-prime-first.json, shadow-prepared-entry-ignition.json and shadow-preparation-reduced-motion.json. Full production/hardware response timing, abort-during-preparation browser coverage and long-session cleanup remain open. The broader goal remains active.


Preparation cancellation browser follow-up: the development lifecycle review can now unmount at entry or ignition shadow preparation, in addition to shader compilation. Preparation stages emit resource snapshots only with development profiling enabled; the new review labels are absent from production output. Real browser cancellation at each preparation stage released the context and left zero canvases. Each disposal reported zero geometries, two textures and five programs with contextLost=true. A subsequent normal mount reached the same 285 geometries, 62 textures and 78 programs as both earlier mounts, then disposed with the same counters. No warning/error logs were returned. This closes the previously missing browser check for aborting the new preparation wait.

Evidence: .codex/review/motion-preparation-cancelled.json and motion-preparation-recovery.json. TypeScript, production build and twelve focused GPU fence/timer/resource tests pass. The preceding full suite remains 211 passing tests; it wasn't repeated for these development review hooks. These counters and context release don't measure GPU bytes or prove zero retained JavaScript/audio memory. Long-session, physical-device, production response timing and subjective acceptance remain open.


Full-route measurement follow-up: ordinary `?profile=journey` now leaves GPU timer queries disabled; add `&gpuProfile` for those measurements. TypeScript and the production build passed. Two normal-cruise runs reached Lakeside with no warning/error logs at 1280 x 720, device DPR 2, canvas density adapting from 1.5 to 1.2. The first recorded 10,560 frames across 44 completed windows, approximately 78.3 fps, five intervals above 50 ms and a 416.5 ms maximum. The repeat had no browser observations between ignition and arrival: 9,360 frames across 39 completed windows, approximately 68.7 fps, eleven intervals above 50 ms and a 229.2 ms maximum. Completed windows exclude partial samples and aren't exact trip duration. Variable results don't establish a speedup or implicate browser inspection as the cause.

In the uninterrupted repeat, entry, ignition and parking had no intervals above 50 ms; entry/ignition preparation waited 253/222 ms. Approach still reached 128.7 ms. Two long application callbacks coincided with adaptive density changes, but the current simulation checkpoint includes resize work, so they aren't evidence of expensive physics. Other long driving frames lacked substantial script attribution. Driving hitch acceptance remains open. Evidence: `.codex/review/current-complete-scenic-route.json`, `current-route-uninterrupted.json` and their arrival screenshots. Physical-phone, audio listening, production response timing and subjective acceptance weren't checked in these runs. Bryce's feedback on the preparation delay remains pending.

Startup follow-up: texture uploads now yield between batches before the existing hidden renders. Two measured mounts took 2.6-2.7 seconds, with first warmup render reduced to 225-230 ms from the previous 753-883 ms block. Total readiness isn't demonstrably faster; setup still has a 615-695 ms block and the historical 48.4-second remount remains unresolved. All 223 tests, TypeScript and build pass. Preserve the accepted handling.

Car setup follow-up: panel reconstruction now yields between batches, preserving geometry and handling. Cancellation during construction and a successful retry are browser-verified. Two ready times were 2.8/3.0 seconds; total loading isn't faster, but the former 552 ms panel block is split. All 226 tests, TypeScript and build pass. B05 and overall scenery/hardware/audio acceptance remain open.

Production keyboard/reduced-motion follow-up passes entry, laptop notes, racket, contact card, instant Lakeside arrival, engine-off and the plain /projects fallback. An observed engine-off focus loss is fixed and confirmed in the rebuilt preview. Eight Entrance tests, TypeScript and build pass after the last full 226-test run. Next return to near-ground scenery and lake composition; preserve the accepted driving settings.

Overlook composition: eight low foreground granite instances now frame the seated lake view while retaining the prior waterline clusters and clear central view. Total granite instances are 615, using the existing draw mesh. Road/access clearance tests, TypeScript and build pass. The parked screenshot is in porsche-review.md. Moving approach, sustained performance after this change and final visual acceptance remain open; driving and terrain heights are unchanged.

Latest full route includes loading changes and foreground granite: 67.1 fps across 9,120 measured frames, two intervals above 50 ms, maximum 75.1 ms. One stall is attributed to canvas resizing. The viewport changed by the final capture, so this isn't a controlled fixed-size comparison. Normal arrival completed without browser errors. Intermediate moving visual review, occasional stalls and broader acceptance remain open.

Responsive reader follow-up: production portrait/landscape resize checks found undersized laptop text at 844 x 390. Short viewports now use the compact embedded layout, verified with readable larger text and keyboard access to the fourth project. A resize guard skips unchanged/zero dimensions. TypeScript/build pass, default viewport is restored, and physical-phone/resize-latency acceptance remains open.

Compact project return now scrolls the previously opened folder into view when restoring keyboard focus. The production check confirms the fourth folder is fully visible after return. Eight Entrance tests, TypeScript and build pass. A project-evidence question is pending with Bryce; no demo links or outcomes have been assumed.

Current regression audit: all 226 tests pass after the latest reader/resize changes. Shader and entry-preparation cancellation, subsequent retry and final disposal pass in the browser with stable ready counts and zero canvases after cleanup. Renderer counters don't establish memory-byte retention. B05, visuals, audio, physical hardware and project evidence remain open.

Roadside groundcover: 2,374 accepted fern placements now fill more of the nearby bank within the existing 64-instance limit. Sampled route maximum is 61 visible candidates. Grounding/clearance tests and build pass. An early road sample averaged 74.5 fps over 4,080 frames with no intervals above 50 ms; this isn't a full-route comparison. Broad forest composition and final visual acceptance remain open.

Exterior paint: normal-map and coat-removal comparisons didn't resolve the uneven reflection issue, so both source features are retained. Lower metalness/environment reflection and higher roughness now soften the green finish. TypeScript/build and fresh browser logs pass. This remains a visual candidate; body-surface and moving-view acceptance are open.

Audio cleanup now aborts pending recording requests and skips decoding bodies that finish after disposal. All 228 tests, TypeScript and build pass. Tests use an audio/fetch harness; listening, physical-browser request timing and memory-byte retention remain unverified. Playback tuning and driving settings are unchanged.


## Startup investigation and terrain scheduling, 6 September

The shoreline material change reproduced a 52.1-second development startup; its cause remains open as B05. New shader-submission and landscape-stage diagnostics captured three ordinary 2.4-3.3-second starts. The ground-height loop now yields between short batches, reducing one uninterrupted setup task while preserving geometry and accepted driving settings. Seven focused tests, TypeScript, build, terrain cancellation and successful remount checks pass. See VERIFICATION.md for measured task durations, raw evidence and limits. Continue investigating remaining startup blocks and the intermittent shader delay, then finish the visual, content, audio and device acceptance requirements.


## Current sustained-drive check, 6 September

The current full suite passes 229 tests. Normal Cruise completes the route at a fixed 1280 x 720 viewport and render density 1.35. The latest run averaged 75.3 fps over 10,320 frames, but a 1.7-second early pause remains an open performance defect. Browser attribution contains no script for that event and no slow scene callback was recorded. Entry, ignition and parking stayed below 35 ms. See VERIFICATION.md and Q02 for exact evidence and boundaries; don't treat the average as acceptance of smoothness.


## Direction handoff, 6 September

Website direction confirmed AgentSky as the first complete portfolio example. Its original-checkout discussion notes are at /Users/bryce/claude-hub/personal-projects/bryce-rambach-portfolio/docs/portfolio-presentation-notes.md. Don't ask Bryce to select a lead project again. Those notes explicitly haven't authorized video production, publishing or changing the default homepage. Use verified implementation evidence and keep simulated operations labeled. The current Trace source note remains valid.

After the bounded graphics-loss recovery check, prioritize visible cabin/scenery and meaningful project presentation. Keep lag investigations tied to a specific visitor action and hypothesis. Bryce's latest direct driving acceptance remains in force; clean averages don't close the documented timing defects.


## AgentSky presentation, September 6

The lead AgentSky design study is now available at `/projects/agentsky`, linked through the shared project reader. Four fresh screenshots document simulated interactions. See `agentsky-content-evidence.md` for source evidence, checks and limits. This advances project presentation without changing accepted handling. Overall visual, performance and hardware acceptance remain open.


## Low roadside grass, September 6

Added short slope-aligned grass patches around the existing roadside fern locations. One instanced mesh is capped at 128 patches and 4,608 triangles, with a 58 m radius and a 14 m fade at the distance or instance cutoff. Geometry and material are registered with scene resources. No texture downloads or driving changes.

Fresh desktop review at 1280 x 720 shows the cover outside the passenger window and beside the moving road. The opening sample contains 2,400 frames at fixed 1.35 density, about 69.3 fps, maximum 26.9 ms and no frame above 50 ms. Startup reached readiness in 3,383 ms. No browser errors or warnings were recorded. Four grass/fern tests, TypeScript and build pass.

Evidence: `.codex/review/roadside-grass-seat.jpg` and `.codex/review/roadside-grass-drive.json`. This is a modest foreground addition. Sparse tree silhouettes, broad bare banks and overall scenery acceptance remain open. The full route, physical hardware, audio and resource disposal after this addition weren't rechecked. The earlier full-route hitch remains open.


## Combined regression and cabin project navigation, September 6

All 235 tests across 52 files pass after the AgentSky and grass additions. The older cabin-object test incorrectly prohibited the now-intended project links. It now checks the exact AgentSky and Trace destinations, includes all five projects, and retains the assertion that opening project notes doesn't navigate away. Log: `/tmp/porsche-current-regression.log`.

Live desktop review confirms the AgentSky note and study link fit the physical laptop. At 390 x 844, Tab scrolls the link into view with a visible focus outline. Return opens `/projects/agentsky`, with the correct title, zero canvases and no browser errors or warnings. The viewport override was reset. Screenshot: `.codex/review/agentsky-cabin-narrow.jpg`.

This confirms the cabin-to-study path in the available browser. It doesn't establish physical touch behavior, browser back restoration, memory-byte retention or sustained driving performance. Accepted handling remains unchanged. Scenery, the known timing outliers, audio audition and hardware acceptance remain open.


Mature fir investigation: a CC0 variant was prepared and compared in the cabin. Both the simplified and full versions left too much bare trunk in the roadside view, so the original forest and tree budget are restored. The candidate is retained outside public assets. See `mature-fir-review.md`. Next visual work needs a mixed canopy and lower growth, rather than replacing every tree with one taller model. Q01 remains open.


## Young fir layer and full-route check, September 6

Added 900 candidate young-fir placements beneath the existing canopy, using the same source model, atlas and render budgets. Accepted plants are roughly 3.0 to 5.8 m high, outside the road, turnoff and water exclusions. The original taller canopy remains. No new public asset, draw mesh or driving tuning was introduced. Grounding/clearance checks, TypeScript and build pass.

The fresh 1280 x 720 browser run reached Lakeside with no console warnings or errors. It contains 9,840 measured driving frames, averaging 72.9 fps, with one 83.2 ms interval. Adaptive density changed from 1.35 to 1.2. The slow application callback records 82 ms in `quality-resize`, 0.3 ms simulation, 0.2 ms world update and 3.8 ms drawing. Renderer resource counts stayed unchanged across that callback. The earlier 1.7-second unattributed pause didn't recur, but isn't closed by this run.

Approach, entry, ignition and parking maxima were 25.8, 25.0, 25.3 and 17.8 ms. Two intermediate screenshots/readouts were taken during the route. No builds, tests or source edits ran between ignition and arrival. Sound was muted. This is a complete adaptive-quality route check, not a fixed-density benchmark or an audio audition.

Evidence: `.codex/review/understory-full-route.json`, `understory-seat.jpg`, `understory-arrival.jpg`. The lower planting is visible along the road and leaves the central lake view clear. Repeated silhouettes, terrain finish and final visual acceptance remain open. Physical touch and weaker hardware weren't checked. The next bounded performance task is the attributed render-resolution hitch.


## Geometry before canvas resizing, September 6

The prior full-route hitch had 82 ms in the actual canvas resize. Inspection of the installed Three.js renderer found no duplicate resize call: `setPixelRatio` changes the drawing buffer through `setSize` once. The controller now tries the existing two-tree detail budget after sustained frame intervals above 18 ms, before reducing pixel density. If the next observation window is still slow, density drops as before. The lower tree budget persists for the visit to avoid repeated detail changes.

Ten controller tests pass, including recovery to steady frame rates without a buffer resize and continued density reduction when slowness persists. TypeScript and build pass. Logs: `/tmp/porsche-geometry-first-tests.log`, `/tmp/porsche-geometry-first-types.log`, `/tmp/porsche-geometry-first-build.log`.

A complete fresh browser route reached Lakeside. At 1280 x 720 and density 1.35, 9,840 measured frames averaged 72.5 fps, maximum 26.7 ms, with zero intervals above 50 ms. Approach, entry, ignition and parking stayed below 26 ms. No browser errors or warnings. Evidence: `.codex/review/geometry-first-full-route.json`.

No quality adjustment triggered during this run, so it doesn't prove the changed branch avoids the observed resize hitch on hardware. That behavior is covered by controller tests only. The 82 ms resize cost itself is unchanged, and the historical unattributed 1.7-second pause remains open. The run used muted audio, two intermediate DOM observations, and no builds or source edits between ignition and arrival. Physical hardware and visual acceptance remain open.


## Current vegetation cleanup and regression, September 6

Three ready mounts of the current scene each reported 286 geometries, 62 textures and 80 programs. Normal unmounts reported 0 geometries, 2 textures and 5 programs with the graphics context released and zero canvases. Shader-compilation cancellation also released the context, and a subsequent normal retry reached the same ready counts. No browser errors or warnings. Evidence: `.codex/review/current-vegetation-lifecycle.json`.

Renderer counters aren't retained memory bytes. This check doesn't establish long-session memory usage or physical-device behavior. No driving was performed during these lifecycle cycles. The earlier full-route evidence remains separate.

All 235 tests across 52 files now pass after the young firs and geometry-first quality policy. Log: `/tmp/porsche-current-regression.log`. The concise review guide has been updated with current measurements, screenshots, project links and unresolved issues instead of the stale earlier figures.


## Preserve the cabin when opening a design study, September 6

The embedded laptop's AgentSky link now uses a separate browsing context with `target="_blank"` and `rel="noopener noreferrer"`. Its accessible name announces the new tab. The standalone project reader keeps normal same-tab navigation. This prevents a full project study from replacing the visitor's cabin page.

Seven focused cabin/reader tests, TypeScript and production build pass. In the production preview, activating the study link left the original cabin URL and selected AgentSky note intact. Escape then closed the laptop and restored focus to the cabin canvas. No browser errors or warnings were recorded.

The in-app browser didn't expose the destination as a controllable tab, so its tab lifecycle and return behavior weren't verified. The study route itself was verified in earlier work. Physical-phone behavior remains untested. Logs: `/tmp/porsche-study-return-tests.log`, `/tmp/porsche-study-return-types.log`, `/tmp/porsche-study-return-build.log`. No handling changes.


## Audio return and disposal failures, September 6

Tab visibility calls CarAudio.suspend/resume. Those methods previously left rejected AudioContext promises unhandled. They now report live-context failures through the existing sound-unavailable callback, ignore failures after disposal, and refuse to resume or suspend an already disposed instance. A rejected close during disposal is contained as cleanup, without showing a stale warning.

Thirteen focused audio/preference tests pass. New checks cover no context creation before activation, preserved mute and volume through suspension, rejected resume/suspend, and ignored late failures after disposal. TypeScript and build pass. Logs: `/tmp/porsche-audio-return-tests.log`, `/tmp/porsche-audio-return-types.log`, `/tmp/porsche-audio-return-build.log`.

The rejection checks use the audio test harness. A real browser interruption wasn't induced, and this isn't a listening review. Engine mix, RPM response, shift tuning and accepted handling are unchanged. A targeted listening question is pending with Bryce, so Q03 remains open.


## Generated alpine backdrop, September 6

The scenic sky now uses a generated 1774 x 887 alpine panorama for the distant ridges and sky, while preserving the existing afternoon-to-evening tint. Road, terrain, trees and lake water remain geometry. The procedural sky is retained as a load-failure fallback. The selected PNG is 1,552,226 bytes and is registered with scene resources. City and multi-stop prototype sky behavior is preserved.

Reduced-motion entry and Lakeside arrival were reviewed, followed by restoring Follow device and resuming normal driving. The short departure run contains 4,560 measured frames at about 78.8 fps, maximum 25.9 ms, with zero intervals above 50 ms and no browser errors or warnings. This isn't a full-route benchmark. TypeScript and the final production build pass. Sound remained muted.

Evidence: `.codex/review/panorama-overlook.jpg`, `panorama-driving.jpg`, `panorama-departure.json`. Prompt, source path and generation limits are in `alpine-panorama-prompt.md`. The follow-up high-resolution request returned the same dimensions and wasn't selected. The current image remains somewhat soft when projected across a large view.

Full-route performance with this texture, load-failure fallback, panorama seam/pole review, cleanup after this extra texture, physical hardware and final subjective visual acceptance remain open. Near terrain finish still needs attention. This doesn't close the historical timing defects.


## Panorama loading and cleanup, September 6

The panorama and asphalt texture requests now start together. They have no dependency, so the road texture no longer waits for the optional background request to finish. The existing procedural fallback and resource-liveness guard remain.

The combined regression suite passed 238 tests across 52 files before this request-order change. TypeScript, build and a fresh browser mount pass afterward. Shader-compilation cancellation leaves zero canvases and releases the context. A normal retry reaches 286 geometries, 63 textures and 80 programs, then unmounts to 0 geometries, 2 textures and 5 programs with contextLost true and zero canvases. No browser errors or warnings. Evidence: `.codex/review/panorama-lifecycle.json`.

This checks the extra texture's cleanup path through renderer counters, not retained memory bytes. No full-route timing, panorama seam or failed-image-load check was performed in this pass. Logs: `/tmp/porsche-panorama-regression.log`, `/tmp/porsche-panorama-parallel-types.log`, `/tmp/porsche-panorama-parallel-build.log`.


## Missing panorama fallback, September 6

An isolated production preview on loopback port 3062 served the built site and intentionally returned HTTP 404 for `/images/entrance/alpine-panorama-v1.png`. The regular previews and public asset were unchanged. The fixture server logged the intended missing-image request.

The car reached readiness, entry worked, and reduced-motion ignition reached Lakeside with the procedural mountain backdrop visibly rendered. No browser warnings or errors were returned by the browser log tool. Evidence: `.codex/review/panorama-fallback-overlook.jpg`, `panorama-fallback.json`, and the retained `panorama-fallback-server.py` fixture. The isolated tab was closed and its server stopped afterward.

This verifies an HTTP failure, not a request that hangs indefinitely or a corrupt-but-successfully-downloaded image. It doesn't establish sustained driving performance with either backdrop. The panorama's full-route timing, seams, physical hardware and final visual acceptance remain open. No application change was needed for this check.


## Driving accepted and panorama route collected, September 6

Bryce said “driving feels good.” Keep steering, acceleration, gears, Cruise, Turbo and parking tuning as they are. This feedback accepts the driving feel, not the completed site's visual polish.

The existing normal Cruise run in tab 61 reached Lakeside. Its 44 driving windows contain 10,560 frames at a weighted 78.2 fps, maximum 358.4 ms and five intervals above 50 ms. Entry and ignition stayed below 26 ms. Parking recorded two slow intervals, maximum 174.7 ms. Density changed from 1.35 to 1.2 after detailed trees were reduced. A 51.8 ms quality resize was attributed; the larger late-route delays remain unexplained by the short recorded render submissions. Browser warning/error logs were empty. Sound was muted and viewport was 1280 x 720. Evidence: `.codex/review/panorama-full-route.json` and `panorama-full-route-arrival.jpg`.

The next visual work is bringing the water, shoreline and nearby ground into the backdrop's lighting and composition. Don't add further plant instances or request another backdrop to address that join. Panorama seams, subjective engine listening, physical hardware and final visual acceptance remain open. No application tuning changed in this feedback pass.


## Lake and shoreline tones, September 6

The scenic water now uses a darker slate-blue shallow tint instead of the pale turquoise mix. The sand treatment reaches closer to the access lane and extends across the low shore, with a cooler granite-sand palette and less texture contrast. The original journey water palette is preserved. No geometry, plant instances or driving tuning changed.

A reduced-motion browser arrival at 1280 x 720 confirms the shader renders, the lake reads darker and the broad brown strip now blends into the pale shoreline. No warning/error logs were returned. Evidence: `.codex/review/shore-tone-arrival.jpg`, compared with `panorama-full-route-arrival.jpg`. The movement preference was restored to Follow device afterward. TypeScript and production build pass (`/tmp/porsche-shore-types.log`, `/tmp/porsche-shore-build.log`).

This is a material and color pass, not final visual acceptance. The shoreline remains broad and level, and the distant horizontal join still needs review. No new sustained-route measurement, physical-device check or listening test was performed for these material changes.


## Distant fog and camera-turn review, September 6

The evening scenic fog changed from purple to blue-grey. A fresh reduced-motion arrival confirmed the far terrain band now sits closer to the lake color. Evidence: `.codex/review/horizon-tone-forward.jpg`. The far shore is still too smooth and level; this color correction doesn't finish its shape or detail.

Three right-arrow camera turns revealed a thin dashed line by the side-window divider. A trial panorama wrap blend didn't remove it and was reverted. The line appears related to cabin/window geometry, but its exact source isn't established. Keep this artifact open rather than claiming a panorama seam fix. Browser warning/error logs were empty. Follow device was restored after review. TypeScript and build passed before the trial; the final build was rerun after reverting it. This wasn't a sustained-drive, audio or hardware check.

Website direction reports that Bryce questioned the absence of other scenes. Clarification about restoring destinations as car-view stops is pending. Don't expand destinations yet or describe the single route as satisfying his full vision. No completion estimate was accepted. Continue shared cabin, portfolio, scenery and reliability work.


## Side-window isolation, September 6

Glass parts no longer cast opaque shadows or receive self-shadowing. Four focused door/cabin tests, TypeScript and build pass. This is retained as a glass-rendering correction, not as a fix for the dashed window line.

A fresh reduced-motion Lakeside view with three right-arrow camera turns still showed the line. A second fresh scene with glass opacity temporarily set to zero showed it in the same position. The opacity change was reverted to .13 and the isolated tab closed. Evidence: `.codex/review/window-line-without-glass.jpg` is a diagnostic image, not the final appearance. Follow device was restored. Source glass and sticker textures were inspected without altering the assets.

These checks rule out the glass texture and glass shadow flags as the line's cause. The frame and nearby source geometry require isolation next. Don't repeat panorama blending or glass-opacity experiments. No sustained-route, exterior-shadow acceptance, physical-device or audio check was performed. Logs: `/tmp/porsche-glass-tests.log`, `/tmp/porsche-glass-types.log`, `/tmp/porsche-glass-build.log`.


## Panorama wrap artifact fixed, September 6

The earlier window/antenna diagnosis was wrong. Hiding the imported body and door left the dashed line visible from the sky down to the water. Evidence: `.codex/review/panorama-line-without-body.jpg`. A replacement antenna also failed to change the artifact and was reverted. The original antenna, body visibility and glass opacity are restored.

The panorama shader now supplies explicit texture gradients, wrapping the longitude derivative back into its local range. The atan longitude discontinuity had caused inappropriate coarse mip selection along the wrap. A fresh scene with the corrected shader removed the dashed strip at the matching three-right-arrow Lakeside angle and at the adjacent fourth-arrow angle. Evidence: `.codex/review/panorama-gradient-side.jpg` and `panorama-gradient-adjacent.jpg`. No new texture, geometry or panorama color blend was added. No browser errors or warnings were returned. Movement was restored to Follow device.

TypeScript and build pass (`/tmp/porsche-panorama-gradient-types.log`, `/tmp/porsche-panorama-gradient-build.log`). Four focused door/cabin tests passed earlier in this investigation. The diagnostic source-model scripts are retained in `.codex/review/inspect-car-high.ts` and `check-antenna.ts`; the latter now reports no replacement antenna. These checks don't establish full-route performance, all panorama poles/edge content, physical-device behavior or audio acceptance. The far shore remains too level and broad.


## Current visuals full-route measurement, September 6

All 239 tests across 52 files pass (`/tmp/porsche-current-regression.log`). The regression process completed before normal entry and ignition. No source edits or builds ran during the subsequent Cruise route. Tab 66 reached Lakeside normally with sound muted and default 1280 x 720 viewport.

The 30 driving windows contain 7,200 frames at weighted 54.1 fps, maximum 88.2 ms and four intervals over 50 ms. Adaptive density reached .85. Four work-stall records attribute 81.9, 66.6, 65.2 and 48.7 ms to quality resizing; simulation and ordinary draw submissions were much shorter. Entry measured 34.1 fps and maximum 51.5 ms; parking measured 50.8 fps and maximum 41.2 ms. The earlier approach overlapped regression-suite activity, so don't treat its timing as an isolated baseline. No browser warning/error logs were returned.

Evidence: `.codex/review/gradient-full-route.json` and `gradient-full-route-arrival.jpg`. This run contradicts consistent 60 fps on the available browser. It doesn't isolate the panorama gradient change as the cause of the lower average: these are separate sessions with uncontrolled machine/browser load. The resize stall is directly attributed and remains a priority. Don't claim a clean performance pass or repeat full routes without a new hypothesis or change. Next investigate canvas reallocation/GPU synchronization and whether quality can settle with fewer reallocations. Driving physics remain accepted and unchanged. Physical hardware and engine listening remain unverified.


## Fewer adaptive reallocations, September 6

The controller now estimates a resolution reduction from measured frame time and pixel area, bounded between the existing .15 step and .3. It still tries fewer detailed trees first, retains the .85 floor and slow recovery, and keeps the existing small step near 60 fps. A sustained 25 fps fixture now reaches .85 from 1.35 with two reallocations instead of four. All 11 quality tests, TypeScript and build pass (`/tmp/porsche-quality-settle-*`). Driving physics are unchanged.

A bounded normal-motion browser drive captured 3,600 frames at weighted 61.0 fps, maximum 91.7 ms and four intervals above 50 ms. Actual density settled through 1.13, .98 and .85, with resize costs of 72.3, 75.5 and 66.9 ms. This confirms three changes in that session but does not isolate an average-fps improvement against the previous complete route. The resize stall remains unresolved. No browser warning/error logs were returned. Evidence: `.codex/review/quality-settle-short-drive.json`. The isolated tab was closed after collection.

Next investigate rendering at a smaller viewport within a fixed allocation and presenting it at the normal CSS size, or another approach that avoids repeatedly reallocating the visible canvas. Assess the added render pass, memory, input mapping and cleanup before adopting such a change. Don't keep adjusting quality thresholds and calling the underlying stall fixed. This short drive isn't a full-route, phone or audio acceptance check.


## Fixed canvas allocation candidate, September 6

The available browser inventory contained only saved tab 32 (production cabin, seated, engine off) and tab 51 (AgentSky reader). Neither was closed or changed. The current render-loop source stops scheduling after a parked, engine-off scene settles; the production tab has no per-frame diagnostics, so its actual callback count wasn't measured. Each new test scene was closed before the next started. No builds/tests ran during either driving sample.

A development-only `fixedViewportReview` candidate keeps the visible canvas at maximum density, renders into a smaller scissored viewport as effective quality falls, and scales/clips that area in CSS. No extra render target or presentation pass is added. Picking uses the host rectangle in this mode. Profiling reports effective density rather than allocation density. Browser resizing reapplies the viewport, and disposal restores host overflow. The normal renderer remains the default.

Two sequential opening-route samples used normal motion, Cruise, muted sound and 1280 x 720. Candidate: 2,640 frames, weighted 45.5 fps, maximum 34.3 ms, zero intervals above 50 ms, three quality changes, fixed 1920 x 1080 canvas. Normal renderer: 2,880 frames, weighted 47.1 fps, maximum 166.7 ms, three slow intervals, three quality changes with resize work of 123.7, 167.1 and 157.1 ms. The candidate had no long quality-resize work sample. They cover the same opening section and approximately the same collection delay, not identical per-frame workloads or controlled machine load. This supports eliminating resize pauses, not an average-fps improvement or universal hardware claim.

Evidence: `.codex/review/fixed-viewport-short-drive.json`, `fixed-viewport-matched-baseline.json`, `fixed-viewport-driving.jpg`. The candidate's cabin framing and driving composition looked consistent. Browser errors/warnings were empty in the candidate. TypeScript/build pass before the final host-overflow cleanup addition (`/tmp/porsche-fixed-viewport-*`). Next verify low-density pointer picking, keyboard focus outlines, narrow/landscape resize, reader overlays and cleanup before promoting the candidate. It retains a larger canvas allocation at low effective quality, so lower memory usage isn't claimed. Sustained frame rate still falls short of 60 fps, even with one active test scene. No new destinations or handling changes were added.


## Fixed-allocation input checks and scenic default, September 6

At forced .85 effective density, direct screenshot-grounded clicks opened the exterior door, physical laptop, contact card and racket. The laptop's AgentSky notes stayed aligned with its screen, scrolled to the study link at 390 x 844, and remained aligned after an 844 x 390 resize. Returning to 1280 x 720 restored framing without horizontal overflow. Escape returned focus to the cabin. The focus border now belongs to the scene boundary rather than the scaled canvas, so it remains visible on all sides. This used desktop pointer input with viewport overrides, not a physical phone.

A fresh lifecycle mount with the same candidate reached 286 geometries, 63 textures and 80 programs. Unmount reached 0 geometries, 2 textures and 5 programs, contextLost true, and zero canvases. No browser warning/error logs were returned. These are renderer counters, not retained memory bytes. Evidence: `.codex/review/fixed-input-narrow.jpg`, `fixed-input-cleanup.json`. The viewport override was reset.

The fixed-allocation renderer is now the scenic-route default. City and the preserved multi-stop experiment retain their original path. Development-only `fixedViewportReview=off` permits comparison with the original renderer; `=low` starts the candidate at .85 for functional review. The canvas keeps its maximum allocation while effective resolution falls. This addresses measured reallocation pauses without claiming 60 fps, smaller memory use or final device acceptance. Full-route and production-preview checks of the promoted path remain next. No driving physics, destinations or project content changed.


## Promoted renderer complete-route check, September 6

A fresh normal-motion Cruise run with the scenic default reached Lakeside. The browser inventory contained the saved parked preview and AgentSky reader before creating the only active test scene. No builds, tests or source edits ran during the drive. Viewport was 1280 x 720 and sound was muted.

The 39 driving windows contain 9,360 frames at weighted 69.7 fps, maximum 42.9 ms and zero intervals above 50 ms. Quality reduced the detailed-tree budget, then effective density from 1.35 to 1.2. The fixed canvas stayed allocated at 1920 x 1080. No long render-work callback was recorded. Approach, entry, ignition and parking each had a maximum below 26 ms. Browser warning/error logs were empty. Evidence: `.codex/review/fixed-default-full-route.json` and `fixed-default-arrival.jpg`.

This verifies a complete smooth route with a real quality change using the promoted path. It doesn't prove every window stays above 60 fps, explain prior low-rate sessions, establish performance on other hardware, or measure memory bytes. Keep those boundaries. Don't repeat the same full route without a new hypothesis or material change. The next work can return to visible scene/content quality while preserving handling and the now-verified fixed allocation.


## Far-bank height experiment rejected, September 6

A bounded terrain experiment added low uneven banks on the far side of the lake, using existing vertices and masking the road/access lane. Ten terrain/rock tests, TypeScript and build passed. The browser arrival showed that the raised bank made the plain strip beneath the panorama wider without adding convincing detail. The height change was reverted in full. Don't repeat a height-only far-bank experiment as the next visual fix.

Evidence: `.codex/review/far-bank-rejected.jpg` is a rejected candidate, not the current scene. The browser's ordinary viewport had changed to 861 x 864 during this turn. A temporary 1280 x 720 override supported comparison, then was reset. The camera angle was not identical to the older baseline because it had initialized at a different aspect. Follow device was restored and the test tab closed. Production was rebuilt after restoration (`/tmp/porsche-far-bank-restored-build.log`).

The next terrain/backdrop pass should address their visible join and material/detail relationship, not simply raise the bank or add more scattered plants. The accepted driving and previously verified renderer remain unchanged. No new sustained-route or audio check was needed for a reverted experiment.


## Acceptance queue reconciled, September 6

The quality list now separates current open requirements from verified fixes and links the latest evidence. Its full earlier content is preserved in `porsche-quality-history-2026-09-06.md`. The stale resize numbers and resolved panorama line no longer serve as the current status. The preview guide now states that destination clarification is pending rather than presenting the single route as Bryce's complete vision. All evidence links in the new queue resolve locally.

A focused local search found no trace/arro/throughline/bryce-os package or README files in the known personal-projects directory. This doesn't establish that those projects don't exist elsewhere. Reading recent overlooker turns returned no message content, so it didn't supply a new scope answer. The previously relayed scope clarification remains pending. A separate concise visual-direction question about the current lake arrival was sent to Bryce; don't treat silence as acceptance or change the driving tuning.

## 7 September: Bryce's revised finish

Bryce requested mandatory autopilot through the outward journey, then an optional manual time trial from the lake pullout back to the original starting point. The finish should offer name entry and a real shared leaderboard. This supersedes the earlier written exclusion of racing, but the app's saved goal still contains that old exclusion.

Next milestones:
1. Keep autopilot engaged through the outward trip, preserving optional stops, cabin interaction, honking and parking.
2. Offer the return race at the lake, with a countdown, route progress, manual controls, timed finish and replay/portfolio options.
3. Connect named results to shared server storage. Confirm the available database before claiming the leaderboard is live. No purchases or deployments are authorized.
4. Verify race state, controls, finish, repeat attempts, leaderboard validation and failure handling, then request Bryce's review.

Audio feedback: radio gain increased from .22 (halved under throttle) to .65. Phone gain increased from .035 to .16, adds a third double ring, and temporarily reduces engine gain to 45% and radio to 40%. Answer/ignore restores the mix. 32 affected tests, TypeScript and production build pass. The new mix hasn't been auditioned on Bryce's speakers.

## Final polish pass, 7 September

Bryce authorized final polish, bug fixes and a few personal Easter eggs. This pass adds menu/the lake/finish leaderboard placement, local last-result recovery, a real-stage opening fade and visible entry prompt, plus restrained horn/radio jokes. Keep the approved physics and route intact. Verify the journey in production and reduced motion, check narrow layouts, and distinguish implementation from Bryce's final visual/audio acceptance. No deployment, purchases, commits or pushes are authorized.


## Final polish pass, 7 September 2026

Implemented a loading overlay tied to scene readiness, a visible Get in button, and a short repeat-visit fade with reduced-motion support. Added Race times in the menu, the actual time to beat at the lake, a top-five finish board with the entrant's rank, and locally saved results that can be reopened. Leaderboard failures have retry controls. Three spaced honks trigger one short passenger joke; the radio has small personal copy. The phone trigger now has a wider route window when cabin interaction delays it.

Finished-result views block ignition/rev shortcuts and hide the underlying ignition control. Existing editable-field shortcut protection remains. Driving physics and the route weren't changed in this pass.

Validation: 289 tests across 63 files pass, TypeScript passes, and production builds. The existing large-bundle warning remains. Browser review confirmed the reduced-motion cabin tour reaches the lake, which displays the real shared score `bryce :) / 0:41.106`. Race times loads the same score, closes with Escape, and is centered at a 390-pixel viewport. Evidence: `.codex/review/final-polish-leaderboard-mobile.jpg`. The normal motion preference was restored after testing. User-owned race tabs weren't reloaded.

Remaining acceptance: Bryce's review of the opening, revised audio balance and small jokes; a physical phone check; and a clean sustained performance run without concurrent scene tabs. This pass doesn't establish new frame-time results or stronger race anti-cheat. Shared Redis works locally, but the site hasn't been deployed or linked to a Vercel project. The existing live portfolio belongs to another repository. The original 41.106-second result remains on the shared board.
