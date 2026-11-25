import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TurkiyeError } from "../core/errors.ts";
import * as vkn from "./index.ts";

const VALID = "1234567890";

describe("vkn.validate", () => {
  it("geçerli numarayı kabul eder", () => {
    assert.deepEqual(vkn.validate(VALID), { ok: true, value: VALID });
    assert.equal(vkn.validate("123 456 78 90").ok, true);
    assert.equal(vkn.validate(1234567890).ok, true);
  });

  it("0 ile başlayan numarayı kabul eder", () => {
    const value = vkn.generate({ random: () => 0 });
    assert.ok(value.startsWith("0"));
    assert.equal(vkn.isValid(value), true);
  });

  it("hata kodlarını doğru verir", () => {
    const cases: [unknown, string][] = [
      ["", "EMPTY"],
      ["12345a7890", "INVALID_CHARS"],
      ["123456789", "LENGTH"],
      ["12345678901", "LENGTH"],
      ["1234567891", "CHECKSUM"],
      [undefined, "FORMAT"],
    ];
    for (const [input, code] of cases) {
      const result = vkn.validate(input as string);
      assert.equal(result.ok, false, String(input));
      if (!result.ok) assert.equal(result.code, code, String(input));
    }
  });
});

describe("vkn.isValid ve parse", () => {
  it("parse geçersizde TurkiyeError fırlatır", () => {
    assert.equal(vkn.parse(VALID), VALID);
    assert.throws(() => vkn.parse("1234567891"), TurkiyeError);
  });
});

describe("vkn.normalize, format ve mask", () => {
  it("normalize ve format", () => {
    assert.equal(vkn.normalize("123.456.78-90"), VALID);
    assert.equal(vkn.normalize({} as never), "");
    assert.equal(vkn.format(" 1234567890 "), VALID);
    assert.equal(vkn.format("12 34"), "1234");
  });

  it("mask ilk 2 ve son 2 haneyi gösterir", () => {
    assert.equal(vkn.mask(VALID), "12******90");
    assert.equal(vkn.mask("1234567891"), "**********");
  });
});

describe("vkn.detectTaxId", () => {
  it("VKN, TCKN ve geçersiz değeri ayırır", () => {
    assert.equal(vkn.detectTaxId(VALID), "vkn");
    assert.equal(vkn.detectTaxId("10000000146"), "tckn");
    assert.equal(vkn.detectTaxId("123"), null);
  });
});

describe("vkn.generate", () => {
  it("10.000 üretimin tamamı geçerlidir", () => {
    for (let i = 0; i < 10_000; i++) {
      const value = vkn.generate();
      assert.equal(vkn.isValid(value), true, value);
    }
  });
});

describe("vkn.schema", () => {
  it("Standard Schema olarak doğrular", () => {
    const schema = vkn.schema();
    assert.equal(schema, vkn.schema());
    assert.deepEqual(schema["~standard"].validate(VALID), { value: VALID });
    assert.deepEqual(schema["~standard"].validate("1234567891"), {
      issues: [{ message: "VKN kontrol basamağı hatalı" }],
    });
  });
});
