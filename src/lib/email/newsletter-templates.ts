export type NewsletterTemplateId =
  | 'coupon-500'
  | 'coupon-1000'
  | 'couples'
  | 'family'
  | 'kids-birthday'
  | 'new-designs'
  | 'branding-pack'
  | 'local-mk'
  | 'cod'
  | 'general-promo';

export type NewsletterTemplateLocaleCopy = {
  subject: string;
  /** Plain text; blank line = new paragraph. Wrapped in branded HTML on send. */
  body: string;
  headline: string;
  subtitle: string;
  ctaLabel: string;
  ctaPath: string;
};

export type NewsletterTemplate = {
  id: NewsletterTemplateId;
  /** Admin UI label (Macedonian primary) */
  label: string;
  labelEn: string;
  description: string;
  mk: NewsletterTemplateLocaleCopy;
  en: NewsletterTemplateLocaleCopy;
};

export const NEWSLETTER_TEMPLATES: NewsletterTemplate[] = [
  {
    id: 'coupon-500',
    label: 'Купон −500 / 3.500+',
    labelEn: 'Coupon −500 / 3,500+',
    description: 'Попуст 500 ден. на нарачка над 3.500 ден.',
    mk: {
      subject: 'Заштеди 500 ден. на нарачка над 3.500 ден. · Print 8',
      headline: '−500 ден. попуст',
      subtitle: 'На нарачка над 3.500 ден.',
      body: `Здраво!

Имаш попуст од 500 денари на нарачка над 3.500 ден. во Print 8.

Избери готов дизајн или качи свој — ние печатиме професионално во Штип.

Нарачај на print8.mk и искористи го попустот на каса.`,
      ctaLabel: 'Нарачај сега',
      ctaPath: '/products',
    },
    en: {
      subject: 'Save 500 MKD on orders over 3,500 · Print 8',
      headline: '−500 MKD off',
      subtitle: 'On orders over 3,500 MKD',
      body: `Hi!

Get 500 MKD off when your order is over 3,500 MKD at Print 8.

Pick a ready design or upload your own — we print professionally in Štip.

Shop on print8.mk and apply the discount at checkout.`,
      ctaLabel: 'Shop now',
      ctaPath: '/products',
    },
  },
  {
    id: 'coupon-1000',
    label: 'Купон −1.000 / 6.500+',
    labelEn: 'Coupon −1,000 / 6,500+',
    description: 'Попуст 1.000 ден. на нарачка над 6.500 ден.',
    mk: {
      subject: 'Заштеди 1.000 ден. на нарачка над 6.500 ден. · Print 8',
      headline: '−1.000 ден. попуст',
      subtitle: 'На нарачка над 6.500 ден.',
      body: `Здраво!

За поголеми нарачки — попуст од 1.000 денари кога нарачката е над 6.500 ден.

Идеално за семејни пакети, тимски маици или branding.

Нарачај на print8.mk и искористи го попустот на каса.`,
      ctaLabel: 'Искористи попуст',
      ctaPath: '/products',
    },
    en: {
      subject: 'Save 1,000 MKD on orders over 6,500 · Print 8',
      headline: '−1,000 MKD off',
      subtitle: 'On orders over 6,500 MKD',
      body: `Hi!

For bigger orders — save 1,000 MKD when your total is over 6,500 MKD.

Great for family packs, team tees, or branding.

Order on print8.mk and apply the discount at checkout.`,
      ctaLabel: 'Claim discount',
      ctaPath: '/products',
    },
  },
  {
    id: 'couples',
    label: 'Парски маици',
    labelEn: 'Couples tees',
    description: 'Matching дизајни за парови.',
    mk: {
      subject: 'Matching маици за двајца · Print 8',
      headline: 'За двајца',
      subtitle: 'Matching принтови за парови',
      body: `Здраво!

Побарајте парски маици — комплементарни дизајни за него и за неа.

Идеален подарок за годишнина, патување или без повод.

Избери дизајн на print8.mk.`,
      ctaLabel: 'Види парски дизајни',
      ctaPath: '/products/ready-designs/couples',
    },
    en: {
      subject: 'Matching couple tees · Print 8',
      headline: 'For two',
      subtitle: 'Matching prints for couples',
      body: `Hi!

Browse couple tees — complementary designs for him and her.

A great gift for anniversaries, trips, or just because.

Pick a design on print8.mk.`,
      ctaLabel: 'Browse couple designs',
      ctaPath: '/products/ready-designs/couples',
    },
  },
  {
    id: 'family',
    label: 'Семејни пакети',
    labelEn: 'Family packs',
    description: 'Matching маици за целото семејство.',
    mk: {
      subject: 'Семејни matching маици · Print 8',
      headline: 'За целото семејство',
      subtitle: 'Мама, тато, деца — заедно',
      body: `Здраво!

Matching маици за целото семејство — од баба до внук.

Идеално за фотографии, патувања и подароци.

Види ги семејните дизајни на print8.mk.`,
      ctaLabel: 'Види семејни дизајни',
      ctaPath: '/products/ready-designs?collection=family',
    },
    en: {
      subject: 'Matching family tees · Print 8',
      headline: 'For the whole family',
      subtitle: 'Mom, dad, kids — together',
      body: `Hi!

Matching tees for the whole family — from grandparents to kids.

Perfect for photos, trips, and gifts.

Browse family designs on print8.mk.`,
      ctaLabel: 'Browse family designs',
      ctaPath: '/products/ready-designs?collection=family',
    },
  },
  {
    id: 'kids-birthday',
    label: 'Роденден / деца',
    labelEn: 'Kids & birthday',
    description: 'Весели роденденски дизајни за деца.',
    mk: {
      subject: 'Роденден mode: ON · детски маици · Print 8',
      headline: 'Роденден во полн сјај',
      subtitle: 'Весели дизајни за деца и родители',
      body: `Здраво!

Роденденските маици се тука — за најмалите славеници и за родителите.

Избери готов дизајн и нарачај навреме за прославата.

Види детски дизајни на print8.mk.`,
      ctaLabel: 'Погледни детски дизајни',
      ctaPath: '/products/ready-designs/kids',
    },
    en: {
      subject: 'Birthday mode: ON · kids tees · Print 8',
      headline: 'Birthday in full color',
      subtitle: 'Playful designs for kids and parents',
      body: `Hi!

Birthday tees are here — for the little stars and the parents too.

Pick a ready design and order in time for the party.

Browse kids designs on print8.mk.`,
      ctaLabel: 'Browse kids designs',
      ctaPath: '/products/ready-designs/kids',
    },
  },
  {
    id: 'new-designs',
    label: 'Нови дизајни',
    labelEn: 'New designs',
    description: 'Свежи готови дизајни во каталогот.',
    mk: {
      subject: 'Нови дизајни што штотуку влегоа · Print 8',
      headline: 'Свежи дизајни',
      subtitle: 'Нови принтови за маици, шолји и капи',
      body: `Здраво!

Додадовме нови готови дизајни во каталогот.

Избери · нарачај · носи — без компликации.

Види што е ново на print8.mk.`,
      ctaLabel: 'Разгледај нови дизајни',
      ctaPath: '/products/ready-designs',
    },
    en: {
      subject: 'New designs just dropped · Print 8',
      headline: 'Fresh designs',
      subtitle: 'New prints for tees, mugs, and caps',
      body: `Hi!

We added new ready-made designs to the catalog.

Pick · order · wear — no hassle.

See what’s new on print8.mk.`,
      ctaLabel: 'Browse new designs',
      ctaPath: '/products/ready-designs',
    },
  },
  {
    id: 'branding-pack',
    label: 'Branding пакет',
    labelEn: 'Branding pack',
    description: 'Лого на маица, шолја, капа и повеќе.',
    mk: {
      subject: 'Лого на маица, шолја, капа — branding од Print 8',
      headline: 'Твојот бренд, на печат',
      subtitle: 'Merch за бизнис, тим или настан',
      body: `Здраво!

Качи го логото — ние печатиме на маици, шолји, капи и повеќе.

Брзо, јасно и професионално за твојот бренд.

Започни branding пакет на print8.mk.`,
      ctaLabel: 'Започни branding',
      ctaPath: '/products/branding-pack',
    },
    en: {
      subject: 'Logo on tees, mugs, caps — branding by Print 8',
      headline: 'Your brand, printed',
      subtitle: 'Merch for business, teams, or events',
      body: `Hi!

Upload your logo — we print on tees, mugs, caps, and more.

Fast, clear, and professional for your brand.

Start a branding pack on print8.mk.`,
      ctaLabel: 'Start branding pack',
      ctaPath: '/products/branding-pack',
    },
  },
  {
    id: 'local-mk',
    label: 'Локално МК / Штип',
    labelEn: 'Local MK / Štip',
    description: 'Локални мотиви на шолји и капи.',
    mk: {
      subject: 'Штип & Македонија на шолја и капа · Print 8',
      headline: 'Локално од срце',
      subtitle: 'Принтови со карактер од Штип и МК',
      body: `Здраво!

Нови локални дизајни — Штип, Македонија и повеќе, на шолји и капи.

Идеален подарок или спомен од дома.

Види ги локалните дизајни на print8.mk.`,
      ctaLabel: 'Види локални дизајни',
      ctaPath: '/products/ready-designs?collection=local-mk',
    },
    en: {
      subject: 'Štip & Macedonia on mugs and caps · Print 8',
      headline: 'Local from the heart',
      subtitle: 'Prints with character from Štip and MK',
      body: `Hi!

New local designs — Štip, Macedonia, and more on mugs and caps.

A great gift or keepsake from home.

Browse local designs on print8.mk.`,
      ctaLabel: 'Browse local designs',
      ctaPath: '/products/ready-designs?collection=local-mk',
    },
  },
  {
    id: 'cod',
    label: 'Плати при достава',
    labelEn: 'Cash on delivery',
    description: 'Нарачај онлајн, плати при достава.',
    mk: {
      subject: 'Плати при достава низ цела Македонија · Print 8',
      headline: 'Плати при достава',
      subtitle: 'Низ цела Македонија',
      body: `Здраво!

На print8.mk нарачуваш онлајн, а плаќаш кога ќе ја добиеш нарачката.

Без картичка однапред — едноставно и безбедно.

Види како да нарачаш и избери дизајн денес.`,
      ctaLabel: 'Како да нарачаш',
      ctaPath: '/how-to-order',
    },
    en: {
      subject: 'Pay on delivery across North Macedonia · Print 8',
      headline: 'Cash on delivery',
      subtitle: 'Across North Macedonia',
      body: `Hi!

Order online on print8.mk and pay when your package arrives.

No card upfront — simple and secure.

See how to order and pick a design today.`,
      ctaLabel: 'How to order',
      ctaPath: '/how-to-order',
    },
  },
  {
    id: 'general-promo',
    label: 'Општ промо',
    labelEn: 'General promo',
    description: 'Општа промотивна порака за Print 8.',
    mk: {
      subject: 'Print 8 — од идеја до готов производ',
      headline: 'Печати го стилот',
      subtitle: 'Маици · шолји · капи · твој дизајн',
      body: `Здраво!

Print 8 е тука за готов дизајн или целосно custom печат.

Професионален квалитет од Штип, достава низ Македонија.

Посети print8.mk и започни нарачка.`,
      ctaLabel: 'Отвори print8.mk',
      ctaPath: '/',
    },
    en: {
      subject: 'Print 8 — from idea to finished product',
      headline: 'Print your style',
      subtitle: 'Tees · mugs · caps · your design',
      body: `Hi!

Print 8 is here for ready designs or fully custom printing.

Pro quality from Štip, delivery across North Macedonia.

Visit print8.mk and start your order.`,
      ctaLabel: 'Open print8.mk',
      ctaPath: '/',
    },
  },
];

export function getNewsletterTemplate(id: string | null | undefined) {
  if (!id) return null;
  return NEWSLETTER_TEMPLATES.find((item) => item.id === id) ?? null;
}
