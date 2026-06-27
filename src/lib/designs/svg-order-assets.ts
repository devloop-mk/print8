import type { SvgDesignTemplate, SvgTemplateState } from '@/lib/data/svg-design-templates';
import { embedSvgExternalImages } from '@/lib/designs/svg-background-assets';
import { fetchRenderedSvg } from '@/lib/designs/svg-template-engine';
import { svgStringToPngDataUrl } from '@/lib/designs/svg-rasterize';

export type SvgSideAssets = {
  svg: string;
  pngDataUrl: string;
};

export type SvgTemplateOrderAssets = {
  front: SvgSideAssets;
  back?: SvgSideAssets;
};

export async function captureSvgTemplateOrderAssets(
  template: SvgDesignTemplate,
  state: SvgTemplateState,
): Promise<SvgTemplateOrderAssets> {
  const backgroundColor = state.colors.background ?? '#ffffff';

  const frontSvg = await embedSvgExternalImages(
    await fetchRenderedSvg(template.sides.front.path, template, state, 'front'),
  );
  const front: SvgSideAssets = {
    svg: frontSvg,
    pngDataUrl: await svgStringToPngDataUrl(frontSvg, {
      scale: 2,
      backgroundColor,
    }),
  };

  if (!template.sides.back) {
    return { front };
  }

  const backSvg = await embedSvgExternalImages(
    await fetchRenderedSvg(template.sides.back.path, template, state, 'back'),
  );

  return {
    front,
    back: {
      svg: backSvg,
      pngDataUrl: await svgStringToPngDataUrl(backSvg, {
        scale: 2,
        backgroundColor,
      }),
    },
  };
}

export type SvgPrintFile = {
  side: 'front' | 'back';
  svg: string;
  filename: string;
};

export function getSvgPrintFilesFromMetadata(
  metadata: Record<string, string | number | boolean> | undefined,
  itemName: string,
): SvgPrintFile[] {
  if (!metadata || metadata.orderType !== 'svg-template') return [];

  const safeName = itemName.replace(/[^\w\s-]/g, '').trim().slice(0, 40) || 'design';
  const files: SvgPrintFile[] = [];

  const front = metadata.svgFrontContent;
  if (typeof front === 'string' && front.trim()) {
    files.push({
      side: 'front',
      svg: front,
      filename: `${safeName}-front-print.svg`,
    });
  }

  const back = metadata.svgBackContent;
  if (typeof back === 'string' && back.trim()) {
    files.push({
      side: 'back',
      svg: back,
      filename: `${safeName}-back-print.svg`,
    });
  }

  return files;
}

export function buildSvgMetadataFields(
  assets: SvgTemplateOrderAssets,
  template: SvgDesignTemplate,
) {
  return {
    svgFrontContent: assets.front.svg,
    ...(assets.back ? { svgBackContent: assets.back.svg } : {}),
    previewAspectRatio: template.aspectRatio,
  };
}
