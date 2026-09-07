# Porsche v2 milestone plan

Started 7 September 2026. This plan supersedes older scope and release restrictions where Bryce has explicitly authorized v2 and deployment. Preserve earlier measurements as historical evidence, not current benchmarks.

## Milestones and acceptance

| Milestone | State | Evidence needed |
| --- | --- | --- |
| 1. Loading and measurement | In progress | Fresh desktop and narrow-screen runs with environment stated; scene readiness, failures and intro completion tracked; physical-phone limitations explicit |
| 2. First visit and route pacing | Implemented, final route review pending | Short mandatory introduction; project and personal depth placed at meaningful stops; no dead ends; first-minute route/race orientation |
| 3. Return visits | Implemented, final route review pending | Completed onboarding, discoveries, sound and personal best persist; direct race retry and projects; explicit reset; storage denial works |
| 4. Project story | Source verified, revised copy in review | At least one verified problem/contribution/evidence presentation, checked against source material |
| 5. Race finish | Deployed, full-route acceptance pending | Personal best, next-place gap, immediate retry, downloadable timing slip, real-target challenge link; AI label retained; score-validation assessment |
| 6. Personal reactions | Implemented locally, review pending | A small set of persistent consequences using confirmed personal facts; no invented memories; quiet scenic moments preserved |
| 7. Garage and acceptance | Signals deployed, owner acceptance pending | Loading, intro, project/contact, the lake, race and retry signals explained correctly; auth and resource checks; Bryce's completed-journey review |

## Current risks and quality queue

- No fresh physical-phone or constrained-network baseline. A 390px desktop viewport isn't a phone performance test.
- Current Porsche GLB is roughly 18 MB on disk. Verify actual compressed transfers and decode/GPU cost before changing assets.
- Readiness follows shader compilation, texture warming, multiple first draws and a GPU wait. Avoid moving that work into entry and reintroducing stutter.
- Existing counts are once-per-browser-tab session. Daily step totals aren't a matched-user conversion funnel.
- Mandatory cabin flow is now one contact card before ignition. Deeper objects remain available in the cabin and at relevant stops; verify the final full route with Bryce.
- Sound preferences persist; verify other persistence and reset semantics before extending them.
- Production owner password setup completed. First authenticated browser login wasn't observed by the agent.
- Casual leaderboard validation doesn't prove that submitted movement obeyed the physics. Don't market it as cheat-proof.
- No additional paid services or public social posts authorized.

## Working rules

Keep approved physics, audio and route intact. Test the behavior changed, then run relevant regression checks. Record screenshots and measurements with their actual environment. Use small reviewable commits. Don't accept subjective polish without Bryce's review. Ask for genuine personal facts when an Easter egg depends on them.

## 7 September baseline and first change

Read the existing `data-scene-loading` diagnostics from the real canvas in the Codex in-app browser on this Mac, using local Vite development at `127.0.0.1:3001/?profile=journey`.

| Run | Scene prepared | Compiled | Textures uploaded | Ready |
| --- | ---: | ---: | ---: | ---: |
| Desktop, default viewport | 2,327 ms | 2,478 ms | 3,257 ms | 3,735 ms |
| 390 × 844 viewport, subsequent reload | 1,752 ms | 1,873 ms | 2,532 ms | 2,846 ms |

These timings start at profiler initialization, not navigation. The second run benefits from prior caches and uses the same desktop GPU. Neither establishes physical-phone speed, network transfer time, sustained driving FPS or a cold production baseline. Both reached 343 geometries, 74 textures and 85 shader programs at readiness.

Added production signals for scene loading, scene ready, load failure, rendering failure and completed introduction. Navigation-to-ready is reported in four coarse buckets. All buckets share one client and Redis deduplication key so a faster reload cannot record a second timing bucket for the same session. The garage presents timing buckets and failures separately from route progress. Existing historical session counts won't acquire these new signals retroactively.

Validation: 33 targeted tests pass, TypeScript passes, production build passes. No physics or asset changes in this increment. Next: cold production and constrained-device evidence, then the shorter introduction and return-visit state machine.

## Short introduction and returning visitors

Implemented one mandatory contact card before the keys. Racket and field notes remain in the menu, and the café/tennis parked controls offer projects/the racket at the relevant stop. The introductory copy previews that the remaining objects travel with the visitor.

Saved onboarding now produces a welcome-back choice after entry. Completed the lake arrivals unlock an explicit race shortcut; the shortcut moves a stationary seated visitor to the lake, resets inputs, collision state and drivetrain, then uses the existing race countdown and traffic reset. It doesn't change acceleration, steering or gear ratios. Discoveries and visited stops persist; the menu can reset introduction/discovery progress without deleting saved race results or sound preferences. Personal-best presentation and immediate post-finish retry are still pending.

Verified in the real local browser: reduced-motion entry, single card, keys, reload, welcome-back state; a development-only staged lake arrival then unlocked and successfully started the real countdown and manual controls. The staged test isn't evidence of a complete outward trip. The test run was cancelled without publishing a leaderboard result. Motion preference was restored afterward.

313 full-suite tests passed; subsequent discovery persistence changes passed 25 focused tests, TypeScript and build. Additional checks cover blocked/corrupt storage, reset isolation, first-trip shortcut gating and repeat-race drivetrain reset. Introduction completion is recorded on the actual key handover, not when a returning visitor skips it.

## Race finish work in progress

Added device-local personal best with migration from the previous saved finish. A slower run preserves the best; invalid or blocked storage doesn't interrupt the finish. The finish compares against the nearest faster entry returned by the board, with a displayed-standings qualifier at the board boundary. It offers race retry after the saved the lake milestone. Retrying explicitly resets React's countdown state and remounts the race panel so the server starts a new run instead of reusing the finished request.

28 focused tests pass and TypeScript passes. These changes still need browser verification before deployment. Timing-slip download, server-resolved challenge targets and a complete next-place lookup beyond the top 20 remain pending.

Added an SVG timing-slip download with escaped driver text, real elapsed time and object-URL cleanup. Posted finishes can copy a canonical challenge URL; the lake time-to-beat resolves its target from the existing Redis board by ID. Missing/pruned targets are explained. The API now returns the selected entry and preceding place across the retained 200 rows, so posted drivers outside the visible top 20 can see their next-place gap. Retry also pre-fills the previous name.

37 focused tests passed before the final challenge cases; the subsequent 8 panel/board tests and TypeScript pass. Build passes. New tests cover server target resolution, missing targets, URL-time tampering, artwork escaping and existing result restoration. Local browser confirms the returning visitor's race shortcut is available at the staged lake. Finish download, clipboard, retry remount and narrow-screen visual checks are still pending; nothing from this increment has been deployed.

Finish verification: the actual RacePanel rendered with Bryce's existing published result against the local API. Desktop and 390 × 844 screenshots showed the paper layout fitting without horizontal clipping. Moved retry above the leaderboard so it appears beside the result. Posted names are read-only. Clipboard confirmed success through the UI, and clicking download created `the-long-way-timing-slip.svg` in Downloads. The review fixture is ignored and doesn't ship. This was a component review, not a completed physical-phone race.

All 322 tests across 69 files pass, TypeScript passes, production build passes and diff whitespace checks pass. The new Entrance test proves a retry remount starts a second server request, preserves the previous result and doesn't register that finish again. Full live-route retry and physical-phone checks remain in final acceptance. The existing large-chunk warning remains.

## Garage engagement signals

Race finish commit b10b76a deployed successfully. Production readback returned Bryce's existing target, rank and preceding entry without adding any test results.

Added once-per-session events for opening projects (quiet page or cabin laptop), opening the AgentSky study, clicking Bryce's email, opening his social profiles, and choosing Race again. The garage groups these separately from the route tally and explicitly distinguishes clicks from sent mail, retries from completed laps and sessions from total clicks. Link classification accepts only Bryce's known destinations. It sends no href, email subject, race name or message content. Document listeners are removed on unmount; middle-click is supported. Local, admin and review exclusions remain enforced by the existing tracker.

41 focused tests and TypeScript passed before the additional server-event acceptance test. No historical engagement data is backfilled. Authenticated production owner review is still outstanding.

## Returning-stop details in progress

Coffee orders now persist separately from cafe arrivals. On a subsequent visit, collecting another coffee gets one short line about the fictional cafe's questionable business model. A returning the lake visitor gets a view-versus-leaderboard line in place of the first-trip race invitation. These replace existing text rather than adding popups, and depend on recorded visitor actions rather than invented personal history. Introduction reset clears these discoveries. 27 focused tests and TypeScript pass. Visual review and deployment of these small reactions remain pending.


## Competition assessment

The race server validates a start ID, expiry, elapsed-time bounds, server wall time, a registered finish before publishing, rate limits and idempotent publication. It doesn't independently verify movement, route checkpoints, acceleration or collision penalties. A caller can wait and submit a plausible fabricated elapsed time. This is a casual community board, not cheat-proof competition. The public race-times panel now explicitly describes Astra's lap as an AI exhibition using direct road knowledge.

Before prizes or a larger competitive launch, add server-issued checkpoint progression with bounded timing and a reviewed policy for suspicious scores. Checkpoints alone still won't prove honest client physics. Existing scores must retain their provenance and shouldn't be silently relabeled as verified. No existing rows were changed in this assessment.

Current acceptance gaps: physical-phone loading and touch performance; cold production readiness and sustained-frame measurements with environment stated; a full outward trip and finish/retry after v2; authenticated owner review of garage counts; Bryce's subjective review. The goal remains active. A phone/browser test request is pending while independent work continues.

## Full outward journey review, 7 September 2026

Commit 0644287 deployment completed successfully. Tested the current local development site in the visible Codex in-app browser on this Mac at `localhost:3001/?profile=journey`, default desktop viewport. Started at the normal road origin, entered through the door, completed the one-card introduction, handed over the keys and used ignition. Autopilot completed the outward route, slowed into the mandatory the lake turnout and presented the family paragraph and race offer. Open my projects then opened the physical laptop with all five projects. No development stop shortcut was used. Existing muted preference was retained, so this run didn't audition audio.

DOM profiler readings: scene ready at 3,204 ms from profiler initialization, 343 geometries, 74 textures and 85 programs. Final driving totals were 9,255 frames across 152,582.7 ms, averaging 60.66 FPS with four frames above 50 ms and an 83.4 ms maximum. Render ratio ranged from 1.2 to 1.35. Average CPU submission was 3.74 ms. This is local development on a desktop GPU with unspecified cache state, not cold production transfer or phone evidence. The recording includes the lake approach and pull-in, but excludes time parked and hidden-tab frames by profiler design.

Verified first-trip mandatory flow and portfolio access after arrival. Still outstanding: an actual manual finish/retry in the full scene, fresh physical-phone feedback, owner garage review, final subjective review, and cold-production measurement. Earlier staged and component checks remain narrower evidence.

## Lifecycle and actual race verification

Used the existing development lifecycle UI in the real browser. Cancelling during shader compilation unmounted the canvas and a subsequent mount reached ready. Simulated WebGL loss exposed the scene-unavailable panel with project/contact access. Try again reloaded the document; the lifecycle fixture then required its normal Mount scene control and reached ready. Normal unmount removed the canvas and marked the context lost. Disposal samples retained renderer counters (two textures, six programs after a ready scene; one texture after compilation cancellation), so this is not evidence of zero retained JavaScript memory. Context loss and listener/RAF cleanup were verified separately in source; no heap-byte claim is made.

The existing development held-key UI then exercised the real return race after the completed-tour memory unlocked it. Holding acceleration reached an actual finish at 58,215 ms with one contact episode. No result was published. Race again returned to the lake countdown, then showed 0 km/h, 900 RPM, first gear and zero race progress, with cleared controls. End run cancelled the verification retry. The prior finish remained saved locally.

Found an accessibility issue during this run: the final parking transition could move focus back to the canvas after the finish heading had received it. Guarded that focus restoration while the race is finished. Browser confirmation of the focus fix is pending. No physics or audio constants changed.

Confirmed the focus fix in a second actual browser lap: the finish heading retained focus after parking had settled. The run completed at 56,751 ms, correctly replacing the prior 58,215 ms local personal best. No test time was published. Production anonymous `/api/admin` still returned 401. TypeScript, 28 focused tests, build and whitespace checks pass for the focus change.
