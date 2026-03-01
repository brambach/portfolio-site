<div align="center">

# brycerambach.com

My personal portfolio — built with React, TypeScript, and Tailwind CSS.

[Live Site](https://brycerambach.com) &nbsp;&middot;&nbsp; [LinkedIn](https://www.linkedin.com/in/bryce-rambach/) &nbsp;&middot;&nbsp; [Email](mailto:bryce.rambach@gmail.com)

</div>

---

## About

I'm Bryce Rambach — a Computer Science student at a university (graduating May 2026) and Integration Specialist at the consultancy. I build enterprise HRIS integrations connecting platforms like the HR system, the finance system, a rostering system, and an integration platform, and I'm targeting Solutions Engineer roles in the city.

This site is a single-page portfolio showcasing my background, skills, and experience.

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 |
| Animations | Motion (Framer Motion) |
| Icons | Lucide React |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server on port 3000
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── App.tsx              # Root layout + ambient background
├── main.tsx             # Entry point
├── index.css            # Global styles
└── components/
    ├── Navbar.tsx        # Fixed navigation
    ├── Hero.tsx          # Landing section
    ├── About.tsx         # Bio
    ├── Skills.tsx        # Tech stack & competencies
    ├── Work.tsx          # Experience timeline
    ├── Contact.tsx       # CTA + socials
    ├── Footer.tsx        # Footer
    └── FadeIn.tsx        # Scroll-triggered fade animation
```

## Design

The site uses a glassmorphism aesthetic — frosted-glass cards with `backdrop-blur`, translucent gradients, and soft inset shadows over animated ambient blobs. Fully responsive with smooth scroll-triggered animations throughout.

## License

MIT
