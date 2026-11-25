import { isValid as isValidCard } from "../card/index.ts";
import { group } from "../core/input.ts";
import { isValid as isValidIban } from "../iban/index.ts";
import { isValid as isValidPhone } from "../phone/index.ts";
import { isValid as isValidTckn } from "../tckn/index.ts";
import { isValid as isValidPlate } from "../vehicle/plate.ts";
import { isValid as isValidVkn } from "../vkn/index.ts";
import { Mask } from "./base.ts";

function digitsOf(text: string): string {
  return text.replace(/\D/g, "");
}

/**
 * TC Kimlik No: yalnız rakam, en fazla 11 hane.
 *
 * @example
 * new TcknMask().input("100 000 001 46"); // { value: "10000000146", complete: true, ... }
 */
export class TcknMask extends Mask {
  protected clean(text: string): string {
    return digitsOf(text).slice(0, 11);
  }

  protected render(raw: string): string {
    return raw;
  }

  protected isComplete(raw: string): boolean {
    return isValidTckn(raw);
  }
}

/** Vergi Kimlik No: yalnız rakam, en fazla 10 hane. */
export class VknMask extends Mask {
  protected clean(text: string): string {
    return digitsOf(text).slice(0, 10);
  }

  protected render(raw: string): string {
    return raw;
  }

  protected isComplete(raw: string): boolean {
    return isValidVkn(raw);
  }
}

/**
 * TR IBAN: dörderli gruplar. Rakamla başlanırsa "TR" ön eki eklenir; baştaki
 * "IBAN:" yazısı atılır.
 *
 * @example
 * new IbanMask().input("tr3300061");  // value: "TR33 0006 1"
 * new IbanMask().input("3300061");    // value: "TR33 0006 1"
 */
export class IbanMask extends Mask {
  protected clean(text: string): string {
    const source = text.replace(/^\s*iban\s*:?/i, "").toUpperCase();
    let raw = "";
    for (const char of source) {
      if (raw.length >= 26) break;
      if (raw.length < 2) {
        if (/[A-Z]/.test(char)) raw += char;
        else if (/[0-9]/.test(char)) raw = `TR${char}`;
      } else if (/[0-9]/.test(char)) {
        raw += char;
      }
    }
    return raw;
  }

  protected render(raw: string): string {
    return group(raw, [4, 4, 4, 4, 4, 4]);
  }

  protected isComplete(raw: string): boolean {
    return isValidIban(raw);
  }
}

/**
 * Telefon: "0532 123 45 67" biçimi. Baştaki 0 kendiliğinden eklenir; "+90"
 * ile yapıştırılan numaralarda ülke kodu atılır. 444 ile başlayan numaralar
 * "444 1 234" biçiminde yazılır.
 *
 * @example
 * new PhoneMask().input("53212"); // value: "0532 12"
 */
export class PhoneMask extends Mask {
  protected clean(text: string): string {
    let digits = digitsOf(text);
    if (text.trim().startsWith("+") && digits.startsWith("90")) digits = digits.slice(2);
    else if (digits.startsWith("0090")) digits = digits.slice(4);
    else if (digits.length > 11 && digits.startsWith("90")) digits = digits.slice(2);
    if (digits.startsWith("444")) return digits.slice(0, 7);
    if (digits !== "" && !digits.startsWith("0")) digits = `0${digits}`;
    return digits.slice(0, 11);
  }

  protected render(raw: string): string {
    return raw.startsWith("444") ? group(raw, [3, 1, 3]) : group(raw, [4, 3, 2, 2]);
  }

  protected isComplete(raw: string): boolean {
    return isValidPhone(raw);
  }
}

/**
 * Kart numarası: Amex 4-6-5, diğerleri dörderli gruplar; en fazla 19 hane.
 *
 * @example
 * new CardMask().input("454359000000"); // value: "4543 5900 0000"
 */
export class CardMask extends Mask {
  protected clean(text: string): string {
    const digits = digitsOf(text);
    return digits.slice(0, /^3[47]/.test(digits) ? 15 : 19);
  }

  protected render(raw: string): string {
    return /^3[47]/.test(raw) ? group(raw, [4, 6, 5]) : group(raw, [4, 4, 4, 4]);
  }

  protected isComplete(raw: string): boolean {
    return isValidCard(raw);
  }
}

// Harf sayısına göre izin verilen en fazla rakam sayısı.
const PLATE_MAX_DIGITS: Readonly<Record<number, number>> = { 1: 5, 2: 4, 3: 3 };

/**
 * Plaka: "34 ABC 123" biçimi. İl kodu, harf ve rakam grupları sırayla
 * yazılır; Q, W ve X harfleri kabul edilmez.
 *
 * @example
 * new PlateMask().input("34abc1"); // value: "34 ABC 1"
 */
export class PlateMask extends Mask {
  protected clean(text: string): string {
    let code = "";
    let letters = "";
    let digits = "";
    for (const char of text.toUpperCase()) {
      const isDigit = char >= "0" && char <= "9";
      const isLetter = char >= "A" && char <= "Z" && !"QWX".includes(char);
      if (code.length < 2) {
        if (isDigit) code += char;
      } else if (digits === "" && isLetter && letters.length < 3) {
        letters += char;
      } else if (isDigit && letters !== "" && digits.length < (PLATE_MAX_DIGITS[letters.length] as number)) {
        digits += char;
      }
    }
    return code + letters + digits;
  }

  protected render(raw: string): string {
    const match = /^(\d{0,2})([A-Z]*)(\d*)$/.exec(raw);
    if (match === null) return raw;
    return [match[1], match[2], match[3]].filter((part) => part !== "").join(" ");
  }

  protected isComplete(raw: string): boolean {
    return isValidPlate(raw);
  }
}

export interface MoneyMaskOptions {
  /** Virgülden sonra yazılabilecek en fazla hane (0-4). Varsayılan: 2 */
  readonly decimals?: number;
}

// Kuruş hassasiyetinde güvenli tam sayı sınırını aşmamak için tam kısmın en fazla uzunluğu.
const MONEY_MAX_INTEGER_DIGITS = 13;

/**
 * Tutar: binlik ayraç nokta, ondalık ayraç virgül. Nokta tuşu ayraç sayılır
 * ve yok sayılır; ondalık kısım virgülle yazılır.
 *
 * @example
 * new MoneyMask().input("1234567,5"); // value: "1.234.567,5"
 */
export class MoneyMask extends Mask {
  protected override readonly separators: string = ".";
  private readonly decimals: number;

  constructor(options?: MoneyMaskOptions) {
    super();
    const decimals = options?.decimals ?? 2;
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 4) {
      throw new RangeError("decimals 0 ile 4 arasında tam sayı olmalı");
    }
    this.decimals = decimals;
  }

  protected clean(text: string): string {
    let integer = "";
    let fraction: string | null = null;
    for (const char of text) {
      if (char >= "0" && char <= "9") {
        if (fraction === null) {
          if (integer.length < MONEY_MAX_INTEGER_DIGITS) integer = integer === "0" ? char : integer + char;
        } else if (fraction.length < this.decimals) {
          fraction += char;
        }
      } else if (char === "," && fraction === null && this.decimals > 0) {
        fraction = "";
      }
    }
    if (fraction === null) return integer;
    return `${integer === "" ? "0" : integer},${fraction}`;
  }

  protected render(raw: string): string {
    const [integer = "", fraction] = raw.split(",");
    const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return fraction === undefined ? grouped : `${grouped},${fraction}`;
  }

  protected isComplete(raw: string): boolean {
    return !raw.endsWith(",");
  }

  /** Son girdinin sayı değeri. Boş girdide `null`. */
  toNumber(): number | null {
    const raw = this.state.raw;
    if (raw === "") return null;
    return Number(raw.replace(",", "."));
  }
}

/** `createMask` ile oluşturulabilecek maske türleri. */
export type MaskKind = "tckn" | "vkn" | "iban" | "phone" | "card" | "plate" | "money";

/**
 * Türün adıyla maske oluşturur.
 *
 * @example
 * const mask = createMask("iban");
 * const money = createMask("money", { decimals: 0 });
 */
export function createMask(kind: "money", options?: MoneyMaskOptions): MoneyMask;
export function createMask(kind: MaskKind, options?: MoneyMaskOptions): Mask;
export function createMask(kind: MaskKind, options?: MoneyMaskOptions): Mask {
  switch (kind) {
    case "tckn":
      return new TcknMask();
    case "vkn":
      return new VknMask();
    case "iban":
      return new IbanMask();
    case "phone":
      return new PhoneMask();
    case "card":
      return new CardMask();
    case "plate":
      return new PlateMask();
    case "money":
      return new MoneyMask(options);
    default:
      throw new TypeError(`Bilinmeyen maske türü: ${String(kind)}`);
  }
}
