import { type ErrorCode, TurkiyeError } from "./errors.ts";
import { formatMessage, type MessageParams } from "./messages.ts";

/**
 * `validate` fonksiyonlarının dönüş tipi.
 *
 * @example
 * const result = tckn.validate(input);
 * if (result.ok) {
 *   save(result.value);
 * } else {
 *   showError(result.message);
 * }
 */
export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly code: ErrorCode; readonly message: string };

/** @internal */
export function success<T>(value: T): Result<T> {
  return { ok: true, value };
}

/** @internal */
export function failure(code: ErrorCode, params: MessageParams): Result<never> {
  return { ok: false, code, message: formatMessage(code, params) };
}

/** @internal Hatalı sonuçta `TurkiyeError` fırlatır. */
export function unwrap<T>(result: Result<T>): T {
  if (result.ok) return result.value;
  throw new TurkiyeError(result.code, result.message);
}
