/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
    <div className="min-h-screen text-neutral-900 font-sans selection:bg-neutral-200 selection:text-black relative z-0">
      {/* Ambient Background for Glassmorphism */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/15 blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-400/15 blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-purple-400/15 blur-[100px] animate-blob animation-delay-4000" />
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
