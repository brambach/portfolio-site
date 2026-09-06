import * as THREE from 'three';
import type {SceneResources} from './scene-resources';

export type CabinMaterials = Awaited<ReturnType<typeof loadCabinMaterials>>;

export async function loadCabinMaterials(resources?:SceneResources) {
  const loader = new THREE.TextureLoader();
  const maps = await Promise.all(['brown_leather', 'wood_table_001'].map(async name => {
    const [map, normalMap, roughnessMap] = await Promise.all(['color', 'normal', 'roughness'].map(kind => loader.loadAsync(`/models/entrance/materials/${name}-${kind}.jpg`).then(texture=>resources?resources.track(texture):texture)));
    map.colorSpace = THREE.SRGBColorSpace;
    for (const texture of [map, normalMap, roughnessMap]) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = 4;
      if (name === 'brown_leather') texture.repeat.set(3, 3);
    }
    return { map, normalMap, roughnessMap };
  }));
  resources?.assertActive();
  const leather = new THREE.MeshStandardMaterial({ ...maps[0], color: '#d0aa80', roughness: .9, normalScale: new THREE.Vector2(.2, .2) });
  const dash = new THREE.MeshStandardMaterial({ ...maps[0], color: '#302e28', roughness: .9, normalScale: new THREE.Vector2(.22, .22) });
  const wood = new THREE.MeshPhysicalMaterial({ ...maps[1], color: '#785435', roughness: .32, normalScale: new THREE.Vector2(.12, .12), clearcoat: .7, clearcoatRoughness: .28 });
  for(const material of [leather,dash,wood])resources?.material(material);
  return { leather, dash, wood };
}
