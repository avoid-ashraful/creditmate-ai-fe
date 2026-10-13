import { AUTH_COPY } from '../locales/auth';
import { ApiError } from '../services/auth';

import { describeApiErrors, requiredFieldErrors, safeReturnPath } from './authErrors';

const copy = AUTH_COPY.en;

describe('requiredFieldErrors', () => {
  it('flags only the blank values, and treats whitespace-only as blank', () => {
    expect(requiredFieldErrors({ email: '', password: '   ', name: 'x' }, copy)).toEqual({
      email: 'This field is required.',
      password: 'This field is required.',
    });
  });

  it('returns no errors when every value is filled', () => {
    expect(requiredFieldErrors({ email: 'a@b.c' }, copy)).toEqual({});
  });
});

describe('describeApiErrors', () => {
  it('places a field error on a known input', () => {
    const error = new ApiError(400, null, { email: ['Enter a valid email address.'] });

    expect(describeApiErrors(error, copy, ['email', 'password'])).toEqual({
      fields: { email: 'Enter a valid email address.' },
      form: 'Please check the highlighted fields.',
    });
  });

  it('moves a field with no matching input into the form message', () => {
    const error = new ApiError(400, null, { token: ['Invalid or expired token.'] });

    expect(describeApiErrors(error, copy, ['new_password'])).toEqual({
      fields: {},
      form: 'Invalid or expired token.',
    });
  });

  it('prefers the server detail, then non_field_errors, for the form message', () => {
    expect(describeApiErrors(new ApiError(401, 'Bad credentials'), copy, ['email']).form).toBe(
      'Bad credentials'
    );
    expect(
      describeApiErrors(new ApiError(400, null, { non_field_errors: ['Account locked.'] }), copy, [
        'email',
      ]).form
    ).toBe('Account locked.');
  });

  it('falls back to the generic message for an error with no details', () => {
    expect(describeApiErrors(new ApiError(500), copy, ['email'])).toEqual({
      fields: {},
      form: 'Something went wrong. Please try again.',
    });
  });

  it('uses the network message for a TypeError from fetch', () => {
    expect(describeApiErrors(new TypeError('Failed to fetch'), copy, [])).toEqual({
      fields: {},
      form: 'We could not reach the server. Please try again.',
    });
  });

  it('uses the generic message for anything unexpected', () => {
    expect(describeApiErrors(new Error('boom'), copy, []).form).toBe(
      'Something went wrong. Please try again.'
    );
    expect(describeApiErrors('nope', copy, []).form).toBe(
      'Something went wrong. Please try again.'
    );
  });
});

describe('safeReturnPath', () => {
  it('accepts in-app paths, including query strings', () => {
    expect(safeReturnPath('/compare')).toBe('/compare');
    expect(safeReturnPath('/account?tab=profile')).toBe('/account?tab=profile');
  });

  it('rejects absolute, protocol-relative and non-string values', () => {
    expect(safeReturnPath('https://evil.example/x')).toBeNull();
    expect(safeReturnPath('//evil.example')).toBeNull();
    expect(safeReturnPath('compare')).toBeNull();
    expect(safeReturnPath(42)).toBeNull();
    expect(safeReturnPath(undefined)).toBeNull();
  });
});
