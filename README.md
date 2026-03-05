<div align="center">

# brycerambach.com

Personal portfolio site — editorial dark aesthetic, built with React, TypeScript, and Tailwind CSS v4.

[Live Site](https://brycerambach.com) &nbsp;&middot;&nbsp; [LinkedIn](https://www.linkedin.com/in/bryce-rambach/) &nbsp;&middot;&nbsp; [Email](mailto:bryce.rambach@gmail.com)

</div>

---

## About

I'm Bryce Rambach — a Computer Science student at a university (graduating May 2026) and Integration Specialist at the consultancy. I build enterprise integrations connecting platforms like the HR system, the finance system, a rostering system, and an integration platform, and I'm targeting Solutions Engineer roles in the city.

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS v4 |
| Animations | Motion (motion/react) |
| Typography | Instrument Serif, Inter, JetBrains Mono |
| Icons | Lucide React |

## Getting Started

```bash
npm install
npm run dev       # dev server on port 3000
npm run build     # production build
npm run preview   # preview production build
```

## Project Structure

```
src/
├── App.tsx                # Root layout + ambient background
├── main.tsx               # Entry point
├── index.css              # Global styles, keyframes, fonts
└── components/
    ├── Navbar.tsx          # Fixed nav with scroll-aware styling
    ├── Hero.tsx            # Full-height intro with animated typography
    ├── About.tsx           # Bio section
    ├── Skills.tsx          # Tech stack marquee + animated counters
    ├── Work.tsx            # Experience timeline with scroll-drawn line
    ├── Portfolio.tsx       # Horizontal-scroll project cards with 3D tilt
    ├── Contact.tsx         # CTA links
    ├── Footer.tsx          # Footer
    ├── ScrollReveal.tsx    # Scroll-triggered reveal + parallax
    ├── TextScramble.tsx    # Character scramble animation on scroll
    └── CustomCursor.tsx    # Custom cursor with context-aware states
```

## Design

Refined editorial aesthetic — mostly monochrome with serif/monospace typography contrast. Instrument Serif for display headings, JetBrains Mono for technical details, Inter for body text. Scroll-driven animations throughout including a horizontal-scroll portfolio gallery, drawing timeline, and staggered text reveals. Fully responsive with reduced-motion support.

## License

MIT
