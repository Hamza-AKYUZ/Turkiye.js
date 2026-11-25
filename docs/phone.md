# phone: Telefon numarası

```ts nocheck
import { phone } from "turkiye.js";
import * as phone from "turkiye.js/phone";
```

Türkiye'deki cep, sabit hat ve özel numaraları doğrular. Doğrulanmış değer E.164 biçimindedir: `"+905321234567"`.

## Fonksiyonlar

| Fonksiyon | Döner | Açıklama |
|---|---|---|
| `normalize(x)` | `string` | E.164 biçimine çevirir; tanınmayan girdide ayraçları silinmiş değeri döner |
| `validate(x)` | `Result<Phone>` | |
| `isValid(x)` | `boolean` | |
| `parse(x)` | `Phone` | Geçersizde `TurkiyeError` |
| `format(x, style?)` | `string` | `"national"` (varsayılan), `"international"`, `"e164"` |
| `mask(x)` | `string` | Önek ve son 2 hane görünür |
| `type(x)` | `"mobile" \| "landline" \| "special" \| null` | |
| `area(x)` | `{ code, province } \| null` | Sabit hattın alan kodu ve ili |
| `schema()` | `StandardSchemaV1<string, Phone>` | |

## Kabul edilen numaralar

| Tür | Örnek |
|---|---|
| Cep (`mobile`) | 05xx ile başlayan 10 hane |
| Sabit hat (`landline`) | İl alan koduyla başlayan 10 hane |
| Özel (`special`) | 0850, 0800, 0900 ve 444 xxxx |

Girdi `0532...`, `532...`, `+90 532...`, `0090 532...` ya da `90532...` biçiminde olabilir. Boşluk, tire, nokta, parantez ve eğik çizgi yok sayılır.

## Örnekler

```ts
import { phone } from "turkiye.js";

phone.normalize("0532 123 45 67"); // "+905321234567"
phone.normalize("+90 (532) 123-45-67"); // "+905321234567"
phone.format("5321234567"); // "0532 123 45 67"
phone.format("5321234567", "international"); // "+90 532 123 45 67"
phone.format("0532 123 45 67", "e164"); // "+905321234567"
phone.format("4441444"); // "444 1 444"
phone.mask("05321234567"); // "0532 *** ** 67"

phone.type("05321234567"); // "mobile"
phone.type("0212 123 45 67"); // "landline"
phone.type("0850 222 11 11"); // "special"
phone.area("0216 123 45 67"); // { code: "216", province: "İstanbul" }

phone.validate("+1 202 555 0100").code; // "COUNTRY"
phone.validate("0532123456").code; // "FORMAT"
```

Alan kodu tablosu 81 ili kapsar; İstanbul'un iki kodu (212 ve 216) vardır.

---

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.
