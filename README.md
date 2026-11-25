# Türkiye.js

Türkiye'ye özgü doğrulama, formatlama ve metin araçları. TCKN, VKN, IBAN, telefon, kart, para, adres, tarih ve daha fazlası tek pakette.

- **Sıfır bağımlılık:** Pakette hiçbir dış bağımlılık yok.
- **Her yerde çalışır:** Tarayıcı, React, Vue, Svelte, Node, Bun, Deno, Next.js, Edge, React Native.
- **TypeScript:** Tipler paketle gelir, doğrulanmış değerler tip seviyesinde işaretlenir.
- **Tree-shaking:** Yalnız kullandığın modül bundle'a girer.

> **Durum:** Geliştirme aşamasında, henüz yayınlanmadı. Hazır modüller: `tckn`, `vkn`, `iban`, `phone`, `card`, `text`, `money`, `address`, `date`, `company`, `vehicle`, `mask`, `react`. Plan için [SPEC.md](./SPEC.md) dosyasına bakın.

Paket yalnız kurala dayalı hesaplar ve kalıcı veriler içerir. Zamanla değişen listeler (banka adları, ilçe ve mahalle, vergi dairesi, dini bayram tarihleri) pakette yoktur; gerektiğinde uygulama kendi verisini verir.

## Kurulum

```sh
npm install turkiye.js
```

## Kullanım

```ts
import { card, iban, phone, tckn, vkn } from "turkiye.js";

tckn.isValid("10000000146");                 // true
tckn.mask("10000000146");                    // "100******46"

vkn.isValid("1234567890");                   // true
vkn.detectTaxId("10000000146");              // "tckn"

iban.format("tr330006100519786457841326");   // "TR33 0006 1005 1978 6457 8413 26"
iban.bankCode("TR12 0006 2");                // "00062"

phone.normalize("0532 123 45 67");           // "+905321234567"
phone.format("5321234567", "international"); // "+90 532 123 45 67"
phone.area("0232 123 45 67");                // { code: "232", province: "İzmir" }

card.brand("9792 03");                       // "troy"
card.mask("4543590000000006");               // "4543 **** **** 0006"
```

### Metin

```ts
import { text } from "turkiye.js";

text.toUpper("istanbul ılık");               // "İSTANBUL ILIK"
text.toTitle("ali ve veli");                 // "Ali ve Veli"
text.sort(["şeker", "çay", "su", "cam"]);    // ["cam", "çay", "su", "şeker"]
text.includes("Şişli Belediyesi", "sisli");  // true
text.slugify("Çalışma Saatleri");            // "calisma-saatleri"
text.numberToWords(1984);                    // "bin dokuz yüz seksen dört"

text.suffix("Ankara", "dative");             // "Ankara'ya"
text.suffix("İstanbul", "locative");         // "İstanbul'da"
text.suffix("40", "locative");               // "40'ta"
text.suffix("THY", "dative");                // "THY'ye"
text.suffix("kitap", "accusative");          // "kitabı"
```

`suffix` hal adları: `accusative` (-ı), `dative` (-a), `locative` (-da), `ablative` (-dan), `genitive` (-ın), `instrumental` (-la).

Ünsüz yumuşaması ve kısaltma okunuşu kelimenin yapısından tahmin edilir. Kurala uymayan kelimelerde seçenekle düzeltilebilir:

```ts
text.suffix("saat", "accusative", { harmony: "front" }); // "saati"
text.suffix("kanat", "accusative", { soften: true });    // "kanadı"
text.suffix("TOGG", "dative", { read: "word" });         // "TOGG'a"
```

### Para

```ts
import { money } from "turkiye.js";

money.format(1234.56);                               // "1.234,56 ₺"
money.format(1234.56, { symbol: "TL" });             // "1.234,56 TL"
money.parse("1.234,56 TL");                          // 1234.56
money.toWords(123.5);                                // "yüz yirmi üç lira elli kuruş"
money.addVat(100, 20);                               // 120
money.removeVat(120, 20);                            // 100
money.vatOf(120, 20, { included: true });            // 20
```

Hesaplar kuruş cinsinden tam sayıyla yapılır; `0.1 + 0.2` gibi kayan nokta hataları sonuca yansımaz.

### Adres

```ts
import { address } from "turkiye.js";

address.provinces().length;                  // 81
address.findProvince("istanbul");            // { code: 34, name: "İstanbul" }
address.findProvince("06");                  // { code: 6, name: "Ankara" }
address.isValidPostalCode("34710", 34);      // true
```

### Tarih

```ts
import { date } from "turkiye.js";

date.format("2026-11-25");                   // "25 Kasım 2026 Çarşamba"
date.format(new Date(), "DD.MM.YYYY HH:mm"); // "25.11.2026 14:30"
date.relative(fiveMinutesAgo);               // "5 dakika önce"
date.isBusinessDay("2026-10-29");            // false (Cumhuriyet Bayramı)
date.addBusinessDays("2026-11-27", 1);       // 30 Kasım 2026 Pazartesi
date.businessDaysBetween("2026-11-27", "2026-12-04"); // 5
```

Tarih metni ISO 8601 biçiminde verilir: `"2026-11-25"` ya da `"2026-11-25T14:30"`. `"25.11.2026"` gibi biçimler tarayıcılar arasında farklı yorumlandığı için `FORMAT` hatası verir.

`holidays(year)` yalnız kanunla belirlenmiş sabit tarihli tatilleri döner. Dini bayramlar her yıl değiştiği için iş günü hesabına uygulama tarafından eklenir:

```ts
const bayram = ["2026-03-20", "2026-03-21", "2026-03-22"];
date.addBusinessDays("2026-03-19", 2, { holidays: bayram }); // 24 Mart 2026
date.isBusinessDay("2026-11-28", { weekend: [0] });           // true (yalnız Pazar tatil)
```

### Araç ve şirket

```ts
import { company, vehicle } from "turkiye.js";

vehicle.plate.format("34abc123");            // "34 ABC 123"
vehicle.plate.province("35 B 12345");        // { code: 35, name: "İzmir" }
vehicle.vin.isValid("WVWZZZ1JZXW000001");    // true
vehicle.vin.hasValidCheckDigit("1M8GDM9AXKP042788"); // true
company.mersis.isValid("0123-4567-8901-2345"); // true
```

Şasi numarasının kontrol basamağı yalnız Kuzey Amerika'da zorunludur. `vin.validate` bu yüzden kontrol basamağını varsayılan olarak denetlemez; `{ checkDigit: true }` ile açılır.

### Yazarken format (maske)

```ts
import { createMask, IbanMask, MoneyMask } from "turkiye.js/mask";

const iban = new IbanMask();
iban.input("tr3300061");     // { value: "TR33 0006 1", raw: "TR3300061", cursor: 11, complete: false }

createMask("phone").input("53212").value;     // "0532 12"
createMask("plate").input("34abc1").value;    // "34 ABC 1"

const money = new MoneyMask();
money.input("1234567,5").value;               // "1.234.567,5"
money.toNumber();                             // 1234567.5
```

Maskeler: `TcknMask`, `VknMask`, `IbanMask`, `PhoneMask`, `CardMask`, `PlateMask`, `MoneyMask`. İmleç konumu korunur; bir ayraç silindiğinde ondan önceki karakter silinir.

Framework kullanmayan sayfalarda `attachMask` kullanılır. Dönen fonksiyon dinleyiciyi kaldırır:

```ts
import { attachMask, PhoneMask } from "turkiye.js/mask";

const detach = attachMask(document.querySelector("#telefon"), new PhoneMask());
// Input sayfadan kaldırılmadan önce:
detach();
```

### React

```tsx
import { useMask } from "turkiye.js/react";

function IbanInput() {
  const iban = useMask("iban");
  return <input {...iban.inputProps} aria-invalid={!iban.state.complete} />;
}
```

`useMask(kind, opts?)` şunları döner: `inputProps` (`value`, `onChange`, `ref`), `value`, `state`, `setValue` ve `reset`. `opts`: `{ initialValue?, decimals? }`. React yalnız bu alt yolu kullanan projede gerekir; tipler `@types/react` gerektirmez. Sunucuda render edilen sayfalarda ilk değer iki tarafta aynı sonucu verir.

Modüller ayrı ayrı da içe aktarılabilir:

```ts
import { isValid } from "turkiye.js/tckn";
```

### Ortak fonksiyonlar

Her doğrulama modülü aynı fonksiyon setini sunar:

| Fonksiyon | Döner | Throw eder mi |
|---|---|---|
| `isValid(x)` | `boolean` | Hayır |
| `validate(x)` | `Result<T>` | Hayır |
| `parse(x)` | Doğrulanmış değer | Evet, `TurkiyeError` |
| `normalize(x)` | Temizlenmiş metin | Hayır |
| `format(x)` | Okunaklı metin; geçersiz girdide `normalize` sonucu | Hayır |
| `mask(x)` | Kısmen gizlenmiş metin; geçersiz girdide tamamı gizlenir | Hayır |
| `schema()` | Standard Schema | Hayır |

### Modüllere özgü fonksiyonlar

| Modül | Fonksiyon | İşi |
|---|---|---|
| `tckn` | `kind(x)` | `"citizen"`, `"foreign"` (99 ile başlayan) ya da `null` |
| `tckn` | `generate(opts?)` | Test için geçerli numara. `{ foreign?: boolean, random?: () => number }` |
| `vkn` | `detectTaxId(x)` | Vergi numarası alanındaki değer VKN mi, TCKN mi |
| `vkn` | `generate(opts?)` | Test için geçerli numara |
| `iban` | `bankCode(x)` | 5 haneli banka (EFT) kodu; ilk 9 karakter yeterli |
| `iban` | `info(x)` | Ülke, kontrol hanesi, banka kodu, hesap numarası |
| `phone` | `format(x, style?)` | `"national"`, `"international"`, `"e164"` |
| `phone` | `type(x)` | `"mobile"`, `"landline"`, `"special"` ya da `null` |
| `phone` | `area(x)` | Sabit hattın alan kodu ve ili |
| `card` | `brand(x)` | `"visa"`, `"mastercard"`, `"troy"`, `"amex"` ya da `null` |
| `card` | `isExpiryValid(ay, yıl)` | Son kullanma tarihi geçmemiş mi |
| `card` | `isCvvValid(cvv, ağ?)` | Güvenlik kodu uzunluğu doğru mu |

### Form kütüphaneleriyle kullanım

`schema()` fonksiyonları [Standard Schema](https://standardschema.dev) arayüzünü uygular:

```ts
import { z } from "zod";
import { tckn } from "turkiye.js";

const form = z.object({ tckn: z.string().pipe(tckn.schema()) });
```

### Sonuç ve hatalar

```ts
import { TurkiyeError } from "turkiye.js";

const result = tckn.validate(input);
if (result.ok) {
  save(result.value);
} else {
  console.log(result.code);    // "CHECKSUM"
  console.log(result.message); // "TCKN kontrol basamağı hatalı"
}

try {
  tckn.parse(input);
} catch (error) {
  if (error instanceof TurkiyeError) console.log(error.code);
}
```

Uygulama mantığını `message` yerine her zaman `code` alanına göre kurun. Kodlar sabittir, mesajlar değiştirilebilir.

### Hata mesajlarını değiştirme

```ts
import { setMessages } from "turkiye.js";

setMessages({
  LENGTH: "{label} must be {expected} characters",
  CHECKSUM: "{label} is invalid",
});
```

Hata kodları: `EMPTY`, `INVALID_CHARS`, `LENGTH`, `CHECKSUM`, `FORMAT`, `COUNTRY`, `UNKNOWN_BANK`, `RANGE`, `EXPIRED`.

### Hatalı girdi

Doğrulama fonksiyonları hiçbir girdide hata fırlatmaz. `text` fonksiyonları metin olmayan girdiyi boş metin sayar. Seçenek nesnesi yerine `null` verilmesi varsayılan seçeneklerle aynıdır. Bilinmeyen hal adı ya da maske türü gibi geliştirici hataları açık mesajlı `TypeError` verir.

Paketin ESM ve CommonJS kopyaları aynı uygulamada birlikte yüklenirse `instanceof TurkiyeError` ve `setMessages` ayarı iki kopyada da geçerlidir.

Ayrıntılar: [SPEC.md](./SPEC.md)

## Geliştirme

Gereken: Node 22.6 veya üstü. Tek geliştirme bağımlılığı `typescript`.

```sh
npm install
npm run check   # tip kontrolü, test + coverage, build, boyut, paket ve smoke testleri
```

| Komut | İşi |
|---|---|
| `npm test` | Testleri çalıştırır (`node:test`) |
| `npm run test:coverage` | Testler + coverage eşikleri (satır %95, dal %90, fonksiyon %95) |
| `npm run typecheck` | `tsc` ile tip kontrolü |
| `npm run build` | `dist/esm` ve `dist/cjs` üretir, dış import olmadığını doğrular |
| `npm run size` | Gzip boyut bütçesini kontrol eder |
| `npm run check:package` | exports, ESM/CJS eşleşmesi, kullanıcı tipleri ve paket içeriği |
| `npm run smoke` | Derlenmiş paketi ESM ve CJS olarak yükler |

---

## English

Turkiye.js provides validation, formatting and text utilities for Türkiye: national ID (TCKN), tax ID (VKN), IBAN, phone, card, money, address, date and more. Zero dependencies, fully typed, tree-shakeable, works in every JavaScript runtime.

**Status:** In development, not yet published.

## Lisans

[MIT](./LICENSE) © 2026 [Hamza Akyüz](https://github.com/Hamza-AKYUZ)
