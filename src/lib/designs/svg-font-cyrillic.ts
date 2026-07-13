const SVG_NS = 'http://www.w3.org/2000/svg';



/** Curated Google Fonts bundle with native Cyrillic coverage for design templates. */
export const CYRILLIC_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Bad+Script&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Literata:ital,wght@0,400;0,600;1,400&family=Manrope:wght@400;600;700;800&family=Marck+Script&family=Montserrat:wght@300;400;600;700&family=Noto+Sans:wght@300;400;600;700&family=Noto+Serif:ital,wght@0,400;0,600;1,400&family=PT+Sans:wght@400;700&family=PT+Serif:ital,wght@0,400;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap';

export const CYRILLIC_SUPPORT_IMPORT = `@import url('${CYRILLIC_FONTS_URL}');`;



const CYRILLIC_IMPORT_MARKER = 'family=Manrope';



const LATIN_ONLY_SCRIPT_FONTS =

  /Great Vibes|Alex Brush|Italianno|Tangerine|Pinyon Script|Dancing Script|Allura|Sacramento|Parisienne/i;



const LATIN_ONLY_DISPLAY_FONTS =

  /Rye|Fredoka One|Paytone One|Righteous|Cinzel Decorative/i;



const SANS_FONTS =

  /Montserrat|Inter|Lato|Open Sans|Nunito|Quicksand|Raleway|Roboto|Segoe UI/i;



const SERIF_FONTS =

  /Playfair Display|Cormorant|Cinzel|Literata|PT Serif|Times New Roman/i;



const CYRILLIC_SCRIPT_STACK = "'Marck Script', 'Bad Script', cursive";

const CYRILLIC_SANS_STACK = "'Manrope', 'PT Sans', 'Noto Sans', sans-serif";

const CYRILLIC_SERIF_STACK =

  "'Cormorant Garamond', 'Literata', 'PT Serif', 'Noto Serif', serif";



export function augmentFontFamilyForCyrillic(fontFamily: string): string {

  const normalized = fontFamily.trim();

  if (!normalized) return CYRILLIC_SANS_STACK;



  if (LATIN_ONLY_SCRIPT_FONTS.test(normalized)) {

    return `${normalized}, ${CYRILLIC_SCRIPT_STACK}`;

  }



  if (LATIN_ONLY_DISPLAY_FONTS.test(normalized)) {

    return `${normalized}, ${CYRILLIC_SANS_STACK}`;

  }



  if (SANS_FONTS.test(normalized) && !/Manrope|PT Sans|Noto Sans/i.test(normalized)) {

    return `${normalized}, ${CYRILLIC_SANS_STACK}`;

  }



  if (SERIF_FONTS.test(normalized) && !/Cormorant|Literata|PT Serif|Noto Serif/i.test(normalized)) {

    return `${normalized}, ${CYRILLIC_SERIF_STACK}`;

  }



  if (/Times New Roman/i.test(normalized)) {

    return `${normalized}, ${CYRILLIC_SERIF_STACK}`;

  }



  return normalized;

}



export function applySvgCyrillicFontSupport(doc: Document) {

  const root = doc.documentElement;

  let defs = root.querySelector('defs');



  if (!defs) {

    defs = doc.createElementNS(SVG_NS, 'defs');

    root.insertBefore(defs, root.firstChild);

  }



  let styleEl = defs.querySelector('style') as SVGStyleElement | null;

  if (!styleEl) {

    styleEl = doc.createElementNS(SVG_NS, 'style');

    defs.insertBefore(styleEl, defs.firstChild);

  }



  const existing = styleEl.textContent ?? '';

  if (!existing.includes(CYRILLIC_IMPORT_MARKER)) {

    styleEl.textContent = `${CYRILLIC_SUPPORT_IMPORT}\n${existing}`.trim();

  }



  doc.querySelectorAll('text').forEach((node) => {

    const family = node.getAttribute('font-family');

    if (!family) return;

    const augmented = augmentFontFamilyForCyrillic(family);

    if (augmented !== family) {

      node.setAttribute('font-family', augmented);

    }

  });



  const rootFamily = root.getAttribute('style');

  if (rootFamily?.includes('font-family')) {

    const match = rootFamily.match(/font-family:\s*([^;]+)/i);

    if (match?.[1]) {

      const augmented = augmentFontFamilyForCyrillic(match[1].trim());

      root.setAttribute(

        'style',

        rootFamily.replace(match[0], `font-family: ${augmented}`),

      );

    }

  }

}


