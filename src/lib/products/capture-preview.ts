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
          if (img.complete) {
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

function isSvgSrc(src: string): boolean {
  const path = src.split('?')[0] ?? src;
  return path.toLowerCase().endsWith('.svg');
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

/**
 * `/_next/image` is same-origin, but html2canvas with useCORS still issues a
 * CORS fetch. Next's optimizer does not send ACAO, so the clone taints and
 * `toDataURL` throws — cart then stores a blank mockup with no design.
 */
function needsRasterSubstitution(src: string): boolean {
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) return false;
  if (isSvgSrc(src)) return false;
  if (src.includes('/_next/image')) return true;
  return /^https?:\/\//i.test(src);
}

async function fetchImageAsDataUrl(src: string): Promise<string | null> {
  try {
    const absolute = new URL(src, window.location.origin).href;
    const response = await fetch(absolute, { credentials: 'same-origin' });
    if (!response.ok) return null;
    const blob = await response.blob();
    if (blob.size === 0) return null;
    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}

function tryDrawImageToDataUrl(img: HTMLImageElement): string | null {
  if (!img.naturalWidth || !img.naturalHeight) return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
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

function rememberSubstitution(
  substitutions: Map<string, string>,
  src: string,
  currentSrc: string,
  dataUrl: string,
) {
  substitutions.set(src, dataUrl);
  if (currentSrc && currentSrc !== src) substitutions.set(currentSrc, dataUrl);
}

async function buildImageSubstitutions(
  root: HTMLElement,
): Promise<Map<string, string>> {
  const substitutions = new Map<string, string>();
  const images = Array.from(root.querySelectorAll('img'));

  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute('src') || img.currentSrc;
      if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;
      if (substitutions.has(src)) return;

      if (isSvgSrc(src) || src.includes('.svg?')) {
        const rasterized = await rasterizeSvgFromUrl(src);
        if (rasterized) rememberSubstitution(substitutions, src, img.currentSrc, rasterized);
        return;
      }

      if (!needsRasterSubstitution(src)) return;

      const dataUrl =
        (await fetchImageAsDataUrl(src)) ?? tryDrawImageToDataUrl(img);
      if (dataUrl) rememberSubstitution(substitutions, src, img.currentSrc, dataUrl);
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
    const current =
      img instanceof HTMLImageElement ? img.currentSrc : '';
    const replacement =
      (src ? substitutions.get(src) : undefined) ??
      (current ? substitutions.get(current) : undefined);
    if (!replacement) return;
    img.removeAttribute('crossorigin');
    img.setAttribute('loading', 'eager');
    img.setAttribute('src', replacement);
  });
}

function prepareImagesForCapture(root: HTMLElement): StyleRestorer {
  const restorers: StyleRestorer[] = [];

  root.querySelectorAll('img').forEach((img) => {
    const prevLoading = img.getAttribute('loading');
    const prevDecoding = img.getAttribute('decoding');
    img.setAttribute('loading', 'eager');
    img.setAttribute('decoding', 'sync');
    restorers.push(() => {
      if (prevLoading) img.setAttribute('loading', prevLoading);
      else img.removeAttribute('loading');
      if (prevDecoding) img.setAttribute('decoding', prevDecoding);
      else img.removeAttribute('decoding');
    });
  });

  return () => {
    for (let i = restorers.length - 1; i >= 0; i -= 1) restorers[i]();
  };
}

function applyLiveImageSubstitutions(
  root: HTMLElement,
  substitutions: Map<string, string>,
): StyleRestorer {
  const restorers: StyleRestorer[] = [];

  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    const current =
      img instanceof HTMLImageElement ? img.currentSrc : '';
    const replacement =
      (src ? substitutions.get(src) : undefined) ??
      (current ? substitutions.get(current) : undefined);
    if (!replacement) return;

    const prevSrc = src;
    const prevCross = img.getAttribute('crossorigin');
    img.removeAttribute('crossorigin');
    img.setAttribute('src', replacement);
    restorers.push(() => {
      if (prevSrc) img.setAttribute('src', prevSrc);
      else img.removeAttribute('src');
      if (prevCross) img.setAttribute('crossorigin', prevCross);
    });
  });

  return () => {
    for (let i = restorers.length - 1; i >= 0; i -= 1) restorers[i]();
  };
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

type PrintAreaInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

function parsePercent(value: string): number | null {
  const match = value.trim().match(/^([-.\d]+)%$/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInsetClipPath(clipPath: string): PrintAreaInsets | null {
  const match = clipPath.match(
    /inset\(\s*([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%\s*\)/i,
  );
  if (!match) return null;

  return {
    top: Number(match[1]),
    right: Number(match[2]),
    bottom: Number(match[3]),
    left: Number(match[4]),
  };
}

function readPrintAreaInsets(el: HTMLElement): PrintAreaInsets | null {
  const insetsAttr = el.getAttribute('data-print-area-insets');
  if (insetsAttr) {
    try {
      const parsed = JSON.parse(insetsAttr) as PrintAreaInsets;
      if (
        Number.isFinite(parsed.top) &&
        Number.isFinite(parsed.right) &&
        Number.isFinite(parsed.bottom) &&
        Number.isFinite(parsed.left)
      ) {
        return parsed;
      }
    } catch {
      // fall through to clip-path parsing
    }
  }

  return parseInsetClipPath(window.getComputedStyle(el).clipPath);
}

function saveInlineStyles(
  el: HTMLElement,
  keys: Array<keyof CSSStyleDeclaration & string>,
): Record<string, string> {
  const saved: Record<string, string> = {};
  for (const key of keys) {
    saved[key] = el.style.getPropertyValue(
      key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`),
    );
  }
  return saved;
}

function restoreInlineStyles(
  el: HTMLElement,
  saved: Record<string, string>,
): void {
  for (const [key, value] of Object.entries(saved)) {
    const cssKey = key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
    if (value) {
      el.style.setProperty(cssKey, value);
    } else {
      el.style.removeProperty(cssKey);
    }
  }
}

/**
 * html2canvas ignores CSS clip-path. Shrink the print-area shell to the
 * printable rect with overflow:hidden and remap overlay % coords so cart
 * previews hide artwork outside the print zone.
 */
function preparePrintAreaClipForCapture(root: HTMLElement): StyleRestorer {
  const restorers: StyleRestorer[] = [];

  root.querySelectorAll<HTMLElement>('[data-print-area-content]').forEach((el) => {
    const insets = readPrintAreaInsets(el);
    if (!insets) return;

    const printW = 100 - insets.left - insets.right;
    const printH = 100 - insets.top - insets.bottom;
    if (printW <= 0 || printH <= 0) return;

    const shellPrev = saveInlineStyles(el, [
      'clipPath',
      'overflow',
      'top',
      'left',
      'right',
      'bottom',
      'width',
      'height',
    ]);

    el.style.clipPath = 'none';
    el.style.overflow = 'hidden';
    el.style.top = `${insets.top}%`;
    el.style.left = `${insets.left}%`;
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.width = `${printW}%`;
    el.style.height = `${printH}%`;

    restorers.push(() => restoreInlineStyles(el, shellPrev));

    for (const child of Array.from(el.children)) {
      if (!(child instanceof HTMLElement)) continue;

      const childPrev = saveInlineStyles(child, ['left', 'top', 'width', 'maxWidth']);
      const left = parsePercent(child.style.left);
      const top = parsePercent(child.style.top);

      if (left !== null) {
        child.style.left = `${((left - insets.left) / printW) * 100}%`;
      }
      if (top !== null) {
        child.style.top = `${((top - insets.top) / printH) * 100}%`;
      }

      const width = parsePercent(child.style.width);
      if (width !== null) {
        child.style.width = `${(width / printW) * 100}%`;
      }

      const maxWidth = parsePercent(child.style.maxWidth);
      if (maxWidth !== null) {
        child.style.maxWidth = `${(maxWidth / printW) * 100}%`;
      }

      restorers.push(() => restoreInlineStyles(child, childPrev));
    }
  });

  return () => {
    for (let i = restorers.length - 1; i >= 0; i -= 1) restorers[i]();
  };
}

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
  const restoreLoading = prepareImagesForCapture(element);
  let restoreFit: StyleRestorer = () => undefined;
  let restorePrintClip: StyleRestorer = () => undefined;
  let restoreLiveImages: StyleRestorer = () => undefined;

  try {
    await waitForPaint();
    await waitForImages(element);

    // After zoom is removed, bake object-fit using the real layout box.
    restoreFit = prepareMockupObjectFit(element);
    await waitForPaint();

    // Full mockup captures need a hard print-area clip; print-PNG captures
    // pass the content node directly and crop separately afterward.
    if (
      element.getAttribute('data-print-area-content') === null &&
      element.querySelector('[data-print-area-content]')
    ) {
      restorePrintClip = preparePrintAreaClipForCapture(element);
      await waitForPaint();
    }

    const imageSubstitutions = await buildImageSubstitutions(element);
    if (imageSubstitutions.size > 0) {
      restoreLiveImages = applyLiveImageSubstitutions(element, imageSubstitutions);
      await waitForPaint();
      await waitForImages(element);
    }

    const html2canvas = await loadHtml2Canvas();
    if (typeof html2canvas !== 'function') return undefined;

    const canvas = await html2canvas(element, {
      backgroundColor: options?.backgroundColor ?? '#ffffff',
      scale: options?.scale ?? 2,
      // Data-URL overlays + same-origin mockups. useCORS:true taints
      // `/_next/image` because the optimizer does not send ACAO headers.
      useCORS: false,
      allowTaint: false,
      logging: false,
      imageTimeout: 15000,
      onclone: (_document, cloneElement) => {
        applyImageSubstitutions(cloneElement, imageSubstitutions);
      },
    });

    if (!canvas.width || !canvas.height) return undefined;

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.warn('[capture-preview] failed', error);
    return undefined;
  } finally {
    restoreLiveImages();
    restorePrintClip();
    restoreFit();
    restoreLoading();
    restoreZoom();
  }
}
