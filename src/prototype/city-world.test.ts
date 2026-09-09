import {expect,it} from 'vitest';
import {createScenicSkyMaterial} from './city-world';

it('blends the scenic panorama base into the active fog colour',()=>{
  const material=createScenicSkyMaterial(null,1);
  expect(material.uniforms.fogHorizonColour.value.getHexString()).toBe('93a6ad');
  expect(material.fragmentShader).toContain('fogHorizonColour');
  expect(material.fragmentShader).toContain('horizonBlend');
  expect(material.customProgramCacheKey()).toContain('horizon');
});
