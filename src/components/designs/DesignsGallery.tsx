"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { designTemplates, designCategories } from "@/lib/data/catalog";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Palette } from "lucide-react";
import type { DesignCategory } from "@/lib/data/catalog";

export function DesignsGallery() {
  const t = useTranslations("designs");
  const [category, setCategory] = useState<DesignCategory | "all">("all");

  const filtered =
    category === "all"
      ? designTemplates
      : designTemplates.filter((d) => d.category === category);

  return (
    <>
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            category === "all"
              ? "bg-brand-600 text-white"
              : "bg-ink-100 text-ink-600 hover:bg-ink-200"
          }`}
        >
          {t("allCategories")}
        </button>
        {designCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              category === cat
                ? "bg-brand-600 text-white"
                : "bg-ink-100 text-ink-600 hover:bg-ink-200"
            }`}
          >
            {t(`categories.${cat}`)}
          </button>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((design) => (
          <Card key={design.id} className="overflow-hidden p-0">
            <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-ink-100 to-ink-200">
              <Palette className="h-16 w-16 text-ink-400" />
            </div>
            <div className="p-4">
              <p className="font-medium text-ink-900">
                {t(`categories.${design.category}`)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {design.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-ink-100 px-2 py-0.5 text-xs text-ink-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link href={`/designs/create?template=${design.id}`}>
                <Button size="sm" className="mt-4 w-full">
                  {t("useTemplate")}
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
