import { NextResponse } from 'next/server';
import { getPublishedDesignTemplates } from '@/lib/catalog/design-catalog';
import { CATALOG_CACHE_SECONDS } from '@/lib/cache/catalog-cache';
import { designTemplates } from '@/lib/data/catalog';

const staticIds = new Set(designTemplates.map((design) => design.id));

export async function GET() {
  const published = await getPublishedDesignTemplates();
  const managedOnly = published
    .filter((design) => !staticIds.has(design.id))
    .map((design) => ({
      id: design.id,
      category: design.category,
      kind: design.kind,
      image: design.image,
      tags: design.tags,
      thumbAspect: design.thumbAspect,
      svgTemplateId: design.svgTemplateId,
      layoutId: design.layoutId,
      nameEn: design.nameEn,
      nameMk: design.nameMk,
      exclusive: design.exclusive,
    }));

  return NextResponse.json(
    { designs: managedOnly },
    {
      headers: {
        'Cache-Control': `public, s-maxage=${CATALOG_CACHE_SECONDS}, stale-while-revalidate=${CATALOG_CACHE_SECONDS * 2}`,
      },
    },
  );
}
