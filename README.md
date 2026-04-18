<div align="center">

# brycerambach.com

Personal portfolio as a conversation — warm cream paper, a living ember-orb avatar, and a hybrid scripted / Claude Haiku chat backend.

[Live Site](https://brycerambach.com) &nbsp;&middot;&nbsp; [LinkedIn](https://www.linkedin.com/in/bryce-rambach/) &nbsp;&middot;&nbsp; [Email](mailto:bryce.rambach@gmail.com)

</div>

---

## About

I'm Bryce Rambach — CS at college (graduating May 2026), Integration Specialist at the consultancy. Targeting Solutions Engineer / full-stack roles at early-stage startups in a new city, summer 2026.

This site isn't a scroll. It's a chat. Ask it anything.

## Tech Stack

| Layer            | Tech                                      |
|------------------|-------------------------------------------|
| Framework        | React 19                                  |
| Language         | TypeScript                                |
| Build            | Vite 6                                    |
| Styling          | Tailwind CSS v4                           |
| Motion           | Motion (`motion/react`) + CSS keyframes   |
| State            | Zustand                                   |
| Typography       | Instrument Serif, Inter                   |
| Icons            | Lucide React                              |
| AI Backend       | Claude Haiku 4.5 via Vercel Edge Function |
| Rate limiting    | Upstash Redis                             |
| Bot protection   | Cloudflare Turnstile                      |

## Getting Started

```bash
npm install
cp .env.local.example .env.local   # fill in keys (Anthropic, Upstash)
npm run dev                         # http://localhost:3000
npm run build
npm run preview
npm run lint                        # tsc --noEmit
npm test                            # vitest
```

## Project Structure

```
src/
├── App.tsx                      # Page shell + ignition
├── main.tsx
├── index.css                    # Tokens, keyframes, reduced-motion
├── components/
│   ├── Orb/                     # Avatar
│   ├── Chat/                    # Input, Message, MessageStack, Chips, Chat
│   ├── Artifacts/               # RoleCard, ProjectCarousel, StackStrip, Resume, Contact
│   ├── Header/                  # Top bar
│   ├── Constellation/           # Conversation dot-map
│   └── CursorHalo/              # Warm cursor follower
└── lib/
    ├── chat.ts                  # Zustand store
    ├── content.ts               # Bio, projects, topics, system prompt
    ├── match.ts                 # Topic keyword matcher + segmenter
    ├── stream.ts                # char streaming + SSE consumer
    └── absorb.ts                # Letter absorption animation

api/
└── chat.ts                      # Vercel Edge Function
```

## Design spec & implementation plan

- Spec: `docs/superpowers/specs/2026-04-18-portfolio-conversational-redesign-design.md`
- Plan: `docs/superpowers/plans/2026-04-18-portfolio-conversational-redesign.md`

## Deployment checklist

1. Push to GitHub, connect to Vercel.
2. Set environment variables in Vercel → Settings → Environment Variables:
   - `ANTHROPIC_API_KEY` (required)
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (install from Vercel marketplace)
   - `TURNSTILE_SECRET_KEY`, `VITE_TURNSTILE_SITE_KEY` (optional)
3. Set a $20/mo budget alert in the Anthropic console as a kill switch.

## License

MIT
