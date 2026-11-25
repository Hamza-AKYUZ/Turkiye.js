import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TurkiyeError } from "../core/errors.ts";
import { mersis } from "./index.ts";

const VALID = "0123456789012345";

describe("company.mersis", () => {
  it("16 haneli numarayı kabul eder", () => {
    assert.deepEqual(mersis.validate(VALID), { ok: true, value: VALID });
    assert.equal(mersis.isValid("0123-4567-8901-2345"), true);
    assert.equal(mersis.isValid("0123 4567 8901 2345"), true);
  });

  it("hata kodlarını doğru verir", () => {
    const cases: [unknown, string][] = [
      ["", "EMPTY"],
      ["0123456789O12345", "INVALID_CHARS"],
      ["012345678901234", "LENGTH"],
      ["01234567890123456", "LENGTH"],
      [123, "FORMAT"],
    ];
    for (const [input, code] of cases) {
      const result = mersis.validate(input as string);
      assert.equal(result.ok, false, String(input));
      if (!result.ok) assert.equal(result.code, code, String(input));
    }
  });

  it("normalize, format, parse ve schema", () => {
    assert.equal(mersis.normalize(" 0123.4567.8901.2345 "), VALID);
    assert.equal(mersis.normalize(null as never), "");
    assert.equal(mersis.format("0123-4567-8901-2345"), VALID);
    assert.equal(mersis.format("12 3"), "123");
    assert.equal(mersis.parse(VALID), VALID);
    assert.throws(() => mersis.parse("1"), TurkiyeError);
    assert.equal(mersis.schema(), mersis.schema());
    assert.deepEqual(mersis.schema()["~standard"].validate("1"), {
      issues: [{ message: "MERSİS numarası uzunluğu 16 olmalı" }],
    });
  });
});
