import html2canvas from 'html2canvas';

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

function fixObjectFitImages(sourceRoot: HTMLElement, cloneRoot: HTMLElement): void {
  const sourceImages = sourceRoot.querySelectorAll('img');
  const cloneImages = cloneRoot.querySelectorAll('img');

  cloneImages.forEach((cloneNode, index) => {
    const sourceImg = sourceImages[index];
    if (!(cloneNode instanceof HTMLImageElement)) return;
    if (!(sourceImg instanceof HTMLImageElement)) return;

    const objectFit = window.getComputedStyle(sourceImg).objectFit;
    if (objectFit !== 'contain' && objectFit !== 'cover') return;

    const naturalWidth = sourceImg.naturalWidth;
    const naturalHeight = sourceImg.naturalHeight;
    const containerWidth = sourceImg.clientWidth;
    const containerHeight = sourceImg.clientHeight;
    if (!naturalWidth || !naturalHeight || !containerWidth || !containerHeight) {
      return;
    }

    const scale =
      objectFit === 'contain'
        ? Math.min(
            containerWidth / naturalWidth,
            containerHeight / naturalHeight,
          )
        : Math.max(
            containerWidth / naturalWidth,
            containerHeight / naturalHeight,
          );

    const width = naturalWidth * scale;
    const height = naturalHeight * scale;
    const offsetX = (containerWidth - width) / 2;
    const offsetY = (containerHeight - height) / 2;

    const parent = cloneNode.parentElement;
    if (parent && window.getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }

    cloneNode.style.boxSizing = 'border-box';
    cloneNode.style.width = `${width}px`;
    cloneNode.style.height = `${height}px`;
    cloneNode.style.maxWidth = 'none';
    cloneNode.style.maxHeight = 'none';
    cloneNode.style.objectFit = 'fill';

    if (offsetX > 0.5 || offsetY > 0.5) {
      cloneNode.style.position = 'absolute';
      cloneNode.style.left = `${offsetX}px`;
      cloneNode.style.top = `${offsetY}px`;
    }
  });
}

export async function capturePreviewElement(
  element: HTMLElement,
  options?: { backgroundColor?: string; scale?: number },
): Promise<string | undefined> {
  try {
    await waitForPaint();
    await waitForImages(element);

    const svgSubstitutions = await buildRasterizedSvgSubstitutions(element);

    const canvas = await html2canvas(element, {
      backgroundColor: options?.backgroundColor ?? '#f4f4f5',
      scale: options?.scale ?? 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      imageTimeout: 15000,
      onclone: (_document, cloneElement) => {
        applyImageSubstitutions(cloneElement, svgSubstitutions);
        fixObjectFitImages(element, cloneElement);
      },
    });

    return canvas.toDataURL('image/png');
  } catch {
    return undefined;
  }
}
