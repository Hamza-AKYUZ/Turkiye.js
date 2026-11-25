# tckn: TC Kimlik No

```ts nocheck
import { tckn } from "turkiye.js";
import * as tckn from "turkiye.js/tckn";
```

TC Kimlik No ve 99 ile başlayan Yabancı Kimlik No'yu doğrular. Girdi metin ya da sayı olabilir.

## Fonksiyonlar

| Fonksiyon | Döner | Açıklama |
|---|---|---|
| `normalize(x)` | `string` | Boşluk, tire ve noktaları siler |
| `validate(x)` | `Result<Tckn>` | Kuralları denetler |
| `isValid(x)` | `boolean` | |
| `parse(x)` | `Tckn` | Geçersizde `TurkiyeError` |
| `format(x)` | `string` | 11 hane; geçersizde `normalize` sonucu |
| `mask(x)` | `string` | İlk 3 ve son 2 hane görünür |
| `kind(x)` | `"citizen" \| "foreign" \| null` | 99 ile başlayan numara `foreign` |
| `generate(opts?)` | `Tckn` | Test için geçerli numara |
| `schema()` | `StandardSchemaV1<string \| number, Tckn>` | |

## Kurallar

1. 11 hane, yalnız rakam.
2. İlk hane 0 olamaz.
3. 10. hane: (tek sıradaki ilk 5 hanenin toplamı x 7 - çift sıradaki ilk 4 hanenin toplamı) mod 10.
4. 11. hane: ilk 10 hanenin toplamı mod 10.

## Örnekler

```ts
import { tckn } from "turkiye.js";

tckn.isValid("10000000146"); // true
tckn.isValid(10000000146); // true
tckn.normalize("100 000 001-46"); // "10000000146"
tckn.mask("10000000146"); // "100******46"
tckn.mask("123"); // "***"
tckn.kind("99999999990"); // "foreign"

tckn.validate(""); // { ok: false, code: "EMPTY", message: "TCKN boş olamaz" }
tckn.validate("1000000014a").code; // "INVALID_CHARS"
tckn.validate("1000000014").code; // "LENGTH"
tckn.validate("00000000146").code; // "FORMAT"
tckn.validate("10000000145").code; // "CHECKSUM"
```

## Test numarası üretme

`generate` yalnız test ve örnek veri içindir. Üretilen numaranın gerçek bir kişiye ait olmadığı garanti edilmez.

```ts
import { tckn } from "turkiye.js";

tckn.isValid(tckn.generate()); // true
tckn.kind(tckn.generate({ foreign: true })); // "foreign"
```

Tekrarlanabilir test verisi için `random` seçeneğine 0 ile 1 arasında sayı döndüren bir üreteç verilebilir.

---

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.
