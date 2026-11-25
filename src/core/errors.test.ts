import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ERROR_CODES, isErrorCode, TurkiyeError } from "./errors.ts";

describe("TurkiyeError", () => {
  it("Error'dan türer ve kodu taşır", () => {
    const error = new TurkiyeError("CHECKSUM", "TCKN kontrol basamağı hatalı");
    assert.ok(error instanceof Error);
    assert.ok(error instanceof TurkiyeError);
    assert.equal(error.name, "TurkiyeError");
    assert.equal(error.code, "CHECKSUM");
    assert.equal(error.message, "TCKN kontrol basamağı hatalı");
  });

  it("stack bilgisi içerir", () => {
    const error = new TurkiyeError("LENGTH", "x");
    assert.equal(typeof error.stack, "string");
  });
});

describe("ERROR_CODES", () => {
  it("tekrarsızdır", () => {
    assert.equal(new Set(ERROR_CODES).size, ERROR_CODES.length);
  });

  it("beklenen kodları sırasıyla içerir", () => {
    assert.deepEqual(
      [...ERROR_CODES],
      ["EMPTY", "INVALID_CHARS", "LENGTH", "CHECKSUM", "FORMAT", "COUNTRY", "UNKNOWN_BANK", "RANGE", "EXPIRED"],
    );
  });
});

describe("isErrorCode", () => {
  it("geçerli kodları tanır", () => {
    for (const code of ERROR_CODES) assert.equal(isErrorCode(code), true);
  });

  it("geçersiz değerleri reddeder", () => {
    for (const value of ["", "length", "UNKNOWN", 1, null, undefined, {}]) {
      assert.equal(isErrorCode(value), false);
    }
  });
});
