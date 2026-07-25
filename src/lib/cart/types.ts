export type CartItemType = 'service' | 'design' | 'product';

export interface CartItem {
  id: string;
  type: CartItemType;
  name: string;
  price: number;
  quantity: number;
  metadata?: Record<string, string | number | boolean>;
  designPreview?: string;
  backDesignPreview?: string;
  leftDesignPreview?: string;
  rightDesignPreview?: string;
  frontPrintPng?: string;
  backPrintPng?: string;
  leftPrintPng?: string;
  rightPrintPng?: string;
  fileIds?: string[];
}
