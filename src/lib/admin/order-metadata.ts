const ADVANCED_KEY_PATTERNS = [
  /FontWeight$/i,
  /LetterSpacing$/i,
  /LineHeight$/i,
  /Shadow$/i,
  /PositionX$/i,
  /PositionY$/i,
  /ImageScale$/i,
  /IsTextTemplate$/i,
  /UploadedFileId$/i,
  /UploadedPreviewUrl$/i,
  /PremadeDesignImage$/i,
  /^activeSide$/i,
  /^svgState$/i,
  /^svgFrontContent$/i,
  /^svgBackContent$/i,
];

const KEY_LABELS: Record<string, string> = {
  designTemplateId: 'Шаблон',
  designKind: 'Тип на дизајн',
  productId: 'Производ',
  serviceId: 'Услуга',
  orderType: 'Тип нарачка',
  layoutId: 'Распоред',
  svgTemplateId: 'SVG шаблон',
  previewAspectRatio: 'Сооднос на преглед',
  accentColor: 'Акцент боја',
  backgroundColor: 'Позадина',
  textColor: 'Боја на текст',
  secondaryColor: 'Секундарна боја',
  isCustomized: 'Прилагодено',
  frontCustomText: 'Преден текст',
  backCustomText: 'Заден текст',
  frontCustomTextColor: 'Боја на преден текст',
  backCustomTextColor: 'Боја на заден текст',
  frontCustomTextSize: 'Големина на преден текст',
  backCustomTextSize: 'Големина на заден текст',
  frontPremadeDesignId: 'Преден дизајн',
  backPremadeDesignId: 'Заден дизајн',
  category: 'Категорија',
  size: 'Големина',
  color: 'Боја',
};

function formatMetadataKey(key: string) {
  if (KEY_LABELS[key]) return KEY_LABELS[key];

  const normalized = key
    .replace(/^(front|back|left|right)/, (_, side: string) => `${side.charAt(0).toUpperCase()}${side.slice(1)} `)
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim();

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatMetadataValue(value: string | number | boolean) {
  if (typeof value === 'boolean') return value ? 'Да' : 'Не';
  const text = String(value);
  if (text.length > 120) return `${text.slice(0, 117)}…`;
  return text;
}

export function isAdvancedMetadataKey(key: string) {
  return ADVANCED_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

const HIDDEN_METADATA_KEYS = new Set([
  'svgFrontContent',
  'svgBackContent',
  'svgState',
]);

export function splitOrderMetadata(metadata: Record<string, string | number | boolean>) {
  const essential: Array<{ key: string; label: string; value: string }> = [];
  const advanced: Array<{ key: string; label: string; value: string }> = [];

  for (const [key, value] of Object.entries(metadata)) {
    if (HIDDEN_METADATA_KEYS.has(key)) continue;
    if (key.startsWith('text_') || key.startsWith('color_')) continue;
    const entry = {
      key,
      label: formatMetadataKey(key),
      value: formatMetadataValue(value),
    };

    if (isAdvancedMetadataKey(key)) {
      advanced.push(entry);
    } else {
      essential.push(entry);
    }
  }

  essential.sort((a, b) => a.label.localeCompare(b.label, 'mk'));
  advanced.sort((a, b) => a.label.localeCompare(b.label, 'mk'));

  return { essential, advanced };
}
