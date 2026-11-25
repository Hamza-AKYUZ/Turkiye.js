[Doküman](../README.md) / Kurulum / **TypeScript**

# TypeScript ile kullanım

Tipler paketle gelir; `@types/...` paketi gerekmez. Doğrulanmış değerler tip seviyesinde işaretlenir; böylece doğrulanmamış bir metnin yanlışlıkla kaydedilmesi derleme sırasında yakalanır.

| Gereksinim | Değer |
|---|---|
| TypeScript | 4.7 ve üstü |
| `moduleResolution` | `node16`, `nodenext` ya da `bundler` |

## 1. tsconfig ayarı

Alt yollar (`turkiye.js/tckn`) `package.json` içindeki `exports` alanıyla tanımlıdır. TypeScript bu alanı yalnız şu ayarlarda okur:

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext"
  }
}
```

Vite, Next.js gibi bundler kullanan projelerde:

```json
{
  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "bundler"
  }
}
```

Eski `"moduleResolution": "node"` ayarında ana giriş çalışır, alt yollar çalışmaz: `import { tckn } from "turkiye.js"`.

## 2. İşaretli tipler

`validate` başarılı olduğunda dönen değer `Tckn`, `Iban`, `Phone` gibi işaretli bir tiptir. Bu tipler çalışma zamanında sıradan metindir; yalnız derleyici farkı bilir.

```ts nocheck
import { iban, tckn } from "turkiye.js";
import type { Tckn } from "turkiye.js/tckn";
import type { Iban } from "turkiye.js/iban";

interface Customer {
  id: Tckn;
  iban: Iban;
}

function save(customer: Customer) {}

const id = tckn.validate(input.id);
const account = iban.validate(input.iban);
if (id.ok && account.ok) {
  save({ id: id.value, iban: account.value }); // Derlenir
}

save({ id: "10000000146", iban: "TR33..." }); // Hata: string, Tckn değildir
```

Veritabanından okunan ve daha önce doğrulanmış değerler için `parse` kullanılır; geçersizse `TurkiyeError` fırlatır:

```ts nocheck
const id: Tckn = tckn.parse(row.tckn);
```

## 3. Result tipi

`validate` sonucu `ok` alanına göre daralır:

```ts nocheck
import { tckn, type Result } from "turkiye.js";
import type { Tckn } from "turkiye.js/tckn";

const result: Result<Tckn> = tckn.validate(value);
if (result.ok) {
  result.value; // Tckn
} else {
  result.code; // "EMPTY" | "INVALID_CHARS" | "LENGTH" | "CHECKSUM" | ...
  result.message; // string
}
```

Hata kodlarının tamamı `ErrorCode` tipinde ve `ERROR_CODES` dizisindedir.

## 4. Seçenek ve sonuç tipleri

Her modül kendi tiplerini dışa aktarır:

```ts nocheck
import type { BusinessDayOptions, Holiday } from "turkiye.js/date";
import type { CardBrand } from "turkiye.js/card";
import type { MaskKind, MaskState } from "turkiye.js/mask";
import type { PhoneFormat, PhoneType } from "turkiye.js/phone";
import type { Province } from "turkiye.js/address";
import type { GrammaticalCase } from "turkiye.js/text";
```

## 5. Standard Schema

`schema()` [Standard Schema](https://standardschema.dev) arayüzünü uygular. Zod, Valibot ve ArkType'ın beklediği tip doğrudan sağlanır; çıktı tipi işaretli tiptir:

```ts nocheck
import { z } from "zod";
import { tckn } from "turkiye.js";

const schema = z.object({ tckn: z.string().pipe(tckn.schema()) });
type Form = z.infer<typeof schema>; // { tckn: Tckn }
```

---

[Doküman ana sayfası](../README.md) · [Node.js](./node.md) · [React](./react.md)

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.
