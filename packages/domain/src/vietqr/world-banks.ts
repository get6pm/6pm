/**
 * The main banks and wallets of the countries 6pm's people come from or travel to, most used first
 * in each (an editorial order from public customer counts and app-store rankings, not a
 * measurement), then wallets used everywhere. One row each: `country|code|everyday name|registered
 * name|kind`, the country ISO 3166-1 alpha-2 and `*` for everywhere. Codes are the country and the
 * bank's short code ("US.CHASE"), so none can be read as a Vietnamese bank's.
 *
 * Names only: 6pm pays nothing from these apps, so it keeps no link to open them.
 */
export const WORLD_DIRECTORY = `
US|US.CHASE|Chase|JPMorgan Chase Bank|bank
US|US.BOFA|Bank of America|Bank of America|bank
US|US.WELLSFARGO|Wells Fargo|Wells Fargo Bank|bank
US|US.CAPITALONE|Capital One|Capital One|bank
US|US.CITI|Citi|Citibank|bank
US|US.USBANK|U.S. Bank|U.S. Bank|bank
US|US.PNC|PNC|PNC Bank|bank
US|US.AMEX|American Express|American Express|bank
US|US.DISCOVER|Discover|Discover Bank|bank
US|US.CHIME|Chime|Chime|bank
US|US.ALLY|Ally|Ally Bank|bank
US|US.VENMO|Venmo|Venmo|wallet
US|US.CASHAPP|Cash App|Cash App|wallet
CA|CA.RBC|RBC|Royal Bank of Canada|bank
CA|CA.TD|TD|TD Canada Trust|bank
CA|CA.SCOTIA|Scotiabank|Bank of Nova Scotia|bank
CA|CA.BMO|BMO|Bank of Montreal|bank
CA|CA.CIBC|CIBC|Canadian Imperial Bank of Commerce|bank
CA|CA.DESJARDINS|Desjardins|Desjardins|bank
CA|CA.NBC|National Bank|National Bank of Canada|bank
CA|CA.TANGERINE|Tangerine|Tangerine Bank|bank
GB|GB.BARCLAYS|Barclays|Barclays Bank|bank
GB|GB.LLOYDS|Lloyds|Lloyds Bank|bank
GB|GB.HSBC|HSBC UK|HSBC UK Bank|bank
GB|GB.NATWEST|NatWest|National Westminster Bank|bank
GB|GB.SANTANDER|Santander UK|Santander UK|bank
GB|GB.NATIONWIDE|Nationwide|Nationwide Building Society|bank
GB|GB.HALIFAX|Halifax|Halifax|bank
GB|GB.MONZO|Monzo|Monzo Bank|bank
GB|GB.STARLING|Starling|Starling Bank|bank
IE|IE.AIB|AIB|Allied Irish Banks|bank
IE|IE.BOI|Bank of Ireland|Bank of Ireland|bank
IE|IE.PTSB|PTSB|Permanent TSB|bank
DE|DE.SPARKASSE|Sparkasse|Sparkasse|bank
DE|DE.VOLKSBANK|Volksbank|Volksbanken Raiffeisenbanken|bank
DE|DE.DEUTSCHE|Deutsche Bank|Deutsche Bank|bank
DE|DE.COMMERZBANK|Commerzbank|Commerzbank|bank
DE|DE.ING|ING|ING-DiBa|bank
DE|DE.DKB|DKB|Deutsche Kreditbank|bank
DE|DE.POSTBANK|Postbank|Postbank|bank
DE|DE.COMDIRECT|comdirect|comdirect|bank
DE|DE.N26|N26|N26 Bank|bank
FR|FR.CA|Crédit Agricole|Crédit Agricole|bank
FR|FR.BNP|BNP Paribas|BNP Paribas|bank
FR|FR.SG|Société Générale|Société Générale|bank
FR|FR.CM|Crédit Mutuel|Crédit Mutuel|bank
FR|FR.LBP|La Banque Postale|La Banque Postale|bank
FR|FR.CE|Caisse d’Épargne|Caisse d’Épargne|bank
FR|FR.BP|Banque Populaire|Banque Populaire|bank
FR|FR.LCL|LCL|Le Crédit Lyonnais|bank
FR|FR.BOURSO|BoursoBank|BoursoBank|bank
FR|FR.LYDIA|Lydia|Lydia|wallet
NL|NL.ING|ING|ING Bank|bank
NL|NL.RABOBANK|Rabobank|Rabobank|bank
NL|NL.ABNAMRO|ABN AMRO|ABN AMRO Bank|bank
NL|NL.BUNQ|bunq|bunq|bank
NL|NL.SNS|SNS|SNS Bank|bank
ES|ES.SANTANDER|Santander|Banco Santander|bank
ES|ES.BBVA|BBVA|Banco Bilbao Vizcaya Argentaria|bank
ES|ES.CAIXABANK|CaixaBank|CaixaBank|bank
ES|ES.SABADELL|Sabadell|Banco Sabadell|bank
ES|ES.BANKINTER|Bankinter|Bankinter|bank
ES|ES.BIZUM|Bizum|Bizum|wallet
IT|IT.INTESA|Intesa Sanpaolo|Intesa Sanpaolo|bank
IT|IT.UNICREDIT|UniCredit|UniCredit|bank
IT|IT.POSTE|BancoPosta|Poste Italiane|bank
IT|IT.BPM|Banco BPM|Banco BPM|bank
IT|IT.FINECO|Fineco|FinecoBank|bank
IT|IT.SATISPAY|Satispay|Satispay|wallet
AU|AU.CBA|CommBank|Commonwealth Bank of Australia|bank
AU|AU.WESTPAC|Westpac|Westpac Banking Corporation|bank
AU|AU.ANZ|ANZ|Australia and New Zealand Banking Group|bank
AU|AU.NAB|NAB|National Australia Bank|bank
AU|AU.ING|ING|ING Australia|bank
AU|AU.MACQUARIE|Macquarie|Macquarie Bank|bank
AU|AU.BENDIGO|Bendigo Bank|Bendigo and Adelaide Bank|bank
AU|AU.UP|Up|Up|bank
NZ|NZ.ANZ|ANZ|ANZ Bank New Zealand|bank
NZ|NZ.ASB|ASB|ASB Bank|bank
NZ|NZ.BNZ|BNZ|Bank of New Zealand|bank
NZ|NZ.WESTPAC|Westpac|Westpac New Zealand|bank
NZ|NZ.KIWIBANK|Kiwibank|Kiwibank|bank
SG|SG.DBS|DBS|DBS Bank|bank
SG|SG.POSB|POSB|POSB Bank|bank
SG|SG.OCBC|OCBC|Oversea-Chinese Banking Corporation|bank
SG|SG.UOB|UOB|United Overseas Bank|bank
SG|SG.SCB|Standard Chartered|Standard Chartered Bank (Singapore)|bank
SG|SG.TRUST|Trust Bank|Trust Bank Singapore|bank
SG|SG.GXS|GXS Bank|GXS Bank|bank
SG|SG.GRABPAY|GrabPay|GrabPay|wallet
MY|MY.MAYBANK|Maybank|Malayan Banking Berhad|bank
MY|MY.CIMB|CIMB|CIMB Bank|bank
MY|MY.PUBLIC|Public Bank|Public Bank Berhad|bank
MY|MY.RHB|RHB|RHB Bank|bank
MY|MY.HLB|Hong Leong Bank|Hong Leong Bank|bank
MY|MY.AMBANK|AmBank|AmBank|bank
MY|MY.BANKISLAM|Bank Islam|Bank Islam Malaysia|bank
MY|MY.TNG|Touch ’n Go eWallet|Touch ’n Go eWallet|wallet
MY|MY.BOOST|Boost|Boost|wallet
TH|TH.KBANK|K PLUS|Kasikornbank|bank
TH|TH.SCB|SCB|Siam Commercial Bank|bank
TH|TH.BBL|Bangkok Bank|Bangkok Bank|bank
TH|TH.KTB|Krungthai|Krung Thai Bank|bank
TH|TH.KRUNGSRI|Krungsri|Bank of Ayudhya|bank
TH|TH.TTB|ttb|TMBThanachart Bank|bank
TH|TH.GSB|GSB|Government Savings Bank|bank
TH|TH.TRUEMONEY|TrueMoney|TrueMoney Wallet|wallet
ID|ID.BCA|BCA|Bank Central Asia|bank
ID|ID.MANDIRI|Mandiri|Bank Mandiri|bank
ID|ID.BRI|BRI|Bank Rakyat Indonesia|bank
ID|ID.BNI|BNI|Bank Negara Indonesia|bank
ID|ID.CIMBNIAGA|CIMB Niaga|Bank CIMB Niaga|bank
ID|ID.JAGO|Jago|Bank Jago|bank
ID|ID.GOPAY|GoPay|GoPay|wallet
ID|ID.OVO|OVO|OVO|wallet
ID|ID.DANA|DANA|DANA|wallet
ID|ID.SHOPEEPAY|ShopeePay|ShopeePay|wallet
PH|PH.BDO|BDO|BDO Unibank|bank
PH|PH.BPI|BPI|Bank of the Philippine Islands|bank
PH|PH.METROBANK|Metrobank|Metropolitan Bank and Trust Company|bank
PH|PH.LANDBANK|Landbank|Land Bank of the Philippines|bank
PH|PH.SECURITY|Security Bank|Security Bank|bank
PH|PH.UNIONBANK|UnionBank|Union Bank of the Philippines|bank
PH|PH.GCASH|GCash|GCash|wallet
PH|PH.MAYA|Maya|Maya|wallet
KH|KH.ABA|ABA|Advanced Bank of Asia|bank
KH|KH.ACLEDA|ACLEDA|ACLEDA Bank|bank
KH|KH.CANADIA|Canadia|Canadia Bank|bank
KH|KH.WING|Wing|Wing Bank|wallet
LA|LA.BCEL|BCEL|Banque pour le Commerce Extérieur Lao|bank
LA|LA.LDB|LDB|Lao Development Bank|bank
KR|KR.KB|KB Kookmin|KB Kookmin Bank|bank
KR|KR.SHINHAN|Shinhan|Shinhan Bank|bank
KR|KR.WOORI|Woori|Woori Bank|bank
KR|KR.HANA|Hana|Hana Bank|bank
KR|KR.NH|NH NongHyup|NongHyup Bank|bank
KR|KR.IBK|IBK|Industrial Bank of Korea|bank
KR|KR.KAKAOBANK|KakaoBank|KakaoBank|bank
KR|KR.TOSSBANK|Toss Bank|Toss Bank|bank
KR|KR.TOSS|Toss|Toss|wallet
KR|KR.KAKAOPAY|Kakao Pay|Kakao Pay|wallet
KR|KR.NAVERPAY|Naver Pay|Naver Pay|wallet
JP|JP.MUFG|MUFG|MUFG Bank|bank
JP|JP.SMBC|SMBC|Sumitomo Mitsui Banking Corporation|bank
JP|JP.MIZUHO|Mizuho|Mizuho Bank|bank
JP|JP.YUCHO|Japan Post Bank|Japan Post Bank|bank
JP|JP.RAKUTEN|Rakuten Bank|Rakuten Bank|bank
JP|JP.RESONA|Resona|Resona Bank|bank
JP|JP.SONY|Sony Bank|Sony Bank|bank
JP|JP.PAYPAY|PayPay|PayPay|wallet
JP|JP.RAKUTENPAY|Rakuten Pay|Rakuten Pay|wallet
JP|JP.DBARAI|d Barai|d Barai|wallet
JP|JP.AUPAY|au PAY|au PAY|wallet
CN|CN.ICBC|ICBC|Industrial and Commercial Bank of China|bank
CN|CN.CCB|CCB|China Construction Bank|bank
CN|CN.ABC|ABC|Agricultural Bank of China|bank
CN|CN.BOC|Bank of China|Bank of China|bank
CN|CN.BOCOM|BOCOM|Bank of Communications|bank
CN|CN.CMB|China Merchants Bank|China Merchants Bank|bank
CN|CN.ALIPAY|Alipay|Alipay|wallet
CN|CN.WECHATPAY|WeChat Pay|WeChat Pay|wallet
HK|HK.HSBC|HSBC HK|The Hongkong and Shanghai Banking Corporation|bank
HK|HK.HANGSENG|Hang Seng|Hang Seng Bank|bank
HK|HK.BOCHK|BOCHK|Bank of China (Hong Kong)|bank
HK|HK.SCB|Standard Chartered|Standard Chartered Bank (Hong Kong)|bank
HK|HK.ZA|ZA Bank|ZA Bank|bank
HK|HK.MOX|Mox|Mox Bank|bank
HK|HK.PAYME|PayMe|PayMe|wallet
HK|HK.ALIPAYHK|AlipayHK|AlipayHK|wallet
HK|HK.OCTOPUS|Octopus|Octopus|wallet
TW|TW.CTBC|CTBC|CTBC Bank|bank
TW|TW.CATHAY|Cathay United|Cathay United Bank|bank
TW|TW.FUBON|Taipei Fubon|Taipei Fubon Bank|bank
TW|TW.ESUN|E.SUN|E.SUN Bank|bank
TW|TW.POST|Chunghwa Post|Chunghwa Post|bank
TW|TW.MEGA|Mega Bank|Mega International Commercial Bank|bank
TW|TW.LINEPAY|LINE Pay|LINE Pay|wallet
TW|TW.JKOPAY|JKOPAY|JKOPAY|wallet
IN|IN.SBI|SBI|State Bank of India|bank
IN|IN.HDFC|HDFC Bank|HDFC Bank|bank
IN|IN.ICICI|ICICI Bank|ICICI Bank|bank
IN|IN.AXIS|Axis Bank|Axis Bank|bank
IN|IN.KOTAK|Kotak|Kotak Mahindra Bank|bank
IN|IN.PNB|PNB|Punjab National Bank|bank
IN|IN.BOB|Bank of Baroda|Bank of Baroda|bank
IN|IN.PHONEPE|PhonePe|PhonePe|wallet
IN|IN.GPAY|Google Pay|Google Pay|wallet
IN|IN.PAYTM|Paytm|Paytm|wallet
*|PAYPAL|PayPal|PayPal|wallet
*|WISE|Wise|Wise|wallet
*|REVOLUT|Revolut|Revolut|wallet
`;
