import { TurkiyeError } from "../core/errors.ts";
import { formatMessage } from "../core/messages.ts";

const ONES = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"];
const TENS = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"];
const SCALES = ["", "bin", "milyon", "milyar", "trilyon", "katrilyon"];

function hundreds(value: number): string[] {
  const words: string[] = [];
  const hundred = Math.floor(value / 100);
  const ten = Math.floor((value % 100) / 10);
  const one = value % 10;
  if (hundred > 1) words.push(ONES[hundred] as string);
  if (hundred > 0) words.push("yüz");
  if (ten > 0) words.push(TENS[ten] as string);
  if (one > 0) words.push(ONES[one] as string);
  return words;
}

/** @internal Negatif olmayan güvenli tam sayıyı kelimelere ayırır. */
export function integerWords(value: number): string[] {
  if (value === 0) return ["sıfır"];
  const words: string[] = [];
  let rest = value;
  for (let scale = 0; rest > 0; scale++) {
    const group = rest % 1000;
    rest = Math.floor(rest / 1000);
    if (group === 0) continue;
    const part = scale === 1 && group === 1 ? [] : hundreds(group);
    if (scale > 0) part.push(SCALES[scale] as string);
    words.unshift(...part);
  }
  return words;
}

export interface NumberToWordsOptions {
  /** `true` ise kelimeler bitişik yazılır (çek ve senet yazımı). */
  readonly joined?: boolean;
}

/**
 * Tam sayıyı Türkçe yazıya çevirir.
 *
 * @throws {TurkiyeError} `RANGE`: sayı güvenli tam sayı değilse.
 *
 * @example
 * numberToWords(1984);                    // "bin dokuz yüz seksen dört"
 * numberToWords(-15);                     // "eksi on beş"
 * numberToWords(250, { joined: true });   // "ikiyüzelli"
 */
export function numberToWords(value: number, options: NumberToWordsOptions = {}): string {
  if (!Number.isSafeInteger(value)) {
    throw new TurkiyeError("RANGE", formatMessage("RANGE", { label: "Sayı" }));
  }
  const words = integerWords(Math.abs(value));
  if (value < 0) words.unshift("eksi");
  return words.join(options?.joined ? "" : " ");
}
