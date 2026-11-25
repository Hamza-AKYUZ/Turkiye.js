import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TurkiyeError } from "./errors.ts";
import { failure, success, unwrap } from "./result.ts";

describe("success", () => {
  it("ok: true ve değer döner", () => {
    assert.deepEqual(success("10000000146"), { ok: true, value: "10000000146" });
  });
});

describe("failure", () => {
  it("ok: false, kod ve doldurulmuş mesaj döner", () => {
    assert.deepEqual(failure("LENGTH", { label: "TCKN", expected: 11 }), {
      ok: false,
      code: "LENGTH",
      message: "TCKN uzunluğu 11 olmalı",
    });
  });
});

describe("unwrap", () => {
  it("başarılı sonucun değerini döner", () => {
    assert.equal(unwrap(success(42)), 42);
  });

  it("hata sonucunda TurkiyeError fırlatır", () => {
    assert.throws(
      () => unwrap(failure("CHECKSUM", { label: "IBAN" })),
      (error: unknown) =>
        error instanceof TurkiyeError && error.code === "CHECKSUM" && error.message === "IBAN kontrol basamağı hatalı",
    );
  });
});
