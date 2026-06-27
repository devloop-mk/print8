export type EditorPanel = 'product' | 'text' | 'photo' | 'stickers' | 'design' | null;

export type SelectedElement =
  | 'text'
  | 'photo'
  | 'overlay'
  | `sticker:${string}`
  | null;
