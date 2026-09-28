# One road: making /work and the drive one website

Status: in progress. Written 2026-09-28.

Decided (Bryce left these to judgement, 2026-09-28):
- The flat road becomes `/`, and the 3D drive moves to `/drive`. The switch happens last, once the handoff works.
- Arriving from the page, the 3D drive starts at the Tahoe overlook at dusk.
- AgentSky moves to the glovebox, and Dervo leads everywhere as the headline project.

Done so far:
- `/work` has one look (Original+) and no switcher.
- Dervo is Mile 01 on a wide board. Its live Catch up card resolves as the board settles in front of you.
- The Dervo study and catalog entry now describe the current Mac app, using the live trydervo.com headline.
- The catalog is ordered with Dervo first.
- The 3D overlays use Fraunces instead of plain Georgia.

- Phase 2 handoff:
  - Past 55% of `/work`, the page preloads the drive's code, and on desktops it also prefetches the car model.
  - "Take the wheel" zooms through the flat car's window to `/?from=work`, which skips the walk-up and intro.
  - A dusk cover (`src/prototype/WorkArrival.tsx`) shows the flat car while loading.
  - The drive then parks you at the lake and gets in.
  - The drive's "Read without the scene" and "Read the full portfolio" links now go to `/work`.
  - The flat car lives in `src/projects/FlatCar.tsx`.

Still to do from Phase 0: the shared token file, the shared menu and the flat-car loader for ordinary visits.

Today `/work` (flat, scroll-driven, `src/projects/SimplePortfolio.tsx`) and `/` (3D, `src/prototype/Entrance.tsx`) look and behave like two sites. They share no style tokens, the 3D menu never mentions `/work`, and "Take the wheel" drops you back at a daytime walk-up to the car in town.

The idea: **it's one trip.** `/work` is the trip told flat and fast. The 3D drive is the same road, driven for real. Same stops, same signs, same type, same car, same voice.

## Decisions needed first

1. **Which page is the front door?** Proposal: `/work`'s road becomes `/`, and the 3D drive moves to `/drive`. It's quicker to load, works on phones, and shows the work first. The drive then becomes the reward at the end of it. The alternative is to keep the 3D at `/` and treat `/work` as the "light" version. That's easier, but it keeps the two-sites feeling.
2. **Where does the 3D drive start when you come from the page?** Option A: at the Tahoe overlook at dusk, where the page ended. You're in the seat, the engine's ticking, and you drive home yourself. Option B: back in town at dusk, taking the long way again with the wheel. A is the stronger continuation. B shows more of the world.
3. **AgentSky.** See the end of this doc.

## Phase 0 - One look (foundation)

- **Keep one look on `/work`.** Make Original+ the only one and delete the switcher plus the Daylight, Graphite, Paper and Original variables from `src/projects/simple.css`.
- **Shared tokens.** Add `src/styles/road.css` with the palette and type both pages use:
  - cream `#f4efe4` / `#eee7d6`, ink `#1f2a22` / `#303b31`, racing green `#2f5d3a`, sign green `#243c34`
  - Fraunces (SOFT 100, WONK 1) for display, Hanken Grotesk for body, IBM Plex Mono for labels, Caveat for handwritten notes
  - Point `entrance.css`, `live-entrance.css`, `journey-finish.css`, `road-notes.css` and `quiet-idle-loader.css` at those tokens. In particular, replace the plain Georgia in `journey-finish.css` (lines 44, 47, 68, 69) with Fraunces.
- **One menu.** Pull the 3D menu (`Entrance.tsx:351-463`, `nav.simulation-menu`) into a shared `SiteMenu` with the same wordmark and items on both pages. "Read without the scene" should point at the flat road, not `/projects`.
- **One loader.** Replace `QuietIdleLoader` (the grey overhead car) with the flat 911 idling on the road, so loading the 3D looks like the page you just left.
- **One voice.** Canvas signs in 3D use `sign()` in `journey-world.ts:107-112`. Reuse its green and cream sign style for the flat mile markers and café/tennis signs, so a sign on one page looks like a sign on the other.

## Phase 1 - Same road on `/work`

- **Mirror the 3D stop order** (`journey-route.ts:10-16`): town, café "THE LONG WAY" (.075), tennis club "YOUNG PRODIGY PARKING ONLY" (.18), then the lake (.61). Project billboards sit between the stops.
- **Flat versions of the café and tennis club** as roadside scenery with the same sign text. Add the "LAKESIDE - YES, THIS COUNTS AS LOOKING AT MY SITE" sign just before the overlook.
- **Match the light.** The 3D dusk ramps in between .30 and .61 of the route (`journey-world.ts:290`). Time `/work`'s sky to the same stops so both pages share the same time of day.

## Phase 2 - The handoff

- **Preload.** Once someone passes about 60% of `/work`, start `import()`ing the Entrance chunk and fetching `porsche-1975.glb` (17 MB), so the drive is mostly ready by the end.
- **Window zoom.** "Take the wheel" makes the flat car roll forward, and the view zooms through its side window. The glass fills the screen and fades into the loader (the same car), then the 3D scene.
- **Arrival from the page** (`?from=work`, plus a sessionStorage flag):
  - Skip the approach by setting `bryce-arrived` (`Entrance.tsx:191`, `car-scene.ts:238`).
  - Seat the visitor with `enter()` (`car-scene.ts:~451`) and use the `returning` intro step (`Entrance.tsx:44`).
  - Allow ignition straight away (`car-scene.ts:492`).
  - Start at the chosen spot: `goStraightTo('lake')` (`car-scene.ts:1181`) for option A, or the town start `.025` (`scenic-drive.ts:26`) for B.
  - Start at dusk. Daylight is derived from `furthest` (`journey-world.ts:263, 290`), which never goes down, so add a daylight override or seed `furthest`.
- **Carry things over.** The trip meter continues ("4.2 mi already"). The sound setting and volume become one localStorage key for both pages. If sound is on, the radio fades in at the overlook on `/work` and keeps playing in the car.

## Phase 3 - The drive

- **Take over from autopilot.** Any gas or steer input turns autopilot off:
  - `city-route.ts:135` currently drops everything but brake, and `:248` clears inputs each frame. Set `tourAutopilot = false` and `automatic = false` on the first gas or steer.
  - `Entrance.tsx:55` currently derives `tourAutopilot` from `race.phase` only, so update it too.
  - Show a chip, "You're driving · A for autopilot". Ten seconds with no input offers autopilot back. It never grabs the wheel on its own.
- **Project billboards on the road.** Put `TextureLoader` planes placed with `journeyRoad.frame(d, offset)`, the same way signs are placed (`journey-world.ts:131-141`). Use the same covers and mile numbers as `/work`, keep them clear of stop turn-ins, and have pulling over near one open that study.
- **An ending at the lake.** After "Stay a little longer" (or after the race finish), the engine switches off with a tick, and the radio keeps playing. The camera tilts up to the stars and a sign-off card fades in, styled like `/work`. It has a handwritten "thanks for taking the long way", contact, "drive back" and "read the work". The lake card and race panel sit at `Entrance.tsx:635-652`.
- **Deferred:** a recorded voice call from Bryce instead of the text-only phone call.

## Phase 4 - More life on `/work`

- **Each project gets its own stretch of road:**
  - **Dervo** ("Come back knowing"): a rest stop where a bench, a coffee and a "you were here" note appear as you arrive.
  - **Lucid** ("From conversation to clarity"): fog sits on the road and clears as you reach the billboard.
  - **Arro** ("Every day forward. Together."): little runners jog along the verge and wave at the car.
  - **Port** ("A moment to close"): the scene goes quiet. The exhaust stops, sound dips, the sky dims for a beat, then the world comes back.
  - **Integration portal** ("Make the complex legible"): tangled power lines along the road pull straight as you pass.
- **Opt-in sound.** Add a small speaker toggle. It plays the 911 idle, pull and redline samples from `public/audio/forest-drive` (used by `car-audio.ts`), with pitch following scroll speed. It's muted by default.
- **A car you can play with.** Tap it to honk (reuse the oscillator horn from `car-audio.ts`) and make it bounce. Hold to rev. The first scroll turns the key.
- **Memory.** If `bryce-journey-v2` says someone has been before, the page greets them: "Back again. Your usual spot's free."

## Suggested order

| Step | What | Size |
|---|---|---|
| 1 | Phase 0: one look, shared tokens, one loader | small to medium |
| 2 | Phase 2 handoff: preload, window zoom, `?from=work` arrival at dusk | medium |
| 3 | Phase 1: same stops and signs on `/work` | medium |
| 4 | Phase 3 take-over and lake ending | medium |
| 5 | Phase 3 billboards in 3D | medium |
| 6 | Phase 4 per-project scenery, sound, playable car | large, can be split |
| 7 | Front-door switch (if decision 1 is yes): `/` becomes the road, `/drive` the 3D, with rewrites in `vercel.json` | small, but it's a launch decision |

Each step ships on its own, with lint, tests, a build and screenshots.

## AgentSky

It has the most material on the site: a 33-second walkthrough film and about 6 MB in `public/project-lab`. It's also the weakest story. It's an independent concept where "all runs and cloud transfers are illustrative" (`catalog.ts`), and it currently leads the road as Mile 01. Recommendation: take it off the road and move it into "Also in the glovebox" with its film. That leaves five billboards, led by Dervo. `prototype/AgentSkyProject.tsx` isn't imported anywhere and can go at the same time.

## Known risks

- The 3D bundle is large (about 38 MB of assets). Preloading helps, but phones may still struggle. Nothing has been tested on a physical phone.
- `docs/implementation/porsche-quality-list.md` lists these as still open, and they matter more once `/work` sends people into the drive:
  - traffic contact
  - a radio and ring listening pass
  - other browsers
  - 48-52 s startup outliers
