[Doküman](../README.md) / Modüller / **date**

# date: Tarih ve iş günü

```ts nocheck
import { date } from "turkiye.js";
import * as date from "turkiye.js/date";
```

Tarihi Türkçe yazar, göreli zaman üretir, resmî tatilleri ve iş günlerini hesaplar. `Intl` kullanmaz.

## Tarih girdisi

Fonksiyonlar `Date` nesnesi ya da ISO 8601 metni kabul eder:

| Biçim | Yorum |
|---|---|
| `"2026-11-25"` | Yerel saatle gün başı |
| `"2026-11-25T14:30"`, `"2026-11-25T14:30:15"` | Yerel saat |
| `"2026-11-25T11:30:00.000Z"`, `"...+03:00"` | Belirtilen saat dilimi |

`"25.11.2026"` ya da `"Nov 25 2026"` gibi metinler tarayıcılar arasında farklı yorumlandığı için `FORMAT` hatası verir. Geçersiz tarih (`"2026-02-30"`) de `FORMAT` hatası verir.

## Fonksiyonlar

| Fonksiyon | Döner | Açıklama |
|---|---|---|
| `format(tarih, desen?)` | `string` | Türkçe yazım; varsayılan desen `"D MMMM YYYY dddd"` |
| `relative(tarih, şimdi?)` | `string` | "5 dakika önce", "yarın", "2 ay önce" |
| `holidays(yıl)` | `readonly Holiday[]` | Sabit tarihli resmî tatiller |
| `isHoliday(tarih, opts?)` | `boolean` | Tam gün tatil mi |
| `isBusinessDay(tarih, opts?)` | `boolean` | Hafta sonu ve tam gün tatil değil mi |
| `addBusinessDays(tarih, gün, opts?)` | `Date` | İş günü ekler; negatif değer geriye gider |
| `businessDaysBetween(başlangıç, bitiş, opts?)` | `number` | Başlangıç sayılmaz, bitiş sayılır |

## Biçimleme

| Öğe | Örnek | Öğe | Örnek |
|---|---|---|---|
| `YYYY` | 2026 | `dddd` | Çarşamba |
| `YY` | 26 | `ddd` | Çar |
| `MMMM` | Kasım | `HH` | 09 |
| `MMM` | Kas | `H` | 9 |
| `MM` | 11 | `mm` | 07 |
| `M` | 11 | `ss` | 03 |
| `DD` | 05 | `[metin]` | Olduğu gibi yazılır |
| `D` | 5 | | |

```ts
import { date } from "turkiye.js";

date.format("2026-11-25"); // "25 Kasım 2026 Çarşamba"
date.format("2026-11-25", "D MMMM [günü]"); // "25 Kasım günü"
date.format("2026-11-25", "ddd, D MMM YY"); // "Çar, 25 Kas 26"
date.format(new Date(2026, 0, 5, 9, 7), "DD.MM.YYYY HH:mm"); // "05.01.2026 09:07"
```

## Göreli zaman

```ts
import { date } from "turkiye.js";

date.relative("2026-11-25T13:59:40", "2026-11-25T14:00"); // "az önce"
date.relative("2026-11-25T13:55", "2026-11-25T14:00"); // "5 dakika önce"
date.relative("2026-11-26", "2026-11-25"); // "yarın"
date.relative("2026-11-22", "2026-11-25"); // "3 gün önce"
date.relative("2026-09-20", "2026-11-25"); // "2 ay önce"
```

İkinci değer verilmezse şu anki zaman kullanılır. Sunucuda üretilip tarayıcıda yeniden çizilen sayfalarda iki tarafın aynı sonucu vermesi için ikinci değer verilmelidir.

## Resmî tatiller

`holidays` yalnız 2429 sayılı Kanun'daki sabit tarihli tatilleri döner; yürürlük yılına uyulur:

| Tarih | Tatil | Not |
|---|---|---|
| 1 Ocak | Yılbaşı | |
| 23 Nisan | Ulusal Egemenlik ve Çocuk Bayramı | |
| 1 Mayıs | Emek ve Dayanışma Günü | 2009'dan itibaren |
| 19 Mayıs | Atatürk'ü Anma, Gençlik ve Spor Bayramı | |
| 15 Temmuz | Demokrasi ve Millî Birlik Günü | 2017'den itibaren |
| 30 Ağustos | Zafer Bayramı | |
| 28 Ekim | Cumhuriyet Bayramı Arifesi | Yarım gün |
| 29 Ekim | Cumhuriyet Bayramı | |

```ts
import { date } from "turkiye.js";

date.holidays(2026)[0]; // { date: "2026-01-01", name: "Yılbaşı", half: false }
date.holidays(2026).length; // 8
date.isHoliday("2026-10-29"); // true
date.isHoliday("2026-10-28"); // false (yarım gün)
date.isHoliday("2016-07-15"); // false (2017'den önce)
```

Ramazan ve Kurban Bayramı tarihleri her yıl değiştiği için pakette yoktur. Uygulama bu tarihleri `holidays` seçeneğiyle verir.

## İş günü

```ts
import { date } from "turkiye.js";

date.isBusinessDay("2026-11-25"); // true
date.isBusinessDay("2026-10-29"); // false (Cumhuriyet Bayramı)
date.format(date.addBusinessDays("2026-11-27", 1)); // "30 Kasım 2026 Pazartesi"
date.format(date.addBusinessDays("2026-12-01", -1)); // "30 Kasım 2026 Pazartesi"
date.businessDaysBetween("2026-11-27", "2026-12-04"); // 5

const bayram = ["2026-03-20", "2026-03-21", "2026-03-22"];
date.format(date.addBusinessDays("2026-03-19", 2, { holidays: bayram })); // "24 Mart 2026 Salı"
date.isBusinessDay("2026-11-28", { weekend: [0] }); // true (yalnız Pazar tatil)
```

| Seçenek | Değer | Varsayılan |
|---|---|---|
| `holidays` | Ek tatil günleri (`DateInput[]`) | `[]` |
| `weekend` | Hafta sonu günleri; 0 Pazar, 6 Cumartesi | `[0, 6]` |

Kurallar:

- `addBusinessDays` saati korur ve yeni `Date` döner; girdi değişmez.
- `addBusinessDays(a, businessDaysBetween(a, b))`, b iş günüyse b'yi verir.
- Hesap hafta sayısıyla yapılır; 9999 yıllık aralık da milisaniyeler içinde hesaplanır.
- Haftanın her günü hafta sonu verilirse ya da sonuç 1-9999 yılları dışına çıkarsa `RANGE` hatası verilir.

---

[Doküman ana sayfası](../README.md) · [Tüm modüller](../README.md#modüller) · Önceki: [address](./address.md) · Sonraki: [company](./company.md)

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.
