'use client';

import { useTranslations } from 'next-intl';
import type { DesignCategory } from '@/lib/data/catalog';
import {
  categoryOrderFields,
  requiredOrderFields,
  type DesignOrderFieldId,
} from '@/lib/data/design-order-fields';
import { cn } from '@/lib/utils';

const fieldInputType: Partial<
  Record<DesignOrderFieldId, 'text' | 'email' | 'tel' | 'url' | 'date' | 'textarea'>
> = {
  email: 'email',
  phone: 'tel',
  website: 'url',
  eventDate: 'date',
  additionalInfo: 'textarea',
  address: 'textarea',
};

export function DesignQuickContactFields({
  category,
  values,
  errors,
  onChange,
  className,
}: {
  category: DesignCategory;
  values: Partial<Record<DesignOrderFieldId, string>>;
  errors: Partial<Record<DesignOrderFieldId, string>>;
  onChange: (id: DesignOrderFieldId, value: string) => void;
  className?: string;
}) {
  const t = useTranslations('designs.order');
  const fields = categoryOrderFields[category];
  const required = requiredOrderFields[category];

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-3 text-sm text-ink-700">
        <p className="font-semibold text-ink-900">{t('quickOrderNoteTitle')}</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-600 sm:text-sm">
          {t('quickOrderNoteBody')}
        </p>
      </div>

      {fields.map((fieldId) => {
        const isRequired = required.includes(fieldId);
        const inputType = fieldInputType[fieldId] ?? 'text';
        const error = errors[fieldId];

        return (
          <div key={fieldId}>
            <label
              htmlFor={`quick-${fieldId}`}
              className="mb-1.5 block text-sm font-medium text-ink-800"
            >
              {t(`fields.${fieldId}`)}
              {isRequired ? (
                <span className="text-red-600" aria-hidden="true"> *</span>
              ) : null}
            </label>
            {inputType === 'textarea' ? (
              <textarea
                id={`quick-${fieldId}`}
                rows={3}
                value={values[fieldId] ?? ''}
                placeholder={t(`placeholders.${fieldId}`)}
                onChange={(e) => onChange(fieldId, e.target.value)}
                className={cn(
                  'w-full rounded-lg border px-3 py-2.5 text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200',
                  error ? 'border-red-400' : 'border-ink-300',
                )}
              />
            ) : (
              <input
                id={`quick-${fieldId}`}
                type={inputType}
                value={values[fieldId] ?? ''}
                placeholder={t(`placeholders.${fieldId}`)}
                onChange={(e) => onChange(fieldId, e.target.value)}
                className={cn(
                  'w-full rounded-lg border px-3 py-2.5 text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200',
                  error ? 'border-red-400' : 'border-ink-300',
                )}
              />
            )}
            {error ? (
              <p className="mt-1 text-xs text-red-600">{error}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
