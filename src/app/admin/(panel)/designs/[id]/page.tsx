import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdminSession } from '@/lib/admin/require-admin';
import { resolveAdminDesign } from '@/lib/admin/designs';
import { DesignEditorForm } from '@/components/admin/DesignEditorForm';
import { SvgTemplateDefaultsForm } from '@/components/admin/SvgTemplateDefaultsForm';
import { ImportStaticDesignButton } from '@/components/admin/ImportStaticDesignButton';

export default async function AdminDesignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSession();
  const { id } = await params;
  const design = await resolveAdminDesign(id);
  if (!design) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/designs"
          className="text-sm font-medium text-ink-600 hover:text-brand-700"
        >
          ← Назад кон дизајни
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-ink-900">
          {design.displayNameMk}
        </h1>
        <p className="mt-1 text-sm text-ink-500">{design.id}</p>
      </div>

      {design.svgTemplate ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-ink-900">
              Стандардни вредности (SVG)
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Текст, бои и позиција што корисникот ги гледа при прво отворање на
              персонализаторот.
            </p>
          </div>
          <SvgTemplateDefaultsForm
            designId={design.id}
            svgTemplate={design.svgTemplate}
            initialDefaults={design.svgDefaults}
          />
        </section>
      ) : null}

      {design.managed ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-ink-900">Каталог метаподатоци</h2>
            <p className="mt-1 text-sm text-ink-500">
              Име, цена, видливост и ексклузивност (запис во база).
            </p>
          </div>
          <DesignEditorForm design={design.managed} />
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-ink-200 bg-ink-50 p-5 text-sm text-ink-600">
          <p>
            Овој дизајн постои само во кодот. Можете да ги менувате стандардните SVG
            вредности погоре. За цена, видливост или ексклузивност, прво додајте го
            во база.
          </p>
          <div className="mt-4">
            <ImportStaticDesignButton designId={design.id} />
          </div>
        </section>
      )}
    </div>
  );
}
