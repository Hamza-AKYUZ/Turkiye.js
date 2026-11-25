import { toText } from "../core/input.ts";
import { toLower, toUpper } from "./case.ts";
import { integerWords } from "./numbers.ts";

/**
 * - `accusative`: belirtme (-ı): Ankara'yı
 * - `dative`: yönelme (-a): Ankara'ya
 * - `locative`: bulunma (-da): Ankara'da
 * - `ablative`: ayrılma (-dan): Ankara'dan
 * - `genitive`: ilgi (-ın): Ankara'nın
 * - `instrumental`: vasıta (-la): Ankara'yla
 */
export type GrammaticalCase = "accusative" | "dative" | "locative" | "ablative" | "genitive" | "instrumental";

export interface SuffixOptions {
  /**
   * Özel isim mi? Özel isim, sayı ve kısaltmalarda ek kesme işaretiyle ayrılır.
   * Varsayılan: kelime büyük harfle başlıyorsa, sayıysa ya da kısaltmaysa `true`.
   */
  readonly proper?: boolean;
  /**
   * Kısaltmanın okunuşu. `letters`: harf harf (THY: te-ha-ye), `word`: kelime
   * gibi (NATO). Varsayılan: kelimenin yapısından tahmin edilir.
   */
  readonly read?: "letters" | "word";
  /**
   * Cins isimlerde ünsüz yumuşaması (kitap: kitabı). Varsayılan: çok heceli ve
   * p, ç, k ile biten kelimelerde ve -nk ile bitenlerde uygulanır.
   */
  readonly soften?: boolean;
  /** Ünlü uyumuna uymayan kelimeler için (saat: saate, gol: golü). */
  readonly harmony?: "front" | "back";
}

const CASES: readonly unknown[] = ["accusative", "dative", "locative", "ablative", "genitive", "instrumental"];

const VOWELS = "aeıioöuüâîû";
const BACK = "aıouâû";
const ROUNDED = "oöuüû";
const HARD = "çfhkpsşt";
const SOFT: Readonly<Record<string, string>> = { p: "b", ç: "c", t: "d", k: "ğ", P: "B", Ç: "C", T: "D", K: "Ğ" };

const LETTER_NAMES: Readonly<Record<string, string>> = {
  a: "a", b: "be", c: "ce", ç: "çe", d: "de", e: "e", f: "fe", g: "ge", ğ: "ge", h: "he",
  ı: "ı", i: "i", j: "je", k: "ke", l: "le", m: "me", n: "ne", o: "o", ö: "ö", p: "pe",
  q: "kü", r: "re", s: "se", ş: "şe", t: "te", u: "u", ü: "ü", v: "ve", w: "ve", x: "iks",
  y: "ye", z: "ze",
};

function isVowel(char: string): boolean {
  return char !== "" && VOWELS.includes(char);
}

function vowelCount(value: string): number {
  let count = 0;
  for (const char of value) if (isVowel(char)) count++;
  return count;
}

/** Tamamı büyük harf olan kelimenin harf harf okunup okunmayacağını tahmin eder. */
function readAsLetters(token: string): boolean {
  const lower = toLower(token);
  if (Array.from(token).length <= 2 || vowelCount(lower) === 0) return true;
  const chars = Array.from(lower);
  const last = chars[chars.length - 1] as string;
  const beforeLast = chars[chars.length - 2] as string;
  return !isVowel(last) && !isVowel(beforeLast);
}

/** Sayının okunuşunu döner. Ondalıklı sayılarda virgülden sonraki kısım okunur. */
function numberSound(token: string): string {
  const digits = token.split(/[.,]/).pop() as string;
  const tail = digits.length > 15 ? digits.slice(-15) : digits;
  return integerWords(Number(tail)).join("");
}

/**
 * Kelimeye ses uyumuna göre hal eki ekler. Özel isim, sayı ve kısaltmalarda
 * kesme işareti kullanılır. Ek her zaman küçük harfle yazılır (NATO'ya).
 *
 * @example
 * suffix("Ankara", "dative");     // "Ankara'ya"
 * suffix("İstanbul", "locative"); // "İstanbul'da"
 * suffix("Kitap", "locative", { proper: false }); // "Kitapta"
 * suffix("kitap", "accusative");  // "kitabı"
 * suffix("5", "dative");          // "5'e"
 * suffix("40", "locative");       // "40'ta"
 * suffix("THY", "dative");        // "THY'ye"
 */
export function suffix(word: string, kind: GrammaticalCase, opts?: SuffixOptions): string {
  if (!CASES.includes(kind)) throw new TypeError(`Bilinmeyen hal adı: ${String(kind)}`);
  const options = opts ?? {};
  const base = toText(word).trim();
  const token = (base.split(/[\s-]+/).pop() as string).replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
  if (token === "") return base;

  const isNumber = /\d$/.test(token);
  const isUpper = token === toUpper(token) && /\p{L}/u.test(token);
  const isAbbreviation =
    !isNumber && (options.read === "letters" || (options.read === undefined && isUpper && readAsLetters(token)));
  const lastLetter = toLower(Array.from(token).pop() as string);

  const sound = isNumber ? numberSound(token) : isAbbreviation ? (LETTER_NAMES[lastLetter] ?? lastLetter) : toLower(token);
  const soundChars = Array.from(sound);
  const lastSound = soundChars[soundChars.length - 1] as string;
  const lastVowel = [...soundChars].reverse().find(isVowel) ?? "e";

  const back = options.harmony ? options.harmony === "back" : BACK.includes(lastVowel);
  const rounded = ROUNDED.includes(lastVowel);
  const two = back ? "a" : "e";
  const four = back ? (rounded ? "u" : "ı") : rounded ? "ü" : "i";
  const endsVowel = isVowel(lastSound);
  const buffer = endsVowel ? "y" : "";
  const d = HARD.includes(lastSound) ? "t" : "d";

  let ending: string;
  switch (kind) {
    case "accusative":
      ending = buffer + four;
      break;
    case "dative":
      ending = buffer + two;
      break;
    case "genitive":
      ending = `${endsVowel ? "n" : ""}${four}n`;
      break;
    case "locative":
      ending = d + two;
      break;
    case "ablative":
      ending = `${d}${two}n`;
      break;
    case "instrumental":
      ending = `${buffer}l${two}`;
      break;
  }

  const proper = options.proper ?? (isNumber || isAbbreviation || /^\p{Lu}/u.test(token));
  if (proper) return `${base}'${ending}`;

  const vowelInitial = isVowel(ending.charAt(0).toLocaleLowerCase());
  const lower = toLower(base);
  const defaultSoften = /nk$/.test(lower) || (vowelCount(lower) > 1 && /[pçk]$/.test(lower));
  if (vowelInitial && (options.soften ?? defaultSoften)) {
    const last = base.slice(-1);
    const softened = /[nN][kK]$/.test(base) ? (last === "k" ? "g" : "G") : (SOFT[last] ?? last);
    return base.slice(0, -1) + softened + ending;
  }
  return base + ending;
}
