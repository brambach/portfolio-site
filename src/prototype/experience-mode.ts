export type ExperienceMode = 'scenic' | 'journey' | 'city';

export function getExperienceMode(search = window.location.search): ExperienceMode {
  const query = new URLSearchParams(search);
  if (query.has('journey')) return 'journey';
  if (query.has('city')) return 'city';
  return 'scenic';
}

export function isTownJourney(search = window.location.search) {
  return getExperienceMode(search) === 'scenic' && !new URLSearchParams(search).has('forest');
}

export const SCENIC_START_FRACTION = .30;
export const SCENIC_CRUISE_SPEED = 10;
