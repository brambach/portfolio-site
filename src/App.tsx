import { useEffect } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Skills } from "./components/Skills";
import { Work } from "./components/Work";
import { Portfolio } from "./components/Portfolio";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";

function DotGrid() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 600], [0.4, 0]);

  return (
    <motion.div
      style={{ opacity }}
      className="fixed inset-0 z-[-1] pointer-events-none"
    >
      <svg width="100%" height="100%">
        <defs>
          <pattern id="dotgrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.15)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotgrid)" />
      </svg>
    </motion.div>
  );
}

function SectionDivider() {
  return (
    <div className="relative w-full max-w-6xl mx-auto px-6 md:px-12 py-2">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
    </div>
  );
}

export default function App() {
  const reducedMotion = useReducedMotion();

  // Console signature — for the devs who inspect
  useEffect(() => {
    console.log(
      "%c BR. %c Bryce Rambach — bryce.rambach@gmail.com\n%c Built with React, Tailwind v4, and Motion.\n If you're reading this, we should probably talk.",
      "background: #3b82f6; color: white; font-size: 20px; font-weight: bold; padding: 8px 12px; border-radius: 4px;",
      "color: #e5e5e5; font-size: 13px; padding: 8px 0;",
      "color: #737373; font-size: 11px;"
    );
  }, []);

  // Konami code easter egg
  useEffect(() => {
    const code = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
    let index = 0;
    const handler = (e: KeyboardEvent) => {
      if (e.key === code[index]) {
        index++;
        if (index === code.length) {
          index = 0;
          document.title = "🎮 Nice. You found it.";
          document.body.style.transition = "filter 0.6s ease";
          document.body.style.filter = "hue-rotate(180deg)";
          setTimeout(() => {
            document.body.style.filter = "";
            setTimeout(() => { document.title = "Bryce Rambach"; }, 2000);
          }, 3000);
        }
      } else {
        index = 0;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="min-h-screen text-neutral-300 font-sans selection:bg-white/10 selection:text-white relative z-0"
    >
      {/* Ambient background depth — neutral tones */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none will-change-transform">
        <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] rounded-full bg-white/[0.02] blur-[150px] animate-blob" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[55%] h-[55%] rounded-full bg-white/[0.015] blur-[150px] animate-blob animation-delay-2000" />
        <div className="absolute top-[30%] left-[50%] w-[40%] h-[40%] rounded-full bg-white/[0.012] blur-[130px] animate-blob animation-delay-4000" />
      </div>

      {/* Noise/Grain Texture Overlay */}
      <div className="fixed inset-0 z-[-1] pointer-events-none opacity-[0.03]">
        <svg width="100%" height="100%">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      </div>

      <DotGrid />

      <Navbar />
      <main className="pt-24">
        <Hero />
        <SectionDivider />
        <About />
        <SectionDivider />
        <Skills />
        <SectionDivider />
        <Work />
        <Portfolio />
        <SectionDivider />
        <Contact />
      </main>
      <Footer />
    </motion.div>
  );
}
