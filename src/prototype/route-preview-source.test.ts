import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';

it('passes scene route preview state to JourneyMap instead of parked telemetry placeholders',()=>{
  const source=readFileSync('src/prototype/Entrance.tsx','utf8');
  expect(source).toContain('routePreview={id=>sceneRef.current?.routePreview(id)}');
  expect(source).not.toContain('currentAccessId={telemetry.stop}');
  expect(source).not.toContain('currentAccessDistance={0}');
});

it('marks and guards same-stop scene navigation before planner start',()=>{
  const source=readFileSync('src/prototype/car-scene.ts','utf8');
  expect(source).toContain('alreadyAtStop:drive.stoppedAt===id');
  expect(source).toContain('if(drive.stoppedAt===id){renderer.domElement.focus({preventScroll:true});requestRender();return;}');
});
