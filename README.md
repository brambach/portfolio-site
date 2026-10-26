# brycerambach.com

<a href="https://brycerambach.com"><img src="public/og/home-look-d.jpg" alt="The home page: my name with work and email links, then i build tools for ai agents. i'm bryce. i'm 22, i finished a cs degree in may, and i'm looking for a founding engineer role at an early ai startup. open to moving. Below it, an engraved horizon of hills and pines with a dotted sun low behind them, mirrored in the water" width="100%"></a>

My portfolio. The whole page is made of dots. Each part is one object drawn in them (a paper airplane, two plugs, a cursor, a harness, a pen, a cup, a hand), and as you scroll the dots fly from one object into the next. It covers what I do: integrations, agents, the harnesses that check them, design and product taste, each with its proof. The colors follow your clock, from a pink dawn to a dark night.

The older ideas are still around as side quests: a road where a flat green 911 drives past a billboard for each project, and a 3D Porsche you can drive out of town toward a mountain lake.

**[See the site](https://brycerambach.com)**, or [take the road](https://brycerambach.com/work), or [take the wheel](https://brycerambach.com/drive).

## What's in it

| Where | What it is |
| --- | --- |
| `/` | The home page. The hero line, contact links, an engraved horizon, four work cards (Dervo, the integration portal, Arro and Lucid), a short about and a footer. |
| `/projects/<name>` | A page each for Dervo, Arro, Lucid, the integration portal and AgentSky, in the same paper and type as the home: one column with the project's real screenshots. |
| `/work` | The road. Scrolling drives the car past a billboard per project, with a night stop at the end where the archive is a pile of cards. |
| `/drive` | The 3D Porsche. Open the door, turn the key, drive from town to a lakeside overlook. `/drive?from=work` skips the walk-up. |
| `/previous` | The earlier version of the site, kept around. |

![Dervo's stop on the road](docs/readme/road-stop.jpg)

### The end of the road

The archive lives in the glovebox. Each card is made of what it is: recordings are film strips, source-only work is a terminal window, the private one is a folder with redaction bars, concepts are sticky notes. Hover or tab to one and it opens onto the honest note about what survives of it.

![The glovebox](docs/readme/glovebox.jpg)

![Off the clock](docs/readme/off-the-clock.jpg)

### The studies

![The Dervo study](docs/readme/study-dervo.jpg)

Every study says what's real and what isn't. Dervo is in private beta and its screens show example projects. The integration portal is employer-owned work, so it's redrawn with a fictional cast and nothing in it talks to a backend. Nothing is presented as adoption or results that were never measured.

### The drive

![The 3D drive](docs/readme/drive.jpg)

| Control | Action |
| --- | --- |
| W / Up | Accelerate |
| S / Down | Brake |
| A / D or Left / Right | Steer |
| Q / E | Downshift / upshift |
| Space | Pull over |
| K | Start the engine |
| H | Horn |
| Cruise button | Follow the road and traffic automatically |

Touch controls work too. The scene credits (models, sounds, textures) are in the drive's menu.

## Built with

React 19, TypeScript, Vite 6 and Tailwind 4 for the pages, plus plain CSS where a component owns its look. [Motion](https://motion.dev) and [GSAP](https://gsap.com) for the movement, Three.js r185 for the drive, Vitest for tests. It deploys on Vercel, and the functions in `api/` back the race times and a private admin page.

## Run it

```bash
npm ci
npm run dev
```

The dev server starts on http://localhost:3000. To pick a port, `npm run dev -- --port 3001 --strictPort`.

Before pushing:

```bash
npm run lint    # tsc --noEmit
npm test        # vitest
npm run build   # vite build
```

Every push to `main` deploys to brycerambach.com through Vercel, so a pull request is the safer way in: Vercel builds a preview of it first.

The race times and admin functions need Upstash/KV environment variables that aren't in the repo. Everything else runs without them.

## Where things are

| Path | What's there |
| --- | --- |
| `src/main.tsx` | Routing. It's path-based, with no router library. A new route also needs a rewrite in `vercel.json`, or it gets the not-found page. |
| `src/site/` | The site. `Home.tsx` and `simple.css` are the home page, `WorkPage.tsx` and `project.css` the project pages, `dots.ts` and `field.ts` the dots, `palette.ts` the colors by time of day, `meta.ts` each page's title, description and preview picture. `data/skills.ts` holds the four skills and their proof. |
| `src/projects/SimplePortfolio.tsx` | The road: the scroll-driven scene, billboards and stops. |
| `src/projects/Glovebox.tsx` | The night stop at the end. |
| `src/projects/catalog.ts` and `road-lineup.ts` | Project data, and the order and covers shared by the road and the 3D billboards. |
| `src/projects/*Study.tsx` | One file per study. `StudyKit.tsx` holds the shared motion. |
| `src/projects/PortalStudy.tsx` | The integration portal redraw (`portal.css`). |
| `src/prototype/` | The 3D drive: scene, route, traffic, audio, the cabin objects. |
| `src/index.css` | Design tokens, type roles, and the one poke and one stamp every control shares. |
| `docs/site-personality.md` | The taste, motion and voice rules the site follows. |
| `docs/implementation/` | Plans and history for the drive. |

## How it's meant to feel

One big type decision per screen in serif display. Photography carries the colour and the interface stays quiet. Forest and cream, with one warm accent spent on small marks. Paper, tape and handwriting so it feels made. One statement move per screen, ambient loops kept slow, and a reduced-motion setting that is respected. No hard offset shadows, no thick borders. The full version is in `docs/site-personality.md`.

## Licence

No open-source licence is attached, so treat it as all rights reserved. The 3D, audio and texture assets carry their own terms, credited in the drive. If you want to reuse something, ask.
