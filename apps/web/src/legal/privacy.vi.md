---
title: Chính sách quyền riêng tư
description: Những gì 6pm giữ trên điện thoại của bạn, phần rất nhỏ rời khỏi máy, và ai xử lý chúng.
lede: 6pm giữ tiền của bạn ngay trên điện thoại. Trang này nói rõ chúng tôi làm gì với phần rất nhỏ rời khỏi máy.
updated: '2026-10-11'
---

## Tóm tắt

- Chi tiêu, kế hoạch và nhật ký của bạn nằm trên iPhone, trong một cơ sở dữ liệu được mã hoá. Chúng tôi không đọc được.
- Không có tài khoản, không cần đăng nhập. Chúng tôi không hỏi tên, số điện thoại hay thông tin đăng nhập ngân hàng của bạn.
- Chúng tôi không chạy quảng cáo, không bán dữ liệu, không dùng công cụ phân tích hay theo dõi, cả trong ứng dụng lẫn trên trang web này.
- Có một vài thứ nhỏ rời khỏi điện thoại: mã thiết bị ẩn danh, trạng thái mua hàng, bản cập nhật ứng dụng, báo cáo lỗi và, chỉ khi bạn bật, bản sao lưu đã mã hoá. Từng thứ được giải thích bên dưới.

## Chúng tôi là ai

6pm do {{OWNER}} ("chúng tôi") thực hiện. Bạn có thể liên hệ qua số [{{CONTACT_PHONE}}](tel:{{CONTACT_TEL}}).

Chính sách này áp dụng cho ứng dụng 6pm trên iPhone và trang web 6pm.oddeggs.studio.

## Những gì ở lại trên điện thoại

Mọi thứ bạn nhập, và mọi thứ ứng dụng bắt giúp bạn, đều ở lại trên điện thoại. Đó là các khoản chi, số tiền, nơi chi tiêu, danh mục và ghi chú; ngày lĩnh lương và kế hoạch; các quỹ (pot); nhật ký; cùng cài đặt, giao diện và bạn đồng hành của bạn.

Tất cả nằm trong một cơ sở dữ liệu trên điện thoại, được mã hoá bằng SQLCipher. Khoá được tạo ngay trên máy lần đầu bạn mở 6pm và được giữ trong Keychain của iOS, gắn với thiết bị này. Khoá không bao giờ rời khỏi máy, và chúng tôi không nhận khoá hay bất kỳ dữ liệu nào trong đó.

Vì khoá ở lại trên máy này, dữ liệu sẽ không tự chuyển sang điện thoại mới. Nếu không sao lưu, dữ liệu chỉ tồn tại ở đây.

## Những gì rời khỏi điện thoại

Chỉ những thứ dưới đây, và chỉ vì những lý do nêu ra.

### Mã thiết bị ẩn danh

Khi ứng dụng làm việc với máy chủ của chúng tôi, trước tiên nó nhận một mã ngẫu nhiên đại diện cho bản cài đặt của bạn. Mã này được giữ trên điện thoại. Máy chủ chỉ lưu dạng đã băm của mã (SHA-256), cùng ngôn ngữ ứng dụng (tiếng Anh hoặc tiếng Việt) và thời điểm thấy mã lần đầu và lần gần nhất.

Không thứ nào trong số này gắn với tên, email hay bất cứ điều gì trong chuyện tiền bạc của bạn. Chúng tôi dùng nó để kiểm tra yêu cầu đến từ một bản cài đặt thật của ứng dụng, hạn chế lạm dụng, và đếm số thiết bị dùng 6pm mỗi ngày.

### Mua hàng

Apple thu tiền. Chúng tôi không bao giờ thấy thẻ hay thông tin thanh toán của bạn.

Để biết bạn đã mở khoá những gì, 6pm dùng RevenueCat, dịch vụ ghi lại trạng thái mua hàng. RevenueCat biết từ Apple bạn đã mua giao diện hay gói nào, khi nào, và bản dùng thử hay gói đăng ký còn hiệu lực không. Thông tin này gắn với một mã người dùng ẩn danh, không phải tên hay email của bạn. Như hầu hết công cụ mua hàng, RevenueCat cũng nhận một số thông tin kỹ thuật cơ bản từ điện thoại: phiên bản ứng dụng, kiểu máy và phiên bản hệ điều hành, quốc gia và ngôn ngữ, và địa chỉ IP.

Nhờ vậy Max và các giao diện của bạn luôn được mở khoá, và "Khôi phục giao dịch mua" hoạt động được.

### Cập nhật ứng dụng

Chúng tôi gửi một số bản sửa lỗi qua mạng bằng dịch vụ cập nhật của Expo. Điện thoại của bạn hỏi Expo xem có bản cập nhật nào đang chờ không. Yêu cầu đó gồm phiên bản ứng dụng, nền tảng và địa chỉ IP. Nó không mang theo gì từ chuyện tiền bạc của bạn.

### Báo cáo lỗi

Khi ứng dụng bị treo hoặc gặp lỗi, nó gửi một báo cáo tới Sentry để chúng tôi sửa: lỗi gì trong mã, xảy ra ở màn hình nào, phiên bản ứng dụng, đời iPhone, phiên bản iOS và một mã cài đặt ngẫu nhiên. Báo cáo không bao giờ chứa khoản chi, số tiền, ghi chú, kế hoạch hay tên của bạn, và chúng tôi không gắn kèm địa chỉ IP.

### Sao lưu mã hoá (6pm Max)

Sao lưu là tính năng của 6pm Max và luôn tắt cho đến khi bạn bật. Bản sao lưu được mã hoá đầu cuối: khoá nằm trong Chuỗi khoá iCloud (iCloud Keychain) của bạn, còn máy chủ của chúng tôi chỉ lưu dữ liệu đã mã hoá dưới một mã ẩn danh. Dữ liệu đã mã hoá là dữ liệu bị xáo trộn mà chúng tôi không đọc được.

Apple đồng bộ khoá giữa các thiết bị của bạn qua Chuỗi khoá iCloud, theo Apple ID của bạn và điều khoản của Apple. Nếu bạn mất cả khoá lẫn điện thoại, không ai, kể cả chúng tôi, có thể mở bản sao lưu.

### Danh sách chờ ra mắt (trang web)

Nếu bạn đăng ký vào danh sách chờ trên trang web này, chúng tôi lưu địa chỉ email, ngôn ngữ của trang, thời điểm đăng ký và số thứ tự của bạn. Nếu trước đó bạn đã dùng công cụ tính khoản tiền rò rỉ (leak calculator) của trang, chúng tôi cũng lưu con số hàng tháng nó đưa ra. Bản thân công cụ chạy ngay trong trình duyệt của bạn, và sẽ không gửi gì nếu bạn không đăng ký.

Chúng tôi chỉ dùng thông tin này để báo cho bạn khi 6pm 2.0 ra mắt. Thông tin được giữ cho đến khi bạn yêu cầu xoá.

### Khi bạn truy cập trang web

Trang web này không đặt cookie và không dùng công cụ phân tích. Phông chữ được phục vụ ngay từ trang. Trang chạy trên Cloudflare, đơn vị xử lý từng yêu cầu và có thể giữ nhật ký kỹ thuật thông thường, như địa chỉ IP và loại trình duyệt, để vận hành và bảo vệ dịch vụ. Để làm chậm hành vi lạm dụng, máy chủ của chúng tôi đếm số yêu cầu theo địa chỉ IP. Địa chỉ chỉ là khoá của bộ đếm, chúng tôi không lưu lại.

## Ứng dụng dùng gì trên điện thoại

- **Camera.** Chức năng Quét dùng camera để đọc mã QR, ví dụ VietQR. Hình ảnh không bao giờ được lưu hay gửi đi. Chỉ thông tin thanh toán trong mã được dùng, ngay trên điện thoại. Nếu bạn từ chối camera, mọi thứ còn lại vẫn hoạt động.
- **Bộ nhớ tạm (clipboard).** Khi bạn chuyển khoản sang ứng dụng ngân hàng, 6pm sao chép số tiền để bạn dán vào. 6pm chỉ ghi vào bộ nhớ tạm, không bao giờ đọc những gì đang có trong đó.
- **Ứng dụng ngân hàng.** Ứng dụng kiểm tra ngay trên máy xem một số ứng dụng ngân hàng đã được cài chưa, rồi mở ứng dụng bạn chọn, hoặc trang của nó trên App Store. Chúng tôi không gửi gì cho ngân hàng. Khi bạn đã ở trong ứng dụng của ngân hàng, chính sách của ngân hàng đó được áp dụng.
- **Thông báo.** Lời nhắc hằng ngày vào giờ chốt ngày được đặt ngay trên điện thoại. Không có thông báo đẩy từ xa, và không có mã thông báo nào được gửi cho chúng tôi.

## Những điều chúng tôi không làm

- Không hiển thị quảng cáo.
- Không bán dữ liệu của bạn, cũng không chia sẻ cho mục đích tiếp thị.
- Không lập hồ sơ về bạn.
- Phiên bản ứng dụng này không có công cụ phân tích, quảng cáo hay theo dõi của bên thứ ba.

Nếu bạn chọn chia sẻ dữ liệu phân tích với nhà phát triển trong Cài đặt iOS, Apple có thể gửi cho chúng tôi dữ liệu lỗi và mức sử dụng ẩn danh. Chúng tôi không biết dữ liệu đó của ai.

## Ai xử lý dữ liệu giúp chúng tôi

Các công ty này vận hành những phần của dịch vụ đã nêu ở trên. Họ có thể xử lý dữ liệu của bạn ở nước khác, kể cả Hoa Kỳ.

- **Apple** xử lý thanh toán và Chuỗi khoá iCloud. [Chính sách quyền riêng tư của Apple](https://www.apple.com/legal/privacy/).
- **RevenueCat** ghi lại trạng thái mua hàng. [Chính sách quyền riêng tư của RevenueCat](https://www.revenuecat.com/privacy).
- **Cloudflare** lưu trữ trang web và máy chủ của chúng tôi. [Chính sách quyền riêng tư của Cloudflare](https://www.cloudflare.com/privacypolicy/).
- **Sentry** nhận báo cáo lỗi. [Chính sách quyền riêng tư của Sentry](https://sentry.io/privacy/).
- **Expo** gửi các bản cập nhật ứng dụng qua mạng. [Chính sách quyền riêng tư của Expo](https://expo.dev/privacy).

Chúng tôi chỉ dùng họ cho những mục đích này.

## Chúng tôi giữ dữ liệu bao lâu

- **Trên điện thoại.** Cho đến khi bạn xoá. "Xoá toàn bộ dữ liệu" trong Cài đặt sẽ xoá các khoản chi, kế hoạch và nhật ký khỏi điện thoại và tắt lời nhắc. Xoá ứng dụng cũng xoá dữ liệu.
- **Mã thiết bị.** Chừng nào ứng dụng còn được dùng trên thiết bị đó.
- **Báo cáo lỗi.** Tối đa 90 ngày, sau đó bị xoá.
- **Sao lưu.** Cho đến khi bạn xoá. Khi bạn xoá, chúng tôi xoá dữ liệu mã hoá khỏi máy chủ.
- **Danh sách chờ.** Cho đến khi bạn yêu cầu xoá email của mình.
- **Hồ sơ mua hàng.** Apple và RevenueCat lưu theo chính sách của họ và theo quy định pháp luật.

## Lựa chọn và quyền của bạn

Bạn kiểm soát dữ liệu trên điện thoại: có thể sửa hoặc xoá bất kỳ thứ gì ngay trong ứng dụng.

Với bất kỳ thông tin nào chúng tôi giữ về bạn, bạn có thể yêu cầu cho biết đó là gì, chỉnh sửa, xoá, hoặc ngừng sử dụng. Hãy liên hệ qua số [{{CONTACT_PHONE}}](tel:{{CONTACT_TEL}}). Chúng tôi sẽ trả lời sớm và trong thời hạn pháp luật quy định. Máy chủ của chúng tôi giữ rất ít thông tin chỉ ra một con người cụ thể, nên có thể chúng tôi sẽ nhờ bạn cung cấp thêm điều giúp tìm ra nó, ví dụ email bạn đã dùng để đăng ký danh sách chờ.

Bạn cũng có thể khiếu nại với cơ quan bảo vệ dữ liệu nơi bạn sinh sống.

## Trẻ em

6pm không dành cho trẻ em dưới 16 tuổi, và chúng tôi không cố ý thu thập dữ liệu của các em. Nếu bạn nghĩ một em nhỏ đã gửi thông tin cho chúng tôi, hãy viết thư cho chúng tôi và chúng tôi sẽ xoá.

## Bảo mật

Dữ liệu của bạn được mã hoá trên điện thoại. Kết nối tới máy chủ của chúng tôi dùng HTTPS. Bản sao lưu được mã hoá trước khi rời khỏi điện thoại. Máy chủ chỉ lưu mã thiết bị ở dạng đã băm. Không hệ thống nào an toàn tuyệt đối, vì vậy nếu bạn phát hiện sự cố, xin hãy báo cho chúng tôi.

## Thay đổi chính sách

Khi thay đổi chính sách này, chúng tôi sẽ cập nhật ngày ở đầu trang. Nếu thay đổi quan trọng, chúng tôi sẽ báo cho bạn trong ứng dụng hoặc trên trang này trước khi nó có hiệu lực.

## Pháp luật và cách liên hệ

Chúng tôi xử lý dữ liệu cá nhân theo pháp luật Việt Nam, trong đó có Luật Bảo vệ dữ liệu cá nhân. Nếu bạn sống ở nơi khác, các quyền mà pháp luật nước bạn trao vẫn được giữ nguyên.

Có câu hỏi? Hãy gọi hoặc nhắn cho {{OWNER}} qua số [{{CONTACT_PHONE}}](tel:{{CONTACT_TEL}}).
