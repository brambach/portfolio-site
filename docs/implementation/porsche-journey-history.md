# Superseded journey history

Archived 6 September 2026 after Bryce approved the bounded first-version scope. This is implementation history, not the current completion criteria.

# Porsche journey goal

Updated 6 September 2026. Status: active, not accepted as complete.

## Scope and current direction

Build a convincing personal Porsche website with continuous entry, readable physical cabin content, satisfying driving and responsive recorded sound. The main fictional route visits a neighbourhood café for a flat white, optional tennis club and store, foothills and forest, a hiking trailhead and a Tahoe-inspired destination. Don't use private addresses. Let visitors skip, stop, explore and return through an in-car map. Travel moves gradually from warm afternoon toward evening.

Bryce's latest direct requests add a late city drive, manual steering and pedals, more speed and engine volume, downshifts and traffic. The city implementation is a working performance prototype. Keep it available while developing the coherent journey; its procedural blocks aren't an accepted final environment.

The later direction task asks for an overhead forest introduction and subtle physical discovery without persistent bottom navigation. It also repeats an older sticky-note ignition invitation. Bryce directly rejected that note in this task, so don't restore it. Retain the continuous ignition sequence with a more natural discoverable control. Replace the temporary cabin shortcut row once physical discovery and its keyboard/touch equivalent are verified.

## What exists

- Classic green 911, door and continuous cabin entry.
- Physical project laptop with projected, clickable HTML and a `/projects` fallback.
- Front-seat tennis racket and supplied younger-years facts. No invented history.
- Four-photo board, now on the passenger dashboard. Contact card and portfolio content remain.
- Preserved misty forest, fixed-elevation fog and warm sunset source/assets.
- City prototype with manual bicycle steering, pedals, optional lane-following Cruise, smooth parking, Q/E gear requests and 28 traffic cars.
- Shared engine RPM for gauges, HUD and louder recorded audio. Manual gear speed limits enforce the 7,000 RPM cap.
- Adaptive canvas resolution and opt-in local rendering diagnostics.
- 135 passing tests across 30 files; latest city build and TypeScript pass. Browser checks and limits are in `src/prototype/VERIFICATION.md`.

## Milestones and acceptance

### 1. Finish the current performance and interaction pass

Deliver a reviewable city prototype without treating its scenery as final. Verify sustained driving, manual gears, following traffic, collision recovery, touch controls, object parking and the shared audio/gauge state. Preserve user sound preferences. Record repeatable performance samples and resolve resource cleanup issues before expanding the world.

Evidence so far: a 767 × 864 local browser sample measured 21.5 FPS for the forest and 70.3 FPS for the city, with the different scenes and canvas ratios documented. Phone-width gear changes and photo/laptop access work. Physical phones and listening haven't been checked.

Exit checks: current changes pass tests and build; no new console errors; repeated enter, drive, park, inspect, resume and exit works; fresh load and aborted load clean up resources; representative screenshots and limitations saved.

### 2. Make the short drive and audio convincing

Choose a coherent licensed visual and engine reference. Audit the existing car and cabin in representative views. Research suitable scenery and recordings before spending time decorating inadequate geometry. Build a short representative road section with convincing scale, road edges, near materials, reflections, shadows and atmosphere.

Exit checks: no clipping, floating props or see-through surfaces in the entry and driving views; sustained local performance stays enjoyable; no abrupt quality or atmosphere changes; suitable licensed audio responds to throttle, RPM, shifts and lift-off; listening is checked where tools permit, otherwise explicitly outstanding for Bryce.

### 3. Complete café to forest to trailhead

Add a connected main road, destination parking and an in-car route map. The café can be a service window and a flat white returning to the cabin. The trailhead includes engine-off forest ambience and a short walk to a view. Optional traces can reflect visits; don't require collectible chores or reading content to keep driving.

Exit checks: visit, skip and revisit each stop; park, explore and resume without redirects or camera discontinuities; maintain correct car and object state; check keyboard, touch and reduced motion.

### 4. Add tennis, store and Tahoe arrival

Add optional turnoffs that rejoin the same route. Use the supplied tennis facts only. Tahoe is inspired by his parents' place, with no claimed address or invented family detail. Include a coherent place for the requested late city drive and traffic without abandoning the forest journey.

Exit checks: map navigation reaches every implemented destination and returns naturally; scenery and time progression stay continuous; each stop adds a personal purpose without giant placeholder interiors.

### 5. Finish content, accessibility and full-flow review

Complete the verified portfolio content, loading and error states, quiet accessible fallback and physical interaction cues. Remove temporary control clutter. Run all implemented journey paths, repeated visits, resizing, tab suspension, input changes and resource cleanup checks. Resolve known bugs rather than hiding them behind passing tests.

Exit checks: meaningful regressions pass; representative desktop and phone-width views are inspected; available hardware performance is measured; remaining asset, audio and physical-device limits are explicit. Bryce reviews the completed journey before subjective polish is accepted.

## Completion rules

Don't mark the goal complete for a working demo, a screenshot or one finished milestone. Convincing visuals, satisfying audio/driving, the complete agreed route and final review are required. Don't promise mathematically bug-free software or untested device support.

No purchases, commits, pushes or deployments without specific authorization. Continue routine implementation and verification without requesting approval for each small change. Ask only when an actual missing asset/license, personal fact, hardware check or final review prevents progress.

## Durable records

- `docs/implementation/porsche-quality-list.md`: unresolved bugs and quality requirements.
- `src/prototype/VERIFICATION.md`: current evidence and testing boundaries.
- `.codex/review/`: review screenshots and performance samples.

## Connected route progress, 6 September

The `?journey` preview now has one connected fictional road, separate destination locations, a route map, destination-aware Cruise and smooth parking. The drivetrain and traffic take road geometry as a dependency, so the original city remains available at `/`. The map shows position and visited stops and can send the car to earlier stops on the next circuit. A complete simulation test visits all six stops with traffic and returns to the café. Per-stop tests park within a metre of their targets. Reduced-motion selection is covered separately.

The browser reached the café, displayed its arrival heading and marked the map visit. The map was inspected on desktop and at 390 × 844; it scrolls to every destination. No warning or error appeared in the new preview tab. The older city tab had crashed before this preview loaded; the cause hasn't been established.

This is route implementation, not accepted visual completion. The stop buildings are initial geometry; the terrain is flat, forest coverage is sparse, and lake scenery needs work. Coffee ordering, engine-off walking, physical map discovery, actual branching turnoffs and final stop interactions remain unimplemented. The map must move into the physical cabin discovery flow before the temporary navigation row is removed. Time affects the sky and sunlight, but the full atmosphere and audio progression still need integration. The forest uses up to 48 nearby instances of the existing low-detail tree, with corrected quantized geometry and size. Its actual final performance hasn't been sampled yet.

## Café visit progress, 6 September

The café stop now supports stepping out through the existing car exit animation, walking to its service window, ordering a flat white, returning along the same path, and getting back in. The engine switches off for the visit. The coffee appears on the counter and stays in a visible cabin holder after returning. Driving inputs are disabled during the visit. A return can begin midway through walking; reduced motion skips the walk but retains ordering and return state.

The service window now has an open, shallow interior with warm lighting, counter, shelving and an espresso machine. This is an architectural pass using locally generated geometry, not final asset acceptance. Full browser order/return was checked before the last interior and holder refinements; final visual evidence is recorded separately in VERIFICATION.md. The wider route, terrain, audio quality, walking trail, turnoffs and final physical navigation remain unfinished.

## Trail and terrain progress, 6 September

The journey now includes raised terrain around the forest road and a ground-following trail to a viewpoint. The trail visit reuses the engine-off door transition, supports returning midway, and preserves reduced-motion behaviour. Trees follow the terrain and their nearby selection follows the walking camera. The existing credited CC0 forest recording loads on demand for the trail and fades when returning to the cabin.

Tests prove road clearance, rising trail elevation, walking eye clearance, return continuity, reduced-motion state and delayed audio cleanup. Browser arrival/walk evidence is in VERIFICATION.md. This doesn't accept the landscape as visually complete: forest density, the lake shoreline, road edges, distant scenery and physical turnoffs still need work. The viewpoint is a first implementation of the requested walking stop, not a finished Tahoe vista.

## Lake basin progress, 6 September

Added an irregular water edge, carved a submerged basin and lowered nearby terrain to clear the parked driver's view. The roadside sign moves away from the main sightline. Development-only stop positioning supports visual review without waiting for a full circuit. All 137 tests, TypeScript and build pass. The lake is visible from the cabin, but remains distant and visually unfinished. This review doesn't establish complete-route or physical-device performance.

Investigated Poly Haven's CC0 pine tree source. Its 17 million triangles and roughly 949 MB geometry buffer make it unsuitable as a direct browser replacement. Only metadata was downloaded; no new tree asset was added. A suitable optimized forest asset is still needed.

## Physical map progress, 6 September

The resumed goal run made implementation progress. A folded dashboard map now uses the same route layout as the readable destination dialog. Clicking it parks first if needed, puts away held objects and opens the route. The site menu keeps keyboard access. Removed the temporary journey cabin row. Browser checks covered desktop and phone-width object selection, café-to-tennis arrival, selection focus and parking before opening. All 138 tests, TypeScript and production build pass.

The full goal remains incomplete. Next work should address representative scenery and sustained journey performance, followed by branching turnoffs and unfinished stop interactions. Physical phone testing, listening and Bryce's final review remain outstanding, but don't prevent further implementation.

## Sustained rendering progress, 6 September

Added bounded, whole-drive diagnostics and measured the current sparse forest-to-lake section. Nine moving windows covered 2,160 frames over about 36.3 seconds at 1280 × 720 and canvas ratio 1.5. Window rates were 58.5 to 60 FPS, with a maximum recorded frame of 33.3 ms. The car reached the lake. Raw evidence and measurement limits are in VERIFICATION.md. All 139 tests, TypeScript and build pass.

A CC0 fir asset has a much smaller source than the previously investigated mature pine, but uniform simplification stripped its foliage. Browser inspection rejected that result; the public experimental asset and review switch were removed. The next available action is a canopy-preserving tree representation with near and distant detail levels, followed by a repeat of the same driving sample. This is an implementation problem, not a blocker requiring Bryce's approval.

## Fuller forest progress, 6 September

Implemented canopy-preserving tree rendering and spread trees across the hills. The near model keeps its source geometry; distant trees reuse eight rendered views. Fixed a screen-pixel-ratio error that initially broke the atlas into rectangular fragments. The corrected forest is visible on desktop and at phone width. Matched forest-to-lake driving windows held 61.7 to 64.6 FPS and lower triangle counts than the previous sparse forest. All 140 tests, TypeScript and build pass.

This is progress toward the complete journey, not a visual acceptance or completion claim. Ground materials, road edges and width, distant city clipping, near/distant lighting transitions and startup/memory cost remain open. Next available work includes fixing city fragments at the lake and making the terrain and road edges belong to the forest, then completing turnoffs and stop interactions.

## Roadscape and horizon progress, 6 September

Fixed floating city fragments at the lake by fading complete building instances before the camera far plane. Replaced a visibly grainy intermediate fade with smooth, distance-sorted transparency. Nearby city buildings still render. Narrowed and textured the forest shoulders and varied the terrain tint. Desktop lake, city and forest views show the changes without returned console errors. All 140 tests, TypeScript and build pass. Performance wasn't resampled for this material pass.

The next substantial implementation is connected optional turnoffs and road geometry that fits each part of the journey. Destination selection currently parks on the main road; that must become a real drivable access route that rejoins the road, with manual steering and Cruise both supported. Don't call a wider parking animation a completed branch network. Forest road proportions and traffic lanes need to agree. Stop interactions at tennis, store and lake remain unfinished.


## Access roads and traffic merges, 6 September

The previous status-only goal turn didn't change the implementation. This continuation verified the completed braking fix and made further implementation progress: Cruise now checks rear traffic during lane changes and waits outside the main lane at a blocked access-road exit. A full-route simulation exposed contact leaving tennis, so the merge prediction now allows for acceleration during the approach. The six-stop plus café-revisit test asserts no contact throughout.

Every stop has an open branch that leaves the road, passes its forecourt and rejoins farther along. Manual steering and Cruise use the same geometry. The map and physical route paper draw those branches and show the actual car position. Buildings, tennis court, terrain and tree clearance now account for the access roads. A fast parking manoeuvre can continue beyond a branch endpoint without freezing position while the speedometer falls. Selecting a nearby stop while already on its branch no longer adds an unnecessary full circuit.

The browser completed café departure and tennis arrival with the new branches and merge checks. The final acceleration allowance is being verified separately on tennis departure. These checks don't establish the full goal: forest lane proportions, the tennis/store/lake activities, complete-route atmosphere, visual quality, hardware checks and Bryce's final review remain open. The next substantial milestone is a forest road whose markings, width and traffic agree, followed by purposeful stop interactions.
