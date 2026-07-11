'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { ProductType } from '@/lib/data/catalog';
import { getDrinkware3DConfig } from '@/lib/products/drinkware-3d-config';

function MugHandle({ color }: { color: string }) {
  return (
    <mesh position={[0.62, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <torusGeometry args={[0.22, 0.045, 12, 32, Math.PI * 1.35]} />
      <meshStandardMaterial color={color} roughness={0.55} metalness={0.08} />
    </mesh>
  );
}

function ThermosLid({
  radius,
  height,
  color,
}: {
  radius: number;
  height: number;
  color: string;
}) {
  const lidColor = useMemo(() => {
    const c = new THREE.Color(color);
    c.multiplyScalar(0.82);
    return `#${c.getHexString()}`;
  }, [color]);

  return (
    <group position={[0, height / 2 + 0.04, 0]}>
      <mesh>
        <cylinderGeometry args={[radius * 0.92, radius * 0.96, 0.08, 48]} />
        <meshStandardMaterial color={lidColor} roughness={0.35} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[radius * 0.55, radius * 0.55, 0.06, 32]} />
        <meshStandardMaterial color={lidColor} roughness={0.3} metalness={0.35} />
      </mesh>
    </group>
  );
}

function DrinkwareBody({
  productType,
  productColor,
  textureCanvas,
}: {
  productType: ProductType;
  productColor: string;
  textureCanvas: HTMLCanvasElement | null;
}) {
  const config = getDrinkware3DConfig(productType);
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => {
    if (!textureCanvas) return null;
    const map = new THREE.CanvasTexture(textureCanvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.ClampToEdgeWrapping;
    map.anisotropy = 8;
    map.needsUpdate = true;
    return map;
  }, [textureCanvas]);

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  useFrame((_, delta) => {
    if (!meshRef.current || textureCanvas) return;
    meshRef.current.rotation.y += delta * 0.35;
  });

  const bodyColor = productColor;

  return (
    <group>
      <mesh ref={meshRef} castShadow receiveShadow>
        <cylinderGeometry
          args={[
            config.radiusTop,
            config.radiusBottom,
            config.height,
            72,
            1,
            true,
          ]}
        />
        <meshStandardMaterial
          map={texture ?? undefined}
          color={bodyColor}
          roughness={0.48}
          metalness={0.12}
        />
      </mesh>

      <mesh position={[0, -config.height / 2 - 0.02, 0]} receiveShadow>
        <cylinderGeometry
          args={[config.radiusBottom * 0.98, config.radiusBottom, 0.04, 48]}
        />
        <meshStandardMaterial color={bodyColor} roughness={0.6} metalness={0.08} />
      </mesh>

      {config.hasHandle ? <MugHandle color={bodyColor} /> : null}
      {config.hasLid ? (
        <ThermosLid
          radius={config.radiusTop}
          height={config.height}
          color={bodyColor}
        />
      ) : null}
    </group>
  );
}

export function Drinkware3DScene({
  productType,
  productColor,
  textureCanvas,
}: {
  productType: ProductType;
  productColor: string;
  textureCanvas: HTMLCanvasElement | null;
}) {
  const config = getDrinkware3DConfig(productType);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 0.15, config.cameraZ], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#eef2f6']} />
      <ambientLight intensity={0.75} />
      <directionalLight
        position={[2.5, 4, 3]}
        intensity={1.15}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3, 1.5, -2]} intensity={0.35} />
      <DrinkwareBody
        productType={productType}
        productColor={productColor}
        textureCanvas={textureCanvas}
      />
      <OrbitControls
        enablePan={false}
        minDistance={1.8}
        maxDistance={4.5}
        minPolarAngle={Math.PI * 0.22}
        maxPolarAngle={Math.PI * 0.78}
        autoRotate={Boolean(textureCanvas)}
        autoRotateSpeed={1.2}
      />
    </Canvas>
  );
}
