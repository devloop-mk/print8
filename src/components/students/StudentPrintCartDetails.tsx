'use client';

import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import type { CartItem } from '@/lib/cart/types';
import { formatBytes } from '@/lib/students/student-print-config';
import { getStudentPrintCartDetails } from '@/lib/students/student-print-cart';

export function StudentPrintCartDetails({ item }: { item: CartItem }) {
  const t = useTranslations('students.print');
  const tc = useTranslations('cart.studentPrint');
  const details = getStudentPrintCartDetails(item);

  if (!details) return null;

  const rows = [
    {
      label: tc('file'),
      value: details.fileName,
      icon: true,
    },
    {
      label: tc('pages'),
      value: tc('pageCount', { count: details.pageCount }),
    },
    ...(details.fileSize
      ? [
          {
            label: tc('fileSize'),
            value: formatBytes(details.fileSize),
          },
        ]
      : []),
    {
      label: tc('binding'),
      value: t(`bindingTypes.${details.bindingType}.title`),
    },
    {
      label: tc('frontCover'),
      value: t(`coverColors.${details.frontCoverColor}`),
    },
    {
      label: tc('backCover'),
      value: t(`coverColors.${details.backCoverColor}`),
    },
  ];

  return (
    <dl className="mt-3 space-y-1.5 rounded-lg border border-ink-100 bg-ink-50/60 px-3 py-2.5 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className="shrink-0 text-ink-500">{row.label}:</dt>
          <dd
            className={`min-w-0 font-medium text-ink-800 ${'icon' in row && row.icon ? 'inline-flex items-center gap-1.5' : ''}`}
          >
            {'icon' in row && row.icon ? (
              <FileText className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
            ) : null}
            <span className="break-all">{row.value}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
