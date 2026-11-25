# Türkiye.js dokümanı

Bu klasör her modülün tüm fonksiyonlarını, dönüş değerlerini ve kurallarını anlatır. Kısa tanıtım için ana [README](../README.md) dosyasına bakın.

Buradaki tüm `ifade; // sonuç` örnekleri her sürümde derlenmiş pakette çalıştırılarak doğrulanır (`npm run check:docs`).

## Modüller

| Modül | İçerik |
|---|---|
| [tckn](./tckn.md) | TC Kimlik No ve Yabancı Kimlik No |
| [vkn](./vkn.md) | Vergi Kimlik No, VKN/TCKN ayrımı |
| [iban](./iban.md) | TR IBAN, banka kodu |
| [phone](./phone.md) | Cep, sabit hat, özel numaralar |
| [card](./card.md) | Kart numarası, son kullanma tarihi, CVV |
| [text](./text.md) | Türkçe büyük/küçük harf, sıralama, arama, hal ekleri, sayıyı yazıya çevirme |
| [money](./money.md) | Para biçimi, tutar okuma, tutarı yazıyla yazma, KDV |
| [address](./address.md) | 81 il, plaka kodları, posta kodu yapısı |
| [date](./date.md) | Türkçe tarih, göreli zaman, resmî tatiller, iş günü |
| [company](./company.md) | MERSİS numarası |
| [vehicle](./vehicle.md) | Plaka, şasi numarası (VIN) |
| [mask](./mask.md) | Yazarken format, saf JavaScript için `attachMask` |
| [react](./react.md) | `useMask` hook'u |

## İçe aktarma

```ts
import { iban, tckn } from "turkiye.js";

tckn.isValid("10000000146"); // true
iban.isValid("TR330006100519786457841326"); // true
```

Her modül ayrı alt yoldan da alınabilir. Bundle'a yalnız kullanılan modül girer:

```ts
import { isValid } from "turkiye.js/tckn";
import { plate } from "turkiye.js/vehicle";

isValid("10000000146"); // true
plate.format("34abc123"); // "34 ABC 123"
```

CommonJS:

```js nocheck
const { tckn } = require("turkiye.js");
const iban = require("turkiye.js/iban");
```

## Ortak fonksiyonlar

Doğrulama modülleri (`tckn`, `vkn`, `iban`, `phone`, `card`, `vehicle.plate`, `vehicle.vin`, `company.mersis`) aynı fonksiyon setini sunar:

| Fonksiyon | Döner | Hata fırlatır mı |
|---|---|---|
| `isValid(x)` | `boolean` | Hayır |
| `validate(x)` | `Result<T>` | Hayır |
| `parse(x)` | Doğrulanmış değer | Evet, `TurkiyeError` |
| `normalize(x)` | Ayraçları silinmiş metin | Hayır |
| `format(x)` | Okunaklı metin; geçersiz girdide `normalize` sonucu | Hayır |
| `mask(x)` | Kısmen gizlenmiş metin; geçersiz girdide tamamı gizlenir | Hayır |
| `schema()` | Standard Schema nesnesi | Hayır |

`plate`, `vin` ve `mersis` modüllerinde `mask` yoktur.

## Sonuç tipi

```ts
import { tckn } from "turkiye.js";

tckn.validate("10000000146"); // { ok: true, value: "10000000146" }
tckn.validate("10000000145"); // { ok: false, code: "CHECKSUM", message: "TCKN kontrol basamağı hatalı" }
```

`validate` sonucu `ok` alanına göre daraltılır. `ok: true` ise `value` doğrulanmış ve tip seviyesinde işaretlenmiş (`Tckn`, `Iban` gibi) değerdir; bu değer yalnız doğrulamadan geçmiş veriyi kabul eden fonksiyonlara verilebilir:

```ts nocheck
import { tckn } from "turkiye.js";
import type { Tckn } from "turkiye.js/tckn";

function save(id: Tckn) {}

const result = tckn.validate(input);
if (result.ok) save(result.value);
save("123"); // Tip hatası: string, Tckn değildir
```

## Hata kodları

| Kod | Anlamı |
|---|---|
| `EMPTY` | Girdi boş |
| `INVALID_CHARS` | İzin verilmeyen karakter var |
| `LENGTH` | Uzunluk hatalı |
| `CHECKSUM` | Kontrol basamağı hatalı |
| `FORMAT` | Biçim hatalı ya da girdi metin değil |
| `COUNTRY` | Ülke kodu hatalı |
| `UNKNOWN_BANK` | Banka kodu tanınmıyor |
| `RANGE` | Değer izin verilen aralıkta değil |
| `EXPIRED` | Süresi dolmuş |

Kodlar sürümler arasında değişmez. Uygulama mantığı `message` yerine `code` alanına göre kurulmalıdır.

`parse` fonksiyonları ve `money`, `date`, `text.numberToWords` gibi hesap fonksiyonları `TurkiyeError` fırlatır:

```ts
import { money, TurkiyeError } from "turkiye.js";

try {
  money.parse("on lira");
} catch (error) {
  error instanceof TurkiyeError; // true
  error.code; // "FORMAT"
}
```

## Hata mesajları

Mesajlar Türkçedir. `setMessages` ile uygulama genelinde değiştirilir; `{label}` alan adıyla, `{expected}` beklenen değerle değiştirilir.

```ts
import { resetMessages, setMessages, tckn } from "turkiye.js";

setMessages({ LENGTH: "{label} must be {expected} digits" });
tckn.validate("123").message; // "TCKN must be 11 digits"

resetMessages();
tckn.validate("123").message; // "TCKN uzunluğu 11 olmalı"
```

## Form kütüphaneleri

`schema()` [Standard Schema](https://standardschema.dev) arayüzünü uygular. Zod, Valibot, ArkType ve bu arayüzü destekleyen form kütüphaneleriyle ek paket gerekmeden çalışır.

```ts nocheck
import { z } from "zod";
import { iban, tckn } from "turkiye.js";

const form = z.object({
  tckn: z.string().pipe(tckn.schema()),
  iban: z.string().pipe(iban.schema()),
});
```

## Hatalı girdi

- Doğrulama fonksiyonları hiçbir girdide hata fırlatmaz. `null`, `undefined` ya da nesne verilirse `validate` `FORMAT` sonucu, `normalize` boş metin döner.
- `text` fonksiyonları sayıları metne çevirir, diğer metin olmayan değerleri boş metin sayar.
- Seçenek nesnesi yerine `null` verilmesi, seçenek vermemekle aynıdır.
- Bilinmeyen hal adı ya da maske türü gibi geliştirici hataları açık mesajlı `TypeError` verir.

```ts
import { tckn, text } from "turkiye.js";

tckn.isValid(null); // false
tckn.validate(undefined).code; // "FORMAT"
text.toUpper(null); // ""
```

## Çalıştığı ortamlar

Paket yalnız ECMAScript standardını kullanır; `node:*`, `Buffer`, `process` ya da `Intl` gerektirmez.

| Ortam | Durum |
|---|---|
| Node 18, 20, 22, 24 | CI'da test edilir |
| Bun, Deno | CI'da test edilir |
| Windows, macOS, Linux | CI'da test edilir |
| Tarayıcılar | Derleme hedefi ES2020 |
| React, Next.js, Vue, Svelte | Saf fonksiyonlar; React için ayrıca [useMask](./react.md) |
| React Native (Hermes) | `Intl` kullanılmadığı için ek ayar gerekmez |

Paketin ESM ve CommonJS kopyaları aynı uygulamada birlikte yüklenirse `instanceof TurkiyeError` ve `setMessages` ayarı iki kopyada da geçerlidir.

## Veri politikası

Paket yalnız kurala dayalı hesaplar ve kalıcı veriler içerir: 81 il ve plaka kodları, sabit hat alan kodları, 2429 sayılı Kanun'daki sabit tarihli tatiller. Banka adları, ilçe ve mahalle, vergi dairesi ve dini bayram tarihleri gibi zamanla değişen listeler pakette yoktur; gerektiğinde uygulama kendi verisini parametre olarak verir.

---

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.
