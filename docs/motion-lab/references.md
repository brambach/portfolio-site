# Motion lab references

Eleven live sites to hold the three directions up against. A is the cinematic scroll-scrubbed WebGL sky, B is kinetic editorial type with a magnetic cursor, C is the tactile sky with springs and draggable cards.

| Site | Whose it is | Direction | Idea worth stealing |
| --- | --- | --- | --- |
| [atmos.leeroy.ca](https://atmos.leeroy.ca/) | Leeroy, a studio (a lab project they call "the surreal flight experience") | A | A "surreal flight experience" that opens on "Scroll to begin the journey", so scroll drives the flight while it serves up odd facts about aviation. |
| [lusion.co](https://lusion.co/) | Lusion, a 3D and interactive web studio | A | A 3D home page that keeps prompting "scroll to explore" and "continue to scroll", so the scroll is framed as moving through a scene, not down a page. |
| [igloo.inc](https://www.igloo.inc/) | Igloo Inc, built by abeto and Bureaux | A | A 3D site tagged Infinite Scroll whose best Awwwards developer score was Animations / Transitions (9.60), so its transitions are the bit to study. |
| [activetheory.net](https://activetheory.net/) | Active Theory, a creative digital studio | A | Their V6 portfolio added, in their words, "new rendering techniques, AI chat and multiplayer", which makes it a useful ceiling for how much a studio home page can carry. |
| [darkroom.engineering](https://darkroom.engineering/) | Darkroom Engineering, a development studio | A | They maintain Lenis, the smooth-scroll library, so their own site is a good check on how pinned, scrubbed sections should feel when the scroll itself is smoothed. |
| [dennissnellenberg.com](https://dennissnellenberg.com/) | Dennis Snellenberg, freelance designer and developer | B | Every button carries a `magnetic` class with its own `data-strength` value (50 on the hero, 24 in the nav), so the pull is tuned per element instead of one global setting. |
| [cuberto.com](https://cuberto.com/) | Cuberto, a digital design and development agency | B | One persistent cursor that swaps its icon per target through `data-cursor-icon` (play on the reel, an arrow on project cards, a cross on the open modal). |
| [unseen.co](https://unseen.co/) | Unseen Studio, a brand, digital and motion studio | B | The cursor doubles as a video control, with separate play and pause states in the markup, so hovering media turns the pointer into the button. |
| [stabondar.com](https://www.stabondar.com/) | Stas Bondar, front-end developer and art director | C | His About text breaks into letters that behave as physical objects in Matter.js, and your scroll momentum pushes them around. |
| [bruno-simon.com](https://bruno-simon.com/) | Bruno Simon, creative developer | C | The portfolio is a small world you drive a car through, with Rapier physics, so the content is something you bump into, not something you read top to bottom. |
| [messenger.abeto.co](https://messenger.abeto.co/) | abeto, a studio | C | A tiny Three.js planet you walk around making deliveries ("It's a small planet, but someone's gotta make the deliveries"), which is a model for a sky that feels like a place you can touch. |

## How I checked

Checked on 2026-10-19. Every site above returned a live 200 response when I fetched it, and I read the page text or raw HTML for each.

- **Fetched and confirmed through an Awwwards page:** Atmos (Site of the Day, Jul 15, 2022), Lusion (Site of the Day, Oct 2, 2023), Igloo Inc (Site of the Day, Jul 23, 2024), Active Theory V6 (Site of the Day, Feb 6, 2024), Bruno Simon (Site of the Day, Nov 11, 2019), Messenger (Site of the Day, Nov 10, 2025), Dennis Snellenberg (Honorable Mention, Aug 15, 2019, for an earlier version of his site).
- **Fetched, motion detail from Awwwards' own case study:** Stas Bondar. The Matter.js letters, scroll momentum push and drag-to-scroll columns all come from the Awwwards case study, which also mentions a Site of the Month nomination.
- **Fetched, motion detail from the markup only:** Dennis Snellenberg (the `magnetic` classes and strengths), Cuberto (`data-cursor-icon` values), Unseen (cursor play and pause classes; their meta description claims an Awwwards Design Studio of the Year award, which I didn't confirm on Awwwards itself), Darkroom (their homepage says they maintain Lenis).

What I couldn't verify: I couldn't watch any of the motion. Everything here is from page text, award pages, a case study and HTML markup, not from seeing it run. Several sites (Igloo, Active Theory, Messenger) render almost everything in JavaScript, so their fetched HTML was close to empty and the description comes from the Awwwards listing. I couldn't find a current, award-confirmed site built around time of day or a changing sky, so direction A's closest sky reference is Atmos (a scroll-driven flight) and the rest is general WebGL scroll work. Codrops blocked my fetches with a 403, so nothing here is confirmed through Codrops.
