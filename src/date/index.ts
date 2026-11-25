import { TurkiyeError } from "../core/errors.ts";
import { formatMessage } from "../core/messages.ts";

/**
 * `Date` nesnesi ya da ISO 8601 biçiminde tarih metni: "YYYY-MM-DD" ya da
 * "YYYY-MM-DDTHH:mm", "YYYY-MM-DDTHH:mm:ss", "YYYY-MM-DDTHH:mm:ss.sssZ".
 * Saat dilimi verilmeyen metin yerel saate göre yorumlanır. Diğer biçimler
 * tarayıcılar arasında farklı yorumlandığı için kabul edilmez.
 */
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

const DEFAULT_PATTERN = "D MMMM YYYY dddd";
const DAY_MS = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/;

function invalidDate(): TurkiyeError {
  return new TurkiyeError("FORMAT", formatMessage("FORMAT", { label: "Tarih" }));
}

function rangeError(label: string): TurkiyeError {
  return new TurkiyeError("RANGE", formatMessage("RANGE", { label }));
}

/** Başka bir pencereden (iframe) gelen `Date` nesnelerini de tanır. */
function isDateObject(value: unknown): value is Date {
  return Object.prototype.toString.call(value) === "[object Date]";
}

function toDate(input: DateInput): Date {
  let date: Date;
  if (isDateObject(input)) {
    date = new Date(input.getTime());
  } else if (typeof input === "string") {
    const text = input.trim();
    const match = ISO_DATE.exec(text);
    if (match) {
      const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
      // setFullYear, 0-99 arası yılların 1900'lere kaydırılmasını önler.
      date = new Date(2000, 0, 1);
      date.setFullYear(year, month - 1, day);
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) throw invalidDate();
    } else if (ISO_DATE_TIME.test(text)) {
      date = new Date(text);
    } else {
      throw invalidDate();
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

/** Yerel takvim gününü 1970-01-01'den itibaren gün sayısına çevirir. Saat ve yaz saati etkisizdir. */
function dayFromParts(year: number, month: number, day: number): number {
  const utc = new Date(0);
  utc.setUTCFullYear(year, month, day);
  return Math.round(utc.getTime() / DAY_MS);
}

function dayNumber(date: Date): number {
  return dayFromParts(date.getFullYear(), date.getMonth(), date.getDate());
}

function yearOf(day: number): number {
  return new Date(day * DAY_MS).getUTCFullYear();
}

/** 0: Pazar ... 6: Cumartesi. 1970-01-01 Perşembe günüdür. */
function weekdayOf(day: number): number {
  return (((day + 4) % 7) + 7) % 7;
}

const MIN_DAY = dayFromParts(1, 0, 1);
const MAX_DAY = dayFromParts(9999, 11, 31);

function checkDay(day: number): void {
  if (!(day >= MIN_DAY && day <= MAX_DAY)) throw rangeError("Yıl");
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
export function format(input: DateInput, pattern?: string): string {
  const template = pattern ?? DEFAULT_PATTERN;
  if (typeof template !== "string") throw new TypeError("Tarih deseni metin olmalı");
  const date = toDate(input);
  const tokens: Readonly<Record<string, string>> = {
    YYYY: pad(date.getFullYear(), 4),
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
  return template.replace(/\[([^\]]*)\]|YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd|ddd|HH|H|mm|ss/g, (token, literal?: string) =>
    literal !== undefined ? literal : (tokens[token] as string),
  );
}

/**
 * Tarihi şu ana göre Türkçe ifade eder. Sunucuda üretilip tarayıcıda yeniden
 * çizilen sayfalarda iki tarafın aynı sonucu vermesi için `now` verilmelidir.
 *
 * @example
 * relative(new Date(Date.now() - 30_000));    // "az önce"
 * relative(new Date(Date.now() - 5 * 60_000)); // "5 dakika önce"
 * relative(tomorrow);                          // "yarın"
 * relative(threeDaysAgo);                      // "3 gün önce"
 */
export function relative(input: DateInput, now?: DateInput): string {
  const date = toDate(input);
  const reference = now === undefined ? new Date() : toDate(now);
  const seconds = (date.getTime() - reference.getTime()) / 1000;
  const future = seconds > 0;
  const span = (value: number, unit: string) => `${value} ${unit} ${future ? "sonra" : "önce"}`;
  const abs = Math.abs(seconds);

  if (abs < 45) return future ? "birazdan" : "az önce";
  if (abs < 45 * 60) return span(Math.max(1, Math.round(abs / 60)), "dakika");
  if (abs < 22 * 3600) return span(Math.round(abs / 3600), "saat");

  const days = Math.abs(dayNumber(date) - dayNumber(reference));
  if (days <= 1) return future ? "yarın" : "dün";
  if (days < 7) return span(days, "gün");
  if (days < 30) return span(Math.floor(days / 7), "hafta");
  if (days < 365) return span(Math.max(1, Math.floor(days / 30)), "ay");
  return span(Math.floor(days / 365), "yıl");
}

// Son kullanılan yılların listesi tutulur; önbellek boyutu sınırlıdır.
const HOLIDAY_CACHE_LIMIT = 32;
const holidayCache = new Map<number, readonly Holiday[]>();

/**
 * Yılın sabit tarihli resmî tatillerini döner. Dini bayramlar her yıl değiştiği
 * için listede yoktur.
 *
 * @example
 * holidays(2026)[0]; // { date: "2026-01-01", name: "Yılbaşı", half: false }
 */
export function holidays(year: number): readonly Holiday[] {
  if (!Number.isInteger(year) || year < 1 || year > 9999) throw rangeError("Yıl");
  let list = holidayCache.get(year);
  if (list === undefined) {
    list = Object.freeze(
      FIXED_HOLIDAYS.filter(([, , , , since]) => year >= since).map(([month, day, name, half]) =>
        Object.freeze({ date: `${pad(year, 4)}-${pad(month)}-${pad(day)}`, name, half }),
      ),
    );
    if (holidayCache.size >= HOLIDAY_CACHE_LIMIT) holidayCache.clear();
    holidayCache.set(year, list);
  }
  return list;
}

/** Tam gün tatillerin gün numaraları. */
function fixedHolidayDays(year: number): number[] {
  const days: number[] = [];
  for (const [month, day, , half, since] of FIXED_HOLIDAYS) {
    if (!half && year >= since) days.push(dayFromParts(year, month - 1, day));
  }
  return days;
}

interface Calendar {
  readonly weekend: ReadonlySet<number>;
  readonly extra: ReadonlySet<number>;
  readonly workdaysPerWeek: number;
}

function calendar(options: BusinessDayOptions | undefined): Calendar {
  const weekendList: unknown = options?.weekend ?? [0, 6];
  const holidayList: unknown = options?.holidays ?? [];
  if (!Array.isArray(weekendList)) throw new TypeError("weekend bir dizi olmalı");
  if (!Array.isArray(holidayList)) throw new TypeError("holidays bir dizi olmalı");
  for (const day of weekendList) {
    if (!Number.isInteger(day) || day < 0 || day > 6) throw rangeError("Hafta sonu günü");
  }
  const weekend = new Set<number>(weekendList as number[]);
  const extra = new Set<number>((holidayList as DateInput[]).map((value) => dayNumber(toDate(value))));
  return { weekend, extra, workdaysPerWeek: 7 - weekend.size };
}

function isFullHoliday(day: number, cal: Calendar): boolean {
  checkDay(day);
  return cal.extra.has(day) || fixedHolidayDays(yearOf(day)).includes(day);
}

function isWorkday(day: number, cal: Calendar): boolean {
  return !cal.weekend.has(weekdayOf(day)) && !isFullHoliday(day, cal);
}

/**
 * `from` hariç, `to` dahil aralıktaki iş günü sayısı (`from <= to`). Hafta
 * sayısı hesapla bulunur; uzun aralıklar da gün gün dolaşılmaz.
 */
function countWorkdays(from: number, to: number, cal: Calendar): number {
  if (to <= from) return 0;
  checkDay(from + 1);
  checkDay(to);
  const weeks = Math.floor((to - from) / 7);
  let count = weeks * cal.workdaysPerWeek;
  for (let day = from + weeks * 7 + 1; day <= to; day++) {
    if (!cal.weekend.has(weekdayOf(day))) count++;
  }
  const off = new Set<number>();
  for (const day of cal.extra) if (day > from && day <= to) off.add(day);
  for (let year = yearOf(from + 1); year <= yearOf(to); year++) {
    for (const day of fixedHolidayDays(year)) if (day > from && day <= to) off.add(day);
  }
  for (const day of off) if (!cal.weekend.has(weekdayOf(day))) count--;
  return count;
}

/**
 * Tam gün resmî tatil mi? 28 Ekim gibi yarım günler tatil sayılmaz.
 * `options.holidays` ile verilen günler de tatil sayılır.
 */
export function isHoliday(input: DateInput, options?: Pick<BusinessDayOptions, "holidays">): boolean {
  const day = dayNumber(toDate(input));
  return isFullHoliday(day, calendar(options?.holidays === undefined ? undefined : { holidays: options.holidays }));
}

/**
 * Hafta sonu ya da tam gün tatil değilse `true`.
 *
 * @example
 * isBusinessDay("2026-10-29"); // false (Cumhuriyet Bayramı)
 * isBusinessDay("2026-11-25"); // true
 */
export function isBusinessDay(input: DateInput, options?: BusinessDayOptions): boolean {
  return isWorkday(dayNumber(toDate(input)), calendar(options));
}

/**
 * Tarihe iş günü ekler; negatif değer geriye gider. Saat bilgisi korunur.
 *
 * @throws {TurkiyeError} `RANGE`: gün sayısı tam sayı değilse, haftanın her
 * günü hafta sonu sayılmışsa ya da sonuç 1-9999 yılları dışına çıkıyorsa.
 *
 * @example
 * addBusinessDays("2026-11-27", 1); // 30 Kasım 2026 Pazartesi
 * addBusinessDays("2026-03-19", 2, { holidays: ["2026-03-20"] }); // 24 Mart 2026
 */
export function addBusinessDays(input: DateInput, days: number, options?: BusinessDayOptions): Date {
  if (!Number.isSafeInteger(days)) throw rangeError("Gün sayısı");
  const date = toDate(input);
  const cal = calendar(options);
  if (days === 0) return date;
  if (cal.workdaysPerWeek === 0) throw rangeError("Hafta sonu günü");

  const step = days < 0 ? -1 : 1;
  let day = dayNumber(date);
  let remaining = Math.abs(days);
  while (remaining > 0) {
    // Tam haftalar, kalan iş gününü aşmayacak kadar tek adımda atlanır.
    const weeks = Math.floor((remaining - 1) / cal.workdaysPerWeek);
    if (weeks > 0) {
      const target = day + step * weeks * 7;
      remaining -= step > 0 ? countWorkdays(day, target, cal) : countWorkdays(target - 1, day - 1, cal);
      day = target;
    } else {
      day += step;
      if (isWorkday(day, cal)) remaining--;
    }
  }
  const result = new Date(day * DAY_MS);
  date.setFullYear(result.getUTCFullYear(), result.getUTCMonth(), result.getUTCDate());
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
export function businessDaysBetween(start: DateInput, end: DateInput, options?: BusinessDayOptions): number {
  const from = dayNumber(toDate(start));
  const to = dayNumber(toDate(end));
  const cal = calendar(options);
  return from <= to ? countWorkdays(from, to, cal) : -countWorkdays(to, from, cal);
}
