[Doküman](../README.md) / Modüller / **text**

# text: Türkçe metin

```ts nocheck
import { text } from "turkiye.js";
import * as text from "turkiye.js/text";
```

JavaScript'in yerleşik fonksiyonları Türkçe harflerde hatalı sonuç verir: `"istanbul".toUpperCase()` `"ISTANBUL"` döner, `["ş", "z"].sort()` `["z", "ş"]` sıralar. Bu modül Türkçe kurallarını `Intl` kullanmadan uygular; React Native dahil her ortamda aynı sonucu verir.

## Fonksiyonlar

| Fonksiyon | Döner | Açıklama |
|---|---|---|
| `toUpper(s)` | `string` | i: İ, ı: I |
| `toLower(s)` | `string` | I: ı, İ: i |
| `toTitle(s)` | `string` | Kelimelerin ilk harfi büyük; ilk kelime dışındaki bağlaçlar küçük |
| `compare(a, b)` | `number` | Türk alfabesine göre karşılaştırma; `Array.prototype.sort` ile kullanılır |
| `sort(dizi, alan?)` | `T[]` | Yeni dizi döner; nesnelerde alan adı ya da seçici fonksiyon |
| `fold(s)` | `string` | Arama için küçük harf, Türkçe karakter ve aksan kaldırma |
| `includes(metin, aranan)` | `boolean` | Harf büyüklüğü ve Türkçe karakter farkını yok sayar |
| `slugify(s, opts?)` | `string` | URL için kısa ad; `opts.separator` varsayılan `-` |
| `numberToWords(n, opts?)` | `string` | Tam sayıyı yazıya çevirir; `opts.joined` bitişik yazım |
| `suffix(kelime, hal, opts?)` | `string` | Ses uyumuna göre hal eki |

## Büyük ve küçük harf

```ts
import { text } from "turkiye.js";

text.toUpper("istanbul ılık"); // "İSTANBUL ILIK"
text.toLower("IŞIK İZİ"); // "ışık izi"
text.toTitle("ALİ VE VELİ ankara'da"); // "Ali ve Veli Ankara'da"
```

`toTitle` içinde küçük kalan bağlaçlar: ve, veya, ile, ya, yahut, da, de, ki, ama, fakat, hem, ne.

## Sıralama

```ts
import { text } from "turkiye.js";

text.sort(["şeker", "çay", "su", "cam"]); // ["cam", "çay", "su", "şeker"]
["Zeynep", "Çağla", "Can"].sort(text.compare); // ["Can", "Çağla", "Zeynep"]
text.sort([{ name: "Zeynep" }, { name: "Çağla" }, { name: "Can" }], "name"); // [{ name: "Can" }, { name: "Çağla" }, { name: "Zeynep" }]
text.sort(["b", "a"], (value) => value); // ["a", "b"]
```

Harf sırası eşit olduğunda aksansız harf (adet, âdet) ve küçük harf önce gelir. `sort` eşit öğelerin sırasını korur ve girdi dizisini değiştirmez. Çok sayıda öğe sıralanırken `sort`, `compare` ile `Array.prototype.sort` kullanmaktan daha hızlıdır.

## Arama

```ts
import { text } from "turkiye.js";

text.fold("Şişli Çarşı"); // "sisli carsi"
text.fold("Kâğıt"); // "kagit"
text.includes("Şişli Belediyesi", "sisli"); // true
text.includes("İSTANBUL", "istanbul"); // true
text.slugify("Çalışma Saatleri & İletişim"); // "calisma-saatleri-ve-iletisim"
text.slugify("Çalışma Saatleri", { separator: "_" }); // "calisma_saatleri"
```

## Sayıyı yazıya çevirme

```ts
import { text } from "turkiye.js";

text.numberToWords(1984); // "bin dokuz yüz seksen dört"
text.numberToWords(-15); // "eksi on beş"
text.numberToWords(250, { joined: true }); // "ikiyüzelli"
text.numberToWords(0); // "sıfır"
```

Tam sayı ve güvenli tam sayı aralığındaki değerler kabul edilir; diğerleri `RANGE` hatası verir. Tutarı yazıyla yazmak için [money.toWords](./money.md) kullanılır.

## Hal ekleri

| Hal | Ad | Örnek |
|---|---|---|
| Belirtme | `accusative` | Ankara'yı |
| Yönelme | `dative` | Ankara'ya |
| Bulunma | `locative` | Ankara'da |
| Ayrılma | `ablative` | Ankara'dan |
| İlgi | `genitive` | Ankara'nın |
| Vasıta | `instrumental` | Ankara'yla |

```ts
import { text } from "turkiye.js";

text.suffix("Ankara", "dative"); // "Ankara'ya"
text.suffix("Ankara", "genitive"); // "Ankara'nın"
text.suffix("İstanbul", "locative"); // "İstanbul'da"
text.suffix("kitap", "accusative"); // "kitabı"
text.suffix("kitap", "locative"); // "kitapta"
text.suffix("5", "dative"); // "5'e"
text.suffix("40", "locative"); // "40'ta"
text.suffix("THY", "dative"); // "THY'ye"
text.suffix("NATO", "dative"); // "NATO'ya"
```

Kurallar:

- Özel isim, sayı ve kısaltmalarda ek kesme işaretiyle ayrılır. Büyük harfle başlayan kelime özel isim sayılır.
- Sayılar okunuşlarına göre ek alır: 5 (beş) 5'e, 6 (altı) 6'ya.
- Kısaltmalar harf harf (THY: te-ha-ye) ya da kelime gibi (NATO) okunur. Okunuş kelimenin yapısından tahmin edilir.
- Çok heceli ve p, ç, t, k ile biten cins isimlerde ünsüz yumuşaması uygulanır.
- Ek her zaman küçük harfle yazılır.

Kurala uymayan kelimelerde seçeneklerle düzeltme yapılır:

| Seçenek | Değer | İşi |
|---|---|---|
| `proper` | `boolean` | Özel isim mi (kesme işareti) |
| `read` | `"letters" \| "word"` | Kısaltmanın okunuşu |
| `soften` | `boolean` | Ünsüz yumuşaması uygulansın mı |
| `harmony` | `"front" \| "back"` | Ünlü uyumuna uymayan kelimeler |

```ts
import { text } from "turkiye.js";

text.suffix("saat", "accusative", { harmony: "front" }); // "saati"
text.suffix("kanat", "accusative", { soften: true }); // "kanadı"
text.suffix("TOGG", "dative", { read: "word" }); // "TOGG'a"
text.suffix("Kitap", "locative", { proper: false }); // "Kitapta"
```

---

[Doküman ana sayfası](../README.md) · [Tüm modüller](../README.md#modüller) · Önceki: [card](./card.md) · Sonraki: [money](./money.md)

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.
