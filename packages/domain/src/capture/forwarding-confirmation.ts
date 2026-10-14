import {
  handleOfRecipient,
  isForwardingConfirmUrl,
  type ForwardingProvider,
} from '../contracts/receipt-email';
import { decodeEntities, htmlToLines, textToLines } from './email-body';
import type { ReceiptEmail } from './receipt-email';

/** A provider's request to confirm forwarding, as read from its email. */
export interface ForwardingConfirmation {
  readonly provider: ForwardingProvider;
  readonly code: string;
  /** The provider's confirm link; null when the email held none on the provider's own hosts. */
  readonly confirmUrl: string | null;
  /** The address asking to forward, when the email names it. */
  readonly address: string | null;
  /** When the email arrived, ISO 8601. */
  readonly receivedAt: string;
}

/**
 * The address each provider sends its confirmation from. Gmail writes the subject and body in
 * the forwarding account's language ("(#99427480) Gmail Forwarding Confirmation - Receive Mail
 * from lan@gmail.com", "(#38721011) Gmail Xác nhận chuyển tiếp - Nhận thư từ lan@gmail.com"),
 * so nothing here depends on its words: the sender, the `(#digits)` in the subject, the address in
 * it, and the confirm link are the same in every language.
 */
const SENDERS: Readonly<Record<string, ForwardingProvider>> = {
  'forwarding-noreply@google.com': 'gmail',
};

const SUBJECT_CODE = /\(#(\d{5,12})\)/;
/** "Confirmation code: 99427480", "Mã xác nhận: 99427480": a short label, a colon, the digits. */
const BODY_CODE = /^[^\d:]{3,40}:\s*(\d{5,12})$/u;
const ADDRESS = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const LINK = /https:\/\/[^\s"'<>()]+/g;

/** Every https link in the body, entities decoded and brackets written the way Gmail encodes them. */
function linksIn(email: ReceiptEmail): string[] {
  const raw = `${email.text ?? ''}\n${email.html ?? ''}`;
  return [...raw.matchAll(LINK)].map((m) =>
    decodeEntities(m[0])
      .replace(/[.,;]+$/, '')
      .replaceAll('[', '%5B')
      .replaceAll(']', '%5D'),
  );
}

/** The forwarding account: named in the subject, else the first address in the body that is not 6pm's or the provider's. */
function askingAddress(subject: string, lines: readonly string[]): string | null {
  const fromSubject = [...subject.matchAll(ADDRESS)].at(-1)?.[0];
  if (fromSubject) return fromSubject.toLowerCase();
  for (const line of lines) {
    for (const match of line.matchAll(ADDRESS)) {
      const address = match[0].toLowerCase();
      if (handleOfRecipient(address) === null && !address.endsWith('@google.com')) return address;
    }
  }
  return null;
}

/**
 * Reads a mail service's "confirm you want forwarding" email: which service, the code, its confirm
 * link (only one on the service's own hosts, on its confirm path), and the account asking. Null
 * for any other email, including one forwarded on by a person: only the service's own sender
 * counts, and a confirmation without a code is not one.
 */
export function parseForwardingConfirmation(
  email: ReceiptEmail,
  options: { readonly receivedAt: string },
): ForwardingConfirmation | null {
  const provider = email.from ? SENDERS[email.from.address.trim().toLowerCase()] : undefined;
  if (!provider) return null;
  const lines = email.text ? textToLines(email.text) : htmlToLines(email.html ?? '');
  const code =
    SUBJECT_CODE.exec(email.subject)?.[1] ??
    lines.map((line) => BODY_CODE.exec(line)?.[1]).find((c) => c !== undefined);
  if (!code) return null;
  return {
    provider,
    code,
    confirmUrl: linksIn(email).find((link) => isForwardingConfirmUrl(provider, link)) ?? null,
    address: askingAddress(email.subject, lines),
    receivedAt: options.receivedAt,
  };
}
