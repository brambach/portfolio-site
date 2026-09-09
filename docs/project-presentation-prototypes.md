# AgentSky presentation prototypes

Local comparison: `/project-lab`.

Three complete presentation directions use the same independent AgentSky concept:

- `#screening`: a photographic opening, recorded walkthrough with chapter controls, an optional interactive demo and a short visual study.
- `#playable`: an immediately usable sample workflow with agent selection, interruptible execution stages, filtered output inspection and a simulated local/cloud session sequence.
- `#archive`: three original concept captures, individual design explanations, artifact navigation and access to the assembled interaction.

The comparison is isolated from the existing `/projects` and Porsche experience. These are alternative presentation prototypes, not a decision to replace the site or an implementation of every portfolio project.

## Source and attribution

AgentSky is an independent design study by Bryce Rambach, not a commissioned project or connected AgentSky service. All runs, outputs and cloud-state changes in these presentations are illustrative. No API calls execute agents or transfer files.

Assets copied without modification from `/Users/bryce/claude-hub/personal-projects/agentsky-concept`:

| Portfolio asset | Original |
| --- | --- |
| `public/project-lab/hero.png` | `qa/hero-desktop.png` |
| `public/project-lab/cloud.png` | `qa/cloud-complete.png` |
| `public/project-lab/comparison.png` | `qa/comparison-desktop.png` |
| `public/project-lab/sky.png` | `public/hero-sky.png` |
| `public/project-lab/walkthrough.webm` | `qa/agentsky-walkthrough.webm` |

The recording is approximately 33 seconds. It remains an existing recording of the original concept, not a capture of these new presentations. Artifact notes are grounded in the source README and the session, cloud and comparison implementations. The playable workflow is a newly composed adaptation of that project's illustrative interactions, with a new sample changelog.

## Behaviour and verification

The film loads on request and unmounts when closed. Native dialogs provide modal focus handling; Escape closes the current inspection and returns focus. Changing an agent cancels old timers. Closing a view clears its timers. Reduced motion skips cover expansion and shortens sample execution. Supported browsers animate the cover into the chosen presentation using View Transitions; other browsers open it directly.

Run the Vite development server on port 3000, then `node scripts/check-project-lab.mjs` for browser checks. The checks exercise agent switching during a run, result filters, local/cloud state, film chapters and close behaviour, artifact navigation, reduced motion, and overflow at 320, 390 and 768 pixels. Desktop screenshots use 1440 pixels. Outputs live in `output/project-lab`.

TypeScript, the existing entrance tests and the production build were checked. No deployment or physical-phone test was performed. Final visual direction remains Bryce's choice.
