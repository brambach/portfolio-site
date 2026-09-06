# AgentSky project presentation

Added September 6, 2026. Bryce said the driving feels good. Handling stays unchanged.

The independent concept is the lead shared project, linked from the cabin laptop and `/projects` to `/projects/agentsky`. Existing projects remain available. The case study loads without a canvas and uses four current implementation screenshots, with reserved image dimensions and lazy loading below the hero.

## Evidence

Source inspected: `/Users/bryce/claude-hub/personal-projects/agentsky-concept`, including its README and demo implementation. Fresh captures came from the local concept on port 3217. The sample run reached Completed, its Files tab opened, the cloud transfer completed and the Codex example was selected. Screenshot files retain the original JPEG capture bytes.

The page labels this as independent work with simulated runs, files and outputs. It claims no AgentSky integration, client commission or measured business results. No public concept URL was verified or added. No video was produced.

## Checks and limits

Ten focused site-data and project-reader tests passed. TypeScript and production build passed. Browser review covered desktop and a 390 by 844 viewport, the project-list link, all four loaded images, no horizontal overflow and no console errors. The case study rendered zero canvases. The viewport override was reset.

Physical phones, the cabin link in a live seated view, and the full regression suite weren't checked in this pass. The concept's close/reopen and expanded preview weren't exercised in this pass. Existing driving pauses, startup outliers, audio audition and final scenery acceptance remain open.

Logs: `/tmp/agentsky-project-tests.log`, `/tmp/agentsky-project-types.log`, `/tmp/agentsky-project-build.log`.


## Combined regression and cabin project navigation, September 6

All 235 tests across 52 files pass after the AgentSky and grass additions. The older cabin-object test incorrectly prohibited the now-intended project links. It now checks the exact AgentSky and Trace destinations, includes all five projects, and retains the assertion that opening project notes doesn't navigate away. Log: `/tmp/porsche-current-regression.log`.

Live desktop review confirms the AgentSky note and study link fit the physical laptop. At 390 x 844, Tab scrolls the link into view with a visible focus outline. Return opens `/projects/agentsky`, with the correct title, zero canvases and no browser errors or warnings. The viewport override was reset. Screenshot: `.codex/review/agentsky-cabin-narrow.jpg`.

This confirms the cabin-to-study path in the available browser. It doesn't establish physical touch behavior, browser back restoration, memory-byte retention or sustained driving performance. Accepted handling remains unchanged. Scenery, the known timing outliers, audio audition and hardware acceptance remain open.


## Preserve the cabin when opening a design study, September 6

The embedded laptop's AgentSky link now uses a separate browsing context with `target="_blank"` and `rel="noopener noreferrer"`. Its accessible name announces the new tab. The standalone project reader keeps normal same-tab navigation. This prevents a full project study from replacing the visitor's cabin page.

Seven focused cabin/reader tests, TypeScript and production build pass. In the production preview, activating the study link left the original cabin URL and selected AgentSky note intact. Escape then closed the laptop and restored focus to the cabin canvas. No browser errors or warnings were recorded.

The in-app browser didn't expose the destination as a controllable tab, so its tab lifecycle and return behavior weren't verified. The study route itself was verified in earlier work. Physical-phone behavior remains untested. Logs: `/tmp/porsche-study-return-tests.log`, `/tmp/porsche-study-return-types.log`, `/tmp/porsche-study-return-build.log`. No handling changes.
