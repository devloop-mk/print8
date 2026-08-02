'use client';

import { cn } from '@/lib/utils';
import {
  STUDENT_PRINT_WIZARD_STEPS,
  type StudentPrintWizardStep,
} from '@/lib/students/student-print-state';

export function StudentPrintStepNav({
  current,
  labels,
  onStepClick,
}: {
  current: StudentPrintWizardStep;
  labels: Record<StudentPrintWizardStep, string>;
  onStepClick: (step: StudentPrintWizardStep) => void;
}) {
  const currentIndex = STUDENT_PRINT_WIZARD_STEPS.indexOf(current);

  return (
    <nav aria-label="Student print progress" className="mb-8">
      <ol className="flex flex-wrap gap-2 sm:gap-3">
        {STUDENT_PRINT_WIZARD_STEPS.map((step, index) => {
          const isActive = step === current;
          const isComplete = index < currentIndex;

          return (
            <li key={step}>
              <button
                type="button"
                onClick={() => onStepClick(step)}
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm',
                  'cursor-pointer hover:border-brand-500 hover:bg-brand-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
                  isActive
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : isComplete
                      ? 'border-brand-200 bg-brand-50/60 text-brand-600'
                      : 'border-ink-200 bg-white text-ink-500 hover:text-brand-600',
                )}
              >
                <span className="mr-1.5 tabular-nums">{index + 1}.</span>
                {labels[step]}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
