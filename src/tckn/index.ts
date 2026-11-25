import type { Brand } from "../core/brand.ts";
import { isDigits, maskAll, randomInt, stripSeparators, toDigits, toInput } from "../core/input.ts";
import { failure, type Result, success, unwrap } from "../core/result.ts";
import { createSchema, type StandardSchemaV1 } from "../core/schema.ts";

/** Doğrulanmış TC Kimlik No ya da Yabancı Kimlik No (11 hane). */
export type Tckn = Brand<string, "Tckn">;

/** `citizen`: TC vatandaşı, `foreign`: yabancı kimlik numarası (99 ile başlar). */
export type TcknKind = "citizen" | "foreign";

export interface GenerateOptions {
  /** `true` ise 99 ile başlayan yabancı kimlik numarası üretilir. */
  readonly foreign?: boolean;
  /** 0 ile 1 arasında sayı döndüren üreteç. Varsayılan: `Math.random`. */
  readonly random?: () => number;
}

const LABEL = "TCKN";
const LENGTH = 11;

/** İlk 9 haneden 10. ve 11. haneleri hesaplar. */
function checkDigits(digits: readonly number[]): [number, number] {
  let odd = 0;
  let even = 0;
  for (let i = 0; i < 9; i++) {
    const digit = digits[i] ?? 0;
    if (i % 2 === 0) odd += digit;
    else even += digit;
  }
  const tenth = (((odd * 7 - even) % 10) + 10) % 10;
  const eleventh = (odd + even + tenth) % 10;
  return [tenth, eleventh];
}

/** Boşluk, tire ve noktaları siler. */
export function normalize(value: string | number): string {
  const input = toInput(value, true);
  return input === null ? "" : stripSeparators(input);
}

/**
 * TCKN'yi doğrular. Kurallar: 11 hane, ilk hane 0 olamaz, 10. ve 11. haneler
 * kontrol basamağıdır.
 *
 * @example
 * validate("10000000146"); // { ok: true, value: "10000000146" }
 * validate("10000000145"); // { ok: false, code: "CHECKSUM", ... }
 */
export function validate(value: string | number): Result<Tckn> {
  const input = toInput(value, true);
  if (input === null) return failure("FORMAT", { label: LABEL });
  const digits = stripSeparators(input);
  if (digits === "") return failure("EMPTY", { label: LABEL });
  if (!isDigits(digits)) return failure("INVALID_CHARS", { label: LABEL });
  if (digits.length !== LENGTH) return failure("LENGTH", { label: LABEL, expected: LENGTH });
  if (digits[0] === "0") return failure("FORMAT", { label: LABEL });
  const numbers = toDigits(digits);
  const [tenth, eleventh] = checkDigits(numbers);
  if (numbers[9] !== tenth || numbers[10] !== eleventh) return failure("CHECKSUM", { label: LABEL });
  return success(digits as Tckn);
}

export function isValid(value: string | number): boolean {
  return validate(value).ok;
}

/** Geçersiz girdide `TurkiyeError` fırlatır. */
export function parse(value: string | number): Tckn {
  return unwrap(validate(value));
}

/** Geçerli numarayı 11 hane olarak döner. Geçersiz girdide `normalize` sonucunu döner. */
export function format(value: string | number): string {
  const result = validate(value);
  return result.ok ? result.value : normalize(value);
}

/**
 * İlk 3 ve son 2 hane dışındakileri gizler.
 *
 * @example
 * mask("10000000146"); // "100******46"
 */
export function mask(value: string | number): string {
  const result = validate(value);
  if (!result.ok) return maskAll(normalize(value));
  return `${result.value.slice(0, 3)}******${result.value.slice(9)}`;
}

/** Numaranın türünü döner. Geçersiz numarada `null`. */
export function kind(value: string | number): TcknKind | null {
  const result = validate(value);
  if (!result.ok) return null;
  return result.value.startsWith("99") ? "foreign" : "citizen";
}

/**
 * Test ve örnek veri için geçerli bir numara üretir. Üretilen numaranın gerçek
 * bir kişiye ait olmadığı garanti edilmez; yalnız test amaçlı kullanılmalıdır.
 */
export function generate(options: GenerateOptions = {}): Tckn {
  const random = options.random ?? Math.random;
  const digits: number[] = options.foreign ? [9, 9] : [1 + randomInt(random, 9)];
  while (digits.length < 9) digits.push(randomInt(random, 10));
  digits.push(...checkDigits(digits));
  return digits.join("") as Tckn;
}

let cachedSchema: StandardSchemaV1<string | number, Tckn> | undefined;

/** Standard Schema uyumlu doğrulayıcı. */
export function schema(): StandardSchemaV1<string | number, Tckn> {
  cachedSchema ??= createSchema({ label: LABEL, accept: (value) => toInput(value, true), validate });
  return cachedSchema;
}
