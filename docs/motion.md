# Motion

How things move on brycerambach.com, in both looks. The values live in `src/site/motion.css`; this is the why.

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

**Reduced motion lands where it ends.** With the setting on, everything is already in place and nothing loops, but
touches still work: the sun still drags and the big pumpkin still lights.

## How each look tunes it

| | Cobalt | Pumpkin patch |
|---|---|---|
| Name | rises and fades in, 40ms apart | drops in and squashes, 60ms apart |
| Spring | the house curve, `cubic-bezier(.2, 1.4, .4, 1)` | harder, `cubic-bezier(.34, 1.8, .5, 1)` |
| Drift | birds 34s and 46s, water 40s and 56s | bats 18s and 24s, leaves 9s to 14s, the boil at 8 fps |
| Arrive on scroll | phone pictures unveil upward | panels pop in |

A new look picks its dials. It doesn't add a fifth verb.
