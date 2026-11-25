import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TurkiyeError } from "../core/errors.ts";
import * as iban from "./index.ts";

const VALID = "TR330006100519786457841326";

describe("iban.normalize", () => {
  it("boşluk, tire ve ön eki siler, harfleri büyütür", () => {
    assert.equal(iban.normalize("tr33 0006 1005 1978 6457 8413 26"), VALID);
    assert.equal(iban.normalize("IBAN: TR33-0006-1005-1978-6457-8413-26"), VALID);
    assert.equal(iban.normalize("iban TR330006100519786457841326"), VALID);
    assert.equal(iban.normalize(42 as never), "");
  });
});

describe("iban.validate", () => {
  it("geçerli IBAN'ı kabul eder", () => {
    assert.deepEqual(iban.validate(VALID), { ok: true, value: VALID });
    assert.equal(iban.validate("TR33 0006 1005 1978 6457 8413 26").ok, true);
  });

  it("hata kodlarını doğru verir", () => {
    const cases: [unknown, string][] = [
      ["", "EMPTY"],
      ["TR33_0006", "INVALID_CHARS"],
      ["DE89370400440532013000", "COUNTRY"],
      ["TR3300061005197864578413", "LENGTH"],
      ["TR33000610051978645784132A", "FORMAT"],
      ["TR330006110519786457841326", "FORMAT"],
      ["TR340006100519786457841326", "CHECKSUM"],
      [null, "FORMAT"],
    ];
    for (const [input, code] of cases) {
      const result = iban.validate(input as string);
      assert.equal(result.ok, false, String(input));
      if (!result.ok) assert.equal(result.code, code, String(input));
    }
  });

  it("parse ve isValid", () => {
    assert.equal(iban.isValid(VALID), true);
    assert.equal(iban.parse("tr33 0006 1005 1978 6457 8413 26"), VALID);
    assert.throws(() => iban.parse("TR340006100519786457841326"), TurkiyeError);
  });
});

describe("iban.format ve mask", () => {
  it("dörderli gruplar", () => {
    assert.equal(iban.format(VALID), "TR33 0006 1005 1978 6457 8413 26");
    assert.equal(iban.format("tr 12"), "TR12");
  });

  it("mask ilk 4 ve son 6 karakteri gösterir", () => {
    assert.equal(iban.mask(VALID), "TR33 **** **** **** **** 8413 26");
    assert.equal(iban.mask("TR12 34"), "******");
  });
});

describe("iban.bankCode", () => {
  it("banka kodunu ilk 9 karakterden çıkarır", () => {
    assert.equal(iban.bankCode("TR12 0006 2"), "00062");
    assert.equal(iban.bankCode(VALID), "00061");
    assert.equal(iban.bankCode("iban: tr12 00010 0"), "00010");
  });

  it("eksik ya da TR dışı girdide null döner", () => {
    assert.equal(iban.bankCode("TR12 0006"), null);
    assert.equal(iban.bankCode("DE12000620"), null);
    assert.equal(iban.bankCode(""), null);
  });
});

describe("iban.info", () => {
  it("IBAN'ı parçalarına ayırır", () => {
    assert.deepEqual(iban.info(VALID), {
      country: "TR",
      checkDigits: "33",
      bankCode: "00061",
      reserved: "0",
      accountNumber: "0519786457841326",
    });
    assert.equal(iban.info("TR34"), null);
  });
});

describe("iban.schema", () => {
  it("Standard Schema olarak doğrular", () => {
    const schema = iban.schema();
    assert.equal(schema, iban.schema());
    assert.deepEqual(schema["~standard"].validate(VALID), { value: VALID });
    assert.deepEqual(schema["~standard"].validate("DE89"), { issues: [{ message: "IBAN ülke kodu geçersiz" }] });
  });
});
