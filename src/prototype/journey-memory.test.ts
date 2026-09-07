import {beforeEach,it,expect,vi} from 'vitest';
import {readJourneyMemory,rememberJourney,rememberDiscovery,resetJourneyMemory} from './journey-memory';
beforeEach(()=>localStorage.clear());
it('remembers onboarding and discoveries without duplicates',()=>{rememberJourney({onboarded:true});rememberDiscovery('racket');rememberDiscovery('racket');rememberDiscovery('invented');expect(readJourneyMemory()).toEqual({onboarded:true,lake:false,discoveries:['racket']});});
it('resets the introduction without deleting race results or sound settings',()=>{localStorage.setItem('bryce-last-race','retained');localStorage.setItem('bryce-portfolio-sound','retained');rememberJourney({onboarded:true,lake:true});resetJourneyMemory();expect(readJourneyMemory().onboarded).toBe(false);expect(localStorage.getItem('bryce-last-race')).toBe('retained');expect(localStorage.getItem('bryce-portfolio-sound')).toBe('retained');});
it('handles damaged storage and blocked writes',()=>{localStorage.setItem('bryce-journey-v2','{');expect(readJourneyMemory().onboarded).toBe(false);const mock=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error();});expect(()=>rememberJourney({onboarded:true})).not.toThrow();mock.mockRestore();});
it('remembers a coffee order independently of merely arriving at the cafe',()=>{
 rememberDiscovery('cafe');expect(readJourneyMemory().discoveries).not.toContain('coffee');
 rememberDiscovery('coffee');expect(readJourneyMemory().discoveries).toContain('coffee');
 resetJourneyMemory();expect(readJourneyMemory().discoveries).not.toContain('coffee');
});
