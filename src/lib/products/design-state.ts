import type {
  Product,
  ProductDesignSideOverlay,
  ProductDesignTemplate,
  ProductDesignTextStyle,
  ProductSide,
} from "@/lib/data/catalog";
import { getProductDesignTemplate } from "@/lib/data/catalog";
import type { PlacedSticker } from "@/lib/products/sticker-library";
import type { PlacedTextLayer } from "@/lib/products/text-layers";
import { createPlacedTextLayer } from "@/lib/products/text-layers";
import {
  ensureInkContrast,
  getDesignCompositeOverlayUrl,
  resolveComposableOverlayUrl,
  resolveSideOverlayPlacement,
  type OverlaySvgColors,
} from "@/lib/products/design-overlay";
import {
  getDesignSides,
  resolveSideOverlayConfig,
  sideHasPremadeArt,
} from "@/lib/products/design-sides";

export interface UploadedFile {
  fileId: string;
  name: string;
  previewUrl?: string;
  isImage?: boolean;
}

export interface SideDesign {
  customText: string;
  customTextColor: string;
  customTextSize: number;
  customTextPosition: { x: number; y: number };
  customTextFontWeight: number;
  customTextLetterSpacing: string;
  customTextLineHeight: number;
  customTextShadow: string;
  uploadedFile: UploadedFile | null;
  uploadedImageScale: number;
  uploadedImagePosition: { x: number; y: number };
  premadeDesignImage: string | null;
  premadeDesignId: string | null;
  overlaySvg: string | null;
  overlaySvgColors: OverlaySvgColors | null;
  overlayColorVariants: Record<string, string> | null;
  overlayRaster: string | null;
  isRecolorableOverlay: boolean;
  /**
   * Full-garment marketing mockup (streetwear webp) used when print masters
   * are not available on the host (production without CDN).
   */
  bakedMockupUrl: string | null;
  isTextTemplate: boolean;
  showPhotoGuide: boolean;
  textLayers: PlacedTextLayer[];
  stickers: PlacedSticker[];
}

export const DEFAULT_TEXT_SHADOW =
  "0 1px 2px rgba(255,255,255,0.9), 0 2px 8px rgba(0,0,0,0.15)";

export function createDefaultSideDesign(): SideDesign {
  return {
    customText: "",
    customTextColor: "#1e3a5f",
    customTextSize: 18,
    customTextPosition: { x: 50, y: 25 },
    customTextFontWeight: 700,
    customTextLetterSpacing: "0.02em",
    customTextLineHeight: 1.2,
    customTextShadow: DEFAULT_TEXT_SHADOW,
    uploadedFile: null,
    uploadedImageScale: 40,
    uploadedImagePosition: { x: 50, y: 48 },
    premadeDesignImage: null,
    premadeDesignId: null,
    overlaySvg: null,
    overlaySvgColors: null,
    overlayColorVariants: null,
    overlayRaster: null,
    isRecolorableOverlay: false,
    bakedMockupUrl: null,
    isTextTemplate: false,
    showPhotoGuide: false,
    textLayers: [],
    stickers: [],
  };
}

/** Clear uploaded / premade / overlay artwork while keeping text & stickers. */
export function clearSideDesignArtwork(): Partial<SideDesign> {
  const defaults = createDefaultSideDesign();
  return {
    uploadedFile: null,
    premadeDesignImage: null,
    premadeDesignId: null,
    overlaySvg: null,
    overlaySvgColors: null,
    overlayColorVariants: null,
    overlayRaster: null,
    isRecolorableOverlay: false,
    bakedMockupUrl: null,
    isTextTemplate: false,
    showPhotoGuide: false,
    uploadedImageScale: defaults.uploadedImageScale,
    uploadedImagePosition: defaults.uploadedImagePosition,
  };
}

export function sideDesignFromTextStyle(
  textStyle: ProductDesignTextStyle,
  templateId: string,
): SideDesign {
  const layer = createPlacedTextLayer(0, {
    instanceId: `${templateId}-text`,
    text: textStyle.text,
    color: textStyle.textColor,
    size: textStyle.textSize,
    position: textStyle.textPosition,
    fontWeight: textStyle.fontWeight ?? 700,
    letterSpacing: textStyle.letterSpacing ?? "0.02em",
    lineHeight: textStyle.lineHeight ?? 1.2,
    textShadow: textStyle.textShadow ?? DEFAULT_TEXT_SHADOW,
  });

  return {
    ...createDefaultSideDesign(),
    customText: textStyle.text,
    customTextColor: textStyle.textColor,
    customTextSize: textStyle.textSize,
    customTextPosition: textStyle.textPosition,
    customTextFontWeight: textStyle.fontWeight ?? 700,
    customTextLetterSpacing: textStyle.letterSpacing ?? "0.02em",
    customTextLineHeight: textStyle.lineHeight ?? 1.2,
    customTextShadow: textStyle.textShadow ?? DEFAULT_TEXT_SHADOW,
    textLayers: [layer],
    uploadedImagePosition:
      textStyle.photoPosition ?? createDefaultSideDesign().uploadedImagePosition,
    uploadedImageScale: textStyle.photoScale ?? 40,
    premadeDesignId: templateId,
    isTextTemplate: true,
    showPhotoGuide: false,
  };
}

export function sideDesignFromTextTemplate(
  template: ProductDesignTemplate,
): SideDesign | null {
  if (template.kind !== "text" || !template.textStyle) return null;
  return sideDesignFromTextStyle(template.textStyle, template.id);
}

export function sideDesignFromImageTemplate(
  template: ProductDesignTemplate,
): SideDesign | null {
  if (template.kind !== "image" || !template.image) return null;
  return {
    ...createDefaultSideDesign(),
    premadeDesignImage: template.image,
    premadeDesignId: template.id,
    isTextTemplate: false,
    showPhotoGuide: false,
  };
}

export function sideDesignFromOverlaySideConfig(
  template: ProductDesignTemplate,
  config: ProductDesignSideOverlay,
  product: Product,
  shirtColor?: string,
): SideDesign | null {
  const placement = resolveSideOverlayPlacement(
    config,
    product,
    template.productTypes,
  );

  const base = {
    ...createDefaultSideDesign(),
    uploadedImageScale: placement.scale,
    uploadedImagePosition: placement.position,
    premadeDesignId: template.id,
    isTextTemplate: false,
    showPhotoGuide: false,
  };

  if (config.overlaySvg && config.overlayRecolor) {
    const primary = shirtColor
      ? ensureInkContrast(config.overlayRecolor.primary, shirtColor)
      : config.overlayRecolor.primary;
    const secondary = config.overlayRecolor.secondary
      ? shirtColor
        ? ensureInkContrast(config.overlayRecolor.secondary, shirtColor)
        : config.overlayRecolor.secondary
      : undefined;

    return {
      ...base,
      overlaySvg: config.overlaySvg,
      overlaySvgColors: { primary, secondary },
      isRecolorableOverlay: true,
    };
  }

  if (config.overlayColorVariants) {
    const compositeOverlay = getDesignCompositeOverlayUrl({
      printMasterImage: template.printMasterImage,
      overlayImage: config.overlayImage,
      overlaySvg: config.overlaySvg,
    });
    if (!compositeOverlay) return null;
    return {
      ...base,
      overlayColorVariants: config.overlayColorVariants,
      overlayRaster: compositeOverlay,
      isRecolorableOverlay: false,
    };
  }

  const compositeOverlay = getDesignCompositeOverlayUrl({
    printMasterImage: template.printMasterImage,
    overlayImage: config.overlayImage,
    overlaySvg: config.overlaySvg,
  });
  if (!compositeOverlay) return null;

  return {
    ...base,
    uploadedFile: {
      fileId: "",
      name: `${template.id}.png`,
      previewUrl: compositeOverlay,
      isImage: true,
    },
    overlayRaster: compositeOverlay,
    isRecolorableOverlay: false,
  };
}

export function sideDesignFromOverlayTemplate(
  template: ProductDesignTemplate,
  product: Product,
  shirtColor?: string,
  side?: ProductSide,
): SideDesign | null {
  if (template.kind !== "overlay") return null;

  const targetSide = side ?? template.defaultSide;
  const config = resolveSideOverlayConfig(template, targetSide);
  if (!config) return null;

  return sideDesignFromOverlaySideConfig(template, config, product, shirtColor);
}

export function sideDesignsFromTemplate(
  template: ProductDesignTemplate,
  product: Product,
  shirtColor?: string,
): Partial<Record<ProductSide, SideDesign>> {
  const result: Partial<Record<ProductSide, SideDesign>> = {};

  if (template.kind === "text") {
    const textDesign = sideDesignFromTextTemplate(template);
    if (textDesign) {
      result[template.defaultSide] = textDesign;
    }
    return result;
  }

  if (template.kind === "image") {
    const imageDesign = sideDesignFromImageTemplate(template);
    if (imageDesign) {
      result[template.defaultSide] = imageDesign;
    }
    return result;
  }

  if (template.kind === "overlay") {
    for (const side of getDesignSides(template)) {
      if (!sideHasPremadeArt(template, side)) continue;
      const design = sideDesignFromOverlayTemplate(
        template,
        product,
        shirtColor,
        side,
      );
      if (design) result[side] = design;
    }
  }

  return result;
}

export interface RestoredSideDesign {
  customText: string;
  customTextColor: string;
  customTextSize: number;
  customTextPosition: { x: number; y: number };
  customTextFontWeight: number;
  customTextLetterSpacing: string;
  customTextLineHeight: number;
  customTextShadow: string;
  isTextTemplate: boolean;
  uploadedImageScale: number;
  uploadedImagePosition: { x: number; y: number };
  premadeDesignImage: string | null;
  premadeDesignId: string | null;
  overlaySvg: string | null;
  overlaySvgPrimary: string | null;
  overlaySvgSecondary: string | null;
  overlayColorVariants: Record<string, string> | null;
  overlayRaster: string | null;
  isRecolorableOverlay: boolean;
  uploadedFileId: string | null;
  uploadedPreviewUrl: string | null;
  showPhotoGuide: boolean;
  textLayers: PlacedTextLayer[];
  stickers: PlacedSticker[];
}

export function sideDesignFromRestored(data: RestoredSideDesign): SideDesign {
  const template = data.premadeDesignId
    ? getProductDesignTemplate(data.premadeDesignId)
    : null;

  return {
    ...createDefaultSideDesign(),
    customText: data.customText,
    customTextColor: data.customTextColor,
    customTextSize: data.customTextSize,
    customTextPosition: data.customTextPosition,
    customTextFontWeight: data.customTextFontWeight,
    customTextLetterSpacing: data.customTextLetterSpacing,
    customTextLineHeight: data.customTextLineHeight,
    customTextShadow: data.customTextShadow,
    uploadedImageScale: data.uploadedImageScale,
    uploadedImagePosition: data.uploadedImagePosition,
    premadeDesignImage: data.premadeDesignImage,
    premadeDesignId: data.premadeDesignId,
    overlaySvg: data.overlaySvg ?? template?.overlaySvg ?? null,
    overlaySvgColors:
      data.overlaySvgPrimary
        ? {
            primary: data.overlaySvgPrimary,
            secondary: data.overlaySvgSecondary ?? undefined,
          }
        : template?.overlayRecolor
          ? {
              primary: template.overlayRecolor.primary,
              secondary: template.overlayRecolor.secondary,
            }
          : null,
    overlayColorVariants: template?.overlayColorVariants ?? null,
    overlayRaster:
      resolveComposableOverlayUrl(data.overlayRaster) ??
      (template ? getDesignCompositeOverlayUrl(template) : null),
    isRecolorableOverlay:
      data.isRecolorableOverlay || Boolean(template?.overlayRecolor),
    bakedMockupUrl: null,
    isTextTemplate: data.isTextTemplate,
    showPhotoGuide: data.showPhotoGuide,
    uploadedFile:
      data.uploadedPreviewUrl || data.uploadedFileId
        ? {
            fileId: data.uploadedFileId ?? "",
            name: "uploaded-image",
            previewUrl: data.uploadedPreviewUrl ?? undefined,
            isImage: true,
          }
        : null,
    stickers: data.stickers,
    textLayers: data.textLayers,
  };
}
