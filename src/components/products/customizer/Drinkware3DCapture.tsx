'use client';

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Canvas, useThree } from '@react-three/fiber';
import type { ProductType, ProductDesignTemplate } from '@/lib/data/catalog';
import type { SideDesign } from '@/lib/products/design-state';
import type { PlacedTextLayer } from '@/lib/products/text-layers';
import type { PrintAreaInsets } from '@/lib/products/print-area';
import { getDrinkwareCaptureCamera } from '@/lib/products/drinkware-3d-config';
import {
  getDrinkwareCaptureYaws,
  type DrinkwareCaptureYaws,
} from '@/lib/products/drinkware-capture-yaws';
import { buildDrinkwareWrapTexture } from '@/lib/products/build-drinkware-wrap-texture';
import { useDrinkwareDesignImageLayers } from '@/hooks/useDrinkwareDesignImageLayers';
import { DrinkwareBody } from '@/components/products/customizer/Drinkware3DScene';

/**
 * Offscreen 3D snapshot capture for drinkware cart previews.
 *
 * The interactive customizer scene (`Drinkware3DScene`) uses OrbitControls
 * with auto-rotate, so it can't be reused directly to grab two deterministic
 * left / right profile stills. This module mounts a small, non-interactive copy
 * of the same mesh into a detached (invisible) React root, renders front +
 * left + right stills (yaws follow wrap art so side prints face the camera),
 * captures each frame via
 * `gl.domElement.toDataURL()`, then unmounts and disposes the WebGL context.
 * Nothing here touches the visible customizer, so the live preview never
 * spins or flickers while a cart snapshot is taken.
 */

const CAPTURE_PX = 640;
const CAPTURE_TIMEOUT_MS = 12000;
/** RAFs to wait after a rotation change before reading pixels back. */
const SETTLE_FRAMES = 2;

type CaptureResult = { front: string; left: string; right: string } | null;

const VIEW_ORDER = ['left', 'front', 'right'] as const;

function CaptureCameraAim() {
  const { camera } = useThree();
  useLayoutEffect(() => {
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

function CaptureRig({
  rotationY,
  shotKey,
  onCapture,
}: {
  rotationY: number;
  shotKey: number;
  onCapture: (dataUrl: string) => void;
}) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    camera.lookAt(0, 0, 0);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run when the staged still changes
  }, [rotationY, shotKey]);

  return null;
}

function CaptureScene({
  productType,
  productId,
  productColor,
  textureCanvas,
  rotationY,
  shotKey,
  onCapture,
}: {
  productType: ProductType;
  productId?: string;
  productColor: string;
  textureCanvas: HTMLCanvasElement;
  rotationY: number;
  shotKey: number;
  onCapture: (dataUrl: string) => void;
}) {
  const captureCamera = getDrinkwareCaptureCamera(productType, productId);

  return (
    <Canvas
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      camera={{
        position: captureCamera.position,
        fov: captureCamera.fov,
      }}
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
      <CaptureCameraAim />
      <group rotation={[0, rotationY, 0]}>
        <DrinkwareBody
          productType={productType}
          productId={productId}
          productColor={productColor}
          textureCanvas={textureCanvas}
        />
      </group>
      <CaptureRig rotationY={rotationY} shotKey={shotKey} onCapture={onCapture} />
    </Canvas>
  );
}

function DrinkwareFrontCaptureRunner({
  productType,
  productId,
  productColor,
  textureCanvas,
  onDone,
}: {
  productType: ProductType;
  productId?: string;
  productColor: string;
  textureCanvas: HTMLCanvasElement;
  onDone: (dataUrl: string) => void;
}) {
  const doneRef = useRef(false);

  const handleCapture = useCallback(
    (dataUrl: string) => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDone(dataUrl);
    },
    [onDone],
  );

  return (
    <CaptureScene
      productType={productType}
      productId={productId}
      productColor={productColor}
      textureCanvas={textureCanvas}
      rotationY={0}
      shotKey={0}
      onCapture={handleCapture}
    />
  );
}

function DrinkwareCaptureRunner({
  productType,
  productId,
  productColor,
  textureCanvas,
  yaws,
  onDone,
}: {
  productType: ProductType;
  productId?: string;
  productColor: string;
  textureCanvas: HTMLCanvasElement;
  yaws: DrinkwareCaptureYaws;
  onDone: (result: CaptureResult) => void;
}) {
  const [shotIndex, setShotIndex] = useState(0);
  const shotsRef = useRef<Partial<Record<(typeof VIEW_ORDER)[number], string>>>(
    {},
  );
  const stageRef = useRef(0);
  const doneRef = useRef(false);
  const rotationSequence = [yaws.left, yaws.front, yaws.right];

  const handleCapture = useCallback(
    (dataUrl: string) => {
      if (doneRef.current) return;
      const stage = stageRef.current;
      const view = VIEW_ORDER[stage];
      if (view) shotsRef.current[view] = dataUrl;
      if (stage < VIEW_ORDER.length - 1) {
        stageRef.current = stage + 1;
        setShotIndex(stage + 1);
        return;
      }
      doneRef.current = true;
      onDone({
        front: shotsRef.current.front ?? '',
        left: shotsRef.current.left ?? '',
        right: shotsRef.current.right ?? dataUrl,
      });
    },
    [onDone],
  );

  return (
    <CaptureScene
      productType={productType}
      productId={productId}
      productColor={productColor}
      textureCanvas={textureCanvas}
      rotationY={rotationSequence[shotIndex] ?? 0}
      shotKey={shotIndex}
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
  productId,
  productColor,
  sideDesign,
  designTemplate,
  textLayers,
  canvasHeightPx,
  printBounds,
  onDone,
}: {
  productType: ProductType;
  productId?: string;
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
  const stickerKey = sideDesign.stickers
    .map(
      (sticker) =>
        `${sticker.instanceId}|${sticker.stickerId}|${sticker.scale}|${sticker.position.x}|${sticker.position.y}`,
    )
    .join(';');

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    void buildDrinkwareWrapTexture({
      productType,
      productId,
      productColor,
      printBounds,
      images,
      textLayers,
      stickers: sideDesign.stickers,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- imageKey/textKey/stickerKey capture the real deps
  }, [ready, productType, productId, productColor, imageKey, textKey, stickerKey, canvasHeightPx, printBounds]);

  if (!ready || !textureCanvas || failedRef.current) return null;

  return (
    <DrinkwareCaptureRunner
      productType={productType}
      productId={productId}
      productColor={productColor}
      textureCanvas={textureCanvas}
      yaws={getDrinkwareCaptureYaws(sideDesign)}
      onDone={onDone}
    />
  );
}

/** Same texture pipeline as cart capture, but a single front-facing still. */
function DrinkwareFrontCaptureBootstrap({
  productType,
  productId,
  productColor,
  sideDesign,
  designTemplate,
  textLayers,
  canvasHeightPx,
  printBounds,
  onDone,
}: {
  productType: ProductType;
  productId?: string;
  productColor: string;
  sideDesign: SideDesign;
  designTemplate: ProductDesignTemplate | null | undefined;
  textLayers: PlacedTextLayer[];
  canvasHeightPx?: number;
  printBounds: PrintAreaInsets;
  onDone: (result: string | null) => void;
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
  const stickerKey = sideDesign.stickers
    .map(
      (sticker) =>
        `${sticker.instanceId}|${sticker.stickerId}|${sticker.scale}|${sticker.position.x}|${sticker.position.y}`,
    )
    .join(';');

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    void buildDrinkwareWrapTexture({
      productType,
      productId,
      productColor,
      printBounds,
      images,
      textLayers,
      stickers: sideDesign.stickers,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- imageKey/textKey/stickerKey capture the real deps
  }, [ready, productType, productId, productColor, imageKey, textKey, stickerKey, canvasHeightPx, printBounds]);

  if (!ready || !textureCanvas || failedRef.current) return null;

  return (
    <DrinkwareFrontCaptureRunner
      productType={productType}
      productId={productId}
      productColor={productColor}
      textureCanvas={textureCanvas}
      onDone={onDone}
    />
  );
}

export type DrinkwareCaptureOptions = {
  productType: ProductType;
  productId?: string;
  productColor: string;
  sideDesign: SideDesign;
  designTemplate: ProductDesignTemplate | null | undefined;
  textLayers: PlacedTextLayer[];
  canvasHeightPx?: number;
  printBounds?: PrintAreaInsets;
};

async function mountOffscreenCapture<T>(
  render: (root: Root, finish: (value: T) => void) => void,
): Promise<T> {
  if (typeof document === 'undefined') return null as T;

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
    const result = await new Promise<T>((resolve) => {
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        resolve(null as T);
      }, CAPTURE_TIMEOUT_MS);

      const finish = (value: T) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve(value);
      };

      const captureRoot = createRoot(container);
      root = captureRoot;
      render(captureRoot, finish);
    });

    return result;
  } catch {
    return null as T;
  } finally {
    cleanup();
  }
}

/**
 * Single front-facing 3D snapshot for catalog cards (wrap designs).
 */
export async function captureDrinkware3DFrontPreview(
  options: DrinkwareCaptureOptions,
): Promise<string | null> {
  return mountOffscreenCapture<string | null>((captureRoot, finish) => {
    captureRoot.render(
      <DrinkwareFrontCaptureBootstrap
        productType={options.productType}
        productId={options.productId}
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
}

/**
 * Captures three 3D snapshots of a customized mug/cup/thermos — front plus
 * left/right aimed at wrap art — for cart and admin stills. Returns `null`
 * on failure/timeout so callers can fall back to the existing flat-preview
 * capture.
 */
export async function captureDrinkware3DPreviews(
  options: DrinkwareCaptureOptions,
): Promise<CaptureResult> {
  return mountOffscreenCapture<CaptureResult>((captureRoot, finish) => {
    captureRoot.render(
      <DrinkwareCaptureBootstrap
        productType={options.productType}
        productId={options.productId}
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
}
