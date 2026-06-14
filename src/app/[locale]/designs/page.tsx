import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { DesignsGallery } from "@/components/designs/DesignsGallery";
import { Button } from "@/components/ui/Button";

export default async function DesignsPage() {
  const t = await getTranslations("designs");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">{t("title")}</h1>
          <p className="mt-2 text-lg text-ink-500">{t("subtitle")}</p>
        </div>
        <Link href="/designs/create">
          <Button size="lg">{t("createOwn")}</Button>
        </Link>
      </div>
      <DesignsGallery />
    </div>
  );
}
