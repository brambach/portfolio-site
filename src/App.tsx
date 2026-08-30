import { MotionConfig } from 'motion/react';
import { DayArc } from './components/DayArc';
import { Grain } from './components/Grain';
import { SmoothScroll } from './components/SmoothScroll';
import { TopNav } from './components/TopNav';
import { TrailRunner } from './components/TrailRunner';
import { AfterDarkSection } from './components/sections/AfterDarkSection';
import { HeroDawn } from './components/sections/HeroDawn';
import { MadeSection } from './components/sections/MadeSection';
import { OffTheClockSection } from './components/sections/OffTheClockSection';
import { VibeBoardSection } from './components/sections/VibeBoardSection';
import { WorkSection } from './components/sections/WorkSection';

export default function App() {
  return (
    <SmoothScroll>
      <MotionConfig reducedMotion="user">
        <DayArc />
        <Grain />
        <TopNav />
        <main className="relative">
          <TrailRunner />
          <HeroDawn />
          <WorkSection />
          <MadeSection />
          <OffTheClockSection />
          <VibeBoardSection />
          <AfterDarkSection />
        </main>
      </MotionConfig>
    </SmoothScroll>
  );
}
