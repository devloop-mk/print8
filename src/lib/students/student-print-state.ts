import {
  STUDENT_PRINT_BINDING_TYPES,
  STUDENT_PRINT_SERVICES,
  type StudentPrintBackCoverColor,
  type StudentPrintBindingType,
  type StudentPrintFrontCoverColor,
  type StudentPrintServiceType,
} from '@/lib/students/student-print-config';

export const STUDENT_PRINT_WIZARD_STEPS = [
  'service',
  'upload',
  'binding',
  'review',
] as const;

export type StudentPrintWizardStep = (typeof STUDENT_PRINT_WIZARD_STEPS)[number];

export interface StudentPrintUploadedFile {
  fileId: string;
  originalName: string;
  pageCount: number;
  fileSize: number;
}

export interface StudentPrintState {
  serviceType: StudentPrintServiceType | null;
  uploadedFile: StudentPrintUploadedFile | null;
  bindingType: StudentPrintBindingType | null;
  frontCoverColor: StudentPrintFrontCoverColor | null;
  backCoverColor: StudentPrintBackCoverColor | null;
}

export function createDefaultStudentPrintState(): StudentPrintState {
  return {
    serviceType: null,
    uploadedFile: null,
    bindingType: null,
    frontCoverColor: null,
    backCoverColor: null,
  };
}

export function getStudentPrintService(
  serviceType: StudentPrintServiceType | null,
) {
  if (!serviceType) return null;
  return STUDENT_PRINT_SERVICES.find((service) => service.id === serviceType) ?? null;
}

export function estimateStudentPrintPrice(state: StudentPrintState): number {
  const service = getStudentPrintService(state.serviceType);
  if (!service) return 0;

  let total = service.basePrice;
  const pages = state.uploadedFile?.pageCount ?? 0;
  if (pages > 0) {
    total += pages * service.pricePerPage;
  }

  if (state.bindingType === 'metal-spiral') {
    total += 80;
  }

  return total;
}

export function isStudentPrintStepComplete(
  step: StudentPrintWizardStep,
  state: StudentPrintState,
): boolean {
  switch (step) {
    case 'service':
      return state.serviceType !== null;
    case 'upload':
      return (
        state.uploadedFile !== null &&
        state.uploadedFile.pageCount > 0 &&
        Boolean(state.uploadedFile.fileId)
      );
    case 'binding':
      return (
        state.bindingType !== null &&
        STUDENT_PRINT_BINDING_TYPES.includes(state.bindingType) &&
        state.frontCoverColor !== null &&
        state.backCoverColor !== null
      );
    case 'review':
      return (
        isStudentPrintStepComplete('service', state) &&
        isStudentPrintStepComplete('upload', state) &&
        isStudentPrintStepComplete('binding', state)
      );
    default:
      return false;
  }
}

export function canAdvanceFromStep(
  step: StudentPrintWizardStep,
  state: StudentPrintState,
): boolean {
  return isStudentPrintStepComplete(step, state);
}
