declare module 'page-flip' {
  export class PageFlip {
    constructor(element: HTMLElement, options: Record<string, unknown>);
    loadFromHTML(pages: HTMLElement[] | NodeListOf<HTMLElement>): void;
    destroy(): void;
    update(): void;
    flipNext(): void;
    flipPrev(): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    on(event: string, callback: (e: { data: number }) => void): this;
    off(event: string): void;
  }
}

declare module 'page-flip/dist/js/page-flip.module.js' {
  export { PageFlip } from 'page-flip';
}
