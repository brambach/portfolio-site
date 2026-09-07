# Porsche v2 milestone plan

Started 7 September 2026. This plan supersedes older scope and release restrictions where Bryce has explicitly authorized v2 and deployment. Preserve earlier measurements as historical evidence, not current benchmarks.

## Milestones and acceptance

| Milestone | State | Evidence needed |
| --- | --- | --- |
| 1. Loading and measurement | In progress | Fresh desktop and narrow-screen runs with environment stated; scene readiness, failures and intro completion tracked; physical-phone limitations explicit |
| 2. First visit and route pacing | Pending | Short mandatory introduction; project and personal depth placed at meaningful stops; no dead ends; first-minute route/race orientation |
| 3. Return visits | Pending | Completed onboarding, discoveries, sound and personal best persist; direct race retry and projects; explicit reset; storage denial works |
| 4. Project story | Pending | At least one verified problem/contribution/evidence presentation, checked against source material |
| 5. Race finish | Pending | Personal best, next-place gap, immediate retry, downloadable timing slip, real-target challenge link; AI label retained; score-validation assessment |
| 6. Personal reactions | Pending | A small set of persistent consequences using confirmed personal facts; no invented memories; quiet scenic moments preserved |
| 7. Garage and acceptance | Pending | Loading, intro, project/contact, the lake, race and retry signals explained correctly; auth and resource checks; Bryce's completed-journey review |

## Current risks and quality queue

- No fresh physical-phone or constrained-network baseline. A 390px desktop viewport isn't a phone performance test.
- Current Porsche GLB is roughly 18 MB on disk. Verify actual compressed transfers and decode/GPU cost before changing assets.
- Readiness follows shader compilation, texture warming, multiple first draws and a GPU wait. Avoid moving that work into entry and reintroducing stutter.
- Existing counts are once-per-browser-tab session. Daily step totals aren't a matched-user conversion funnel.
- Mandatory cabin flow currently includes card, racket, journal and laptop before ignition. Redesign its pacing without removing access to the content.
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
