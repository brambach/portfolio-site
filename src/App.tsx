import { MotionConfig } from 'motion/react';
import { CosmicBackground } from './components/CosmicBackground';
import { Chrome } from './components/Chrome';
import { Footer } from './components/Footer';
import { DossierDialog } from './components/DossierDialog';
import { Hero } from './components/Hero';
import { ArchiveSection } from './components/ArchiveSection';
import { SystemsSection } from './components/SystemsSection';
import { SideQuestSection } from './components/SideQuestSection';
import { OpsSection } from './components/OpsSection';
import { ContactSection } from './components/ContactSection';
import { SmoothScroll } from './components/SmoothScroll';
import { useProjectFromUrl } from './lib/use-project-from-url';

export default function App() {
  const { openSlug, openProject, closeProject } = useProjectFromUrl();

  return (
    <SmoothScroll>
      <MotionConfig reducedMotion="user">
        <CosmicBackground />
        <Chrome />
        <main className="relative z-10">
          <Hero />
          <ArchiveSection onOpen={openProject} />
          <SystemsSection />
          <SideQuestSection onOpen={openProject} />
          <OpsSection onOpen={openProject} />
          <ContactSection />
        </main>
        <Footer />
        <DossierDialog openSlug={openSlug} onClose={closeProject} />
      </MotionConfig>
    </SmoothScroll>
  );
}
