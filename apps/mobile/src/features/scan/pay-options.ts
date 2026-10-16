import {
  currencyOfForeignQr,
  findBank,
  foreignAmountText,
  isRate,
  type BankInfo,
  type VietQR,
  type VietQRFailure,
  type WritingStyle,
} from '@6pm/domain';

/**
 * How a scanned VietQR gets paid. A transfer to an account or card offers the user's own banks
 * and wallets to hand off to; a NAPAS merchant QR has no account a person can type, so it can only
 * be paid by scanning it again inside a bank app: 6pm copies the amount and opens that app. With
 * none of the user's own banks in 6pm's list, a transfer is paid that way too.
 */
export type PayOptions =
  | { readonly mode: 'wallets'; readonly wallets: readonly BankInfo[] }
  | { readonly mode: 'bankApp'; readonly bank: BankInfo | null };

/**
 * The banks and wallets to pay from: the ones the user picked that 6pm's list knows ("CASH" and
 * banks added by typed name aside, since neither can take a VietQR).
 */
export function payWallets(walletIds: readonly string[]): BankInfo[] {
  return walletIds.flatMap((id) => findBank(id) ?? []);
}

export function payOptions(qr: VietQR, walletIds: readonly string[]): PayOptions {
  const wallets = payWallets(walletIds);
  if (qr.service === 'merchant' || wallets.length === 0) {
    return { mode: 'bankApp', bank: wallets.find((w) => w.ios !== null) ?? null };
  }
  return { mode: 'wallets', wallets };
}

/** "NGUYEN VAN AN" → "Nguyen Van An": bank QRs carry names in capitals. */
export function titleCase(name: string): string {
  if (name !== name.toUpperCase()) return name;
  return name
    .toLowerCase()
    .replace(/(^|\s)(\p{L})/gu, (_, gap: string, c: string) => gap + c.toUpperCase());
}

/** Who the money goes to: the name in the QR, else the receiving bank and the account's tail. */
export function payeeName(qr: VietQR): string {
  const name = qr.merchantName?.trim();
  if (name) return titleCase(name);
  return `${qr.bank?.shortName ?? qr.bin} ${qr.accountMasked}`;
}

/**
 * "฿120" for a foreign QR with an amount, written as the phone writes foreign money; null when it
 * carries none, or no currency 6pm can name.
 */
export function foreignAmountLabel(failure: VietQRFailure, style: WritingStyle): string | null {
  const currency = currencyOfForeignQr(failure);
  if (failure.amount === undefined || currency === null || !isRate(failure.amount)) return null;
  return foreignAmountText({ currency: currency.code, amount: Number(failure.amount) }, style);
}
