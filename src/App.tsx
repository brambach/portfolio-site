import { MotionConfig } from 'motion/react';
import { CosmicBackground } from './components/CosmicBackground';
import { Chrome } from './components/Chrome';
import { Footer } from './components/Footer';
import { DossierDialog } from './components/DossierDialog';
import { Hero } from './components/Hero';
import { useProjectFromUrl } from './lib/use-project-from-url';

export default function App() {
  const { openSlug, closeProject } = useProjectFromUrl();

  return (
    <MotionConfig reducedMotion="user">
      <CosmicBackground />
      <Chrome />
      <main className="relative z-10">
        <Hero />
        <section id="archive" className="min-h-screen p-12">ARCHIVE — placeholder</section>
        <section id="systems" className="min-h-screen p-12">SYSTEMS — placeholder</section>
        <section id="sidequest" className="min-h-screen p-12">CONCEPT — placeholder</section>
        <section id="ops" className="min-h-screen p-12">OPS — placeholder</section>
        <section id="contact" className="min-h-screen p-12">CONTACT — placeholder</section>
      </main>
      <Footer />
      <DossierDialog openSlug={openSlug} onClose={closeProject} />
    </MotionConfig>
  );
}
