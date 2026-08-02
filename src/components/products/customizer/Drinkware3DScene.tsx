'use client';

import { useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { ProductType } from '@/lib/data/catalog';
import {
  getDrinkware3DConfig,
  type Drinkware3DConfig,
} from '@/lib/products/drinkware-3d-config';
import { getDrinkwareBodyColor } from '@/lib/products/drinkware-sublimation-patch';

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

/** Shift wrap sampling upward so art sits on the glass wall, not the foot. */
function applyWrapVerticalUVInset(
  geometry: THREE.BufferGeometry,
  bottomInset: number,
  topInset: number,
) {
  const uv = geometry.attributes.uv;
  if (!uv) return;

  const bottom = Math.max(0, bottomInset);
  const top = Math.max(0, topInset);
  const range = 1 - bottom - top;
  if (range <= 0) return;

  for (let i = 0; i < uv.count; i++) {
    const v = uv.getY(i);
    uv.setY(i, bottom + v * range);
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

function GlassMaterial({
  color,
  map,
  side,
}: {
  color: string;
  map?: THREE.Texture | null;
  side?: THREE.Side;
}) {
  return (
    <meshPhysicalMaterial
      color={map ? '#f8fcff' : color}
      map={map ?? undefined}
      transmission={map ? 0.62 : 0.9}
      transparent
      opacity={1}
      roughness={0.04}
      metalness={0.04}
      ior={1.52}
      thickness={0.22}
      clearcoat={1}
      clearcoatRoughness={0.04}
      envMapIntensity={1.1}
      side={side ?? THREE.FrontSide}
    />
  );
}

function FrostedGlassMaterial({
  color,
  map,
  side,
}: {
  color: string;
  map?: THREE.Texture | null;
  side?: THREE.Side;
}) {
  const hasMap = Boolean(map);
  return (
    <meshPhysicalMaterial
      color={hasMap ? '#f6f7f8' : color}
      map={map ?? undefined}
      transmission={hasMap ? 0.58 : 0.94}
      transparent
      opacity={1}
      roughness={0.94}
      metalness={0}
      ior={1.52}
      thickness={hasMap ? 0.42 : 0.72}
      clearcoat={0}
      specularIntensity={0.15}
      envMapIntensity={0.12}
      attenuationColor="#e4e8ec"
      attenuationDistance={0.28}
      side={side ?? THREE.FrontSide}
    />
  );
}

function MetallicHandleMaterial({
  variant,
}: {
  variant: 'chrome' | 'gold';
}) {
  const isGold = variant === 'gold';
  return (
    <meshPhysicalMaterial
      color={isGold ? '#d4af37' : '#c5cad1'}
      roughness={isGold ? 0.22 : 0.16}
      metalness={isGold ? 0.9 : 0.94}
      clearcoat={0.85}
      clearcoatRoughness={0.12}
      envMapIntensity={1.35}
    />
  );
}

function buildClassicMugHandleCurve(bodyRadius: number, bodyHeight: number) {
  const attachX = bodyRadius * 0.98;
  const reach = bodyRadius * 0.78;
  const half = bodyHeight * 0.2;
  return new THREE.CubicBezierCurve3(
    new THREE.Vector3(attachX, half, 0),
    new THREE.Vector3(attachX + reach, half * 1.08, 0),
    new THREE.Vector3(attachX + reach, -half * 1.08, 0),
    new THREE.Vector3(attachX, -half, 0),
  );
}

/**
 * Heart mug handle geometry traced from mug-heart-handle.jpg:
 * one open tube top→bottom with a cleft dip and outer tip, built from smooth
 * cubic-bezier segments (avoids kinked Catmull-Rom / CurvePath artifacts).
 */
function buildHeartHandleGeometry(
  bodyRadius: number,
  bodyHeight: number,
  tubeRadius: number,
  radialSegments: number,
): THREE.BufferGeometry {
  const ax = bodyRadius * 0.985;
  const r = bodyRadius * 0.68;
  const top = bodyHeight * 0.21;
  const bottom = -bodyHeight * 0.135;
  const h = bodyHeight;
  const tip = h * 0.042;
  const p = (xf: number, y: number) => new THREE.Vector3(ax + r * xf, y, 0);

  const tubular = 44;
  const curves = [
    new THREE.CubicBezierCurve3(
      p(0, top),
      p(0.16, top + h * 0.025),
      p(0.4, top + h * 0.033),
      p(0.48, top + h * 0.026),
    ),
    new THREE.CubicBezierCurve3(
      p(0.48, top + h * 0.026),
      p(0.36, top + h * 0.017),
      p(0.09, top + h * 0.009),
      p(0.14, top + h * 0.003),
    ),
    new THREE.CubicBezierCurve3(
      p(0.14, top + h * 0.003),
      p(0.46, tip + h * 0.01),
      p(0.9, tip + h * 0.014),
      p(1, tip),
    ),
    new THREE.CubicBezierCurve3(
      p(1, tip),
      p(0.97, tip - h * 0.055),
      p(0.6, bottom * 0.38),
      p(0.32, bottom * 0.8),
    ),
    new THREE.CubicBezierCurve3(
      p(0.32, bottom * 0.8),
      p(0.12, bottom * 0.97),
      p(0.02, bottom * 1.01),
      p(0, bottom),
    ),
  ];

  const parts = curves.map(
    (curve) =>
      new THREE.TubeGeometry(curve, tubular, tubeRadius, radialSegments, false),
  );
  const merged = mergeGeometries(parts);
  for (const part of parts) part.dispose();
  if (!merged) {
    throw new Error('Failed to merge heart handle geometry');
  }
  return merged;
}

function MugHandle({
  color,
  bodyRadius,
  bodyHeight,
  material = 'ceramic',
  handleType = 'c',
  handleMaterial = 'ceramic',
  handleColor,
}: {
  color: string;
  bodyRadius: number;
  bodyHeight: number;
  material?: Drinkware3DConfig['material'];
  handleType?: Drinkware3DConfig['handleType'];
  handleMaterial?: Drinkware3DConfig['handleMaterial'];
  handleColor?: string;
}) {
  const radius = Math.min(0.042, bodyRadius * 0.1);
  const radialSegments = 16;
  const glazeColor = handleColor ?? color;

  const heartGeometry = useMemo(() => {
    if (handleType !== 'heart') return null;
    return buildHeartHandleGeometry(
      bodyRadius,
      bodyHeight,
      radius,
      radialSegments,
    );
  }, [bodyRadius, bodyHeight, handleType, radius]);

  useEffect(() => {
    return () => {
      heartGeometry?.dispose();
    };
  }, [heartGeometry]);

  const curve = useMemo(() => {
    if (handleType === 'heart') return null;
    return buildClassicMugHandleCurve(bodyRadius, bodyHeight);
  }, [bodyRadius, bodyHeight, handleType]);

  const handleMaterialNode =
    handleMaterial === 'chrome' || handleMaterial === 'gold' ? (
      <MetallicHandleMaterial variant={handleMaterial} />
    ) : material === 'glass' ? (
      <FrostedGlassMaterial color={glazeColor} />
    ) : (
      <CeramicMaterial color={glazeColor} roughness={0.32} clearcoat={0.4} />
    );

  if (handleType === 'heart' && heartGeometry) {
    return (
      <mesh key={handleType} geometry={heartGeometry}>
        {handleMaterialNode}
      </mesh>
    );
  }

  return (
    <mesh key={handleType}>
      <tubeGeometry args={[curve!, 56, radius, radialSegments, false]} />
      {handleMaterialNode}
    </mesh>
  );
}

/** Wide D-handle for glass beer mugs — thicker and longer than ceramic mug handles. */
function BeerGlassHandle({
  color,
  bodyRadius,
  bodyHeight,
}: {
  color: string;
  bodyRadius: number;
  bodyHeight: number;
}) {
  const curve = useMemo(() => {
    const attachX = bodyRadius * 0.99;
    const reach = bodyRadius * 0.82;
    const half = bodyHeight * 0.3;
    return new THREE.CubicBezierCurve3(
      new THREE.Vector3(attachX, half, 0),
      new THREE.Vector3(attachX + reach, half * 1.05, 0),
      new THREE.Vector3(attachX + reach, -half * 1.05, 0),
      new THREE.Vector3(attachX, -half * 0.92, 0),
    );
  }, [bodyRadius, bodyHeight]);

  const radius = Math.min(0.058, bodyRadius * 0.13);

  return (
    <mesh>
      <tubeGeometry args={[curve, 64, radius, 16, false]} />
      <GlassMaterial color={color} />
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
    // Three.js puts the index seam at +Z; rotate so the cut aligns with +X (handle).
    // Without this, triangles spanning u≈0.99→0.01 sample the full wrap at the handle.
    geom.rotateY(Math.PI / 2);
    applySeamAtHandleUVs(geom);
    if (config.wrapUvBottomInset || config.wrapUvTopInset) {
      applyWrapVerticalUVInset(
        geom,
        config.wrapUvBottomInset ?? 0,
        config.wrapUvTopInset ?? 0,
      );
    }
    return geom;
  }, [
    config.radiusTop,
    config.radiusBottom,
    config.height,
    config.wrapUvBottomInset,
    config.wrapUvTopInset,
  ]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  const matte = productType === 'thermos';
  const isGlass = config.material === 'glass';
  const isFrosted = Boolean(config.glassFrosted);

  return (
    <mesh geometry={geometry}>
      {isGlass ? (
        isFrosted ? (
          <FrostedGlassMaterial color={productColor} map={texture} />
        ) : (
          <GlassMaterial color={productColor} map={texture} />
        )
      ) : (
        <CeramicMaterial
          color={productColor}
          map={texture}
          roughness={matte ? 0.52 : 0.26}
          metalness={matte ? 0.06 : 0.02}
          clearcoat={matte ? 0.15 : 0.62}
        />
      )}
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
  productId,
}: {
  productType: ProductType;
  productColor: string;
  textureCanvas: HTMLCanvasElement | null;
  productId?: string;
}) {
  const config = getDrinkware3DConfig(productType, productId);
  const bodyGlaze = getDrinkwareBodyColor(productId, productColor);
  const isGlass = config.material === 'glass';
  const isFrosted = Boolean(config.glassFrosted);
  const handleType =
    config.handleType ?? (isGlass && !isFrosted ? 'd' : 'c');
  const handleGlaze = config.handleColor ?? bodyGlaze;

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
  const baseHeight = config.baseHeight ?? 0.022;

  const interiorColor = useMemo(() => {
    if (config.interiorColor) return config.interiorColor;
    if (isFrosted) return '#e6eaee';
    const c = new THREE.Color(productColor);
    c.multiplyScalar(isGlass ? 0.98 : 0.92);
    return `#${c.getHexString()}`;
  }, [config.interiorColor, isFrosted, isGlass, productColor]);

  return (
    <group
      // Design front (u=0.5 / -X) faces the camera (+Z); handle ends up on the right
      rotation={[0, Math.PI / 2, 0]}
    >
      <OuterBody
        config={config}
        productColor={bodyGlaze}
        texture={texture}
        productType={productType}
      />

      {!isGlass ? (
        <>
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
            <meshPhysicalMaterial
              color={interiorColor}
              roughness={0.5}
              metalness={0}
            />
          </mesh>
        </>
      ) : isFrosted ? (
        <>
          <mesh>
            <cylinderGeometry
              args={[innerTop, innerBottom, innerHeight, 64, 1, true]}
            />
            <FrostedGlassMaterial color={interiorColor} side={THREE.BackSide} />
          </mesh>
          <mesh position={[0, floorY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[innerBottom * 0.98, 48]} />
            <FrostedGlassMaterial color={interiorColor} />
          </mesh>
        </>
      ) : (
        <mesh>
          <cylinderGeometry
            args={[innerTop, innerBottom, innerHeight, 64, 1, true]}
          />
          <GlassMaterial color={interiorColor} side={THREE.BackSide} />
        </mesh>
      )}

      <mesh position={[0, rimY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[innerTop, config.radiusTop * 1.012, 64]} />
        {isGlass ? (
          isFrosted ? (
            <FrostedGlassMaterial color={bodyGlaze} />
          ) : (
            <GlassMaterial color={bodyGlaze} />
          )
        ) : (
          <CeramicMaterial color={bodyGlaze} roughness={0.22} clearcoat={0.75} />
        )}
      </mesh>

      <mesh position={[0, -config.height / 2 - baseHeight / 2, 0]}>
        <cylinderGeometry
          args={[
            config.radiusBottom * 0.95,
            config.radiusBottom * 0.99,
            baseHeight,
            48,
          ]}
        />
        {isGlass ? (
          isFrosted ? (
            <FrostedGlassMaterial color={bodyGlaze} />
          ) : (
            <GlassMaterial color={bodyGlaze} />
          )
        ) : (
          <CeramicMaterial color={bodyGlaze} roughness={0.4} clearcoat={0.3} />
        )}
      </mesh>

      {config.hasHandle ? (
        handleType === 'd' ? (
          <BeerGlassHandle
            key={productId ?? 'cup-glass'}
            color={bodyGlaze}
            bodyRadius={(config.radiusTop + config.radiusBottom) / 2}
            bodyHeight={config.height}
          />
        ) : (
          <MugHandle
            key={`${productId ?? 'mug'}-${handleType}-${config.handleMaterial ?? 'ceramic'}`}
            color={bodyGlaze}
            handleColor={handleGlaze}
            bodyRadius={(config.radiusTop + config.radiusBottom) / 2}
            bodyHeight={config.height}
            material={config.material}
            handleType={handleType}
            handleMaterial={config.handleMaterial}
          />
        )
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
  productId,
}: {
  productType: ProductType;
  productColor: string;
  textureCanvas: HTMLCanvasElement | null;
  productId?: string;
}) {
  const config = getDrinkware3DConfig(productType, productId);

  return (
    <Canvas
      key={productId ?? productType}
      camera={{
        position: config.cameraPosition ?? [0.65, 0.14, config.cameraZ],
        fov: 32,
      }}
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
        productId={productId}
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
