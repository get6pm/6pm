import { describe, expect, it } from 'vitest';

import { maskAccount, parseVietQR, type VietQR, type VietQRResult } from './parse-vietqr';

/** Payloads were built and their CRCs computed with an independent implementation. */
const QR = {
  /** The design's preview: Bún chả Cô Lan, Vietcombank •••• 4821, 55.000₫, "2 suat bun cha". */
  bunCha:
    '00020101021238540010A00000072701240006970436011010233348210208QRIBFTTA5204581253037045405550005802VN5914BUN CHA CO LAN6006HA NOI62430106HD00420511BCL2026101008142 suat bun cha63043291',
  decimalAmount:
    '00020101021238540010A00000072701240006970422011009620919960208QRIBFTTA5303704540855000.005802VN62110807tra sua6304400E',
  fractionAmount:
    '00020101021238540010A00000072701240006970422011009620919960208QRIBFTTA5303704540855000.505802VN63048CAD',
  diacriticsChars:
    '00020101021238540010A00000072701240006970436011010233348210208QRIBFTTA53037045405550005802VN621808142 suất bún chả63046507',
  diacriticsBytes:
    '00020101021238540010A00000072701240006970436011010233348210208QRIBFTTA53037045405550005802VN622308192 suất bún chả63047E07',
  card: '00020101021138600010A00000072701300006970418011697041800123456780208QRIBFTTC53037045802VN6304616F',
  merchant:
    '00020101021138540010A000000727012600069704030112SCBMERCH00010206QRPUSH5204541153037045802VN5908CIRCLE K6011HO CHI MINH6304D2BF',
  cash: '00020101021138500010A000000727012200069704360108ATM000120206QRCASH53037045802VN63044890',
  unknownBin:
    '00020101021138530010A0000007270123000697099901091234567890208QRIBFTTA53037045802VN6304D77C',
  usd: '00020101021238540010A00000072701240006970436011010233348210208QRIBFTTA53038405402205802VN63040E11',
  promptpay: '00020101021229370016A0000006770101110113006681234567853037645406120.005802TH6304BC9B',
  promptpayBill:
    '00020101021130470016A00000067701011201150107536000102860204REF153037645802TH5912SOM TAM NUAN6304193D',
  paynow:
    '00020101021226370009SG.PAYNOW010120210201403121W0301052040000530370254048.505802SG5915HAWKER STALL 126009Singapore6304DA4F',
  duitnow:
    '00020101021126410014A000000615000101065016640209123456789520499995303458540510.005802MY5909QRCSDNBHD6005BANGI6304FFC7',
  khqr: '00020101021129200016coffee_shop@aclb5204599953031165802KH5911COFFEE SHOP6010PHNOM PENH6304BF10',
  japan: '00020101021126260013JP.CO.EXAMPLE01051234553033925802JP6304707E',
  vnOther: '00020101021126280010A0000007750110MERCHANT0153037045802VN5908QUAN COM630491A3',
  wrongFormat:
    '00020201021138540010A00000072701240006970436011010233348210208QRIBFTTA53037045802VN63041733',
};

/**
 * Published samples. The static one is the documented output of the vietqr_gen package
 * (https://pub.dev/packages/vietqr_gen); its dynamic sample declares an 18-character note for
 * the 19-character "Thanh toan don hang", so its checksum does not match.
 */
const PUBLISHED = {
  vietqrGenStatic:
    '00020101021138540010A00000072701240006970407011096020919960208QRIBFTTA53037045802VN630434A0',
  vietqrGenDynamic:
    '00020101021238530010A00000072701230006970422011009620919960208QRIBFTTA530370454061500005802VN62220818Thanh toan don hang6304E3A3',
  /** PayNet's DuitNow QR merchant-presented example 1 (docs.developer.paynet.my). */
  paynetDuitNow:
    '00020201021126410014A000000615000101065016640209123456789520499995303458540510.005802MY5909QRCSDNBHD6005BANGI6304343F',
};

function vietqr(result: VietQRResult): VietQR {
  if (!result.ok) throw new Error(`expected a VietQR, got ${result.reason}`);
  return result;
}

describe('parseVietQR', () => {
  it('reads the design preview: merchant, bank, masked account, amount and note', () => {
    const qr = vietqr(parseVietQR(QR.bunCha));
    expect(qr).toMatchObject({
      kind: 'vietqr',
      bin: '970436',
      account: '1023334821',
      accountMasked: '•••• 4821',
      service: 'account',
      amount: 55_000,
      note: '2 suat bun cha',
      merchantName: 'BUN CHA CO LAN',
      city: 'HA NOI',
      mcc: '5812',
      billNumber: 'HD0042',
      referenceLabel: 'BCL20261010',
      dynamic: true,
      raw: QR.bunCha,
    });
    expect(qr.bank?.shortName).toBe('Vietcombank');
  });

  it('reads a published static QR with no amount', () => {
    const qr = vietqr(parseVietQR(PUBLISHED.vietqrGenStatic));
    expect(qr.bank?.shortName).toBe('Techcombank');
    expect(qr.account).toBe('9602091996');
    expect(qr.amount).toBeNull();
    expect(qr.note).toBeNull();
    expect(qr.merchantName).toBeNull();
    expect(qr.dynamic).toBe(false);
  });

  it('reads amounts with or without a zero decimal part', () => {
    expect(vietqr(parseVietQR(QR.decimalAmount)).amount).toBe(55_000);
    expect(vietqr(parseVietQR(QR.bunCha)).amount).toBe(55_000);
  });

  it('rejects an amount with real decimals, since đồng has none', () => {
    expect(parseVietQR(QR.fractionAmount)).toEqual({ ok: false, reason: 'malformed' });
  });

  it('keeps Vietnamese diacritics in the note, whether lengths count characters or bytes', () => {
    expect(vietqr(parseVietQR(QR.diacriticsChars)).note).toBe('2 suất bún chả');
    expect(vietqr(parseVietQR(QR.diacriticsBytes)).note).toBe('2 suất bún chả');
  });

  it('reads transfers to a card and merchant payments', () => {
    const card = vietqr(parseVietQR(QR.card));
    expect(card.service).toBe('card');
    expect(card.accountMasked).toBe('•••• 5678');
    expect(card.bank?.shortName).toBe('BIDV');

    const merchant = vietqr(parseVietQR(QR.merchant));
    expect(merchant.service).toBe('merchant');
    expect(merchant.bank?.shortName).toBe('Sacombank');
    expect(merchant.merchantName).toBe('CIRCLE K');
  });

  it('keeps a QR from a bank it does not know, without a bank', () => {
    const qr = vietqr(parseVietQR(QR.unknownBin));
    expect(qr.bank).toBeNull();
    expect(qr.bin).toBe('970999');
  });

  it('ignores whitespace a scanner adds around the payload', () => {
    expect(parseVietQR(`  ${QR.bunCha}\n`).ok).toBe(true);
  });

  it('accepts a lower-case checksum', () => {
    expect(parseVietQR(QR.bunCha.slice(0, -4) + QR.bunCha.slice(-4).toLowerCase()).ok).toBe(true);
  });

  describe('rejects', () => {
    it('text and links that are not EMV payloads', () => {
      for (const text of ['', 'hello', 'https://6pm.vn/pay', '{"amount":55000}']) {
        expect(parseVietQR(text)).toEqual({ ok: false, reason: 'not_emv' });
      }
    });

    it('a changed character under the original checksum', () => {
      const tampered = QR.bunCha.replace('55000', '95000');
      expect(parseVietQR(tampered)).toEqual({ ok: false, reason: 'bad_crc' });
    });

    it('a published sample whose declared note length is wrong', () => {
      expect(parseVietQR(PUBLISHED.vietqrGenDynamic)).toEqual({ ok: false, reason: 'bad_crc' });
    });

    it('a truncated payload', () => {
      for (const cut of [10, 40, QR.bunCha.length - 2]) {
        expect(parseVietQR(QR.bunCha.slice(0, cut))).toEqual({ ok: false, reason: 'malformed' });
      }
    });

    it('a payload format indicator other than 01', () => {
      expect(parseVietQR(QR.wrongFormat)).toEqual({ ok: false, reason: 'malformed' });
      expect(parseVietQR(PUBLISHED.paynetDuitNow)).toEqual({ ok: false, reason: 'malformed' });
    });

    it('NAPAS cash withdrawal codes and non-đồng VietQRs as unsupported', () => {
      expect(parseVietQR(QR.cash)).toEqual({ ok: false, reason: 'unsupported' });
      expect(parseVietQR(QR.usd)).toEqual({ ok: false, reason: 'unsupported' });
    });

    it('a Vietnamese EMV QR that is not on NAPAS as unsupported', () => {
      expect(parseVietQR(QR.vnOther)).toEqual({ ok: false, reason: 'unsupported' });
    });
  });

  describe('recognises foreign QR codes', () => {
    it('a Thai PromptPay QR, keeping its baht amount to log by hand', () => {
      expect(parseVietQR(QR.promptpay)).toEqual({
        ok: false,
        reason: 'foreign',
        country: 'TH',
        scheme: 'promptpay',
        amount: '120.00',
        currency: '764',
      });
      expect(parseVietQR(QR.promptpayBill)).toMatchObject({
        reason: 'foreign',
        scheme: 'promptpay',
        merchantName: 'SOM TAM NUAN',
      });
    });

    it.each([
      ['Singapore PayNow', QR.paynow, 'SG', 'paynow'],
      ['Malaysia DuitNow', QR.duitnow, 'MY', 'duitnow'],
      ['Cambodia KHQR', QR.khqr, 'KH', 'khqr'],
    ])('a %s QR', (_name, payload, country, scheme) => {
      expect(parseVietQR(payload)).toMatchObject({ ok: false, reason: 'foreign', country, scheme });
    });

    it('any other country by its country code, without a scheme', () => {
      const result = parseVietQR(QR.japan);
      expect(result).toMatchObject({ ok: false, reason: 'foreign', country: 'JP' });
      expect(result).not.toHaveProperty('scheme');
    });
  });
});

describe('maskAccount', () => {
  it('shows only the last four characters', () => {
    expect(maskAccount('1023334821')).toBe('•••• 4821');
    expect(maskAccount('821')).toBe('•••• 821');
  });
});
