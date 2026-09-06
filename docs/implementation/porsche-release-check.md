# Porsche release check

Updated 6 September 2026. The goal remains active. Preview: http://localhost:3003/

| Requirement | Evidence | Status |
| --- | --- | --- |
| Complete journey at the ordinary homepage | Fresh production entry, four-object tour, key handoff, café invitation and three-stop map. `plain-homepage-handoff.json`, `plain-homepage-map.jpg`. | Verified through handoff; town route has separate full-trip evidence. |
| Preserve handling, traffic, gears, cruise and parking | Approved behavior retained; route simulations and production optional-stop arrivals. No tuning changes in this polish pass. | Functional evidence present; unusual traffic encounters remain a documented limitation. |
| Mandatory short cabin tour and physical objects | Production tour completed repeatedly; 18 Entrance tests cover gating, project access and keyboard continuation. | Verified; final materials review pending. |
| Cleaner controls, type and overlays | Paper materials, dashboard controls, larger advance signs; 390/320-pixel screenshots and keyboard checks. | Implemented and checked in representative views; subjective acceptance pending. |
| Noticeable optional café and tennis | Initial café invitation, speed-aware tennis invitation, advance signs and successful pull-ins. `tennis-pull-in-production.jpg`. | Functional checks pass. Tiny sign subtitles aren't established as readable at speed. |
| Personal discoveries without repeated interruption | Two sign jokes, optional call, independent radio switch; hidden-panel ringing and lost focus fixed. | Implemented; audio balance and humour need Bryce's review. |
| Concise first trip and mandatory the lake finish | Current direct trip measured; simulated duration about 157 seconds; assistance retains braking. Lake finish gives the view space and links projects/contact. | Verified on available browser; final presentation review pending. |
| Explicit ending and continued exploration | the lake card, project laptop, full portfolio, contact and Stay a little longer. No automatic departure from arrival. | Browser and component evidence present. |
| Real portfolio and quiet fallback | Five project notes; AgentSky study and Trace source; `/projects` navigation and arro notes opened in browser. | Supporting source/screenshots for three entries remain requested. Don't invent them. |
| Sustained performance | Recorded direct journey: 10,354 frames, 67.854 fps, max 33.8 ms, no intervals over 50 ms. First-card default: 282 ms preparation then max 17.5 ms motion interval. | Measured on M4 / 16 GiB. These aren't universal device guarantees or a final-production GPU benchmark. |
| Desktop, keyboard, touch and reduced motion | Desktop journeys, keyboard focus/scrolling, reduced-motion arrival, pointer cancellation/hold tests and narrow viewports. | Physical-phone input remains unverified; viewport checks don't replace it. |
| Resource cleanup and regression | Existing browser context-release evidence; source collection covers new signs; 17 resource/audio tests. Full suite 269 tests before default-route promotion, 22 affected checks afterward. | Evidence present; retained memory bytes and long-session stability aren't measured. |
| Limits, prototypes and authorization | Credits record audio source/processing and original music. `?forest`, `?city`, `?journey` preserve prototypes. No purchases, commits, pushes or deployment. | Recorded. Race remains outside the saved goal. |
| Bryce reviews the finished experience | Earlier approval predates this final polish and preparation change. | Pending. |

## Review still needed

Use the plain homepage for the current journey. Check the paper objects and buttons, the short wait before the first card lift, radio/ring balance, optional-stop cues and the lake finish. The phone has a text reply, not a recorded voice.

A separate local phone preview is listening at http://172.20.10.2:3004/ on this Mac's current network address. HTTP 200 was verified from the Mac. Phone reachability and touch behavior still need Bryce's check; the link depends on the current network connection. The desktop preview at port 3003 remains unchanged.

Physical-phone input and broader hardware behavior remain unknown. Deeper project evidence has been requested separately. These are outstanding checks or content questions, not permission to publish.

Detailed logs, screenshots, failed experiments and their limits remain in `porsche-review.md` and `porsche-quality-list.md`. Historical outliers shouldn't be described as newly reproduced failures, and successful checks shouldn't be stretched beyond the hardware or path they covered.

## 7 September scope update

Bryce added mandatory outward autopilot and a lake-to-start return race with a shared leaderboard. See `return-race.md` for implementation and connection status. Current checks: 284 tests across 62 files, TypeScript and production build pass. Desktop countdown/manual handover and 390×844 race layout checked in the browser; the scripted driver finished the physical return route. A full human-driven lap, final finish-screen visual review, physical phone race and audio audition remain pending.

Created the free `bryce-portfolio-race` Upstash database after Bryce chose Upstash. Vercel reauthentication is required to obtain its connection details; the local shared-board round trip isn't verified yet. No paid plan, live project connection, commit, push or deployment was made.

Finish-card follow-up: cream-paper timing slip, editable-field shortcut guard and explicit offline submission state are implemented. The live Upstash write/read and duplicate checks now pass; their test data was removed. Bryce's observed 0:41.106 result was preserved and registered for optional submission through a separate local card, leaving the original race tab untouched as requested. 27 affected tests, TypeScript and build pass. Human card, race and audio review is still pending.


## Final polish pass, 7 September 2026

Implemented a loading overlay tied to scene readiness, a visible Get in button, and a short repeat-visit fade with reduced-motion support. Added Race times in the menu, the actual time to beat at the lake, a top-five finish board with the entrant's rank, and locally saved results that can be reopened. Leaderboard failures have retry controls. Three spaced honks trigger one short passenger joke; the radio has small personal copy. The phone trigger now has a wider route window when cabin interaction delays it.

Finished-result views block ignition/rev shortcuts and hide the underlying ignition control. Existing editable-field shortcut protection remains. Driving physics and the route weren't changed in this pass.

Validation: 289 tests across 63 files pass, TypeScript passes, and production builds. The existing large-bundle warning remains. Browser review confirmed the reduced-motion cabin tour reaches the lake, which displays the real shared score `bryce :) / 0:41.106`. Race times loads the same score, closes with Escape, and is centered at a 390-pixel viewport. Evidence: `.codex/review/final-polish-leaderboard-mobile.jpg`. The normal motion preference was restored after testing. User-owned race tabs weren't reloaded.

Remaining acceptance: Bryce's review of the opening, revised audio balance and small jokes; a physical phone check; and a clean sustained performance run without concurrent scene tabs. This pass doesn't establish new frame-time results or stronger race anti-cheat. Shared Redis works locally, but the site hasn't been deployed or linked to a Vercel project. The existing live portfolio belongs to another repository. The original 41.106-second result remains on the shared board.
