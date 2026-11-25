import type { Brand } from "../core/brand.ts";
import { group, isDigits, maskAll, toInput } from "../core/input.ts";
import { failure, type Result, success, unwrap } from "../core/result.ts";
import { createSchema, type StandardSchemaV1 } from "../core/schema.ts";
import { AREA_CODES } from "./data.ts";

/** Doğrulanmış telefon numarası, E.164 biçiminde: "+905321234567". */
export type Phone = Brand<string, "Phone">;

/**
 * - `mobile`: cep telefonu (5xx)
 * - `landline`: sabit hat (il alan kodu)
 * - `special`: 0850, 0800, 0900 ve 444 numaraları
 */
export type PhoneType = "mobile" | "landline" | "special";

/**
 * - `national`: "0532 123 45 67"
 * - `international`: "+90 532 123 45 67"
 * - `e164`: "+905321234567"
 */
export type PhoneFormat = "national" | "international" | "e164";

export interface AreaInfo {
  readonly code: string;
  readonly province: string;
}

const LABEL = "Telefon numarası";
const COUNTRY_CODE = "90";

/** Ayraçları ve ülke kodunu atarak ulusal numarayı (ör. "5321234567") çıkarır. */
function toNational(input: string): string {
  let digits = input.replace(/[\s.\-()/]/g, "");
  if (digits.startsWith("+")) {
    digits = digits.slice(1);
    if (digits.startsWith(COUNTRY_CODE)) return digits.slice(2);
    return `+${digits}`;
  }
  if (digits.startsWith(`00${COUNTRY_CODE}`)) return digits.slice(4);
  if (digits.length === 12 && digits.startsWith(COUNTRY_CODE)) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

function classify(national: string): PhoneType | null {
  if (/^444\d{4}$/.test(national)) return "special";
  if (national.length !== 10) return null;
  if (/^5[0-6]/.test(national)) return "mobile";
  if (/^(800|850|900)/.test(national)) return "special";
  if (AREA_CODES[national.slice(0, 3)] !== undefined) return "landline";
  return null;
}

/**
 * Numarayı E.164 biçimine çevirir. Tanınmayan girdide ayraçları silinmiş
 * değeri döner.
 *
 * @example
 * normalize("0532 123 45 67");  // "+905321234567"
 * normalize("+90 (532) 123-45-67"); // "+905321234567"
 */
export function normalize(value: string): string {
  const input = toInput(value);
  if (input === null) return "";
  const national = toNational(input);
  return isDigits(national) && classify(national) !== null ? `+${COUNTRY_CODE}${national}` : national;
}

/**
 * Türkiye telefon numarasını doğrular. Cep, sabit hat (il alan kodu), 0850,
 * 0800, 0900 ve 444 numaralarını kabul eder.
 */
export function validate(value: string): Result<Phone> {
  const input = toInput(value);
  if (input === null) return failure("FORMAT", { label: LABEL });
  const national = toNational(input);
  if (national === "") return failure("EMPTY", { label: LABEL });
  if (!isDigits(national)) {
    return /^\+\d+$/.test(national)
      ? failure("COUNTRY", { label: LABEL })
      : failure("INVALID_CHARS", { label: LABEL });
  }
  if (classify(national) === null) return failure("FORMAT", { label: LABEL });
  return success(`+${COUNTRY_CODE}${national}` as Phone);
}

export function isValid(value: string): boolean {
  return validate(value).ok;
}

/** Geçersiz girdide `TurkiyeError` fırlatır. */
export function parse(value: string): Phone {
  return unwrap(validate(value));
}

function nationalParts(national: string): string {
  return national.length === 7 ? group(national, [3, 1, 3]) : group(national, [3, 3, 2, 2]);
}

/**
 * Numarayı istenen biçimde yazar. Geçersiz girdide `normalize` sonucunu döner.
 *
 * @example
 * format("5321234567");                  // "0532 123 45 67"
 * format("5321234567", "international"); // "+90 532 123 45 67"
 * format("4441444");                     // "444 1 444"
 */
export function format(value: string, style: PhoneFormat = "national"): string {
  const result = validate(value);
  if (!result.ok) return normalize(value);
  const national = result.value.slice(3);
  if (style === "e164") return result.value;
  if (style === "international") return `+${COUNTRY_CODE} ${nationalParts(national)}`;
  return national.length === 7 ? nationalParts(national) : `0${nationalParts(national)}`;
}

/**
 * Önek ve son 2 hane dışındakileri gizler.
 *
 * @example
 * mask("05321234567"); // "0532 *** ** 67"
 */
export function mask(value: string): string {
  const result = validate(value);
  if (!result.ok) return maskAll(normalize(value));
  const formatted = format(result.value);
  const keepStart = formatted.startsWith("0") ? 4 : 3;
  const totalDigits = formatted.replace(/\D/g, "").length;
  let seen = 0;
  return formatted.replace(/\d/g, (digit) => {
    seen++;
    return seen <= keepStart || seen > totalDigits - 2 ? digit : "*";
  });
}

/** Numaranın türünü döner. Geçersiz numarada `null`. */
export function type(value: string): PhoneType | null {
  const result = validate(value);
  return result.ok ? classify(result.value.slice(3)) : null;
}

/**
 * Sabit hat numarasının alan kodunu ve ilini döner. Cep, özel ve geçersiz
 * numaralarda `null`.
 *
 * @example
 * area("0212 123 45 67"); // { code: "212", province: "İstanbul" }
 */
export function area(value: string): AreaInfo | null {
  const result = validate(value);
  if (!result.ok) return null;
  const national = result.value.slice(3);
  if (classify(national) !== "landline") return null;
  const code = national.slice(0, 3);
  return { code, province: AREA_CODES[code] as string };
}

let cachedSchema: StandardSchemaV1<string, Phone> | undefined;

/** Standard Schema uyumlu doğrulayıcı. */
export function schema(): StandardSchemaV1<string, Phone> {
  cachedSchema ??= createSchema({ label: LABEL, accept: (value) => toInput(value), validate });
  return cachedSchema;
}
