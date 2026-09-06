import {expect,it} from 'vitest';
import {getExperienceMode,isTownJourney} from './experience-mode';

it('starts the complete town journey at the ordinary homepage',()=>{
  expect(isTownJourney('')).toBe(true);
  expect(isTownJourney('?profile=journey')).toBe(true);
  expect(isTownJourney('?town')).toBe(true);
});
it('retains explicitly selected prototypes',()=>{
  expect(isTownJourney('?forest')).toBe(false);
  expect(getExperienceMode('?forest')).toBe('scenic');
  expect(isTownJourney('?city')).toBe(false);
  expect(getExperienceMode('?city')).toBe('city');
  expect(isTownJourney('?journey')).toBe(false);
  expect(getExperienceMode('?journey')).toBe('journey');
});
