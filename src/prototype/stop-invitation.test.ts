import {expect,it} from 'vitest';
import {scenicAccess} from './scenic-route';
import {stopInvitation} from './stop-invitation';
const cafe=scenicAccess.find(stop=>stop.id==='cafe')!;
it('offers the café from the starting street, then respects dismissal',()=>{
  expect(stopInvitation(scenicAccess,cafe.entry-80,0,[])?.id).toBe('cafe');
  expect(stopInvitation(scenicAccess,cafe.entry-80,0,['cafe'])).toBeNull();
});
it('offers fast drivers more room and withdraws a turn before it is too late',()=>{
  expect(stopInvitation(scenicAccess,cafe.entry-350,200,[])?.id).toBe('cafe');
  expect(stopInvitation(scenicAccess,cafe.entry-80,200,[])?.id).not.toBe('cafe');
  expect(stopInvitation(scenicAccess,cafe.entry+10,20,[])?.id).not.toBe('cafe');
});
