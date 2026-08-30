import { MotionConfig } from 'motion/react';
import { DayArc } from './components/DayArc';
import { Grain } from './components/Grain';
import { SmoothScroll } from './components/SmoothScroll';
import { TopNav } from './components/TopNav';
import { HeroDawn } from './components/sections/HeroDawn';
import { MadeSection } from './components/sections/MadeSection';
import { WorkSection } from './components/sections/WorkSection';

export default function App() {
  return (
    <SmoothScroll>
      <MotionConfig reducedMotion="user">
        <DayArc />
        <Grain />
        <TopNav />
        <main>
          <HeroDawn />
          <WorkSection />
          <MadeSection />
        </main>
      </MotionConfig>
    </SmoothScroll>
  );
}
