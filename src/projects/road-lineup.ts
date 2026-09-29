import { projectById, type Project } from './catalog';

// The projects along the road, in order. /work and the 3D drive both read this,
// so a board is the same mile on either page. Dervo leads; AgentSky rides in the glovebox.
export const ROAD_IDS = ['dervo', 'integration-portal', 'lucid', 'arro', 'port'] as const;
export const roadProjects = ROAD_IDS.map(id => projectById(id)!);

export const covers: Partial<Record<Project['id'], string>> = {
  agentsky: '/project-lab/sky.png',
  dervo: '/projects/dervo/sunrise.jpg',
  lucid: '/projects/lucid/spec.png',
  arro: '/projects/arro/today-sample.png',
  'integration-portal': '/projects/portal/hub.png',
};

export const mileLabel = (index: number) => index === 0 ? 'Mile 01 · Now building' : `Mile ${String(index + 1).padStart(2, '0')}`;
