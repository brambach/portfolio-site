import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

// The visible sun, directional light and forward-scattered mist share one direction.
export const SUN_DIRECTION = new THREE.Vector3(-.94, .13, -.32).normalize();

export function createForestAtmosphere(scene: THREE.Scene) {
  const sky = new Sky();
  sky.scale.setScalar(900);
  const uniforms = sky.material.uniforms;
  uniforms.turbidity.value = 8;
  uniforms.rayleigh.value = 2.2;
  uniforms.mieCoefficient.value = .006;
  uniforms.mieDirectionalG.value = .87;
  uniforms.sunPosition.value.copy(SUN_DIRECTION);
  // Keep a dusk palette in the sky while preserving cloud shading and the actual sun disc.
  sky.material.fragmentShader = sky.material.fragmentShader.replace(
    'gl_FragColor = vec4( texColor, 1.0 );',
    `float towardSun = pow(max(0.0, cosTheta), 2.0);
     float skyHeight = smoothstep(0.0, .48, max(0.0, direction.y));
     vec3 horizon = mix(vec3(.22, .30, .33), vec3(.82, .35, .12), towardSun);
     vec3 twilight = mix(horizon, vec3(.035, .075, .13), skyHeight);
     float cloudShade = clamp(dot(texColor, vec3(.2126, .7152, .0722)) * .1, .65, 1.05);
     twilight *= mix(1.0, cloudShade, .28);
     twilight += vec3(.8, .36, .12) * exp(-max(0.0, 1.0 - cosTheta) * 24.0) * .17;
     twilight += sundisc * vec3(5.0, 3.0, 1.7);
     gl_FragColor = vec4(twilight, 1.0);`,
  );

  const fog = new THREE.FogExp2('#9caaa8', .012);
  scene.fog = fog;
  // Keep valley mist at a fixed elevation as the car climbs.
  const mistLevel = { value: 5.5 };
  const sunDirection = { value: SUN_DIRECTION };
  const mistTint = { value: new THREE.Color('#e3b887').convertLinearToSRGB() };

  function apply(material: THREE.MeshStandardMaterial) {
    const previous = material.onBeforeCompile;
    const previousKey = material.customProgramCacheKey();
    material.onBeforeCompile = function(shader, renderer) {
      previous.call(this, shader, renderer);
      shader.uniforms.portfolioMistLevel = mistLevel;
      shader.uniforms.portfolioSun = sunDirection;
      shader.uniforms.portfolioMistTint = mistTint;
      shader.vertexShader = 'varying vec3 vMistWorld;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
        #include <project_vertex>
        vec4 mistWorld = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          mistWorld = instanceMatrix * mistWorld;
        #endif
        vMistWorld = (modelMatrix * mistWorld).xyz;
      `);
      shader.fragmentShader = `varying vec3 vMistWorld;
        uniform float portfolioMistLevel;
        uniform vec3 portfolioSun;
        uniform vec3 portfolioMistTint;
      ` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <fog_fragment>', `
        vec3 mistRay = vMistWorld - cameraPosition;
        float mistDistance = length(mistRay);
        float lowMist = exp(-max(0.0, vMistWorld.y - portfolioMistLevel) * .16);
        float mistDepth = 1.0 - exp(-pow(max(0.0, mistDistance - 8.0) * .012, 1.35));
        float sunScatter = pow(max(0.0, dot(normalize(mistRay), portfolioSun)), 4.0);
        vec3 mistColour = mix(fogColor, portfolioMistTint, sunScatter * .82);
        float distanceFog = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
        float valleyFog = mistDepth * (.35 + lowMist * .3);
        float atmosphereFog = 1.0 - (1.0 - distanceFog) * (1.0 - valleyFog);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, mistColour, atmosphereFog);
      `);
    };
    material.customProgramCacheKey = () => previousKey + '-sunset-mist-v1';
  }

  function update(clearing: number) {
    fog.density = THREE.MathUtils.lerp(.0125, .0095, clearing);
  }

  return { sky, apply, update };
}
