import { TurkiyeError } from "../core/errors.ts";
import { formatMessage } from "../core/messages.ts";

/** `Date` nesnesi ya da "YYYY-MM-DD" biçiminde tarih. Tarih metni yerel saate göre yorumlanır. */
export type DateInput = Date | string;

export interface Holiday {
  /** "YYYY-MM-DD" */
  readonly date: string;
  readonly name: string;
  /** `true` ise yarım gün (öğleden sonra) tatildir. */
  readonly half: boolean;
}

export interface BusinessDayOptions {
  /**
   * Resmî tatillere ek olarak tatil sayılacak günler. Dini bayramlar her yıl
   * değiştiği için kütüphanede yoktur; gerekiyorsa buradan verilir.
   */
  readonly holidays?: readonly DateInput[];
  /** Hafta sonu sayılan günler (0: Pazar, 6: Cumartesi). Varsayılan: [0, 6] */
  readonly weekend?: readonly number[];
}

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const MONTHS_SHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const DAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const DAYS_SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

// 2429 sayılı Kanun'daki sabit tarihli tatiller: [ay, gün, ad, yarım gün, ilk yıl]
const FIXED_HOLIDAYS: readonly (readonly [number, number, string, boolean, number])[] = [
  [1, 1, "Yılbaşı", false, 0],
  [4, 23, "Ulusal Egemenlik ve Çocuk Bayramı", false, 0],
  [5, 1, "Emek ve Dayanışma Günü", false, 2009],
  [5, 19, "Atatürk'ü Anma, Gençlik ve Spor Bayramı", false, 0],
  [7, 15, "Demokrasi ve Millî Birlik Günü", false, 2017],
  [8, 30, "Zafer Bayramı", false, 0],
  [10, 28, "Cumhuriyet Bayramı Arifesi", true, 0],
  [10, 29, "Cumhuriyet Bayramı", false, 0],
];

function invalidDate(): TurkiyeError {
  return new TurkiyeError("FORMAT", formatMessage("FORMAT", { label: "Tarih" }));
}

function toDate(input: DateInput): Date {
  let date: Date;
  if (input instanceof Date) {
    date = new Date(input.getTime());
  } else if (typeof input === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
    if (match) {
      const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
      date = new Date(year, month - 1, day);
      if (date.getMonth() !== month - 1 || date.getDate() !== day) throw invalidDate();
    } else {
      date = new Date(input);
    }
  } else {
    throw invalidDate();
  }
  if (Number.isNaN(date.getTime())) throw invalidDate();
  return date;
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Tarihi Türkçe yazar. Köşeli parantez içindeki metin olduğu gibi kalır.
 *
 * Desen öğeleri: `YYYY` 2026, `YY` 26, `MMMM` Kasım, `MMM` Kas, `MM` 11, `M` 11,
 * `DD` 05, `D` 5, `dddd` Çarşamba, `ddd` Çar, `HH` 09, `H` 9, `mm` 07, `ss` 03.
 *
 * @example
 * format("2026-11-25");                          // "25 Kasım 2026 Çarşamba"
 * format(new Date(2026, 0, 5, 9, 7), "DD.MM.YYYY HH:mm"); // "05.01.2026 09:07"
 * format("2026-11-25", "D MMMM [günü]");          // "25 Kasım günü"
 */
export function format(input: DateInput, pattern = "D MMMM YYYY dddd"): string {
  const date = toDate(input);
  const tokens: Readonly<Record<string, string>> = {
    YYYY: String(date.getFullYear()),
    YY: pad(date.getFullYear() % 100),
    MMMM: MONTHS[date.getMonth()] as string,
    MMM: MONTHS_SHORT[date.getMonth()] as string,
    MM: pad(date.getMonth() + 1),
    M: String(date.getMonth() + 1),
    DD: pad(date.getDate()),
    D: String(date.getDate()),
    dddd: DAYS[date.getDay()] as string,
    ddd: DAYS_SHORT[date.getDay()] as string,
    HH: pad(date.getHours()),
    H: String(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
  };
  return pattern.replace(/\[([^\]]*)\]|YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd|ddd|HH|H|mm|ss/g, (token, literal?: string) =>
    literal !== undefined ? literal : (tokens[token] as string),
  );
}

function calendarDays(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86_400_000);
}

/**
 * Tarihi şu ana göre Türkçe ifade eder.
 *
 * @example
 * relative(new Date(Date.now() - 30_000));    // "az önce"
 * relative(new Date(Date.now() - 5 * 60_000)); // "5 dakika önce"
 * relative(tomorrow);                          // "yarın"
 * relative(threeDaysAgo);                      // "3 gün önce"
 */
export function relative(input: DateInput, now: DateInput = new Date()): string {
  const date = toDate(input);
  const reference = toDate(now);
  const seconds = (date.getTime() - reference.getTime()) / 1000;
  const future = seconds > 0;
  const span = (value: number, unit: string) => `${value} ${unit} ${future ? "sonra" : "önce"}`;
  const abs = Math.abs(seconds);

  if (abs < 45) return future ? "birazdan" : "az önce";
  if (abs < 45 * 60) return span(Math.max(1, Math.round(abs / 60)), "dakika");
  if (abs < 22 * 3600) return span(Math.round(abs / 3600), "saat");

  const days = Math.abs(calendarDays(reference, date));
  if (days <= 1) return future ? "yarın" : "dün";
  if (days < 7) return span(days, "gün");
  if (days < 30) return span(Math.floor(days / 7), "hafta");
  if (days < 365) return span(Math.max(1, Math.floor(days / 30)), "ay");
  return span(Math.floor(days / 365), "yıl");
}

const holidayCache = new Map<number, readonly Holiday[]>();

/**
 * Yılın sabit tarihli resmî tatillerini döner. Dini bayramlar her yıl değiştiği
 * için listede yoktur.
 *
 * @example
 * holidays(2026)[0]; // { date: "2026-01-01", name: "Yılbaşı", half: false }
 */
export function holidays(year: number): readonly Holiday[] {
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new TurkiyeError("RANGE", formatMessage("RANGE", { label: "Yıl" }));
  }
  let list = holidayCache.get(year);
  if (list === undefined) {
    list = Object.freeze(
      FIXED_HOLIDAYS.filter(([, , , , since]) => year >= since).map(([month, day, name, half]) =>
        Object.freeze({ date: `${pad(year, 4)}-${pad(month)}-${pad(day)}`, name, half }),
      ),
    );
    holidayCache.set(year, list);
  }
  return list;
}

function extraKeys(options: BusinessDayOptions): Set<string> {
  return new Set((options.holidays ?? []).map((value) => dayKey(toDate(value))));
}

function isFullHoliday(date: Date, extra: Set<string>): boolean {
  const key = dayKey(date);
  return extra.has(key) || holidays(date.getFullYear()).some((holiday) => !holiday.half && holiday.date === key);
}

/**
 * Tam gün resmî tatil mi? 28 Ekim gibi yarım günler tatil sayılmaz.
 * `options.holidays` ile verilen günler de tatil sayılır.
 */
export function isHoliday(input: DateInput, options: Pick<BusinessDayOptions, "holidays"> = {}): boolean {
  return isFullHoliday(toDate(input), extraKeys(options));
}

function isWorkday(date: Date, extra: Set<string>, weekend: readonly number[]): boolean {
  return !weekend.includes(date.getDay()) && !isFullHoliday(date, extra);
}

/**
 * Hafta sonu ya da tam gün tatil değilse `true`.
 *
 * @example
 * isBusinessDay("2026-10-29"); // false (Cumhuriyet Bayramı)
 * isBusinessDay("2026-11-25"); // true
 */
export function isBusinessDay(input: DateInput, options: BusinessDayOptions = {}): boolean {
  return isWorkday(toDate(input), extraKeys(options), options.weekend ?? [0, 6]);
}

/**
 * Tarihe iş günü ekler; negatif değer geriye gider. Saat bilgisi korunur.
 *
 * @example
 * addBusinessDays("2026-11-27", 1); // 30 Kasım 2026 Pazartesi
 * addBusinessDays("2026-03-19", 2, { holidays: ["2026-03-20"] }); // 24 Mart 2026
 */
export function addBusinessDays(input: DateInput, days: number, options: BusinessDayOptions = {}): Date {
  if (!Number.isSafeInteger(days)) throw new TurkiyeError("RANGE", formatMessage("RANGE", { label: "Gün sayısı" }));
  const date = toDate(input);
  const extra = extraKeys(options);
  const weekend = options.weekend ?? [0, 6];
  const step = days < 0 ? -1 : 1;
  let remaining = Math.abs(days);
  while (remaining > 0) {
    date.setDate(date.getDate() + step);
    if (isWorkday(date, extra, weekend)) remaining--;
  }
  return date;
}

/**
 * İki tarih arasındaki iş günü sayısı. Başlangıç günü sayılmaz, bitiş günü
 * sayılır; böylece `addBusinessDays(a, businessDaysBetween(a, b))` b'nin iş günü
 * olduğu durumda b'yi verir. Bitiş başlangıçtan önceyse sonuç
 * `-businessDaysBetween(end, start)` olur.
 *
 * @example
 * businessDaysBetween("2026-11-27", "2026-12-04"); // 5
 */
export function businessDaysBetween(start: DateInput, end: DateInput, options: BusinessDayOptions = {}): number {
  const from = toDate(start);
  const to = toDate(end);
  const total = calendarDays(from, to);
  if (total < 0) return -businessDaysBetween(to, from, options);
  const extra = extraKeys(options);
  const weekend = options.weekend ?? [0, 6];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let count = 0;
  for (let i = 0; i < total; i++) {
    cursor.setDate(cursor.getDate() + 1);
    if (isWorkday(cursor, extra, weekend)) count++;
  }
  return count;
}
