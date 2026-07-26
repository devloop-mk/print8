import { redirect } from '@/i18n/navigation';

/** Alias — register page is the canonical signup URL. */
export default async function AccountSignupAliasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: '/account/register', locale });
}
