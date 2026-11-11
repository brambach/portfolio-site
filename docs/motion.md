# Motion

How things move on brycerambach.com, in every look. The values live in `src/site/motion.css`; this is the why.

## The idea

The site is a printed thing. The cobalt look is an engraving on paper and the pumpkin patch is a Sunday comic on
newsprint. Printed things don't animate. Ink goes down once and then it's still. So the site moves the way its
medium would if it could: the page is printed in front of you, then it holds still and lets you read. The only
things that keep moving are things that would move in the picture (birds, leaves, water, a ghost), and anything you
touch answers you.

That gives four verbs, and every motion on the site is one of them.

| Verb | What it is | Token | Value |
|---|---|---|---|
| Arrive | Content landing. Once per screen, plays once | `--m-arrive` `--t-arrive` | easeOutExpo, 0.9s |
| Answer | Something you touched, responding | `--m-spring` `--t-spring`, `--m-quick` `--t-quick`, `--t-press` | overshoot 0.45s, ease-out 0.22s, 0.12s |
| Drift | Untouched and looping | `--m-drift` | ease-in-out, 12s and up |
| Leave | Anything going away | `--m-leave` `--t-leave` | ease-in, 0.18s |

Line art draws on its own curve, `--m-ink`, which speeds into a stroke and eases out of it like a pen.

## Rules

**Type first.** Nothing in the first screen moves until the face it's lettered in has loaded (or 0.9s runs out). A
name that starts dropping in a fallback face and then swaps mid-animation is the single most visible kind of jank,
and it was the lag in the name. `useEntrance` holds the entrance; the build preloads the current look's faces and
page chunk so the hold is usually zero.

**One arrival per screen.** The name is the first screen's arrival. Everything else on that screen comes in behind
it, in order: name, then the line under it, then the drawing, then the atmosphere (hatching, water, the boil).
Order matters more than speed. Things arriving at the same time fight for the same frames and for your eye.

**Arrivals settle, answers spring.** Overshoot means "you did that". The sun, a pumpkin and an arrow on hover
overshoot and settle; content arriving on its own never does in cobalt. The patch turns that dial up on purpose,
because squash and stretch is how a cartoon talks, but it's still the same rule.

**Drift is slow and stops when nobody's looking.** Loops run long enough that you never see a cycle whole, and
anything expensive pauses off screen and in a background tab.

**Leaving is quicker than arriving.** Waiting for something to go is worse than waiting for it to come. Page to page,
the old page fades in 0.18s and the new one comes up in 0.45s.

**Transform and opacity on anything big.** Both run on the compositor and stay smooth on a phone. No animated blur,
no animated layout. Line art may draw its stroke, since it's thin and happens once.

**A page arrives once per visit.** Coming back to the home doesn't replay the name or pop the panels again; it's
already printed, so it's simply there (the `again` class).

**Pages hand over, they don't reload.** Moving between the home and a project's page happens in place
(`src/site/navigate.ts`) inside a view transition. A picture both pages mark with the same `data-handover` grows
from where it sat into where it lands (0.7s on the arrive curve) while the rest of the page crossfades. Tap Dervo and
its screenshot becomes the live demo at the top of its page; go back and it shrinks into its card, at the scroll you
left. Anything else (other sites, the older pages, a new tab) is a plain navigation.

**Hovers only where there's a pointer.** Hover moves sit behind `@media (hover: hover)`, so a tap on a phone never
leaves a card stuck lifted. On a phone a tap gets the press instead.

**Reduced motion lands where it ends.** With the setting on, everything is already in place and nothing loops, but
touches still work: the sun still drags and the big pumpkin still lights.

## Where GSAP comes in

CSS does every arrival and every loop, and should keep doing them: it's free, it runs before any script, and it's
already tuned. GSAP (`src/site/gsap.ts`) takes the two kinds of move CSS can't do well.

**Scroll that trails.** The hero leaving (the hills parting, the name sinking) and the footer's birds or bats taking
off are scrubbed with ScrollTrigger, 0.6s behind the scroll (0.8s for the birds). They move with a little weight
instead of sticking to the scrollbar. Same distances as before.

**Answers you can interrupt.** A pumpkin's hop is a GSAP timeline, so a tap while it's still in the air catches it
and throws it a little higher instead of snapping it back to the ground and starting over.

GSAP is never in the first load. It's fetched when the browser goes idle, so it can't hold up the name, and until it
arrives (or if it never does) the page runs the hand-written versions it had before. With reduced motion it isn't
loaded at all.

## How each look tunes it

| | Cobalt | Pumpkin patch |
|---|---|---|
| Name | rises and fades in, 40ms apart | drops in and squashes, 60ms apart |
| Spring | the house curve, `cubic-bezier(.2, 1.4, .4, 1)` | harder, `cubic-bezier(.34, 1.8, .5, 1)` |
| Drift | birds 34s and 46s, water 40s and 56s | bats 18s and 24s, leaves 9s to 14s, the boil at 8 fps |
| Arrive on scroll | phone pictures unveil upward | panels pop in |

A new look picks its dials. It doesn't add a fifth verb.

## The dinner table (Thanksgiving)

The third look, `src/site/harvest`, is the pumpkin patch's yard a month later, and it's the one look where GSAP does
most of the moving. It still has one idea: **the afternoon goes by as you scroll.** Everything else serves that.

The hero is a stack of layers that share one viewBox (sky plates, sun and geese, the yard, a dusk wash, the table,
the lights), so the scroll can move one without repainting the others. `story.ts` holds all of the GSAP.

| Move | Verb | How |
|---|---|---|
| The sun sets, the sky goes rose then plum, dusk falls on the yard | Scroll | One timeline scrubbed 0.6s behind the scroll. It's done by the time the hero is half gone, so you see it finish |
| The string of lights comes on, one bulb at a time | Scroll | Same timeline, staggered left to right |
| The tree drops its last leaves | Scroll | MotionPath, one leaf after another |
| The lights swing with how fast you scroll and ring back to rest | Answer | ScrollTrigger velocity, then an elastic settle when the scroll stops |
| One leaf falls the whole page and lands on the pile in the footer | Scroll | A pendulum scrubbed 1s behind. It passes behind the panels, never over the work |
| The page's paper warms toward evening | Scroll | One fixed wash, opacity only |
| Night at the footer: the moon rises, the lights come on, the geese leave | Scroll | Scrubbed as the footer arrives |
| A slice of pie arcs to the kid's plate | Answer | MotionPath, then an elastic landing. Three go, the fourth is saved for you |
| The leaf pile, kicked | Answer | Physics2D: real arcs under gravity |
| Bump the table | Answer | The patch's hop on every dish, 60ms apart |
| Steam off the pie | Drift | DrawSVG, paused when the hero is off screen |

The rules above still hold. The name lands in CSS before GSAP is fetched. The plugins come in their own chunk after
the core (`loadToon`). Before they arrive every tap has a CSS answer, and with reduced motion the page is a finished
afternoon standing still, where tapping the pie still takes a slice.

Things that move every frame sit outside the two groups that boil (the yard and the table), so a scroll never asks
the browser to redo the wobble filter.
