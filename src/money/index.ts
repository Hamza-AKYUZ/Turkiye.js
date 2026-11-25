import { TurkiyeError } from "../core/errors.ts";
import { formatMessage } from "../core/messages.ts";
import { integerWords } from "../text/numbers.ts";

export interface FormatOptions {
  /** Para birimi gösterimi. Varsayılan: "₺" */
  readonly symbol?: "₺" | "TL" | "none";
  /** Ondalık hane sayısı (0-4). Varsayılan: 2 */
  readonly decimals?: number;
  /** Simgenin konumu. Varsayılan: "after" (1.234,56 ₺) */
  readonly position?: "before" | "after";
}

export interface ToWordsOptions {
  /** `true` ise kelimeler bitişik yazılır (çek ve senet yazımı). */
  readonly joined?: boolean;
}

export interface VatOptions {
  /** `true` ise tutar KDV dahildir. Varsayılan: `false` */
  readonly included?: boolean;
}

const LABEL = "Tutar";

function rangeError(label = LABEL): TurkiyeError {
  return new TurkiyeError("RANGE", formatMessage("RANGE", { label }));
}

/** Tutarı en küçük birime (ör. kuruş) çevirir; kayan nokta hatasını düzeltir. */
function toUnits(amount: number, decimals: number): number {
  if (typeof amount !== "number" || !Number.isFinite(amount)) throw rangeError();
  const scaled = Number((Math.abs(amount) * 10 ** decimals).toPrecision(15));
  const units = Math.round(scaled);
  if (!Number.isSafeInteger(units)) throw rangeError();
  return amount < 0 ? -units : units;
}

function fromKurus(kurus: number): number {
  return kurus / 100;
}

function checkRate(rate: number): number {
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate < 0) throw rangeError("KDV oranı");
  return rate;
}

/**
 * Tutarı Türkçe para biçiminde yazar. Binlik ayraç nokta, ondalık ayraç
 * virgüldür. Yuvarlama yarımda sıfırdan uzağa yapılır.
 *
 * @throws {TurkiyeError} `RANGE`: tutar sonlu bir sayı değilse.
 *
 * @example
 * format(1234.56);                                         // "1.234,56 ₺"
 * format(1234.5, { symbol: "TL" });                        // "1.234,50 TL"
 * format(1234.56, { position: "before" });                // "₺1.234,56"
 * format(-5, { symbol: "TL", position: "before" });        // "-TL 5,00"
 * format(1234.567, { decimals: 0, symbol: "none" });       // "1.235"
 */
export function format(amount: number, options: FormatOptions = {}): string {
  const decimals = options.decimals ?? 2;
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 4) throw rangeError("Ondalık hane sayısı");
  const units = toUnits(amount, decimals);
  const digits = String(Math.abs(units)).padStart(decimals + 1, "0");
  const integer = digits.slice(0, digits.length - decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const fraction = decimals > 0 ? `,${digits.slice(-decimals)}` : "";
  const sign = units < 0 ? "-" : "";
  const symbol = options.symbol ?? "₺";
  if (symbol === "none") return `${sign}${integer}${fraction}`;
  if (options.position === "before") {
    return `${sign}${symbol}${symbol === "TL" ? " " : ""}${integer}${fraction}`;
  }
  return `${sign}${integer}${fraction} ${symbol}`;
}

/**
 * Türkçe yazılmış tutarı sayıya çevirir. Para birimi (₺, TL, TRY) ve
 * boşluklar yok sayılır. Yalnız nokta varsa ve üçerli gruplar halindeyse binlik
 * ayraç, değilse ondalık ayraç kabul edilir.
 *
 * @throws {TurkiyeError} `EMPTY` ya da `FORMAT`: metin tutar olarak okunamazsa.
 *
 * @example
 * parse("1.234,56 TL"); // 1234.56
 * parse("₺1.234");      // 1234
 * parse("12.5");        // 12.5
 * parse("-0,75");       // -0.75
 */
export function parse(text: string): number {
  if (typeof text !== "string") throw new TurkiyeError("FORMAT", formatMessage("FORMAT", { label: LABEL }));
  const cleaned = text.replace(/₺|\bTL\b|\bTRY\b/gi, "").replace(/\s/g, "");
  if (cleaned === "") throw new TurkiyeError("EMPTY", formatMessage("EMPTY", { label: LABEL }));
  const match = /^([+-]?)(\d[\d.,]*)$/.exec(cleaned);
  if (match === null) throw new TurkiyeError("FORMAT", formatMessage("FORMAT", { label: LABEL }));
  const sign = match[1] === "-" ? -1 : 1;
  const body = match[2] as string;

  let normalized: string;
  if (body.includes(",")) {
    if (!/^\d{1,3}(\.\d{3})*,\d+$|^\d+,\d+$/.test(body)) {
      throw new TurkiyeError("FORMAT", formatMessage("FORMAT", { label: LABEL }));
    }
    normalized = body.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(body)) {
    normalized = body.replace(/\./g, "");
  } else if (/^\d+(\.\d+)?$/.test(body)) {
    normalized = body;
  } else {
    throw new TurkiyeError("FORMAT", formatMessage("FORMAT", { label: LABEL }));
  }
  return sign * Number(normalized);
}

/**
 * Tutarı yazıyla yazar. Kuruş 2 haneye yuvarlanır.
 *
 * @throws {TurkiyeError} `RANGE`: tutar sonlu bir sayı değilse.
 *
 * @example
 * toWords(123.5);                     // "yüz yirmi üç lira elli kuruş"
 * toWords(0.05);                      // "beş kuruş"
 * toWords(1250, { joined: true });    // "binikiyüzellilira"
 */
export function toWords(amount: number, options: ToWordsOptions = {}): string {
  const kurus = toUnits(amount, 2);
  const lira = Math.floor(Math.abs(kurus) / 100);
  const rest = Math.abs(kurus) % 100;
  const words: string[] = [];
  if (kurus < 0) words.push("eksi");
  if (lira > 0 || rest === 0) words.push(...integerWords(lira), "lira");
  if (rest > 0) words.push(...integerWords(rest), "kuruş");
  return words.join(options.joined ? "" : " ");
}

/**
 * Net tutara KDV ekler.
 *
 * @example
 * addVat(100, 20); // 120
 */
export function addVat(amount: number, rate: number): number {
  const kurus = toUnits(amount, 2);
  return fromKurus(Math.round((kurus * (100 + checkRate(rate))) / 100));
}

/**
 * KDV dahil tutardan net tutarı bulur.
 *
 * @example
 * removeVat(120, 20); // 100
 */
export function removeVat(amount: number, rate: number): number {
  const kurus = toUnits(amount, 2);
  return fromKurus(Math.round((kurus * 100) / (100 + checkRate(rate))));
}

/**
 * KDV tutarını hesaplar. Tutar varsayılan olarak net kabul edilir.
 *
 * @example
 * vatOf(100, 20);                      // 20
 * vatOf(120, 20, { included: true });  // 20
 */
export function vatOf(amount: number, rate: number, options: VatOptions = {}): number {
  const kurus = toUnits(amount, 2);
  const checked = checkRate(rate);
  const vat = options.included ? kurus - Math.round((kurus * 100) / (100 + checked)) : Math.round((kurus * checked) / 100);
  return fromKurus(vat);
}
