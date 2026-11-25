// Fatura satırlarını doğrulayıp özet yazan Node örneği.
// Çalıştırma: npm run build && node examples/node/invoice.mjs
import { date, iban, money, phone, text, vkn } from "turkiye.js";

const customer = {
  name: "örnek ticaret ltd. şti.",
  taxId: "123 456 78 90",
  phone: "0532 123 45 67",
  iban: "tr33 0006 1005 1978 6457 8413 26",
};

const lines = [
  { item: "Danışmanlık", net: 12500 },
  { item: "Yazılım lisansı", net: 4999.9 },
  { item: "Eğitim", net: 0.1 + 0.2 },
];

const problems = [];
const taxId = vkn.validate(customer.taxId);
if (!taxId.ok) problems.push(`Vergi numarası: ${taxId.message}`);
if (!phone.isValid(customer.phone)) problems.push("Telefon numarası geçersiz");
if (!iban.isValid(customer.iban)) problems.push("IBAN geçersiz");

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exitCode = 1;
} else {
  const issued = "2026-11-25";
  const net = lines.reduce((sum, line) => sum + line.net, 0);
  const gross = money.addVat(net, 20);

  console.log(text.toTitle(customer.name));
  console.log(`VKN: ${vkn.format(customer.taxId)}  Tel: ${phone.format(customer.phone)}`);
  console.log(`IBAN: ${iban.format(customer.iban)}`);
  console.log(`Tarih: ${date.format(issued)}`);
  console.log(`Son ödeme: ${date.format(date.addBusinessDays(issued, 10))}`);
  console.log("");
  for (const line of text.sort(lines, "item")) {
    console.log(`${line.item.padEnd(20)} ${money.format(line.net).padStart(14)}`);
  }
  console.log("");
  console.log(`${"Ara toplam".padEnd(20)} ${money.format(net).padStart(14)}`);
  console.log(`${"KDV (%20)".padEnd(20)} ${money.format(money.vatOf(net, 20)).padStart(14)}`);
  console.log(`${"Genel toplam".padEnd(20)} ${money.format(gross).padStart(14)}`);
  console.log(`Yalnız: ${money.toWords(gross)}`);
}
