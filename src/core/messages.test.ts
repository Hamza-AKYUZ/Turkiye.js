import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { ERROR_CODES } from "./errors.ts";
import { formatMessage, resetMessages, setMessages } from "./messages.ts";

afterEach(() => resetMessages());

describe("formatMessage", () => {
  it("varsayılan Türkçe mesajları doldurur", () => {
    assert.equal(formatMessage("LENGTH", { label: "TCKN", expected: 11 }), "TCKN uzunluğu 11 olmalı");
    assert.equal(formatMessage("CHECKSUM", { label: "IBAN" }), "IBAN kontrol basamağı hatalı");
    assert.equal(formatMessage("EMPTY", { label: "Telefon" }), "Telefon boş olamaz");
  });

  it("her kod için boş olmayan bir mesaj vardır", () => {
    for (const code of ERROR_CODES) {
      const message = formatMessage(code, { label: "Alan", expected: 1 });
      assert.ok(message.length > 0);
      assert.ok(!message.includes("{"), `${code} mesajında doldurulmamış yer tutucu var`);
    }
  });

  it("verilmeyen expected boş geçilir ve fazla boşluk temizlenir", () => {
    assert.equal(formatMessage("LENGTH", { label: "VKN" }), "VKN uzunluğu olmalı");
  });

  it("aynı yer tutucu birden fazla geçebilir", () => {
    setMessages({ FORMAT: "{label}: {label} hatalı" });
    assert.equal(formatMessage("FORMAT", { label: "IBAN" }), "IBAN: IBAN hatalı");
  });
});

describe("setMessages", () => {
  it("yalnız verilen kodları değiştirir", () => {
    setMessages({ LENGTH: "{label} must be {expected} characters" });
    assert.equal(formatMessage("LENGTH", { label: "TCKN", expected: 11 }), "TCKN must be 11 characters");
    assert.equal(formatMessage("CHECKSUM", { label: "TCKN" }), "TCKN kontrol basamağı hatalı");
  });

  it("art arda çağrılar birikir", () => {
    setMessages({ EMPTY: "a {label}" });
    setMessages({ RANGE: "b {label}" });
    assert.equal(formatMessage("EMPTY", { label: "x" }), "a x");
    assert.equal(formatMessage("RANGE", { label: "x" }), "b x");
  });

  it("bilinmeyen kodu reddeder", () => {
    assert.throws(() => setMessages({ NOPE: "x" } as never), TypeError);
  });

  it("metin olmayan mesajı reddeder", () => {
    assert.throws(() => setMessages({ EMPTY: 42 } as never), TypeError);
  });

  it("hatalı çağrı mevcut mesajları bozmaz", () => {
    assert.throws(() => setMessages({ EMPTY: "yeni", NOPE: "x" } as never));
    assert.equal(formatMessage("EMPTY", { label: "TCKN" }), "TCKN boş olamaz");
  });
});

describe("resetMessages", () => {
  it("varsayılanlara döner", () => {
    setMessages({ EMPTY: "empty" });
    resetMessages();
    assert.equal(formatMessage("EMPTY", { label: "TCKN" }), "TCKN boş olamaz");
  });
});
