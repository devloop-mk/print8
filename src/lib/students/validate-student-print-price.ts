import {
  STUDENT_PRINT_BINDING_TYPES,
  STUDENT_PRINT_BACK_COVER_COLORS,
  STUDENT_PRINT_FRONT_COVER_COLORS,
  STUDENT_PRINT_ORDER_TYPE,
  STUDENT_PRINT_SERVICE_TYPES,
  STUDENT_PRINT_SERVICES,
  type StudentPrintBackCoverColor,
  type StudentPrintBindingType,
  type StudentPrintFrontCoverColor,
  type StudentPrintServiceType,
} from '@/lib/students/student-print-config';
import { estimateStudentPrintPrice } from '@/lib/students/student-print-state';
import type { StudentPrintState } from '@/lib/students/student-print-state';

const MAX_STUDENT_PRINT_PAGES = 500;

export function isStudentPrintOrderMetadata(
  metadata: Record<string, string | number | boolean> | undefined,
): boolean {
  return metadata?.orderType === STUDENT_PRINT_ORDER_TYPE;
}

function parseStudentPrintState(
  metadata: Record<string, string | number | boolean>,
): StudentPrintState | null {
  const serviceType = metadata.serviceType;
  if (
    typeof serviceType !== 'string' ||
    !STUDENT_PRINT_SERVICE_TYPES.includes(serviceType as StudentPrintServiceType)
  ) {
    return null;
  }

  const pageCount = metadata.pageCount;
  if (typeof pageCount !== 'number' || !Number.isFinite(pageCount)) {
    return null;
  }
  if (pageCount < 1 || pageCount > MAX_STUDENT_PRINT_PAGES) {
    return null;
  }

  const bindingType = metadata.bindingType;
  if (
    typeof bindingType !== 'string' ||
    !STUDENT_PRINT_BINDING_TYPES.includes(bindingType as StudentPrintBindingType)
  ) {
    return null;
  }

  const frontCoverColor = metadata.frontCoverColor;
  if (
    typeof frontCoverColor !== 'string' ||
    !STUDENT_PRINT_FRONT_COVER_COLORS.includes(
      frontCoverColor as StudentPrintFrontCoverColor,
    )
  ) {
    return null;
  }

  const backCoverColor = metadata.backCoverColor;
  if (
    typeof backCoverColor !== 'string' ||
    !STUDENT_PRINT_BACK_COVER_COLORS.includes(
      backCoverColor as StudentPrintBackCoverColor,
    )
  ) {
    return null;
  }

  const fileName = metadata.fileName;
  if (typeof fileName !== 'string' || !fileName.trim()) {
    return null;
  }

  const fileSize = metadata.fileSize;
  if (typeof fileSize !== 'number' || fileSize < 1) {
    return null;
  }

  return {
    serviceType: serviceType as StudentPrintServiceType,
    uploadedFile: {
      fileId: '',
      originalName: fileName,
      pageCount: Math.round(pageCount),
      fileSize: Math.round(fileSize),
    },
    bindingType: bindingType as StudentPrintBindingType,
    frontCoverColor: frontCoverColor as StudentPrintFrontCoverColor,
    backCoverColor: backCoverColor as StudentPrintBackCoverColor,
  };
}

export function getStudentPrintUnitPrice(
  metadata: Record<string, string | number | boolean> | undefined,
): number | null {
  if (!metadata || !isStudentPrintOrderMetadata(metadata)) {
    return null;
  }

  const state = parseStudentPrintState(metadata);
  if (!state) {
    return null;
  }

  const service = STUDENT_PRINT_SERVICES.find(
    (entry) => entry.id === state.serviceType,
  );
  if (!service) return null;

  const catalogServiceId = metadata.catalogServiceId;
  if (
    typeof catalogServiceId !== 'string' ||
    catalogServiceId !== service.catalogServiceId
  ) {
    return null;
  }

  return estimateStudentPrintPrice(state);
}
