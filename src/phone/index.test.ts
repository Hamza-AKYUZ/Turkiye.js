import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TurkiyeError } from "../core/errors.ts";
import { AREA_CODES } from "./data.ts";
import * as phone from "./index.ts";

const MOBILE = "+905321234567";

describe("phone.normalize", () => {
  it("farklı yazımları E.164 biçimine çevirir", () => {
    for (const input of [
      "0532 123 45 67",
      "05321234567",
      "5321234567",
      "+90 532 123 45 67",
      "+90 (532) 123-45-67",
      "0090 532 123 45 67",
      "90 532 123 45 67",
      "0532.123.45.67",
    ]) {
      assert.equal(phone.normalize(input), MOBILE, input);
    }
    assert.equal(phone.normalize("444 1 444"), "+904441444");
  });

  it("tanınmayan girdide ayraçları silinmiş değeri döner", () => {
    assert.equal(phone.normalize("12 34"), "1234");
    assert.equal(phone.normalize("+1 555 1234"), "+15551234");
    assert.equal(phone.normalize(5 as never), "");
  });
});

describe("phone.validate", () => {
  it("cep, sabit, özel ve 444 numaralarını kabul eder", () => {
    for (const input of ["0532 123 45 67", "0505 123 45 67", "0212 123 45 67", "0312 123 45 67", "0850 222 06 00", "0800 123 45 67", "444 1 444"]) {
      assert.equal(phone.validate(input).ok, true, input);
    }
  });

  it("hata kodlarını doğru verir", () => {
    const cases: [unknown, string][] = [
      ["", "EMPTY"],
      ["0532 abc 45 67", "INVALID_CHARS"],
      ["+1 555 123 4567", "COUNTRY"],
      ["0532 123 45", "FORMAT"],
      ["0599 123 45 67", "FORMAT"],
      ["0213 123 45 67", "FORMAT"],
      ["0444 1 444 1", "FORMAT"],
      [null, "FORMAT"],
    ];
    for (const [input, code] of cases) {
      const result = phone.validate(input as string);
      assert.equal(result.ok, false, String(input));
      if (!result.ok) assert.equal(result.code, code, String(input));
    }
  });

  it("parse ve isValid", () => {
    assert.equal(phone.parse("0532 123 45 67"), MOBILE);
    assert.equal(phone.isValid("123"), false);
    assert.throws(() => phone.parse("123"), TurkiyeError);
  });
});

describe("phone.format", () => {
  it("üç biçimde yazar", () => {
    assert.equal(phone.format("5321234567"), "0532 123 45 67");
    assert.equal(phone.format("5321234567", "national"), "0532 123 45 67");
    assert.equal(phone.format("5321234567", "international"), "+90 532 123 45 67");
    assert.equal(phone.format("5321234567", "e164"), MOBILE);
  });

  it("444 numaralarını 3-1-3 gruplar", () => {
    assert.equal(phone.format("4441444"), "444 1 444");
    assert.equal(phone.format("4441444", "international"), "+90 444 1 444");
  });

  it("geçersiz girdide normalize sonucunu döner", () => {
    assert.equal(phone.format("12 34"), "1234");
  });
});

describe("phone.mask", () => {
  it("önek ve son 2 hane dışındakileri gizler", () => {
    assert.equal(phone.mask("05321234567"), "0532 *** ** 67");
    assert.equal(phone.mask("4441444"), "444 * *44");
    assert.equal(phone.mask("123"), "***");
  });
});

describe("phone.type ve area", () => {
  it("türü belirler", () => {
    assert.equal(phone.type("05321234567"), "mobile");
    assert.equal(phone.type("02121234567"), "landline");
    assert.equal(phone.type("08502220600"), "special");
    assert.equal(phone.type("09001234567"), "special");
    assert.equal(phone.type("4441444"), "special");
    assert.equal(phone.type("123"), null);
  });

  it("sabit hattın ilini döner", () => {
    assert.deepEqual(phone.area("0216 123 45 67"), { code: "216", province: "İstanbul" });
    assert.deepEqual(phone.area("0232 123 45 67"), { code: "232", province: "İzmir" });
    assert.equal(phone.area("0532 123 45 67"), null);
    assert.equal(phone.area("123"), null);
  });

  it("alan kodu tablosu 81 ili kapsar", () => {
    assert.equal(Object.keys(AREA_CODES).length, 82);
    assert.equal(new Set(Object.values(AREA_CODES)).size, 81);
  });
});

describe("phone.schema", () => {
  it("Standard Schema olarak doğrular", () => {
    const schema = phone.schema();
    assert.equal(schema, phone.schema());
    assert.deepEqual(schema["~standard"].validate("0532 123 45 67"), { value: MOBILE });
    assert.deepEqual(schema["~standard"].validate("1"), { issues: [{ message: "Telefon numarası biçimi geçersiz" }] });
  });
});
