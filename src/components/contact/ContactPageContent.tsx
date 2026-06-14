"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

export function ContactPageContent() {
  const t = useTranslations("contact");
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <Card className="flex items-start gap-4">
          <Phone className="mt-1 h-5 w-5 shrink-0 text-brand-600" />
          <div>
            <p className="font-medium text-ink-900">{t("phone")}</p>
            <p className="text-ink-500">{t("phoneValue")}</p>
          </div>
        </Card>
        <Card className="flex items-start gap-4">
          <Mail className="mt-1 h-5 w-5 shrink-0 text-brand-600" />
          <div>
            <p className="font-medium text-ink-900">{t("email")}</p>
            <p className="text-ink-500">{t("emailValue")}</p>
          </div>
        </Card>
        <Card className="flex items-start gap-4">
          <MapPin className="mt-1 h-5 w-5 shrink-0 text-brand-600" />
          <div>
            <p className="font-medium text-ink-900">{t("address")}</p>
            <p className="text-ink-500">{t("addressValue")}</p>
          </div>
        </Card>
        <Card className="flex items-start gap-4">
          <Clock className="mt-1 h-5 w-5 shrink-0 text-brand-600" />
          <div>
            <p className="font-medium text-ink-900">{t("hours")}</p>
            <p className="text-ink-500">{t("hoursValue")}</p>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-6 text-lg font-semibold text-ink-900">{t("formTitle")}</h2>
        {sent ? (
          <p className="text-green-600">{t("sent")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">
                {t("name")}
              </label>
              <input
                type="text"
                required
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
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
              />
            </div>
            <Button type="submit">{t("send")}</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
