import { type Province, province as provinceByCode } from "../address/index.ts";
import type { Brand } from "../core/brand.ts";
import { toInput } from "../core/input.ts";
import { failure, type Result, success, unwrap } from "../core/result.ts";
import { createSchema, type StandardSchemaV1 } from "../core/schema.ts";

/** Doğrulanmış plaka; boşluksuz, büyük harf: "34ABC123". */
export type Plate = Brand<string, "Plate">;

const LABEL = "Plaka";

// Harf sayısına göre rakam grubunun izin verilen uzunlukları.
const DIGITS_BY_LETTERS: Readonly<Record<number, readonly number[]>> = {
  1: [4, 5],
  2: [3, 4],
  3: [2, 3],
};

/** Boşluk ve tireleri siler, harfleri büyütür. */
export function normalize(value: string): string {
  const input = toInput(value);
  return input === null ? "" : input.replace(/[\s.-]/g, "").toUpperCase();
}

function split(plate: string): [string, string, string] | null {
  const match = /^(\d{2})([A-Z]{1,3})(\d{2,5})$/.exec(plate);
  return match ? [match[1] as string, match[2] as string, match[3] as string] : null;
}

/**
 * Türkiye araç plakasını doğrular. Kurallar: il kodu 01-81; 1 harfte 4-5,
 * 2 harfte 3-4, 3 harfte 2-3 rakam. Q, W ve X harfleri kullanılmaz.
 *
 * @example
 * validate("34 ABC 123"); // { ok: true, value: "34ABC123" }
 */
export function validate(value: string): Result<Plate> {
  if (toInput(value) === null) return failure("FORMAT", { label: LABEL });
  const plate = normalize(value);
  if (plate === "") return failure("EMPTY", { label: LABEL });
  if (!/^[A-Z0-9]+$/.test(plate)) return failure("INVALID_CHARS", { label: LABEL });
  const parts = split(plate);
  if (parts === null) return failure("FORMAT", { label: LABEL });
  const [code, letters, digits] = parts;
  if (Number(code) < 1 || Number(code) > 81) return failure("RANGE", { label: LABEL });
  if (/[QWX]/.test(letters)) return failure("INVALID_CHARS", { label: LABEL });
  if (!(DIGITS_BY_LETTERS[letters.length] as readonly number[]).includes(digits.length)) {
    return failure("FORMAT", { label: LABEL });
  }
  return success(plate as Plate);
}

export function isValid(value: string): boolean {
  return validate(value).ok;
}

/** Geçersiz girdide `TurkiyeError` fırlatır. */
export function parse(value: string): Plate {
  return unwrap(validate(value));
}

/**
 * Plakayı "34 ABC 123" biçiminde yazar. Geçersiz girdide `normalize` sonucunu döner.
 */
export function format(value: string): string {
  const result = validate(value);
  return result.ok ? (split(result.value) as string[]).join(" ") : normalize(value);
}

/**
 * Plakanın ait olduğu ili döner. Geçersiz plakada `null`.
 *
 * @example
 * province("34 ABC 123"); // { code: 34, name: "İstanbul" }
 */
export function province(value: string): Province | null {
  const result = validate(value);
  return result.ok ? provinceByCode(Number(result.value.slice(0, 2))) : null;
}

let cachedSchema: StandardSchemaV1<string, Plate> | undefined;

/** Standard Schema uyumlu doğrulayıcı. */
export function schema(): StandardSchemaV1<string, Plate> {
  cachedSchema ??= createSchema({ label: LABEL, accept: (value) => toInput(value), validate });
  return cachedSchema;
}
