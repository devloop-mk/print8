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
  bodyHeight,
  lidHeight,
  color,
}: {
  radius: number;
  bodyHeight: number;
  lidHeight: number;
  color: string;
}) {
  const lidColor = useMemo(() => {
    const c = new THREE.Color(color);
    c.lerp(new THREE.Color('#1a1a1a'), 0.06);
    return `#${c.getHexString()}`;
  }, [color]);

  const capY = bodyHeight / 2;

  return (
    <group position={[0, capY, 0]}>
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[radius * 1.008, radius * 1.008, 0.018, 48]} />
        <meshStandardMaterial color={lidColor} roughness={0.42} metalness={0.18} />
      </mesh>
      <mesh position={[0, lidHeight / 2 + 0.012, 0]}>
        <cylinderGeometry args={[radius, radius, lidHeight, 48]} />
        <meshStandardMaterial color={lidColor} roughness={0.38} metalness={0.22} />
      </mesh>
      <mesh position={[0, lidHeight + 0.012, 0]}>
        <cylinderGeometry args={[radius * 0.9, radius * 0.9, 0.016, 32]} />
        <meshStandardMaterial color={lidColor} roughness={0.45} metalness={0.15} />
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

  const bodyMaterialColor = texture ? '#ffffff' : productColor;
  const matteFinish = productType === 'thermos';

  return (
    <group>
      <mesh ref={meshRef}>
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
          color={bodyMaterialColor}
          roughness={matteFinish ? 0.58 : 0.48}
          metalness={matteFinish ? 0.06 : 0.12}
        />
      </mesh>

      <mesh position={[0, -config.height / 2 - 0.012, 0]}>
        <cylinderGeometry
          args={[config.radiusBottom * 0.97, config.radiusBottom, 0.028, 48]}
        />
        <meshStandardMaterial
          color={productColor}
          roughness={0.62}
          metalness={0.05}
        />
      </mesh>

      {config.hasHandle ? <MugHandle color={productColor} /> : null}
      {config.hasLid ? (
        <ThermosLid
          radius={config.radiusTop}
          bodyHeight={config.height}
          lidHeight={config.lidHeight}
          color={productColor}
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
      camera={{ position: [0, 0.08, config.cameraZ], fov: 36 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#eef2f6']} />
      <ambientLight intensity={0.95} />
      <hemisphereLight args={['#ffffff', '#c5d0dc', 0.55]} />
      <directionalLight position={[3, 5, 4]} intensity={1.25} />
      <directionalLight position={[-2.5, 2.5, -2]} intensity={0.45} />
      <directionalLight position={[0, 1, 5]} intensity={0.3} />
      <DrinkwareBody
        productType={productType}
        productColor={productColor}
        textureCanvas={textureCanvas}
      />
      <OrbitControls
        enablePan={false}
        minDistance={1.9}
        maxDistance={4.8}
        minPolarAngle={Math.PI * 0.25}
        maxPolarAngle={Math.PI * 0.72}
        autoRotate={Boolean(textureCanvas)}
        autoRotateSpeed={1.2}
      />
    </Canvas>
  );
}
