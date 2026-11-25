# Örnekler

Örnekler paketin derlenmiş çıktısını kullanır. Önce paketi derleyin:

```sh
npm install
npm run build
```

| Örnek | Açıklama | Çalıştırma |
|---|---|---|
| [node/invoice.mjs](./node/invoice.mjs) | VKN, telefon ve IBAN doğrulayıp KDV'li fatura özeti yazar | `npm run example` |
| [browser/index.html](./browser/index.html) | Framework kullanmadan, `attachMask` ile yazarken biçimlenen form | `npm run serve`, ardından http://127.0.0.1:5173 |
| [react/PaymentForm.tsx](./react/PaymentForm.tsx) | `useMask` ile ödeme formu | Bir React projesine kopyalanır |

`npm run serve` yalnız yerel ağ arayüzünü dinleyen, bağımlılıksız küçük bir sunucudur; yalnız `examples` ve `dist` klasörlerindeki dosyaları verir.

---

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.
