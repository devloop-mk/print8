import { notFound } from "next/navigation";
import { redirect } from "@/i18n/routing";
import { getService } from "@/lib/data/catalog";
import { getServiceDestination } from "@/lib/data/service-routes";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const service = getService(id);
  if (!service) notFound();

  const destination = getServiceDestination(service);
  if (!destination) notFound();

  redirect({ href: destination, locale });
}
