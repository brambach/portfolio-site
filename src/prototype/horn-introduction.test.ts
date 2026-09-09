import {expect,it} from 'vitest';
import {createTownDrive} from './scenic-drive';
it('offers the native introductory horn prompt before the required lake approach hides it',()=>{
 const drive=createTownDrive();drive.requireStop('lake');drive.start();let visiblePrompt=false;
 for(let i=0;i<60*180&&drive.phase!=='parked';i++){
  drive.update(1/60);
  visiblePrompt ||= !drive.requiredApproach&&drive.traffic.hornPrompt({distance:drive.distance,lane:drive.lane,speed:drive.speed,automatic:drive.automatic,access:Boolean(drive.access),phase:drive.phase,cruiseSpeed:drive.cruiseSpeed});
 }
 expect(visiblePrompt).toBe(true);expect(drive.stoppedAt).toBe('lake');
});
