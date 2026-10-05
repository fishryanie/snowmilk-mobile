# Sữa Tuyết Mobile

App Expo SDK 57 dùng cấu trúc `src`, scripts build, theme và các component `ThemedText`, `ThemedView`, button, input, skeleton, empty state từ `eboost-cms-mobile`. Dữ liệu và nghiệp vụ đi qua API hiện có của `snowmilk`, dùng chung DB trên server.

## Chạy trên điện thoại

App mặc định dùng web/API đã deploy tại `https://uangon.vercel.app`. Không cần khởi động backend trên máy tính. Khởi động app:

```sh
cd /Users/mac/Documents/MyProject/snowmilk-mobile
bun install
bun run start --go --clear
```

Dùng Expo Go hỗ trợ SDK 57, điện thoại và máy tính cùng Wi-Fi để truy cập Expo, quét QR mới từ Expo. Nếu còn thông báo dự án SDK 56, dừng terminal Expo cũ bằng Ctrl+C rồi chạy lại lệnh trên trong đúng thư mục `snowmilk-mobile`. `.env.local` đã cấu hình `EXPO_PUBLIC_API_URL=https://uangon.vercel.app`. App mở thẳng vào Tổng quan; bản build cũng mặc định dùng địa chỉ Vercel này khi không có biến môi trường. Sau khi đổi `.env.local`, tải lại toàn bộ app trong Expo Go để nhận địa chỉ mới.

Nếu cần phát triển API cục bộ, chạy backend trong dự án `snowmilk` với `bun run dev --port 3101 --hostname 0.0.0.0`, rồi đặt `EXPO_PUBLIC_API_URL=http://<IP-LAN-của-máy-tính>:3101` trong `.env.local`. Điện thoại không truy cập backend máy tính bằng `localhost`.

App không có trang cấu hình máy chủ hoặc đăng nhập. Nếu đã có phiên native lưu bằng SecureStore, app chỉ khôi phục phiên cho đúng máy chủ được cấu hình. Quyền truy cập vẫn do API Snowmilk kiểm tra; lỗi được hiển thị tại màn hình đang xem. Không đưa thông tin MongoDB vào app.

`bun run web` phục vụ xem giao diện trên trình duyệt. Backend hiện tại không cấu hình CORS cho web khác origin; bản xem web cần reverse proxy cùng origin hoặc backend cho phép origin phù hợp. App native không chịu ràng buộc CORS của trình duyệt.

## Năm tab

- **Dashboard:** lọc thời gian, tiền vào/ra, chênh lệch thu–chi, lợi nhuận ước tính và số ly. Đã bỏ thẻ doanh thu lớn, thao tác nhanh, tiền đang ở đâu, sản phẩm trong kỳ và cảnh báo dữ liệu.
- **Nhập hàng:** mặc định hôm nay, vuốt dải ngày liên tục hai chiều hoặc mở lịch để chọn nhanh. Tổng số đơn vị mua và tổng tiền đặt trước danh sách phiếu gọn hai dòng; tìm/lọc được thu gọn. Thêm phiếu nhận ngày đang xem; sửa phiếu cũ tải theo đúng ngày. Hàng hóa mới hoặc có sẵn, nguồn tiền, chi phí tiệt trùng toàn bộ hoặc một phần.
- **Tính lương:** nhân sự và tỷ lệ chia, tạm tính/chốt tháng theo server, quỹ giữ lại, ghi nhận chi lương và lịch sử.
- **Chi phí:** thêm/sửa, trạng thái thanh toán, nguồn tiền, hạch toán và chi phí định kỳ. Khoản tiệt trùng liên kết phiếu nhập giữ các trường do server tính.
- **Chốt doanh thu:** danh sách bản chốt theo ngày mới nhất trước, nút Tạo ngày mới. Ngày mặc định hôm nay, có thể chọn ngày khác; chỉ nhập tiền mặt và chuyển khoản. App tự dùng mẻ sữa hợp lệ từ ngày chốt gần nhất, hoặc mẻ hợp lệ mới nhất khi chưa có lịch sử. Không yêu cầu số chai, số lượng sản phẩm hoặc ghi chú; backend tiếp tục ước tính doanh thu/giá vốn. Ngày đã chốt không bị ghi đè, lưu lỗi giữ nguyên số đang nhập. API trả tối đa 250 ngày gần nhất.

Nhập hàng dùng `/api/purchases?limit=500&from=YYYY-MM-DD&to=YYYY-MM-DD` với cùng ngày bắt đầu/kết thúc. Backend Snowmilk lọc theo ngày Việt Nam trước khi áp dụng giới hạn 500 phiếu, cần chạy cùng bản API có hỗ trợ `from`/`to`. Chi phí vẫn tải 500 bản ghi gần nhất. Cả hai hiển thị thông báo khi chạm giới hạn; tổng danh sách tính trên các bản ghi đã tải và bộ lọc đang chọn. Tổng số lượng nhập dùng số đơn vị mua, không cộng lẫn các lượng quy đổi như g/kg/lít. Báo cáo Dashboard do server tính cho toàn khoảng thời gian.

## So sánh tiền vào và tiền ra

Hai chỉ số được hiển thị riêng:

- Tỷ lệ tiền còn lại = `(tiền vào - tiền ra) / tiền vào × 100%`.
- Biên lợi nhuận ước tính = `lợi nhuận ước tính / doanh thu × 100%`, lấy số liệu giá vốn theo backend Snowmilk.

Mẫu số bằng 0 hiển thị dấu `—`. Nguồn tiền vốn vay/vốn chủ, chi phí chưa trả, giá vốn và tiền thực chi tiếp tục theo cách tính của Snowmilk.

## Nhập hàng từ ảnh bill (DeepSeek)

Trong tab **Nhập hàng**, chọn **Chụp bill để nhập hàng**, rồi chụp hoặc chọn ảnh. App gửi JPEG đã giảm kích thước tới `/api/purchases/scan` của Snowmilk; server dùng `deepseek-flash` đọc ngày, nhà cung cấp và từng mặt hàng, rồi đối chiếu danh mục. Không có API key DeepSeek trong app.

Kiểm tra ngày trên bill, hàng hóa, đơn vị mua, lượng quy đổi và thành tiền. Dòng không đọc rõ giữ trống; ngày thiếu hoặc không hợp lệ không được thay bằng hôm nay. Chọn nguồn tiền, xác nhận đã kiểm tra và lưu. Hàng chưa có trong danh mục cần chọn hàng tương ứng hoặc chọn **Tạo hàng mới từ bill** và kiểm tra quy cách. Bill tối đa 40 dòng; bill dài cần chia ảnh.

Server lưu toàn bộ bill qua `/api/purchases/import-receipt` trong một MongoDB transaction, dùng dấu vân tay ảnh để chống lưu trùng khi thử lại. Bản nháp được lưu riêng cho từng máy chủ bằng AsyncStorage; lỗi đọc/lưu giữ bản nháp. Ảnh nằm trong cache thiết bị; nếu hệ điều hành dọn ảnh cache, cần chọn ảnh lại. Sau khi lưu app mở đúng ngày nhập. Chi phí thuê tiệt trùng có thể bổ sung tại phiếu nhập riêng.

Backend tương ứng nằm ở `/Users/mac/Documents/MyProject/snowmilk`. Cấu hình `DEEPSEEK_API_KEY` và `DEEPSEEK_RECEIPT_MODEL=deepseek-flash` ở **server**, gồm môi trường Vercel nếu app dùng API đã deploy. Không dùng biến `EXPO_PUBLIC_` cho API key. MongoDB phải hỗ trợ transaction (replica set / Atlas). API đọc bill có giới hạn 6 lần/phút và 30 lần/giờ trên máy chủ.

Đã kiểm tra API DeepSeek thật bằng ảnh bill kiểm thử (không nhập giao dịch vào DB thật); ngày, hai mặt hàng và thành tiền đọc đúng. Kiểm thử MongoDB replica set riêng xác nhận lưu toàn bộ bill, hoàn tác và thử lại sau lỗi, chống trùng khi gửi đồng thời, hàng mới lặp lại và giới hạn đọc bill. Chưa kiểm tra camera trên iPhone/Android thật.

Đã kiểm tra giao diện web 390 × 844 với API production build và DB thử cục bộ: chọn ảnh → DeepSeek thật điền bill → chọn nguồn tiền → lỗi lưu có chủ đích → tải lại vẫn giữ bản nháp → thử lại lưu thành công → mở đúng ngày 30/09 với 2 phiếu, tổng 300.000 đồng. Bản build app export iOS/Android/web, typecheck và lint đều qua; 28 test app, 251 test backend và 6 test tích hợp riêng đều qua. React Doctor không có lỗi, còn 23 cảnh báo (đa số code có sẵn, hai cảnh báo độ phức tạp tại màn hình bill).

## Cấu trúc

```text
scripts/               scripts EAS giống cách tổ chức CMS
src/app/               Expo Router, 5 tab và các form modal
src/components/base/   ThemedText, ThemedView, DatePicker
src/components/ui/     các control dùng chung
src/components/molecules/
src/components/organisms/
src/features/          dashboard, purchases, payroll, expenses, sales và các form hàng hóa
src/api/               HTTP client, query và mutation
src/themes/            màu, font và scaling từ CMS
src/types/             DTO Snowmilk
src/utils/             định dạng, ngày và công thức
```

## Kiểm tra và build

```sh
bun run typecheck
bun run lint
bun run test
npx expo install --check
npx expo export --platform all --output-dir /tmp/snowmilk-mobile-export
```

Các script `build:ios`, `build:android`, `build:android:apk`, `build:android:aab` dùng EAS. Cần đăng nhập và liên kết project EAS riêng, cấu hình signing khi build; không dùng project ID hoặc tài khoản của CMS. Chưa tạo APK/IPA hoặc gửi lên store.

Sau khi nâng lên SDK 57.0.26: Expo Doctor qua 21/21 kiểm tra; typecheck, lint, 12 test (35 assertions) và export iOS/Android/web đã thành công. `overrides.react-native-screens` giữ một bản native đúng phiên bản Expo khuyến nghị; khi nâng SDK lần sau cần cập nhật override theo `expo/bundledNativeModules.json`.

React Doctor không báo lỗi; còn 23 cảnh báo về code có sẵn (độ phức tạp, render danh sách và animation). Hai cảnh báo HTTP là kiểm tra tĩnh: client có kiểm tra `response.ok` trước khi trả dữ liệu.

Đã kiểm tra trên trình duyệt ở viewport 390 × 844 với API thử dùng validator thật của Snowmilk: bottom tabs mặc định, Dashboard đã bỏ các khối trong ảnh, danh sách chốt ngày, trạng thái trống, tạo ngày mới, tổng tiền bằng 0, lưu lỗi giữ số đang nhập rồi thử lại thành công, chống chốt trùng ngày, và ngày chỉ nhận chuyển khoản. API thật chỉ được đọc; không tạo giao dịch thử trong DB thật. Chưa kiểm tra trực tiếp trên iPhone/Android.

## Giao diện cập nhật

Màu chủ đạo theo Snowmilk web: gradient `#328DA1 → #26798D`, accent `#287F96`. Bottom tabs dùng trực tiếp thanh mặc định của Expo Router, đã xoá `AnimatedTabBar`.
