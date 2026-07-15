export async function waitForPaint(): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'));

  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }

          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        }),
    ),
  );
}

async function rasterizeSvgFromUrl(src: string): Promise<string | null> {
  try {
    const absolute = new URL(src, window.location.origin).href;
    const response = await fetch(absolute);
    if (!response.ok) return null;

    const svgText = await response.text();
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);

    try {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('SVG load failed'));
        image.src = objectUrl;
      });

      const width = image.naturalWidth || 200;
      const height = image.naturalHeight || 200;
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;

      const context = canvas.getContext('2d');
      if (!context) return null;

      context.scale(scale, scale);
      context.drawImage(image, 0, 0, width, height);
      return canvas.toDataURL('image/png');
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return null;
  }
}

async function buildRasterizedSvgSubstitutions(
  root: HTMLElement,
): Promise<Map<string, string>> {
  const substitutions = new Map<string, string>();
  const sources = new Set<string>();

  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;
    if (src.endsWith('.svg') || src.includes('.svg?')) {
      sources.add(src);
    }
  });

  await Promise.all(
    [...sources].map(async (src) => {
      const rasterized = await rasterizeSvgFromUrl(src);
      if (rasterized) substitutions.set(src, rasterized);
    }),
  );

  return substitutions;
}

function applyImageSubstitutions(
  root: HTMLElement,
  substitutions: Map<string, string>,
): void {
  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (!src) return;
    const replacement = substitutions.get(src);
    if (replacement) img.setAttribute('src', replacement);
  });
}

/** Pure mockup zoom: inline `transform: scale(N)` (no translate). */
function parseInlineMockupScale(transform: string): number | null {
  const trimmed = transform.trim();
  if (!trimmed || /translate/i.test(trimmed)) return null;

  const match = trimmed.match(
    /^scale\(\s*([-.\d]+)(?:\s*,\s*([-.\d]+))?\s*\)$/i,
  );
  if (!match) return null;

  const x = Number(match[1]);
  const y = match[2] !== undefined ? Number(match[2]) : x;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  if (Math.abs(x - y) > 0.01) return null;
  if (Math.abs(x - 1) < 0.001) return null;
  return x;
}

function isMockupClipShell(el: HTMLElement): boolean {
  if (el.dataset.mockupFrame !== undefined) return true;
  if (el.dataset.mockupInner !== undefined) return true;
  const className = typeof el.className === 'string' ? el.className : '';
  return className.includes('aspect-square');
}

/**
 * Design overlays use % placement — never rewrite those for object-fit.
 */
function isDesignLayerImage(img: HTMLImageElement): boolean {
  const computed = window.getComputedStyle(img);
  if (computed.position === 'absolute') {
    const left = img.style.left || '';
    const top = img.style.top || '';
    const width = img.style.width || '';
    if (left.includes('%') || top.includes('%') || width.includes('%')) {
      return true;
    }
  }

  let parent: HTMLElement | null = img.parentElement;
  for (let depth = 0; parent && depth < 4; depth += 1) {
    const left = parent.style.left || '';
    const top = parent.style.top || '';
    const width = parent.style.width || '';
    if (
      (left.includes('%') || top.includes('%')) &&
      (width.includes('%') || parent.style.transform.includes('translate'))
    ) {
      return true;
    }
    parent = parent.parentElement;
  }

  return false;
}

type StyleRestorer = () => void;

function prepareMockupZoomAndOverflow(root: HTMLElement): StyleRestorer {
  const restorers: StyleRestorer[] = [];
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];

  for (const el of elements) {
    const scale = parseInlineMockupScale(el.style.transform);
    if (scale !== null) {
      const prevTransform = el.style.transform;
      const prevOrigin = el.style.transformOrigin;
      el.style.transform = 'none';
      el.style.transformOrigin = 'center center';
      restorers.push(() => {
        el.style.transform = prevTransform;
        el.style.transformOrigin = prevOrigin;
      });
    }

    if (!isMockupClipShell(el) && el !== root) continue;

    const computedOverflow = window.getComputedStyle(el).overflow;
    if (computedOverflow === 'hidden' || computedOverflow === 'clip') {
      const prevOverflow = el.style.overflow;
      el.style.overflow = 'visible';
      restorers.push(() => {
        el.style.overflow = prevOverflow;
      });
    }
  }

  return () => {
    for (let i = restorers.length - 1; i >= 0; i -= 1) restorers[i]();
  };
}

/**
 * html2canvas ignores CSS object-fit and stretches imgs to their box.
 * Bake object-fit:contain into explicit pixel size + centered position on the
 * live mockup shirt image so the cart capture keeps correct proportions.
 */
function prepareMockupObjectFit(root: HTMLElement): StyleRestorer {
  const restorers: StyleRestorer[] = [];

  root.querySelectorAll('img').forEach((img) => {
    if (!(img instanceof HTMLImageElement)) return;
    if (isDesignLayerImage(img)) return;

    const objectFit = window.getComputedStyle(img).objectFit;
    if (objectFit !== 'contain' && objectFit !== 'cover') return;

    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    const containerWidth = img.clientWidth;
    const containerHeight = img.clientHeight;
    if (!naturalWidth || !naturalHeight || !containerWidth || !containerHeight) {
      return;
    }

    const fitScale =
      objectFit === 'contain'
        ? Math.min(
            containerWidth / naturalWidth,
            containerHeight / naturalHeight,
          )
        : Math.max(
            containerWidth / naturalWidth,
            containerHeight / naturalHeight,
          );

    const width = naturalWidth * fitScale;
    const height = naturalHeight * fitScale;
    const offsetX = (containerWidth - width) / 2;
    const offsetY = (containerHeight - height) / 2;

    const parent = img.parentElement;
    if (parent && window.getComputedStyle(parent).position === 'static') {
      const prevPosition = parent.style.position;
      parent.style.position = 'relative';
      restorers.push(() => {
        parent.style.position = prevPosition;
      });
    }

    // Keep the layout box so the frame does not collapse when the img
    // becomes absolutely positioned for letterboxing.
    if (parent) {
      const prevMinW = parent.style.minWidth;
      const prevMinH = parent.style.minHeight;
      parent.style.minWidth = `${containerWidth}px`;
      parent.style.minHeight = `${containerHeight}px`;
      restorers.push(() => {
        parent.style.minWidth = prevMinW;
        parent.style.minHeight = prevMinH;
      });
    }

    const prev = {
      width: img.style.width,
      height: img.style.height,
      maxWidth: img.style.maxWidth,
      maxHeight: img.style.maxHeight,
      objectFit: img.style.objectFit,
      position: img.style.position,
      left: img.style.left,
      top: img.style.top,
      right: img.style.right,
      bottom: img.style.bottom,
      transform: img.style.transform,
      boxSizing: img.style.boxSizing,
    };

    img.style.boxSizing = 'border-box';
    img.style.width = `${width}px`;
    img.style.height = `${height}px`;
    img.style.maxWidth = 'none';
    img.style.maxHeight = 'none';
    img.style.objectFit = 'fill';
    img.style.position = 'absolute';
    img.style.left = `${offsetX}px`;
    img.style.top = `${offsetY}px`;
    img.style.right = 'auto';
    img.style.bottom = 'auto';
    img.style.transform = 'none';

    restorers.push(() => {
      img.style.width = prev.width;
      img.style.height = prev.height;
      img.style.maxWidth = prev.maxWidth;
      img.style.maxHeight = prev.maxHeight;
      img.style.objectFit = prev.objectFit;
      img.style.position = prev.position;
      img.style.left = prev.left;
      img.style.top = prev.top;
      img.style.right = prev.right;
      img.style.bottom = prev.bottom;
      img.style.transform = prev.transform;
      img.style.boxSizing = prev.boxSizing;
    });
  });

  return () => {
    for (let i = restorers.length - 1; i >= 0; i -= 1) restorers[i]();
  };
}

async function loadHtml2Canvas() {
  const mod = await import('html2canvas');
  return mod.default ?? (mod as unknown as typeof import('html2canvas').default);
}

export async function capturePreviewElement(
  element: HTMLElement,
  options?: { backgroundColor?: string; scale?: number },
): Promise<string | undefined> {
  const restoreZoom = prepareMockupZoomAndOverflow(element);
  let restoreFit: StyleRestorer = () => undefined;

  try {
    await waitForPaint();
    await waitForImages(element);

    // After zoom is removed, bake object-fit using the real layout box.
    restoreFit = prepareMockupObjectFit(element);
    await waitForPaint();

    const svgSubstitutions = await buildRasterizedSvgSubstitutions(element);
    const html2canvas = await loadHtml2Canvas();
    if (typeof html2canvas !== 'function') return undefined;

    const canvas = await html2canvas(element, {
      backgroundColor: options?.backgroundColor ?? '#ffffff',
      scale: options?.scale ?? 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      imageTimeout: 15000,
      onclone: (_document, cloneElement) => {
        applyImageSubstitutions(cloneElement, svgSubstitutions);
      },
    });

    if (!canvas.width || !canvas.height) return undefined;

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.warn('[capture-preview] failed', error);
    return undefined;
  } finally {
    restoreFit();
    restoreZoom();
  }
}
