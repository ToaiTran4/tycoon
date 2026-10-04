# Tycoon Kinh Tế (Chest)

Engine mô phỏng kinh tế và trò chơi chiến thuật kinh doanh theo lượt.

## Công nghệ sử dụng
- **Backend:** Node.js, Express, Prisma, PostgreSQL, Socket.IO, Zod, Vitest.
- **Frontend:** React, Vite, Tailwind CSS, daisyUI, Recharts.
- **Engine:** Logic tài chính (Sổ cái, Bảng cân đối, Thuế, Lãi suất), Kinh tế vĩ mô (Chu kỳ, Lạm phát, Cung-Cầu).
- **AI:** Claude (Anthropic) via Vercel AI SDK cho bản tin và cố vấn.

## Cấu trúc dự án
- `be/`: Mã nguồn backend và engine kinh tế.
- `fe/`: Mã nguồn frontend (React).
- `db/`: Cấu hình database và Prisma schema.

## Hướng dẫn cài đặt

### 1. Yêu cầu hệ thống
- Node.js 18+
- Docker & Docker Compose (để chạy PostgreSQL)

### 2. Thiết lập Database
```bash
cd db
docker-compose up -d
npm install
npm run migrate
```

### 3. Thiết lập Backend
```bash
cd be
npm install
cp .env.example .env
# Chỉnh sửa .env với DATABASE_URL và ANTHROPIC_API_KEY nếu có
npm run dev
```

### 4. Thiết lập Frontend
```bash
cd fe
npm install
npm run dev
```

## Cách chơi
1. Truy cập `http://localhost:5173`.
2. Tạo phòng game mới với tên của bạn.
3. Chia sẻ mã phòng cho bạn bè.
4. Thực hiện các hành động: đấu giá đất, xây dựng doanh nghiệp, vay vốn ngân hàng, phát hành trái phiếu...
5. Chốt quý và theo dõi biến động thị trường qua bản tin AI.

## Kiểm tra
- Chạy toàn bộ test: `npm test`
- Chạy mô phỏng cân bằng bot: `node be/scripts/simulate.js 300`
- Chạy lint: `npm run lint`
