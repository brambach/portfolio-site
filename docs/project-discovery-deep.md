# Deep project discovery

Inspected 8 September 2026. This expands `project-presentation-audit.md` and corrects its Throughline assessment.

## Search coverage

Searched project manifests, source filenames and standalone artifacts across `/Users/bryce/claude-hub`, `/Users/bryce/dd`, Documents, Desktop, Downloads, Sites, Backups, the local Codex worktrees directory and the literal `~/~` directory. Inspected selected Cursor workspace records, Claude workspace directory names, Antigravity playground and HTML artifact locations, and the 3 September hub backup's archive index. Nested local worktrees were included. The initial manifest scan found 462 package or repository locations; most are dependencies, reference repositories, nested packages or alternate checkouts. They aren't 462 original projects.

The machine-readable scan is at `output/project-discovery/inventory.json`. It includes 948 artifact paths from the initial scan, also with duplicates and third-party material. Additional discoveries below include native Xcode projects, MOV recordings and historical workspace names that don't have package manifests.

This was local discovery. No credentials, live personal databases or cloud accounts were accessed. No integration jobs, authentication flows, training runs or app deployments were executed. System libraries, application bundles, dependency caches, cloud-only storage and deleted filesystem blocks weren't searched for recoverable source. Original source for the old game and OTP tool wasn't found in the searched locations.

## Additional projects and bodies of work

| Discovery | Evidence located | What it could show | Current boundary |
| --- | --- | --- | --- |
| Port | `../archive/port/Port/*.swift`, `PortWidget/`, Xcode project, sound asset | A native phone ritual: hold to close, a collapsing display, a timed sound and haptic cue, then a persistent closed state and widget. A short interaction film could make this distinctive. | Source inspected. No simulator or physical-device run. It isn't evidence of operating-system-level app blocking. |
| Crypto Command Center | `../archive/crypto-dashboard`: application, components, README; `../archive/bryce-digital-demos/cryptoDashboardDemo.mp4` | 3D Earth, orbiting assets, camera choreography and an analysis panel. A spatial interface study. | One recording frame inspected. README describes CoinGecko and Groq connections; their current operation wasn't tested. |
| DevMetrics / engineering dashboard | `../archive/bryce-digital-demos/devMetricsDemo.mov`; `../archive/github-engineering-dashboard/PLAN.md` and `package.json` | GitHub activity, score, date filtering and charts. The recording visibly shows a populated DevMetrics interface. | A recording frame was inspected. The plan's relationship to the recording is plausible, not established from source. Implementation source wasn't found in that folder. |
| Studio website | `../studio-site`: source, design scenes, motion system, generated photography and an anonymised case study | Typography, art direction and an animated operational-software demonstration. Existing capture script and redrawn product frames can support a polished story. | App wasn't run. Treat it as its own site design, with the DD case study as separate subject matter. |
| Bryce Digital | `../archive/bryce-digital-site`, `../archive/bryce-digital-site-2`, `../archive/bryce-digital-demos/bryceDigitalDemo.mov` | Earlier brand and motion work, interface choreography and visual development. | Two versions of one site family. README marketing claims aren't runtime or commercial evidence. |
| DD Portal | `/Users/bryce/dd/projects/dd-portal` and `dd-portal-v2`; `/Users/bryce/claude-hub/business/studio/DD-PORTAL-CASE-STUDY.md`; `../studio-site/src/content/case-study.ts` | A substantial operational product story: discovery, configuration, mapping, testing, go-live and ongoing support. Strong material for demonstrating design and engineering together. | Current production behaviour and counts weren't rechecked. The existing public-facing treatment is anonymised with fictional redrawn screens; retain that boundary. v1 and v2 belong to one evolution story. |
| ROI Ledger | [ROI Ledger folder](</Users/bryce/dd/integration/Client Projects/SwyftX %E2%80%94 ROI Ledger>): one-pager, slide designs, value-equation and scenario notes; DD portal ledger frames | Turning integration activity into an understandable value explanation. Could be a focused information-design and product-feature study. | Employer/client work. Inspect and anonymise any chosen example. Modelled savings aren't measured customer outcomes. |
| Integration delivery | `/Users/bryce/dd/integration/Client Projects` and `Project Recipe Library`; Workato export ZIPs in Downloads | The engineering behind payroll integrations, including mapping, verification, failure handling and rollout. A carefully chosen flow could show practical depth beyond UI. | A body of work, not one app per client folder. Only filenames and selected non-secret project notes were inspected. Don't publish raw exports or operational records. |
| Financial transaction classification | `/Users/bryce/Downloads/CS549 Final Report.pdf`, 12 pages | A team machine-learning project comparing classifiers across 12 categories. The report explicitly attributes the SVM implementation, kernel tuning and one-vs-rest wrapping to Bryce. | Source and notebooks weren't located. Results are reported in the submitted document, not independently reproduced. Preserve coauthor credit. |
| Morning Triage Board | `/Users/bryce/Documents/Documents - MacBook Pro (4)/Claude/Artifacts/morning-triage-board/versions/1777939692758.html` | A compact artifact grouping Gmail, Slack, Calendar and Notion items with links to their sources. | HTML and its declared description inspected. Connector operation wasn't tested. It may fit within the personal-tools story. |
| DDi integration intelligence concept | [DDi concept](</Users/bryce/Downloads/DDi %E2%80%94 Integration Intelligence Layer (1).html>) | A standalone operational-interface concept with multiple information views. | An HTML artifact, not proof Bryce implemented or owns the underlying DDi platform. Needs a provenance and data review before presentation. |
| E-commerce research and creative system | `/Users/bryce/claude-hub/business/archive/ecom-system`: playbooks, prompts, research notes, image/video creative and briefs | A process study connecting product research, creative hypotheses, production and evaluation. Could provide visual work outside software interfaces. | The automation folder has no implementation files in the inspected listing. Don't present the playbook as an automated platform or claim commercial results. Separate original output from third-party ads and source transcripts. |
| SideQuest | `../archive/side-quest/MD Files`, mood boards, Weavy assets and Xcode project | An adventure and memory-log concept, potentially a visual product-design study. | The source entry screen is still SwiftUI's Hello World. Product documents explicitly call it an idea. |
| Notion workspace architecture | `claude-hub/personal-projects/notion-revamp/` inside `/Users/bryce/Backups/claude-hub-2026-09-03.tar` | Connected task, project, people, notes and library databases. A personal workflow design study if useful. | Found in the backup: workspace map, build log and instructions. No standalone app source; no current Notion state checked. |
| CS-583 3D game | Cursor workspace directory `Users-bryce-Documents-GitHub-CS-583-3-D-Game-Project` | A possible game-development project that could add range if recovered. | Historical path and a transcript identify a Unity workspace. The inspected conversation is actually about unrelated portfolio HTML. Gameplay, authorship split and source remain unknown. |
| OTP Reuse Detector | Cursor workspace directory `Users-bryce-Projects-OTP-Reuse-Detector` | A possible security-tool project. | Historical directory name only. No implementation or product description found. Don't infer that it works or what detection method it uses. |

## Previously identified projects, checked against the broader search

- **AgentSky:** interactive concept implementation plus PNG and WebM capture assets. An MP4 version also exists in Downloads. This is an independent concept, not commissioned work or a working agent backend.
- **Arro:** React Native prototype and locked HTML visual frames. Source documentation says fixture data, without a connected backend or Strava integration.
- **Dervo:** the current app, multiple experimental checkouts, desktop package, design systems and motion studies. Thread and Orsen are part of this project's history. Benchmark copies and downloaded design variants aren't separate shipped products.
- **Lucid:** application, runtime implementation, design-system work, logo and motion studies, and standalone conversation, scope, specification, build, runs and release artifacts. These can provide a richer narrative than a single dashboard screenshot. Each lifecycle stage still needs individual demonstration verification.
- **Bryce OS:** personal operating-system implementation and standalone prototype frames. Use isolated sample data for captures.
- **Trace:** watcher, parser, database and dashboard packages; design explorations are also retained. No fresh runtime verification.
- **Throughline:** the prior audit understated it by trusting an old README. The folder now includes a Next.js dashboard, sign-in/up routes, admin and access-request pages, Slack and GitHub connection flows, a scheduled draft route, email and synthesis code, database files and landing sections. This establishes implementation breadth, not working external integrations.

The Porsche portfolio itself is also a substantial spatial-web project. It can sit in a short colophon or behind-the-scenes study so the work someone is already exploring gets appropriate credit.

## Exclusions and deduplication

- Third-party reference repositories such as Midday, Dub, Twenty and Unkey aren't Bryce's original projects.
- Downloaded Shrine themes and Photoshop scripts aren't original project discoveries.
- The crop-image ZIP contains numbered PNG files, not a recovered application.
- Empty `what-should-i-do-right-now`, empty API Lens folders and generated test workspaces aren't implemented projects.
- Dervo's multiple names, worktrees and brand variations form one project family unless a particular experiment earns a clearly labelled design-study entry.
- Portal mirrors and alternate checkouts don't create additional portfolio projects.

## Presentation standard

The proposed featured six are AgentSky, Dervo, Lucid, Arro, Port and an anonymised DD Portal case study. This is an editorial recommendation based on range and available material, not a claim that all six have passed demonstration QA. Crypto, DevMetrics, Throughline, Trace and the other studies remain accessible in a secondary collection.

The collection should open with large, deliberately composed project covers. Use each project's real visual identity and one clear product moment. Avoid making every piece a folder, dashboard card or identical laptop mockup.

Opening a project should reveal a spacious, individually art-directed presentation:

1. A memorable opening that communicates the product in a few seconds.
2. A short sequence in which a visitor sees an action and its consequence.
3. One or two visible details that explain a difficult design or engineering decision.
4. Clear authorship, project stage and demonstration boundaries alongside the work.
5. A direct way back to the same position in the collection, plus a shareable route.

Specific signature moments:

- **AgentSky:** follow one request through agent selection, workspace transfer and output inspection.
- **Dervo:** return to a project, inspect what changed and resolve one decision with its evidence visible.
- **Lucid:** follow a sample integration from request to mapping and a reviewable specification, using only verified stages.
- **Arro:** move through today's family activity, the weekly trail and a milestone, with large portrait screens.
- **Port:** give the close ritual a quiet stage. The hold, compression and silence are the demonstration; sound is opt-in.
- **DD Portal:** follow one anonymised integration through a coherent product journey, with details available where they explain the work.

Quality checks before calling a presentation finished: readable product screens on a phone; an opening that makes sense without explanatory narration; a complete demonstrable interaction; deliberate motion that can be skipped; keyboard entry, exit and focus restoration; no unnecessary media downloads; no invented results; consistent typography and navigation across distinct project treatments.

No project presentation code was changed during this discovery pass. The next implementation should use the verified inventory instead of the original four-folder list.
