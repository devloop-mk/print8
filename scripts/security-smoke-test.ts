/**
 * Local security smoke tests — no production network calls.
 * Run: npx tsx scripts/security-smoke-test.ts
 */
import { checkoutSchema } from '../src/lib/validations/order';
import { getStudentPrintUnitPrice } from '../src/lib/students/validate-student-print-price';
import { STUDENT_PRINT_ORDER_TYPE } from '../src/lib/students/student-print-config';

type Result = { name: string; pass: boolean; detail?: string };

const results: Result[] = [];

function assert(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
  const mark = pass ? 'PASS' : 'FAIL';
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function testOgAllowlist() {
  process.env.NODE_ENV = 'production';
  process.env.VERCEL_ENV = 'production';
  process.env.NEXT_PUBLIC_SITE_URL = 'https://print8.mk';

  const { isAllowedOgRasterUrl } = await import(
    '../src/lib/security/og-fetch-allowlist'
  );

  assert(
    'OG blocks localhost',
    !isAllowedOgRasterUrl('http://127.0.0.1/internal'),
  );
  assert(
    'OG blocks cloud metadata IP',
    !isAllowedOgRasterUrl('http://169.254.169.254/latest/meta-data/'),
  );
  assert(
    'OG blocks random external host',
    !isAllowedOgRasterUrl('https://evil.example.com/image.png'),
  );
  assert(
    'OG allows site host',
    isAllowedOgRasterUrl('https://print8.mk/assets/foo.png'),
  );
  assert(
    'OG blocks file protocol',
    !isAllowedOgRasterUrl('file:///etc/passwd'),
  );
}

function testCheckoutSchema() {
  const base = {
    fullName: 'Test User',
    phone: '070123456',
    email: 'test@example.com',
    fulfillmentMethod: 'pickup' as const,
    locale: 'mk' as const,
    items: [
      {
        productId: 'svc-1',
        name: 'Test',
        price: 1,
        quantity: 1,
        type: 'service' as const,
      },
    ],
  };

  const valid = checkoutSchema.safeParse(base);
  assert('Checkout schema accepts valid pickup order', valid.success);

  const tampered = checkoutSchema.safeParse({
    ...base,
    items: [{ ...base.items[0], price: 0.01 }],
  });
  assert('Checkout schema still parses tampered price', tampered.success);

  const hugeEmail = checkoutSchema.safeParse({
    ...base,
    email: `${'a'.repeat(300)}@example.com`,
  });
  assert('Checkout schema rejects huge email', !hugeEmail.success);
}

function testStudentPrintPricing() {
  const metadata = {
    orderType: STUDENT_PRINT_ORDER_TYPE,
    serviceType: 'book',
    catalogServiceId: 'bookbinding',
    pageCount: 10,
    bindingType: 'metal-spiral',
    frontCoverColor: 'black',
    backCoverColor: 'black',
    fileName: 'thesis.pdf',
    fileSize: 500_000,
  };

  const price10 = getStudentPrintUnitPrice(metadata);
  const price500 = getStudentPrintUnitPrice({ ...metadata, pageCount: 500 });

  assert(
    'Student print price computed for 10 pages',
    price10 !== null && price10 > 0,
    `price=${price10}`,
  );
  assert(
    'Student print price rises with page count',
    price500 !== null && price10 !== null && price500 > price10,
    `10p=${price10} 500p=${price500}`,
  );

  const cheat = getStudentPrintUnitPrice({ ...metadata, pageCount: 1 });
  assert(
    'Low pageCount yields lower price than 10 pages',
    cheat !== null && price10 !== null && cheat < price10,
    `cheat=${cheat} vs honest=${price10}`,
  );
}

async function testTurnstileSkipWhenUnset() {
  delete process.env.TURNSTILE_SECRET_KEY;
  delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const { requireTurnstileOrReject } = await import(
    '../src/lib/security/turnstile'
  );
  const result = await requireTurnstileOrReject('');
  assert('Turnstile skipped when keys unset', result.ok === true);
}

async function testSecretsDevFallback() {
  process.env.NODE_ENV = 'development';
  delete process.env.VERCEL_ENV;
  delete process.env.EMAIL_PREVIEW_SECRET;

  const { getRequiredSecret } = await import('../src/lib/security/secrets');
  const value = getRequiredSecret('EMAIL_PREVIEW_SECRET');
  assert(
    'Dev secret fallback works locally',
    value.startsWith('dev-insecure-'),
    value,
  );
}

async function main() {
  console.log('Security smoke tests (local)\n');

  await testOgAllowlist();
  testCheckoutSchema();
  testStudentPrintPricing();
  await testTurnstileSkipWhenUnset();
  await testSecretsDevFallback();

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.error('Failed:', failed.map((f) => f.name).join(', '));
    process.exit(1);
  }
}

main();
