# Return race, 7 September 2026

Bryce requested an autopilot outward journey and an optional manual race from the lake to the opening. The local implementation uses the remaining forward stretch of the existing loop. It doesn't reverse traffic or rebuild the road.

Implemented: mandatory town autopilot, optional stops and honking, the lake race invitation, three-second countdown, manual controls during racing, elapsed timer, distance remaining, chequered finish marking, result screen and name entry. The original prototypes retain manual controls. The radio and phone mix were raised following Bryce's feedback.

The shared board uses Upstash Redis through a server-only REST adapter. Vercel serves `api/race.ts`; Vite also routes local requests through that handler. Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in the server environment. Neither variable is exposed to the client. REST reference: https://upstash.com/docs/redis/features/restapi

A run receives a server ID with a one-hour expiry. Finishing registers the elapsed time; publishing supplies the nickname. Atomic Redis scripts keep each run from posting twice. The board retains 200 results and displays the first 20. Requests have size, method, name, duration and rate checks. Missing storage or failed requests keep the recorded time visible and don't pretend a score was published.

This is a casual leaderboard. The browser still controls race physics and reports the elapsed time, so the basic server checks aren't authoritative replay validation or strong anti-cheat. Names aren't authenticated identities. A live storage round trip and abuse review remain necessary before public release.

No credentials or Vercel link were found in this checkout or runtime, and no Vercel/Upstash connector or CLI is available. The dashboard is logged out. Bryce chose Upstash if available; sign-in is pending. No database was purchased, created or connected, and nothing was deployed.

Verification is ongoing. The first 31 affected race, required-stop, Entrance and server-validation tests pass; TypeScript and build pass. Earlier full-suite failures were resolved by keeping manual prototype tests separate from mandatory town autopilot and running server tests with the project's existing test environment. The real shared-storage operations haven't been exercised.

Update: Bryce signed into Vercel. The existing `bryce-portfolio-ratelimit` database is archived and uninstalled. Created `bryce-portfolio-race` on the explicitly free plan (500,000 monthly commands shown by Vercel), without connecting it to any existing live project. The live `brycerambach-portfolio` project uses `brambach/portfolio-site`, while this checkout uses `brambach/bryce-rambach-portfolio`. No deployment target was changed. Revealing the new connection credentials requires Bryce's Vercel reauthentication, which is pending.

The local scene browser check covered the lake race invitation, countdown, manual controls and keyboard gas response at 1280×720 and layout at 390×844. A scripted driver completed the actual access road and remaining loop with ordinary gas/brake/steering inputs in 187.03 seconds. It had traffic contact, so this proves the route can finish, not polished human handling. The full suite passed 281 tests before the final layout and new UI tests; the latest 30 affected UI/race/server tests pass. A full browser-driven lap, physical phone race, live leaderboard round trip and Bryce's subjective review are still outstanding.

Latest verification: all 284 tests in 62 files pass, plus TypeScript and production build. The ordinary preview remains on port 3003. Port 3001 restarted while its Vite configuration changed, and the test tab entered a browser-tool-blocked connection-error page; the tool couldn't navigate or close that error tab. This didn't affect the port 3003 preview. Vercel credentials remain masked behind its reauthentication prompt, and no `.env.local` file has been written yet.

## Finish card feedback and live Redis connection

Bryce reported that the R shortcut prevented typing in the finish name field, and that Post my time was disabled. The root keyboard handler now ignores inputs, textareas, selects and editable text. A regression types `Rory Kirk` without starting the engine or losing focus. The offline button now says `Leaderboard offline` and explains why a run cannot be posted. Nickname validation also accepts the simple smiley punctuation in Bryce's displayed name.

The finish now uses the cabin's cream paper, green ink, thin rules, square edges, a large timing stamp and shorter copy. Bryce expressly asked not to reload his current race. The computer-use tool blocks native Codex control and can't inject live styles into the loaded production page, so tab 99 was left untouched. A separate timing-slip page on the local preview carries the exact observed 0:41.106 result and `bryce :)` name. The result was recorded in `.codex/review/bryce-race-result-preserved.json` and registered in Redis as a recovered completed run, without publishing it. The user can choose Post my time in the separate card. This is a one-off local recovery from an observed finish, not a public client feature for inventing times.

Vercel reauthentication succeeded. Credentials were saved to ignored `.env.local` with mode 0600 without printing them. The local preview process was restarted to load its server environment; the race page wasn't refreshed. A real API start/finish/publish/read-back check passed against Upstash; duplicate submission retained only one result, and the test row and test run were removed afterward. Evidence: `.codex/review/live-leaderboard-check.json`. The newly connected timing slip is at `/review/finish-slip-connected.html` in the ignored dist folder; future builds replace that temporary preview, so the preserved result JSON is the durable record.

Checks: 27 affected Entrance, RacePanel and server tests pass; TypeScript and production build pass. Whole-journey human race/audio acceptance remains separate from local implementation and the now-verified remote write/read path. No live deployment or project linkage was made.
