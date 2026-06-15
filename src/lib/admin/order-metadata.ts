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
];

const KEY_LABELS: Record<string, string> = {
  designTemplateId: 'Template ID',
  designKind: 'Design type',
  productId: 'Product ID',
  serviceId: 'Service ID',
  orderType: 'Order type',
  layoutId: 'Layout',
  accentColor: 'Accent color',
  backgroundColor: 'Background color',
  textColor: 'Text color',
  secondaryColor: 'Secondary color',
  isCustomized: 'Customized',
  frontCustomText: 'Front text',
  backCustomText: 'Back text',
  frontCustomTextColor: 'Front text color',
  backCustomTextColor: 'Back text color',
  frontCustomTextSize: 'Front text size',
  backCustomTextSize: 'Back text size',
  frontPremadeDesignId: 'Front design',
  backPremadeDesignId: 'Back design',
};

function formatMetadataKey(key: string) {
  if (KEY_LABELS[key]) return KEY_LABELS[key];

  const normalized = key
    .replace(/^(front|back)/, (_, side: string) => `${side.charAt(0).toUpperCase()}${side.slice(1)} `)
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim();

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatMetadataValue(value: string | number | boolean) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  const text = String(value);
  if (text.length > 120) return `${text.slice(0, 117)}…`;
  return text;
}

export function isAdvancedMetadataKey(key: string) {
  return ADVANCED_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

export function splitOrderMetadata(metadata: Record<string, string | number | boolean>) {
  const essential: Array<{ key: string; label: string; value: string }> = [];
  const advanced: Array<{ key: string; label: string; value: string }> = [];

  for (const [key, value] of Object.entries(metadata)) {
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

  essential.sort((a, b) => a.label.localeCompare(b.label));
  advanced.sort((a, b) => a.label.localeCompare(b.label));

  return { essential, advanced };
}
