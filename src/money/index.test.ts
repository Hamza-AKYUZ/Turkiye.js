import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TurkiyeError } from "../core/errors.ts";
import * as money from "./index.ts";

const isCode = (code: string) => (e: unknown) => e instanceof TurkiyeError && e.code === code;

describe("money.format", () => {
  it("Türkçe para biçiminde yazar", () => {
    assert.equal(money.format(1234.56), "1.234,56 ₺");
    assert.equal(money.format(0), "0,00 ₺");
    assert.equal(money.format(1_000_000), "1.000.000,00 ₺");
    assert.equal(money.format(-1234.567), "-1.234,57 ₺");
    assert.equal(money.format(999.999), "1.000,00 ₺");
  });

  it("kayan nokta hatalarını doğru yuvarlar", () => {
    assert.equal(money.format(1.005), "1,01 ₺");
    assert.equal(money.format(0.1 + 0.2), "0,30 ₺");
    assert.equal(money.format(0.005), "0,01 ₺");
    assert.equal(money.format(-0.001), "0,00 ₺");
  });

  it("simge, konum ve ondalık seçenekleri", () => {
    assert.equal(money.format(1234.5, { symbol: "TL" }), "1.234,50 TL");
    assert.equal(money.format(1234.56, { position: "before" }), "₺1.234,56");
    assert.equal(money.format(1234.56, { symbol: "TL", position: "before" }), "TL 1.234,56");
    assert.equal(money.format(-5, { symbol: "TL", position: "before" }), "-TL 5,00");
    assert.equal(money.format(1234.567, { decimals: 0, symbol: "none" }), "1.235");
    assert.equal(money.format(0.5, { decimals: 4, symbol: "none" }), "0,5000");
    assert.equal(money.format(12, { decimals: 1 }), "12,0 ₺");
  });

  it("hatalı değerlerde RANGE hatası fırlatır", () => {
    assert.throws(() => money.format(Number.NaN), isCode("RANGE"));
    assert.throws(() => money.format(Number.POSITIVE_INFINITY), isCode("RANGE"));
    assert.throws(() => money.format("5" as never), isCode("RANGE"));
    assert.throws(() => money.format(1e15), isCode("RANGE"));
    assert.throws(() => money.format(1, { decimals: 5 }), isCode("RANGE"));
    assert.throws(() => money.format(1, { decimals: 1.5 }), isCode("RANGE"));
  });
});

describe("money.parse", () => {
  it("Türkçe yazılmış tutarları okur", () => {
    const cases: [string, number][] = [
      ["1.234,56 TL", 1234.56],
      ["₺1.234", 1234],
      ["1 234,56 ₺", 1234.56],
      ["1234,5", 1234.5],
      ["-0,75", -0.75],
      ["+10", 10],
      ["TRY 10", 10],
      ["10 try", 10],
      ["1.234.567", 1234567],
      ["12.5", 12.5],
      ["0", 0],
    ];
    for (const [input, expected] of cases) assert.equal(money.parse(input), expected, input);
  });

  it("okunamayan metinde hata fırlatır", () => {
    assert.throws(() => money.parse(""), isCode("EMPTY"));
    assert.throws(() => money.parse(" TL "), isCode("EMPTY"));
    for (const input of ["abc", "1,234.56", "1.23,4", "1..2", "12.3.4", "1,2,3", "--1"]) {
      assert.throws(() => money.parse(input), isCode("FORMAT"), input);
    }
    assert.throws(() => money.parse(5 as never), isCode("FORMAT"));
  });
});

describe("money.toWords", () => {
  it("tutarı yazıyla yazar", () => {
    assert.equal(money.toWords(123.5), "yüz yirmi üç lira elli kuruş");
    assert.equal(money.toWords(0.05), "beş kuruş");
    assert.equal(money.toWords(0), "sıfır lira");
    assert.equal(money.toWords(1), "bir lira");
    assert.equal(money.toWords(1250), "bin iki yüz elli lira");
    assert.equal(money.toWords(-3.2), "eksi üç lira yirmi kuruş");
    assert.equal(money.toWords(1_000_000.99), "bir milyon lira doksan dokuz kuruş");
  });

  it("bitişik yazım seçeneği", () => {
    assert.equal(money.toWords(1250, { joined: true }), "binikiyüzellilira");
  });
});

describe("money KDV hesapları", () => {
  it("addVat, removeVat ve vatOf", () => {
    assert.equal(money.addVat(100, 20), 120);
    assert.equal(money.addVat(0.1, 18), 0.12);
    assert.equal(money.addVat(19.99, 1), 20.19);
    assert.equal(money.removeVat(120, 20), 100);
    assert.equal(money.removeVat(99.99, 20), 83.33);
    assert.equal(money.vatOf(100, 20), 20);
    assert.equal(money.vatOf(120, 20, { included: true }), 20);
    assert.equal(money.vatOf(99.99, 20, { included: true }), 16.66);
    assert.equal(money.addVat(100, 0), 100);
  });

  it("net ve KDV toplamı brüt tutara eşittir", () => {
    for (const gross of [0.01, 1, 9.99, 99.99, 1234.56, 100000]) {
      for (const rate of [1, 10, 20]) {
        const net = money.removeVat(gross, rate);
        const vat = money.vatOf(gross, rate, { included: true });
        assert.equal(Math.round((net + vat) * 100), Math.round(gross * 100), `${gross} / ${rate}`);
      }
    }
  });

  it("hatalı oran ve tutarda RANGE hatası fırlatır", () => {
    assert.throws(() => money.addVat(1, -1), isCode("RANGE"));
    assert.throws(() => money.removeVat(1, Number.NaN), isCode("RANGE"));
    assert.throws(() => money.vatOf(1, "20" as never), isCode("RANGE"));
    assert.throws(() => money.vatOf(Number.NaN, 20), isCode("RANGE"));
  });
});
