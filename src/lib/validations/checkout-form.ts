export type CheckoutFormFields = {
  fullName: string;
  phone: string;
  email: string;
  fulfillmentMethod: 'cargo' | 'pickup';
  city: string;
  address: string;
  notes?: string;
};

export type CheckoutValidationMessages = {
  required: string;
  fullNameTooShort: string;
  invalidPhone: string;
  invalidEmail: string;
  cityTooShort: string;
  addressTooShort: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCheckoutFields(
  form: CheckoutFormFields,
  messages: CheckoutValidationMessages,
): Record<string, string> {
  const errors: Record<string, string> = {};

  const fullName = form.fullName.trim();
  if (!fullName) errors.fullName = messages.required;
  else if (fullName.length < 2) errors.fullName = messages.fullNameTooShort;

  const phone = form.phone.trim();
  if (!phone) errors.phone = messages.required;
  else if (phone.length < 8 || phone.length > 20) errors.phone = messages.invalidPhone;

  const email = form.email.trim();
  if (!email) errors.email = messages.required;
  else if (!EMAIL_PATTERN.test(email)) errors.email = messages.invalidEmail;

  if (form.fulfillmentMethod === 'cargo') {
    const city = form.city.trim();
    if (!city) errors.city = messages.required;
    else if (city.length < 2) errors.city = messages.cityTooShort;

    const address = form.address.trim();
    if (!address) errors.address = messages.required;
    else if (address.length < 5) errors.address = messages.addressTooShort;
  }

  return errors;
}

type ZodFlattenedErrors = {
  fieldErrors?: Record<string, string[] | undefined>;
};

export function mapCheckoutApiFieldErrors(
  details: ZodFlattenedErrors | undefined,
  form: CheckoutFormFields,
  messages: CheckoutValidationMessages,
): Record<string, string> {
  const apiFields = Object.keys(details?.fieldErrors ?? {}).filter(
    (field) => details?.fieldErrors?.[field]?.length,
  );
  if (apiFields.length === 0) return {};

  const clientErrors = validateCheckoutFields(form, messages);
  const errors: Record<string, string> = {};

  for (const field of apiFields) {
    errors[field] = clientErrors[field] ?? messages.required;
  }

  return errors;
}
