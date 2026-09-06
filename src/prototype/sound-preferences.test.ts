import { afterEach, expect, it } from 'vitest';
import { readSoundPreferences, saveSoundPreferences } from './sound-preferences';
afterEach(()=>localStorage.clear());
it('remembers mute and volume across visits',()=>{
  saveSoundPreferences(true,.18);
  expect(readSoundPreferences()).toEqual({muted:true,volume:.18});
});
it('recovers from corrupt settings and clamps volume',()=>{
  localStorage.setItem('bryce-portfolio-sound','{broken');
  expect(readSoundPreferences()).toEqual({muted:false,volume:.32});
  localStorage.setItem('bryce-portfolio-sound','{"volume":7}');
  expect(readSoundPreferences().volume).toBe(1);
});
