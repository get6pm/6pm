---
title: Chính sách quyền riêng tư
description: Những gì 6pm giữ trên điện thoại của bạn, phần rất nhỏ rời khỏi máy, và ai xử lý chúng.
lede: 6pm giữ tiền của bạn ngay trên điện thoại. Trang này nói rõ chúng tôi làm gì với phần rất nhỏ rời khỏi máy.
updated: '2026-10-15'
---

## Tóm tắt

- Chi tiêu, kế hoạch và nhật ký của bạn nằm trên iPhone, trong một cơ sở dữ liệu được mã hoá. Chúng tôi không đọc được.
- 6pm không cần tài khoản. Chỉ khi dùng Cùng chia ngân sách bạn mới đăng nhập, bằng Apple. Chúng tôi không hỏi số điện thoại, email hay thông tin đăng nhập ngân hàng của bạn.
- Chúng tôi không chạy quảng cáo, không bán dữ liệu, không dùng công cụ phân tích hay theo dõi, cả trong ứng dụng lẫn trên trang web này.
- Có một vài thứ nhỏ rời khỏi điện thoại: mã thiết bị ẩn danh, trạng thái mua hàng, bản cập nhật ứng dụng, báo cáo lỗi, câu hỏi bạn hỏi 6pm, giọng nói khi bạn đọc một khoản chi, vài thông tin về ngày của bạn để bạn đồng hành viết lời, ảnh biên lai mà điện thoại không đọc được, email ngân hàng bạn chuyển tới địa chỉ nhận biên lai, các hũ chung bạn góp cùng ai đó trong Cùng chia ngân sách và, chỉ khi bạn bật, bản sao lưu đã mã hoá. Từng thứ được giải thích bên dưới.
- Bạn có thể giữ toàn bộ AI của 6pm trên iPhone (Cài đặt → AI). Khi đó câu hỏi, thông tin để bạn đồng hành viết lời, ảnh biên lai và giọng nói của bạn cũng ở lại trên điện thoại.

## Chúng tôi là ai

6pm do {{OWNER}} ("chúng tôi") thực hiện. Bạn có thể liên hệ qua số [{{CONTACT_PHONE}}](tel:{{CONTACT_TEL}}).

Chính sách này áp dụng cho ứng dụng 6pm trên iPhone và trang web at6pm.app.

## Những gì ở lại trên điện thoại

Mọi thứ bạn nhập, và mọi thứ ứng dụng bắt giúp bạn, đều ở lại trên điện thoại. Đó là các khoản chi, số tiền, nơi chi tiêu, danh mục và ghi chú; ngày lĩnh lương và kế hoạch; các quỹ (pot); nhật ký; cùng cài đặt, giao diện và bạn đồng hành của bạn.

Tất cả nằm trong một cơ sở dữ liệu trên điện thoại, được mã hoá bằng SQLCipher. Khoá được tạo ngay trên máy lần đầu bạn mở 6pm và được giữ trong Keychain của iOS, gắn với thiết bị này. Khoá không bao giờ rời khỏi máy, và chúng tôi không nhận khoá hay cơ sở dữ liệu. Chỉ vài thông tin được mô tả ở mục “Hỏi 6pm và lời của bạn đồng hành” được gửi đi, mỗi lần đủ cho một câu.

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

Khi ứng dụng bị treo hoặc gặp lỗi, nó gửi một báo cáo tới Sentry để chúng tôi sửa: lỗi gì trong mã, xảy ra ở màn hình nào, phiên bản ứng dụng, đời iPhone, phiên bản iOS và một mã cài đặt ngẫu nhiên. Báo cáo không bao giờ chứa khoản chi, số tiền, ghi chú, kế hoạch hay tên của bạn, và chúng tôi không gắn kèm địa chỉ IP. Ở chế độ trên máy, không có báo cáo lỗi nào được gửi.

### Hỏi 6pm và lời của bạn đồng hành, gọi tên nơi nhận tiền và đọc ảnh biên lai

Khi bạn hỏi 6pm một câu, ví dụ "Thứ Bảy tiêu 2tr được không?", ứng dụng gửi nội dung câu hỏi tới máy chủ của chúng tôi, kèm tên các danh mục và hũ của bạn để đọc câu hỏi cho đúng. Máy chủ hỏi Anthropic, một dịch vụ AI, xem câu hỏi muốn biết gì. Câu trả lời được tính ngay trên điện thoại, từ dữ liệu của chính bạn, không bao giờ được gửi đi.

Để viết lời của bạn đồng hành và câu chữ của một câu trả lời, ứng dụng gửi tới máy chủ của chúng tôi, rồi tới Anthropic, vài thông tin mà câu đó nói tới, đã được tính sẵn trên điện thoại: ví dụ một số tiền, tên nơi chi, tên danh mục hay hũ, hoặc tuần này so với tuần trước ra sao. Ứng dụng không bao giờ gửi danh sách khoản chi, kế hoạch hay số dư của bạn. Khi không có mạng, ứng dụng dùng những câu viết sẵn bên trong.

Khi bạn chia sẻ ảnh chụp biên lai cho 6pm, chữ trên ảnh được đọc ngay trên điện thoại. Nếu ứng dụng không chắc bạn đã trả tiền cho ai, và không quy tắc nào của bạn biết tên đó, nó gửi các dòng chữ của biên lai tới máy chủ, rồi tới Anthropic, để gọi tên nơi nhận tiền. Mọi con số đều được bỏ đi trước, nên số tiền, số tài khoản và mã giao dịch không bao giờ được gửi. Nếu có gì chứa chữ số được gửi tới, máy chủ từ chối mà không đọc.

Nếu điện thoại không chắc về tổng tiền hay loại tiền trên một biên lai bạn chia sẻ, nó gửi đúng ảnh biên lai đó tới máy chủ của chúng tôi, rồi tới Anthropic, một dịch vụ AI, để đọc tổng tiền, loại tiền, tên cửa hàng và thời gian. Máy chủ không lưu và không ghi nhật ký ảnh, và không gửi ảnh cho ai khác. Anthropic không dùng ảnh để huấn luyện mô hình, và xoá ảnh trong vòng 30 ngày (lâu hơn chỉ khi yêu cầu bị đánh dấu vi phạm chính sách sử dụng của Anthropic, hoặc khi luật đòi hỏi). Khi không có mạng, ứng dụng giữ kết quả điện thoại đã đọc.

Khi bạn tạo một danh mục, ứng dụng có thể gửi tên danh mục tới máy chủ của chúng tôi, rồi tới Anthropic, để gợi ý biểu tượng.

Chúng tôi không lưu câu hỏi, các dòng biên lai hay ảnh biên lai của bạn. Với mỗi yêu cầu, máy chủ chỉ ghi lại lượng dịch vụ AI đã dùng, gắn với mã thiết bị ẩn danh của bạn. Anthropic không dùng các yêu cầu để huấn luyện mô hình, và xoá chúng trong vòng 30 ngày (lâu hơn chỉ khi một yêu cầu bị đánh dấu vi phạm chính sách sử dụng của Anthropic, hoặc khi luật đòi hỏi).

### Giọng nói của bạn

Khi bạn nói một khoản chi, ứng dụng truyền âm thanh từ micrô thẳng tới một dịch vụ chuyển giọng nói thành chữ, Deepgram (hoặc ElevenLabs), chỉ trong lúc bạn giữ hoặc chạm vào nút micrô, và nhận lại chữ. Máy chủ của chúng tôi chỉ cấp cho điện thoại một khoá dùng ngắn hạn và ghi lại rằng đã có một lượt chuyển giọng nói, gắn với mã thiết bị ẩn danh của bạn. Máy chủ không bao giờ nghe âm thanh hay thấy chữ. Với Deepgram, chúng tôi từ chối chương trình cải thiện mô hình của họ, nên âm thanh chỉ được giữ trong lúc chuyển thành chữ. Không có gì được ghi lại trên điện thoại. Khi không có mạng, ở chế độ trên máy, hoặc sau 10 lượt mỗi ngày nếu không có 6pm Max, tính năng nhận dạng giọng nói của Apple chuyển lời bạn thành chữ ngay trên điện thoại, và không gửi gì đi.

### Chế độ trên máy

Trong Cài đặt → AI, bạn có thể giữ AI của 6pm trên iPhone. Khi đó không thứ nào trong mục "Hỏi 6pm và lời của bạn đồng hành" hay "Giọng nói của bạn" rời khỏi máy: câu hỏi được hiểu, lời được viết và biên lai được đọc ngay trên điện thoại, bằng một mô hình bạn tải về một lần. Mô hình được tải từ Hugging Face; họ thấy địa chỉ IP của bạn và mô hình bạn tải, ngoài ra không gì khác. Ở chế độ này, biên lai qua email tắt, báo cáo lỗi tắt, và chế độ Du lịch biết bạn ở nước nào qua múi giờ của điện thoại thay vì vị trí.

### Biên lai qua email

6pm cấp cho điện thoại của bạn một địa chỉ riêng, kiểu k7m2qx@at6pm.app. Nếu bạn để ngân hàng gửi email, hoặc tự chuyển tiếp email của ngân hàng, tới địa chỉ đó, các khoản thanh toán sẽ vào Hộp thư của bạn.

Máy chủ của chúng tôi đọc từng email khi nó đến. Nếu email có một khoản thanh toán, máy chủ chỉ giữ những gì đọc được: số tiền, nơi nhận tiền, thời gian và địa chỉ người gửi. Thông tin này được khoá bằng mã hoá cho đến khi điện thoại của bạn lấy về, rồi bị xoá. Bản thân email không bao giờ được lưu, chuyển tiếp hay ghi nhật ký, và thư nào không phải biên lai đều bị bỏ đi. Biên lai nào điện thoại chưa lấy về sau 30 ngày sẽ bị xoá mà không đọc.

Địa chỉ này gắn với mã thiết bị ẩn danh của bạn, không gắn với tên bạn. Thư từ bất kỳ ai gửi tới đều được đọc như nhau, nên bạn chỉ nên đưa địa chỉ này cho ngân hàng.

### Tỷ giá (Du lịch)

Ở chế độ Du lịch, ứng dụng lấy tỷ giá trong ngày từ máy chủ của chúng tôi. Máy chủ lấy tỷ giá từ Frankfurter, một dịch vụ miễn phí công bố tỷ giá của các ngân hàng trung ương. Yêu cầu này không mang theo gì về bạn hay chuyện tiền bạc của bạn.

### Sao lưu mã hoá (6pm Max)

Sao lưu là tính năng của 6pm Max và luôn tắt cho đến khi bạn bật. Bản sao lưu được mã hoá đầu cuối: khoá nằm trong Chuỗi khoá iCloud (iCloud Keychain) của bạn, còn máy chủ của chúng tôi chỉ lưu dữ liệu đã mã hoá dưới một mã ẩn danh. Dữ liệu đã mã hoá là dữ liệu bị xáo trộn mà chúng tôi không đọc được.

Apple đồng bộ khoá giữa các thiết bị của bạn qua Chuỗi khoá iCloud, theo Apple ID của bạn và điều khoản của Apple. Nếu bạn mất cả khoá lẫn điện thoại, không ai, kể cả chúng tôi, có thể mở bản sao lưu.

### Cùng chia ngân sách

Cùng chia ngân sách cho hai người cùng góp vào các hũ chung. Đây là phần duy nhất của 6pm có đăng nhập, và không có gì xảy ra nếu bạn không bắt đầu hoặc mở một link mời.

- **Đăng nhập bằng Apple.** Khi bắt đầu hoặc tham gia, bạn đăng nhập bằng Apple. Apple cho chúng tôi một mã cố định chỉ dùng được với 6pm và, ở lần đầu, tên của bạn nếu bạn chọn chia sẻ. Chúng tôi không bao giờ hỏi email. Máy chủ gắn mã đó với mã thiết bị ẩn danh của bạn. Khi bạn xoá tài khoản, máy chủ cũng đề nghị Apple chấm dứt quyền truy cập của 6pm, nên 6pm rời khỏi danh sách "Đăng nhập bằng Apple" trong cài đặt Apple ID của bạn.
- **Những gì được chia sẻ.** Máy chủ giữ tên của bạn, tên, biểu tượng, màu, mục tiêu và tháng của từng hũ chung, cùng từng khoản mỗi người nói đã góp, ai góp và lúc nào. Người cùng góp thấy tất cả những điều này, và bạn thấy phần của họ. Không có gì khác từ điện thoại được chia sẻ: không chi tiêu, không kế hoạch, không con số mỗi ngày, không hũ riêng của bạn.
- **Link mời.** Mỗi link mời dùng được một lần, trong 7 ngày. Máy chủ chỉ lưu dạng đã xáo trộn của nó.
- **Rời đi.** Ai trong hai người cũng có thể rời đi bất cứ lúc nào. Rời đi sẽ kết thúc cho cả hai và xoá các hũ chung cùng mọi thứ trong đó khỏi máy chủ. Mỗi điện thoại giữ lại, như lịch sử, những khoản chính người dùng nó đã góp.
- **Xoá tài khoản.** "Xoá tài khoản Cùng chia ngân sách" trong ứng dụng xoá đăng nhập, tên của bạn và mọi thứ bạn chia sẻ khỏi máy chủ, và kết thúc cho cả người cùng góp. Ngừng cho 6pm dùng Apple ID trong cài đặt Apple ID cũng có tác dụng như vậy.

6pm không bao giờ chuyển tiền. Các khoản trong hũ chung là số mỗi người nói đã để riêng; chúng chỉ để đếm.

### Danh sách chờ ra mắt (trang web)

Nếu bạn đăng ký vào danh sách chờ trên trang web này, chúng tôi lưu địa chỉ email, ngôn ngữ của trang, thời điểm đăng ký và số thứ tự của bạn. Nếu trước đó bạn đã dùng công cụ tính khoản tiền rò rỉ (leak calculator) của trang, chúng tôi cũng lưu con số hàng tháng nó đưa ra. Bản thân công cụ chạy ngay trong trình duyệt của bạn, và sẽ không gửi gì nếu bạn không đăng ký.

Chúng tôi chỉ dùng thông tin này để báo cho bạn khi 6pm 2.0 ra mắt. Thông tin được giữ cho đến khi bạn yêu cầu xoá.

### Khi bạn truy cập trang web

Trang web này không đặt cookie và không dùng công cụ phân tích. Phông chữ được phục vụ ngay từ trang. Trang chạy trên Cloudflare, đơn vị xử lý từng yêu cầu và có thể giữ nhật ký kỹ thuật thông thường, như địa chỉ IP và loại trình duyệt, để vận hành và bảo vệ dịch vụ. Để làm chậm hành vi lạm dụng, máy chủ của chúng tôi đếm số yêu cầu theo địa chỉ IP. Địa chỉ chỉ là khoá của bộ đếm, chúng tôi không lưu lại.

## Ứng dụng dùng gì trên điện thoại

- **Camera.** Chức năng Quét dùng camera để đọc mã QR, ví dụ VietQR. Hình ảnh không bao giờ được lưu hay gửi đi. Chỉ thông tin thanh toán trong mã được dùng, ngay trên điện thoại. Nếu bạn từ chối camera, mọi thứ còn lại vẫn hoạt động.
- **Micrô và giọng nói.** Khi bạn nói một khoản chi, âm thanh được gửi tới dịch vụ chuyển giọng nói thành chữ như mô tả ở mục "Giọng nói của bạn", hoặc được chuyển thành chữ ngay trên điện thoại bằng tính năng nhận dạng giọng nói trên máy của Apple. Bản ghi âm không bao giờ được lưu.
- **Ảnh.** 6pm lưu những hình bạn chọn chia sẻ, như thẻ tổng kết ngày, vào thư viện ảnh. Ứng dụng không bao giờ đọc thư viện của bạn. Ảnh chụp biên lai bạn chia sẻ cho 6pm được đọc ngay trên điện thoại rồi bỏ đi; chỉ ảnh nào điện thoại không đọc được mới được gửi đi để đọc, như mô tả ở trên.
- **Vị trí.** Chỉ sau khi bạn bật chế độ Du lịch, và chỉ khi ứng dụng đang mở, 6pm mới kiểm tra bạn đang ở nước nào để đổi tiền tệ. Hệ thống của điện thoại chuyển vị trí thành tên nước và thành phố. 6pm giữ tên nước và thành phố trên điện thoại, và không gửi gì về nơi bạn đang ở cho chúng tôi. Ở chế độ trên máy, 6pm không dùng vị trí: nước của bạn được suy ra từ múi giờ của điện thoại.
- **Tiện ích, Hoạt động trực tiếp và Siri.** Tiện ích (widget), Hoạt động trực tiếp (Live Activity), phím tắt và nút điều khiển đọc và ghi qua một thư mục chung trên điện thoại. Không thứ gì trong đó đi qua máy chủ của chúng tôi.
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

Các công ty này vận hành những phần của dịch vụ đã nêu ở trên. Họ có thể xử lý dữ liệu của bạn ở nước khác, kể cả Hoa Kỳ và Trung Quốc.

- **Apple** xử lý thanh toán, Chuỗi khoá iCloud và Đăng nhập bằng Apple. [Chính sách quyền riêng tư của Apple](https://www.apple.com/legal/privacy/).
- **RevenueCat** ghi lại trạng thái mua hàng. [Chính sách quyền riêng tư của RevenueCat](https://www.revenuecat.com/privacy).
- **Cloudflare** lưu trữ trang web và máy chủ của chúng tôi. [Chính sách quyền riêng tư của Cloudflare](https://www.cloudflare.com/privacypolicy/).
- **Sentry** nhận báo cáo lỗi. [Chính sách quyền riêng tư của Sentry](https://sentry.io/privacy/).
- **Anthropic** đọc câu hỏi bạn hỏi, viết lời của bạn đồng hành từ những thông tin về ngày của bạn mô tả ở trên, gợi ý biểu tượng cho danh mục từ tên danh mục, gọi tên nơi nhận tiền từ các dòng biên lai đã bỏ số, và đọc ảnh biên lai mà điện thoại không đọc được. [Chính sách quyền riêng tư của Anthropic](https://www.anthropic.com/legal/privacy).
- **Deepgram** chuyển giọng nói thành chữ khi bạn đọc một khoản chi. [Chính sách quyền riêng tư của Deepgram](https://deepgram.com/privacy).
- **ElevenLabs** có thể làm việc đó thay Deepgram. [Chính sách quyền riêng tư của ElevenLabs](https://elevenlabs.io/privacy-policy).
- **Hugging Face** cung cấp các mô hình bạn tải về cho chế độ trên máy. [Chính sách quyền riêng tư của Hugging Face](https://huggingface.co/privacy).
- **Expo** gửi các bản cập nhật ứng dụng qua mạng. [Chính sách quyền riêng tư của Expo](https://expo.dev/privacy).

Chúng tôi chỉ dùng họ cho những mục đích này.

## Chúng tôi giữ dữ liệu bao lâu

- **Trên điện thoại.** Cho đến khi bạn xoá. "Xoá toàn bộ dữ liệu" trong Cài đặt sẽ xoá các khoản chi, kế hoạch và nhật ký khỏi điện thoại và tắt lời nhắc. Xoá ứng dụng cũng xoá dữ liệu.
- **Mã thiết bị.** Chừng nào ứng dụng còn được dùng trên thiết bị đó.
- **Báo cáo lỗi.** Tối đa 90 ngày, sau đó bị xoá.
- **Biên lai qua email.** Cho đến khi điện thoại lấy biên lai về, và không bao giờ quá 30 ngày. Địa chỉ nhận biên lai tồn tại chừng nào mã thiết bị còn.
- **Câu hỏi, thông tin để viết lời và dòng biên lai.** Chúng tôi không giữ. Anthropic xoá trong vòng 30 ngày, như mô tả ở trên.
- **Ảnh biên lai.** Chúng tôi không giữ. Anthropic xoá trong vòng 30 ngày, như mô tả ở trên.
- **Giọng nói.** Chúng tôi không giữ. Deepgram chỉ xử lý trong lúc bạn nói; ElevenLabs giữ theo chính sách của họ.
- **Sao lưu.** Cho đến khi bạn xoá. Khi bạn xoá, chúng tôi xoá dữ liệu mã hoá khỏi máy chủ.
- **Cùng chia ngân sách.** Hũ chung cho đến khi một trong hai người rời đi; đăng nhập và tên của bạn cho đến khi bạn xoá tài khoản Cùng chia ngân sách. Cả hai việc đều xoá dữ liệu khỏi máy chủ ngay lập tức.
- **Danh sách chờ.** Cho đến khi bạn yêu cầu xoá email của mình.
- **Hồ sơ mua hàng.** Apple và RevenueCat lưu theo chính sách của họ và theo quy định pháp luật.

## Lựa chọn và quyền của bạn

Bạn kiểm soát dữ liệu trên điện thoại: có thể sửa hoặc xoá bất kỳ thứ gì ngay trong ứng dụng.

Với bất kỳ thông tin nào chúng tôi giữ về bạn, bạn có thể yêu cầu cho biết đó là gì, chỉnh sửa, xoá, hoặc ngừng sử dụng. Hãy liên hệ qua số [{{CONTACT_PHONE}}](tel:{{CONTACT_TEL}}). Chúng tôi sẽ trả lời sớm và trong thời hạn pháp luật quy định. Máy chủ của chúng tôi giữ rất ít thông tin chỉ ra một con người cụ thể, nên có thể chúng tôi sẽ nhờ bạn cung cấp thêm điều giúp tìm ra nó, ví dụ email bạn đã dùng để đăng ký danh sách chờ.

Bạn cũng có thể khiếu nại với cơ quan bảo vệ dữ liệu nơi bạn sinh sống.

## Trẻ em

6pm không dành cho trẻ em dưới 16 tuổi, và chúng tôi không cố ý thu thập dữ liệu của các em. Nếu bạn nghĩ một em nhỏ đã gửi thông tin cho chúng tôi, hãy viết thư cho chúng tôi và chúng tôi sẽ xoá.

## Bảo mật

Dữ liệu của bạn được mã hoá trên điện thoại. Kết nối tới máy chủ của chúng tôi dùng HTTPS. Bản sao lưu được mã hoá trước khi rời khỏi điện thoại, và biên lai từ email được giữ ở dạng mã hoá cho đến khi điện thoại lấy về. Máy chủ chỉ lưu mã thiết bị ở dạng đã băm. Không hệ thống nào an toàn tuyệt đối, vì vậy nếu bạn phát hiện sự cố, xin hãy báo cho chúng tôi.

## Thay đổi chính sách

Khi thay đổi chính sách này, chúng tôi sẽ cập nhật ngày ở đầu trang. Nếu thay đổi quan trọng, chúng tôi sẽ báo cho bạn trong ứng dụng hoặc trên trang này trước khi nó có hiệu lực.

## Pháp luật và cách liên hệ

Chúng tôi xử lý dữ liệu cá nhân theo pháp luật Việt Nam, trong đó có Luật Bảo vệ dữ liệu cá nhân. Nếu bạn sống ở nơi khác, các quyền mà pháp luật nước bạn trao vẫn được giữ nguyên.

Có câu hỏi? Hãy gọi hoặc nhắn cho {{OWNER}} qua số [{{CONTACT_PHONE}}](tel:{{CONTACT_TEL}}).
