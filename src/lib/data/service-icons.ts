import {
  CreditCard,
  BookOpen,
  Layers,
  Printer,
  Shield,
  Shirt,
  Coffee,
  ShoppingBag,
  BookMarked,
  Heart,
  PartyPopper,
  Gift,
  type LucideIcon,
} from 'lucide-react';

export const serviceIconMap: Record<string, LucideIcon> = {
  CreditCard,
  BookOpen,
  Layers,
  Printer,
  Shield,
  Shirt,
  Coffee,
  ShoppingBag,
  BookMarked,
  Heart,
  PartyPopper,
  Gift,
};

export function getServiceIcon(iconName: string): LucideIcon {
  return serviceIconMap[iconName] ?? Printer;
}
