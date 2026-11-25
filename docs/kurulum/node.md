[Doküman](../README.md) / Kurulum / **Node.js**

# Node.js ile kurulum

Sunucu, komut satırı aracı ya da arka plan işi gibi her Node.js projesinde kullanılır. Paket ESM ve CommonJS olarak gelir; ek ayar gerekmez.

| Gereksinim | Sürüm |
|---|---|
| Node.js | 14.13 ve üstü |
| Bağımlılık | Yok |

## 1. Paketi kurun

```sh
npm install turkiye.js
```

pnpm ve Yarn ile:

```sh
pnpm add turkiye.js
yarn add turkiye.js
```

## 2. İçe aktarın

**ESM** (`"type": "module"` olan projeler ya da `.mjs` dosyaları):

```js
import { iban, tckn } from "turkiye.js";

tckn.isValid("10000000146"); // true
iban.format("tr330006100519786457841326"); // "TR33 0006 1005 1978 6457 8413 26"
```

**CommonJS** (`require` kullanan projeler):

```js nocheck
const { iban, tckn } = require("turkiye.js");

tckn.isValid("10000000146"); // true
```

Yalnız bir modül gerekiyorsa alt yoldan alınır:

```js
import { isValid } from "turkiye.js/tckn";

isValid("10000000146"); // true
```

## 3. Örnek: API'de form doğrulama

Gelen veriyi doğrulayan ve hatayı alan bazında dönen bir fonksiyon. Express, Fastify, Hono ya da `node:http` ile aynı şekilde kullanılır.

```js
import { iban, phone, tckn } from "turkiye.js";

function validateCustomer(body) {
  const checks = {
    tckn: tckn.validate(body.tckn),
    phone: phone.validate(body.phone),
    iban: iban.validate(body.iban),
  };
  const errors = {};
  const data = {};
  for (const [field, result] of Object.entries(checks)) {
    if (result.ok) data[field] = result.value;
    else errors[field] = { code: result.code, message: result.message };
  }
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, data };
}

validateCustomer({ tckn: "10000000146", phone: "0532 123 45 67", iban: "TR33 0006 1005 1978 6457 8413 26" }).data; // { tckn: "10000000146", phone: "+905321234567", iban: "TR330006100519786457841326" }
validateCustomer({ tckn: "123", phone: "0532 123 45 67", iban: "TR33" }).errors.tckn.code; // "LENGTH"
```

Express ile:

```js nocheck
import express from "express";

const app = express();
app.use(express.json());

app.post("/musteri", (req, res) => {
  const result = validateCustomer(req.body);
  if (!result.ok) return res.status(422).json(result.errors);
  // result.data içindeki değerler temizlenmiş ve doğrulanmıştır.
  res.status(201).json(result.data);
});
```

Veritabanına her zaman `validate` sonucundaki `value` kaydedilir: boşluk ve ayraçlar temizlenmiş, telefon E.164 biçimine çevrilmiş olur.

## 4. Örnek: rapor ve fatura metinleri

```js
import { date, money, text } from "turkiye.js";

money.format(21000.24); // "21.000,24 ₺"
money.toWords(21000.24); // "yirmi bir bin lira yirmi dört kuruş"
date.format("2026-11-25", "DD.MM.YYYY"); // "25.11.2026"
text.toUpper("fatura ilişkili işlemler"); // "FATURA İLİŞKİLİ İŞLEMLER"
```

Daha kapsamlı bir örnek: [examples/node/invoice.mjs](../../examples/node/invoice.mjs).

## Sık karşılaşılan durumlar

**`ERR_REQUIRE_ESM` hatası:** Paket hem ESM hem CommonJS sunar; bu hata alınmaz. Alınıyorsa proje çok eski bir Node sürümünde çalışıyordur (14.13 altı).

**`Cannot find module 'turkiye.js/tckn'`:** Alt yollar `exports` alanıyla tanımlıdır. TypeScript kullanılıyorsa `moduleResolution` ayarının `node16`, `nodenext` ya da `bundler` olması gerekir. Ayrıntı: [TypeScript](./typescript.md).

**Sunucu saat dilimi:** `date` fonksiyonları `"2026-11-25"` gibi metinleri sunucunun yerel saatine göre okur. Sunucu UTC'de çalışıyorsa ve Türkiye saati gerekiyorsa ortam değişkeni ayarlanır: `TZ=Europe/Istanbul`.

---

[Doküman ana sayfası](../README.md) · [TypeScript](./typescript.md) · [Bun ve Deno](./bun-deno.md)

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.
