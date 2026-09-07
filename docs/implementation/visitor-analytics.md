# Visitor analytics

Vercel Web Analytics uses the included Hobby plan. The React component sits outside the scene's lazy-loading boundary, so a visit can count while the 3D assets load.

Dashboard: https://vercel.com/bryce-rambachs-projects/brycerambach-portfolio/analytics

Only the production domain sends pageviews. Local development, preview domains, and explicit review sessions are excluded. Page URLs retain campaign parameters and strip other query parameters and fragments. Vercel handles visitor estimation, page views and referrers.

Collection starts after this deployment. Earlier visits aren't backfilled. The owner's visits and deployment verification can count. Content blockers can suppress collection. Visitor counts aren't proof that someone finished the journey.

Journey milestone tracking isn't enabled. Vercel Hobby doesn't include custom events. Bryce has been offered aggregate counters in the existing Redis database instead of a paid upgrade, with the choice still pending.

Validation: four analytics filtering tests, TypeScript and production build passed. Production deployment ff83d9f succeeded. A real browser visit to /projects appeared in Vercel as 1 visitor and 1 page view on 7 September 2026. That first count is our verification visit.
