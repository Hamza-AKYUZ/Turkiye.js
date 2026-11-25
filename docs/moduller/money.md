[Doküman](../README.md) / Modüller / **money**

# money: Para

```ts nocheck
import { money } from "turkiye.js";
import * as money from "turkiye.js/money";
```

Türk lirası tutarlarını biçimler, okur, yazıyla yazar ve KDV hesaplar. Bütün hesaplar kuruş cinsinden tam sayıyla yapılır; `0.1 + 0.2` gibi kayan nokta hataları sonuca yansımaz.

## Fonksiyonlar

| Fonksiyon | Döner | Açıklama |
|---|---|---|
| `format(tutar, opts?)` | `string` | Binlik ayraç nokta, ondalık ayraç virgül |
| `parse(metin)` | `number` | Türkçe yazılmış tutarı okur |
| `toWords(tutar, opts?)` | `string` | Tutarı yazıyla yazar (çek, senet, fatura) |
| `addVat(net, oran)` | `number` | Net tutara KDV ekler |
| `removeVat(brüt, oran)` | `number` | KDV dahil tutardan net tutarı bulur |
| `vatOf(tutar, oran, opts?)` | `number` | KDV tutarı; `opts.included` tutar KDV dahil mi |

`format` seçenekleri:

| Seçenek | Değer | Varsayılan |
|---|---|---|
| `symbol` | `"₺"`, `"TL"`, `"none"` | `"₺"` |
| `decimals` | 0-4 | 2 |
| `position` | `"before"`, `"after"` | `"after"` |

## Biçimleme

```ts
import { money } from "turkiye.js";

money.format(1234.56); // "1.234,56 ₺"
money.format(1234.56, { symbol: "TL" }); // "1.234,56 TL"
money.format(1234.56, { position: "before" }); // "₺1.234,56"
money.format(-5, { symbol: "TL", position: "before" }); // "-TL 5,00"
money.format(1234.567, { decimals: 0, symbol: "none" }); // "1.235"
money.format(0.1 + 0.2); // "0,30 ₺"
```

Yuvarlama yarımda sıfırdan uzağa yapılır; negatif ve pozitif tutarlar aynı şekilde yuvarlanır.

## Okuma

```ts
import { money } from "turkiye.js";

money.parse("1.234,56 TL"); // 1234.56
money.parse("₺1.234"); // 1234
money.parse("12.5"); // 12.5
money.parse("-0,75"); // -0.75
```

Para birimi (₺, TL, TRY) ve boşluklar yok sayılır. Yalnız nokta varsa ve üçerli gruplar halindeyse binlik ayraç, değilse ondalık ayraç kabul edilir. Okunamayan metin `FORMAT`, boş metin `EMPTY`, kuruş hassasiyetini aşan büyüklükteki tutar `RANGE` hatası verir.

## Yazıyla

```ts
import { money } from "turkiye.js";

money.toWords(123.5); // "yüz yirmi üç lira elli kuruş"
money.toWords(0.05); // "beş kuruş"
money.toWords(1250, { joined: true }); // "binikiyüzellilira"
```

## KDV

```ts
import { money } from "turkiye.js";

money.addVat(100, 20); // 120
money.removeVat(120, 20); // 100
money.vatOf(100, 20); // 20
money.vatOf(120, 20, { included: true }); // 20
money.addVat(0.1, 20); // 0.12
```

Sonuçlar kuruşa yuvarlanır. Oran yüzde olarak verilir (20, 10, 1); negatif oran `RANGE` hatası verir.

Yazarken tutar biçimlemek için [MoneyMask](./mask.md) kullanılır.

---

[Doküman ana sayfası](../README.md) · [Tüm modüller](../README.md#modüller) · Önceki: [text](./text.md) · Sonraki: [address](./address.md)

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.
