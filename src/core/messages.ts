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

let current: MessageTemplates = { ...DEFAULT_MESSAGES };

/**
 * Hata mesajlarını değiştirir. Verilmeyen kodların mesajı korunur.
 * Ayar uygulama genelinde geçerlidir.
 *
 * @example
 * setMessages({ LENGTH: "{label} must be {expected} characters" });
 */
export function setMessages(templates: Partial<MessageTemplates>): void {
  for (const [code, template] of Object.entries(templates)) {
    if (!isErrorCode(code)) throw new TypeError(`Bilinmeyen hata kodu: ${code}`);
    if (typeof template !== "string") throw new TypeError(`${code} mesajı metin olmalı`);
  }
  current = { ...current, ...templates };
}

/** Hata mesajlarını varsayılan değerlerine döndürür. */
export function resetMessages(): void {
  current = { ...DEFAULT_MESSAGES };
}

/** @internal */
export function formatMessage(code: ErrorCode, params: MessageParams): string {
  return current[code]
    .replace(/\{label\}/g, params.label)
    .replace(/\{expected\}/g, params.expected === undefined ? "" : String(params.expected))
    .replace(/\s{2,}/g, " ")
    .trim();
}
