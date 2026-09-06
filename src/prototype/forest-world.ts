import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { createForestAtmosphere } from "./forest-atmosphere";
import {
  groundHeight,
  nearestRoad,
  OVERLOOK_DISTANCE,
  roadFrame,
  ROUTE_LENGTH,
} from "./forest-route";

export async function createForestWorld(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.name = "Traversable forest and overlook";
  scene.add(group);
  const atmosphere = createForestAtmosphere(scene);
  group.add(atmosphere.sky);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const textures = new THREE.TextureLoader();
  const [tree, farTree, fern, asphalt, roadNormal, ground, groundNormal] =
    await Promise.all([
      loader.loadAsync("/models/forest/tree.glb"),
      loader.loadAsync("/models/forest/tree-low.glb"),
      loader.loadAsync("/models/forest/fern_02/fern_02.gltf"),
      textures.loadAsync("/models/entrance/asphalt.jpg"),
      textures.loadAsync("/models/entrance/asphalt-normal.jpg"),
      textures.loadAsync("/models/forest/ground.jpg"),
      textures.loadAsync("/models/forest/ground-normal.jpg"),
    ]);
  asphalt.colorSpace = ground.colorSpace = THREE.SRGBColorSpace;
  for (const texture of [asphalt, roadNormal, ground, groundNormal]) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 4;
  }
  asphalt.repeat.set(2.4, 1);
  roadNormal.repeat.copy(asphalt.repeat);
  ground.repeat.set(150, 170);
  groundNormal.repeat.copy(ground.repeat);
  const terrain = new THREE.PlaneGeometry(750, 850, 190, 215);
  terrain.rotateX(-Math.PI / 2);
  terrain.translate(-140, 0, 210);
  const pos = terrain.getAttribute("position");
  for (let i = 0; i < pos.count; i++)
    pos.setY(i, groundHeight(pos.getX(i), pos.getZ(i)));
  terrain.computeVertexNormals();
  const colours = new Float32Array(pos.count * 3);
  const soilColour = new THREE.Color("#73755a"),
    hillColour = new THREE.Color("#354d40"),
    tint = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const away = nearestRoad(pos.getX(i), pos.getZ(i)).away;
    tint
      .copy(soilColour)
      .lerp(hillColour, THREE.MathUtils.smoothstep(away, 30, 100));
    tint.toArray(colours, i * 3);
  }
  terrain.setAttribute("color", new THREE.BufferAttribute(colours, 3));
  const soil = new THREE.Mesh(
    terrain,
    new THREE.MeshStandardMaterial({
      map: ground,
      normalMap: groundNormal,
      normalScale: new THREE.Vector2(0.6, 0.6),
      roughness: 1,
      vertexColors: true,
    }),
  );
  atmosphere.apply(soil.material);
  soil.receiveShadow = true;
  group.add(soil);
  const vertices: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  for (let i = 0; i <= 900; i++) {
    const d = (i / 900) * ROUTE_LENGTH;
    const turnout = 3 * Math.exp(-(((d - OVERLOOK_DISTANCE) / 18) ** 2));
    for (const side of [-1, 1]) {
      const frame = roadFrame(d, side * (3.35 + (side === 1 ? turnout : 0)));
      vertices.push(frame.point.x, frame.point.y - 0.045, frame.point.z);
      uvs.push(side === -1 ? 0 : 1, d / 4);
    }
    if (i < 900) {
      const n = i * 2;
      indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
    }
  }
  const ribbon = new THREE.BufferGeometry();
  ribbon.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  ribbon.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  ribbon.setIndex(indices);
  ribbon.computeVertexNormals();
  const road = new THREE.Mesh(
    ribbon,
    new THREE.MeshStandardMaterial({
      map: asphalt,
      normalMap: roadNormal,
      normalScale: new THREE.Vector2(0.3, 0.3),
      roughness: 0.82,
      color: "#737b75",
      side: THREE.DoubleSide,
    }),
  );
  atmosphere.apply(road.material);
  road.receiveShadow = true;
  group.add(road);
  let seed = 48;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const trees: { point: THREE.Vector3; rotation: number; height: number }[] =
    [];
  const overlook = roadFrame(OVERLOOK_DISTANCE).point;
  for (let i = 0; i < 1650; i++) {
    let x: number, z: number;
    if (i < 240) {
      const d = (i / 240) * ROUTE_LENGTH,
        frame = roadFrame(d, (i % 2 ? 1 : -1) * (7 + random() * 16));
      x = frame.point.x;
      z = frame.point.z;
    } else {
      x = random() * 360 - 190;
      z = random() * 430 - 65;
    }
    if (
      nearestRoad(x, z).away < 5.9 ||
      Math.hypot(x - overlook.x, z - overlook.z) < 34
    )
      continue;
    trees.push({
      point: new THREE.Vector3(x, groundHeight(x, z) - 0.1, z),
      rotation: random() * Math.PI * 2,
      height: 11 + random() * 9,
    });
  }
  function instancer(source: THREE.Group, entries: typeof trees, fade: [number,number,number,number]) {
    const cells = new Map<string, typeof trees>();
    for (const entry of entries) {
      const key = `${Math.floor(entry.point.x/32)},${Math.floor(entry.point.z/32)}`;
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key)!.push(entry);
    }
    const chunks = [...cells.values()].map(entries => ({ entries, batches: [] as THREE.InstancedMesh[] }));
    source.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(source);
    const size = box.getSize(new THREE.Vector3());
    const batches: THREE.InstancedMesh[] = [];
    source.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const geometry = object.geometry.clone();
      // Quantized positions need float storage before world transforms can exceed their encoded range.
      for (const name of ["position", "normal"]) {
        const attribute = geometry.getAttribute(name);
        if (!attribute) continue;
        const values = new Float32Array(attribute.count * 3);
        for (let i = 0; i < attribute.count; i++) {
          values[i * 3] = attribute.getX(i);
          values[i * 3 + 1] = attribute.getY(i);
          values[i * 3 + 2] = attribute.getZ(i);
        }
        geometry.setAttribute(name, new THREE.BufferAttribute(values, 3));
      }
      geometry.applyMatrix4(object.matrixWorld);
      geometry.translate(
        -box.getCenter(new THREE.Vector3()).x,
        -box.min.y,
        -box.getCenter(new THREE.Vector3()).z,
      );
      const original = object.material as THREE.MeshStandardMaterial;
      const material = original.clone();
      // Leaf cards need depth-tested cutouts, not unsorted translucent instances.
      if (material.transparent || material.alphaTest > 0) {
        material.transparent = false;
        material.depthWrite = true;
        material.alphaTest = .42;
        material.alphaToCoverage = true;
        material.roughness = .92;
      }
      material.envMapIntensity = .45;
      material.onBeforeCompile = shader => {
        shader.uniforms.portfolioFade = {value: new THREE.Vector4(...fade)};
        shader.vertexShader = 'varying vec3 vPortfolioWorld;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
          #include <project_vertex>
          vec4 portfolioWorld = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            portfolioWorld = instanceMatrix * portfolioWorld;
          #endif
          vPortfolioWorld = (modelMatrix * portfolioWorld).xyz;
        `);
        shader.fragmentShader = 'varying vec3 vPortfolioWorld;\nuniform vec4 portfolioFade;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <alphatest_fragment>', `
          #include <alphatest_fragment>
          float portfolioDistance = length(vPortfolioWorld.xz-cameraPosition.xz);
          float portfolioCoverage = (portfolioFade.y == 0.0 ? 1.0 : smoothstep(portfolioFade.x,portfolioFade.y,portfolioDistance)) * (1.0-smoothstep(portfolioFade.z,portfolioFade.w,portfolioDistance));
          float portfolioNoise = fract(sin(dot(floor(vPortfolioWorld*120.0),vec3(12.9898,78.233,37.719)))*43758.5453);
          if (portfolioCoverage < (portfolioFade.y > 0.0 ? 1.0-portfolioNoise : portfolioNoise)) discard;
        `);
      };
      material.customProgramCacheKey = () => 'portfolio-foliage-fade';
      atmosphere.apply(material);
      for (const chunk of chunks) {
        const mesh = new THREE.InstancedMesh(geometry, material, chunk.entries.length);
        mesh.castShadow = mesh.receiveShadow = true;
        mesh.frustumCulled = true;
        group.add(mesh);
        batches.push(mesh);
        chunk.batches.push(mesh);
      }
      object.geometry.dispose();
    });
    return { batches, chunks, height: size.y };
  }
  const near = instancer(tree.scene, trees, [0,0,24,36]),
    far = instancer(farTree.scene, trees, [24,36,155,200]);
  // Stable low-detail casters keep long shadows from jumping at the near-tree cutoff.
  near.batches.forEach((mesh) => (mesh.castShadow = false));
  const ferns = Array.from({ length: 600 }, (_, i) => {
    const frame = roadFrame(
      (i / 600) * ROUTE_LENGTH,
      (i % 2 ? 1 : -1) * (4.4 + random() * 6),
    );
    return {
      point: frame.point,
      rotation: random() * Math.PI * 2,
      height: 0.45 + random() * 0.7,
    };
  });
  ferns.forEach((f) => (f.point.y = groundHeight(f.point.x, f.point.z)));
  const floorPlants = instancer(fern.scene, ferns, [0,0,30,48]);
  const wood = new THREE.MeshStandardMaterial({
    color: "#6b5135",
    roughness: 1,
  });
  for (let d = OVERLOOK_DISTANCE - 20; d < OVERLOOK_DISTANCE + 20; d += 4) {
    const frame = roadFrame(d, 6.8);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.9, 0.16), wood);
    post.position.copy(frame.point);
    post.position.y += 0.35;
    post.castShadow = true;
    group.add(post);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 4.2), wood);
    rail.position.copy(frame.point);
    rail.position.y += 0.65;
    rail.rotation.y = frame.yaw;
    rail.castShadow = true;
    group.add(rail);
  }
  const matrix = new THREE.Matrix4(),
    rotation = new THREE.Quaternion(),
    scale = new THREE.Vector3();
  let last = new THREE.Vector3(Infinity, Infinity, Infinity);
  function populate(
    batch: ReturnType<typeof instancer>,
    entries: typeof trees,
    position: THREE.Vector3,
    min: number,
    max: number,
  ) {
    for (const chunk of batch.chunks) {
    let index = 0;
    for (const entry of chunk.entries) {
      const d = entry.point.distanceTo(position);
      if (d < min || d > max) continue;
      rotation.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, entry.rotation);
      scale.setScalar(entry.height / batch.height);
      if (batch !== floorPlants) {
        scale.x *= 1.4;
        scale.z *= 1.4;
      }
      matrix.compose(entry.point, rotation, scale);
      for (const mesh of chunk.batches) mesh.setMatrixAt(index, matrix);
      index++;
    }
    for (const mesh of chunk.batches) {
      mesh.count = index;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
    }
  }
  function update(position: THREE.Vector3) {
    if (last.distanceToSquared(position) > 9) {
      populate(near, trees, position, 0, 40);
      populate(far, trees, position, 0, 205);
      populate(floorPlants, ferns, position, 0, 53);
      last.copy(position);
    }
    const warmth =
      1 - THREE.MathUtils.smoothstep(position.distanceTo(overlook), 25, 95);
    atmosphere.update(warmth);
    return warmth;
  }
  update(new THREE.Vector3());
  return { group, update };
}
