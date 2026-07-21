'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Canvas, useThree } from '@react-three/fiber';
import type { ProductType, ProductDesignTemplate } from '@/lib/data/catalog';
import type { SideDesign } from '@/lib/products/design-state';
import type { PlacedTextLayer } from '@/lib/products/text-layers';
import type { PrintAreaInsets } from '@/lib/products/print-area';
import { getDrinkware3DConfig } from '@/lib/products/drinkware-3d-config';
import { buildDrinkwareWrapTexture } from '@/lib/products/build-drinkware-wrap-texture';
import { useDrinkwareDesignImageLayers } from '@/hooks/useDrinkwareDesignImageLayers';
import { DrinkwareBody } from '@/components/products/customizer/Drinkware3DScene';

/**
 * Offscreen 3D snapshot capture for drinkware cart previews.
 *
 * The interactive customizer scene (`Drinkware3DScene`) uses OrbitControls
 * with auto-rotate, so it can't be reused directly to grab two deterministic
 * left / right profile stills. This module mounts a small, non-interactive copy
 * of the same mesh into a detached (invisible) React root, renders it twice
 * — once rotated −90° and once +90° around Y from the default front — captures each frame via
 * `gl.domElement.toDataURL()`, then unmounts and disposes the WebGL context.
 * Nothing here touches the visible customizer, so the live preview never
 * spins or flickers while a cart snapshot is taken.
 */

const CAPTURE_PX = 640;
const CAPTURE_TIMEOUT_MS = 6000;
/** RAFs to wait after a rotation change before reading pixels back. */
const SETTLE_FRAMES = 2;

type CaptureResult = { left: string; right: string } | null;

/** Y rotation for the left profile (−90° from default front). */
const LEFT_VIEW_ROTATION_Y = -Math.PI / 2;
/** Y rotation for the right profile (+90° from default front). */
const RIGHT_VIEW_ROTATION_Y = Math.PI / 2;

function CaptureRig({
  rotationY,
  onCapture,
}: {
  rotationY: number;
  onCapture: (dataUrl: string) => void;
}) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    let raf = 0;
    let remaining = SETTLE_FRAMES;

    const tick = () => {
      if (remaining > 0) {
        remaining -= 1;
        raf = requestAnimationFrame(tick);
        return;
      }
      gl.render(scene, camera);
      let dataUrl = '';
      try {
        dataUrl = gl.domElement.toDataURL('image/png');
      } catch {
        dataUrl = '';
      }
      onCapture(dataUrl);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the rotation stage changes
  }, [rotationY]);

  return null;
}

function CaptureScene({
  productType,
  productColor,
  textureCanvas,
  rotationY,
  onCapture,
}: {
  productType: ProductType;
  productColor: string;
  textureCanvas: HTMLCanvasElement;
  rotationY: number;
  onCapture: (dataUrl: string) => void;
}) {
  const config = getDrinkware3DConfig(productType);

  return (
    <Canvas
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      camera={{ position: [0.65, 0.14, config.cameraZ], fov: 32 }}
      frameloop="demand"
      dpr={1}
      style={{ width: CAPTURE_PX, height: CAPTURE_PX }}
    >
      <color attach="background" args={['#eef2f6']} />
      <ambientLight intensity={0.58} />
      <hemisphereLight args={['#ffffff', '#b8c4d4', 0.48]} />
      <directionalLight position={[3.2, 4.5, 2.8]} intensity={1.2} />
      <directionalLight position={[-2.8, 1.8, -1.5]} intensity={0.38} />
      <directionalLight position={[0.2, 2.2, 4]} intensity={0.42} />
      <group rotation={[0, rotationY, 0]}>
        <DrinkwareBody
          productType={productType}
          productColor={productColor}
          textureCanvas={textureCanvas}
        />
      </group>
      <CaptureRig rotationY={rotationY} onCapture={onCapture} />
    </Canvas>
  );
}

function DrinkwareCaptureRunner({
  productType,
  productColor,
  textureCanvas,
  onDone,
}: {
  productType: ProductType;
  productColor: string;
  textureCanvas: HTMLCanvasElement;
  onDone: (result: CaptureResult) => void;
}) {
  const [rotationY, setRotationY] = useState(LEFT_VIEW_ROTATION_Y);
  const leftRef = useRef<string | null>(null);
  const doneRef = useRef(false);

  const handleCapture = useCallback(
    (dataUrl: string) => {
      if (doneRef.current) return;
      if (leftRef.current === null) {
        leftRef.current = dataUrl;
        setRotationY(RIGHT_VIEW_ROTATION_Y);
        return;
      }
      doneRef.current = true;
      onDone({ left: leftRef.current, right: dataUrl });
    },
    [onDone],
  );

  return (
    <CaptureScene
      productType={productType}
      productColor={productColor}
      textureCanvas={textureCanvas}
      rotationY={rotationY}
      onCapture={handleCapture}
    />
  );
}

/**
 * Resolves the drinkware wrap image layers + texture the same way the live
 * 3D preview does, then hands off to `DrinkwareCaptureRunner` once ready.
 */
function DrinkwareCaptureBootstrap({
  productType,
  productColor,
  sideDesign,
  designTemplate,
  textLayers,
  canvasHeightPx,
  printBounds,
  onDone,
}: {
  productType: ProductType;
  productColor: string;
  sideDesign: SideDesign;
  designTemplate: ProductDesignTemplate | null | undefined;
  textLayers: PlacedTextLayer[];
  canvasHeightPx?: number;
  printBounds: PrintAreaInsets;
  onDone: (result: CaptureResult) => void;
}) {
  const { images, ready } = useDrinkwareDesignImageLayers({
    shirtColor: productColor,
    sideDesign,
    designTemplate,
  });
  const [textureCanvas, setTextureCanvas] = useState<HTMLCanvasElement | null>(
    null,
  );
  const failedRef = useRef(false);

  const imageKey = images
    .map((image) => `${image.src}|${image.scale}|${image.position.x}|${image.position.y}`)
    .join(';');
  const textKey = textLayers
    .map(
      (layer) =>
        `${layer.instanceId}|${layer.text}|${layer.size}|${layer.color}|${layer.position.x}|${layer.position.y}|${layer.fontFamily}|${layer.fontWeight}`,
    )
    .join(';');

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    void buildDrinkwareWrapTexture({
      productType,
      productColor,
      printBounds,
      images,
      textLayers,
      canvasHeightPx,
    })
      .then((canvas) => {
        if (!cancelled) setTextureCanvas(canvas);
      })
      .catch(() => {
        if (!cancelled) {
          failedRef.current = true;
          onDone(null);
        }
      });

      return () => {
        cancelled = true;
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- imageKey/textKey capture the real deps
  }, [ready, productType, productColor, imageKey, textKey, canvasHeightPx, printBounds]);

  if (!ready || !textureCanvas || failedRef.current) return null;

  return (
    <DrinkwareCaptureRunner
      productType={productType}
      productColor={productColor}
      textureCanvas={textureCanvas}
      onDone={onDone}
    />
  );
}

/**
 * Captures two 3D snapshots of a customized mug/cup/thermos design — left
 * (−90° Y) and right (+90° Y) profile views — for use as cart line-item
 * thumbnails. Returns `null` on failure/timeout so callers can fall back
 * to the existing flat-preview capture.
 */
export async function captureDrinkware3DPreviews(options: {
  productType: ProductType;
  productColor: string;
  sideDesign: SideDesign;
  designTemplate: ProductDesignTemplate | null | undefined;
  textLayers: PlacedTextLayer[];
  canvasHeightPx?: number;
  printBounds?: PrintAreaInsets;
}): Promise<CaptureResult> {
  if (typeof document === 'undefined') return null;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0px';
  container.style.width = `${CAPTURE_PX}px`;
  container.style.height = `${CAPTURE_PX}px`;
  container.style.pointerEvents = 'none';
  container.style.opacity = '0';
  container.setAttribute('aria-hidden', 'true');
  document.body.appendChild(container);

  let root: Root | null = null;
  let settled = false;

  const cleanup = () => {
    try {
      root?.unmount();
    } catch {
      // ignore unmount races during teardown
    }
    container.remove();
  };

  try {
    const result = await new Promise<CaptureResult>((resolve) => {
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        resolve(null);
      }, CAPTURE_TIMEOUT_MS);

      const finish = (value: CaptureResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve(value);
      };

      root = createRoot(container);
      root.render(
        <DrinkwareCaptureBootstrap
          productType={options.productType}
          productColor={options.productColor}
          sideDesign={options.sideDesign}
          designTemplate={options.designTemplate}
          textLayers={options.textLayers}
          canvasHeightPx={options.canvasHeightPx}
          printBounds={
            options.printBounds ?? { top: 0, right: 0, bottom: 0, left: 0 }
          }
          onDone={finish}
        />,
      );
    });

    return result;
  } catch {
    return null;
  } finally {
    cleanup();
  }
}
