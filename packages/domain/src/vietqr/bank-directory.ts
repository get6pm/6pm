/**
 * Every bank and wallet the VietQR network lists, one per line: NAPAS BIN | code | short name |
 * legal name.
 *
 * Source: https://api.vietqr.io/v2/banks, fetched 2026-10-10 (65 entries, copied verbatim).
 * The BINs of the big retail banks were cross-checked against the State Bank of Vietnam's
 * "List of Bank Identification Numbers" (https://sbv.gov.vn/vi/w/bank-identification-numbers,
 * as of 31 Dec 2023). ZaloPay has no NAPAS BIN, so it is listed without one.
 */
export const BANK_DIRECTORY = `
970415|ICB|VietinBank|Ngân hàng TMCP Công thương Việt Nam
970436|VCB|Vietcombank|Ngân hàng TMCP Ngoại Thương Việt Nam
970418|BIDV|BIDV|Ngân hàng TMCP Đầu tư và Phát triển Việt Nam
970405|VBA|Agribank|Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam
970448|OCB|OCB|Ngân hàng TMCP Phương Đông
970422|MB|MBBank|Ngân hàng TMCP Quân đội
970407|TCB|Techcombank|Ngân hàng TMCP Kỹ thương Việt Nam
970416|ACB|ACB|Ngân hàng TMCP Á Châu
970432|VPB|VPBank|Ngân hàng TMCP Việt Nam Thịnh Vượng
970423|TPB|TPBank|Ngân hàng TMCP Tiên Phong
970403|STB|Sacombank|Ngân hàng TMCP Sài Gòn Thương Tín
970437|HDB|HDBank|Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh
970454|VCCB|VietCapitalBank|Ngân hàng TMCP Bản Việt
970429|SCB|SCB|Ngân hàng TMCP Sài Gòn
970441|VIB|VIB|Ngân hàng TMCP Quốc tế Việt Nam
970443|SHB|SHB|Ngân hàng TMCP Sài Gòn - Hà Nội
970431|EIB|Eximbank|Ngân hàng TMCP Xuất Nhập khẩu Việt Nam
970426|MSB|MSB|Ngân hàng TMCP Hàng Hải Việt Nam
546034|CAKE|CAKE|TMCP Việt Nam Thịnh Vượng - Ngân hàng số CAKE by VPBank
546035|UBANK|Ubank|TMCP Việt Nam Thịnh Vượng - Ngân hàng số Ubank by VPBank
971005|VTLMONEY|ViettelMoney|Tổng Công ty Dịch vụ số Viettel - Chi nhánh tập đoàn công nghiệp viễn thông Quân Đội
963388|TIMO|Timo|Ngân hàng số Timo by Ban Viet Bank (Timo by Ban Viet Bank)
971011|VNPTMONEY|VNPTMoney|VNPT Money
970400|SGICB|SaigonBank|Ngân hàng TMCP Sài Gòn Công Thương
970409|BAB|BacABank|Ngân hàng TMCP Bắc Á
971025|MOMO|MoMo|CTCP Dịch Vụ Di Động Trực Tuyến
971133|PVDB|PVcomBank Pay|Ngân hàng TMCP Đại Chúng Việt Nam Ngân hàng số
970412|PVCB|PVcomBank|Ngân hàng TMCP Đại Chúng Việt Nam
970414|MBV|MBV|Ngân hàng TNHH MTV Việt Nam Hiện Đại
970419|NCB|NCB|Ngân hàng TMCP Quốc Dân
970424|SHBVN|ShinhanBank|Ngân hàng TNHH MTV Shinhan Việt Nam
970425|ABB|ABBANK|Ngân hàng TMCP An Bình
970427|VAB|VietABank|Ngân hàng TMCP Việt Á
970428|NAB|NamABank|Ngân hàng TMCP Nam Á
970430|PGB|PGBank|Ngân hàng TMCP Thịnh vượng và Phát triển
970433|VIETBANK|VietBank|Ngân hàng TMCP Việt Nam Thương Tín
970438|BVB|BaoVietBank|Ngân hàng TMCP Bảo Việt
970440|SEAB|SeABank|Ngân hàng TMCP Đông Nam Á
970446|COOPBANK|COOPBANK|Ngân hàng Hợp tác xã Việt Nam
970449|LPB|LPBank|Ngân hàng TMCP Lộc Phát Việt Nam
970452|KLB|KienLongBank|Ngân hàng TMCP Kiên Long
668888|KBANK|KBank|Ngân hàng Đại chúng TNHH Kasikornbank
977777|MAFC|MAFC|Công ty Tài chính TNHH MTV Mirae Asset (Việt Nam)
970442|HLBVN|HongLeong|Ngân hàng TNHH MTV Hong Leong Việt Nam
970467|KEBHANAHN|KEBHANAHN|Ngân hàng KEB Hana – Chi nhánh Hà Nội
970466|KEBHANAHCM|KEBHanaHCM|Ngân hàng KEB Hana – Chi nhánh Thành phố Hồ Chí Minh
533948|CITIBANK|Citibank|Ngân hàng Citibank, N.A. - Chi nhánh Hà Nội
970444|CBB|CBBank|Ngân hàng Thương mại TNHH MTV Xây dựng Việt Nam
422589|CIMB|CIMB|Ngân hàng TNHH MTV CIMB Việt Nam
796500|DBS|DBSBank|DBS Bank Ltd - Chi nhánh Thành phố Hồ Chí Minh
970406|VIKKI|Vikki|Ngân hàng TNHH MTV Số Vikki
999888|VBSP|VBSP|Ngân hàng Chính sách Xã hội
970408|GPB|GPBank|Ngân hàng Thương mại TNHH MTV Dầu Khí Toàn Cầu
970463|KBHCM|KookminHCM|Ngân hàng Kookmin - Chi nhánh Thành phố Hồ Chí Minh
970462|KBHN|KookminHN|Ngân hàng Kookmin - Chi nhánh Hà Nội
970457|WVN|Woori|Ngân hàng TNHH MTV Woori Việt Nam
970421|VRB|VRB|Ngân hàng Liên doanh Việt - Nga
458761|HSBC|HSBC|Ngân hàng TNHH MTV HSBC (Việt Nam)
970455|IBK-HN|IBKHN|Ngân hàng Công nghiệp Hàn Quốc - Chi nhánh Hà Nội
970456|IBK-HCM|IBKHCM|Ngân hàng Công nghiệp Hàn Quốc - Chi nhánh TP. Hồ Chí Minh
970434|IVB|IndovinaBank|Ngân hàng TNHH Indovina
970458|UOB|UnitedOverseas|Ngân hàng United Overseas - Chi nhánh TP. Hồ Chí Minh
801011|NHBHN|Nonghyup|Ngân hàng Nonghyup - Chi nhánh Hà Nội
970410|SCVN|StandardChartered|Ngân hàng TNHH MTV Standard Chartered Bank Việt Nam
970439|PBVN|PublicBank|Ngân hàng TNHH MTV Public Việt Nam
|ZALOPAY|ZaloPay|ZaloPay
`;
