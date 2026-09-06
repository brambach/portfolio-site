# Local verification

Updated 6 September 2026. Nothing was committed, pushed or deployed.

## Current behaviour

`/` now opens the focused scenic first version. `/?city` retains the city prototype; `/?journey` retains the connected multi-stop experiment. The development server uses port 3001. A local production preview runs at `http://127.0.0.1:3002/?journey` while its process is active.

Manual driving uses steering, accelerator and brake input. Cruise follows the road and traffic. Q/E and on-screen buttons request gears for eight seconds before automatic shifting resumes. Downshifts that would exceed 7,000 RPM are rejected. Speed, instruments and audio share one drivetrain state. Top gear is limited to about 202 km/h. Twenty-eight traffic cars follow, brake and respond to contact. This is a closed arcade circuit with open destination access roads that leave and rejoin the main route. It isn't a street grid.

The map selects six destinations, shows position and visits, and revisits earlier stops on the next circuit. Automatic parking accounts for speed and stops at the selected location. The café includes engine-off exit, a walk to its open service window, ordering a flat white, return and a retained cup in a cabin holder. The forest stop includes an engine-off, ground-following walk to a raised viewpoint and return. Both walks can reverse midway and skip animation under reduced motion. Forest sound loads on demand and fades when returning.

The physical laptop, racket, photo board and contact content remain. The sticky-note driving prompt was removed; a visible Start driving button replaces it. The photo board is on the passenger dash. Selecting content while driving parks first. The journey now has a selectable folded dashboard map and a keyboard-accessible site menu entry. Its temporary cabin shortcut row is removed. The close-up map remains a native dialog; a physical unfolding transition is still a possible polish improvement.

## Automated checks

TypeScript and the production build pass. All 163 tests pass across 36 files. The simulation chunk is 779.45 kB before gzip and 212.04 kB after gzip. Vite still reports a large-chunk warning.

Coverage includes manual acceleration, steering, braking, gear requests and over-rev rejection; Cruise and traffic contact; full route travel with all six stops and a café revisit; destination parking within one metre; café ordering and return; trail eye clearance against the height model; reduced-motion state; shared audio and delayed forest audio cleanup; adaptive canvas resolution; shared scene resources and shadow disposal. Earlier laptop, project-reading and object tests remain.

The React review checked modal focus, labelled controls, stable map geometry, avoiding background ignition shortcuts while the map is open, and preserving canvas focus after navigation or returning to the seat. Unchanged telemetry now retains the previous React state instead of repeatedly rerendering the interface while stationary.

## Browser evidence

City: entry, Start driving, Cruise, waterfront parking and resume worked. At 390 × 844, a downshift at 47 km/h changed third gear around 2,800 RPM to second around 3,700 RPM. Upshifting restored third around 2,850 RPM. Photos parked before opening, fitted on screen, and Projects opened the physical laptop and an arro note.

Journey: entered, opened the map, selected the café, arrived, and confirmed its visit mark. The map was inspected on desktop and at 390 × 844, including its scrollable destination list. In the final café build, exited, walked to the window, ordered at phone width, returned, and confirmed the cup in its holder. Keyboard focus returned to the canvas. Back on the road restarted the engine and resumed Cruise, showing 52 km/h and about 3,100 RPM in third. The production log had no warnings or errors in that pass.

Trail: the browser travelled from the initial car position to the trailhead, parked, completed the walk and returned to the seat with canvas focus. The first viewpoint screenshot exposed a clipped sky because its sphere still followed the car. The sky now follows the viewer; final screenshot verification is recorded below. This isn't a full visual acceptance of the landscape.

Screenshots are in `.codex/review/`: city traffic on desktop/phone, the phone route map, café window, phone coffee order and retained cabin cup.

## Historical rendering samples

Both earlier samples used a 767 × 864 in-app browser viewport and initial automatic travel from 25–150 metres. Routes, speeds and canvas ratios differed, so this compares experiences rather than isolating one optimization.

| Measurement | Original forest | City with traffic |
| --- | ---: | ---: |
| Mean frame rate | 21.5 FPS | 70.3 FPS |
| 95th-percentile frame interval | 50.8 ms | 17.6 ms |
| Submitted triangles per frame, including shadows | 20,559,843 | 783,140 |
| Draw calls | 731 | 399 |
| Samples | 300 | 450 |
| Canvas pixel ratio | 1.75 | 1.5 |

The opt-in local profiler excludes intervals above 250 ms. These figures don't measure loading stalls, tab wakeups or GPU execution time. The city sample predates final resource and environment-map fixes. A later forest-to-lake driving sample is recorded below; the walking route still hasn't been benchmarked. Data is saved in `.codex/review/performance-comparison.json`.

## Remaining limits

The landscape, city buildings and traffic models aren't final near-real scenery. Forest density, road edges, hills, lake basin/shoreline, tennis/store interaction and branching turnoffs need work. The sky and sunlight change with route progress, but fog and sound still need a coherent afternoon-to-evening treatment. The main entrance remains the city prototype until the journey meets its visual requirements.

No physical phone, weaker computer, slow network or other browser benchmark has been run. Phone-width checks aren't hardware tests. OS reduced-motion settings and screen-reader speech haven't been checked in the browser; state tests don't prove those full experiences. Manual collision recovery needs a sustained browser pass.

The recordings retain their existing credits in `public/models/entrance/credits.txt`. The forest recording is credited there as deadrobotmusic's CC0 Forest Ambience 3. The 911 source doesn't identify a year or trim. The mix hasn't been auditioned on headphones or speakers, and the final engine character hasn't been accepted.

Resource cancellation has targeted tests, but repeated browser mount/unmount memory measurements remain pending. An older development city tab crashed before the fresh journey preview opened; its cause remains unresolved. A historical development warning about duplicate Three.js instances wasn't reproduced on fresh page loads.

Project notes still need real screenshots, demos and results. Final subjective review from Bryce is outstanding. The complete goal remains active.

Final trail screenshot check: reloaded the corrected production build, travelled to the trailhead again and completed the walk. The clipped black sky gap no longer appeared on desktop or at 390 × 844. The return control fitted at phone width, and the viewport was reset. `trail-view-phone.png` and `trail-view-desktop.png` record this state. The production browser log contained no warnings or errors. This verifies the sky correction and controls, not the visual quality of the sparse landscape or a listening pass on forest audio.

## Lake basin review, 6 September

The water now has an irregular shoreline and a submerged basin. Nearby terrain lowers toward the shore so it doesn't block the parked driver's sightline. The lake sign moves to the edge of the parking area. Tests cover submerged water, road clearance and the driver's terrain sightline. A development-only `?journey&reviewStop=lake` position permits direct inspection; production ignores this parameter.

Desktop inspection showed the water beyond the driver-side window after lowering the shore. It remains a narrow, distant strip, with sparse trees and unfinished surrounding scenery. This wasn't a complete route or physical-phone check. No browser error or warning was returned during this review. Landscape quality and current journey performance remain open.

## Physical route map review, 6 September

Added folded paper on the dashboard, with the route drawn from the same normalized road data as the readable destination dialog. The map opens by clicking the object on desktop and at 390 × 844 after looking right. The site menu provides keyboard access. Closing returns focus to the canvas. Selecting a destination closes the native dialog before starting the car, so modal focus blocking doesn't swallow driving input. A menu integration test covers opening and focus return.

Browser evidence: selected tennis from the paper map and arrived at the club. After the final focus fix, selecting the store retained canvas focus; requesting the map during the drive showed parking at 66 km/h before opening the dialog. No browser warnings or errors were returned. Screenshots: `.codex/review/physical-map-desktop.png` and `physical-map-phone.png`. Viewport override was reset. This doesn't verify physical phone touch, a complete six-stop browser circuit or final cabin composition.

## Sustained forest driving baseline, 6 September

Added development-only `?profile=journey` diagnostics. They retain up to sixty 240-frame windows and include long visible frame intervals. The original bare `?profile` sampling remains available for historical comparison. A unit test checks long-stall inclusion and bounded history. Production doesn't collect these diagnostics.

Browser run: started at the development trailhead review position, entered, started the engine and enabled Cruise. The car reached and parked at the lake. The canvas was 1280 × 720 at pixel ratio 1.5. Excluding stationary windows and the initial acceleration window, nine moving windows held 2,160 frames over about 36.3 seconds, with reported end distances from 1,822 to 2,418 metres. Window rates ranged from 58.5 to 60 FPS. The largest recorded interval was 33.3 ms; no frame exceeded 50 ms in these windows. Submission time was 3.7 to 3.9 ms, with roughly 481 to 485 calls and 2.61 million submitted triangles including rendering passes.

Raw DOM diagnostics are saved in `.codex/review/journey-forest-baseline.json`, including the earlier stationary windows. This is a local development browser baseline for the current sparse scenery. It doesn't establish all-route, loading, walking, hidden-tab, physical-phone or weaker-hardware performance. It isn't directly comparable with the older city sample at a different viewport.

## Fir canopy implementation, 6 September

The journey forest now uses the full CC0 Fir Sapling variant A geometry, compressed without triangle simplification. Four nearest trees within 32 metres use geometry. Up to 600 surrounding trees use an eight-view atlas rendered from the same model at load time. Tree candidates extend across the hills, with road, trail and water clearance. The atlas stores texture-pixel rectangles independently of screen pixel ratio; the first preview's tile gaps exposed this bug and the corrected browser view no longer shows those gaps. A failure-path test covers renderer state restoration and atlas disposal.

The matched local drive used 1280 × 720 at canvas ratio 1.5. Excluding the initial acceleration window, nine windows covered 2,160 frames in approximately 34.15 seconds. Rates ranged from 61.7 to 64.6 FPS, with a maximum interval of 26.6 ms. Submitted triangles ranged from 1.66 to 2.27 million per frame, compared with about 2.61 million in the previous sparse forest. The car arrived at the lake. No browser warnings or errors were returned. Raw data: `.codex/review/journey-canopy-performance.json`. Screenshots: `fir-canopy-desktop.png` and `fir-canopy-phone.png`.

This supports a fuller forest within the current local rendering budget. It doesn't establish final visual quality, a complete-route performance guarantee or physical-phone support. Near/distant lighting and transition changes, atlas startup cost, repeated GPU cleanup, sapling scale and ground detail need further review. Distant angular city fragments remain visible from the lake and are recorded as a separate scenery issue. The new model adds 5,367,496 bytes; the generated atlas is 2048 × 1024 with a depth attachment.

## Road shoulder and distant city fix, 6 September

City blocks now fade by their centre distance between 220 and 330 metres, before reaching the 450-metre camera clipping plane. The first dithered version showed visible grain and was replaced with smooth transparency. Instances sort farthest first when the viewer moves 20 metres. The lake view no longer shows the angular floating fragments; nearby city buildings remain visible and distant buildings fade without grain.

The forest shoulder blends from the city width to 1.4 metres beyond the asphalt, uses a gravel-like texture and a slightly irregular outer edge. Terrain vertex colour varies across the ground instead of using one uniform tint. Desktop cabin views at lake, city and trailhead were inspected with no returned console warnings or errors. Evidence: `lake-horizon-fixed.png`, `city-distance-fade.png`, and `forest-gravel-shoulder.png` in `.codex/review/`.

All 140 tests, TypeScript and build pass. Sustained performance wasn't resampled for these material changes. Four-lane road proportions, turnoffs, ground detail, moving transparency overlap and physical-phone rendering remain open; these edits don't accept the landscape as finished.


## Access roads and merge checks, 6 September

Each destination now has an open access road. Both manual driving and Cruise use the rendered geometry; the map and dashboard paper include the branches and actual car position. Stop buildings, tennis court and terrain clearance moved with the new forecourts. Arrival is tied to parking on the destination's branch, so stopping nearby on the main road doesn't activate a visit.

Automated evidence: all six Cruise arrivals park within one metre; a manual steering simulation enters and rejoins without position jumps; unselected branches are skipped; fast braking continues onto the main road instead of clamping at the access endpoint; and a nearby stop selected from its branch doesn't require another circuit. Cruise waits outside the main lane for a blocked exit and continues when it clears. Merge checks cover rear traffic, stopped cars, other lanes and the closed-route seam. A complete route test caught contact leaving tennis; allowing for acceleration in the merge estimate fixed it. That test now asserts no collision throughout all six stops and the café revisit. The final full suite passes 148 tests across 32 files, along with TypeScript and production build. Vite still reports its large-chunk warning.

Browser evidence: the prior branch pass completed café arrival, the coffee visit, return with the cup and tennis arrival. This continuation started at the development café review position, entered through the UI, selected tennis from the map and reached its access-road parking area. Screenshot: `.codex/review/turnoff-tennis-browser.png`. No warning or error was returned. The subsequent tennis-departure browser run was interrupted by source changes. Its acceleration allowance is covered by the full-route no-contact simulation.

Limits: manual branch steering and the deliberately blocked exit are simulation checks, not physical-input browser checks. This isn't a complete six-stop browser circuit, an exhaustive traffic safety guarantee or a fresh sustained-performance measurement. The tennis/store/lake interactions, forest lane layout and final scenery remain unfinished.


## Revised first-version integration, 6 September

Bryce replaced the multi-stop goal with three main cabin objects, one short scenic drive and one overlook. The default URL now starts in the forest and selects only the lake access road. Other access roads aren't selectable by the release drivetrain. Scenic rendering omits city buildings, streetlights, other stop structures and the walking path. The laptop, racket and printed contact card remain; the release doesn't create the photo board or request its four images. The map and extra activities remain only in the explicit prototypes.

The new scenic simulation reaches the lake in 140.87 seconds with traffic and without contact, switches the engine off while stationary, and resumes continuously. Tests cover default/prototype routing, immediate contact before entry, the three-object release menu, engine off/resume UI, the lightweight biography and printed-card resource cleanup. All 154 tests across 35 files, TypeScript and production build pass. The shared simulation chunk remains large at 777.71 kB, 211.39 kB gzip.

Browser checks so far: loaded the default forest approach, selected the physical driver door, entered, opened the laptop, read arro's existing note and returned to the seat. The three-object cabin no longer has a photo board, map or persistent bottom navigation. The ignition started the route. Saved laptop view: `.codex/review/first-version-laptop.png`. The first development driving run was interrupted by Vite reloading after documentation changes; no completed arrival is claimed for that run.

Visual limits seen directly: road width and markings still read as a four-lane highway; hills and tree scale need stronger art direction; the contact card isn't convincingly readable from the initial seat view. Close-up exterior highlights are uneven and warrant a geometry/material review. The current views aren't accepted polish. No fresh sustained timing, physical-phone testing, entry recording or actual engine listening was completed for this default configuration.


Fixed production review at `http://127.0.0.1:3003/`: entered, opened the laptop, read arro, returned to the seat, turned the ignition, completed the scenic route, parked at Lakeside, switched off the engine and resumed to a visible 35 km/h. No browser warnings or errors were returned through resumed driving. Overlook screenshot: `.codex/review/first-version-overlook.png`. The bright forecourt slab is visibly unfinished. Current host metadata is Apple M4, 16 GiB RAM, macOS 26.5.2; this isn't a broader hardware claim.

A subsequent render-loop correction keeps frames running while engine RPM settles after switch-off, instead of potentially freezing the tachometer partway down. Development-only `?reviewStop=lake` now supports the scenic release for the next visual review. TypeScript and the final production build pass. These final small source changes require a fresh-build browser check; the production sequence above used the preceding build.


## Scenic road and picking integration, 6 September

The default road now has two matching traffic lanes, a narrower paved surface and real shoulder parking. The lake branch connects to the scenic lane centre. Terrain/tree clearance uses only the lake branch; the bright forecourt surface is removed. Existing city and multi-stop route regressions remain green. The final full suite passes 162 tests across 36 files; TypeScript and production build pass. The chunk is 779.51 kB, 212.04 kB gzip.

New coverage: manual scenic branch entry and rejoin, blocked exit yielding outside the pavement, fast braking through the endpoint onto the shoulder, two-lane traffic, reduced-motion lake arrival and terrain clearance. The scenic simulation reaches the lake in 141 seconds without contact. Hidden-ancestor picking tests reproduce the invisible coffee holder defect and verify the fix without allowing clicks through visible cabin geometry.

Browser visual review at the development lake position confirms removal of the bright slab and the contact card's glovebox placement. Clicking the card centre opens the correct contact details and Put down object returns to the seat. Evidence: `.codex/review/scenic-contact-open.png` and `scenic-overlook-ground.png`. This doesn't establish physical phone support, a physical pickup animation or final landscape acceptance. Full-route timing is being collected separately after the final edits.


Two-lane baseline: the full browser route reached Lakeside. Thirty-four complete 240-frame windows contain 8,160 frames over approximately 134.98 seconds, about 60.45 fps overall. Window rates range from 52.3 to 64.4 fps; the largest frame interval is 27 ms and none exceeds 50 ms. Pixel ratio stays at 1.5 on the 1280 x 720 canvas. Submitted triangles range from 2.02 to 2.78 million. Raw diagnostics: `.codex/review/scenic-two-lane-baseline.json`. The opening windows dip into the low 50s; these figures exclude approach, entry, parked time and the final incomplete frame window.

The resolution controller now responds above an 18 ms sustained mean, instead of waiting for 23 ms. It preserves its chosen density while parked and requires sustained faster frames before increasing it. Tests cover ordinary 60 fps resume without oscillation and earlier response to low-50s rendering. All 163 tests, TypeScript and the final build pass. The matched second browser run is recorded below; its performance is measured separately from the unit tests.


Matched adjusted run: same 1280 x 720 canvas, route, M4 host and in-app browser. The car reached Lakeside. Thirty-seven complete windows contain 8,880 frames over approximately 134.43 seconds, about 66.06 fps overall. Window rates range from 57.5 to 70.3 fps; the maximum interval is 30.8 ms and no frame exceeds 50 ms. The canvas ratio remains 1.35 throughout, compared with 1.5 in the baseline. Raw diagnostics: `.codex/review/scenic-two-lane-adjusted.json`. Both runs cover the first scenic drive; they aren't identical frame-by-frame samples or proof of other hardware performance, and shader/cache state may differ between runs.

After arrival, the browser opened arro on the laptop, returned to the seat, inspected the racket, put it away, switched the engine off and resumed. Canvas density remained 1.35 while parked, reading and driving again. The resumed driving instruments appeared, and no browser warning or error was returned. The physical contact card was verified separately by its visible target. Entry/loading frame timing, physical touch hardware, repeated mount/unmount GPU memory and actual engine listening remain unverified. Landscape quality and consistent physical handling still need review before release acceptance.


## Startup warmup and motion timing, 6 September 2026

The preceding goal turn fixed a TypeScript failure in the GPU wait helper and passed its targeted checks. This continuation measured the browser and changed authoritative implementation state. The approved first-version scope remains active.

Added opt-in approach, entry, exit, object, ignition and parking frame summaries, including bounded histories and maximum JavaScript submission time. Real animated stalls remain in the data; the first frame after idle is excluded from continuous-animation intervals. Initial scenery now uses the actual vehicle/camera pose before shader compilation. Three hidden camera views submit their drawing work before an asynchronous GPU fence resolves and the scene becomes visible. Cancellation releases the fence, unsupported synchronization skips waiting, and a three-second timeout prevents an indefinite load. Entry and exit retain their existing canvas ratio to avoid drawing-buffer reallocation during the camera transition. Driving still adapts resolution.

Measured at 1280 x 720 in the Codex in-app browser on the previously recorded M4 host:

| Run | Approach maximum | Entry maximum | Notes |
| --- | --- | --- | --- |
| Before view warmup | 824.2 ms | 273.3 ms | entry-before-warmup.json |
| Views warmed, no GPU fence | 193.2 ms | 183.2 ms | entry-after-view-warmup.json |
| GPU fence, adaptive entry | 25.7 ms | 150.4 ms | entry-gpu-warmup-idle.json |
| GPU fence, stable entry ratio | 25.9 ms | 66.7 ms | entry-gpu-warmup-stable-ratio.json |

Raw files are under .codex/review. The final run had 181 approach samples at 56.4 fps and 326 entry samples at 59.1 fps. Approach had no frame above 50 ms; entry had one. Ready occurred at 3442 ms, including asset readiness at 2246 ms. This shifts initial rendering work ahead of visibility; it does not claim faster asset delivery. Cache and browser scheduling varied across runs. A separate contended run overlapped the test suite and is saved separately, not used as uncontended evidence.

Repeated laptop opening still has a roughly 192 ms stall (192 and 191.7 ms across two opens), despite maximum submission times of only 4.6 and 5.1 ms. Closing peaked at 50 ms. These results are saved in entry-and-repeated-laptop.json. The opening stall is reproducible and unresolved; lower JavaScript submission time does not establish its cause. Project content remained readable and return worked. No browser warning/error was reported in these runs.

TypeScript, all 170 tests across 38 files and production build passed after the final implementation change. The build retains a large scene chunk warning: 780.99 kB, 212.56 kB gzip. This turn did not repeat the full scenic route, test a physical phone or weaker laptop, measure GPU memory across mounts, or audition engine audio. Visual acceptance remains open.


## Input-method and long-frame attribution, 6 September 2026

The preceding turn made implementation and measurement progress. This continuation added bounded slow-frame sample positions and development-only Long Animation Frame observations. The observer disconnects when the scene disposes and is absent in production. These diagnostics keep real frame stalls visible rather than removing them from the statistics.

In a fresh run, the approach maximum remained 26.4 ms, with no slow frames. Pointer-driven entry peaked at 164.9 ms on sample 4 and laptop opening at 216.6 ms on sample 4. The browser attributed those long animation frames to zero blocking duration, with at most a short render callback and negligible layout work. Loading did show long script tasks from asset parsing and shader preparation, before scene visibility. The interaction stalls aren't explained by the measured JavaScript submission work. This does not prove a GPU cause.

Changing the input method provided a useful comparison: native accessibility opening peaked at 42.3 ms in one run and 66.2 ms in another, whereas pointer-driven opening repeatedly exceeded 180 ms. However, native accessibility closing also peaked at 258.7 ms, so neither an automation-only diagnosis nor an interaction fix is established. Browser scheduling, compositing and automation remain unresolved possibilities. Raw attribution and the second input comparison are saved in .codex/review/input-method-long-frames.json.

The previously reported 66.7 ms entry result is one sample, not a stable upper bound. Entry and repeated object performance remain open. Next compare the same sequence in the available standalone Chrome browser before changing scene geometry or adding artificial interaction delays. No physical input, audio listening, lower-end hardware or repeated memory-lifetime acceptance was completed in this turn.


## Standalone Chrome and exterior picking, 6 September 2026

The preceding turn added useful attribution evidence. This continuation compared standalone Chrome and fixed an actual input-handler cost. Chrome used its natural 1200 x 729 viewport on the same M4 host, so its FPS figures aren't a controlled browser benchmark against the 1280 x 720 in-app viewport.

Before the fix, Chrome recorded an entry maximum of 358.3 ms. Its Long Animation Frame entry attributed 360.3 ms to CANVAS.onpointerup in car-scene.ts. The exterior pointer handler intersected the full detailed vehicle mesh just to decide whether to enter. Laptop opening also peaked at 256.5 ms, without an attributed long script task; that is a separate unresolved issue.

Exterior entry and hover now intersect cached car bounds transformed into the current vehicle coordinate system. This preserves the generous whole-car entry target without testing its detailed triangles. Interior object picking remains precise and preserves opaque occlusion. The picker test covers empty-space rejection, translation, rotation and zero triangle-raycast calls.

After the change, Chrome entry peaked at 108.3 ms on sample 4, with no slow pointer-up script reported. Approach peaked at 26.8 ms. The remaining long frame had zero blocking duration and a 5.3 ms render callback. Entry averaged 45.8 fps over 253 measured samples, so this does not satisfy sustained 60 fps entry acceptance in Chrome. The saved full attribution is .codex/review/chrome-exterior-picking-after.json. No console warning/error was reported.

TypeScript, all 171 tests across 39 files, production build and tracked diff whitespace checks pass. The scene chunk size warning remains. No physical mouse/phone test, engine listening, new full-route timing or memory-lifetime measurement was completed. Entry/laptop scheduling and the broader visual acceptance remain open.


## Detailed-tree visibility culling, 6 September 2026

The previous turn fixed exterior picking. This continuation reduced unnecessary GPU geometry work. Four nearby detailed firs previously shared instanced batches with frustum culling disabled, so every batch submitted all four trees in camera and shadow passes. The four trees now use individual mesh groups with normal visibility culling and shared geometry/materials. Their models, locations, shadows and the distant atlas are preserved. Development motion summaries now include the last frame's calls and triangles for comparison. These are snapshots, not average geometry counts.

Matched 1280 x 720 in-app browser sequence, before versus after:

| View | Before triangles | After triangles | Before max frame | After max frame |
| --- | --- | --- | --- | --- |
| Seat at end of entry | 1,886,872 | 942,460 | 66.6 ms | 33.4 ms |
| End of laptop opening | 2,818,694 | 1,402,076 | 66.7 ms | 25.1 ms |

Entry averaged 56.5 fps and laptop opening 65.5 fps in the after sample. Neither had a frame above 50 ms. The raw before/after files are .codex/review/canopy-batch-seat.json, canopy-batch-laptop.json, canopy-culled-seat.json and canopy-culled-laptop.json. These are individual runs, not a guarantee that all input stalls are resolved.

The complete first scenic route reached the overlook. Across 35 complete windows (8,400 frames, approximately 133.02 seconds of measured driving), it averaged 63.15 fps, ranging from 57.5 to 69.2 fps. One 75 ms frame coincided with the resolution reduction from 1.5 to 1.35. The remainder had no frame above 50 ms. The raw route is .codex/review/canopy-culled-route.json. This does not establish an overall FPS improvement over the earlier 66.06 fps route run, whose scheduling and density history differed. It does directly establish reduced submitted geometry in the cabin snapshots.

Seat, road and overlook screenshots showed the trees and their lighting present. The reused development tab reported GLTF blob texture errors around a reload. A separate clean tab loaded and rendered the exterior without any console error/warning, so the texture error was not reproduced on clean load. Its reload/cancellation cause is still unverified.

TypeScript, all 171 tests across 39 files and production build pass. Chrome's automation connection was unavailable for this turn, so this change hasn't been remeasured there. Physical devices, audio listening, repeated memory lifetime, final scenery/material polish and subjective acceptance remain unverified.


## Landscape materials and arrival view, 6 September 2026

The previous turn reduced detailed-tree geometry work. This continuation adds slope- and shore-dependent terrain colours, a single instanced granite batch with shared geometry, distant atmospheric ridge silhouettes in the existing sky shader, and static water-normal variation. It adds no asset downloads. Granite placement excludes the main driving shoulder and access road; a geometry-clearance test covers every placed rock. The prototype city sky remains unchanged.

At the scenic lake, parking now turns the seated camera toward the lake centre along the shortest yaw path. Manual look remains available, resuming resets the forward target, and reduced motion applies the target immediately. A development lake review verified the direction, rendered the water/sky shaders without console errors and retained engine-off/resume controls. Screenshots are .codex/review/scenic-lake-materials.png and scenic-lake-facing-arrival.png.

The new lake-facing view exposes a remaining composition problem: the broad flat forecourt still leaves the water as a thin band, and the ridge silhouettes remain illustrative. It is not accepted as a convincing finished lake vista. Next, review basin/access-road clearance and the shoreline distance rather than adding more decoration to the same flat view. Don't move the parked car or water over the access road without testing the geometry.

TypeScript, all 172 tests across 40 files and production build pass. This turn did not repeat the full arrival drive, run a new sustained performance comparison, test reduced motion in the browser, audition audio or measure physical devices. The prior driving figures predate these material changes.


## Closer scenic shoreline and local terrain refinement, 6 September 2026

The preceding turn added the first landscape material pass. This continuation moved only the scenic lake centre from a 230 m to a 205 m route offset and separated water clearance from the larger hillside clearing. The experimental journey lake retains its previous centre and basin behaviour. The scenic shoreline now starts approximately 17 m from the review parking pose, compared with roughly 37 m previously. Tests sample the complete main shoulder and access pavement to keep them above water, and check the parked eye's line of sight.

A 120 x 120 m patch around the overlook uses 1.5 m terrain spacing instead of 10 m. It replaces the coarse triangles rather than covering them; boundary heights and UVs match the surrounding mesh. The terrain increases from 77,700 to 90,212 triangles, adding 12,512 locally. A test checks triangle replacement, finite heights, edge interpolation and texture coordinates. The browser view no longer shows the coarse polygon steps at the near bank.

Roadside rocks looked overly white/angular in the resume review. Their instance colours now explicitly use sRGB conversion, the shared shape has a finer irregular surface, and a cloned ground texture provides detail. Geometry stays within the tested clearance radius. The rock batch remains instanced.

Browser checks at the development lake review verified the closer water, smooth bank, lake-facing parked camera and continuous resume to the forward view and dry access lane. Screenshots: .codex/review/scenic-refined-shore.png and scenic-shore-resume-rocks.png. A reused tab retained a multiple-Three warning around dependency hot reload; a separate clean tab loaded, entered and resumed with no error/warning. This does not prove all repeated hot-reload/lifetime issues resolved.

TypeScript, all 174 tests across 41 files and production build pass. The new tests cover shoreline proximity, road dryness, view clearance and terrain patch seams. The sky ridges remain illustrative, broader close-up polish is unfinished, and this turn did not rerun sustained full-route timing, physical devices, browser reduced motion, audio listening or memory-lifetime measurement.


## Repeated scene lifetime and production keyboard smoke, 6 September 2026

The preceding goal turn improved shoreline geometry. This continuation adds a development-only lifecycle review at ?lifecycle&profile=journey. It uses real scene mounts and records renderer counters/context state in a bounded visible history. Production build inspection found no lifecycle control labels or scene-lifetime event string in emitted JavaScript.

Three complete mounts each reached 274 geometries, 54 textures and 72 shader programs. Disposal returned geometry to zero, reported contextLost=true and retained counters of two textures/five programs. The counters are not VRAM-byte measurements and are not all zero. They did not increase between these independent mounts. Early StrictMode cancellations also released their context. Raw evidence: .codex/review/scene-lifetime-cycles.json.

Cancelling during shader compilation exposed a real exception: Three.js checkMaterialsReady read an undefined program after resource disposal. Cleanup now removes input/listeners/canvas immediately, but delays resource and renderer destruction until an in-flight compileAsync finishes. The discarded renderer then explicitly loses its context. Two deterministic compilation-boundary cancellations completed without warnings/errors, left no mounted canvas or ready event, and reported zero geometries/one texture/zero programs with contextLost=true. A subsequent normal mount reached the original counts and unmounted successfully. Raw evidence: .codex/review/scene-compilation-cancel-fixed.json. This fixes the reproduced cancellation race; it does not measure total process memory or explain every historical tab crash.

A fresh production preview at 127.0.0.1:3003 passed a keyboard smoke sequence: Enter to enter the car, Enter to open the menu, Tab to Personal projects, Enter to open the laptop and arro notes, Escape to return, racket inspection/return, and contact inspection/return. Focus returned to the labelled cabin after laptop and contact closure. No production console error/warning appeared. This checks keyboard activation and one menu Tab transition, not an exhaustive tab-order, touch, reduced-motion or driving-key audit.

All 174 tests passed after the core cleanup change; final TypeScript and production build passed after the development instrumentation additions. The scene chunk warning remains. Physical devices, full memory measurements, current full-route performance, engine listening and visual acceptance remain open.


## Visitor motion preference and production driving keys, 6 September 2026

The preceding turn fixed compilation-time cleanup and checked cabin keyboard access. This continuation adds a saved Movement setting in the site menu: Follow device or Reduce motion. The default follows the device. A saved reduction also disables the scene's CSS transitions. It never overrides a device-level reduced-motion preference with full motion. Storage failure leaves the current visit's selection usable.

Changing a device preference during entry previously could stop progress midway because the normal animation stopped advancing without settling its destination. The motion-change handler now settles approach, entry/exit, laptop/racket and view targets, and removes body sway. It requests a frame so a previously idle scene updates. Device preference listeners are removed during scene cleanup. Manual look uses the target immediately when movement is reduced.

Production browser checks verified reduced-motion entry, immediate laptop inspection/return and stationary travel to the lake. Reload preserved Reduce motion. The setting was restored to Follow device afterward. One reload was still loading when the entry action was attempted; waiting for readiness completed normally, with no console error. This is not a measured loading-time guarantee.

With normal motion restored, K started the engine. At 35 km/h, Q changed gear 2 to gear 1 and RPM from 2,800 to 4,100; E restored gear 2 and 2,800 RPM. Space reached the parked state with Back on the road and Turn engine off available. The production console remained clean. These are browser key checks and telemetry evidence, not listening acceptance or high-speed manual steering/braking coverage.

TypeScript, all 175 tests across 41 files and production build pass. The new integration test covers preference selection, scene application and restoration after remount. Physical touch hardware, operating-system preference changes during an active transition, sustained current route timing, process memory and audio listening still need their stated checks.


## Driving feedback, speed hold and horn, 6 September 2026

Bryce reported abrupt steering, hard contact stops and lower gears sticking at redline. Manual steering now uses a progressive curve with speed-dependent turn limits. Glancing contacts preserve momentum, rear impacts exchange speed and substantial head-on impacts still stop the cars. Separation and a short contact cooldown avoid repeated impact impulses. Lower gears automatically upshift at redline even during a manual gear hold; the 7,000 RPM limit stays unchanged.

Bryce then found the first steering adjustment too weak and asked for steady-speed control. Engagement damping increased from 3.2 to 4.4, the input curve exponent changed from 2 to 1.5, and the lateral limit increased from 6 to 9. C captures the current speed above 10 km/h, leaving steering manual. Gas, brake, parking, automatic Cruise and contact release the hold. The visible button reports the captured speed. Existing Cruise still follows the road.

Bryce explicitly wants to keep driving and requested honking. H and the Honk button trigger a short two-tone synthesized horn through the existing master volume, mute and limiter. Repeated input can't stack overlapping blasts. Oscillators stop and disconnect after each blast and are stopped during disposal. Traffic doesn't react to honking yet.

All 184 tests across 42 files pass with two test workers. A previous unrestricted concurrent run timed out in the long journey test while the browser was rendering; the bounded run passed without changing its timeout. TypeScript and production build pass; the existing large-chunk warning remains. Simulation checks cover 30/60/120 fps steering, contact and recovery, lower-gear limiter recovery, speed hold and cancellation. A development browser check captured 35 km/h with C, showed Cruise off and Holding 35 km/h, then confirmed brake cancellation and a stopped car. Horn button execution produced no console errors. The isolated test car was parked afterward; Bryce's tab wasn't operated.

The development-only driving input review supports held-key checks and isn't a production control. No real audio listening, physical touch test, full current-route performance measurement or subjective acceptance is claimed here. Horn timbre and the adjusted steering still need Bryce's hands-on verdict.


## Current route performance and resolution recovery, 6 September 2026

The preceding turn implemented steering, speed hold and horn controls. This continuation measured the complete current scenic Cruise route before and after a resolution-controller adjustment. Both runs reached Lakeside in the same in-app browser at 1280 x 720 on the local Apple M4 with 16 GiB RAM. Measurements use opt-in development instrumentation, not production timing. Source edits and test/build processes finished before the second measurement. The browser reported document.hidden=false at the sampled checks.

The baseline completed 38 full windows / 9,120 driving frames, approximately 136.34 measured seconds and 66.89 fps. Window rates ranged from 51.2 to 78.1 fps, maximum frame 84.1 ms, two frames above 50 ms and worst window p95 25.8 ms. Canvas density moved 1.5 to 1.35 to 1.45 to 1.5, then back to 1.35 and 1.2 through arrival. Raising density after only eight seconds of fast frames made the choice unstable across easier and heavier sections.

Recovery now requires thirty seconds with mean intervals below 12.5 ms, while the existing two-second slow-frame reduction stays intact. Tests check alternating road loads don't repeatedly raise density, and prolonged fast rendering can still recover within device limits. All 185 tests across 42 files, TypeScript and build pass. The build retains its large-chunk warning.

The second route completed 37 full windows / 8,880 frames, approximately 133.64 measured seconds and 66.45 fps. Windows ranged from 56.9 to 76.2 fps, maximum frame 74.5 ms, one frame above 50 ms and worst window p95 25.4 ms. Density lowered once from 1.5 to 1.35 and stayed there through parking. Parking maximum improved from 83.4 to 25.5 ms in these two samples. The console contained no errors or warnings. This is one before/after pair with ordinary run variation, not proof that every timing difference was caused by the controller. Full-window durations omit the unfinished final window and aren't complete wall-clock journey timings.

Entry remains inconsistent: the baseline entry maximum was 42.5 ms, while the second run reached 232.4 ms on sample four, with only 13.1 ms maximum submission time. Ignition also reached 75.2 ms on sample four. These resemble the previously documented input/renderer scheduling hitch and require attribution. They prevent a claim of uniformly smooth entry. No physical phone, weaker machine, standalone Chrome or listening acceptance was added here.

Raw evidence: .codex/review/current-route-before-recovery.json and .codex/review/current-route-after-recovery.json. Next investigate the recurring early-transition frame stall and continue visual/touch/audio review. The goal remains active.


## Entry hitch attribution, 6 September 2026

The previous turn improved resolution stability and retained an intermittent entry defect. This continuation adds bounded development-only timestamps for slow motion frames: phase, animation-frame time, interval, submission duration and observation time. The last 32 records are exposed on the canvas alongside the browser's existing long-animation-frame entries. The driving review has an explicit delayed-entry button, with its timer cancelled on unmount, to separate the input action from starting the transition. Production doesn't collect these records or include the review controls.

Five fresh/reloaded in-app browser comparisons reproduced the gap. Playwright entry peaked at 199.6 ms with 4.2 ms submission on the stalled frame. Native accessibility entry peaked at 315.8 ms with 4.7 ms submission. Delayed entry peaked at 241.3 ms with 6.7 ms submission. Delayed entry without audio initialization still peaked at 249.2 ms. Delayed entry without shadow rendering peaked at 107.7 ms. Each is a single run; the final two are diagnostic exclusions, not accepted product changes. Both temporary exclusions were removed and normal audio/shadows restored.

The overlapping browser long-frame entries for the first two cases report zero blocking duration and no long script accounting for the gap. The pause persists after separating input from entry and after excluding audio startup. Removing shadows in one trial reduced but didn't eliminate it. These observations don't establish a root cause, rule out every scheduling/input interaction, or prove the shadows caused the difference. Standalone Chrome wasn't available through the current browser connection. The existing warmup already includes an open-door view; no redundant warmup pass was added.

Raw evidence is saved in .codex/review/entry-attribution-comparisons.json. Keep the entry defect open. Next useful evidence is a graphics/compositor trace or matched standalone-browser reproduction, plus the remaining physical-touch, visual and listening checks. No uniformly smooth-entry claim is made.

Validation for the attribution change: TypeScript and production build pass, as do the nine focused audio/motion-profile tests. The full 185-test suite passed on the preceding functional revision and wasn't repeated for these diagnostic additions. Production bundle inspection confirms the delayed-entry label, motion-stall collector and temporary audio/shadow exclusions are absent. The existing large-chunk build warning remains.


## Keyboard pedals and speed hold feedback, 6 September 2026

The prior attribution turn added evidence without resolving the entry hitch. This continuation fixes a keyboard pedal bug: releasing any key previously released a held pedal, including an unrelated Shift release. Key-up now releases the pedal only for its activation keys, and activation prevents the browser's default action. Blur, pointer cancellation and capture-loss release behaviour stays covered.

Speed hold has explicit Hold current speed / Release speed hold accessible labels, C shortcut metadata, associated help and a stable live announcement of the captured speed. The announcement doesn't change with each speedometer update. Gas, brake and C release instructions appear while held. The unavailable control explains the 11 km/h display threshold and uses a disabled style without the misleading wait cursor. The horn exposes H shortcut metadata.

Production browser checks verified C captured 35 km/h, the live region stated Holding 35 kilometres per hour with steering/release instructions, and the Release speed hold button worked. Space then parked the car and the console remained clean. An earlier observation came after the car had lost the hold while manual steering was unattended; it wasn't used as proof of capture. Repeating after Cruise had recovered into the lane produced the observed active state.

All 187 tests across 42 files, TypeScript and production build pass. Tests cover unrelated key release, hold availability, captured-speed announcements without telemetry chatter, release and horn wiring. These establish event/DOM behaviour and production browser state, not screen-reader audio, physical multi-touch hardware, subjective steering feel or uniform entry performance. Those requirements remain open.


## First seated composition, 6 September 2026

The prior keyboard turn fixed input handling and feedback. This continuation reviewed the production cabin visually at 1280 x 720. The forward seated view hid the laptop and racket outside the viewport while leaving ignition as the most obvious action. A passenger-side look reveals the laptop, racket and clipped contact card together.

First scenic entry now settles with yaw -.95 and pitch -.38 through the existing continuous camera look weighting. This changes the gaze, not the seat position or the physical objects. It applies only while the scenic drive is off, preserving later re-entry and the city/journey experiments. Ignition already centres the gaze before startup and continues to do so. Reduced motion reaches the same final pose immediately.

Production checks verified direct laptop selection opened the readable project folders, closing restored the seat, direct contact-card selection opened the contact details, and ignition turned the view forward before cruising. The console remained clean. Reduced-motion reload/entry showed the same object composition; Follow device was restored afterward. The new camera test checks that the three object centres lie within the landscape view. It doesn't prove occlusion-free visibility on every aspect ratio or full racket framing; the upper hoop still reaches the right edge in this landscape screenshot.

All 188 tests across 42 files, TypeScript and production build pass. Screenshot: .codex/review/cabin-discovery-view.png. Production preview tab is left at the revised cabin for review. The known entry hitch wasn't remeasured for this composition and remains open, alongside portrait/touch visual checks, physical card inspection consistency, materials, scenery and listening/subjective acceptance. No overall visual acceptance is claimed.


## Compact viewport review, 6 September 2026

The previous turn improved desktop object discovery. This continuation adds an explicit development iframe review at 390 x 660 and 660 x 390, rendering the ordinary site inside the chosen viewport. It doesn't emulate mobile hardware, input capability, safe-area insets or browser chrome. The harness is excluded from the production bundle.

Portrait review showed that the desktop discovery gaze clipped most of the laptop and missed the racket. First-entry gaze now interpolates by aspect ratio, from yaw -1.5 on narrow portrait screens to -.95 on landscape, with pitch -.38. The final 390 x 660 review shows the laptop and racket together. The card isn't in this portrait composition; About & contact remains in the menu. Direct laptop selection opened the responsive project reader and its close button returned to the cabin. Projection tests cover laptop/racket centres at 320/660, 390/660 and 390/844; the last two dimensions weren't all independently browser-rendered.

The 660 x 390 driving review exposed the stacked mode controls covering the menu and sound controls. On short landscape viewports, mode controls now form a row above the pedals and instruments use a smaller size. The corrected screenshot shows separated controls and a clear windscreen. The menu has a viewport-bounded height with scrolling; its visible scrollbar and contained panel were checked after parking. Physical multi-touch and complete menu keyboard traversal weren't added in this pass.

All 189 tests across 42 files, TypeScript and production build pass, retaining the existing large-chunk warning. Production artifact inspection confirms Phone viewport review is absent. The reused development tab retains a createRoot warning timestamped during an earlier main.tsx hot update; no clean-console claim is made for that reused tab. Source changes were followed by explicit page navigation/reload for the final views.

Evidence: .codex/review/phone-portrait-cabin.png and .codex/review/phone-landscape-controls.png. The first-entry hitch, physical-device performance, audio listening, material/scenery polish and subjective acceptance remain open.


## Applied throttle and engine timing, 6 September 2026

The previous turn improved compact layouts. This continuation found that CityDrive passed only controls.gas to EngineSound even while Cruise or speed hold was applying throttle. Engine load therefore treated those steady-speed modes as coasting. The engine now receives the applied fractional throttle. Load and low-speed clutch response use that amount, while RPM stays linked to road speed and gear. The existing audio layer consumes the shared engine state for recording gain/playback rate, and the instruments use the same RPM.

The first regression run caught a 0.0434 m difference in the strict 15/60 fps Cruise test. Engine/gear updates ran once per rendered frame, whereas movement ran in 120 Hz substeps. Engine updates and the blip/contact timers now run with those substeps. Applied throttle resets before each step so parking/off phases can't retain the previous driving load. The original strict consistency assertion passes without weakening its tolerance.

All 191 tests across 42 files, TypeScript and production build pass. New tests check fractional load at a constant RPM, speed-hold load with the accelerator key released, lift-off and Cruise/parking load. Existing coverage checks automatic/manual gears, bounded redline, high-speed recovery, multiple frame rates, the scenic arrival and the experimental route with traffic. The existing large-chunk build warning remains.

This is simulation and source-wiring evidence. No new audio audition or sustained browser performance measurement was performed after the engine-step change. The entry hitch, physical-device checks, listening and visual acceptance remain open.


## Bounded roadside planting, 6 September 2026

The previous turn corrected engine throttle/timing. This continuation reviewed the bare roadside and reused the existing credited Poly Haven Fern 02 asset. It uses the smallest 784-triangle variant, normalized to ground level and instanced at .35 to .65 m height. Deterministic placements exclude the shoulder, access lanes and lake. Only plants within 52 m are considered, with scale fading over the outer 14 m and a hard limit of 64 rendered instances. Ferns receive shadows but don't cast them. The theoretical geometry limit is 50,176 triangles per submission. The four source variants are resource-tracked, and only the selected cloned geometry/material is added to the scene. The experimental journey doesn't load this planting.

Browser review showed low green plants beyond the road edge and no console warnings/errors in that initial sample. It also exposed much slower current rendering than the earlier approximately 66 fps run. A matched-current-code comparison with the ferns temporarily disabled remained slow. The first six full windows averaged 44.77 fps with plants and 43.91 fps without them, each with four frames above 50 ms. Both reached the .85 density floor. This single pair doesn't prove performance equivalence or isolate the cause of the broader slowdown. A read-only process snapshot showed substantial CPU activity in other apps; causality isn't established. The temporary exclusion was removed afterward.

Raw data: .codex/review/fern-initial-profile.json and .codex/review/fern-disabled-profile.json. These are short current-scene comparisons on the same M4 in-app browser, not full-route or weaker-device acceptance. Keep the slower current rendering and earlier entry hitch explicitly open. A quiet-machine/standalone-browser comparison remains useful when available.

All 193 tests across 43 files, TypeScript and production build pass, retaining the large-chunk warning. Tests cover grounded placements, lane/water clearance, bounded visible instances and removal outside the local radius. Existing scene ownership tracks the added resources; repeated browser resource counts haven't been remeasured with ferns. Landscape composition, larger terrain repetition, physical hardware and listening/subjective acceptance still need work.


## Development root cleanup, 6 September 2026

The preceding turn added bounded planting and retained the slower current performance result. This continuation addresses the duplicate React root warning previously recorded after main.tsx hot updates. The entry module now retains its root, explicitly accepts its own hot replacement and unmounts the outgoing root on disposal. Unmount runs Entrance's existing abort, listener removal and scene-disposal path. Production still creates one root normally; the hot-update branch is development-only.

A fresh development tab was allowed to become ready, then main.tsx received a temporary comment update. It remounted to one ready canvas with no console warnings/errors. A second update removed the comment while entry was moving. The scene again reached readiness with one canvas and a clean console. The temporary comment isn't retained. Raw DOM-backed snapshots are in .codex/review/root-hot-update-check.json.

TypeScript, production build and ten focused Entrance/resource tests pass. The full 193-test suite passed on the preceding scene revision and wasn't repeated for this entry-module cleanup. The browser checks establish remount/readiness and absence of the warning in these two runs; they don't prove zero GPU/process-memory retention or attribute the separate 44-45 fps result. Current sustained performance, entry hitch, physical hardware, audio listening and subjective acceptance remain open. Bryce has been asked asynchronously for feedback on steering, speed hold and engine sound; no response or acceptance is assumed.


## Current planted-scene lifecycle, 6 September 2026

The preceding turn fixed development root replacement. This continuation repeated the existing lifecycle review with the current planted scene and engine-step changes. Three full mounts each reached 275 geometries, 57 textures and 74 programs. Each completed unmount reported zero geometries, two textures and five programs with contextLost=true. The second cycle included cabin entry, ignition, a short Cruise and a horn trigger before unmounting. A separate mount cancelled during shader compilation released its context with zero geometries, one texture and zero programs. The following normal mount succeeded with the same ready counts as the earlier ones.

The development StrictMode probe also produces initial zero-resource disposal records; those aren't counted as completed scene mounts. The console remained free of warnings/errors throughout this fresh review. The harness was left unmounted. Evidence is saved in .codex/review/current-scene-lifetime.json.

These results verify the observed renderer counters and explicit context release across these cycles, including the new fern geometry/material/textures. They don't measure GPU or process-memory bytes, establish zero retained resources, prove audio audition, or replace a long-session test. No application code changed in this verification turn, so the preceding test/build results weren't needlessly rerun. Current low frame rate, intermittent entry hitch, physical hardware, visual polish and Bryce's pending subjective feedback still prevent overall acceptance.


## Geometry fallback after resolution reduction, 6 September 2026

The prior turn verified current resource cleanup. This continuation adds a second quality response for cases where minimum canvas density still produces sustained intervals above 22 ms. After one two-second sampling window in that condition, detailed nearby trees reduce from four to two. Other trees remain at their existing positions using the existing eight-view atlas. The lighter tree budget stays fixed for the visit to avoid repeated geometry changes. A new scene starts at the normal budget. The canopy refreshes when the budget changes even if the camera hasn't moved.

The normal-budget browser run recovered to roughly 60 fps without reaching the fallback threshold, so its improvement can't be attributed to this change. A development-only treeDetailReview=2 override then exercised the lighter budget. Its windows ranged from 60.4 to 78.5 fps with two frames above 50 ms, and the final view retained the forest composition. The final captured viewport was 919 x 864; the normal sample didn't record its viewport, and earlier reference runs were 1280 x 720. This isn't a controlled speedup comparison or a full-route/weak-device performance pass. Detailed-tree count reduction is established by the implementation/tests; exact total submitted triangles still depend on view and road position.

All 195 tests across 43 files, TypeScript and production build pass. Tests verify the fallback waits until resolution has reached its floor, stays stable, doesn't activate at normal frame rates, and transfers trees into baked views without losing them when the camera is stationary. The existing large-chunk build warning remains.

Evidence: .codex/review/tree-detail-normal.json, tree-detail-low.json and tree-detail-low.png. The development override is excluded from production. Lower-detail transitions, physical hardware, the intermittent entry hitch and broad visual/listening acceptance remain open. Current browser timing has varied substantially between sessions, so don't treat any one recovered sample as resolution of the earlier slowdown.


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


Adaptive resolution outlier follow-up: each valid frame now contributes at most 50 ms to the quality decision window. Previously a single 240 ms pause among otherwise 16.7 ms frames could lower resolution. A regression test now preserves density in that case, and a second confirms that sustained 100 ms frames still lower density. This makes adaptation less sensitive to isolated scheduling pauses; it doesn't remove those pauses. Very slow frames take longer in wall-clock time to fill the capped decision window. The development trace now separates `quality-resize` from `simulation`, so resize work won't be misreported as physics cost.

All nine render-quality tests, TypeScript and the production build passed. The existing bundle-size warning remains. Full-route browser performance wasn't rerun after this decision-rule change, so no measured frame-rate improvement is claimed. The preceding route evidence still leaves occasional driving hitches unresolved.


Production cabin-to-road check: the current build served on port 3003 completed entry, site-menu contact-card pickup, readable email/GitHub links, put-down with focus returned to the cabin canvas, ignition, normal Cruise at 35 km/h, Turbo activation, acceleration to an observed 98 km/h, and requested pull-over. The parked state exposed Back on the road and Turn engine off, with focus again on the cabin canvas. No warning/error logs were returned. The production canvas exposed only the Three.js engine dataset, with no development profiler fields. Evidence: `.codex/review/production-card-turbo-parking.json` and `.png`, at 1280 x 720, DPR 2. A role/name selector for the Turbo toggle didn't match the browser's native checkbox label; the observed native accessibility target activated it successfully. This check verifies the functional production flow, not steering animation quality, audio character, physical touch, frame timing or a complete scenic trip. No source changes or test reruns were needed for this browser check.


Crawl-speed pull-over fix: a targeted simulation reproduced the remaining sideways maneuver. Initial speeds 0.2/1/2 m/s reached roughly 87/77/65 degrees relative to the road during the previous 2.5-second stop. For speeds below 3 m/s with a lateral shift above 0.2 m, parking now adds a smooth forward creep and reserves forward distance for the arc. Speed and acceleration start continuously and finish at zero; positive creep acceleration reaches the existing engine-throttle model. Already stationary cars stay still, and faster pull-overs retain their existing speed profile.

The same cases now finish in about 8.93 seconds with maximum headings about 20.3/17.2/18.2 degrees and peak speeds 2.90/2.53/2.23 m/s. The 10 m/s comparison is unchanged. A regression test covers shallow heading, bounded speed, continuous speed changes, final shoulder position and centered steering. All 214 tests across 47 files, TypeScript and production build pass. The initial TypeScript check caught test control-flow narrowing, which was corrected before the successful final check. Existing normal/Turbo route and access-road tests pass. This is simulation evidence; fresh browser animation, physical steering feel and low-speed traffic encounters weren't checked. Evidence can be reproduced with `.codex/review/measure-crawl.ts`.


Pull-over continuity follow-up: the first creep fix had a duration discontinuity at 3 m/s. Parking now reserves forward distance in proportion to lateral displacement at every speed, with smooth creep below 3 m/s. Automatic arrival uses the same integrated stopping distance. Stationary traffic waits contribute no creep and don't become premature arrivals. Tests at 2.99/3/3.01 m/s now produce about 22-degree maximum headings and roughly nine-second maneuvers. The 10 m/s scenic shoulder case now lasts about 2.7 seconds instead of 2.5, so the previous statement that every faster profile is unchanged is superseded. Normal and Turbo destination tests still pass.

All 214 existing tests across 47 files passed, followed by 15 focused city/scenic tests including one additional stationary-wait regression. TypeScript and production build passed. The complete suite wasn't repeated solely for the added test. Updated reproducible simulation: `.codex/review/measure-crawl.ts`. Browser animation and traffic during the maneuver remain unverified; no overall handling acceptance is claimed.


Crawl parking browser review: added development-only `?crawlReview&profile=journey`, which uses a 1 m/s Cruise target and advances parking at one fifth speed for intermediate visual capture. Normal production Cruise and parking timing are unchanged. The normal-speed first capture reached the parked state before an intermediate screenshot could be collected. The slowed repeat captured the car angled toward the shoulder, countersteering while straightening, and a centered wheel with Back on the road / Turn engine off after stopping. No warning/error logs were returned. Screenshots: `.codex/review/crawl-turn-in-slow.png`, `crawl-straightening-slow.png`, `crawl-parked-slow.png`, at 1280 x 720. These discrete slowed positions support the rendered geometry and final state, not normal-speed feel or frame-rate acceptance. Traffic interaction and physical-device handling remain open.

TypeScript and final production build pass. The crawlReview query string is absent from production JavaScript. The prior 214-test full run and subsequent 15-test focused run remain the regression evidence; no full-suite repeat was needed for the development fixture and optional factory argument.


Traffic braking during pull-over: a 24-case simulation varied Porsche speed (0.2, 1, 3, 10 m/s), following speed (13, 28 m/s) and initial centre gap (20, 40, 70 m). All 13 m/s cases stayed clear. At 28 m/s and 70 m behind a crawling Porsche, the old controller waited too long to brake and overlapped the player despite sufficient initial stopping room. Traffic now considers relative stopping distance using its existing 7 m/s² braking limit, and caps approach speed to the remaining gap. The same rule applies behind other traffic. Brake lights now follow actual deceleration instead of requiring a large target-speed difference.

The three previously failing 70 m crawl cases now have zero overlap; minimum longitudinal separation while lanes overlap is about 16 m. Artificial 28 m/s starts at 20/40 m behind a crawling car remain collisions because the initial gap is below the available stopping distance. This doesn't prove arbitrary cut-ins or all parking traffic interactions safe. Reproduction and before/after evidence: `.codex/review/measure-parking-traffic.ts`, `parking-traffic-baseline.txt`, `parking-traffic-after.txt`. New regressions cover early high-speed braking, brake lights and the three crawl maneuvers with following traffic. TypeScript, production build and the full suite pass. Browser traffic animation and physical-device checks weren't repeated in this pass.


Scenic atmosphere pass: scenic fog now follows the route's daylight progression instead of remaining fixed grey-green. The scenic sky blends from a blue afternoon upper sky and warm horizon toward a muted evening palette; preserved city/journey prototype sky behavior is unchanged. This adds no geometry, textures or draw calls. Browser checks at the overlook and the starting approach completed without shader errors; the lake screenshot shows a warm evening horizon with cooler distant haze. Evidence: `.codex/review/scenic-atmosphere-lake.png` and `scenic-atmosphere-approach.png`, 1280 x 720. Terrain still has broad bare slopes and sparse trees, so overall scenic visual acceptance remains open. These endpoint checks don't prove the full moving color transition or performance.

TypeScript and production build pass. The preceding full 217-test regression remains current for driving logic; no test suite repeat was needed for the isolated color/shader pass. No physical-device or subjective acceptance is claimed.


Scenic planting pass: the same 2,400 candidate positions now concentrate toward nearby slopes, with varied tree sizes, instead of spreading evenly across a 160 m strip. Placement rejects trees within 11 m of the main road, near the access road or stop clearing, and below the water clearance. The existing renderer limits remain four detailed trees and 600 distant views. Denser nearby placement can still increase submitted work and overdraw; unchanged limits aren't a performance guarantee.

A placement regression verifies candidate bounds, grounding, pavement/access clearance and water height. It, TypeScript and production build pass. Browser approach, entry, driving and lake-view checks show more trees framing the road while the seated lake sightline stays open. No warning/error logs were returned during driving. Seven early 240-frame windows ranged from 55.5 to 69.4 fps at 1280 x 720, DPR 2, canvas ratio 1.2; the opening window had two intervals above 50 ms, maximum 75 ms. This is a short spot check, not a full-route comparison. Broad terrain surfaces still look bare and the landscape remains unfinished.

Evidence: `.codex/review/scenic-trees-approach.png`, `scenic-trees-driving.png`, `scenic-trees-lake.png`, and `scenic-trees-short-profile.json`. The saved profile includes subsequent windows beyond the initial seven described above. The preceding 217-test full suite wasn't repeated for this isolated planting change. Physical-device, full-route performance and subjective acceptance remain open.


Fern grounding fix: a lighter terrain palette had little visible benefit and was reverted. Enlarging ferns exposed a grounding issue, so that experiment was also reverted. A coarse-grid comparison outside the lake region found 570 of 1,053 fern positions more than 0.1 m below triangle-interpolated ground, with maximum discrepancy about 0.52 m. Placement had used the smooth height formula rather than the rendered mesh.

A spatial index of the actual terrain triangles now supplies fern heights at setup, including the refined shore mesh. It supports indexed and non-indexed geometry and falls back outside mesh coverage. Original fern sizes, positions in X/Z, instance limit and runtime update behavior remain. The index adds setup work and temporary CPU data; it adds no render geometry or draw calls. Three focused sampler/fern tests, TypeScript and production build pass. Tests cover triangle interiors, edges, indexed/non-indexed data and fallback. The fresh browser approach loads without warning/error logs. Evidence: `.codex/review/measure-fern-ground.ts` and `ferns-grounded-approach.png`. The wider bare-floor composition is still open. Full-route performance, setup timing and full-suite regression weren't repeated in this pass.


Shared rendered-ground placement: the actual mesh comparison found 148 tree bases more than 0.1 m above terrain and 366 more than 0.1 m below it, with maximum absolute difference about 0.52 m. One triangle index now supplies ground heights to scenic trees, rocks and ferns. Tree/fern candidate counts remain 2,326/1,186, and their measured origin heights match sampled mesh heights. Rocks retain their intentional partial burial offsets. Prototype placement is unchanged. Index construction measured about 24-26 ms in the local Node script; this isn't browser startup or GPU timing.

All 219 tests across 49 files, TypeScript and production build pass. A fresh browser approach loads without warning/error logs. Evidence: `.codex/review/measure-terrain-grounding.ts`, `terrain-grounding-after.json`, `shared-grounding-approach.png`. The grounding evidence concerns placement origins; it doesn't prove every branch, rotated rock edge or billboard contacts a sloped surface perfectly. Current full-route performance, browser setup timing and broader subjective scenery acceptance remain open.


Current grounded-forest full route: normal Cruise completed entry, travel and Lakeside parking with no browser observations between ignition and arrival. At 1280 x 720, DPR 2, 36 completed 240-frame windows recorded 8,640 frames at approximately 63.63 fps, window range 54.9-73.8 fps. One interval exceeded 50 ms, maximum 75 ms. Density began at 1.5 and dropped once to 1.35. The sole long callback spent 67.7 ms in quality-resize, 0.1 ms in simulation and 3.9 ms in draw submission, with unchanged renderer resource counts. This establishes canvas resizing as the source of that callback cost; it doesn't explain every historical stall or prove a controlled speedup.

Approach/entry/ignition/parking maxima were 25.9/25.1/17.7/25.9 ms, each with zero intervals above 50 ms. Scene readiness was recorded at 2,036 ms; entry/ignition shadow preparation took 48/41 ms in this run. Those are individual observations, not guaranteed latency bounds. No warning/error logs were returned. Completed windows exclude partial samples and aren't exact route duration. Evidence: `.codex/review/grounded-forest-full-route.json` and `grounded-forest-arrival.png`. The previous full 219-test result remains current; no source changes or test reruns were needed for this route measurement. Weaker hardware, physical phones, audio listening and subjective acceptance remain open.


Initial rendering headroom: the scene now starts at canvas density 1.35 on higher-DPI screens instead of 1.5, rendering 19% fewer pixels initially. Device density remains an upper bound, minimum density remains 0.85, and existing adaptation/recovery stays available. CSS text and controls are unchanged. The controller accepts an explicit starting density; ten focused tests now cover initial bounds, steady 60 fps retention, later recovery and existing adaptation behavior. TypeScript and production build pass.

A fresh uninterrupted full route at 1280 x 720, DPR 2 reached Lakeside with no warning/error logs. Its 36 completed windows recorded 8,640 frames at about 65.36 fps, range 58.5-80 fps, maximum driving interval 26.4 ms and zero intervals above 50 ms. Density stayed at 1.35, and no work stalls were recorded. The preceding 1.5-start route had averaged 63.63 fps with one 75 ms resize interval. This single sequential comparison supports retaining the change locally, not a controlled effect size or a guarantee on other hardware. Approach/entry/ignition/parking maxima were 26/25.8/25.5/25.6 ms. Readiness took 3,824 ms, with assets-ready only at 2,275 ms; no loading-speed improvement is claimed. Entry/ignition preparation took 176/237 ms.

Evidence: `.codex/review/initial-density-full-route.json` and `initial-density-arrival.png`. Full 219-test regression predates the starting-density change; the ten focused controller tests, TypeScript/build and full browser trip cover this pass. Other devices, audio listening and subjective visual/handling acceptance remain open.


Transition-control correction: speed hold is now disabled during ignition and parking, matching the existing driving-model guard. The help line describes starting or pulling over rather than inviting steering/acceleration during those transitions. Horn and gear controls remain available. A regression checks a 36 km/h parking state, confirms the disabled button doesn't call speed hold, verifies the horn still responds, and checks restored guidance/availability when driving resumes. All eight Entrance component tests, TypeScript and production build pass. No browser or full-route repeat was needed for this isolated availability/copy change; the preceding full-route measurement remains the performance evidence.


Current lifecycle recheck: two ready mounts after the terrain/initial-density changes each reached 285 geometries, 62 textures and 78 programs. The first included entry and driving before disposal. Both disposals released the context, left zero canvases, and reported zero geometries, two textures and five programs. Early development strict-mode disposals also reported zero resources. No warning/error logs were returned. These counters don't establish GPU bytes or JavaScript heap retention.

The same check exposed a slow remount: assets-ready at 1,740 ms, scene-prepared/compiling at 2,566 ms, and ready only at 48,428 ms after gpu-wait-ended. The browser trace includes about 5.76 seconds in Three.js checkMaterialsReady, as well as earlier loading work. The cause of the wider compilation delay is unverified. It mustn't be attributed to the new terrain index or described as a memory leak without evidence. Next isolate repeated compilation from concurrent preview contexts/browser load. Evidence: `.codex/review/current-grounding-lifecycle.json`. No source changes or tests were needed for this read-only browser check. Startup reliability stays open despite the successful full-route timing.


Bryce confirmed that driving feels good on 6 September. Preserve the current handling rather than continuing speculative tuning. This doesn't imply acceptance of scenery, startup latency, audio character or untested hardware. Startup diagnostics now distinguish compilation completion, the three warmup draws and the final GPU wait. TypeScript and build pass; the new stage breakdown hasn't yet been captured in a fresh startup run.

Repeated startup stage breakdown: three consecutive mounts in one fresh in-app browser tab became ready at 2,609 / 2,417 / 2,468 ms. Compilation took 114 / 117 / 110 ms, the first uncull warmup render took 883 / 753 / 782 ms, and the final GPU fence wait took 27 / 28 / 27 ms. Each ready scene reported 285 geometries, 62 textures and 78 programs. Each full disposal reported zero geometries, two textures and five programs with contextLost=true; the final DOM had zero canvases. No warning/error logs were returned. Evidence: `.codex/review/repeated-startup-breakdown.json`.

B05's earlier 48.4-second remount didn't recur. This check began with no other in-app tabs, but it isn't a controlled concurrent-context comparison and doesn't prove browser load caused the earlier delay. Long-animation-frame attribution names checkMaterialsReady even when the measured continuation includes the warmup render; that callback label alone doesn't isolate shader compilation. Keep B05 open. The largest measured graphics setup block is now the first uncull warmup, so investigate its uploads/render submission before changing driving or removing warmup coverage. No source changes, repeat tests, full drive or physical-device checks were needed or performed for this measurement.


Staged texture uploads: shared material textures now upload before the hidden view renders, yielding to the browser after each batch reaches 8 ms. A single upload can exceed that budget; it isn't an 8 ms task guarantee. Render-target textures are excluded, shared texture objects are deduplicated, and abort checks prevent further renderer access after cancellation. All existing hidden view renders and the final GPU fence remain.

Two fresh measured mounts became ready at 2,668 and 2,595 ms. Texture upload elapsed time was 683/677 ms, first warmup render 230/225 ms and final fence wait 45/51 ms. Before this change, three first warmup renders took 753-883 ms as one block. Total startup hasn't demonstrably improved; this change distributes texture work across tasks. Earlier scene setup still produced 615/695 ms long frames, so loading isn't hitch-free and B05's 48.4-second outlier remains unresolved.

Cabin entry displayed textures and completed with a 26.1 ms maximum frame, zero intervals above 50 ms. Approach maximum was 26 ms, with a 55.2 fps average in that run. Both mounts retained 285 geometries, 62 textures and 78 programs. Disposal released the context, reported zero geometries/two textures/five programs, and left zero canvases. No warning/error logs were returned. Evidence: .codex/review/staged-texture-startup.json.

All 223 tests across 50 files, TypeScript and production build pass. New tests cover shared texture deduplication, excluding render targets, yielding after expensive work and aborting before a subsequent upload. Logs: /tmp/porsche-texture-warmup-tests.log and /tmp/porsche-texture-warmup-build.log. Build still warns about the existing large scene bundle. A full route, physical touch hardware, production browser run and listening check weren't repeated for this startup-only change. Handling is unchanged.


Car construction batching: new startup markers measured 552 ms in source-panel reconstruction and 38 ms in cabin details before this change. Panel reconstruction now uses the same abort-aware 8 ms batch scheduler as texture uploads. Geometry classification, vertex indexing, material assignment and source order are unchanged. The scheduler yields only between items, so a single large mesh can still block longer than 8 ms. A measured batch reached about 136 ms; this reduces the previous combined block rather than eliminating all loading stalls.

Two measured ready times were 2,825 and 3,012 ms, with panel construction elapsed time of 711/713 ms including yields. Total startup isn't faster than the preceding approximately 2.6-second runs. The tradeoff is more opportunities for browser input between panel operations. The original 48.4-second outlier remains unresolved.

The development lifecycle review now supports cancellation during car construction. That browser check reached car-parts-started, then disposed with zero geometries, one texture, zero programs and contextLost=true, leaving no canvas. Unchecking cancellation and remounting reached the normal 285 geometries/62 textures/78 programs. Entry completed, and disposal reported zero geometries/two textures/five programs with contextLost=true and zero canvases. No warning/error logs were returned. Evidence: .codex/review/batched-panel-startup.json. Tests/build ran during the later entry check, so its timing isn't a clean performance comparison.

All 226 tests across 51 files, TypeScript and production build pass. The new scheduler tests cover construction order across yields, cancellation before work and error propagation. Existing texture tests cover cancellation after a yield. The geometry regression verifies triangle positions, normals and UV seams. Logs: /tmp/porsche-panel-batches-full-tests.log and /tmp/porsche-panel-batches-build.log. The existing scene bundle warning remains. Production browser, full-route timing, physical hardware and listening weren't repeated. Driving settings are unchanged.


Production reduced-motion keyboard journey after loading changes: keyboard activation opened the site menu, enabled Reduce motion, entered the cabin, opened the laptop and arro notes, returned with Escape, inspected/returned the racket and contact card, and started the engine. The reduced-motion path reached Lakeside without the animated trip. Engine-off worked, but its newly disabled button dropped focus to BODY.

The engine-off handler now returns focus to the cabin canvas. The parked/resume component regression publishes engine-off telemetry, checks the disabled button and verifies retained canvas focus. All eight Entrance tests, TypeScript and production build pass. A fresh rebuilt production run repeated reduced-motion entry/arrival and confirmed activeElement=CANVAS with the full cabin accessibility label after engine-off. Production canvas data contains only the Three.js engine marker, with no development diagnostics.

The check restored Follow device, opened Read without the scene, and verified the plain /projects page has Bryce's bio, four project folders, contact links and zero canvases. No warning/error logs were returned. Evidence: .codex/review/production-reduced-keyboard.json, production-reduced-project.png and production-reduced-lakeside.png. Logs: /tmp/porsche-engine-off-focus-tests.log and /tmp/porsche-engine-off-focus-build.log.

This is functional keyboard/reduced-motion evidence in the available in-app browser, not a normal animated route timing, audio audition, physical touch test or full visual acceptance. The current full 226-test result predates the isolated focus fix. The production screenshots still show sparse near-ground scenery and an illustrative lake vista. Real project screenshots/results remain missing. Driving settings are unchanged.


Overlook foreground composition: a trial shore-slope variation barely changed the seated view and was removed. Moving all the existing shoreline rocks inland also reduced the waterline-rock coverage, so that arrangement wasn't retained. The final change preserves the previous shore clusters and adds eight low foreground stones, leaving the central lake sightline clear. Their origins use the existing rendered-terrain sampler and intentional burial offsets.

Granite instances increase from 607 to 615. The geometry, material, texture and instanced draw mesh are shared, so no new draw mesh is introduced; eight instances still add geometry work. Existing road/access clearance and low-shore-rock tests pass, as do TypeScript and production build. The fresh seated review has no warning/error logs. Evidence: .codex/review/lakeside-foreground-granite.png. Logs: /tmp/porsche-near-shore-tests.log and /tmp/porsche-near-shore-build.log.

This improves foreground framing in the parked review without claiming finished scenery. The broad bare ground, illustrative mountain vista and moving approach remain open. Full-route performance, normal moving arrival, physical hardware and the full test suite weren't repeated for this placement change. Driving and terrain heights are unchanged.


Current shoreline full-route check: normal Cruise reached Lakeside after the loading changes, focus fix and foreground granite. No agent browser observations or test/build jobs ran between ignition and arrival. Thirty-eight completed windows recorded 9,120 frames at approximately 67.115 fps, range 58.9-71.1 fps, with two intervals above 50 ms (75.1 and 66.5 ms). Density changed from 1.35 to 1.2. The 75.1 ms interval coincides with a 71.5 ms callback containing 67.7 ms quality-resize, 0.1 ms simulation and 3.5 ms draw submission. Resources stayed 285 geometries/62 textures/78 programs. The second interval has no matching long script here.

The viewport started at 1280 x 720, DPR 2, and ended at 861 x 864, DPR 2. Mute also changed without an agent action. A later ResizeObserver callback took 156 ms around 197 seconds after navigation. This establishes an external UI-state change, not its cause or duration, and prevents treating the session as a controlled fixed-viewport comparison.

Approach/entry/ignition/parking maxima were 25.1/25.9/26.3/33.2 ms, all with zero intervals above 50 ms. Readiness took 2,864 ms; entry/ignition preparation took 145/39 ms. Normal arrival shows foreground stones and an open lake sightline. No warning/error logs were returned. Evidence: .codex/review/current-shore-full-route.json and current-shore-arrival.png. Intermediate moving views weren't inspected. No source changes or test repeats were needed. B05, occasional resize stalls, scenery, audio and physical hardware acceptance remain open.


Resize and short-landscape reader: the resize observer now reads dimensions once, skips zero dimensions and skips sizes matching the renderer's logical dimensions. Actual size changes still update camera projection, drawing buffer and laptop layout. This avoids redundant resets; it doesn't eliminate the measured cost of a real adaptive-resolution change.

Production checks resized from the default viewport to 390 x 844 and then 844 x 390. Canvas buffers matched density 1.35 (526 x 1139 and 1139 x 526), and page width matched the viewport without horizontal overflow. The landscape laptop exposed a readability defect: the wide-screen logical layout scaled text too small in the short viewport.

The embedded laptop now uses the existing 600-pixel compact layout whenever viewport width is at most 600 or height at most 500. Matching compact CSS applies only to the embedded laptop for the added short-height case; the plain reader and other object layouts keep their prior behavior. A rebuilt production view displays larger project text. The fourth project, bryce-os, opens by keyboard through the scrollable list, and project detail remains open after restoring default viewport sizing. No warning/error logs were returned. Temporary viewport overrides were reset.

TypeScript and production build pass. No new tests or full-suite rerun were needed for these small layout/guard changes. Evidence: .codex/review/resize-laptop-check.json, resize-landscape-laptop-before.png and resize-landscape-laptop-after.png. Logs: /tmp/porsche-resize-guard-build.log and /tmp/porsche-short-laptop-build.log. This verifies responsive layout on the available browser, not physical-phone gestures, pixel-perfect typography on every screen, resize latency or sustained driving performance after this change.


Compact folder-return navigation: production review at 844 x 390 reproduced an offscreen focus bug. Opening bryce-os and choosing All projects focused its folder but reset the list to scrollTop=0. The folder's visible coordinates were y=286.9-336.5 while the reader body ended at y=253.1.

The return handler now permits the browser to scroll the restored focus target into view. A rebuilt production check retained bryce-os focus with scrollTop=154.5, folder bounds y=195.1-244.7, fully within the reader body y=107.2-253.1. No warning/error logs were returned. The temporary viewport override was reset.

All eight Entrance tests, TypeScript and production build pass. Evidence: .codex/review/folder-return-visibility.json and folder-return-visible.png. Logs: /tmp/porsche-folder-return-tests.log and /tmp/porsche-folder-return-build.log. No full-suite, driving, physical touch or audio repeat was needed for this one-line navigation fix.

Portfolio content remains four short descriptions in ProjectLaptop.tsx and existing src/lib/site.ts entries, without project screenshots/demo results. Bryce was asked which project should lead and what real link or result can be shown. No answer is assumed and no project facts were invented. The leather roughness asset was inspected; no material change was retained without stronger visual evidence.


Current regression and lifetime audit: all 226 tests across 51 files pass after the resize guard, short-landscape reader and folder-return fix. Log: /tmp/porsche-current-regression.log. The last successful TypeScript/build result remains current because no source changed in this audit.

Browser cancellation during shader compilation released the context, reported zero geometries/one texture/zero programs and left zero canvases. A retry reached 285 geometries/62 textures/78 programs. Cancelling entry shadow preparation then released the context with zero geometries/two textures/five programs. A subsequent normal mount reached the same ready counts and disposed to the same counters with zero canvases. No warning/error logs were returned. Evidence: .codex/review/current-reader-lifetime.json.

These checks cover explicit release and bounded renderer counts, not GPU bytes, JavaScript heap retention, physical hardware, audio listening or subjective visuals. Tests overlapped the beginning of this lifecycle check, so its startup timings aren't performance evidence. The historical B05 delay remains open. The project-evidence question remains pending; independent visual work can continue.


Denser roadside groundcover: fern candidates increase from 1,200 to 2,400, producing 2,374 accepted placements instead of 1,186. Plant height, rendered-terrain grounding, water/access exclusions and road clearance are unchanged. A 300-position route scan found at most 61 nearby plants, versus 31 previously, within the unchanged 64-instance mesh limit. The mesh, material and 52 m visibility radius are unchanged. More submitted instances still add geometry and alpha-tested pixel work.

Two focused fern tests, TypeScript and production build pass. Entry and an early driven forest segment were visually checked. A short sample at 1280 x 720, DPR 2 recorded 17 completed windows/4,080 frames at approximately 74.507 fps, maximum 33.4 ms, zero intervals above 50 ms and fixed density 1.35. This isn't a full-route result or a controlled speedup comparison. No warning/error logs were returned; the scene was already muted, so no audio listening is claimed.

Evidence: .codex/review/denser-ferns-entry.png, denser-ferns-driving.png and denser-ferns-short-drive.json. Logs: /tmp/porsche-fern-density-tests.log and /tmp/porsche-fern-density-build.log. The full 226-test result predates this placement-density change. Broad bare slopes, repeated tree forms, full-route timing with denser plants and subjective visual acceptance remain open. Driving settings are unchanged.


Exterior paint investigation: the source GLB's paint material has KHR clear-coat properties and a clear-coat normal texture, while a separate transparent coat material uses its own normal texture. Disabling those normals didn't remove the uneven reflections. Omitting the separate coat mesh also didn't establish that it caused the surface issue. Both experiments were reverted. Source geometry, normal maps and coat geometry are retained.

The final appearance change lowers paint/coat metalness from 0.55 to 0.3, raises roughness from 0.24 to 0.4 and sets environment-map intensity to 0.65. The green color remains. The fresh exterior view has softer highlights; this is an art-direction candidate, not proof that underlying geometry or reflection quality is resolved. Cabin materials and driving settings are unchanged.

TypeScript and production build pass, and fresh browser logs contain no warnings/errors. Evidence: .codex/review/softer-green-paint.png, paint-without-normal-maps.png and paint-without-coat-layer.png. Baseline: denser-ferns-entry.png. Build log: /tmp/porsche-paint-finish-build.log. No geometry/texture was added, but no new full-route performance, full suite, moving exterior or physical-hardware check is claimed. Final subjective visual acceptance remains open.


Audio download cleanup: CarAudio now owns an AbortController shared by its initial recording requests and optional forest request. Disposal aborts those requests before stopping sources/closing the context. Both load paths check disposal after reading a response body, preventing late bodies from starting new decodeAudioData work. An audio-context resume rejection also suppresses its unavailable callback after disposal. Playback gain, pitch, mixing, horn and driving behavior are unchanged.

Regressions cover all nine pending recording requests becoming aborted without ready/error callbacks or playback, repeated disposal closing the context once, engine bodies resolving after disposal without decoding, and the existing late forest body case without decoding. All 228 tests across 51 files pass, TypeScript passes, and the production build passes. Logs: /tmp/porsche-audio-cancel-full-tests.log, /tmp/porsche-audio-cancel-final-types.log and /tmp/porsche-audio-cancel-build.log.

The tests use an audio/fetch harness. They don't establish network timing in a physical browser, audible quality, loudness suitability or memory-byte retention. A decode already underway isn't cancellable through this change; its existing completion guard still prevents storing buffers after disposal. Credits continue to identify the 911 source as jerry.berumen's attributed recording with unspecified year/trim, not a verified GT3. No audio tuning or listening acceptance is claimed.

Terrain setup cleanup: scenic terrain now calls colourTerrain directly instead of first allocating and computing prototype soil colors that colourTerrain immediately replaces. The prototype branch retains the same color calculation and reuses its constant grass Color. The scenic color function reads positions and normals, so the discarded color attribute wasn't an input. Driving settings are unchanged.

TypeScript and production build pass (/tmp/porsche-terrain-colors-build.log). The existing large scene chunk warning remains. This change hasn't had a new browser timing, screenshot or full-route check, so no measured startup or frame-rate improvement is claimed. Bryce's feedback that driving feels good remains acceptance of the current handling baseline.

Shore material candidate: scenic terrain now carries a shoreline blend based on lake radius and terrain height. Its existing ground texture supplies grain for a lighter sand/granite color near the water, with reduced leaf-shaped normal detail. Inland terrain and prototype materials keep their existing appearance. No texture download, extra mesh or driving change was added. The first low-contrast candidate looked flat and was adjusted to retain more texture contrast. Current seated evidence: .codex/review/lakeside-sand-transition.png. An access-lane distance fade removes the first candidate's hard near-edge transition by retaining soil at the driving shoulder and blending toward the water. The resulting change is subtle from the seated view. The broad forecourt and illustrative mountain silhouettes still need visual work; this isn't final acceptance.

Four existing landscape/shore-mesh/terrain-surface tests pass. They establish existing geometry constraints, not shader appearance. The browser compiles the shader and completes entry without console warnings/errors. No sustained-route performance, audio listening or physical-phone check was run for this material.

B05 reproduced during the first shader-candidate reload: readiness took 52,114 ms, including 37,107 ms between compiling/compiled markers, 2,388 ms for texture uploads, 5,937 ms until the first warmup marker and a 3,004 ms GPU wait that ended without the settled marker. Entry into the scene subsequently worked. A repeat after the texture-contrast adjustment reached ready in 3,687 ms, including 488 ms between compilation markers and a settled GPU fence. These are sequential development reloads, not a controlled attribution to the new shader. Build/test activity overlapped part of the first loading period. Evidence: .codex/review/shore-material-loading.json and shore-material-repeat.json. The startup defect remains open.

Final shoreline material TypeScript and production build pass (/tmp/porsche-shore-material-build.log), with the existing chunk-size warning. A fresh reload and cabin entry after adding the access-lane fade rendered without console warnings/errors. Final browser diagnostics: .codex/review/shore-material-final.json. The focused terrain checks preceded that final material-weight adjustment; no new geometry or driving logic changed.


Startup attribution and terrain batching: diagnostics now separate synchronous compileAsync submission from its readiness wait, record availability of parallel shader compilation and retain the eight longest startup animation-frame tasks. Terrain, rocks, props and vegetation have individual loading markers. These diagnostics remain opt-in development data. Three fresh starts, without concurrent agent builds/tests, reached ready in 2,395 / 3,157 / 3,307 ms. Shader submission took 21 / 26 / 28 ms, with another 75 / 108 / 140 ms until readiness. All confirmed their GPU fence. The 52-second outlier did not recur; this doesn't establish its cause. Evidence: .codex/review/startup-stage-attribution.json.

The detailed third run attributed 195 ms to terrain shaping, 42 ms to color/surface setup and 113 ms to vegetation, all within the same uninterrupted continuation. Ground-height calculation now uses the existing eight-millisecond batch scheduler, one grid row per work item. Heights and geometry formulas are unchanged. Cancellation disposes the unfinished geometry and checks the scene owner again after the final await.

The following fresh load reached ready in 2,673 ms. Terrain shaping elapsed time rose to 305 ms including yields, while the remaining combined landscape continuation was about 210 ms instead of the roughly 360 ms uninterrupted task. First hidden warmup still produced a 234 ms task. This is a responsiveness tradeoff, not proof of faster total loading or elimination of all long tasks. Evidence: .codex/review/batched-terrain-startup.json. No full-route or physical-device performance claim is made.

Seven scheduler/terrain tests, TypeScript and the production build pass. Logs: /tmp/porsche-terrain-batches-tests.log and /tmp/porsche-startup-attribution-build.log. The existing large chunk warning remains. A new development lifecycle control cancels at terrain-started: the browser released its WebGL context with zero canvases, then a normal retry reached 285 geometries / 62 textures / 78 programs. Final disposal again removed the canvas and released the context (renderer counters 0 / 2 / 5). No console warnings/errors. This isn't a memory-byte measurement. Evidence: .codex/review/terrain-loading-cancellation.json. Driving tuning is unchanged.


Lightweight-reader Escape fix: the standalone /projects page no longer passes a scene-navigation close handler to ProjectLaptop. Escape within a project note returns to the folder list and restores the selected folder's focus. A second Escape leaves the list and page alone. The standalone reader no longer renders a hidden object-close button. Cabin callers still supply their existing close callback, preserving Escape-to-seat behavior.

Ten focused ProjectReader/Entrance tests, TypeScript and production build pass. Logs: /tmp/porsche-reader-escape-tests.log and /tmp/porsche-reader-escape-build.log. Production browser verification opened bryce-os, pressed Escape to return with folder focus, then pressed Escape again: /projects stayed open with four folders and zero canvases, without console errors or warnings. Evidence: .codex/review/reader-escape.json. No physical keyboard/device matrix or new full-route check is claimed. Project facts remain unchanged and still need real screenshots, demos and results from Bryce.


Current full-route verification after shoreline material, terrain batching and reader Escape changes: all 229 tests across 51 files pass (/tmp/porsche-current-full-tests.log). The test process completed before the browser run. Normal Cruise reached Lakeside with the viewport unchanged at 1280 x 720, devicePixelRatio 2 and render density fixed at 1.35. No browser observation, test or build occurred between ignition and arrival capture. Sound remained muted, so this isn't an audio audition.

The 43 complete windows contain 10,320 frames and average approximately 75.30 fps (weighted from rounded window rates). One frame interval reached 1,709.1 ms in the second window, near route distance 1,275. Browser long-animation-frame attribution records a 1,702.8 ms event at navigation time 54,710.8 ms with an empty scripts list and zero blockingDuration. No sceneWorkStalls record exists. This doesn't prove a GPU, browser scheduling or external-system cause; the pause is an open Q02 defect and the average must not conceal it. No new resolution change or first-render JavaScript task was identified at that pause.

Approach, entry, ignition and parking maxima were 25.1 / 34.0 / 25.0 / 17.7 ms, with no intervals above 50 ms. Startup reached ready in 2,693 ms and confirmed its GPU fence. Browser console contained no warnings/errors. Evidence: .codex/review/current-shore-batched-full-route.json and current-shore-batched-arrival.png. This is one available browser/device run, not broader performance or visual acceptance. The next timing investigation should capture the early driving pause with GPU timing or a browser performance trace, without retuning the handling Bryce accepted.


Early-pause GPU follow-up: a fresh ?profile=journey&gpuProfile run had working GPU timer queries and parallel shader compilation. Normal Cruise passed the previously affected opening stretch at fixed 1.35 density. Fifteen complete windows contained 3,600 driving frames, approximately 79.76 fps weighted from rounded window rates, maximum 25 ms and no intervals above 50 ms. The 600 retained GPU samples averaged 8.77 ms and peaked at 17.25 ms. Three GPU samples above 20 ms occurred around navigation time 3.2 seconds during startup/approach, before driving. The earlier 1.7-second driving pause did not recur, so no cause can be assigned from this run.

Evidence: .codex/review/early-driving-gpu.json. Browser observations and commands didn't interrupt the measured opening stretch. After capturing the sample, the car pulled over normally and the console had no warnings/errors. Sound was muted. This is a short diagnostic run with additional query overhead, not a replacement for full-route evidence or proof that Q02 is resolved. No source changes or new tests were needed for this existing diagnostic mode.


Modified-key isolation: canvas driving/look shortcuts and the Entrance ignition/rev handler now ignore Meta, Control and Alt combinations. Previously Command-K/Control-K could invoke ignition and Alt-Arrow could steer or change the parked view while those combinations also belonged to browser controls. Plain driving keys and Shift combinations retain their existing behavior. Key-up handling still clears held inputs even when a modifier is present.

Nine Entrance tests, TypeScript and production build pass. The added test dispatches Meta/Control/Alt K at the focused cabin, verifies those events aren't prevented and ignition isn't called, then verifies plain K still invokes ignition once. Logs: /tmp/porsche-modified-keys-tests.log and /tmp/porsche-modified-keys-build.log. This test uses the scene harness; the canvas guard was checked in source, not a new real-browser shortcut run. Native browser shortcut behavior and physical-device combinations weren't exercised. The full 229-test run predates this added test. No handling parameters changed.


Skip-approach focus: closing the site menu after Skip approach now focuses the cabin canvas. Previously the focused menu button was removed with no focus destination. Ten Entrance tests, TypeScript and production build pass (/tmp/porsche-skip-focus-tests.log and /tmp/porsche-skip-focus-build.log). Production browser verification selected Skip approach, confirmed the canvas had focus, pressed Enter and reached the seated ignition view without console warnings/errors. This verifies the skip-to-entry keyboard path, not a new timing measurement of skipping mid-animation. No camera or driving tuning changed.


Trace content evidence, 6 September: the existing GitHub profile links to the public [Trace repository](https://github.com/brambach/trace). Its README supports the revised project note and identifies a local pre-v1 implementation. Added a source link to the shared project reader, available in both cabin and fallback. No usage results or runtime verification are claimed. The public repository listing didn't supply matches for the other three named projects, so their descriptions remain unchanged.

TypeScript and production build pass (/tmp/porsche-trace-content-build.log). Production /projects displays the note and correct GitHub link without console warnings/errors. Screenshot: .codex/review/trace-source-note.png. The actual Trace application wasn't run, and the new note hasn't been checked again on the in-car screen or physical phone. No tests were added for this content/link change. Q08 remains open for screenshots, further project evidence and Bryce's selection of the lead project.


Trace in-car verification: the production laptop displays the longer note and source link at 1280 x 720 without scrolling. Keyboard Tab reaches the source anchor with the expected GitHub URL. At a temporary 390 x 844 viewport, the note requires scrolling; tabbing from All projects to the source link scrolls it fully into view. Escape from that link closes the laptop and restores cabin focus. No console warnings/errors. Screenshots: .codex/review/trace-cabin-desktop.png and trace-cabin-narrow.png. The viewport override was reset afterward.

This is a responsive keyboard check on the available desktop browser, not physical-phone touch verification. A link that was already focused before resizing initially remained outside the scroll viewport until keyboard traversal brought it into view; focus visibility across a live resize remains a small unresolved layout issue. No code or content changed in this check, and the external repository wasn't opened from the cabin. The href was inspected directly.


Focused-control resize fix: the active embedded laptop observes its reading-area size and scrolls a focused control into view with nearest-edge positioning. The observer disconnects when the laptop becomes inactive or unmounts. It doesn't change focus or observe the standalone fallback. This addresses the off-screen focused Trace link recorded in the previous check.

Production verification focused the Trace source link at desktop size, changed to 390 x 844 and confirmed the same link remained visible without keyboard traversal. The reading area scrolled to 154.5 CSS pixels. Its transformed bottom was 476.75 px and the link bottom 476.78 px, a rounding-level difference; the label and focus outline were visible. Screenshot: .codex/review/trace-resize-focus.png. No console warnings/errors, and viewport override was reset.

Twelve existing reader/Entrance tests, TypeScript and production build pass (/tmp/porsche-reader-resize-tests.log and /tmp/porsche-reader-resize-build.log). The browser check establishes layout behavior; the existing tests don't simulate ResizeObserver. Physical phone rotation/touch and wider browser coverage remain untested. No driving settings changed.


Overlook ground cover: added low clusters using the existing fern model, with 40 of 48 dry-shore candidates accepted. Plants are 0.3-0.5 m high and grounded on the rendered terrain. Shore candidates use a five-metre margin beyond the 2.8 m access-road half-width, so they stay at least 7.8 m from its centreline; roadside placements retain their wider eight-metre margin. Water-height and main-road exclusions remain. The first attempt used the roadside buffer and rejected every shore candidate, so no visual change from that attempt was retained.

The existing 64-instance mesh and 52 m local radius remain. Shore clusters are considered first. At the parking reference, 77 total candidates are within the radius, so the cap excludes some roadside plants there. This bounds submission but doesn't prove zero additional rendering cost compared with the previously sparse overlook. No new model or texture download was added.

Two fern tests, TypeScript and production build pass (/tmp/porsche-shore-ferns-tests.log and /tmp/porsche-shore-ferns-build.log). The placement test now checks the five-metre minimum shared by all plants, plus ground height, main-road and water exclusions. Browser entry at the lake shows low foliage beside the granite without covering the central vista, with no console warnings/errors. Screenshot: .codex/review/lakeside-low-ferns.png. This is a modest visual candidate; full-route performance, moving plant transitions, physical hardware and final scenic acceptance remain open. Driving parameters are unchanged.


Fern budget transitions: nearby plants are now sorted by distance, with size fading toward the distance of the first plant outside the 64-instance budget (or the existing 52 m radius when fewer plants are nearby). This replaces insertion-order selection, which could displace a visible roadside plant when a distant shore cluster entered range. The candidate array and per-plant distance fields are reused. The fixed mesh budget, geometry and textures remain unchanged.

Three fern tests, TypeScript and production build pass (/tmp/porsche-fern-cutoff-tests.log and /tmp/porsche-fern-cutoff-build.log). A crowded-overlook regression advances the viewer across 80 m in 0.25 m steps, reaches the 64-instance limit and checks plant scale changes remain below 0.04 per step, treating disappearing/appearing plants as zero scale. This checks transition continuity, not subjective appearance.

A browser departure from the lake captured 11 completed windows / 2,640 driving frames with fixed density 1.35, a maximum 33.4 ms interval and no intervals above 50 ms. No console warnings/errors. Evidence: .codex/review/fern-cutoff-departure.json. This short functional/performance sample doesn't replace sustained-route, physical-device or moving visual acceptance. The earlier unexplained driving pause and startup outliers remain open. No handling settings changed.


Runtime graphics-loss recovery: after initial readiness, a WebGL context-loss event disposes the scene and notifies Entrance. The UI clears driving/object state, focuses a recovery panel and retains project/contact access plus an explicit reload action. Normal disposal removes the loss listener before intentionally releasing the context. Already-lost contexts aren't forced to lose again, avoiding the warning found in the first simulation.

Eleven Entrance tests, TypeScript and production build pass (/tmp/porsche-context-loss-tests.log and /tmp/porsche-context-loss-build.log). A development-only lifecycle button invokes WEBGL_lose_context. Real browser checks after readiness, including one after cabin entry, removed the canvas and focused Scene unavailable. Trace opened through the fallback dialog. A second check after the redundant context-loss call was removed produced no new warning; the log retained the earlier warning timestamp. Resource counters ended at 0 geometries / 2 textures / 5 programs with contextLost true. This isn't a retained-memory-byte measurement. Evidence: .codex/review/context-loss-recovery.json and context-loss-projects.png.

The listener is installed after readiness. Graphics loss during initial shader compilation remains outside this verified recovery path; existing compilation-disposal ordering is retained. This safety net doesn't explain or fix the rare startup delay or early driving pause. No driving parameters changed.


## Low roadside grass, September 6

Added short slope-aligned grass patches around the existing roadside fern locations. One instanced mesh is capped at 128 patches and 4,608 triangles, with a 58 m radius and a 14 m fade at the distance or instance cutoff. Geometry and material are registered with scene resources. No texture downloads or driving changes.

Fresh desktop review at 1280 x 720 shows the cover outside the passenger window and beside the moving road. The opening sample contains 2,400 frames at fixed 1.35 density, about 69.3 fps, maximum 26.9 ms and no frame above 50 ms. Startup reached readiness in 3,383 ms. No browser errors or warnings were recorded. Four grass/fern tests, TypeScript and build pass.

Evidence: `.codex/review/roadside-grass-seat.jpg` and `.codex/review/roadside-grass-drive.json`. This is a modest foreground addition. Sparse tree silhouettes, broad bare banks and overall scenery acceptance remain open. The full route, physical hardware, audio and resource disposal after this addition weren't rechecked. The earlier full-route hitch remains open.


## Combined regression and cabin project navigation, September 6

All 235 tests across 52 files pass after the AgentSky and grass additions. The older cabin-object test incorrectly prohibited the now-intended project links. It now checks the exact AgentSky and Trace destinations, includes all five projects, and retains the assertion that opening project notes doesn't navigate away. Log: `/tmp/porsche-current-regression.log`.

Live desktop review confirms the AgentSky note and study link fit the physical laptop. At 390 x 844, Tab scrolls the link into view with a visible focus outline. Return opens `/projects/agentsky`, with the correct title, zero canvases and no browser errors or warnings. The viewport override was reset. Screenshot: `.codex/review/agentsky-cabin-narrow.jpg`.

This confirms the cabin-to-study path in the available browser. It doesn't establish physical touch behavior, browser back restoration, memory-byte retention or sustained driving performance. Accepted handling remains unchanged. Scenery, the known timing outliers, audio audition and hardware acceptance remain open.


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


Promotion checks: all 240 tests across 52 files, TypeScript and production build pass (`/tmp/porsche-fixed-default-*`). A fresh production tab on port 3003 reaches readiness with effective ratio 1.35 and a 1920 x 1080 canvas at 1280 x 720. Browser warning/error logs are empty. This confirms the built default path; it isn't a production full-route measurement.


## Promoted renderer complete-route check, September 6

A fresh normal-motion Cruise run with the scenic default reached Lakeside. The browser inventory contained the saved parked preview and AgentSky reader before creating the only active test scene. No builds, tests or source edits ran during the drive. Viewport was 1280 x 720 and sound was muted.

The 39 driving windows contain 9,360 frames at weighted 69.7 fps, maximum 42.9 ms and zero intervals above 50 ms. Quality reduced the detailed-tree budget, then effective density from 1.35 to 1.2. The fixed canvas stayed allocated at 1920 x 1080. No long render-work callback was recorded. Approach, entry, ignition and parking each had a maximum below 26 ms. Browser warning/error logs were empty. Evidence: `.codex/review/fixed-default-full-route.json` and `fixed-default-arrival.jpg`.

This verifies a complete smooth route with a real quality change using the promoted path. It doesn't prove every window stays above 60 fps, explain prior low-rate sessions, establish performance on other hardware, or measure memory bytes. Keep those boundaries. Don't repeat the same full route without a new hypothesis or material change. The next work can return to visible scene/content quality while preserving handling and the now-verified fixed allocation.


## Far-bank height experiment rejected, September 6

A bounded terrain experiment added low uneven banks on the far side of the lake, using existing vertices and masking the road/access lane. Ten terrain/rock tests, TypeScript and build passed. The browser arrival showed that the raised bank made the plain strip beneath the panorama wider without adding convincing detail. The height change was reverted in full. Don't repeat a height-only far-bank experiment as the next visual fix.

Evidence: `.codex/review/far-bank-rejected.jpg` is a rejected candidate, not the current scene. The browser's ordinary viewport had changed to 861 x 864 during this turn. A temporary 1280 x 720 override supported comparison, then was reset. The camera angle was not identical to the older baseline because it had initialized at a different aspect. Follow device was restored and the test tab closed. Production was rebuilt after restoration (`/tmp/porsche-far-bank-restored-build.log`).

The next terrain/backdrop pass should address their visible join and material/detail relationship, not simply raise the bank or add more scattered plants. The accepted driving and previously verified renderer remain unchanged. No new sustained-route or audio check was needed for a reverted experiment.
