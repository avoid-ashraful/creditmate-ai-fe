import type { AuthCopy } from '../locales/auth';
import { ApiError } from '../services/auth';

/** Messages for one form: per-input messages plus one form-level message. */
export interface FormErrors {
  fields: Record<string, string>;
  form: string | null;
}

export const NO_FORM_ERRORS: FormErrors = { fields: {}, form: null };

/**
 * Local check that every named value is filled in. Returns a message per blank
 * field, using the localized "required" copy.
 */
export function requiredFieldErrors(
  values: Record<string, string>,
  copy: AuthCopy
): Record<string, string> {
  const fields: Record<string, string> = {};
  Object.keys(values).forEach(key => {
    if (values[key].trim() === '') fields[key] = copy.fieldRequired;
  });
  return fields;
}

/**
 * Map a failed request to form messages.
 *
 * - DRF field errors land on the matching input when that input exists
 *   (`inputKeys`). Any other field, such as a reset `token`, goes to the form.
 * - Server `detail` and `non_field_errors` go to the form. The backend sends
 *   them in English, so they are shown as received.
 * - A network failure (fetch rejects with TypeError) gets the network message.
 */
export function describeApiErrors(
  error: unknown,
  copy: AuthCopy,
  inputKeys: readonly string[]
): FormErrors {
  if (error instanceof ApiError) {
    if (error.status === 0) return { fields: {}, form: copy.networkError };
    const fields: Record<string, string> = {};
    const formMessages: string[] = [];

    if (error.detail) formMessages.push(error.detail);
    Object.keys(error.fieldErrors).forEach(key => {
      const message = error.fieldErrors[key][0];
      if (key !== 'non_field_errors' && inputKeys.indexOf(key) !== -1) {
        fields[key] = message;
      } else {
        formMessages.push(message);
      }
    });

    if (formMessages.length > 0) return { fields, form: formMessages[0] };
    if (Object.keys(fields).length > 0) return { fields, form: copy.checkFields };
    return { fields, form: copy.genericError };
  }

  if (error instanceof TypeError) {
    return { fields: {}, form: copy.networkError };
  }

  return { fields: {}, form: copy.genericError };
}

/** Only in-app paths are accepted, so a `from` value cannot send users off-site. */
export function safeReturnPath(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}
