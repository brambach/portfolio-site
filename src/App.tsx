import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Work } from './components/Work';
import { Projects } from './components/Projects';
import { Stack } from './components/Stack';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <>
      <a className="skip-link" href="#hero">Skip to content</a>
      <Nav />
      <main>
        <Hero />
        <Work />
        <Projects />
        <Stack />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
