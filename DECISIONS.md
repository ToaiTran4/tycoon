# Các quyết định thiết kế

- **M0:** Thư viện `daisyui` import ESM chuẩn (`import daisyui from 'daisyui'`).
- **M0:** Dotenv được bật ở backend; file `.env` trong `db/`, `be/`, `fe/` được sao chép từ `.env.example`.
- **M0:** Realtime adapter dùng `setIo`/`publish` với fallback no-op khi chưa gắn Socket.IO.
- **M1:** Sử dụng `rngFor` với seed cố định cho từng mục đích (dice, phase, event) để đảm bảo tính deterministic khi chốt quý.
- **M2:** Chu kỳ kinh tế được mô phỏng bằng xích Markov với các ràng buộc về độ tuổi pha và điều kiện nội sinh (lạm phát cao ép kết thúc pha tăng trưởng).
- **M3:** Bản đồ 6x6 với cơ chế tính giá đất dựa trên vị trí (Core/Mid/Edge) và bonus từ hàng xóm/cụm ngành.
- **M4:** Hệ thống xếp hạng tín dụng (A-D) ảnh hưởng trực tiếp đến hạn mức vay (D/E ratio) và lãi suất.
- **M5:** Triển khai 5 tính cách bot (Passive, Conservative, Aggressive, Balanced, Random) để kiểm tra cân bằng game. Bot Aggressive được điều chỉnh để có tỷ lệ phá sản ~65% qua 300 ván mô phỏng.
- **M6:** Sử dụng Prisma với PostgreSQL làm database chính. Lưu trữ toàn bộ trạng thái game (JSON) trong DB để dễ dàng khôi phục và đồng bộ.
- **M7:** Giao diện React SPA sử dụng Polling làm cơ chế dự phòng khi WebSocket gặp sự cố. Dùng Tailwind CSS để đảm bảo giao diện hiện đại và responsive.
- **M8:** Tích hợp Vercel AI SDK để tạo bản tin thị trường sinh động từ dữ liệu khô khan của engine. Cung cấp tính năng Cố vấn tài chính cho người chơi.
