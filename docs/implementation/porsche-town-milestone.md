# Small-town milestone

Approved 6 September 2026 through Website direction. Bryce accepted the proposal for a café and tennis club connected by a small town, experienced from the car. Preserve the active goal and accepted driving feel.

## First navigable pass

1. Compose a compact town along the existing road before the forest. Use a shared arrangement for terrain clearings, pavements, building groups, the café forecourt and tennis access. A pair of isolated buildings beside unchanged forest won't satisfy this milestone.
2. Make the café recognizable from approach and the parked seat: sheltered frontage, a visible coffee window, warm interior and readable sign. The flat-white connection can remain environmental copy. Don't add ordering or an inventory.
3. Make the tennis club recognizable from approach and the parked seat: courts, court markings, fencing, a modest clubhouse and a clearly connected arrival lane. Don't add a walking mode.
4. Extend the scenic route's access roads and in-car navigation to café, tennis and lake only. Keep the old journey and city prototypes optional. Preserve cabin object controls and the lightweight portfolio.
5. Verify a continuous café arrival, park, resume, tennis arrival and return to the forest. Check manual turnoffs, Cruise, Turbo, keyboard and reduced motion. Capture representative approach and parked views for Bryce before accepting the composition.
6. Measure the integrated scene with one active test canvas and matched settings. Reuse materials and instance repeated street elements. Keep the fixed-allocation renderer. Check cleanup after the new geometry and textures are included.

## Integration findings

The scenic route currently shares the old journey centreline, begins at fraction .30 and constructs only the lake access road. The old café and tennis locations are at .075 and .18, before that start. Enabling their meshes alone would leave both behind the initial drive. Choose and implement the town start and destination sequence together.

The old journey world contains a café frontage and a basic court that can provide reusable geometry. It also contains walking and other destination flows that must stay excluded. Scenic terrain, tree placement and access-road selection must agree with the town layout, so buildings and drives don't intersect trees or rising ground.

`JourneyMap` is currently gated to the old journey mode. Filter its destination list for the approved stops before exposing it in the scenic experience. The production scenic route should keep its accepted road width, traffic profile and driving controller.

## Current state

The first navigable pass is implemented at `/?town&profile=journey`. It starts before the café, shares the accepted driving controller and scenic road profile, and offers café, tennis and lake through a filtered route map. The ordinary URL retains the forest starting point while the town is reviewed. Repeated street buildings and pavements use six instanced meshes. Café and court forecourts reuse and extend the earlier prototype geometry. Town terrain, trees and ferns use a shared clearing.

Simulation verifies the café, tennis and lake sequence, stationary engine-off and continuous departures, plus reduced-motion arrival at all three stops. The full suite passes 242 tests in 53 files; TypeScript passes. Browser café arrival and engine-off work, and the route map starts the next leg to tennis. Visual acceptance remains open.

The first moving review shows plain repeated façades and sparse forecourt detail. The first review found a rock on a town pavement. Rock placement now excludes the town clearing; this correction still needs a fresh moving view. Initial town frame windows are below a sustained 60 fps; record the completed leg before changing render costs. The café and court box meshes now use one instanced mesh per shared material at each stop. The production build includes that change; its frame-time effect is not yet measured. These are next actions, not claims of finished scenery. The latest traffic recovery browser check passed a deliberately staged contact and return to Cruise; it doesn't establish the town's flow.


## Verification boundary after the first pass

The development browser completed café arrival, looked toward the coffee window, switched the engine off, selected tennis on the filtered map and resumed through the main street. A documentation edit then reloaded Vite before tennis arrival, so that leg is incomplete browser evidence. Use production preview for the next continuous check.

The new production build loaded and completed car entry at `http://localhost:3003/?town&profile=journey`. The temporary browser tab then disappeared from the browser inventory before ignition. It was not restarted repeatedly. Browser tennis arrival, forest return, updated batching performance and new-resource cleanup remain required. No physical touch or audio listening check was performed.

Initial development approach samples: 1,440 driving frames across six windows, 51.2–59.1 fps, maximum 34 ms, zero frames over 50 ms, effective density 1.01. Entry averaged 47.5 fps and ignition 49.9 fps. These precede box batching and are partial-route measurements, not a sustained-performance acceptance result.

Evidence: `.codex/review/town-first-approach.jpg`, `town-first-main-street.jpg` and `town-first-cafe.jpg`. These show the draft composition, not final architecture or materials. The first full suite passed 242 tests across 53 files. After batching and rock exclusion, four focused town/terrain tests, TypeScript and production build pass. Build retains the existing large-chunk warning.

Next: verify production tennis arrival and forest return, capture the court view, measure the batched route, then refine the plain storefronts and destination composition. Keep the approved handling unchanged.


## Production tennis flow and court correction, 6 September

The next goal turn made progress: a fresh production run selected tennis from the map, drove the main street and turnoff, parked at the club, switched off, restarted with Back on the road and returned to the forest. Browser console checks returned no errors or warnings. Screenshots: `.codex/review/town-tennis-before.jpg` and `.codex/review/town-forest-return.jpg`.

Production intentionally disables scene diagnostics, even with the profile query. `.codex/review/town-to-tennis.json` contains only canvas density and URL, not frame-time measurements. Don't infer performance from it. A development run without edits or concurrent builds is still needed for sustained measurements.

The parked view exposed an oversized sign blocking the court and an opaque net. The sign is now smaller and supported beside the court. A line mesh replaces the solid net, with a pale top band and posts. Court markings now include doubles/singles sidelines and service boxes. The corrected browser view shows the unobstructed court in `.codex/review/town-tennis-corrected.jpg`. TypeScript, 18 focused route tests and production build pass. The driving controller wasn't changed.

Supersedes the earlier incomplete tennis/forest browser check. New town resource cleanup, sustained performance, manual turnoffs, physical touch and final town architecture/material acceptance remain open. The clubhouse and street façades are still plain; boundary fencing currently has posts and top rails and needs a finished mesh. Next implementation should improve the shared town architecture and materials while respecting measured rendering costs.


## Shared town architecture and measured run, 6 September

The preceding goal turn made progress by verifying tennis and the forest return. This turn adds pitched roof variations, porch beams/posts, recessed glazing with sills and frames, and four small deterministic surface maps for plaster, timber, roof and pavement. Repeated street parts remain in seven instanced meshes. The maps are generated by the project, use no external images or downloads, and are disposed through the existing scene resource owner. Driving behavior is unchanged.

The moving browser view showed the new rooflines and porch depth. The layout is retained as a draft, not accepted as convincing final architecture. Street character, café/clubhouse materials and the court boundary still need work.

A normal-motion, muted development run from the town start to tennis completed 4,320 measured driving frames at 61.52 fps weighted average. Maximum frame interval was 41.7 ms; none exceeded 50 ms. Effective density stayed at 1.35. Render calls ranged from 467 to 565 in the recorded driving windows. Entry averaged 58.2 fps, with a maximum interval of 49.1 ms and a maximum measured submission of 52 ms. There were no builds, tests or source/document edits during the drive and only one active test scene. These are local results, not a controlled speedup against the earlier town pass or proof of steady 60 fps on other devices.

Evidence: `.codex/review/town-architecture-route.json` and `town-architecture-arrival-street.jpg`. TypeScript and production build pass. No new physics changes required another route regression run; the preceding 18 focused route tests passed.

The lifecycle review mounted the updated scene at 337 geometries, 72 textures and 83 programs. Unmount removed every canvas, released the WebGL context and reported 0 geometries, 2 textures and 7 programs. No browser warnings or errors were reported. These counters and context release aren't process/GPU memory-byte measurements. Evidence: `.codex/review/town-architecture-cleanup.json`.


## Café and clubhouse integration, 6 September

The previous goal turn made progress with shared street architecture and measured performance. This pass reuses that palette for the café and clubhouse instead of generating duplicate maps. The café counter is lower so the machine is visible from the parked seat, the name hangs within the window view, and tables/benches have visible supports. Court boundary mesh now joins the posts and rails, with framed clubhouse glazing and a sheltered edge.

Parked browser views confirm that the café name and machine can be seen, the seating is supported and the court mesh leaves the playing surface visible. No browser warnings or errors were returned. Evidence: `.codex/review/town-cafe-materials.jpg` and `.codex/review/town-clubhouse-materials.jpg`. TypeScript and production build pass. The previous 61.52 fps result precedes these destination changes and isn't a measurement of this exact version.

Bryce has been asked whether the connected mountain-town layout is the direction he wants. This is a preliminary composition question, not final acceptance. Don't treat silence as approval. Driving tuning is unchanged. While that answer is pending, manual/touch turnoff checks, broader performance and the documented hardware/asset boundaries remain independent work.

After the café/clubhouse integration, the full regression suite passes 242 tests across 53 files. TypeScript and production build also pass.


## Responsive and reduced-motion town fixes, 6 September

The preceding goal turn made progress with the café/clubhouse integration. This turn found and fixed a real reduced-motion arrival defect: the final parked frame could fall inside the 100 ms telemetry throttle, then the scene idled with a missing destination label. Another arrow key made the label appear, confirming the stale update. A phase change now forces immediate telemetry before idling. A fresh browser load verified keyboard-selected café-to-tennis and tennis-to-lake arrivals with correct destination labels and cabin focus, without extra input after arrival.

The café/tennis primary continuation now says Continue to lake, matching its existing behavior. Tennis remains optional through the route map. No driving tuning changed.

At 390 × 844, the parked controls and all three map destinations fit. At 320 × 568, the engine button wrapped directly against the row above. Parked controls now use wrapping flex layout with an 8-pixel gap and 44-pixel button heights. Measured narrow bounds confirm the gap and that every button remains inside the viewport. At 844 × 390, keyboard focus scrolls the map to Lakeside, Enter selects it and reduced motion reaches the destination with focus restored to the cabin. Escape from the map also restores cabin focus.

Evidence: `.codex/review/town-controls-320.jpg` and `.codex/review/town-map-landscape.jpg`. Ten scenic/town route tests and TypeScript pass. These checks use viewport overrides and keyboard/pointer automation, not a physical touch device. Movement was restored to Follow device, the viewport override was reset and the temporary tab was closed. No browser errors or warnings were returned.


## Traffic silhouette pass and next parking check, 6 September

The preceding goal turn made progress by fixing reduced-motion arrival state and narrow control spacing. This pass replaces the traffic model's rectangular glass cabin with sloped screens and a narrower roof. The body has wheel-arch cutouts, plus small mirrors, pillars, bumpers and wheel hubs. Nine instanced part meshes replace seven; traffic behavior and collision code are unchanged. Measured local geometry is approximately 2.005 m wide, 1.4475 m high and 4.355 m long, with 1,028 triangles per car. Evidence: `.codex/review/traffic-body-bounds.json` and its measurement script.

The staged oncoming browser view shows the new front silhouette without errors or warnings. Evidence: `.codex/review/traffic-body-front.jpg`. Eighteen driving/traffic tests and the production build pass. Side-detail appearance and the complete updated route's frame times weren't measured in this pass. The earlier 61.52 fps town run predates this model change.

Supervision raised a composition concern from the parked café/court stills: they can look like head-on parking inside a forecourt. The screenshots actually look through the side window from a parallel access lane, but the lack of street context is a valid issue to inspect. Next, measure the car, paving, seating and court clearances and consider an offset parking location slightly before each destination. Favor a view that explains the curb/entrance relationship. Don't retune accepted vehicle handling or add finer props before checking this placement. Preliminary town-layout feedback remains pending; don't duplicate that question.


## Parking placement and street context, 6 September

The preceding goal turn made progress with traffic silhouettes. This turn measured the existing parking positions using a conservative 2.0 × 4.6 m rectangular body envelope. The car was parallel to the access road, not facing into the forecourt. Initial paving clearance was about 1.3 m, with about 1.1 m to the nearest café bench. No body overlap was established. These are geometry-envelope measurements, not a detailed door-swing or pedestrian clearance certification.

Café and tennis parking now occur roughly 10 m earlier along their access loops. Actual local centres are about -10.65 m / -10.49 m along the destination frontage and 8.05 m / 8.04 m out from it. The conservative envelope remains about 1 m clear of the paving, with more longitudinal separation from the café seating. Simple painted bays mark the parking location. The desktop arrival look retains more road context; narrow screens keep looking toward the destination. Accepted steering, acceleration and pull-over parameters are unchanged. Map markers use the selected route's parking geometry.

The browser views show the café/court ahead to the side, the cabin and access road together. An exterior check shows the Porsche inside the bay. Evidence: `.codex/review/town-cafe-offset.jpg`, `town-tennis-offset.jpg`, `town-parking-bay.jpg`, `town-parking-before.json` and `town-parking-offset.json`. The café offset screenshot precedes the bay paint; the court/exterior screenshots include it. No browser errors or warnings were returned.

Ten scenic/town route tests and TypeScript pass. Simulation covers arrivals, park, engine-off, departure and reduced motion with the new stopping points. This browser pass used explicit parked review locations, so a fresh full moving arrival with the offset remains part of the final-flow review. Final subjective acceptance and physical-device checks are still open.

## Full moving town route, 6 September

A fresh development browser journey entered normally, arrived at the café, selected tennis through the map, then used Continue to lake. All three moving arrivals completed with the correct destination labels. The final lake engine-off action worked and the browser returned no warnings or errors. Screenshots and DOM diagnostics are saved as `.codex/review/town-integrated-{cafe,tennis,forest,lake}.jpg` and `town-integrated-route.json`. The temporary test tab was closed.

The saved user preview was also running its engine during this check and was left untouched. Frame samples therefore aren't a clean performance benchmark. Audio listening and physical touch weren't checked. Bryce's latest feedback is that driving feels good, so the accepted driving tuning stays unchanged.

## Line resource cleanup, 6 September

The previous turn completed the moving route and saved arrival evidence. The updated town scene was then mounted and unmounted twice. Ready counts repeated at 339 geometries, 72 textures and 83 programs. Code inspection found that SceneResources collected Mesh objects but skipped Line objects, including the new court net and boundary fences. Cleanup now collects Line geometry and materials too, with a test verifying shared LineSegments resources dispose exactly once.

Four resource tests, TypeScript and production build pass. A fresh browser mount/unmount after the fix recorded 339 geometries, 72 textures and 83 programs at ready, then zero geometries, two textures and six programs with context lost and zero canvases. No browser warnings or errors were returned. Evidence: `.codex/review/town-current-cleanup.json`; the two-cycle baseline is `town-current-cleanup-before.json`. These counters don't measure memory bytes or establish long-session hardware stability. The build still reports its large Entrance bundle warning. Driving tuning is unchanged.

## Held control cleanup, 6 September

The preceding turn verified physical laptop opening and Escape focus restoration, clarified the project hint and updated the review guide. This pass checked touch/button input lifetime. Pointer cancellation, lost capture and window blur already release input, but DriveControls didn't release held pedals when a menu removed the component. A new component test reproduced unmount with no release calls before the fix.

DriveControls now tracks its held inputs and releases them on unmount. It retains input across telemetry renders and uses the latest callback for cleanup. Sixteen control/entrance tests, TypeScript and production build pass. The existing entrance test was also updated to expect the revised project hint. Physical multi-touch and the exact browser unmount event sequence weren't tested; this verifies component behavior and doesn't change steering, acceleration or cruise tuning.

## Current regression baseline, 6 September

The previous turn fixed held-pedal cleanup. The complete current suite now passes 245 tests across 53 files in 13.52 seconds, covering the integrated traffic, parking, line-resource and control changes. Output is saved in `.codex/review/current-regression-2026-09-06.log`. The prior turn's TypeScript and production build remain current because no source changed during this pass. This closes the stale full-suite evidence gap. Visual acceptance, clean sustained town performance, engine listening and physical-phone testing remain open.

## Café side entrance, 6 September

The previous turn established the current full regression baseline. Reviewing the integrated arrival stills showed that the café's prominent side wall had no visible entrance. Added a closed side door with timber frame, dark glazing and a handle, using existing materials and box batching. The parked browser view confirms it sits at pavement level and is visible beside the service counter. Evidence: `.codex/review/town-cafe-side-entrance.jpg`. TypeScript and production build pass; browser warning/error logs are empty. No walking interaction or driving changes were added. This is one bounded building detail, not acceptance of the town's overall appearance; sustained performance wasn't measured after it.

## Manual junction coverage, 6 September

The previous turn improved the café's arrival-facing wall. This pass rechecked the saved user preview: it remains in manual mode at zero speed with its engine at 900 RPM. It was left untouched, and no concurrent performance run was started. The existing manual scenic test only covered the lake. It now checks each current café, tennis and lake access road, entering and rejoining with steering/pedal inputs while remaining in manual mode. All three stay below 0.3 m per simulation step. Twelve scenic/town tests pass; output is `.codex/review/town-manual-junctions.log`. No production code changed. These tests remove traffic to isolate route continuity and don't prove browser discoverability or physical-touch handling.

## Faster staged traffic encounter, 6 September

The preceding turn requested permission to park the saved user preview for a clean benchmark; that reply remains pending. Review-task inspection returned idle status and no newer review details. Independent traffic verification was still possible. Added a development-only `trafficReview=head-on-fast` fixture and a last pre-contact speed sample to DrivingInputReview. The first attempt introduced the car too early and only established low-speed contact, so it was stopped. The revised fixture waits until the Porsche reaches 54 km/h, then places one oncoming car 65 m ahead at 64.8 km/h.

The browser recorded a fixture trigger at 54.195 km/h and one contact episode after a 97 km/h telemetry sample. After releasing acceleration and selecting Cruise, the Porsche returned to the lane at 35 km/h. The exact impact frame, contact angle and instantaneous impact speed weren't captured. Evidence: `.codex/review/fast-traffic-recovery.jpg` and `fast-traffic-recovery.json`. No browser warnings or errors were returned. TypeScript passes. Production driving behavior is unchanged; this doesn't establish every high-speed collision or clean performance. The test tab was closed.

## Town infill with road clearances, 6 September

The previous turn verified recovery from a faster staged traffic encounter. The next composition review identified a blanket 290 m exclusion in the positive-side building row around each stop. It removed usable sites as well as protecting junctions. `town-layout.ts` now filters building sites against the actual café and tennis access roads, including the roof and front paving footprint. Two-metre road samples use a conservative allowance for the gaps between samples. This restores 12 sites, taking the street from 37 to 49 buildings. The existing seven material/roof batches remain; there are no extra town draw-call batches.

A separate Box3 check samples each access road every 0.5 m and verifies at least 1 m between its edge and every building/paving envelope. Two layout tests, TypeScript and production build pass. The café-bay view showed that the infill exposed blank rear walls, so the street buildings now have framed rear windows using existing material batches. The final browser view shows the nearby buildings and open access lane together without browser warnings/errors. Evidence: `.codex/review/town-infill-sites.json`, `town-infill-before-rear-detail.jpg` and `town-infill-cafe-view.jpg`.

The layout test covers access-road clearance, not detailed pedestrian circulation or every building-to-building gap. Driving tuning is unchanged. Full moving visual review and sustained performance with the added geometry remain open; the saved-preview benchmark question and town-layout feedback are still pending.

## Moving infill review and camera clarification, 6 September

The previous turn added clearance-based infill and rear windows. A new browser check started parked at the café, entered normally, selected tennis through the map and completed the moving departure, main-street leg and tennis arrival. The inspected main-street view shows buildings on both sides without road obstruction; the tennis arrival retains a clear court and access-road view. Engine-off worked and browser warnings/errors were empty. Evidence: `.codex/review/town-infill-main-street.jpg` and `town-infill-tennis-arrival.jpg`. This isn't frame-by-frame clipping verification or a clean performance measurement.

Supervision correctly noted that `town-infill-cafe-view.jpg` barely shows the café. That image was manually turned right by eight arrow inputs to inspect the street, not the automatic arrival look. A separate current default view is saved as `.codex/review/town-infill-cafe-default-view.jpg`: the café entrance, service counter, sign, seating and access road remain visible. It uses the parked review position and unchanged automatic camera direction. No camera, driving or geometry changes were made in this pass. The test tab was closed; no further building additions are planned before layout feedback.

## Town direction approved and regression refreshed, 6 September

Bryce replied “Love it!” and the town direction is now recorded as approved. Preserve the layout and accepted driving feel. This resumes the goal with a fresh blocked audit; it doesn't imply listening, benchmark or whole-site acceptance. The saved preview was rechecked and remains at 0 km/h, 900 RPM, manual mode. The existing benchmark setup question remains pending.

The complete current suite passed 249 tests across 54 files, including town infill and expanded manual-junction coverage. The live run took 67.44 seconds and wasn't restarted. This runtime isn't a browser-performance measurement, and its difference from the earlier run wasn't attributed to a cause. Evidence: `.codex/review/approved-town-regression.log`. No production source changed during this turn; the previous TypeScript/build results remain current.

## Authorized single-active-scene benchmark, 6 September

Bryce authorized parking the saved previews, approved engine sound (“sounds fire”) and confirmed parking works. Tabs 32 and 94 are parked with Engine off verified before and after the benchmark. Both remain open. Test tab 96 entered normally, visited café, selected tennis through the map, then continued to Lakeside. All arrivals completed and browser logs were empty. No source edits, builds or tests ran during the measured drive. The test was muted, at 1280 × 720 in development on Apple M4/16 GiB, with other desktop applications still open.

Stop snapshots retain 88 unique windows: 21,120 driving frames, 80.787 weighted fps, lowest window 52.2 fps, 27 intervals over 50 ms and maximum 333.2 ms. Density ranged from .85 to 1.2 in retained driving windows and ended at 1.05. Because the profiler retains only 60 windows, the café/tennis/final snapshots leave a gap after the tennis leg; don't present these figures as a complete-route average. Evidence: `.codex/review/approved-town-single-active-run.json` and `approved-town-single-active-arrival.jpg`.

Live latest-window samples missed the intermittent hitches; the final saved history revealed them. A 67.9 ms callback at 246914.8 ms spent 67.2 ms drawing while program counts rose from 83 to 85 and detailed-fir materials first appeared. Several larger frame intervals have short or absent script entries, so their cause isn't established. Next investigate late detailed-tree shader preparation and browser/GPU scheduling, and add constant-memory cumulative profiler totals before repeating a full route. Preserve accepted layout, handling, parking and audio. This run resolves the setup-permission blocker but doesn't satisfy hitch-free performance or hardware acceptance.
