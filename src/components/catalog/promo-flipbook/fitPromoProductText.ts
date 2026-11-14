const TITLE_MIN_PX = 11;
const SPEC_MIN_PX = 10;

function shrinkToFit(el: HTMLElement, minPx: number) {
  if (el.clientHeight <= 0) return;

  el.style.fontSize = '';
  const start = parseFloat(getComputedStyle(el).fontSize);
  if (!Number.isFinite(start)) return;

  const fits = () => el.scrollHeight <= el.clientHeight + 0.75;
  if (fits()) return;

  let size = start;
  while (size > minPx && !fits()) {
    size -= 0.35;
    el.style.fontSize = `${size}px`;
  }
}

export function fitPromoProductText(root: ParentNode) {
  root
    .querySelectorAll<HTMLElement>('.promo-product-title')
    .forEach((el) => shrinkToFit(el, TITLE_MIN_PX));
  root
    .querySelectorAll<HTMLElement>('.promo-product-specs')
    .forEach((el) => shrinkToFit(el, SPEC_MIN_PX));
}
