import { toText } from "../core/input.ts";
import { toLower } from "./case.ts";

// Türk alfabesi. q, w ve x yabancı kelimeler için en yakın harflerin arasına yerleştirilmiştir.
const ALPHABET = "abcçdefgğhıijklmnoöpqrsştuüvwxyz";
const LETTER_BASE = 0x10000;
const RANK = new Map<string, number>();
for (let i = 0; i < ALPHABET.length; i++) RANK.set(ALPHABET.charAt(i), LETTER_BASE + i);

const TURKISH_LETTERS = /[çğıöşü]/;

/** Karakterin sıralama değeri. Harf dışındaki karakterler harflerden önce gelir. */
function rank(char: string): number {
  const lower = toLower(char);
  const direct = RANK.get(lower);
  if (direct !== undefined) return direct;
  if (!TURKISH_LETTERS.test(lower)) {
    const base = RANK.get(lower.normalize("NFD").charAt(0));
    if (base !== undefined) return base;
  }
  return char.codePointAt(0) as number;
}

/** Bir metnin karşılaştırma anahtarı: karakterler ve sıralama değerleri. */
interface SortKey {
  readonly chars: readonly string[];
  readonly ranks: readonly number[];
}

function sortKey(value: string): SortKey {
  const chars = Array.from(value);
  return { chars, ranks: chars.map(rank) };
}

function compareKeys(left: SortKey, right: SortKey): number {
  const length = Math.min(left.ranks.length, right.ranks.length);
  for (let i = 0; i < length; i++) {
    const diff = (left.ranks[i] as number) - (right.ranks[i] as number);
    if (diff !== 0) return diff < 0 ? -1 : 1;
  }
  if (left.ranks.length !== right.ranks.length) return left.ranks.length < right.ranks.length ? -1 : 1;
  for (let i = 0; i < length; i++) {
    const diff = tieBreak(left.chars[i] as string, right.chars[i] as string);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Türk alfabesine göre karşılaştırır; `Array.prototype.sort` ile kullanılabilir.
 * Önce harf sırasına, eşitlikte büyük/küçük harf ve aksana bakılır. Çok sayıda
 * öğe sıralanırken `sort` fonksiyonu daha hızlıdır.
 *
 * @example
 * ["şeker", "çay", "su", "cam"].sort(compare); // ["cam", "çay", "su", "şeker"]
 */
export function compare(a: string, b: string): number {
  return compareKeys(sortKey(toText(a)), sortKey(toText(b)));
}

/** Harf sırası eşit olan karakterlerde aksansız ve küçük harf önce gelir. */
function tieBreak(a: string, b: string): number {
  if (a === b) return 0;
  const accent = Number(isAccented(a)) - Number(isAccented(b));
  if (accent !== 0) return accent;
  const upper = Number(a !== toLower(a)) - Number(b !== toLower(b));
  if (upper !== 0) return upper;
  return (a.codePointAt(0) as number) < (b.codePointAt(0) as number) ? -1 : 1;
}

function isAccented(char: string): boolean {
  return !TURKISH_LETTERS.test(toLower(char)) && char.normalize("NFD").length > 1;
}

/**
 * Diziyi Türk alfabesine göre sıralanmış yeni bir dizi olarak döner. Nesne
 * dizilerinde alan adı ya da değer seçen fonksiyon verilebilir. Girdi dizisi
 * değiştirilmez; eşit öğelerin sırası korunur.
 *
 * @example
 * sort(["Zeynep", "Çağla", "Can"]);            // ["Can", "Çağla", "Zeynep"]
 * sort(users, "name");
 * sort(users, (user) => user.city);
 */
export function sort(values: readonly string[]): string[];
export function sort<T>(values: readonly T[], key: keyof T | ((item: T) => string)): T[];
export function sort<T>(values: readonly T[], key?: keyof T | ((item: T) => string)): T[] {
  if (!Array.isArray(values)) throw new TypeError("sort bir dizi bekler");
  const select =
    key === undefined
      ? (item: T) => toText(item)
      : typeof key === "function"
        ? (item: T) => toText(key(item))
        : (item: T) => toText(item === null || item === undefined ? undefined : item[key]);
  // Anahtarlar her öğe için bir kez hesaplanır.
  const entries = values.map((item, index) => ({ item, index, key: sortKey(select(item)) }));
  entries.sort((a, b) => compareKeys(a.key, b.key) || a.index - b.index);
  return entries.map((entry) => entry.item);
}
