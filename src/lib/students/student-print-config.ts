import { MAX_FILE_SIZE } from '@/lib/upload/constants';

export const STUDENT_PRINT_MAX_FILE_SIZE = MAX_FILE_SIZE;

export const STUDENT_PRINT_SERVICE_TYPES = [
  'book',
  'script',
  'seminar',
  'thesis',
] as const;

export type StudentPrintServiceType = (typeof STUDENT_PRINT_SERVICE_TYPES)[number];

export const STUDENT_PRINT_BINDING_TYPES = ['metal-spiral', 'plastic-spiral'] as const;

export type StudentPrintBindingType = (typeof STUDENT_PRINT_BINDING_TYPES)[number];

export const STUDENT_PRINT_FRONT_COVER_COLORS = [
  'black',
  'white',
  'navy',
  'blue',
  'red',
  'clear',
] as const;

export type StudentPrintFrontCoverColor =
  (typeof STUDENT_PRINT_FRONT_COVER_COLORS)[number];

export const STUDENT_PRINT_BACK_COVER_COLORS = [
  'black',
  'brown',
  'burgundy',
  'navy',
] as const;

export type StudentPrintBackCoverColor =
  (typeof STUDENT_PRINT_BACK_COVER_COLORS)[number];

export interface StudentPrintServiceOption {
  id: StudentPrintServiceType;
  catalogServiceId: string;
  basePrice: number;
  pricePerPage: number;
}

export const STUDENT_PRINT_SERVICES: StudentPrintServiceOption[] = [
  {
    id: 'book',
    catalogServiceId: 'bookbinding',
    basePrice: 400,
    pricePerPage: 3,
  },
  {
    id: 'script',
    catalogServiceId: 'color-bw-printing',
    basePrice: 50,
    pricePerPage: 2,
  },
  {
    id: 'seminar',
    catalogServiceId: 'bookbinding',
    basePrice: 300,
    pricePerPage: 3,
  },
  {
    id: 'thesis',
    catalogServiceId: 'thesis-hardcover',
    basePrice: 1500,
    pricePerPage: 5,
  },
];

export const STUDENT_PRINT_COVER_SWATCHES: Record<
  StudentPrintFrontCoverColor | StudentPrintBackCoverColor,
  string
> = {
  black: '#1a1a1a',
  white: '#f5f5f5',
  navy: '#1e3a5f',
  blue: '#2563eb',
  red: '#dc2626',
  clear: 'linear-gradient(135deg, #e2e8f0 50%, transparent 50%)',
  brown: '#78350f',
  burgundy: '#7f1d1d',
};

export const STUDENT_PRINT_ORDER_TYPE = 'student-print-order';

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
