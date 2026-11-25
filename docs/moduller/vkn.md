[Doküman](../README.md) / Modüller / **vkn**

# vkn: Vergi Kimlik No

```ts nocheck
import { vkn } from "turkiye.js";
import * as vkn from "turkiye.js/vkn";
```

Tüzel kişilerin 10 haneli Vergi Kimlik Numarasını GİB algoritmasıyla doğrular. Girdi metin ya da sayı olabilir.

## Fonksiyonlar

| Fonksiyon | Döner | Açıklama |
|---|---|---|
| `normalize(x)` | `string` | Boşluk, tire ve noktaları siler |
| `validate(x)` | `Result<Vkn>` | |
| `isValid(x)` | `boolean` | |
| `parse(x)` | `Vkn` | Geçersizde `TurkiyeError` |
| `format(x)` | `string` | 10 hane; geçersizde `normalize` sonucu |
| `mask(x)` | `string` | İlk 2 ve son 2 hane görünür |
| `detectTaxId(x)` | `"vkn" \| "tckn" \| null` | Vergi numarası alanındaki değerin türü |
| `generate(opts?)` | `Vkn` | Test için geçerli numara |
| `schema()` | `StandardSchemaV1<string \| number, Vkn>` | |

## Örnekler

```ts
import { vkn } from "turkiye.js";

vkn.isValid("1234567890"); // true
vkn.format("123 456 78 90"); // "1234567890"
vkn.mask("1234567890"); // "12******90"
vkn.validate("1234567891").code; // "CHECKSUM"
vkn.validate("123456789").code; // "LENGTH"
```

## VKN ve TCKN ayrımı

Şahıs işletmeleri vergi numarası olarak TCKN kullanır. Fatura ve cari hesap formlarında alana girilen değerin türü `detectTaxId` ile bulunur:

```ts
import { vkn } from "turkiye.js";

vkn.detectTaxId("1234567890"); // "vkn"
vkn.detectTaxId("10000000146"); // "tckn"
vkn.detectTaxId("12"); // null
vkn.isValid(vkn.generate()); // true
```

`generate` yalnız test ve örnek veri içindir.

---

[Doküman ana sayfası](../README.md) · [Tüm modüller](../README.md#modüller) · Önceki: [tckn](./tckn.md) · Sonraki: [iban](./iban.md)

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.
