[Doküman](../README.md) / Modüller / **iban**

# iban: TR IBAN

```ts nocheck
import { iban } from "turkiye.js";
import * as iban from "turkiye.js/iban";
```

Türkiye IBAN'ını (26 karakter, `TR` ile başlar) ISO 13616 mod 97 kontrolüyle doğrular.

## Fonksiyonlar

| Fonksiyon | Döner | Açıklama |
|---|---|---|
| `normalize(x)` | `string` | Ayraçları siler, harfleri büyütür, baştaki "IBAN:" yazısını atar |
| `validate(x)` | `Result<Iban>` | |
| `isValid(x)` | `boolean` | |
| `parse(x)` | `Iban` | Geçersizde `TurkiyeError` |
| `format(x)` | `string` | Dörderli gruplar |
| `mask(x)` | `string` | İlk 4 ve son 6 karakter görünür |
| `bankCode(x)` | `string \| null` | 5 haneli banka (EFT) kodu; ilk 9 karakter yeterli |
| `info(x)` | `IbanInfo \| null` | IBAN'ın parçaları |
| `schema()` | `StandardSchemaV1<string, Iban>` | |

## Kurallar

1. `TR` ile başlar, 26 karakterdir.
2. `TR`'den sonra yalnız rakam bulunur.
3. 5 haneli banka kodundan sonraki rezerv hane `0`'dır.
4. Mod 97 kontrolünün sonucu 1'dir.

## Örnekler

```ts
import { iban } from "turkiye.js";

iban.isValid("TR33 0006 1005 1978 6457 8413 26"); // true
iban.normalize("IBAN: tr33 0006-1005"); // "TR3300061005"
iban.format("tr330006100519786457841326"); // "TR33 0006 1005 1978 6457 8413 26"
iban.mask("TR330006100519786457841326"); // "TR33 **** **** **** **** 8413 26"

iban.validate("DE89370400440532013000").code; // "COUNTRY"
iban.validate("TR33000610051978645784132").code; // "LENGTH"
iban.validate("TR340006100519786457841326").code; // "CHECKSUM"
```

## Banka kodu

Banka adları zamanla değiştiği (birleşme, devir, yeni banka) için pakette banka listesi yoktur. `bankCode` yalnız kodu döner; kodu ada çevirmek uygulamanın kendi verisiyle yapılır. Kullanıcı IBAN'ı yazarken ilk 9 karakter yeterlidir.

```ts
import { iban } from "turkiye.js";

iban.bankCode("TR12 0006 2"); // "00062"
iban.info("TR330006100519786457841326"); // { country: "TR", checkDigits: "33", bankCode: "00061", reserved: "0", accountNumber: "0519786457841326" }
iban.info("TR00"); // null
```

---

[Doküman ana sayfası](../README.md) · [Tüm modüller](../README.md#modüller) · Önceki: [vkn](./vkn.md) · Sonraki: [phone](./phone.md)

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.
