import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TurkiyeError } from "../core/errors.ts";
import * as tckn from "./index.ts";

const VALID = "10000000146";

describe("tckn.validate", () => {
  it("geçerli numarayı kabul eder", () => {
    assert.deepEqual(tckn.validate(VALID), { ok: true, value: VALID });
  });

  it("ayraçları ve sayı girdisini kabul eder", () => {
    assert.equal(tckn.validate("100 000 001 46").ok, true);
    assert.equal(tckn.validate("100-000-001-46").ok, true);
    assert.equal(tckn.validate(10000000146).ok, true);
  });

  it("hata kodlarını doğru verir", () => {
    const cases: [unknown, string][] = [
      ["", "EMPTY"],
      ["   ", "EMPTY"],
      ["1000000014a", "INVALID_CHARS"],
      ["1000000014", "LENGTH"],
      ["100000001466", "LENGTH"],
      ["01000000146", "FORMAT"],
      ["10000000145", "CHECKSUM"],
      ["10000000136", "CHECKSUM"],
      [null, "FORMAT"],
      [{}, "FORMAT"],
      [-1, "FORMAT"],
    ];
    for (const [input, code] of cases) {
      const result = tckn.validate(input as string);
      assert.equal(result.ok, false, `${String(input)} geçersiz olmalı`);
      if (!result.ok) assert.equal(result.code, code, `${String(input)}`);
    }
  });

  it("Türkçe hata mesajı verir", () => {
    const result = tckn.validate("123");
    assert.ok(!result.ok);
    assert.equal(result.message, "TCKN uzunluğu 11 olmalı");
  });
});

describe("tckn.isValid ve parse", () => {
  it("isValid boolean döner", () => {
    assert.equal(tckn.isValid(VALID), true);
    assert.equal(tckn.isValid("12345678901"), false);
  });

  it("parse geçerli değeri döner, geçersizde TurkiyeError fırlatır", () => {
    assert.equal(tckn.parse(" 10000000146 "), VALID);
    assert.throws(() => tckn.parse("10000000145"), (e: unknown) => e instanceof TurkiyeError && e.code === "CHECKSUM");
  });
});

describe("tckn.normalize, format ve mask", () => {
  it("normalize ayraçları siler", () => {
    assert.equal(tckn.normalize(" 100.000.001-46 "), VALID);
    assert.equal(tckn.normalize(10000000146), VALID);
    assert.equal(tckn.normalize(null as never), "");
  });

  it("format geçerli numarayı, geçersizde temizlenmiş girdiyi döner", () => {
    assert.equal(tckn.format("100 000 001 46"), VALID);
    assert.equal(tckn.format("123 45"), "12345");
  });

  it("mask ilk 3 ve son 2 haneyi gösterir", () => {
    assert.equal(tckn.mask(VALID), "100******46");
  });

  it("mask geçersiz girdide hiçbir haneyi göstermez", () => {
    assert.equal(tckn.mask("10000000145"), "***********");
    assert.equal(tckn.mask("12a"), "***");
  });
});

describe("tckn.kind", () => {
  it("vatandaş ve yabancı numarayı ayırır", () => {
    assert.equal(tckn.kind(VALID), "citizen");
    assert.equal(tckn.kind(tckn.generate({ foreign: true })), "foreign");
    assert.equal(tckn.kind("123"), null);
  });
});

describe("tckn.generate", () => {
  it("10.000 üretimin tamamı geçerlidir", () => {
    for (let i = 0; i < 10_000; i++) {
      const value = tckn.generate({ foreign: i % 2 === 0 });
      assert.equal(tckn.isValid(value), true, value);
    }
  });

  it("yabancı numara 99 ile başlar, vatandaş numarası başlamaz", () => {
    assert.ok(tckn.generate({ foreign: true }).startsWith("99"));
    assert.equal(tckn.generate({ random: () => 0.99 }).startsWith("9"), true);
    assert.equal(tckn.kind(tckn.generate({ random: () => 0.5 })), "citizen");
  });

  it("aynı üreteçle aynı sonucu verir", () => {
    assert.equal(tckn.generate({ random: () => 0 }), tckn.generate({ random: () => 0 }));
    assert.equal(tckn.generate({ random: () => 0 })[0], "1");
  });

  it("1 döndüren üreteçte de geçerli numara üretir", () => {
    assert.equal(tckn.isValid(tckn.generate({ random: () => 1 })), true);
  });
});

describe("tckn.schema", () => {
  it("Standard Schema olarak doğrular", () => {
    const schema = tckn.schema();
    assert.deepEqual(schema["~standard"].validate(VALID), { value: VALID });
    assert.deepEqual(schema["~standard"].validate(10000000146), { value: VALID });
    assert.deepEqual(schema["~standard"].validate("1"), { issues: [{ message: "TCKN uzunluğu 11 olmalı" }] });
    assert.deepEqual(schema["~standard"].validate(true), { issues: [{ message: "TCKN biçimi geçersiz" }] });
  });

  it("her çağrıda aynı nesneyi döner", () => {
    assert.equal(tckn.schema(), tckn.schema());
  });
});
