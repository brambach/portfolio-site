import { useEffect } from 'react';
import Ornament from './home/art/Ornament';
import LazyScene from './home/LazyScene';
import DervoStill from './home/scenes/DervoStill';
import Hero from './home/scenes/Hero';
import { BotsPlaceholder, FooterPlaceholder, MorePlaceholder, PortalPlaceholder } from './home/scenes/Placeholders';
import './home/look-d.css';

/* The home page, in look D: an engraved edition on cream paper. The order here is the page's order. Scenes with
   heavy motion load their own code later (home/LazyScene.tsx), so the first load is the words and one drawing. */

const PAPER = '#f3eee3';
const loadDervo = () => import('./home/scenes/Dervo');

export default function Home() {
  useEffect(() => {
    // The browser's bar matches the paper.
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const before = meta?.content;
    if (meta) meta.content = PAPER;

    // A link to a part (/#work, where /projects and a project's way back go) opens on it, and stays on it when the
    // serif arrives and the words above it change height, unless the visitor has already moved.
    let unhook = () => {};
    if (location.hash.length > 1) {
      const part = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      part?.scrollIntoView();
      let moved = false;
      const move = () => { moved = true; };
      const types = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
      types.forEach(type => addEventListener(type, move, { once: true, passive: true }));
      unhook = () => { moved = true; types.forEach(type => removeEventListener(type, move)); };
      void document.fonts?.ready.then(() => { if (!moved) part?.scrollIntoView(); });
    }
    return () => { unhook(); if (meta && before) meta.content = before; };
  }, []);

  return <main className="home">
    <Hero />
    <Ornament />
    <LazyScene className="dv-host" load={loadDervo} still={<DervoStill />} />
    <Ornament />
    <PortalPlaceholder />
    <Ornament />
    <BotsPlaceholder />
    <Ornament />
    <MorePlaceholder />
    <Ornament />
    <FooterPlaceholder />
  </main>;
}
