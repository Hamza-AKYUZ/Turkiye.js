[Doküman](../README.md) / Modüller / **vehicle**

# vehicle: Araç

```ts nocheck
import { vehicle } from "turkiye.js";
import { plate, vin } from "turkiye.js/vehicle";
```

## plate: Plaka

| Fonksiyon | Döner | Açıklama |
|---|---|---|
| `normalize(x)` | `string` | Boşluk ve tireleri siler, harfleri büyütür |
| `validate(x)` | `Result<Plate>` | |
| `isValid(x)` | `boolean` | |
| `parse(x)` | `Plate` | Geçersizde `TurkiyeError` |
| `format(x)` | `string` | `"34 ABC 123"` |
| `province(x)` | `Province \| null` | Plakanın ili |
| `schema()` | `StandardSchemaV1<string, Plate>` | |

Kurallar:

| Harf sayısı | Rakam sayısı | Örnek |
|---|---|---|
| 1 | 4-5 | 35 B 1234, 35 B 12345 |
| 2 | 3-4 | 06 AB 123, 06 AB 1234 |
| 3 | 2-3 | 34 ABC 12, 34 ABC 123 |

İl kodu 01-81 arasıdır. Q, W ve X harfleri ile Türkçe karakterler kullanılmaz.

```ts
import { vehicle } from "turkiye.js";

vehicle.plate.isValid("34 ABC 123"); // true
vehicle.plate.normalize("34 abc 123"); // "34ABC123"
vehicle.plate.format("34abc123"); // "34 ABC 123"
vehicle.plate.province("35 B 12345"); // { code: 35, name: "İzmir" }

vehicle.plate.validate("34 ABC 1234").code; // "FORMAT"
vehicle.plate.validate("82 ABC 12").code; // "RANGE"
vehicle.plate.validate("34 QWX 12").code; // "INVALID_CHARS"
```

## vin: Şasi numarası

| Fonksiyon | Döner | Açıklama |
|---|---|---|
| `normalize(x)` | `string` | Boşluk ve tireleri siler, harfleri büyütür |
| `validate(x, opts?)` | `Result<Vin>` | 17 karakter; I, O, Q kullanılmaz |
| `isValid(x, opts?)` | `boolean` | |
| `parse(x, opts?)` | `Vin` | Geçersizde `TurkiyeError` |
| `format(x)` | `string` | 17 karakter, büyük harf |
| `hasValidCheckDigit(x)` | `boolean` | 9. karakter (ISO 3779 kontrol basamağı) doğru mu |
| `schema()` | `StandardSchemaV1<string, Vin>` | Kontrol basamağı denetlenmez |

Kontrol basamağı yalnız Kuzey Amerika'da zorunludur; Avrupa'da üretilen araçların çoğunda tutmaz. Bu yüzden `validate` kontrol basamağını varsayılan olarak denetlemez; `{ checkDigit: true }` ile açılır.

```ts
import { vehicle } from "turkiye.js";

vehicle.vin.isValid("WVWZZZ1JZXW000001"); // true
vehicle.vin.format("wvwzzz1jzxw000001"); // "WVWZZZ1JZXW000001"
vehicle.vin.hasValidCheckDigit("1M8GDM9AXKP042788"); // true
vehicle.vin.isValid("WVWZZZ1JZXW000001", { checkDigit: true }); // false
vehicle.vin.validate("1M8GDM9AXKP04278").code; // "LENGTH"
vehicle.vin.validate("1M8GDM9AXKP04278I").code; // "INVALID_CHARS"
```

Yazarken plaka biçimlemek için [PlateMask](./mask.md) kullanılır.

---

[Doküman ana sayfası](../README.md) · [Tüm modüller](../README.md#modüller) · Önceki: [company](./company.md) · Sonraki: [mask](./mask.md)

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.
