import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Skills } from "./components/Skills";
import { Work } from "./components/Work";
import { Portfolio } from "./components/Portfolio";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen text-neutral-300 font-sans selection:bg-white/10 selection:text-white relative z-0">
      {/* Animated Gradient Mesh Background */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] rounded-full bg-blue-600/15 blur-[150px] animate-blob" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[55%] h-[55%] rounded-full bg-purple-600/12 blur-[150px] animate-blob animation-delay-2000" />
        <div className="absolute top-[30%] left-[50%] w-[40%] h-[40%] rounded-full bg-teal-500/10 blur-[130px] animate-blob animation-delay-4000" />
        <div className="absolute top-[60%] left-[10%] w-[35%] h-[35%] rounded-full bg-indigo-500/8 blur-[120px] animate-blob animation-delay-6000" />
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

      <Navbar />
      <main className="max-w-6xl mx-auto px-6 md:px-12 pt-24">
        <Hero />
        <About />
        <Skills />
        <Work />
        <Portfolio />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
