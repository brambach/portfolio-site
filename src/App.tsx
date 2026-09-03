import { MotionConfig } from 'motion/react';
import { DayArc } from './components/DayArc';
import { DayClock } from './components/DayClock';
import { Grain } from './components/Grain';
import { SmoothScroll } from './components/SmoothScroll';
import { TopNav } from './components/TopNav';
import { WindowTitle } from './components/WindowTitle';
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
        <DayClock />
        <WindowTitle />
        <main className="relative">
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
