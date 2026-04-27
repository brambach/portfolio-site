import { Canvas, useFrame } from '@react-three/fiber';
import { Icosahedron } from '@react-three/drei';
import { useRef } from 'react';
import type { Mesh } from 'three';

function SpinningIcos() {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.18;
    ref.current.rotation.x += delta * 0.05;
  });
  return (
    <Icosahedron ref={ref} args={[1.4, 0]}>
      <meshBasicMaterial color="rgb(56, 189, 248)" wireframe transparent opacity={0.65} />
    </Icosahedron>
  );
}

export default function HeroIcosahedron() {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 5], zoom: 120 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <SpinningIcos />
    </Canvas>
  );
}
