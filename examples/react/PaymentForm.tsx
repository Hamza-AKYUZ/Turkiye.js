// React ile ödeme formu örneği. Bir React projesine kopyalanarak kullanılır:
// npm install turkiye.js
import { type FormEvent, useState } from "react";
import { iban as ibanModule, money } from "turkiye.js";
import { useMask } from "turkiye.js/react";

export function PaymentForm() {
  const iban = useMask("iban");
  const phone = useMask("phone");
  const amount = useMask("money");
  const [sent, setSent] = useState<string | null>(null);

  const ready = iban.state.complete && phone.state.complete && amount.state.complete;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!ready) return;
    // Sunucuya ayraçsız temiz değerler gönderilir.
    const payload = {
      iban: iban.state.raw,
      bankCode: ibanModule.bankCode(iban.state.raw),
      phone: phone.state.raw,
      amount: money.parse(amount.value),
    };
    setSent(JSON.stringify(payload));
    iban.reset();
    phone.reset();
    amount.reset();
  }

  return (
    <form onSubmit={submit}>
      <label>
        Alıcı IBAN
        <input {...iban.inputProps} autoComplete="off" spellCheck={false} aria-invalid={!iban.state.complete} />
      </label>
      <label>
        Telefon
        <input {...phone.inputProps} type="tel" autoComplete="tel" />
      </label>
      <label>
        Tutar
        <input {...amount.inputProps} inputMode="decimal" />
      </label>
      {amount.state.complete && <p>Yalnız {money.toWords(money.parse(amount.value))}</p>}
      <button type="submit" disabled={!ready}>
        Gönder
      </button>
      {sent && <pre>{sent}</pre>}
    </form>
  );
}
