import { redirect } from 'next/navigation';

/** Alias — register page is the canonical signup URL. */
export default function AccountSignupAliasPage() {
  redirect('/account/register');
}
