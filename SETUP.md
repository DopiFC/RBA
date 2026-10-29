# HƯỚNG DẪN CẤU HÌNH GOOGLE SHEETS & MÔI TRƯỜNG CHO HỆ THỐNG RBA

Tài liệu này hướng dẫn chi tiết từng bước để kết nối ứng dụng **RBA (Khảo sát & Chẩn đoán Kinh tế Doanh nghiệp)** với Google Spreadsheet thực tế của bạn phục vụ lưu trữ dữ liệu nghiên cứu khoa học.

---

## 1. Nguyên tắc An toàn & Bảo mật Dữ liệu

1. **Không bao giờ đưa Private Key hay Token vào Frontend**: Toàn bộ việc kết nối Google Sheets API được thực hiện thông qua máy chủ Node.js (`server/googleSheets.ts`).
2. **Cách ly Dữ liệu Liên hệ (Data Segregation)**:
   - Sheet `SurveyResponses`: Lưu mã `response_id` cùng toàn bộ câu trả lời, điểm số, và chỉ số chuẩn hóa. Không chứa email.
   - Sheet `RespondentContacts`: Lưu `response_id`, email, thời điểm đồng thuận và quyền liên hệ. Sheet này được phân quyền hạn chế riêng biệt.
   - Sheet `SurveyFeedback`: Lưu các đánh giá mức độ hữu ích, độ phù hợp thực tế và ưu tiên 12 tháng liên kết theo `response_id`.
   - Sheet `StudyMetadata`: Lưu codebook nghiên cứu, giải thích biến, thang đo và phiên bản công cụ.
3. **Cơ chế Chống ghi trùng (Idempotency)**: Mỗi lần gửi được gán một mã `response_id` duy nhất. Nếu đường truyền mạng chập chờn và người dùng nhấn "Thử lại", hệ thống sẽ không ghi trùng lặp một dòng mới.

---

## 2. Các bước cấu hình Google Cloud & Service Account

### Bước 2.1: Tạo Project trên Google Cloud Console
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Đăng nhập bằng tài khoản Google của bạn và tạo một Project mới (Ví dụ: `RBA-Research-2026`).

### Bước 2.2: Bật Google Sheets API
1. Trong thanh tìm kiếm của Google Cloud Console, gõ **Google Sheets API**.
2. Nhấn chọn **Google Sheets API** và bấm **ENABLE** (Bật API).

### Bước 2.3: Tạo Service Account (Tài khoản dịch vụ)
1. Trong menu bên trái, vào **APIs & Services** > **Credentials** (Thông tin xác thực).
2. Nhấn **Create Credentials** > chọn **Service Account**.
3. Điền thông tin:
   - **Service account name**: `rba-sheets-writer`
   - Nhấn **Create and Continue**.
4. Phân quyền (Role): Chọn **Project** > **Editor** hoặc để trống (vì chúng ta sẽ cấp quyền trực tiếp trên file Spreadsheet).
5. Nhấn **Done**.

### Bước 2.4: Tạo Khóa riêng tư (Private Key JSON)
1. Trong danh sách Service Accounts vừa tạo, nhấp vào email của Service Account (dạng: `rba-sheets-writer@project-name.iam.gserviceaccount.com`).
2. Chuyển sang tab **Keys** > nhấn **Add Key** > **Create new key**.
3. Chọn định dạng **JSON** và bấm **Create**.
4. Một file `.json` sẽ được tải về máy tính của bạn. Mở file này bằng trình soạn thảo văn bản (Notepad/VSCode). Bạn sẽ thấy hai trường quan trọng:
   - `client_email`: Địa chỉ email của Service Account.
   - `private_key`: Khóa bí mật bắt đầu bằng `-----BEGIN PRIVATE KEY-----\n...`.

---

## 3. Tạo & Cấp quyền trên Google Spreadsheet

1. Truy cập [Google Sheets](https://sheets.google.com/) và tạo một Spreadsheet mới (Ví dụ đặt tên: `RBA_Research_Database_2026`).
2. Sao chép **Spreadsheet ID** từ thanh địa chỉ trình duyệt:
   - URL có dạng: `https://docs.google.com/spreadsheets/d/`**`1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`**`/edit`
   - Chuỗi ký tự ở giữa `/d/` và `/edit` chính là `GOOGLE_SHEETS_SPREADSHEET_ID`.
3. Nhấn nút **Chia sẻ (Share)** ở góc trên bên phải Google Sheet:
   - Dán địa chỉ `client_email` của Service Account (ở Bước 2.4) vào ô chia sẻ.
   - Chọn quyền **Người chỉnh sửa (Editor)**.
   - Bỏ chọn "Thông báo cho mọi người" và nhấn **Chia sẻ**.
4. Tạo sẵn 4 Sheet (Tab) với tên chính xác như sau:
   - `SurveyResponses`
   - `RespondentContacts`
   - `SurveyFeedback`
   - `StudyMetadata`

---

## 4. Nhập Biến Môi trường (Environment Variables)

Thêm các biến môi trường sau vào file `.env` hoặc cấu hình Environment Secrets trên server:

```env
# ID Spreadsheet bạn vừa tạo
GOOGLE_SHEETS_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms

# Email của Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=rba-sheets-writer@project-name.iam.gserviceaccount.com

# Private Key (Sao chép nguyên văn cả dấu ngoặc kép và \n)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# Email quản trị viên có quyền đăng nhập vào Cổng Quản trị Nghiên cứu (phân cách bởi dấu phẩy)
ADMIN_EMAILS=nhgb2605@gmail.com,admin@rba.edu.vn

# Mật khẩu quản trị viên
ADMIN_SECRET_KEY=rba_science_admin_2026
```

> **Lưu ý về Private Key có ký tự xuống dòng:**
> Hệ thống tại `server/googleSheets.ts` đã được tích hợp sẵn hàm tự động xử lý chuỗi:
> `privateKey = privateKey.replace(/\\n/g, '\n');`
> Do đó bạn có thể dán trực tiếp chuỗi Private Key từ file JSON mà không sợ lỗi định dạng.

---

## 5. Chế độ Staging / Máy chủ Cục bộ (Khi chưa cấu hình Google Sheets)

Nếu bạn chưa kịp cấu hình Service Account:
- Ứng dụng vẫn hoạt động bình thường trên máy chủ Node.js của Google AI Studio.
- Khi người tham gia nộp bài, hệ thống lưu trữ toàn diện vào bộ nhớ máy chủ an toàn với cấu trúc chuẩn 4 bảng.
- Giao diện người dùng sẽ hiển thị nhãn: **"Máy chủ lưu trữ an toàn (Chế độ Staging)"**, minh bạch rõ ràng không tạo cảm giác giả mạo kết nối.
- Khi bạn hoàn thành việc nhập các biến môi trường ở mục 4, hệ thống sẽ tự động chuyển sang đồng bộ trực tiếp hai chiều với Google Sheets mà không cần viết lại mã nguồn.
