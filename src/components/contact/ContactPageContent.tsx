"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

export function ContactPageContent({
  phoneValue,
  emailValue,
  addressValue,
  hoursValue,
}: {
  phoneValue: string;
  emailValue: string;
  addressValue: string;
  hoursValue: string;
}) {
  const t = useTranslations("contact");
  const locale = useLocale();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
    website: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.message,
          website: form.website,
          locale,
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          setError(t("errorRateLimit"));
        } else {
          setError(t("errorGeneric"));
        }
        setSubmitting(false);
        return;
      }

      setSent(true);
    } catch {
      setError(t("errorGeneric"));
      setSubmitting(false);
    }
  }

  const phoneHref = `tel:${phoneValue.replace(/\s+/g, "")}`;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <Card className="flex items-start gap-4">
          <Phone className="mt-1 h-5 w-5 shrink-0 text-brand-600" />
          <div>
            <p className="font-medium text-ink-900">{t("phone")}</p>
            <a
              href={phoneHref}
              className="text-ink-500 transition hover:text-brand-700"
            >
              {phoneValue}
            </a>
          </div>
        </Card>
        <Card className="flex items-start gap-4">
          <Mail className="mt-1 h-5 w-5 shrink-0 text-brand-600" />
          <div>
            <p className="font-medium text-ink-900">{t("email")}</p>
            <a
              href={`mailto:${emailValue}`}
              className="text-ink-500 transition hover:text-brand-700"
            >
              {emailValue}
            </a>
          </div>
        </Card>
        <Card className="flex items-start gap-4">
          <MapPin className="mt-1 h-5 w-5 shrink-0 text-brand-600" />
          <div>
            <p className="font-medium text-ink-900">{t("address")}</p>
            <p className="text-ink-500">{addressValue}</p>
          </div>
        </Card>
        <Card className="flex items-start gap-4">
          <Clock className="mt-1 h-5 w-5 shrink-0 text-brand-600" />
          <div>
            <p className="font-medium text-ink-900">{t("hours")}</p>
            <p className="text-ink-500">{hoursValue}</p>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-6 text-lg font-semibold text-ink-900">{t("formTitle")}</h2>
        {sent ? (
          <p className="text-green-700">{t("sent")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="relative space-y-4">
            {/* Honeypot — hidden from users */}
            <div
              aria-hidden="true"
              className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
            >
              <label htmlFor="contact-website">Website</label>
              <input
                id="contact-website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(e) =>
                  setForm({ ...form, website: e.target.value })
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">
                {t("name")}
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">
                {t("email")}
              </label>
              <input
                type="email"
                required
                maxLength={254}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">
                {t("message")}
              </label>
              <textarea
                required
                minLength={10}
                maxLength={2000}
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
              />
            </div>
            {error ? (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}
            <Button type="submit" loading={submitting} disabled={submitting}>
              {t("send")}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
