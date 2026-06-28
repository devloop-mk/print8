/** Inline SVG symbol markup for business-card contact row icons (viewBox 0 0 24 24). */
export const BCARD_CONTACT_ICON_DEFS = `
  <symbol id="print8-icon-phone" viewBox="0 0 24 24">
    <path fill="currentColor" d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
  </symbol>
  <symbol id="print8-icon-email" viewBox="0 0 24 24">
    <path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
  </symbol>
  <symbol id="print8-icon-web" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 2a10 10 0 100 20 10 10 0 000-20zm9 9h-2.15a15.3 15.3 0 00-1.07-4.58A8.03 8.03 0 0121 11zM12 4c.9 1.5 1.62 3.26 1.88 5H10.1c.26-1.74.98-3.5 1.88-5zM4.26 14a7.9 7.9 0 010-4h2.94a16.5 16.5 0 000 4H4.26zM5.22 6.42A15.3 15.3 0 004.15 11H2a8.03 8.03 0 015.22-4.58zM12 20c-.9-1.5-1.62-3.26-1.88-5h3.78c-.26 1.74-.98 3.5-1.88 5zm4.74-2.42A15.3 15.3 0 0019.85 13H22a8.03 8.03 0 01-5.22 4.58zM13.9 13c.26-1.74.98-3.5 1.88-5H22a8.03 8.03 0 01-5.22 4.58H13.9zm-3.8 0H7.22A8.03 8.03 0 012 11h6.1c.26 1.74.98 3.5 1.88 5H10.1z"/>
  </symbol>
  <symbol id="print8-icon-location" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z"/>
  </symbol>
`;

export function bcardIconUse(
  iconId: 'print8-icon-phone' | 'print8-icon-email' | 'print8-icon-web' | 'print8-icon-location',
  x: number,
  y: number,
  size: number,
  color: string,
) {
  return `<g transform="translate(${x} ${y})" color="${color}"><use href="#${iconId}" width="${size}" height="${size}"/></g>`;
}
