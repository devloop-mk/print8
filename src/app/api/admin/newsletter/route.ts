import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin/api-auth';
import {
  countNewsletterSubscribers,
  findNewsletterSubscriberByEmail,
  getActiveNewsletterSubscribersByIds,
  listNewsletterSubscribers,
} from '@/lib/db/newsletter';
import { nanoid } from 'nanoid';
import { sendNewsletterBroadcast } from '@/lib/email/newsletter-email';
import { NEWSLETTER_TEMPLATES } from '@/lib/email/newsletter-templates';

const sendSchema = z.object({
  subject: z.string().trim().min(3).max(160),
  body: z.string().trim().min(10).max(20000),
  subjectEn: z.string().trim().max(160).optional().nullable(),
  bodyEn: z.string().trim().max(20000).optional().nullable(),
  templateId: z.string().trim().max(64).optional().nullable(),
  headline: z.string().trim().max(160).optional().nullable(),
  subtitle: z.string().trim().max(200).optional().nullable(),
  headlineEn: z.string().trim().max(160).optional().nullable(),
  subtitleEn: z.string().trim().max(200).optional().nullable(),
  ctaLabel: z.string().trim().max(80).optional().nullable(),
  ctaLabelEn: z.string().trim().max(80).optional().nullable(),
  ctaPath: z.string().trim().max(200).optional().nullable(),
  mode: z.enum(['broadcast', 'test']).default('broadcast'),
  recipientIds: z.array(z.string().trim().min(1).max(64)).max(5000).optional(),
  testEmail: z.string().trim().email().max(254).optional(),
  testLocale: z.enum(['mk', 'en']).optional(),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  try {
    const [counts, subscribers] = await Promise.all([
      countNewsletterSubscribers(),
      listNewsletterSubscribers(2000),
    ]);

    return NextResponse.json({
      counts,
      subscribers: subscribers.map((item) => ({
        id: item.id,
        email: item.email,
        locale: item.locale,
        status: item.status,
        createdAt: item.createdAt,
        unsubscribedAt: item.unsubscribedAt,
      })),
      templates: NEWSLETTER_TEMPLATES.map((item) => ({
        id: item.id,
        label: item.label,
        labelEn: item.labelEn,
        description: item.description,
        heroImagePath: item.heroImagePath ?? null,
        mk: item.mk,
        en: item.en,
      })),
    });
  } catch (err) {
    console.error('[admin/newsletter] list failed', err);
    return NextResponse.json(
      { error: 'Failed to load subscribers' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid newsletter payload', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const isTest = parsed.data.mode === 'test';
    let recipients: {
      email: string;
      unsubscribeToken: string;
      locale?: string | null;
    }[] = [];

    if (isTest) {
      const testEmail = parsed.data.testEmail?.trim().toLowerCase();
      if (!testEmail) {
        return NextResponse.json(
          { error: 'Test email is required', code: 'test_email_required' },
          { status: 400 },
        );
      }
      const existing = await findNewsletterSubscriberByEmail(testEmail);
      recipients = [
        {
          email: testEmail,
          unsubscribeToken: existing?.unsubscribeToken || nanoid(32),
          locale: parsed.data.testLocale ?? existing?.locale ?? 'mk',
        },
      ];
    } else {
      const selected = await getActiveNewsletterSubscribersByIds(
        parsed.data.recipientIds ?? [],
      );
      if (selected.length === 0) {
        return NextResponse.json(
          { error: 'No recipients selected', code: 'no_recipients' },
          { status: 400 },
        );
      }
      recipients = selected.map((item) => ({
        email: item.email,
        unsubscribeToken: item.unsubscribeToken,
        locale: item.locale,
      }));
    }

    const result = await sendNewsletterBroadcast({
      subject: isTest ? `[TEST] ${parsed.data.subject}` : parsed.data.subject,
      body: parsed.data.body,
      subjectEn: isTest
        ? parsed.data.subjectEn
          ? `[TEST] ${parsed.data.subjectEn}`
          : parsed.data.subjectEn
        : parsed.data.subjectEn,
      bodyEn: parsed.data.bodyEn,
      templateId: parsed.data.templateId,
      headline: parsed.data.headline,
      subtitle: parsed.data.subtitle,
      headlineEn: parsed.data.headlineEn,
      subtitleEn: parsed.data.subtitleEn,
      ctaLabel: parsed.data.ctaLabel,
      ctaLabelEn: parsed.data.ctaLabelEn,
      ctaPath: parsed.data.ctaPath,
      recipients,
    });

    return NextResponse.json({
      ok: true,
      recipientCount: recipients.length,
      ...result,
    });
  } catch (err) {
    console.error('[admin/newsletter] send failed', err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : 'Failed to send newsletter',
      },
      { status: 500 },
    );
  }
}
