# PantryChef 2.1 — PostgreSQL + giao diện lifestyle hiện đại

Ứng dụng full-stack tiếng Việt để quản lý nguyên liệu trong bếp, nhắc thực phẩm sắp hết hạn, gợi ý món ăn từ tồn kho và trừ kho khi xác nhận đã nấu.

## Công nghệ
- Node.js 20+ và Express
- PostgreSQL 16 (thư viện `pg`); không còn dùng SQLite
- HTML/CSS/JavaScript responsive, phong cách ẩm thực hiện đại: kem, olive, be và ảnh món ăn

## Tính năng
- Thêm, sửa, xóa nguyên liệu trong kho.
- Điều chỉnh số lượng bằng nút thêm/bớt.
- Trường dữ liệu: tên nguyên liệu, danh mục, số lượng, đơn vị, hạn sử dụng, thương hiệu, ghi chú và URL ảnh tùy chọn.
- Tìm kiếm theo tên, thương hiệu, ghi chú.
- Lọc theo danh mục, sắp hết hạn trong 3 ngày, quá hạn hoặc chưa nhập hạn.
- Gợi ý công thức, hiện nguyên liệu đã có/còn thiếu và các bước nấu.
- Xác nhận nấu có kiểm tra đủ nguyên liệu bắt buộc và trừ tồn kho trong transaction PostgreSQL.
- `/api/health` kiểm tra kết nối database.

## Chạy local
1. Cài Node.js 20+ và một PostgreSQL 16 đang chạy.
2. Sao chép `.env.example` thành `.env` và điền `DATABASE_URL` của database. Không commit `.env`.
3. Nếu nhà cung cấp yêu cầu TLS, đọc hướng dẫn của họ rồi đặt `PGSSL=true`. Cấu hình hiện tại dùng `rejectUnauthorized: false`; chỉ bật nếu tin cậy endpoint và nhà cung cấp yêu cầu kiểu kết nối này. Với môi trường production, ưu tiên xác minh chứng chỉ theo hướng dẫn của nhà cung cấp.
4. Cài dependencies: `npm install`.
5. Khởi tạo schema và dữ liệu mẫu: `npm run db:init` (hoặc chạy `npm start`; server cũng tự khởi tạo schema và seed dữ liệu khi bảng trống).
6. Chạy ứng dụng: `npm start`, sau đó mở `http://localhost:3000`.

## Cấu hình deploy
- Build/runtime: Node.js 20+; start command `npm start`.
- Cần một PostgreSQL database đã tạo và thông tin kết nối được đưa vào biến môi trường `DATABASE_URL`.
- `PORT` được đọc từ môi trường; server bind `0.0.0.0`.
- Tên biến, hostname, cổng, SSL mode và cách gắn secret phải khớp với thông tin thực tế VibeHost cung cấp. Chưa xác minh trực tiếp với phiên bản hiện tại của VibeHost; không giả định tự động rằng tên biến môi trường do nền tảng tạo ra sẽ giống nhau.
- Không đưa mật khẩu database lên GitHub. Giữ repository private nếu dự án yêu cầu.

## Lưu ý và giới hạn MVP
- Chưa có đăng nhập hoặc cách ly dữ liệu theo người dùng; API hiện dùng `local-user` chung. Không triển khai công khai cho nhiều người dùng cho tới khi bổ sung xác thực/phân quyền.
- Ảnh được lưu bằng URL công khai, không phải upload file. Nếu muốn tải ảnh trực tiếp, cần thêm dịch vụ lưu trữ object và kiểm tra loại/kích thước file.
- Có hai công thức mẫu; dữ liệu mẫu được chèn khi bảng công thức trống. Cần bổ sung thêm công thức thực tế để đáp ứng phạm vi sản phẩm lớn hơn.
- So khớp nguyên liệu dựa trên đơn vị giống hệt nhau; chưa tự quy đổi đơn vị.
- Cảnh báo hạn sử dụng chỉ hỗ trợ sắp xếp và nhắc nhở, không thay thế đánh giá an toàn thực phẩm.
- Trước khi dùng với dữ liệu thật, cần bổ sung xác thực, giới hạn tần suất, kiểm tra URL ảnh, logging/monitoring, backup và migration có quản lý.

## Kiểm tra
`npm test` đã chạy thành công 4 kiểm tra tự động về cấu hình PostgreSQL, trường giao diện và các route nghiệp vụ. Đây là kiểm tra cấu trúc mã nguồn, không thay thế kiểm thử tích hợp với PostgreSQL thật. Cần chạy thử trên môi trường có PostgreSQL và xác nhận kết nối thực tế trước khi coi bản deploy là đã kiểm thử.
