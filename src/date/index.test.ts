import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TurkiyeError } from "../core/errors.ts";
import * as date from "./index.ts";

const isCode = (code: string) => (e: unknown) => e instanceof TurkiyeError && e.code === code;

describe("date.format", () => {
  it("varsayılan desenle yazar", () => {
    assert.equal(date.format("2026-11-25"), "25 Kasım 2026 Çarşamba");
    assert.equal(date.format(new Date(2026, 0, 1)), "1 Ocak 2026 Perşembe");
  });

  it("desen öğelerini doldurur", () => {
    const value = new Date(2026, 0, 5, 9, 7, 3);
    assert.equal(date.format(value, "DD.MM.YYYY HH:mm:ss"), "05.01.2026 09:07:03");
    assert.equal(date.format(value, "D M YY H"), "5 1 26 9");
    assert.equal(date.format(value, "MMM ddd"), "Oca Pzt");
    assert.equal(date.format(value, "MMMM dddd"), "Ocak Pazartesi");
  });

  it("köşeli parantez içini olduğu gibi bırakır", () => {
    assert.equal(date.format("2026-11-25", "D MMMM [günü saat] HH"), "25 Kasım günü saat 00");
  });

  it("tüm ay ve gün adlarını kullanır", () => {
    const months = Array.from({ length: 12 }, (_, i) => date.format(new Date(2026, i, 1), "MMMM"));
    assert.deepEqual(months, ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]);
    const days = Array.from({ length: 7 }, (_, i) => date.format(new Date(2026, 10, 22 + i), "dddd"));
    assert.deepEqual(days, ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"]);
  });

  it("tarih metnini ve ISO zaman damgasını kabul eder", () => {
    assert.equal(date.format("2026-11-25T10:30:00", "HH:mm"), "10:30");
  });

  it("geçersiz tarihte FORMAT hatası fırlatır", () => {
    for (const value of ["2026-02-30", "2026-13-01", "yarın", "", new Date(Number.NaN), 5 as never]) {
      assert.throws(() => date.format(value), isCode("FORMAT"), String(value));
    }
  });

  it("girdi tarihini değiştirmez", () => {
    const value = new Date(2026, 10, 27);
    date.addBusinessDays(value, 3);
    assert.equal(value.getDate(), 27);
  });
});

describe("date.relative", () => {
  const now = new Date(2026, 10, 25, 12, 0, 0);
  const at = (ms: number) => date.relative(new Date(now.getTime() + ms), now);

  it("kısa süreleri yazar", () => {
    assert.equal(at(-30_000), "az önce");
    assert.equal(at(30_000), "birazdan");
    assert.equal(at(-50_000), "1 dakika önce");
    assert.equal(at(-5 * 60_000), "5 dakika önce");
    assert.equal(at(10 * 60_000), "10 dakika sonra");
    assert.equal(at(-3 * 3_600_000), "3 saat önce");
    assert.equal(at(13 * 3_600_000), "13 saat sonra");
  });

  it("günleri takvime göre yazar", () => {
    assert.equal(at(-24 * 3_600_000), "dün");
    assert.equal(at(24 * 3_600_000), "yarın");
    assert.equal(at(-3 * 86_400_000), "3 gün önce");
    assert.equal(at(5 * 86_400_000), "5 gün sonra");
    assert.equal(at(-10 * 86_400_000), "1 hafta önce");
    assert.equal(at(-60 * 86_400_000), "2 ay önce");
    assert.equal(at(40 * 86_400_000), "1 ay sonra");
    assert.equal(at(-400 * 86_400_000), "1 yıl önce");
    assert.equal(at(-800 * 86_400_000), "2 yıl önce");
  });

  it("şimdiki zaman verilmezse bugünü kullanır", () => {
    assert.equal(date.relative(new Date()), "az önce");
  });
});

describe("date.holidays", () => {
  it("sabit resmî tatilleri döner", () => {
    assert.deepEqual(date.holidays(2026), [
      { date: "2026-01-01", name: "Yılbaşı", half: false },
      { date: "2026-04-23", name: "Ulusal Egemenlik ve Çocuk Bayramı", half: false },
      { date: "2026-05-01", name: "Emek ve Dayanışma Günü", half: false },
      { date: "2026-05-19", name: "Atatürk'ü Anma, Gençlik ve Spor Bayramı", half: false },
      { date: "2026-07-15", name: "Demokrasi ve Millî Birlik Günü", half: false },
      { date: "2026-08-30", name: "Zafer Bayramı", half: false },
      { date: "2026-10-28", name: "Cumhuriyet Bayramı Arifesi", half: true },
      { date: "2026-10-29", name: "Cumhuriyet Bayramı", half: false },
    ]);
  });

  it("tatillerin yürürlük yılına uyar", () => {
    const names = (year: number) => date.holidays(year).map((h) => h.name);
    assert.ok(!names(2016).includes("Demokrasi ve Millî Birlik Günü"));
    assert.ok(names(2017).includes("Demokrasi ve Millî Birlik Günü"));
    assert.ok(!names(2008).includes("Emek ve Dayanışma Günü"));
    assert.ok(names(2009).includes("Emek ve Dayanışma Günü"));
  });

  it("aynı yıl için aynı listeyi döner", () => {
    assert.equal(date.holidays(2030), date.holidays(2030));
    assert.ok(Object.isFrozen(date.holidays(2030)));
  });

  it("geçersiz yılda RANGE hatası fırlatır", () => {
    for (const year of [0, 10000, 2026.5, Number.NaN]) assert.throws(() => date.holidays(year), isCode("RANGE"));
  });
});

describe("date.isHoliday ve isBusinessDay", () => {
  it("tam gün tatilleri tanır, yarım günü tatil saymaz", () => {
    assert.equal(date.isHoliday("2026-10-29"), true);
    assert.equal(date.isHoliday("2026-10-28"), false);
    assert.equal(date.isHoliday("2026-11-25"), false);
    assert.equal(date.isHoliday("2026-03-20", { holidays: ["2026-03-20"] }), true);
    assert.equal(date.isHoliday(new Date(2026, 3, 23, 15, 30)), true);
  });

  it("hafta sonu ve tatilleri iş günü saymaz", () => {
    assert.equal(date.isBusinessDay("2026-11-25"), true);
    assert.equal(date.isBusinessDay("2026-11-28"), false);
    assert.equal(date.isBusinessDay("2026-11-29"), false);
    assert.equal(date.isBusinessDay("2026-10-29"), false);
    assert.equal(date.isBusinessDay("2026-10-28"), true);
    assert.equal(date.isBusinessDay("2026-11-28", { weekend: [0] }), true);
    assert.equal(date.isBusinessDay("2026-11-25", { holidays: [new Date(2026, 10, 25)] }), false);
  });
});

describe("date.addBusinessDays ve businessDaysBetween", () => {
  it("hafta sonu ve tatilleri atlar", () => {
    assert.equal(date.format(date.addBusinessDays("2026-11-27", 1), "YYYY-MM-DD"), "2026-11-30");
    assert.equal(date.format(date.addBusinessDays("2026-11-25", 5), "YYYY-MM-DD"), "2026-12-02");
    assert.equal(date.format(date.addBusinessDays("2026-10-27", 2), "YYYY-MM-DD"), "2026-10-30");
    assert.equal(date.format(date.addBusinessDays("2026-11-30", -1), "YYYY-MM-DD"), "2026-11-27");
    assert.equal(date.format(date.addBusinessDays("2026-11-28", 0), "YYYY-MM-DD"), "2026-11-28");
  });

  it("verilen ek tatilleri ve hafta sonu ayarını kullanır", () => {
    const bayram = ["2026-03-20", "2026-03-21", "2026-03-22"];
    assert.equal(date.format(date.addBusinessDays("2026-03-19", 2, { holidays: bayram }), "YYYY-MM-DD"), "2026-03-24");
    assert.equal(date.format(date.addBusinessDays("2026-11-27", 1, { weekend: [0] }), "YYYY-MM-DD"), "2026-11-28");
  });

  it("saat bilgisini korur", () => {
    const result = date.addBusinessDays(new Date(2026, 10, 27, 14, 30), 1);
    assert.equal(date.format(result, "YYYY-MM-DD HH:mm"), "2026-11-30 14:30");
  });

  it("gün sayısı tam sayı değilse RANGE hatası fırlatır", () => {
    assert.throws(() => date.addBusinessDays("2026-11-25", 1.5), isCode("RANGE"));
  });

  it("iki tarih arasındaki iş günlerini sayar", () => {
    assert.equal(date.businessDaysBetween("2026-11-27", "2026-12-04"), 5);
    assert.equal(date.businessDaysBetween("2026-12-04", "2026-11-27"), -5);
    assert.equal(date.businessDaysBetween("2026-11-25", "2026-11-25"), 0);
    assert.equal(date.businessDaysBetween("2026-10-27", "2026-10-30"), 2);
    assert.equal(date.businessDaysBetween("2026-03-19", "2026-03-24", { holidays: ["2026-03-20"] }), 2);
  });

  it("addBusinessDays ile tutarlıdır", () => {
    for (let n = 1; n <= 40; n++) {
      const end = date.addBusinessDays("2026-12-20", n);
      assert.equal(date.businessDaysBetween("2026-12-20", end), n);
    }
  });
});
