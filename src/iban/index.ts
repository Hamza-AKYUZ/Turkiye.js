import type { Brand } from "../core/brand.ts";
import { group, isDigits, maskAll, stripSeparators, toInput } from "../core/input.ts";
import { failure, type Result, success, unwrap } from "../core/result.ts";
import { createSchema, type StandardSchemaV1 } from "../core/schema.ts";

/** Doğrulanmış TR IBAN; boşluksuz, büyük harf, 26 karakter. */
export type Iban = Brand<string, "Iban">;

export interface IbanInfo {
  readonly country: "TR";
  readonly checkDigits: string;
  /** 5 haneli banka (EFT) kodu. */
  readonly bankCode: string;
  /** Rezerv alan, her zaman "0". */
  readonly reserved: string;
  readonly accountNumber: string;
}

const LABEL = "IBAN";
const LENGTH = 26;

/** ISO 13616 mod 97 kontrolü. */
function mod97(iban: string): number {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const char of rearranged) {
    const code = char.charCodeAt(0);
    const value = code >= 65 ? String(code - 55) : char;
    for (const digit of value) remainder = (remainder * 10 + (digit.charCodeAt(0) - 48)) % 97;
  }
  return remainder;
}

/**
 * Boşluk, tire ve noktaları siler, harfleri büyütür. Baştaki "IBAN" ve
 * "IBAN:" ön ekini kaldırır.
 *
 * @example
 * normalize("IBAN: tr33 0006-1005 1978 6457 8413 26"); // "TR330006100519786457841326"
 */
export function normalize(value: string): string {
  const input = toInput(value);
  if (input === null) return "";
  return stripSeparators(input.trim().replace(/^iban\s*:?/i, "")).toUpperCase();
}

/**
 * TR IBAN'ı doğrular. Kurallar: TR ile başlar, 26 karakter, 5 haneli banka
 * kodundan sonraki rezerv hane 0, mod 97 kontrolü 1.
 */
export function validate(value: string): Result<Iban> {
  if (toInput(value) === null) return failure("FORMAT", { label: LABEL });
  const iban = normalize(value);
  if (iban === "") return failure("EMPTY", { label: LABEL });
  if (!/^[A-Z0-9]+$/.test(iban)) return failure("INVALID_CHARS", { label: LABEL });
  if (!iban.startsWith("TR")) return failure("COUNTRY", { label: LABEL });
  if (iban.length !== LENGTH) return failure("LENGTH", { label: LABEL, expected: LENGTH });
  if (!isDigits(iban.slice(2)) || iban[9] !== "0") return failure("FORMAT", { label: LABEL });
  if (mod97(iban) !== 1) return failure("CHECKSUM", { label: LABEL });
  return success(iban as Iban);
}

export function isValid(value: string): boolean {
  return validate(value).ok;
}

/** Geçersiz girdide `TurkiyeError` fırlatır. */
export function parse(value: string): Iban {
  return unwrap(validate(value));
}

/**
 * Dörderli gruplar halinde yazar. Geçersiz girdide `normalize` sonucunu döner.
 *
 * @example
 * format("TR330006100519786457841326"); // "TR33 0006 1005 1978 6457 8413 26"
 */
export function format(value: string): string {
  const result = validate(value);
  return result.ok ? group(result.value, [4, 4, 4, 4, 4, 4]) : normalize(value);
}

/**
 * İlk 4 ve son 6 karakter dışındakileri gizler.
 *
 * @example
 * mask("TR330006100519786457841326"); // "TR33 **** **** **** **** 8413 26"
 */
export function mask(value: string): string {
  const result = validate(value);
  if (!result.ok) return maskAll(normalize(value));
  const iban = result.value;
  const masked = iban.slice(0, 4) + "*".repeat(LENGTH - 10) + iban.slice(LENGTH - 6);
  return group(masked, [4, 4, 4, 4, 4, 4]);
}

/**
 * 5 haneli banka (EFT) kodunu döner. Tam IBAN gerekmez; ilk 9 karakter yeterlidir.
 * Bu sayede kullanıcı yazarken banka, uygulamanın kendi listesinden gösterilebilir.
 *
 * @example
 * bankCode("TR33 0006 2"); // "00062"
 * bankCode("TR33 00");     // null
 */
export function bankCode(value: string): string | null {
  const iban = normalize(value);
  return /^TR\d{7}/.test(iban) ? iban.slice(4, 9) : null;
}

/** IBAN'ı parçalarına ayırır. Geçersiz girdide `null`. */
export function info(value: string): IbanInfo | null {
  const result = validate(value);
  if (!result.ok) return null;
  const iban = result.value;
  return {
    country: "TR",
    checkDigits: iban.slice(2, 4),
    bankCode: iban.slice(4, 9),
    reserved: iban.slice(9, 10),
    accountNumber: iban.slice(10),
  };
}

let cachedSchema: StandardSchemaV1<string, Iban> | undefined;

/** Standard Schema uyumlu doğrulayıcı. */
export function schema(): StandardSchemaV1<string, Iban> {
  cachedSchema ??= createSchema({ label: LABEL, accept: (value) => toInput(value), validate });
  return cachedSchema;
}
