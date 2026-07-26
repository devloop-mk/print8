export type OrderPreviewEmbed = {
  contentId: string;
  itemIndex: number;
  label: string;
  filename: string;
  content: Buffer;
  contentType: string;
  sourceSrc?: string;
  imageUrl?: string;
};
