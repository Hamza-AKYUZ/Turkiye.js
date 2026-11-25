import type { Brand } from "../core/brand.ts";
import { group, isDigits, maskAll, stripSeparators, toInput } from "../core/input.ts";
import { failure, type Result, success, unwrap } from "../core/result.ts";
import { createSchema, type StandardSchemaV1 } from "../core/schema.ts";

/** Doğrulanmış kart numarası; yalnız rakam. */
export type Card = Brand<string, "Card">;

export type CardBrand = "visa" | "mastercard" | "troy" | "amex";

const LABEL = "Kart numarası";
const MIN_LENGTH = 12;
const MAX_LENGTH = 19;

const LENGTHS: Readonly<Record<CardBrand, readonly number[]>> = {
  visa: [13, 16, 19],
  mastercard: [16],
  troy: [16],
  amex: [15],
};

function detectBrand(digits: string): CardBrand | null {
  if (digits.startsWith("4")) return "visa";
  if (/^3[47]/.test(digits)) return "amex";
  if (digits.startsWith("9792")) return "troy";
  if (/^5[1-5]/.test(digits)) return "mastercard";
  const prefix = Number(digits.slice(0, 4));
  if (digits.length >= 4 && prefix >= 2221 && prefix <= 2720) return "mastercard";
  return null;
}

function luhn(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits.charCodeAt(i) - 48;
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

function lengthText(lengths: readonly number[]): string {
  if (lengths.length === 1) return String(lengths[0]);
  return `${lengths.slice(0, -1).join(", ")} veya ${lengths[lengths.length - 1]}`;
}

/** Boşluk, tire ve noktaları siler. */
export function normalize(value: string): string {
  const input = toInput(value);
  return input === null ? "" : stripSeparators(input);
}

/**
 * Kart numarasını doğrular. Kurallar: kart ağına göre uzunluk (bilinmeyen ağda
 * 12-19 hane) ve Luhn kontrolü.
 */
export function validate(value: string): Result<Card> {
  if (toInput(value) === null) return failure("FORMAT", { label: LABEL });
  const digits = normalize(value);
  if (digits === "") return failure("EMPTY", { label: LABEL });
  if (!isDigits(digits)) return failure("INVALID_CHARS", { label: LABEL });
  const network = detectBrand(digits);
  if (network === null) {
    if (digits.length < MIN_LENGTH || digits.length > MAX_LENGTH) {
      return failure("LENGTH", { label: LABEL, expected: `${MIN_LENGTH} ile ${MAX_LENGTH} arası` });
    }
  } else if (!LENGTHS[network].includes(digits.length)) {
    return failure("LENGTH", { label: LABEL, expected: lengthText(LENGTHS[network]) });
  }
  if (!luhn(digits)) return failure("CHECKSUM", { label: LABEL });
  return success(digits as Card);
}

export function isValid(value: string): boolean {
  return validate(value).ok;
}

/** Geçersiz girdide `TurkiyeError` fırlatır. */
export function parse(value: string): Card {
  return unwrap(validate(value));
}

function groupsFor(digits: string): number[] {
  return detectBrand(digits) === "amex" ? [4, 6, 5] : [4, 4, 4, 4];
}

/**
 * Kart numarasını gruplar halinde yazar. Amex 4-6-5, diğerleri dörderli.
 * Geçersiz girdide `normalize` sonucunu döner.
 *
 * @example
 * format("4543590000000006"); // "4543 5900 0000 0006"
 */
export function format(value: string): string {
  const result = validate(value);
  return result.ok ? group(result.value, groupsFor(result.value)) : normalize(value);
}

/**
 * İlk 4 ve son 4 hane dışındakileri gizler.
 *
 * @example
 * mask("4543590000000006"); // "4543 **** **** 0006"
 */
export function mask(value: string): string {
  const result = validate(value);
  if (!result.ok) return maskAll(normalize(value));
  const digits = result.value;
  const masked = digits.slice(0, 4) + "*".repeat(digits.length - 8) + digits.slice(-4);
  return group(masked, groupsFor(digits));
}

/**
 * Kart ağını numaranın başından belirler. Tam numara gerekmez; kullanıcı
 * yazarken kullanılabilir.
 *
 * @example
 * brand("4543 59"); // "visa"
 * brand("9792");    // "troy"
 */
export function brand(value: string): CardBrand | null {
  const digits = normalize(value);
  return isDigits(digits) ? detectBrand(digits) : null;
}

function toInteger(value: string | number): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  return /^\d{1,4}$/.test(text) ? Number(text) : null;
}

/**
 * Son kullanma tarihinin geçmediğini kontrol eder. Kart, belirtilen ayın son
 * gününe kadar geçerlidir. Yıl 2 ya da 4 haneli verilebilir.
 *
 * @example
 * isExpiryValid(12, 30);   // 2030 Aralık sonuna kadar geçerli
 * isExpiryValid("05", "2024");
 */
export function isExpiryValid(month: string | number, year: string | number, now: Date = new Date()): boolean {
  const m = toInteger(month);
  const rawYear = toInteger(year);
  if (m === null || rawYear === null || m < 1 || m > 12) return false;
  const text = String(year).trim();
  if (text.length !== 2 && text.length !== 4) return false;
  const y = text.length === 2 ? 2000 + rawYear : rawYear;
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return y > currentYear || (y === currentYear && m >= currentMonth);
}

/**
 * Güvenlik kodunu (CVV/CVC) kontrol eder. Amex 4, diğer ağlar 3 hanedir.
 * Ağ verilmezse 3 ya da 4 hane kabul edilir.
 */
export function isCvvValid(cvv: string, network?: CardBrand | null): boolean {
  if (typeof cvv !== "string" || !isDigits(cvv)) return false;
  if (network === "amex") return cvv.length === 4;
  if (network) return cvv.length === 3;
  return cvv.length === 3 || cvv.length === 4;
}

let cachedSchema: StandardSchemaV1<string, Card> | undefined;

/** Standard Schema uyumlu doğrulayıcı. */
export function schema(): StandardSchemaV1<string, Card> {
  cachedSchema ??= createSchema({ label: LABEL, accept: (value) => toInput(value), validate });
  return cachedSchema;
}
