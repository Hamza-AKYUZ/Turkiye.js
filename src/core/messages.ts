import { type ErrorCode, isErrorCode } from "./errors.ts";

/**
 * Hata mesajı şablonları. Şablonlarda `{label}` alan adıyla, `{expected}`
 * beklenen değerle değiştirilir.
 */
export type MessageTemplates = Record<ErrorCode, string>;

export interface MessageParams {
  readonly label: string;
  readonly expected?: string | number;
}

const DEFAULT_MESSAGES: Readonly<MessageTemplates> = Object.freeze({
  EMPTY: "{label} boş olamaz",
  INVALID_CHARS: "{label} geçersiz karakter içeriyor",
  LENGTH: "{label} uzunluğu {expected} olmalı",
  CHECKSUM: "{label} kontrol basamağı hatalı",
  FORMAT: "{label} biçimi geçersiz",
  COUNTRY: "{label} ülke kodu geçersiz",
  UNKNOWN_BANK: "{label} banka kodu tanınmıyor",
  RANGE: "{label} geçerli aralıkta değil",
  EXPIRED: "{label} süresi dolmuş",
});

interface MessageStore {
  current: Readonly<MessageTemplates>;
}

// Mesajlar tek bir genel anahtarda tutulur; böylece paketin ESM ve CommonJS
// kopyaları aynı ayarı paylaşır.
const STORE_KEY = Symbol.for("turkiye.js.messages");

function store(): MessageStore {
  const scope = globalThis as unknown as Record<symbol, MessageStore | undefined>;
  let value = scope[STORE_KEY];
  if (value === undefined) {
    value = { current: DEFAULT_MESSAGES };
    Object.defineProperty(scope, STORE_KEY, { value, configurable: true });
  }
  return value;
}

/**
 * Hata mesajlarını değiştirir. Verilmeyen kodların mesajı korunur.
 * Ayar uygulama genelinde geçerlidir.
 *
 * @example
 * setMessages({ LENGTH: "{label} must be {expected} characters" });
 */
export function setMessages(templates: Partial<MessageTemplates>): void {
  if (typeof templates !== "object" || templates === null) {
    throw new TypeError("setMessages bir nesne bekler");
  }
  const next: MessageTemplates = { ...store().current };
  for (const [code, template] of Object.entries(templates)) {
    if (!isErrorCode(code)) throw new TypeError(`Bilinmeyen hata kodu: ${code}`);
    if (typeof template !== "string") throw new TypeError(`${code} mesajı metin olmalı`);
    next[code] = template;
  }
  store().current = Object.freeze(next);
}

/** Hata mesajlarını varsayılan değerlerine döndürür. */
export function resetMessages(): void {
  store().current = DEFAULT_MESSAGES;
}

/** @internal */
export function formatMessage(code: ErrorCode, params: MessageParams): string {
  const expected = params.expected === undefined ? "" : String(params.expected);
  // Değiştirme fonksiyonu, değerdeki "$&" gibi özel dizilerin yorumlanmasını önler.
  return store()
    .current[code].replace(/\{label\}/g, () => params.label)
    .replace(/\{expected\}/g, () => expected)
    .replace(/\s{2,}/g, " ")
    .trim();
}
