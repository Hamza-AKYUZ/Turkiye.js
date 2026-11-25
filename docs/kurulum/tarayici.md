[Doküman](../README.md) / Kurulum / **Tarayıcı (build aracı olmadan)**

# Tarayıcıda doğrudan kullanım

Webpack, Vite gibi bir build aracı olmadan, düz HTML sayfasında kullanılır. Paket ES modülü olarak yüklenir.

| Gereksinim | Sürüm |
|---|---|
| Tarayıcı | Güncel tüm tarayıcılar: Chrome ve Edge 80+, Firefox 78+, Safari 13.1+ |

## 1. CDN ile

```html
<script type="module">
  import { tckn } from "https://cdn.jsdelivr.net/npm/turkiye.js@1/dist/esm/index.js";

  console.log(tckn.isValid("10000000146")); // true
</script>
```

Yalnız bir modül yüklemek sayfayı hızlandırır:

```html
<script type="module">
  import { format } from "https://cdn.jsdelivr.net/npm/turkiye.js@1/dist/esm/iban/index.js";
</script>
```

Aynı adresler unpkg ile de çalışır: `https://unpkg.com/turkiye.js@1/dist/esm/index.js`.

## 2. Import map ile kısa adlar

Import map ile npm projelerindeki gibi `"turkiye.js"` adı kullanılır:

```html
<script type="importmap">
  {
    "imports": {
      "turkiye.js": "https://cdn.jsdelivr.net/npm/turkiye.js@1/dist/esm/index.js",
      "turkiye.js/": "https://cdn.jsdelivr.net/npm/turkiye.js@1/dist/esm/"
    }
  }
</script>
<script type="module">
  import { money } from "turkiye.js";
  import { attachMask, PhoneMask } from "turkiye.js/mask/index.js";
</script>
```

## 3. Yazarken biçimlenen form

```html
<label>
  Telefon
  <input id="telefon" type="tel" autocomplete="tel" />
</label>
<p id="durum"></p>

<script type="module">
  import { attachMask, PhoneMask } from "https://cdn.jsdelivr.net/npm/turkiye.js@1/dist/esm/mask/index.js";

  const input = document.querySelector("#telefon");
  const mask = new PhoneMask();
  const detach = attachMask(input, mask);

  input.addEventListener("input", () => {
    // Kullanıcı girdisi textContent ile yazılır; HTML olarak yorumlanmaz.
    document.querySelector("#durum").textContent = mask.state.complete ? "Geçerli numara" : "";
  });

  // Input sayfadan kaldırılacaksa önce dinleyici kaldırılır:
  // detach();
</script>
```

Çalışan örnek: [examples/browser/index.html](../../examples/browser/index.html). Proje klasöründe `npm run build` ve `npm run serve` ile açılır.

## 4. Dosyaları kendi sunucunuzdan vermek

CDN kullanılmak istenmiyorsa `node_modules/turkiye.js/dist/esm` klasörü sitenin statik dosyalarına kopyalanır ve göreli adresle yüklenir:

```html
<script type="module">
  import { iban } from "/js/turkiye/index.js";
</script>
```

## Güvenlik notları

- Kullanıcı girdisi sayfaya `innerHTML` ile değil `textContent` ile yazılır.
- Tarayıcıdaki doğrulama yalnız kullanıcıya kolaylık sağlar; veri sunucuda yeniden doğrulanır.
- CDN kullanılıyorsa sürüm sabitlenir (`@1` ya da `@1.0.0`); böylece sayfa beklenmeyen bir sürümle çalışmaz.

---

[Doküman ana sayfası](../README.md) · [Vue](./vue.md) · [Svelte](./svelte.md)

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.
