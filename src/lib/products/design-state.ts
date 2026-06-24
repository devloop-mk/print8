import type {
  ProductDesignTemplate,
  ProductDesignTextStyle,
} from "@/lib/data/catalog";
import type { PlacedSticker } from "@/lib/products/sticker-library";

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
  isTextTemplate: boolean;
  showPhotoGuide: boolean;
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
    isTextTemplate: false,
    showPhotoGuide: false,
    stickers: [],
  };
}

export function sideDesignFromTextStyle(
  textStyle: ProductDesignTextStyle,
  templateId: string,
): SideDesign {
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
  uploadedFileId: string | null;
  uploadedPreviewUrl: string | null;
  showPhotoGuide: boolean;
  stickers: PlacedSticker[];
}

export function sideDesignFromRestored(data: RestoredSideDesign): SideDesign {
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
  };
}
