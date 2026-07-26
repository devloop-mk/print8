import { getSupabaseAdmin } from '@/lib/supabase/client';

export type CustomerSignInMethods = {
  google: boolean;
  email: boolean;
};

export async function getCustomerSignInMethods(
  customerId: string,
): Promise<CustomerSignInMethods> {
  const { data, error } = await getSupabaseAdmin().auth.admin.getUserById(customerId);

  if (error || !data.user) {
    return { google: false, email: false };
  }

  const providers = new Set(
    data.user.identities?.map((identity) => identity.provider) ?? [],
  );

  return {
    google: providers.has('google'),
    email: providers.has('email'),
  };
}
