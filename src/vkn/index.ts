import type { Brand } from "../core/brand.ts";
import { isDigits, maskAll, randomInt, stripSeparators, toDigits, toInput } from "../core/input.ts";
import { failure, type Result, success, unwrap } from "../core/result.ts";
import { createSchema, type StandardSchemaV1 } from "../core/schema.ts";
import { isValid as isValidTckn } from "../tckn/index.ts";

/** Doğrulanmış Vergi Kimlik No (10 hane). */
export type Vkn = Brand<string, "Vkn">;

export interface GenerateOptions {
  /** 0 ile 1 arasında sayı döndüren üreteç. Varsayılan: `Math.random`. */
  readonly random?: () => number;
}

const LABEL = "VKN";
const LENGTH = 10;

/** İlk 9 haneden kontrol basamağını hesaplar (Gelir İdaresi algoritması). */
function checkDigit(digits: readonly number[]): number {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const shifted = ((digits[i] ?? 0) + 9 - i) % 10;
    if (shifted === 0) continue;
    const weighted = (shifted * 2 ** (9 - i)) % 9;
    sum += weighted === 0 ? 9 : weighted;
  }
  return (10 - (sum % 10)) % 10;
}

/** Boşluk, tire ve noktaları siler. */
export function normalize(value: string | number): string {
  const input = toInput(value, true);
  return input === null ? "" : stripSeparators(input);
}

/**
 * VKN'yi doğrular. Kurallar: 10 hane, son hane kontrol basamağıdır.
 *
 * @example
 * validate("1234567890"); // { ok: true, value: "1234567890" }
 */
export function validate(value: string | number): Result<Vkn> {
  const input = toInput(value, true);
  if (input === null) return failure("FORMAT", { label: LABEL });
  const digits = stripSeparators(input);
  if (digits === "") return failure("EMPTY", { label: LABEL });
  if (!isDigits(digits)) return failure("INVALID_CHARS", { label: LABEL });
  if (digits.length !== LENGTH) return failure("LENGTH", { label: LABEL, expected: LENGTH });
  const numbers = toDigits(digits);
  if (numbers[9] !== checkDigit(numbers)) return failure("CHECKSUM", { label: LABEL });
  return success(digits as Vkn);
}

export function isValid(value: string | number): boolean {
  return validate(value).ok;
}

/** Geçersiz girdide `TurkiyeError` fırlatır. */
export function parse(value: string | number): Vkn {
  return unwrap(validate(value));
}

/** Geçerli numarayı 10 hane olarak döner. Geçersiz girdide `normalize` sonucunu döner. */
export function format(value: string | number): string {
  const result = validate(value);
  return result.ok ? result.value : normalize(value);
}

/**
 * İlk 2 ve son 2 hane dışındakileri gizler.
 *
 * @example
 * mask("1234567890"); // "12******90"
 */
export function mask(value: string | number): string {
  const result = validate(value);
  if (!result.ok) return maskAll(normalize(value));
  return `${result.value.slice(0, 2)}******${result.value.slice(8)}`;
}

/**
 * Vergi numarası alanına girilen değerin türünü belirler. Şahıs şirketleri
 * vergi numarası olarak TCKN kullanır.
 *
 * @example
 * detectTaxId("1234567890");  // "vkn"
 * detectTaxId("10000000146"); // "tckn"
 * detectTaxId("123");         // null
 */
export function detectTaxId(value: string | number): "vkn" | "tckn" | null {
  if (isValid(value)) return "vkn";
  if (isValidTckn(value)) return "tckn";
  return null;
}

/** Test ve örnek veri için geçerli bir numara üretir. */
export function generate(options?: GenerateOptions): Vkn {
  const random = options?.random ?? Math.random;
  const digits: number[] = [];
  while (digits.length < 9) digits.push(randomInt(random, 10));
  digits.push(checkDigit(digits));
  return digits.join("") as Vkn;
}

let cachedSchema: StandardSchemaV1<string | number, Vkn> | undefined;

/** Standard Schema uyumlu doğrulayıcı. */
export function schema(): StandardSchemaV1<string | number, Vkn> {
  cachedSchema ??= createSchema({ label: LABEL, accept: (value) => toInput(value, true), validate });
  return cachedSchema;
}
