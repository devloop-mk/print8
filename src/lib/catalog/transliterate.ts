const LATIN_DIGRAPHS_TO_CYRILLIC: [string, string][] = [
  ['dzh', 'џ'],
  ['gj', 'ѓ'],
  ['kj', 'ќ'],
  ['lj', 'љ'],
  ['nj', 'њ'],
  ['dz', 'ѕ'],
  ['ch', 'ч'],
  ['sh', 'ш'],
  ['zh', 'ж'],
];

const LATIN_TO_CYRILLIC: Record<string, string> = {
  a: 'а',
  b: 'б',
  c: 'ц',
  d: 'д',
  e: 'е',
  f: 'ф',
  g: 'г',
  h: 'х',
  i: 'и',
  j: 'ј',
  k: 'к',
  l: 'л',
  m: 'м',
  n: 'н',
  o: 'о',
  p: 'п',
  r: 'р',
  s: 'с',
  t: 'т',
  u: 'у',
  v: 'в',
  w: 'в',
  x: 'кс',
  y: 'ј',
  z: 'з',
};

const CYRILLIC_DIGRAPHS_TO_LATIN: [string, string][] = [
  ['џ', 'dzh'],
  ['ѓ', 'gj'],
  ['ќ', 'kj'],
  ['љ', 'lj'],
  ['њ', 'nj'],
  ['ѕ', 'dz'],
  ['ч', 'ch'],
  ['ш', 'sh'],
  ['ж', 'zh'],
];

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ж: 'zh',
  з: 'z',
  ѕ: 'dz',
  и: 'i',
  ј: 'j',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'c',
  ч: 'ch',
  ш: 'sh',
  ѓ: 'gj',
  ќ: 'kj',
  љ: 'lj',
  њ: 'nj',
  џ: 'dzh',
};

export function latinToCyrillicMk(value: string): string {
  let result = '';
  let index = 0;
  const lower = value.toLowerCase();

  while (index < lower.length) {
    let matched = false;
    for (const [latin, cyrillic] of LATIN_DIGRAPHS_TO_CYRILLIC) {
      if (lower.startsWith(latin, index)) {
        result += cyrillic;
        index += latin.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const char = lower[index] ?? '';
    result += LATIN_TO_CYRILLIC[char] ?? char;
    index += 1;
  }

  return result;
}

export function cyrillicToLatinMk(value: string): string {
  let result = '';
  let index = 0;
  const lower = value.toLowerCase();

  while (index < lower.length) {
    let matched = false;
    for (const [cyrillic, latin] of CYRILLIC_DIGRAPHS_TO_LATIN) {
      if (lower.startsWith(cyrillic, index)) {
        result += latin;
        index += cyrillic.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const char = lower[index] ?? '';
    result += CYRILLIC_TO_LATIN[char] ?? char;
    index += 1;
  }

  return result;
}

/** Build normalized search variants (original, latin, cyrillic). */
export function buildSearchVariants(value: string): string[] {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return [];

  const variants = new Set<string>([trimmed]);
  variants.add(latinToCyrillicMk(trimmed));
  variants.add(cyrillicToLatinMk(trimmed));
  return [...variants].filter(Boolean);
}
