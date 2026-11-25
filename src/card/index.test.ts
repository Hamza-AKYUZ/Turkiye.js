import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TurkiyeError } from "../core/errors.ts";
import * as card from "./index.ts";

// Ödeme sağlayıcılarının yayımladığı test kart numaraları.
const VISA = "4543590000000006";
const MASTERCARD = "5555555555554444";
const MASTERCARD_2 = "2223003122003222";
const AMEX = "378282246310005";
const TROY = "9792030394440796";

describe("card.validate", () => {
  it("test kartlarını kabul eder", () => {
    for (const value of [VISA, "4111111111111111", MASTERCARD, MASTERCARD_2, AMEX, TROY]) {
      assert.equal(card.validate(value).ok, true, value);
    }
    assert.equal(card.validate("4543 5900 0000 0006").ok, true);
  });

  it("bilinmeyen ağda 12-19 hane ve Luhn kontrolü yapar", () => {
    assert.equal(card.validate("6011111111111117").ok, true);
    const short = card.validate("60111111117");
    assert.ok(!short.ok);
    assert.equal(short.code, "LENGTH");
    assert.equal(short.message, "Kart numarası uzunluğu 12 ile 19 arası olmalı");
  });

  it("hata kodlarını doğru verir", () => {
    const cases: [unknown, string][] = [
      ["", "EMPTY"],
      ["4543 59xx", "INVALID_CHARS"],
      ["454359000000", "LENGTH"],
      ["37828224631000", "LENGTH"],
      ["4543590000000007", "CHECKSUM"],
      [123, "FORMAT"],
    ];
    for (const [input, code] of cases) {
      const result = card.validate(input as string);
      assert.equal(result.ok, false, String(input));
      if (!result.ok) assert.equal(result.code, code, String(input));
    }
  });

  it("uzunluk mesajında ağa uygun değerleri gösterir", () => {
    const visa = card.validate("454359000000");
    const amex = card.validate("37828224631000");
    assert.ok(!visa.ok && !amex.ok);
    assert.equal(visa.message, "Kart numarası uzunluğu 13, 16 veya 19 olmalı");
    assert.equal(amex.message, "Kart numarası uzunluğu 15 olmalı");
  });

  it("parse ve isValid", () => {
    assert.equal(card.parse("4543-5900-0000-0006"), VISA);
    assert.equal(card.isValid("1"), false);
    assert.throws(() => card.parse("4543590000000007"), TurkiyeError);
  });
});

describe("card.brand", () => {
  it("ağı numaranın başından belirler", () => {
    assert.equal(card.brand("4543 59"), "visa");
    assert.equal(card.brand("51"), "mastercard");
    assert.equal(card.brand("2221"), "mastercard");
    assert.equal(card.brand("2720 99"), "mastercard");
    assert.equal(card.brand("34"), "amex");
    assert.equal(card.brand("37"), "amex");
    assert.equal(card.brand("9792"), "troy");
  });

  it("tanınmayan ya da geçersiz girdide null döner", () => {
    for (const value of ["", "6011", "2220", "2721", "222", "9791", "abc"]) {
      assert.equal(card.brand(value), null, value);
    }
  });
});

describe("card.normalize, format ve mask", () => {
  it("normalize ayraçları siler", () => {
    assert.equal(card.normalize(" 4543 5900-0000.0006 "), VISA);
    assert.equal(card.normalize(null as never), "");
  });

  it("format dörderli, Amex 4-6-5 gruplar", () => {
    assert.equal(card.format(VISA), "4543 5900 0000 0006");
    assert.equal(card.format(AMEX), "3782 822463 10005");
    assert.equal(card.format("1234 5"), "12345");
  });

  it("mask ilk 4 ve son 4 haneyi gösterir", () => {
    assert.equal(card.mask(VISA), "4543 **** **** 0006");
    assert.equal(card.mask(AMEX), "3782 ****** *0005");
    assert.equal(card.mask("4543590000000007"), "****************");
  });
});

describe("card.isExpiryValid", () => {
  const now = new Date(2026, 10, 25);

  it("bu ay ve sonrası geçerlidir", () => {
    assert.equal(card.isExpiryValid(11, 26, now), true);
    assert.equal(card.isExpiryValid("12", "2026", now), true);
    assert.equal(card.isExpiryValid(1, 2027, now), true);
    assert.equal(card.isExpiryValid("01", "30", now), true);
  });

  it("geçmiş tarihler geçersizdir", () => {
    assert.equal(card.isExpiryValid(10, 26, now), false);
    assert.equal(card.isExpiryValid(12, 2025, now), false);
  });

  it("hatalı girdileri reddeder", () => {
    for (const [month, year] of [
      [0, 30],
      [13, 30],
      ["ab", 30],
      [12, "3"],
      [12, "203"],
      [12.5, 30],
      [null, 30],
    ] as const) {
      assert.equal(card.isExpiryValid(month as never, year as never, now), false, `${month}/${year}`);
    }
  });

  it("tarih verilmezse bugünü kullanır", () => {
    assert.equal(card.isExpiryValid(12, 2099), true);
    assert.equal(card.isExpiryValid(1, 2000), false);
  });
});

describe("card.isCvvValid", () => {
  it("ağa göre uzunluğu kontrol eder", () => {
    assert.equal(card.isCvvValid("123", "visa"), true);
    assert.equal(card.isCvvValid("1234", "visa"), false);
    assert.equal(card.isCvvValid("1234", "amex"), true);
    assert.equal(card.isCvvValid("123", "amex"), false);
    assert.equal(card.isCvvValid("123"), true);
    assert.equal(card.isCvvValid("1234", null), true);
    assert.equal(card.isCvvValid("12"), false);
    assert.equal(card.isCvvValid("12a"), false);
    assert.equal(card.isCvvValid(123 as never), false);
  });
});

describe("card.schema", () => {
  it("Standard Schema olarak doğrular", () => {
    const schema = card.schema();
    assert.equal(schema, card.schema());
    assert.deepEqual(schema["~standard"].validate(VISA), { value: VISA });
    assert.deepEqual(schema["~standard"].validate("4543590000000007"), {
      issues: [{ message: "Kart numarası kontrol basamağı hatalı" }],
    });
  });
});
