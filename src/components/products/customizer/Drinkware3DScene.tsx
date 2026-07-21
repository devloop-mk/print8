'use client';

import { useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { ProductType } from '@/lib/data/catalog';
import {
  getDrinkware3DConfig,
  type Drinkware3DConfig,
} from '@/lib/products/drinkware-3d-config';

/**
 * Remap cylinder UVs so:
 * - u=0 / u=1 = +X (handle seam) — matches texture edges cleared by clearHandleGap
 * - u=0.5 = -X (design front, opposite handle)
 * - u increases in the same left→right direction as the flat 2D canvas, so
 *   the wrap isn't mirrored versus the editor.
 *
 * Default Three.js UVs put the seam on +Z (camera-facing), which misaligned
 * the wrap vs the 2D editor. Negating z before atan2 reverses the traversal
 * direction around the seam/front axis (which stay fixed) so canvas-right
 * maps to camera-right instead of camera-left.
 */
function applySeamAtHandleUVs(geometry: THREE.BufferGeometry) {
  const uv = geometry.attributes.uv;
  const pos = geometry.attributes.position;
  if (!uv || !pos) return;

  for (let i = 0; i < uv.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    let u = Math.atan2(-z, x) / (Math.PI * 2);
    if (u < 0) u += 1;
    uv.setX(i, u);
  }
  uv.needsUpdate = true;
}

function CeramicMaterial({
  color,
  map,
  roughness = 0.28,
  metalness = 0.02,
  clearcoat = 0.55,
  side,
}: {
  color: string;
  map?: THREE.Texture | null;
  roughness?: number;
  metalness?: number;
  clearcoat?: number;
  side?: THREE.Side;
}) {
  return (
    <meshPhysicalMaterial
      color={map ? '#ffffff' : color}
      map={map ?? undefined}
      roughness={roughness}
      metalness={metalness}
      clearcoat={clearcoat}
      clearcoatRoughness={0.22}
      side={side}
    />
  );
}

function MugHandle({
  color,
  bodyRadius,
  bodyHeight,
}: {
  color: string;
  bodyRadius: number;
  bodyHeight: number;
}) {
  const curve = useMemo(() => {
    const attachX = bodyRadius * 0.98;
    const reach = bodyRadius * 0.78;
    const half = bodyHeight * 0.2;
    return new THREE.CubicBezierCurve3(
      new THREE.Vector3(attachX, half, 0),
      new THREE.Vector3(attachX + reach, half * 1.08, 0),
      new THREE.Vector3(attachX + reach, -half * 1.08, 0),
      new THREE.Vector3(attachX, -half, 0),
    );
  }, [bodyRadius, bodyHeight]);

  const radius = Math.min(0.042, bodyRadius * 0.1);

  return (
    <mesh>
      <tubeGeometry args={[curve, 56, radius, 14, false]} />
      <CeramicMaterial color={color} roughness={0.32} clearcoat={0.4} />
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
    c.lerp(new THREE.Color('#1a1a1a'), 0.08);
    return `#${c.getHexString()}`;
  }, [color]);

  const capY = bodyHeight / 2;

  return (
    <group position={[0, capY, 0]}>
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[radius * 1.01, radius * 1.01, 0.02, 48]} />
        <meshStandardMaterial color={lidColor} roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0, lidHeight / 2 + 0.014, 0]}>
        <cylinderGeometry args={[radius * 0.98, radius * 0.98, lidHeight, 48]} />
        <meshStandardMaterial color={lidColor} roughness={0.36} metalness={0.24} />
      </mesh>
      <mesh position={[0, lidHeight + 0.014, 0]}>
        <cylinderGeometry args={[radius * 0.88, radius * 0.88, 0.018, 32]} />
        <meshStandardMaterial color={lidColor} roughness={0.42} metalness={0.18} />
      </mesh>
    </group>
  );
}

function OuterBody({
  config,
  productColor,
  texture,
  productType,
}: {
  config: Drinkware3DConfig;
  productColor: string;
  texture: THREE.CanvasTexture | null;
  productType: ProductType;
}) {
  const geometry = useMemo(() => {
    const geom = new THREE.CylinderGeometry(
      config.radiusTop,
      config.radiusBottom,
      config.height,
      96,
      1,
      true,
    );
    applySeamAtHandleUVs(geom);
    return geom;
  }, [config.radiusTop, config.radiusBottom, config.height]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  const matte = productType === 'thermos';

  return (
    <mesh geometry={geometry}>
      <CeramicMaterial
        color={productColor}
        map={texture}
        roughness={matte ? 0.52 : 0.26}
        metalness={matte ? 0.06 : 0.02}
        clearcoat={matte ? 0.15 : 0.62}
      />
    </mesh>
  );
}

/**
 * Exported so the offscreen cart-snapshot capture (`Drinkware3DCapture`) can
 * render the exact same mesh/material without a live OrbitControls scene.
 */
export function DrinkwareBody({
  productType,
  productColor,
  textureCanvas,
}: {
  productType: ProductType;
  productColor: string;
  textureCanvas: HTMLCanvasElement | null;
}) {
  const config = getDrinkware3DConfig(productType);

  const texture = useMemo(() => {
    if (!textureCanvas) return null;
    const map = new THREE.CanvasTexture(textureCanvas);
    map.colorSpace = THREE.SRGBColorSpace;
    // Repeat + no mipmaps: cylinder u=0/u=1 seam must not sample a cracked mip edge.
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.ClampToEdgeWrapping;
    map.generateMipmaps = false;
    map.minFilter = THREE.LinearFilter;
    map.magFilter = THREE.LinearFilter;
    map.anisotropy = 8;
    map.needsUpdate = true;
    return map;
  }, [textureCanvas]);

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  // Force texture GPU update when the canvas pixels change (same canvas element).
  useEffect(() => {
    if (texture && textureCanvas) {
      texture.needsUpdate = true;
    }
  }, [texture, textureCanvas]);

  const innerTop = Math.max(0.05, config.radiusTop - config.wallThickness);
  const innerBottom = Math.max(0.05, config.radiusBottom - config.wallThickness);
  const innerHeight = config.height - config.wallThickness * 0.5;
  const rimY = config.height / 2;
  const floorY = -config.height / 2 + config.wallThickness * 0.35;

  const interiorColor = useMemo(() => {
    const c = new THREE.Color(productColor);
    c.multiplyScalar(0.92);
    return `#${c.getHexString()}`;
  }, [productColor]);

  return (
    <group
      // Design front (u=0.5 / -X) faces the camera (+Z); handle ends up on the right
      rotation={[0, Math.PI / 2, 0]}
    >
      <OuterBody
        config={config}
        productColor={productColor}
        texture={texture}
        productType={productType}
      />

      <mesh>
        <cylinderGeometry
          args={[innerTop, innerBottom, innerHeight, 64, 1, true]}
        />
        <meshPhysicalMaterial
          color={interiorColor}
          roughness={0.45}
          metalness={0}
          side={THREE.BackSide}
          clearcoat={0.15}
        />
      </mesh>

      <mesh position={[0, floorY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[innerBottom * 0.98, 48]} />
        <meshPhysicalMaterial color={interiorColor} roughness={0.5} metalness={0} />
      </mesh>

      <mesh position={[0, rimY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[innerTop, config.radiusTop * 1.012, 64]} />
        <CeramicMaterial color={productColor} roughness={0.22} clearcoat={0.75} />
      </mesh>

      <mesh position={[0, -config.height / 2 - 0.01, 0]}>
        <cylinderGeometry
          args={[
            config.radiusBottom * 0.95,
            config.radiusBottom * 0.99,
            0.022,
            48,
          ]}
        />
        <CeramicMaterial color={productColor} roughness={0.4} clearcoat={0.3} />
      </mesh>

      {config.hasHandle ? (
        <MugHandle
          color={productColor}
          bodyRadius={(config.radiusTop + config.radiusBottom) / 2}
          bodyHeight={config.height}
        />
      ) : null}

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
      camera={{ position: [0.65, 0.14, config.cameraZ], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#eef2f6']} />
      <ambientLight intensity={0.58} />
      <hemisphereLight args={['#ffffff', '#b8c4d4', 0.48]} />
      <directionalLight position={[3.2, 4.5, 2.8]} intensity={1.2} />
      <directionalLight position={[-2.8, 1.8, -1.5]} intensity={0.38} />
      <directionalLight position={[0.2, 2.2, 4]} intensity={0.42} />
      <DrinkwareBody
        productType={productType}
        productColor={productColor}
        textureCanvas={textureCanvas}
      />
      <OrbitControls
        enablePan={false}
        target={[0, 0, 0]}
        minDistance={1.85}
        maxDistance={4.2}
        minPolarAngle={Math.PI * 0.28}
        maxPolarAngle={Math.PI * 0.72}
        autoRotate={Boolean(textureCanvas)}
        autoRotateSpeed={0.65}
      />
    </Canvas>
  );
}
