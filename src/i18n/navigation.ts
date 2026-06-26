import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export type { Locale } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
