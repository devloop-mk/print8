import { buildSearchVariants } from '@/lib/catalog/transliterate';

const SEARCH_STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'for',
  'to',
  'in',
  'on',
  'of',
  'with',
  'za',
  'na',
  'vo',
  'od',
  'do',
  'so',
  'i',
  'ili',
  'ke',
  'ni',
  'se',
  'gi',
]);

function expandHaystack(value: string): string[] {
  return buildSearchVariants(value);
}

export function tokenizeSearchQuery(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 0 && !SEARCH_STOP_WORDS.has(token));
}

export function matchesCatalogSearch(haystack: string, query: string): boolean {
  const tokens = tokenizeSearchQuery(query);
  if (tokens.length === 0) return true;

  const haystackVariants = expandHaystack(haystack);

  return tokens.every((token) => {
    const tokenVariants = buildSearchVariants(token);
    return haystackVariants.some((haystackValue) =>
      tokenVariants.some((tokenValue) => haystackValue.includes(tokenValue)),
    );
  });
}
