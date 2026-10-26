# Garage office

The private dashboard lives at `/admin`. The public route serves a login shell. `/api/admin` checks an opaque, expiring server-side session before returning any counts. There’s no public registration or password setup endpoint.

## Owner setup

Run `npx tsx scripts/setup-garage.ts` on the owner's computer with the existing ignored Redis environment file. Open http://127.0.0.1:3012 and have the owner choose a unique 16–128 character password. The form checks confirmation, origin, Host and CSRF token. The loopback server stops after success and won't replace an existing password. Only a salted scrypt hash is stored in Redis. Save the password in the owner's password manager.

Login limits: eight attempts per IP hash per 15 minutes. Sessions last 12 hours, use 256-bit random tokens and store only the token hash server-side. The browser cookie is HttpOnly, SameSite=Strict, scoped to `/api/admin`, and Secure on Vercel. Logout deletes the server session. POST requests require an accepted Origin and JSON, with a 2 KB body limit. Private API responses are never cached.

For a lost password, use an explicit owner-authorized recovery procedure through Redis and this local setup tool. There’s no emailed recovery service or second admin account. Never add an unauthenticated reset endpoint.

## What the numbers mean

Redis holds aggregate daily counts for visit, car_entered, lake_reached, race_started, race_finished and time_posted. A random session identifier lives in sessionStorage. Sessions renew after 12 hours. Client guards and atomic Redis deduplication prevent repeated effects, reloads and retries from counting the same step twice. Deduplication keys expire after 24 hours. Daily aggregate keys expire after 90 days; the dashboard shows up to 30 UTC days.

These are browser-tab session counts, not unique people or total attempts. Repeated races within a session count once. Steps are assigned to their occurrence date; a session spanning midnight can contribute different steps on different days. Don't interpret these daily totals as a matched conversion funnel.

Source buckets are direct/internal, X, LinkedIn, GitHub and other sites. No raw referrer URL, submitted name, or email is sent to the journey endpoint. IP hashes are used only in short-lived rate-limit keys. Stats are best effort: storage restrictions, content blockers, failures or forged requests can affect them. They aren't billing or security audit data.

Production domain visits only are counted. Local previews, admin pages and explicit review modes are excluded. Owners can still count when using the public journey. No earlier traffic is backfilled. The shared race leaderboard includes older real laps and is labeled all-time.

Vercel visitor estimates remain linked from the dashboard. Its API wasn't connected to the site with a new account token; the garage session counts are explicitly separate. No paid analytics plan was enabled.

## Validation

306 tests passed across 66 files, including authentication, revoked sessions, wrong passwords, rate limits, URL filtering and duplicate tracking. TypeScript and production build passed. An isolated real Redis check sent the same event twice and confirmed one increment; its test keys expired after 60 seconds. Desktop and 390px mobile layouts were checked using a loopback-only sample-data server outside the shipped source. No sample stats were written to production.

Live owner login needs verification after the owner sets their password. Physical phone testing hasn't been performed.
