export type LogoVariant = 'dark' | 'light' | 'white';

export type LogoPlacement = {
  logo: LogoVariant;
  cx: number;
  cy: number;
  widthFrac: number;
  angle: number;
};

export const DEFAULT_PLACEMENT: LogoPlacement = {
  logo: 'dark',
  cx: 0.5,
  cy: 0.46,
  widthFrac: 0.28,
  angle: 0,
};
