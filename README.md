<div align="center">

# Türkiye.js

**Türkiye'ye özgü doğrulama, biçimleme ve metin araçları. Tek paket, sıfır bağımlılık.**

TCKN · VKN · IBAN · Telefon · Kart · Para · Adres · Tarih · Plaka · Türkçe metin · Yazarken format

[![Sürüm](https://img.shields.io/badge/s%C3%BCr%C3%BCm-1.0.0-0969da)](./CHANGELOG.md)
[![Lisans](https://img.shields.io/badge/lisans-MIT-2ea44f)](./LICENSE)
[![Bağımlılık](https://img.shields.io/badge/ba%C4%9F%C4%B1ml%C4%B1l%C4%B1k-0-2ea44f)](./package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-tipler%20dahil-3178c6)](./docs/kurulum/typescript.md)
[![Node](https://img.shields.io/badge/node-%3E%3D14.13-339933)](./docs/kurulum/node.md)

[Doküman](./docs/README.md) · [Kurulum rehberleri](./docs/README.md#kurulum) · [Örnekler](./examples/README.md) · [Değişiklikler](./CHANGELOG.md)

</div>

---

## Neden Türkiye.js

| | |
|---|---|
| **Her şey tek pakette** | Kimlik, vergi, IBAN, telefon, kart, para, adres, tarih, plaka ve Türkçe metin için ayrı paket aramaya gerek yok. |
| **Sıfır bağımlılık** | Pakette hiçbir dış bağımlılık yok. `node_modules` şişmez, tedarik zinciri riski yok. |
| **Her yerde çalışır** | Node, tarayıcı, React, Next.js, Vue, Svelte, React Native, Bun, Deno ve edge ortamları. `Intl` gerekmez. |
| **Okunaklı API** | Her modülde aynı fonksiyonlar: `isValid`, `validate`, `format`, `mask`. Birini öğrenen hepsini kullanır. |
| **Türkçe hata mesajları** | "TCKN kontrol basamağı hatalı" gibi kullanıcıya gösterilebilir mesajlar; istenirse değiştirilebilir. |
| **TypeScript** | Tipler paketle gelir. Doğrulanmış değerler tip seviyesinde işaretlenir. |
| **Küçük** | Tree-shaking desteklenir; bundle'a yalnız kullanılan modül girer. |

## Kurulum

```sh
npm install turkiye.js
```

<table>
<tr>
<td><a href="./docs/kurulum/node.md"><b>Node.js</b></a></td>
<td><a href="./docs/kurulum/react.md"><b>React</b></a></td>
<td><a href="./docs/kurulum/nextjs.md"><b>Next.js</b></a></td>
<td><a href="./docs/kurulum/vue.md"><b>Vue ve Nuxt</b></a></td>
<td><a href="./docs/kurulum/svelte.md"><b>Svelte</b></a></td>
</tr>
<tr>
<td><a href="./docs/kurulum/tarayici.md"><b>Tarayıcı (CDN)</b></a></td>
<td><a href="./docs/kurulum/react-native.md"><b>React Native</b></a></td>
<td><a href="./docs/kurulum/bun-deno.md"><b>Bun ve Deno</b></a></td>
<td><a href="./docs/kurulum/typescript.md"><b>TypeScript</b></a></td>
<td></td>
</tr>
</table>

## Hızlı başlangıç

```ts
import { iban, money, phone, tckn, text } from "turkiye.js";

tckn.isValid("10000000146"); // true
tckn.mask("10000000146"); // "100******46"

iban.format("tr330006100519786457841326"); // "TR33 0006 1005 1978 6457 8413 26"
phone.format("5321234567"); // "0532 123 45 67"

money.format(1234.5); // "1.234,50 ₺"
money.toWords(1234.5); // "bin iki yüz otuz dört lira elli kuruş"

text.toUpper("istanbul"); // "İSTANBUL"
text.suffix("Ankara", "dative"); // "Ankara'ya"
```

Hata ayrıntısı gerektiğinde `validate` kullanılır:

```ts
import { tckn } from "turkiye.js";

tckn.validate("10000000145"); // { ok: false, code: "CHECKSUM", message: "TCKN kontrol basamağı hatalı" }
```

React'te yazarken biçimlenen input:

```tsx
import { useMask } from "turkiye.js/react";

function IbanInput() {
  const iban = useMask("iban");
  return <input {...iban.inputProps} />; // "tr3300061" yazılınca "TR33 0006 1" görünür
}
```

## Modüller

| Modül | Ne yapar | Doküman |
|---|---|---|
| `tckn` | TC Kimlik No ve Yabancı Kimlik No doğrulama, maskeleme, test numarası | [tckn](./docs/moduller/tckn.md) |
| `vkn` | Vergi Kimlik No, VKN/TCKN ayrımı | [vkn](./docs/moduller/vkn.md) |
| `iban` | TR IBAN doğrulama, biçimleme, banka kodu | [iban](./docs/moduller/iban.md) |
| `phone` | Cep, sabit hat ve özel numaralar, E.164, alan kodu | [phone](./docs/moduller/phone.md) |
| `card` | Kart numarası, ağ (Troy dahil), son kullanma tarihi, CVV | [card](./docs/moduller/card.md) |
| `money` | Para biçimi, tutar okuma, yazıyla tutar, KDV | [money](./docs/moduller/money.md) |
| `text` | Türkçe büyük/küçük harf, sıralama, arama, slug, hal ekleri | [text](./docs/moduller/text.md) |
| `date` | Türkçe tarih, göreli zaman, resmî tatil, iş günü | [date](./docs/moduller/date.md) |
| `address` | 81 il, plaka kodu, posta kodu yapısı | [address](./docs/moduller/address.md) |
| `company` | MERSİS numarası | [company](./docs/moduller/company.md) |
| `vehicle` | Plaka ve şasi numarası (VIN) | [vehicle](./docs/moduller/vehicle.md) |
| `mask` | Yazarken biçimleme, imleç korunur | [mask](./docs/moduller/mask.md) |
| `react` | `useMask` hook'u | [react](./docs/moduller/react.md) |

Her modül ayrı alt yoldan da alınabilir: `import { isValid } from "turkiye.js/tckn"`.

## Örnekler

| Örnek | Açıklama |
|---|---|
| [Node fatura özeti](./examples/node/invoice.mjs) | VKN, telefon ve IBAN doğrulama, KDV ve yazıyla tutar |
| [Saf HTML form](./examples/browser/index.html) | Build aracı olmadan, yazarken biçimlenen form |
| [React ödeme formu](./examples/react/PaymentForm.tsx) | `useMask` ile ödeme formu |

## Veri politikası

Paket yalnız kurala dayalı hesaplar ve kalıcı veriler içerir. Banka adları, ilçe ve mahalle, vergi dairesi ve dini bayram tarihleri gibi zamanla değişen listeler pakette yoktur; gerektiğinde uygulama kendi verisini verir. Böylece paket güncellenmese bile yanlış veri döndürmez.

## Geliştirme

Gereken: Node 22.6 ve üstü. Tek geliştirme bağımlılığı `typescript`.

```sh
npm install
npm run check
```

`npm run check` sırasıyla tip kontrolü, testler ve coverage, build, boyut bütçesi, paket kontrolü, smoke testleri, doküman örneklerinin doğrulanması ve Node örneğini çalıştırır.

| Komut | İşi |
|---|---|
| `npm test` | Testleri çalıştırır (`node:test`) |
| `npm run test:coverage` | Testler ve coverage eşikleri (satır %95, dal %90, fonksiyon %95) |
| `npm run typecheck` | Tip kontrolü |
| `npm run build` | `dist/esm` ve `dist/cjs` üretir, dış import olmadığını doğrular |
| `npm run size` | Gzip boyut bütçesini kontrol eder |
| `npm run check:package` | `exports`, ESM/CJS eşleşmesi, kullanıcı tipleri ve paket içeriği |
| `npm run smoke` | Derlenmiş paketi ESM ve CJS olarak yükler |
| `npm run check:docs` | README ve doküman örneklerinin sonuçlarını derlenmiş pakette doğrular |
| `npm run example` | Node örneğini çalıştırır |
| `npm run serve` | Tarayıcı örneğini http://127.0.0.1:5173 adresinde açar |

Tasarım kararları ve teknik şartname: [SPEC.md](./SPEC.md).

## English

Turkiye.js provides validation, formatting and text utilities for Türkiye: national ID (TCKN), tax ID (VKN), IBAN, phone, card, money, address, date, vehicle plate and Turkish text rules. Zero dependencies, fully typed, tree-shakeable, works in every JavaScript runtime. Full documentation is in Turkish: [docs](./docs/README.md).

## Lisans

[MIT](./LICENSE) © 2026 [Hamza Akyüz](https://github.com/Hamza-AKYUZ)

---

<div align="center">

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.

[akysoft.com](https://akysoft.com)

</div>
