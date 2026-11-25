# card: Kart numarası

```ts nocheck
import { card } from "turkiye.js";
import * as card from "turkiye.js/card";
```

Kredi ve banka kartı numarasını Luhn algoritmasıyla doğrular, ağı (Visa, Mastercard, Troy, Amex) bulur.

## Fonksiyonlar

| Fonksiyon | Döner | Açıklama |
|---|---|---|
| `normalize(x)` | `string` | Boşluk, tire ve noktaları siler |
| `validate(x)` | `Result<Card>` | Uzunluk ağa göre, ardından Luhn |
| `isValid(x)` | `boolean` | |
| `parse(x)` | `Card` | Geçersizde `TurkiyeError` |
| `format(x)` | `string` | Amex 4-6-5, diğerleri dörderli |
| `mask(x)` | `string` | İlk 4 ve son 4 hane görünür |
| `brand(x)` | `"visa" \| "mastercard" \| "troy" \| "amex" \| null` | İlk haneler yeterli |
| `isExpiryValid(ay, yıl, now?)` | `boolean` | Son kullanma tarihi geçmemiş mi |
| `isCvvValid(cvv, ağ?)` | `boolean` | Amex için 4, diğerleri için 3 hane |
| `schema()` | `StandardSchemaV1<string, Card>` | |

## Ağa göre uzunluk

| Ağ | Başlangıç | Uzunluk |
|---|---|---|
| Visa | 4 | 13, 16, 19 |
| Mastercard | 51-55, 2221-2720 | 16 |
| Troy | 9792 | 16 |
| Amex | 34, 37 | 15 |
| Bilinmeyen | | 12-19 |

## Örnekler

```ts
import { card } from "turkiye.js";

card.isValid("4543 5900 0000 0006"); // true
card.brand("9792 03"); // "troy"
card.brand("5555"); // "mastercard"
card.format("378282246310005"); // "3782 822463 10005"
card.mask("4543590000000006"); // "4543 **** **** 0006"
card.validate("4543 5900 0000 0007").code; // "CHECKSUM"

card.isExpiryValid(12, 2030, new Date(2026, 10, 25)); // true
card.isExpiryValid("10", "26", new Date(2026, 10, 25)); // false
card.isCvvValid("123"); // true
card.isCvvValid("123", "amex"); // false
```

`isExpiryValid` iki haneli yılı 2000'li yıl olarak okur; kart, son kullanma ayının son gününe kadar geçerli sayılır.

Kart numaraları hassas veridir. `mask` geçersiz girdide hiçbir rakamı göstermez; böylece hatalı numara da maskelenmeden ekrana ya da günlüğe çıkmaz.

Pakette banka (BIN) listesi yoktur; bu liste sık değiştiği için kapsam dışıdır.

---

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.
