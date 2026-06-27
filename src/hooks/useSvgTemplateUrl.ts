'use client';

import { useEffect, useState } from 'react';
import type { SvgDesignTemplate, SvgTemplateState } from '@/lib/data/svg-design-templates';
import { fetchRenderedSvg } from '@/lib/designs/svg-template-engine';

export function useRenderedSvgTemplate(
  template: SvgDesignTemplate,
  state: SvgTemplateState,
  side: 'front' | 'back',
): string | null {
  const [markup, setMarkup] = useState<string | null>(null);
  const path =
    side === 'front' ? template.sides.front.path : template.sides.back?.path;
  const stateKey = JSON.stringify(state);

  useEffect(() => {
    if (!path) {
      setMarkup(null);
      return;
    }

    let cancelled = false;

    fetchRenderedSvg(path, template, state, side).then((svg) => {
      if (!cancelled) setMarkup(svg);
    });

    return () => {
      cancelled = true;
    };
  }, [path, template, stateKey, side]);

  return markup;
}

/** @deprecated Use useRenderedSvgTemplate — blob img URLs cannot load external SVG images. */
export function useSvgTemplateUrl(
  template: SvgDesignTemplate,
  state: SvgTemplateState,
  side: 'front' | 'back',
): string | null {
  return useRenderedSvgTemplate(template, state, side);
}
