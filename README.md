# RBA — Hệ thống Khảo sát & Phân tích Kinh tế Vi mô Doanh nghiệp

Ứng dụng web phục vụ khảo sát thực trạng, chẩn đoán chỉ số vận hành và phân tích kinh tế vi mô dành cho **Doanh nghiệp, Hộ kinh doanh và Cá nhân tự kinh doanh** theo nguyên lý **Kinh tế học cho nhà quản trị**.

---

## I. Nền tảng Lý thuyết & Chuyên đề Nghiên cứu

Bộ công cụ được xây dựng dựa trên 8 tài liệu kinh tế học quản trị:
1. **Đại cương Kinh tế học cho nhà quản trị**: Ra quyết định trong điều kiện biến động và bất định.
2. **Cung, cầu và giá thị trường**: Hàm cầu, độ co giãn của cầu theo giá ($|E_d|$), tác động tới tổng doanh thu (TR).
3. **Lý thuyết sản xuất và chi phí**: Chi phí cố định (FC), chi phí biến đổi (VC), chi phí đơn vị, quy luật năng suất biên giảm dần và hiệu suất theo quy mô.
4. **Định giá trong thị trường cạnh tranh hoàn toàn**: Quyền lực định giá hạn chế, rủi ro sản phẩm đồng nhất.
5. **Định giá trong thị trường độc quyền**: Định giá dựa trên độ co giãn và mức sẵn lòng chi trả (WTP).
6. **Định giá trong thị trường cạnh tranh không hoàn toàn**: Khác biệt hóa sản phẩm, rào cản gia nhập.
7. **Lý thuyết trò chơi và thông tin bất cân xứng**: Thế cân bằng Nash, tương tác chiến lược, rủi ro người ủy nhiệm - đại diện (Principal-Agent), rủi ro đạo đức (Moral Hazard) và phát tín hiệu chất lượng (Signaling).
8. **Phát triển bền vững**: Mô hình cân bằng 3 trụ cột (Kinh tế - Xã hội - Môi trường).

---

## II. Cấu trúc Bộ Khảo sát & Quy tắc Tính điểm

Bộ công cụ gồm **15 câu hỏi chính thức**:
- **Nhóm A (Q1 – Q4)**: Dữ liệu phân nhóm mẫu nghiên cứu (loại hình, ngành nghề, thâm niên, quy mô lao động), **không tính điểm rủi ro**.
- **Chỉ báo chẩn đoán (Q5 – Q15)**: 11 chỉ báo tự đánh giá.
- **Quy đổi điểm**: Thang 1 đến 5 (1: Chú ý thấp -> 5: Chú ý rất cao).
- **Quy tắc tổ hợp Câu 10 (Định giá)**:
  - Chi phí thực tế + $\ge 1$ yếu tố thị trường $\to$ Điểm 1.
  - $\ge 2$ yếu tố thị trường (chưa có chi phí) $\to$ Điểm 2.
  - Chỉ có chi phí (Cost-plus) $\to$ Điểm 3.
  - Chỉ 1 yếu tố thị trường đơn lẻ $\to$ Điểm 4.
  - Cảm tính / Chưa có phương pháp $\to$ Điểm 5.
- **Chuẩn hóa chỉ số (0–100)**:
  $$\text{Chỉ số Câu hỏi} = \frac{\text{Điểm} - 1}{4} \times 100$$
- **5 Nhóm chỉ báo**:
  1. *Nhu cầu & Thị trường*: Q5, Q6, Q11, Q12.
  2. *Nguồn cung & Vận hành*: Q7, Q8, Q9.
  3. *Phương pháp định giá*: Q10.
  4. *Thông tin & Quản trị*: Q13, Q14.
  5. *Phát triển bền vững*: Q15.
- **Quy tắc ngưỡng tối thiểu**: Cần tối thiểu **8/11 câu hợp lệ** để kết luận Chỉ số Chú ý Tổng thể. Dữ liệu thiếu ("Chưa theo dõi") phản ánh lỗ hổng quản trị, không tự động quy chụp thành nguy cơ phá sản.

---

## III. Kiến trúc Kỹ thuật

```
├── src/
│   ├── config/
│   │   └── survey.ts          # 15 câu hỏi, phương án, tham chiếu lý thuyết
│   ├── types/
│   │   └── survey.ts          # Định nghĩa TypeScript toàn diện
│   ├── lib/
│   │   ├── scoring.ts         # Module tính điểm, phân loại và chuẩn hóa
│   │   ├── scoring.test.ts    # Unit test Node.js cho logic tính điểm
│   │   └── reportEngine.ts    # Bộ sinh báo cáo 6 phần & 3 kịch bản
│   ├── components/
│   │   ├── common/            # Navbar, Footer
│   │   ├── home/              # Trang giới thiệu, mục tiêu, đối tượng
│   │   ├── consent/           # Kiểm tra email & đồng thuận nghiên cứu
│   │   ├── survey/            # Trình hướng dẫn 6 bước & trang xác nhận
│   │   ├── dashboard/         # Biểu đồ thanh & Biểu đồ Radar SVG
│   │   ├── report/            # Báo cáo chẩn đoán chuyên sâu & In PDF
│   │   ├── feedback/          # Biểu mẫu góp ý sau báo cáo
│   │   └── admin/             # Cổng quản trị nghiên cứu & xuất CSV
│   └── App.tsx                # Quản lý luồng trạng thái ứng dụng
├── server/
│   ├── googleSheets.ts        # Service kết nối Google Sheets API với 4 tab
│   └── dataStore.ts           # Quản lý dữ liệu, kiểm tra quyền & ẩn danh (n < 5)
├── server.ts                  # Máy chủ Express tích hợp Vite middleware
├── SETUP.md                   # Hướng dẫn kết nối Google Sheets từng bước
└── package.json               # Dependencies & scripts
```

---

## IV. Kiểm thử & Chạy ứng dụng

### 1. Chạy Unit Test Logic Tính điểm
```bash
npx --yes tsx --test src/lib/scoring.test.ts
```

### 2. Khởi động Ứng dụng
```bash
npm run dev
```
Ứng dụng sẽ chạy tại `http://localhost:3000`. Người dùng hoàn thành khảo sát sẽ nhận báo cáo chẩn đoán, xuất PDF và dữ liệu được đồng bộ trực tiếp về Google Sheets.
