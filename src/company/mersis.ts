import type { Brand } from "../core/brand.ts";
import { isDigits, stripSeparators, toInput } from "../core/input.ts";
import { failure, type Result, success, unwrap } from "../core/result.ts";
import { createSchema, type StandardSchemaV1 } from "../core/schema.ts";

/** Doğrulanmış MERSİS numarası (16 hane). */
export type Mersis = Brand<string, "Mersis">;

const LABEL = "MERSİS numarası";
const LENGTH = 16;

/** Boşluk, tire ve noktaları siler. */
export function normalize(value: string): string {
  const input = toInput(value);
  return input === null ? "" : stripSeparators(input);
}

/**
 * MERSİS numarasının biçimini doğrular: 16 hane, yalnız rakam. Kontrol
 * basamağı resmî olarak yayımlanmadığı için denetlenmez.
 */
export function validate(value: string): Result<Mersis> {
  if (toInput(value) === null) return failure("FORMAT", { label: LABEL });
  const digits = normalize(value);
  if (digits === "") return failure("EMPTY", { label: LABEL });
  if (!isDigits(digits)) return failure("INVALID_CHARS", { label: LABEL });
  if (digits.length !== LENGTH) return failure("LENGTH", { label: LABEL, expected: LENGTH });
  return success(digits as Mersis);
}

export function isValid(value: string): boolean {
  return validate(value).ok;
}

/** Geçersiz girdide `TurkiyeError` fırlatır. */
export function parse(value: string): Mersis {
  return unwrap(validate(value));
}

/** Geçerli numarayı 16 hane olarak döner. Geçersiz girdide `normalize` sonucunu döner. */
export function format(value: string): string {
  const result = validate(value);
  return result.ok ? result.value : normalize(value);
}

let cachedSchema: StandardSchemaV1<string, Mersis> | undefined;

/** Standard Schema uyumlu doğrulayıcı. */
export function schema(): StandardSchemaV1<string, Mersis> {
  cachedSchema ??= createSchema({ label: LABEL, accept: (value) => toInput(value), validate });
  return cachedSchema;
}
