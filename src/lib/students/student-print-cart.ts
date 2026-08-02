import type { CartItem } from '@/lib/cart/types';
import {
  STUDENT_PRINT_BINDING_TYPES,
  STUDENT_PRINT_ORDER_TYPE,
  STUDENT_PRINT_SERVICE_TYPES,
  type StudentPrintBackCoverColor,
  type StudentPrintBindingType,
  type StudentPrintFrontCoverColor,
  type StudentPrintServiceType,
} from '@/lib/students/student-print-config';

export interface StudentPrintCartDetails {
  serviceType: StudentPrintServiceType;
  fileName: string;
  pageCount: number;
  fileSize?: number;
  bindingType: StudentPrintBindingType;
  frontCoverColor: StudentPrintFrontCoverColor;
  backCoverColor: StudentPrintBackCoverColor;
}

function isServiceType(value: unknown): value is StudentPrintServiceType {
  return (
    typeof value === 'string' &&
    (STUDENT_PRINT_SERVICE_TYPES as readonly string[]).includes(value)
  );
}

function isBindingType(value: unknown): value is StudentPrintBindingType {
  return (
    typeof value === 'string' &&
    (STUDENT_PRINT_BINDING_TYPES as readonly string[]).includes(value)
  );
}

function isCoverColor(
  value: unknown,
): value is StudentPrintFrontCoverColor | StudentPrintBackCoverColor {
  return typeof value === 'string' && value.length > 0;
}

export function isStudentPrintCartItem(item: CartItem): boolean {
  return item.metadata?.orderType === STUDENT_PRINT_ORDER_TYPE;
}

export function getStudentPrintCartDetails(
  item: CartItem,
): StudentPrintCartDetails | null {
  if (!isStudentPrintCartItem(item)) return null;

  const metadata = item.metadata;
  if (!metadata) return null;

  const serviceType = metadata.serviceType;
  const fileName = metadata.fileName;
  const pageCount = metadata.pageCount;
  const bindingType = metadata.bindingType;
  const frontCoverColor = metadata.frontCoverColor;
  const backCoverColor = metadata.backCoverColor;

  if (
    !isServiceType(serviceType) ||
    typeof fileName !== 'string' ||
    !fileName ||
    typeof pageCount !== 'number' ||
    pageCount < 1 ||
    !isBindingType(bindingType) ||
    !isCoverColor(frontCoverColor) ||
    !isCoverColor(backCoverColor)
  ) {
    return null;
  }

  const fileSize =
    typeof metadata.fileSize === 'number' && metadata.fileSize > 0
      ? metadata.fileSize
      : undefined;

  return {
    serviceType,
    fileName,
    pageCount,
    fileSize,
    bindingType,
    frontCoverColor: frontCoverColor as StudentPrintFrontCoverColor,
    backCoverColor: backCoverColor as StudentPrintBackCoverColor,
  };
}

export function buildStudentPrintEditUrl(cartItemId: string): string {
  return `/students/print?edit=${cartItemId}`;
}
