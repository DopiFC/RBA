# HƯỚNG DẪN KẾT NỐI GOOGLE SHEET TRÊN IPAD & GITHUB PAGES

Bảng tính Google Sheet của bạn:
`https://docs.google.com/spreadsheets/d/13t07Qp8vM-znpW23_zqlw1lAAAV08j1gD-4hJCdvOQ0/edit?usp=sharing`

---

## 3 Bước Cực Kỳ Đơn Giản Trên Trình Duyệt Safari (iPad)

### Bước 1: Mở Apps Script từ Bảng tính của bạn
1. Mở link Google Sheet trên bằng trình duyệt Safari/Chrome trên iPad.
2. Trên thanh menu, chọn: **Tiện ích mở rộng (Extensions)** > **Apps Script**.
   *(Trình soạn thảo mã của Google sẽ mở ra trong một tab mới).*

### Bước 2: Dán mã nguồn `google-apps-script/Code.gs`
1. Xóa toàn bộ đoạn mã mặc định `function myFunction() {}` đang có trong trình soạn thảo.
2. Mở file `google-apps-script/Code.gs` trong kho mã nguồn của bạn, sao chép toàn bộ nội dung và dán vào Apps Script.
3. Nhấn vào biểu tượng **Đĩa mềm (Lưu / Save)**.

### Bước 3: Triển khai Ứng dụng Web (Web App)
1. Ở góc trên bên phải, nhấn nút **Triển khai (Deploy)** > chọn **Tùy chọn triển khai mới (New deployment)**.
2. Nhấn vào biểu tượng bánh răng bên cạnh dòng "Chọn loại" > chọn **Ứng dụng web (Web app)**.
3. Thiết lập 3 thông số:
   - **Mô tả (Description)**: `RBA Realtime Sync v2`
   - **Thực thi dưới dạng (Execute as)**: **Tôi (Me / nhgb2605@gmail.com)**
   - **Ai có quyền truy cập (Who has access)**: **Bất kỳ ai (Anyone)**  *(Rất quan trọng để mọi người làm khảo sát đều gửi được dữ liệu)*.
4. Nhấn **Triển khai (Deploy)**. Nếu Google yêu cầu ủy quyền, chọn tài khoản của bạn > chọn *Nâng cao (Advanced)* > chọn *Đi tới dự án (không an toàn)* > bấm *Cho phép (Allow)*.
5. Google sẽ cấp cho bạn một **URL Ứng dụng web (Web app URL)** dạng:
   `https://script.google.com/macros/s/AKfycb.../exec`

---

## Kết nối vào Trang Web trên GitHub Pages

Khi bạn đưa trang web lên GitHub:
1. Thêm biến môi trường `VITE_GOOGLE_APPS_SCRIPT_URL` với giá trị là đường link Web App bạn vừa copy ở Bước 3.
2. Hoặc tạo file `.env.production` chứa:
   ```env
   VITE_GOOGLE_APPS_SCRIPT_URL="https://script.google.com/macros/s/AKfycb.../exec"
   ```
3. Khi người dùng từ bất cứ đâu vào làm khảo sát:
   - Dữ liệu câu trả lời và điểm số tự động ghi tức thời vào link Google Sheet của bạn.
   - Mỗi email được kiểm tra tự động chỉ được khảo sát 1 lần.
   - Kết quả chẩn đoán tự động được gửi qua email cho người tham gia.
   - Người tham gia có thể bấm nút **Tải xuống PDF (.pdf)** ngay trên trang kết quả.
