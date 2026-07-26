export type EditorPanel = 'product' | 'text' | 'photo' | 'stickers' | 'design' | null;

export type SelectedElement =
  | `text:${string}`
  | `photo:${string}`
  | 'overlay'
  | `sticker:${string}`
  | null;
