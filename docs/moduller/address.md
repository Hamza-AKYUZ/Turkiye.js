[Doküman](../README.md) / Modüller / **address**

# address: İl ve posta kodu

```ts nocheck
import { address } from "turkiye.js";
import * as address from "turkiye.js/address";
```

81 ili plaka kodlarıyla sunar. İlçe ve mahalle listeleri zamanla değiştiği için pakette yoktur.

## Fonksiyonlar

| Fonksiyon | Döner | Açıklama |
|---|---|---|
| `provinces()` | `readonly Province[]` | 81 il, plaka kodu sırasıyla; değiştirilemez |
| `province(kod)` | `Province \| null` | Plaka koduna göre il |
| `findProvince(arama)` | `Province \| null` | Kod ya da adla arama |
| `isValidPostalCode(kod, il?)` | `boolean` | Posta kodu yapısı |

`Province`: `{ code: number, name: string }`.

## Örnekler

```ts
import { address } from "turkiye.js";

address.provinces().length; // 81
address.provinces()[0]; // { code: 1, name: "Adana" }
address.province(6); // { code: 6, name: "Ankara" }
address.province(82); // null

address.findProvince(34); // { code: 34, name: "İstanbul" }
address.findProvince("06"); // { code: 6, name: "Ankara" }
address.findProvince("istanbul"); // { code: 34, name: "İstanbul" }
address.findProvince("IST"); // { code: 34, name: "İstanbul" }
address.findProvince("Kırşehir"); // { code: 40, name: "Kırşehir" }
```

`findProvince` ad aramasında harf büyüklüğü ve Türkçe karakter farkını yok sayar. Tam eşleşme yoksa adı aranan ifadeyle başlayan ilk il döner.

## Posta kodu

Posta kodunun yalnız yapısı denetlenir: 5 hane ve ilk 2 hane il plaka kodu (01-81). Kodun gerçekten kullanımda olup olmadığına bakılmaz.

```ts
import { address } from "turkiye.js";

address.isValidPostalCode("34710"); // true
address.isValidPostalCode("34710", "İstanbul"); // true
address.isValidPostalCode("34710", 6); // false
address.isValidPostalCode("99000"); // false
```

---

[Doküman ana sayfası](../README.md) · [Tüm modüller](../README.md#modüller) · Önceki: [money](./money.md) · Sonraki: [date](./date.md)

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.
