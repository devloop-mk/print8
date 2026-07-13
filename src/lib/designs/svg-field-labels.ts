import type { DesignCategory } from '@/lib/data/catalog';
import type { DesignOrderFieldId } from '@/lib/data/design-order-fields';
import type { SvgDesignTemplate, SvgTextField } from '@/lib/data/svg-design-templates';

export type SvgOnlyFieldLabelId =
  | 'logo'
  | 'name1'
  | 'name2'
  | 'tagline'
  | 'detail'
  | 'invitationLine'
  | 'connector'
  | 'eventTime'
  | 'cityRegion'
  | 'receptionNote'
  | 'scheduleLine'
  | 'contactLine'
  | 'webAddressLine'
  | 'foundedNote'
  | 'milestone'
  | 'rsvpNote'
  | 'menuHeading'
  | 'sectionTitle'
  | 'chefTitle'
  | 'yearEstablished'
  | 'contactPrefix';

export type SvgFieldLabelId = DesignOrderFieldId | SvgOnlyFieldLabelId;

const BUSINESS_CARD_FRONT_8: SvgFieldLabelId[] = [
  'logo',
  'companyName',
  'fullName',
  'jobTitle',
  'phone',
  'email',
  'website',
  'address',
];

const BUSINESS_CARD_BACK_3: SvgFieldLabelId[] = ['logo', 'companyName', 'tagline'];

const WEDDING_ARCH_9: SvgFieldLabelId[] = [
  'frontHeadline',
  'coupleNames',
  'tagline',
  'eventDate',
  'eventTime',
  'scheduleLine',
  'venue',
  'address',
  'cityRegion',
];

const WEDDING_NAMES_8: SvgFieldLabelId[] = [
  'frontHeadline',
  'name1',
  'connector',
  'name2',
  'eventDate',
  'eventTime',
  'venue',
  'address',
];

const WEDDING_BOTANICAL_11: SvgFieldLabelId[] = [
  'frontHeadline',
  'name1',
  'connector',
  'name2',
  'invitationLine',
  'eventDate',
  'eventTime',
  'venue',
  'address',
  'cityRegion',
  'receptionNote',
];

const WEDDING_CLASSIC_11: SvgFieldLabelId[] = [
  'frontHeadline',
  'name1',
  'connector',
  'name2',
  'invitationLine',
  'invitationLine',
  'eventDate',
  'scheduleLine',
  'eventTime',
  'venue',
  'address',
];

const WEDDING_PRINT_BEACH_11: SvgFieldLabelId[] = [
  'invitationLine',
  'invitationLine',
  'name1',
  'connector',
  'name2',
  'eventDate',
  'eventTime',
  'venue',
  'address',
  'cityRegion',
  'receptionNote',
];

const WEDDING_PRINT_AUTUMN_12: SvgFieldLabelId[] = [
  'frontHeadline',
  'invitationLine',
  'invitationLine',
  'name1',
  'connector',
  'name2',
  'eventDate',
  'eventTime',
  'venue',
  'address',
  'cityRegion',
  'receptionNote',
];

const WEDDING_PRINT_CELESTIAL_10: SvgFieldLabelId[] = [
  'frontHeadline',
  'name1',
  'connector',
  'name2',
  'invitationLine',
  'invitationLine',
  'eventDate',
  'eventTime',
  'venue',
  'address',
];

const WEDDING_PRINT_TERRACOTTA_11: SvgFieldLabelId[] = [
  'invitationLine',
  'invitationLine',
  'name1',
  'connector',
  'name2',
  'eventDate',
  'eventTime',
  'venue',
  'address',
  'cityRegion',
  'receptionNote',
];

const WEDDING_PRINT_WATERCOLOR_10: SvgFieldLabelId[] = [
  'invitationLine',
  'invitationLine',
  'name1',
  'name2',
  'invitationLine',
  'invitationLine',
  'eventDate',
  'eventTime',
  'venue',
  'address',
];

const WEDDING_WATERCOLOR_DAISY_9: SvgFieldLabelId[] = [
  'frontHeadline',
  'coupleNames',
  'eventDate',
  'tagline',
  'invitationLine',
  'venue',
  'scheduleLine',
  'additionalInfo',
  'tagline',
];

const WEDDING_LEMON_TILES_7: SvgFieldLabelId[] = [
  'invitationLine',
  'coupleNames',
  'eventDate',
  'venue',
  'scheduleLine',
  'additionalInfo',
  'tagline',
];

const WEDDING_ARCH_HANDS_8: SvgFieldLabelId[] = [
  'tagline',
  'coupleNames',
  'invitationLine',
  'eventDate',
  'venue',
  'scheduleLine',
  'additionalInfo',
  'tagline',
];

const WEDDING_PRINT_WINTER_11: SvgFieldLabelId[] = [
  'frontHeadline',
  'invitationLine',
  'name1',
  'connector',
  'name2',
  'eventDate',
  'eventTime',
  'venue',
  'address',
  'cityRegion',
  'receptionNote',
];

const BIRTHDAY_GOLD_10: SvgFieldLabelId[] = [
  'frontHeadline',
  'milestone',
  'invitationLine',
  'celebrantName',
  'milestone',
  'eventDate',
  'eventTime',
  'venue',
  'address',
  'rsvpNote',
];

const BIRTHDAY_ROSEGOLD_9: SvgFieldLabelId[] = [
  'frontHeadline',
  'invitationLine',
  'invitationLine',
  'celebrantName',
  'eventDate',
  'scheduleLine',
  'venue',
  'address',
  'rsvpNote',
];

const BIRTHDAY_PRINCESS_10: SvgFieldLabelId[] = [
  'frontHeadline',
  'invitationLine',
  'celebrantName',
  'milestone',
  'eventDate',
  'scheduleLine',
  'venue',
  'address',
  'rsvpNote',
  'phone',
];

const BIRTHDAY_DINO_9: SvgFieldLabelId[] = [
  'frontHeadline',
  'invitationLine',
  'celebrantName',
  'eventDate',
  'scheduleLine',
  'venue',
  'address',
  'rsvpNote',
  'phone',
];

const MENU_RUSTIC_FRONT_6: SvgFieldLabelId[] = [
  'restaurantName',
  'tagline',
  'tagline',
  'menuHeading',
  'tagline',
  'tagline',
];

const MENU_RUSTIC_BACK_8: SvgFieldLabelId[] = [
  'sectionTitle',
  'tagline',
  'tagline',
  'tagline',
  'restaurantName',
  'address',
  'phone',
  'website',
];

const MENU_FINEDINING_FRONT_6: SvgFieldLabelId[] = [
  'restaurantName',
  'tagline',
  'menuHeading',
  'chefTitle',
  'fullName',
  'yearEstablished',
];

const MENU_FINEDINING_BACK_8: SvgFieldLabelId[] = [
  'sectionTitle',
  'tagline',
  'tagline',
  'tagline',
  'tagline',
  'restaurantName',
  'address',
  'website',
];

const MENU_SUSHI_FRONT_5: SvgFieldLabelId[] = [
  'detail',
  'restaurantName',
  'tagline',
  'menuHeading',
  'tagline',
];

const MENU_SUSHI_BACK_6: SvgFieldLabelId[] = [
  'sectionTitle',
  'tagline',
  'restaurantName',
  'address',
  'tagline',
  'website',
];

const MENU_SEAFOOD_FRONT_4: SvgFieldLabelId[] = [
  'restaurantName',
  'tagline',
  'menuHeading',
  'tagline',
];

const MENU_SEAFOOD_BACK_6: SvgFieldLabelId[] = [
  'sectionTitle',
  'tagline',
  'restaurantName',
  'address',
  'phone',
  'website',
];

const MENU_CAFE_FRONT_5: SvgFieldLabelId[] = [
  'tagline',
  'restaurantName',
  'tagline',
  'menuHeading',
  'tagline',
];

const MENU_CAFE_BACK_6: SvgFieldLabelId[] = [
  'sectionTitle',
  'tagline',
  'restaurantName',
  'address',
  'tagline',
  'website',
];

const BCARD_LUXURY_FRONT_6: SvgFieldLabelId[] = [
  'fullName',
  'jobTitle',
  'phone',
  'email',
  'website',
  'address',
];

const BCARD_LUXURY_BACK_2: SvgFieldLabelId[] = ['companyName', 'foundedNote'];

const BCARD_CREATIVE_FRONT_7: SvgFieldLabelId[] = [
  'companyName',
  'fullName',
  'jobTitle',
  'phone',
  'email',
  'website',
  'address',
];

const BCARD_CREATIVE_BACK_2: SvgFieldLabelId[] = ['companyName', 'tagline'];

function templateSideKey(templateId: string, side: 'front' | 'back') {
  return `${templateId}:${side}`;
}

const TEMPLATE_SIDE_FIELD_LABELS: Record<string, SvgFieldLabelId[]> = {
  [templateSideKey('svg-bcard-tech-wave', 'front')]: BUSINESS_CARD_FRONT_8,
  [templateSideKey('svg-bcard-tech-wave', 'back')]: BUSINESS_CARD_BACK_3,
  [templateSideKey('svg-bcard-luxury-gold', 'front')]: BCARD_LUXURY_FRONT_6,
  [templateSideKey('svg-bcard-luxury-gold', 'back')]: ['companyName', 'foundedNote'],
  [templateSideKey('svg-bcard-corporate-geo', 'front')]: BUSINESS_CARD_FRONT_8,
  [templateSideKey('svg-bcard-corporate-geo', 'back')]: BUSINESS_CARD_BACK_3,
  [templateSideKey('svg-bcard-creative-abstract', 'front')]: BCARD_CREATIVE_FRONT_7,
  [templateSideKey('svg-bcard-creative-abstract', 'back')]: BCARD_CREATIVE_BACK_2,
  [templateSideKey('svg-wedding-modern-arch', 'front')]: WEDDING_ARCH_9,
  [templateSideKey('svg-wedding-romantic-blush', 'front')]: WEDDING_NAMES_8,
  [templateSideKey('svg-wedding-classic-navy-gold', 'front')]: WEDDING_CLASSIC_11,
  [templateSideKey('svg-wedding-botanical-boho', 'front')]: WEDDING_BOTANICAL_11,
  [templateSideKey('svg-wedding-print-beach', 'front')]: WEDDING_PRINT_BEACH_11,
  [templateSideKey('svg-wedding-print-autumn', 'front')]: WEDDING_PRINT_AUTUMN_12,
  [templateSideKey('svg-wedding-print-celestial', 'front')]: WEDDING_PRINT_CELESTIAL_10,
  [templateSideKey('svg-wedding-print-terracotta', 'front')]: WEDDING_PRINT_TERRACOTTA_11,
  [templateSideKey('svg-wedding-print-watercolor', 'front')]: WEDDING_PRINT_WATERCOLOR_10,
  [templateSideKey('svg-wedding-print-winter', 'front')]: WEDDING_PRINT_WINTER_11,
  [templateSideKey('svg-wedding-watercolor-daisy', 'front')]: WEDDING_WATERCOLOR_DAISY_9,
  [templateSideKey('svg-wedding-lemon-tiles', 'front')]: WEDDING_LEMON_TILES_7,
  [templateSideKey('svg-wedding-arch-hands', 'front')]: WEDDING_ARCH_HANDS_8,
[templateSideKey('svg-wedding-cdr-floral-garden', 'front')]: WEDDING_WATERCOLOR_DAISY_9,
  [templateSideKey('svg-wedding-cdr-spring-bloom', 'front')]: WEDDING_WATERCOLOR_DAISY_9,
  [templateSideKey('svg-wedding-cdr-golden-band', 'front')]: WEDDING_WATERCOLOR_DAISY_9,
  [templateSideKey('svg-wedding-cdr-elegant-vine', 'front')]: WEDDING_WATERCOLOR_DAISY_9,
  [templateSideKey('svg-wedding-cdr-classic-frame', 'front')]: WEDDING_WATERCOLOR_DAISY_9,
  [templateSideKey('svg-wedding-cdr-rustic-wreath', 'front')]: WEDDING_WATERCOLOR_DAISY_9,
  [templateSideKey('svg-wedding-cdr-romantic-rose', 'front')]: WEDDING_WATERCOLOR_DAISY_9,
  [templateSideKey('svg-wedding-cdr-vintage-lace', 'front')]: WEDDING_WATERCOLOR_DAISY_9,
  [templateSideKey('svg-wedding-cdr-botanical-frame', 'front')]: WEDDING_WATERCOLOR_DAISY_9,
  [templateSideKey('svg-wedding-cdr-navy-gold', 'front')]: WEDDING_WATERCOLOR_DAISY_9,
  [templateSideKey('svg-wedding-cdr-olive-grove', 'front')]: WEDDING_WATERCOLOR_DAISY_9,
  [templateSideKey('svg-wedding-cdr-teal-floral', 'front')]: WEDDING_WATERCOLOR_DAISY_9,
  [templateSideKey('svg-wedding-cdr-magenta-classic', 'front')]: WEDDING_WATERCOLOR_DAISY_9,
  [templateSideKey('svg-bday-gold', 'front')]: BIRTHDAY_GOLD_10,
  [templateSideKey('svg-bday-rosegold', 'front')]: BIRTHDAY_ROSEGOLD_9,
  [templateSideKey('svg-bday-princess', 'front')]: BIRTHDAY_PRINCESS_10,
  [templateSideKey('svg-bday-dino', 'front')]: BIRTHDAY_DINO_9,
  [templateSideKey('svg-menu-rustic', 'front')]: MENU_RUSTIC_FRONT_6,
  [templateSideKey('svg-menu-rustic', 'back')]: MENU_RUSTIC_BACK_8,
  [templateSideKey('svg-menu-finedining', 'front')]: MENU_FINEDINING_FRONT_6,
  [templateSideKey('svg-menu-finedining', 'back')]: MENU_FINEDINING_BACK_8,
  [templateSideKey('svg-menu-sushi', 'front')]: MENU_SUSHI_FRONT_5,
  [templateSideKey('svg-menu-sushi', 'back')]: MENU_SUSHI_BACK_6,
  [templateSideKey('svg-menu-seafood', 'front')]: MENU_SEAFOOD_FRONT_4,
  [templateSideKey('svg-menu-seafood', 'back')]: MENU_SEAFOOD_BACK_6,
  [templateSideKey('svg-menu-cafe', 'front')]: MENU_CAFE_FRONT_5,
  [templateSideKey('svg-menu-cafe', 'back')]: MENU_CAFE_BACK_6,
};

const SVG_ONLY_FIELD_LABELS = new Set<SvgOnlyFieldLabelId>([
  'logo',
  'name1',
  'name2',
  'tagline',
  'detail',
  'invitationLine',
  'connector',
  'eventTime',
  'cityRegion',
  'receptionNote',
  'scheduleLine',
  'contactLine',
  'webAddressLine',
  'foundedNote',
  'milestone',
  'rsvpNote',
  'menuHeading',
  'sectionTitle',
  'chefTitle',
  'yearEstablished',
  'contactPrefix',
]);

function labelListForSide(
  category: DesignCategory,
  side: 'front' | 'back',
  count: number,
): SvgFieldLabelId[] | null {
  if (category === 'business-cards') {
    if (side === 'front' && count === 8) return BUSINESS_CARD_FRONT_8;
    if (side === 'front' && count === 4) {
      return ['fullName', 'jobTitle', 'phone', 'address'];
    }
    if (side === 'back' && count === 3) return BUSINESS_CARD_BACK_3;
    if (side === 'back' && count === 2) return ['companyName', 'tagline'];
  }

  if (category === 'wedding' && side === 'front') {
    if (count === 9) return WEDDING_ARCH_9;
    if (count === 8) return WEDDING_NAMES_8;
  }

  return null;
}

export function getSvgFieldLabelId(
  template: SvgDesignTemplate,
  side: 'front' | 'back',
  field: SvgTextField,
  index: number,
  fieldCount: number,
): SvgFieldLabelId {
  if (field.labelKey) {
    return field.labelKey as SvgFieldLabelId;
  }

  const templateLabels = TEMPLATE_SIDE_FIELD_LABELS[templateSideKey(template.id, side)];
  if (templateLabels?.[index]) {
    return templateLabels[index];
  }

  const mapped = labelListForSide(template.category, side, fieldCount);
  if (mapped?.[index]) {
    return mapped[index];
  }

  return 'detail';
}

export function isOrderFieldLabel(
  labelId: SvgFieldLabelId,
): labelId is DesignOrderFieldId {
  return !SVG_ONLY_FIELD_LABELS.has(labelId as SvgOnlyFieldLabelId);
}

export function getSvgFieldInputProps(labelId: SvgFieldLabelId): {
  autoComplete?: string;
  inputMode?: 'text' | 'tel' | 'email' | 'url';
} {
  switch (labelId) {
    case 'fullName':
    case 'name1':
    case 'name2':
    case 'coupleNames':
    case 'celebrantName':
      return { autoComplete: 'name' };
    case 'phone':
      return { autoComplete: 'tel', inputMode: 'tel' };
    case 'email':
      return { autoComplete: 'email', inputMode: 'email' };
    case 'website':
      return { autoComplete: 'url', inputMode: 'url' };
    case 'address':
    case 'cityRegion':
    case 'venue':
      return { autoComplete: 'street-address' };
    case 'eventDate':
      return { autoComplete: 'off' };
    default:
      return {};
  }
}
