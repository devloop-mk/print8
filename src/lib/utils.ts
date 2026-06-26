import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, locale: string): string {
  // Use a fixed number format — Node and browsers disagree on MKD currency
  // strings for mk-MK, which causes hydration mismatches in client components.
  const value = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount);

  return locale === "mk" ? `${value} ден.` : `MKD ${value}`;
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `P8-${year}-${random}`;
}
