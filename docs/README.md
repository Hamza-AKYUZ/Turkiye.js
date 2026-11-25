<div align="center">

# Türkiye.js Doküman

Türkiye'ye özgü doğrulama, biçimleme ve metin araçlarının tam rehberi

[Ana sayfa](../README.md) · [Kurulum](#kurulum) · [Modüller](#modüller) · [Temel kavramlar](#temel-kavramlar) · [Örnekler](../examples/README.md)

</div>

---

## Kurulum

Kullandığınız ortamın rehberini seçin. Her rehber kurulumdan çalışan bir örneğe kadar adım adım ilerler.

| Ortam | Rehber | İçerik |
|---|---|---|
| **Node.js** | [Kurulum](./kurulum/node.md) | ESM ve CommonJS, API'de form doğrulama, Express |
| **React** | [Kurulum](./kurulum/react.md) | Vite, `useMask`, form gönderme, React Hook Form ve Zod |
| **Next.js** | [Kurulum](./kurulum/nextjs.md) | Sunucu bileşeni, Server Action, route handler, hydration |
| **Vue ve Nuxt** | [Kurulum](./kurulum/vue.md) | `v-mask` direktifi, Nuxt eklentisi ve sunucu doğrulaması |
| **Svelte ve SvelteKit** | [Kurulum](./kurulum/svelte.md) | `use:mask` action'ı, form action |
| **Tarayıcı** | [Kurulum](./kurulum/tarayici.md) | Build aracı olmadan CDN, import map, saf HTML form |
| **React Native ve Expo** | [Kurulum](./kurulum/react-native.md) | `TextInput` ile maske, klavye türleri |
| **Bun, Deno, Edge** | [Kurulum](./kurulum/bun-deno.md) | `npm:` öneki, Cloudflare Workers |
| **TypeScript** | [Kurulum](./kurulum/typescript.md) | tsconfig, işaretli tipler, Result tipi |

## Modüller

### Kimlik ve finans

| Modül | Ne yapar | Örnek |
|---|---|---|
| [tckn](./moduller/tckn.md) | TC Kimlik No ve Yabancı Kimlik No doğrulama | `tckn.mask("10000000146")` &rarr; `100******46` |
| [vkn](./moduller/vkn.md) | Vergi Kimlik No, VKN/TCKN ayrımı | `vkn.detectTaxId("10000000146")` &rarr; `tckn` |
| [iban](./moduller/iban.md) | TR IBAN doğrulama, banka kodu | `iban.bankCode("TR12 0006 2")` &rarr; `00062` |
| [card](./moduller/card.md) | Kart numarası, ağ, son kullanma tarihi | `card.brand("9792 03")` &rarr; `troy` |
| [money](./moduller/money.md) | Para biçimi, tutar okuma, yazıyla tutar, KDV | `money.format(1234.5)` &rarr; `1.234,50 ₺` |

### İletişim ve adres

| Modül | Ne yapar | Örnek |
|---|---|---|
| [phone](./moduller/phone.md) | Cep, sabit hat ve özel numaralar | `phone.format("5321234567")` &rarr; `0532 123 45 67` |
| [address](./moduller/address.md) | 81 il, plaka kodu, posta kodu yapısı | `address.findProvince("izmir")` &rarr; `{ code: 35, ... }` |
| [company](./moduller/company.md) | MERSİS numarası | `company.mersis.isValid("0123456789012345")` |
| [vehicle](./moduller/vehicle.md) | Plaka ve şasi numarası (VIN) | `vehicle.plate.format("34abc123")` &rarr; `34 ABC 123` |

### Metin ve tarih

| Modül | Ne yapar | Örnek |
|---|---|---|
| [text](./moduller/text.md) | Türkçe büyük/küçük harf, sıralama, arama, hal ekleri | `text.suffix("Ankara", "dative")` &rarr; `Ankara'ya` |
| [date](./moduller/date.md) | Türkçe tarih, göreli zaman, resmî tatil, iş günü | `date.format("2026-11-25")` &rarr; `25 Kasım 2026 Çarşamba` |

### Form girişi

| Modül | Ne yapar | Örnek |
|---|---|---|
| [mask](./moduller/mask.md) | Yazarken biçimleme, imleç korunur | `TR3300061` &rarr; `TR33 0006 1` |
| [react](./moduller/react.md) | `useMask` hook'u | `<input {...iban.inputProps} />` |

---

## Temel kavramlar

### İçe aktarma

```ts
import { iban, tckn } from "turkiye.js";

tckn.isValid("10000000146"); // true
iban.isValid("TR330006100519786457841326"); // true
```

Her modül ayrı alt yoldan da alınabilir; bundle'a yalnız kullanılan modül girer:

```ts
import { isValid } from "turkiye.js/tckn";
import { plate } from "turkiye.js/vehicle";

isValid("10000000146"); // true
plate.format("34abc123"); // "34 ABC 123"
```

### Ortak fonksiyonlar

Doğrulama modülleri (`tckn`, `vkn`, `iban`, `phone`, `card`, `vehicle.plate`, `vehicle.vin`, `company.mersis`) aynı fonksiyon setini sunar. Birini öğrenen hepsini kullanır.

| Fonksiyon | Döner | Hata fırlatır mı | Ne zaman kullanılır |
|---|---|---|---|
| `isValid(x)` | `boolean` | Hayır | Basit evet/hayır kontrolü |
| `validate(x)` | `Result<T>` | Hayır | Hata kodu ve mesajı gerektiğinde |
| `parse(x)` | Doğrulanmış değer | Evet | Değerin geçerli olması beklendiğinde |
| `normalize(x)` | Temiz metin | Hayır | Kaydetmeden önce temizlemek için |
| `format(x)` | Okunaklı metin | Hayır | Ekranda göstermek için |
| `mask(x)` | Kısmen gizli metin | Hayır | Kişisel veriyi gizlemek için |
| `schema()` | Standard Schema | Hayır | Zod, Valibot ve form kütüphaneleri |

`plate`, `vin` ve `mersis` modüllerinde `mask` yoktur. Geçersiz girdide `format` temizlenmiş değeri, `mask` tamamen gizlenmiş metni döner; böylece hatalı veri maskelenmeden ekrana çıkmaz.

### Sonuç tipi

```ts
import { tckn } from "turkiye.js";

tckn.validate("10000000146"); // { ok: true, value: "10000000146" }
tckn.validate("10000000145"); // { ok: false, code: "CHECKSUM", message: "TCKN kontrol basamağı hatalı" }
```

`ok: true` ise `value` doğrulanmış ve tip seviyesinde işaretlenmiş (`Tckn`, `Iban` gibi) değerdir. Ayrıntı: [TypeScript rehberi](./kurulum/typescript.md).

### Hata kodları

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

Kodlar sürümler arasında değişmez. Uygulama mantığı `message` yerine `code` alanına göre kurulur.

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

### Hata mesajlarını değiştirme

Mesajlar Türkçedir. `setMessages` ile uygulama genelinde değiştirilir; `{label}` alan adıyla, `{expected}` beklenen değerle değiştirilir.

```ts
import { resetMessages, setMessages, tckn } from "turkiye.js";

setMessages({ LENGTH: "{label} must be {expected} digits" });
tckn.validate("123").message; // "TCKN must be 11 digits"

resetMessages();
tckn.validate("123").message; // "TCKN uzunluğu 11 olmalı"
```

### Hatalı girdi

| Durum | Sonuç |
|---|---|
| Doğrulama fonksiyonuna `null`, `undefined`, nesne | Hata fırlatmaz; `validate` `FORMAT` sonucu, `normalize` boş metin döner |
| `text` fonksiyonuna metin olmayan değer | Sayılar metne çevrilir, diğerleri boş metin sayılır |
| Seçenek nesnesi yerine `null` | Seçenek vermemekle aynı |
| Bilinmeyen hal adı ya da maske türü | Açık mesajlı `TypeError` |

```ts
import { tckn, text } from "turkiye.js";

tckn.isValid(null); // false
tckn.validate(undefined).code; // "FORMAT"
text.toUpper(null); // ""
```

### Çalıştığı ortamlar

Paket yalnız ECMAScript standardını kullanır; `node:*`, `Buffer`, `process` ya da `Intl` gerektirmez.

| Ortam | Durum |
|---|---|
| Node 14, 16, 18, 20, 22, 24 | CI'da test edilir |
| Bun, Deno | CI'da test edilir |
| Windows, macOS, Linux | CI'da test edilir |
| Tarayıcılar | Chrome ve Edge 80+, Firefox 78+, Safari 13.1+ |
| React Native (Hermes) | `Intl` gerekmez, ek ayar yok |
| Cloudflare Workers, Vercel Edge | `nodejs_compat` gerekmez |

Paketin ESM ve CommonJS kopyaları aynı uygulamada birlikte yüklenirse `instanceof TurkiyeError` ve `setMessages` ayarı iki kopyada da geçerlidir.

### Veri politikası

Paket yalnız kurala dayalı hesaplar ve kalıcı veriler içerir: 81 il ve plaka kodları, sabit hat alan kodları, 2429 sayılı Kanun'daki sabit tarihli tatiller. Banka adları, ilçe ve mahalle, vergi dairesi ve dini bayram tarihleri gibi zamanla değişen listeler pakette yoktur; gerektiğinde uygulama kendi verisini parametre olarak verir.

### Doğrulanmış örnekler

Bu dokümandaki `ifade; // sonuç` biçimindeki örnekler her sürümde derlenmiş pakette çalıştırılır ve sonuçları karşılaştırılır (`npm run check:docs`). Dokümanda yazan sonuç, paketin verdiği sonuçtur.

---

<div align="center">

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.

</div>
