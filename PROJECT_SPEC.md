# Tycoon Kinh Tế — Đặc tả dự án (bản chốt v1)

> Tài liệu này là **nguồn sự thật duy nhất**. Đọc toàn bộ trước khi viết code. Mọi con số cân bằng là giá trị khởi đầu, được phép tinh chỉnh trong `config.js` theo mục 14.

---

## 0. Chỉ dẫn cho AI lập trình (TRAE)

1. Làm tuần tự theo milestone ở mục 16 (M0 → M9, M10 tùy chọn). Xong mỗi milestone phải chạy `npm run lint && npm test` pass rồi mới sang milestone sau.
2. **Không hỏi lại người dùng.** Chỗ nào mơ hồ: chọn phương án đơn giản nhất, nhất quán với tài liệu, ghi 1–2 dòng vào `DECISIONS.md`.
3. Quy tắc cứng:
   - **Chỉ dùng JavaScript (ES modules, Node 20+). KHÔNG dùng TypeScript**: không file đuôi `ts`/`tsx`, không `tsconfig`. Cần mô tả kiểu dữ liệu thì dùng JSDoc `@typedef` trong `types.js`. Người dùng là người mới học: viết hàm nhỏ, tên rõ ràng, comment tiếng Việt ngắn ở các chỗ công thức kinh tế.
   - Tiền là **số nguyên, đơn vị triệu đồng** (1 tỷ = 1.000). Làm tròn `Math.round` tại thời điểm ghi sổ. Không dùng số thực cho số dư.
   - **Ưu tiên import thư viện phổ biến, không tự viết lại thứ đã có** (danh sách ở mục 2.3). Chỉ tự viết logic game cốt lõi (kế toán, kinh tế, luật chơi).
   - `be/src/engine` không import `express`, `react`, `prisma` và không đụng I/O, nhưng được dùng thư viện tiện ích. Không dùng `Math.random`, `Date.now`, `new Date()`; ngẫu nhiên chỉ qua `rng` có seed (mục 3.4).
   - Mọi hằng số/tham số cân bằng nằm trong `be/src/engine/config.js`.
   - Mọi bút toán đi qua `ledger.post()`; hàm này kiểm tra Nợ = Có và ném lỗi nếu lệch.
   - **Có WebSocket** (Socket.IO, mục 3.5) và **có LLM** (thư viện `ai` + Claude, mục 3.6). Cả hai phải có phương án dự phòng: mất WebSocket thì polling, LLM lỗi hoặc thiếu key thì dùng template. Không OAuth.
   - **Không dùng Vercel, serverless hay Docker cho ứng dụng.** App chạy trực tiếp trên máy người dùng bằng Node (`npm start`); chỉ database PostgreSQL có thể chạy bằng Docker (mục 15).
   - Mọi input API validate bằng Zod. Server là nguồn sự thật; client không tự tính kết quả (xem trước hành động gọi API `preview`).
   - Giao diện tiếng Việt; code, tên biến tiếng Anh.
4. Khi xong, `README.md` phải có: cách chạy local, cách mở link cho bạn bè (mục 15), cách chạy mô phỏng.

---

## 1. Tổng quan sản phẩm

Game kinh doanh theo lượt (mỗi lượt = 1 quý), 2–6 người chơi, mặc định 20 quý (~45–60 phút). Mỗi người điều hành một công ty, khởi đầu **10 tỷ đồng tiền mặt**, mua đất, đầu tư vào ngành, thuê nhân công, vay ngân hàng, phát hành trái phiếu/cổ phiếu. Nền kinh tế (người dân, ngân hàng, nhà đầu tư, chính phủ, ngân hàng trung ương) phản ứng theo công thức và phản hồi lại quyết định của người chơi. **Không có ô bàn cờ để đi và không có "trả tiền khi đi vào ô người khác".**

Thắng: tài sản ròng (vốn chủ) cao nhất khi kết thúc. **Phá sản = thua (bị loại).**

### 1.1 Các vai trò trong game

| Vai trò | Làm gì | Cách chạy |
|---|---|---|
| Người chơi | Quyết định đầu tư, vay, thuê, phát hành | Con người |
| Người dân (hộ gia đình) | Đi làm, nhận lương, tiêu dùng, gửi tiết kiệm; quyết định cầu từng ngành | Công thức |
| Nhà đầu tư | Mua trái phiếu, cổ phiếu do người chơi phát hành, dựa trên báo cáo tài chính | Công thức + quy tắc chấm điểm |
| Ngân hàng thương mại | Nhận tiền gửi, cho vay trong room tín dụng, thu hồi nợ | Quy tắc |
| Ngân hàng trung ương | Đặt lãi suất cơ bản, đặt room tín dụng | Quy tắc kiểu Taylor đơn giản |
| Chính phủ | Thu thuế lũy tiến, thuế đất trống, chi kích cầu | Quy tắc |
| Kế toán | Ghi sổ kép mọi giao dịch, chốt báo cáo mỗi quý | Code thuần, không ngẫu nhiên |

### 1.2 Khái niệm kinh tế được dạy qua gameplay

Chu kỳ kinh tế, lạm phát (cầu kéo / chi phí đẩy), lãi suất, room tín dụng, đòn bẩy, tiền gửi vs. vay, cung–cầu theo ngành, thất nghiệp và lương, đa dạng hóa, thuế lũy tiến, chi phí cơ hội, xếp hạng tín nhiệm, pha loãng cổ phần, tài sản đảm bảo. Mỗi khái niệm có mục giải thích (`glossary.js`, hiển thị dạng tooltip).

---

## 2. Công nghệ (đã chốt)

**Mô hình chạy:** ứng dụng chạy trên máy của bạn. Một lệnh `npm start` chạy Express phục vụ cả API, WebSocket và giao diện React đã build, tất cả trên một cổng (3000). Bạn mở link công khai cho bạn bè bằng Cloudflare Tunnel (hoặc ngrok), chỉ cần **một link** là bạn bè chơi được.

| Lớp | Công nghệ |
|---|---|
| Ngôn ngữ | JavaScript (ES modules), Node.js 20+ — không TypeScript |
| Cấu trúc | **Ba thư mục tách riêng**, mỗi thư mục có `package.json` riêng, gộp bằng npm workspaces: `db/` (cơ sở dữ liệu), `be/` (backend), `fe/` (frontend) |
| Backend | Express |
| Realtime | Socket.IO (WebSocket): `socket.io` (server), `socket.io-client` (client), chạy chung HTTP server với Express |
| Database | PostgreSQL 16 (cài trực tiếp, hoặc chạy bằng Docker chỉ cho DB) |
| ORM | Prisma (client JavaScript), nằm trong thư mục `db/` |
| Validation | Zod |
| Frontend | React 19 + Vite + React Router |
| UI | Tailwind CSS + daisyUI (thành phần dựng sẵn bằng class), lucide-react |
| Biểu đồ | Recharts |
| Gọi dữ liệu | `fetch` + hook `useGame` (viết nhỏ gọn) |
| LLM (tùy chọn) | Thư viện `ai` (Vercel AI SDK, chỉ là package npm) + `@ai-sdk/anthropic` + Zod, Claude Haiku; chỉ bật khi có `ANTHROPIC_API_KEY` |
| Test | Vitest |
| Công cụ | npm, nodemon, concurrently, ESLint, Prettier |
| Chia sẻ cho bạn bè | Cloudflare Tunnel (`cloudflared`) hoặc ngrok |

Chọn phiên bản ổn định mới nhất của từng gói; không dùng gói đã deprecated.

### 2.1 Cấu trúc thư mục

```
.
├─ PROJECT_SPEC.md  DECISIONS.md  README.md  .gitignore
├─ package.json                         # chỉ khai báo workspaces ["db","be","fe"] và các lệnh gộp
│
├─ db/                                  # DATABASE: schema, migration, kết nối, PostgreSQL
│  ├─ package.json                      # tên "@tycoon/db"
│  ├─ .env.example                      # DATABASE_URL (Prisma CLI dùng khi migrate)
│  ├─ docker-compose.yml                # service PostgreSQL 16 (tùy chọn)
│  ├─ backup.sh                         # pg_dump
│  ├─ prisma/ schema.prisma  migrations/
│  └─ index.js                          # export { prisma } (một PrismaClient dùng chung)
│
├─ be/                                  # BACKEND
│  ├─ package.json                      # tên "@tycoon/be", phụ thuộc "@tycoon/db"
│  ├─ .env.example
│  ├─ index.js                          # Express + Socket.IO (+ phục vụ fe/dist khi production)
│  ├─ scripts/ simulate.js smoke.js
│  └─ src/
│     ├─ engine/                        # thuần, test được, không phụ thuộc express/react/prisma
│     │  ├─ config.js types.js rng.js money.js accounts.js ledger.js statements.js
│     │  ├─ map.js business.js actions.js validate.js preview.js
│     │  ├─ init.js resolve.js bankruptcy.js explain.js glossary.js
│     │  ├─ market/ macro.js cycle.js events.js sectors.js households.js
│     │  │          centralBank.js bank.js government.js investors.js rating.js
│     │  └─ __tests__/
│     ├─ routes/ games.js
│     └─ services/ auth.js gameService.js view.js realtime.js scheduler.js llm.js advisor.js
│
└─ fe/                                  # FRONTEND
   ├─ package.json                      # tên "@tycoon/fe"
   ├─ .env.example                      # VITE_API_URL (để trống = cùng origin)
   ├─ vite.config.js  index.html
   └─ src/ main.jsx App.jsx
           pages/ Home.jsx Game.jsx Rules.jsx
           components/ ...
           lib/ format.js useGame.js api.js vi.js
```

Các lệnh chạy từ **thư mục gốc** (mỗi lệnh gọi sang workspace tương ứng):

| Lệnh | Việc |
|---|---|
| `npm install` | Cài mọi gói của `db`, `be`, `fe` (db tự chạy `prisma generate` sau khi cài) |
| `npm run db:up` / `npm run db:down` | Bật / tắt PostgreSQL bằng `db/docker-compose.yml` (bỏ qua nếu đã cài Postgres) |
| `npm run db:migrate` | `prisma migrate dev` (trong `db/`) |
| `npm run db:deploy` | `prisma migrate deploy` (trong `db/`) |
| `npm run dev` | Chạy song song `be` (nodemon, cổng 3000) và `fe` (Vite, cổng 5173, proxy `/api` và `/socket.io` sang 3000) |
| `npm run build` | `prisma generate` + `vite build` (ra `fe/dist`) |
| `npm start` | Chạy `be`; ở chế độ production `be` phục vụ luôn `fe/dist` |
| `npm test` / `npm run lint` | Vitest / ESLint cho cả ba workspace |
| `npm run sim` / `npm run smoke -- <url>` | Mô phỏng cân bằng / kiểm tra khói (`be/scripts`, mục 14) |

### 2.2 Biến môi trường (mỗi thư mục có `.env.example` riêng)

`db/.env.example`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tycoon
```

`be/.env.example`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tycoon
PORT=3000
NODE_ENV=development
SERVE_FE=true              # production: be phục vụ fe/dist để chỉ cần một link
FE_DIST=../fe/dist
CORS_ORIGIN=               # để trống = cùng origin; nếu fe chạy ở địa chỉ khác thì điền, nhiều địa chỉ cách nhau dấu phẩy
ANTHROPIC_API_KEY=         # để trống = tắt LLM, dùng template
LLM_MODEL=claude-haiku-4-5-20251001
LLM_EVENTS=false           # true = cho LLM đề xuất sự kiện flavor (mục 3.6)
LLM_MAX_CALLS_PER_GAME=30
```

`fe/.env.example`:

```
VITE_API_URL=              # để trống = gọi cùng origin; nếu be ở địa chỉ khác thì điền, ví dụ https://xxxx.trycloudflare.com
```

### 2.3 Thư viện nên dùng (import, không tự viết)

| Việc | Thư viện |
|---|---|
| PRNG có seed | `seedrandom` |
| Phân phối chuẩn | `d3-random` (`randomNormal.source(rng)`) |
| Cập nhật state bất biến trong engine | `immer` |
| Validate | `zod` |
| Tiện ích mảng/số | `lodash-es` |
| Sinh mã phòng | `nanoid` (`customAlphabet`) |
| Ngày giờ, đếm ngược | `date-fns` |
| Property-based test | `fast-check` |
| State cục bộ UI (hành động đang soạn) | `zustand` |
| Form | `react-hook-form` + `@hookform/resolvers` |
| Bảng sổ cái | `@tanstack/react-table` |
| Toast, animation xúc xắc | `sonner`, `framer-motion` |
| Class CSS | `clsx` |
| Realtime | `socket.io`, `socket.io-client` |
| LLM | `ai`, `@ai-sdk/anthropic` |
| Chạy dev | `nodemon`, `concurrently` |

### 2.4 Quy tắc phân tách ba thư mục

- **`fe`** chỉ nói chuyện với `be` qua HTTP và WebSocket theo mục 11. Không import code từ `be` hay `db`.
- **`be`** chỉ truy cập database qua `@tycoon/db` (`import { prisma } from '@tycoon/db'`). Không tự tạo `PrismaClient` ở nơi khác. Ngoài Prisma client, chỉ dùng `$queryRaw` cho câu khóa dòng ở mục 3.2.
- **`db`** là nơi duy nhất định nghĩa schema và migration; không import code của `be` hay `fe`.
- Engine (`be/src/engine`) thuần, không biết Express, Socket.IO hay Prisma; tầng `services` mới nối engine với DB và realtime.

---

## 3. Kiến trúc

### 3.1 Nguyên tắc

- **Engine thuần** nhận `(state, hành động của tất cả người chơi)` và trả `(state mới, bút toán, báo cáo, kết quả hành động)`. Cùng seed + cùng hành động → cùng kết quả.
- **Server:** một process Node chạy liên tục (`be/index.js`) gồm Express (API) + Socket.IO. Route nạp state từ DB, gọi engine, lưu kết quả trong một transaction.
- **Realtime = WebSocket làm "chuông báo", GET làm nguồn dữ liệu** (mục 3.5). Mỗi lần state đổi, server publish `{ version }` qua Socket.IO; client nhận thì gọi `GET /api/games/:code?v=<version>` (kèm token) để lấy view riêng của mình. Dữ liệu nhạy cảm không đi qua WebSocket. Mất kết nối WebSocket thì client tự polling 3 giây. Nếu `version` không đổi, server trả `{ unchanged: true }`.
- **Hạn chót lượt (tùy chọn):** `scheduler.js` đặt `setTimeout` cho từng game đến `deadlineAt` để tự chốt quý (3.3). Ngoài ra mỗi request `GET` vẫn kiểm tra `deadlineAt` như phương án dự phòng.
- **Chốt quý** diễn ra khi: tất cả người chơi `active` bấm "Xong lượt", hoặc chủ phòng bấm "Chốt quý ngay", hoặc quá hạn.

### 3.2 Chống xung đột

Chốt quý chạy trong `prisma.$transaction` (`prisma` import từ `@tycoon/db`) (timeout 20s) với `SELECT ... FOR UPDATE` trên dòng `Game` (dùng `tx.$queryRaw`). Trong transaction: kiểm tra `phase = 'action'` và `quarter` khớp; nếu không thì trả kết quả hiện tại (idempotent, không chốt lần hai). `Game.version` tăng 1 mỗi lần state thay đổi (kể cả khi ai đó bấm sẵn sàng hoặc gửi hành động).

### 3.3 Chạy trên máy của bạn

- Process chạy liên tục nên không có giới hạn thời gian; engine chốt quý dưới 300 ms.
- `scheduler.js`: lưu `Map` từ gameId sang timer. Khi bắt đầu quý có hạn chót thì đặt timer; khi chốt quý thì hủy và đặt lại cho quý sau. **Khi server khởi động**, quét các game `phase='action'` có `deadlineAt` và dựng lại timer (quá hạn thì chốt ngay). Timer gọi cùng hàm chốt quý có khóa ở 3.2 nên không chốt hai lần.
- Chỉ chạy **một instance** (phòng Socket.IO nằm trong bộ nhớ).
- Mặc định giao diện, API và WebSocket cùng origin (`be` phục vụ `fe/dist`) nên không cần CORS. Khi dev, Vite proxy `/api` và `/socket.io` sang cổng 3000 nên cũng không cần CORS.
- Nếu muốn đặt `fe` ở địa chỉ khác `be`: điền `CORS_ORIGIN` trong `be/.env` (bật `cors` cho Express và Socket.IO) và `VITE_API_URL` trong `fe/.env` (cả `fetch` lẫn Socket.IO đều dùng địa chỉ này).
- Chia sẻ cho bạn bè: tunnel trỏ vào cổng 3000 (mục 15). Không dùng Vite dev server để cho bạn bè chơi.

### 3.4 RNG có seed

`Game.seed` sinh ngẫu nhiên khi tạo phòng. Dùng `seedrandom` cho PRNG và `d3-random` cho phân phối chuẩn, không tự cài thuật toán ngẫu nhiên. Mỗi mục đích dùng một luồng riêng để thứ tự gọi không ảnh hưởng nhau:

```js
// be/src/engine/rng.js
import seedrandom from 'seedrandom';
import { randomNormal } from 'd3-random';

export function rngFor(seed, purpose, quarter) {
  const prng = seedrandom(`${seed}|${purpose}|${quarter}`);
  return {
    next: () => prng(),                                   // [0,1)
    int: (min, max) => Math.floor(prng() * (max - min + 1)) + min,   // gồm cả hai đầu
    normal: (mean, sd) => randomNormal.source(prng)(mean, sd)(),
    pick: (items) => { /* items: [{ value, weight }], chọn theo trọng số */ },
    shuffle: (arr) => { /* trả mảng mới đã xáo bằng prng */ },
  };
}
```

Các `purpose`: `dice`, `phase`, `event`, `macroNoise`, `ties`, `claims`.

### 3.5 Realtime (WebSocket bằng Socket.IO)

`be/index.js` tạo một HTTP server dùng chung cho Express và Socket.IO, cùng một cổng:

```js
const app = express();
if (process.env.CORS_ORIGIN) app.use(cors({ origin: process.env.CORS_ORIGIN.split(',') }));
app.use(express.json());
app.use('/api', apiRouter);
if (process.env.NODE_ENV === 'production' && process.env.SERVE_FE !== 'false') {
  app.use(express.static(feDist));        // feDist = đường dẫn tới fe/dist (env FE_DIST)
  // mọi đường dẫn khác (không phải /api, /socket.io) trả index.html cho React Router
  // dùng đúng cú pháp route của phiên bản Express đã cài
}
const httpServer = createServer(app);
const io = new Server(httpServer, {
  path: '/socket.io',
  cors: process.env.CORS_ORIGIN ? { origin: process.env.CORS_ORIGIN.split(',') } : undefined,
});
io.on('connection', (socket) => {
  socket.on('join', (code) => {
    if (/^[A-HJ-NP-Z2-9]{6}$/.test(code)) socket.join(`game-${code}`);
  });
});
setIo(io);                       // realtime.js giữ tham chiếu để route gọi publish()
await scheduler.boot();
httpServer.listen(Number(process.env.PORT ?? 3000), '0.0.0.0');
```

`realtime.js` xuất `publish(code, event, payload)`: nếu chưa có `io` (khi chạy test hoặc mô phỏng) thì không làm gì.

- Phòng `game-{code}`; payload không nhạy cảm.
- Sự kiện: `version` `{ version }` (phát sau mỗi lần `version++`: vào phòng, ready, chốt quý, bản tin LLM xong); `dice` `{ quarter, a, b }` (cả phòng cùng xem hiệu ứng xúc xắc).
- Client (`fe`) dùng `socket.io-client` kết nối tới `VITE_API_URL` (mặc định cùng origin), tự reconnect, nhận `version` lớn hơn bản đang có thì refetch. Polling dự phòng 15 giây khi socket kết nối, 3 giây khi mất kết nối.

### 3.6 LLM (Claude qua thư viện `ai`)

**Nguyên tắc:** engine tính toàn bộ số liệu; LLM chỉ viết lời và đề xuất sự kiện trong khung; kết quả LLM không bao giờ trực tiếp sửa số dư hay macro.

1. **Bản tin & lời các vai trò** (1 lần gọi/quý/ván, `generateObject` với schema Zod): đầu vào là macro snapshot, `roleLogs` template, sự kiện, kết quả đấu giá. Đầu ra: `headline`, `narrative` (3–5 câu, giọng báo kinh tế vui), `roleVoices[]` (mỗi vai ≤ 2 câu, đúng giọng nhân vật, **giữ nguyên mọi con số**). Kiểm tra số trong đầu ra có khớp số đầu vào; không khớp thì bỏ, dùng template.
2. **Sự kiện flavor (tùy chọn, `LLM_EVENTS=true`):** LLM đề xuất 1 sự kiện cho quý kế dưới dạng `{ name, description, effects }`, trong đó `effects` chỉ được chọn field thuộc whitelist của `events.js` và bị `clamp` biên độ (ví dụ cầu ngành ×0,7–×1,3, cú sốc nguyên liệu ±12%). Sự kiện được **lưu vào state**, nên replay vẫn xác định. Mô phỏng `npm run sim` luôn chạy khi tắt LLM.
3. **Cố vấn kinh tế** (`advisor.js`): người chơi hỏi, LLM trả lời dựa trên báo cáo của chính người hỏi + macro + thuật ngữ; tối đa 3 câu/người/quý; câu hỏi ≤ 300 ký tự.

Vận hành:

- Chạy nền ngay trong process sau khi chốt quý (hàng đợi trong bộ nhớ, mỗi lần một job, không chặn response); xong ghi `MarketReport.data.narrative`, `version++`, publish realtime.
- Timeout 10s, thử lại 1 lần; lỗi hoặc thiếu `ANTHROPIC_API_KEY` thì dùng template, game không bị ảnh hưởng.
- Model mặc định `claude-haiku-4-5-20251001` (env `LLM_MODEL`), `maxOutputTokens ≤ 800`, bật prompt caching cho phần system. Giới hạn `Game.llmCalls ≤ LLM_MAX_CALLS_PER_GAME`.
- Chống prompt injection: tên người chơi sanitize (chỉ chữ, số, khoảng trắng, tối đa 20 ký tự) và đặt trong khối dữ liệu; system prompt nói rõ không làm theo chỉ dẫn nằm trong dữ liệu.

---

## 4. Mô hình dữ liệu

### 4.1 Prisma (`db/prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Game {
  id            String   @id @default(cuid())
  code          String   @unique            // 6 ký tự A–Z, 2–9 (bỏ ký tự dễ nhầm: 0 O 1 I L)
  status        String   @default("lobby")  // lobby | playing | finished
  phase         String   @default("lobby")  // lobby | action | finished
  quarter       Int      @default(0)
  totalQuarters Int
  quarterSeconds Int     @default(0)        // 0 = không giới hạn thời gian
  deadlineAt    DateTime?
  version       Int      @default(0)
  llmCalls      Int      @default(0)
  seed          String
  hostPlayerId  String?
  state         Json?                       // GameState của engine (mục 4.2)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  players       Player[]
  ledger        LedgerEntry[]
  reports       QuarterReport[]
  marketReports MarketReport[]
}

model Player {
  id             String   @id @default(cuid())
  gameId         String
  game           Game     @relation(fields: [gameId], references: [id], onDelete: Cascade)
  name           String
  tokenHash      String                       // sha256 của token
  seat           Int
  status         String   @default("active")  // active | bankrupt | acquired
  ready          Boolean  @default(false)
  pending        Json     @default("[]")      // Action[] của quý hiện tại
  joinedAt       DateTime @default(now())
  @@unique([gameId, name])
  @@unique([gameId, seat])
}

model LedgerEntry {
  id        String @id @default(cuid())
  gameId    String
  game      Game   @relation(fields: [gameId], references: [id], onDelete: Cascade)
  playerId  String
  quarter   Int
  seq       Int                               // thứ tự trong game
  memo      String
  category  String                            // operating | investing | financing | tax | transfer | system
  lines     Json                              // [{ account, dr, cr }]
  @@index([gameId, playerId, quarter])
}

model QuarterReport {                          // báo cáo tài chính công khai của từng người chơi
  id String @id @default(cuid())
  gameId String
  game Game @relation(fields: [gameId], references: [id], onDelete: Cascade)
  quarter Int
  playerId String
  data Json                                    // QuarterReportData (mục 8.3)
  @@unique([gameId, quarter, playerId])
}

model MarketReport {                           // bản tin thị trường mỗi quý
  id String @id @default(cuid())
  gameId String
  game Game @relation(fields: [gameId], references: [id], onDelete: Cascade)
  quarter Int
  data Json                                    // MarketReportData (macro snapshot, roleLogs, đấu giá, hành động)
  @@unique([gameId, quarter])
}
```

### 4.2 Cấu trúc dữ liệu cốt lõi (`types.js`, mô tả bằng JSDoc)

Không cần kiểm tra kiểu lúc build; các `@typedef` dưới đây chỉ để gợi ý trong editor và làm tài liệu.

```js
/** @typedef {'agri'|'real_estate'|'tech'|'tourism'} Sector */
/** @typedef {'A'|'B'|'C'|'D'} Rating */
/** @typedef {'boom'|'stable'|'recession'} Phase */
/** @typedef {'active'|'bankrupt'|'acquired'} PlayerStatus */

/**
 * @typedef {Object} Business
 * @property {Sector} sector
 * @property {1|2|3} level
 * @property {'building'|'operating'|'upgrading'|'converting'} status
 * @property {number} readyQuarter    // quý bắt đầu/tiếp tục sản xuất ở mức mới
 * @property {1|2|3} [targetLevel]
 * @property {Sector} [targetSector]
 * @property {number} workers
 * @property {number} prevWorkers
 * @property {0|0.03|0.06|0.1} rndRate
 * @property {number} efficiency      // [0.7, 1.2], khởi đầu 1.0
 * @property {number} grossCost       // nguyên giá công trình (triệu)
 */

/**
 * @typedef {Object} Plot
 * @property {number} id
 * @property {number} x
 * @property {number} y
 * @property {'core'|'mid'|'edge'} tier
 * @property {string|null} ownerId
 * @property {number} idleQuarters    // số quý liên tiếp chủ sở hữu không có công trình trên ô
 * @property {Business|null} business
 */

/** @typedef {{ id: string, principal: number, spread: number, originQuarter: number, maturityQuarter: number }} Loan */
/** @typedef {{ id: string, principal: number, coupon: number, originQuarter: number, maturityQuarter: number }} Bond */

/**
 * @typedef {Object} PlayerState
 * @property {string} id
 * @property {string} name
 * @property {number} seat
 * @property {PlayerStatus} status
 * @property {Object<string, number>} balances   // mã tài khoản -> số dư có dấu = Nợ − Có (mục 8.1)
 * @property {Loan[]} loans
 * @property {Bond[]} bonds
 * @property {{ outstanding: number, float: number }} shares   // khởi đầu 10000 và 0
 * @property {Rating} rating
 * @property {number} distressQuarters
 * @property {number} taxLossCarry               // lỗ chuyển kỳ (triệu)
 * @property {{ quarter: number, revenue: number, ebit: number, interest: number, netIncome: number, netWorth: number }[]} history
 * @property {number} [eliminatedAtQuarter]
 * @property {number} [finalNetWorth]
 */

/**
 * @typedef {Object} Macro
 * @property {number} quarter
 * @property {Phase} phase
 * @property {number} phaseAge
 * @property {number} policyRate        // năm, ví dụ 0.06
 * @property {number} depositRate       // = policyRate − 0.015 (tối thiểu 0.005)
 * @property {number} lendingBase       // = policyRate + 0.025
 * @property {number} govYield          // = policyRate + 0.01 (lãi suất phi rủi ro cho trái phiếu)
 * @property {number} creditRoom        // hạn mức cho vay mới của hệ thống quý này (triệu)
 * @property {number} creditUsed        // đã cấp trong quý (điền khi chốt)
 * @property {number} inflation         // lạm phát thực hiện của quý trước (q/q)
 * @property {number} growth            // tăng trưởng cầu thực (q/q) áp dụng cho quý này
 * @property {number} unemployment
 * @property {number} confidence        // 0–100
 * @property {number} cpi
 * @property {number} wageIndex
 * @property {number} commodityIndex
 * @property {number} landIndex
 * @property {number} demandIndex
 * @property {number} wageGrowth
 * @property {number} commodityGrowth
 * @property {Object<Sector, { price: number, npcCap: number, demand: number, supply: number, util: number, priceGrowth: number }>} sectors
 * @property {{ id: string, remaining: number }[]} activeEvents
 * @property {number} laborForce
 */

/** @typedef {{ plotId: number, reserve: number, source: 'market'|'foreclosure' }} Listing */

/**
 * @typedef {Object} GameState
 * @property {number} quarter
 * @property {number} totalQuarters
 * @property {number} nPlayers
 * @property {string} seed
 * @property {Macro} macro
 * @property {Plot[]} plots
 * @property {Object<string, PlayerState>} players
 * @property {Listing[]} listings
 * @property {{ a: number, b: number }} dice
 * @property {{ capital: number, loans: number, deposits: number }} bank
 * @property {{ cash: number, bondsHeld: number }} investors
 * @property {{ cash: number }} gov
 * @property {boolean} finished
 * @property {{ playerId: string, netWorth: number, rank: number, status: PlayerStatus }[]} [ranking]
 * @property {Macro[]} macroHistory       // snapshot đầu mỗi quý, dùng vẽ biểu đồ (giữ tối đa 40)
 */
```

Hành động (`actions.js`): mỗi hành động là một object có trường `type` (mục 5.5) và có Zod schema tương ứng; dùng `z.discriminatedUnion('type', [...])`.

---

## 5. Luật chơi

### 5.1 Vòng đời

1. **Sảnh (lobby):** chủ phòng tạo game (chọn số quý, thời gian mỗi quý tùy chọn). Người chơi vào bằng mã phòng + tên. Bắt đầu khi có 2–6 người; chủ phòng bấm "Bắt đầu".
2. **Khởi tạo:** mỗi người có 10.000 triệu tiền mặt (bút toán: Nợ `CASH` / Có `PAID_IN_CAPITAL`), cổ phần 10.000 (float 0), xếp hạng ban đầu `B`. Macro khởi tạo theo mục 13. Xúc xắc và danh sách rao bán của quý 1 được tạo.
3. **Mỗi quý:** (a) xem bản tin thị trường + xúc xắc + đất rao bán, (b) mỗi người đặt các hành động (tối đa 3 điểm hành động), (c) bấm "Xong lượt", (d) engine chốt quý (mục 9), (e) sang quý kế.
4. **Kết thúc:** sau quý cuối, hoặc khi chỉ còn ≤ 1 người `active` (khi bắt đầu ≥ 2 người). Xếp hạng theo mục 5.8.

### 5.2 Điểm hành động (ĐHĐ)

Mỗi người có **3 ĐHĐ mỗi quý**. Hành động **chiến lược** tốn 1 ĐHĐ; hành động **tài chính nhanh** tốn 0. Hành động đặt trước khi chốt có thể sửa/xóa. Không dồn ĐHĐ sang quý sau. Người chơi không bấm gì vẫn bị chốt quý bình thường (công ty vẫn vận hành, lãi/lương/thuế vẫn phát sinh).

### 5.3 Bản đồ đất

Lưới 6×6 = 36 ô, `id = y*6 + x`. Phân hạng: `core` = 4 ô giữa (x,y ∈ {2,3}), `mid` = 12 ô vòng quanh, `edge` = 20 ô ngoài cùng. Giá đất thị trường:

```js
landValue(plot) = round(CONFIG.landBase[plot.tier] * macro.landIndex * (1 + min(0.04 * k, 0.12)))
// k = số ô liền kề (4 hướng) đang có doanh nghiệp operating (của bất kỳ ai)
```

Ô liền kề = chung cạnh (trên/dưới/trái/phải). Đất chưa có chủ đứng yên cho đến khi được rao bán (5.7).

### 5.4 Doanh nghiệp

Mỗi ô đất của người chơi có thể xây **một doanh nghiệp** thuộc một trong 4 ngành. Tham số ngành, cấp độ ở `config.js` (mục 13).

- **Cấp độ 1–3:** quyết định công suất (đơn vị công suất; 1 đơn vị ở giá 1,0 = 1.000 triệu doanh thu/quý) và số nhân công cần thiết.
- **Xây dựng mất 1 quý:** đặt xây ở quý t, trả tiền ngay, bắt đầu sản xuất từ quý t+1. Nâng cấp tương tự (vẫn sản xuất ở mức cũ trong lúc nâng cấp). Chuyển ngành (chỉ cấp 1): ngừng sản xuất 1 quý.
- **Nhân công:** `workers ∈ [0, requiredWorkers]`. Mặc định thuê đủ khi hoàn thành. Hệ số nhân sự `staffing = workers / required`. Giảm nhân công giảm chi phí lương nhưng giảm công suất tương ứng.
- **Tái đầu tư (R&D):** mỗi doanh nghiệp chọn `rndRate ∈ {0, 3%, 6%, 10%}` doanh thu. Hiệu suất `efficiency` thay đổi theo mức này (xem config), nhân vào doanh thu.
- **Cụm cùng ngành (khu công nghiệp / đô thị):** thành phần liên thông (4 hướng) của các doanh nghiệp `operating` cùng chủ, cùng ngành, kích thước `n`: doanh thu `+min(0.04×(n−1), 0.16)`, giá vốn `−min(0.02×(n−1), 0.08)`.
- **Ngoại tác khác ngành:** mỗi doanh nghiệp `operating` liền kề (bất kỳ chủ) cộng/trừ doanh thu theo bảng `config.externality`, tổng bị chặn ±10%.
- **Rủi ro tập trung** là hệ quả tự nhiên: cụm lớn cùng ngành cùng chịu một cú sốc ngành.

### 5.5 Bảng hành động

| `type` | ĐHĐ | Tham số | Điều kiện hợp lệ | Hiệu lực |
|---|---|---|---|---|
| `withdraw` | 0 | `amount` | `amount ≤ DEPOSIT` | Rút tiền gửi về tiền mặt |
| `deposit` | 0 | `amount` | `amount ≤ CASH` tại thời điểm xử lý | Gửi tiết kiệm (lãi `depositRate`) |
| `borrow` | 0 | `amount ≥ 500` | ≤ 1 lần/quý; xem 6.7 | Vay ngân hàng, kỳ hạn 8 quý, lãi thả nổi |
| `repay` | 0 | `loanId`, `amount` | `amount ≤ principal` | Trả gốc sớm |
| `setWorkers` | 0 | `plotId`, `workers` | doanh nghiệp `operating`; `0 ≤ workers ≤ required` | Đặt nhân công |
| `setReinvest` | 0 | `plotId`, `rate ∈ {0,0.03,0.06,0.1}` | doanh nghiệp tồn tại | Đặt mức tái đầu tư |
| `bid` | 1 | `plotId`, `amount` | ô đang rao bán; `amount ≥ reserve`; mỗi ô tối đa 1 giá thầu/người | Đấu giá kín (5.7) |
| `build` | 1 | `plotId`, `sector` | ô của mình, chưa có công trình; đủ tiền | Xây cấp 1, trả `build[sector][0] × constructionIndex` |
| `upgrade` | 1 | `plotId` | doanh nghiệp `operating`, level < 3 | Nâng cấp, trả `build[sector][level] × constructionIndex` |
| `convert` | 1 | `plotId`, `sector` | `operating`, level = 1, khác ngành | Trả `0.6 × build[newSector][0] × constructionIndex`, ngừng 1 quý |
| `sellPlot` | 1 | `plotId` | ô của mình | Bán cho thị trường: `0.85×landValue + 0.6×NBV công trình`; ô về trạng thái chưa có chủ |
| `issueBond` | 1 | `amount ≥ 1000`, `term ∈ {4,8}` | ≥ 1 doanh nghiệp `operating`; xem 6.9 | Phát hành trái phiếu |
| `issueShares` | 1 | `fraction ∈ (0, 0.3]` | ≥ 1 doanh nghiệp `operating`; vốn chủ > 0 | Phát hành cổ phiếu mới, pha loãng |
| `claimIdle` | 1 | `plotId` | ô của người khác (còn `active`), `idleQuarters ≥ 4`, không có công trình, người gọi sở hữu ô liền kề | Mua cưỡng chế với giá `1.15 × landValue`; chủ cũ nhận tiền |
| `tenderOffer` (M10) | 1 | `targetPlayerId` | xem 6.9.4 | Chào mua công khai |

`constructionIndex = 0.5 × commodityIndex + 0.5 × wageIndex`.

Mỗi hành động được kiểm tra hai lần: **khi gửi** (`validate.js`: schema, ĐHĐ, sở hữu, trạng thái ô; kiểm tra tiền mang tính cảnh báo) và **khi chốt quý** (kiểm tra cứng; thất bại thì ghi kết quả `ok:false` kèm lý do tiếng Việt, không ném lỗi).

### 5.6 Thứ tự xử lý hành động (cố định, hiển thị trên UI)

Thứ tự gửi không quan trọng; engine luôn xử lý theo thứ tự sau:

1. `withdraw`  2. `sellPlot`  3. Tài trợ vốn: `borrow` → `issueBond` → `issueShares` (các khoản tranh chấp xử lý chia tỷ lệ giữa người chơi)  4. `bid` (đấu giá), `claimIdle`, `tenderOffer`  5. `build` / `upgrade` / `convert`  6. `repay`  7. `deposit`  8. `setWorkers`, `setReinvest`.

Nếu thiếu tiền ở bước nào, hành động đó thất bại, các hành động khác vẫn chạy.

### 5.7 Rao bán đất, xúc xắc và đấu giá

Cuối mỗi lượt chốt (và lúc khởi tạo), engine tung **2 xúc xắc** (`dice` stream):

- **Xúc xắc A (số ô rao bán):** `listCount = min(ôChưaCóChủ, A + ceil(nPlayers/2) + 1)`. Chọn ngẫu nhiên các ô chưa có chủ (ưu tiên các ô thuộc `foreclosure` nếu có, chúng luôn được đưa vào trước). Giá sàn `reserve = landValue`; ô phát mại có `reserve = 0.8 × landValue`.
- **Xúc xắc B (cú sốc tài nguyên):** 1 → giá nguyên liệu +8%; 2 → +3%; 3–4 → 0; 5 → −3%; 6 → −8% (áp vào `commodityIndex` của quý kế).

**Đấu giá kín giá nhất:** các giá thầu đã gửi được gom lại, sắp xếp giảm dần theo `amount` (đồng hạng: xáo ngẫu nhiên theo `ties`). Duyệt lần lượt: nếu ô chưa bị lấy và người thầu còn đủ tiền (`CASH + DEPOSIT`, tự rút tiền gửi nếu cần) thì thắng, trả đúng số tiền thầu. Ô không ai thắng sẽ trở lại pool và có thể được rao lại sau. Sau khi chốt, **công khai tất cả giá thầu** trong bản tin (để người chơi học cách định giá).

Người thắng ô ở quý t chỉ xây được từ quý t+1 (vì `build` yêu cầu đã sở hữu lúc gửi).

### 5.8 Phá sản, thắng, xếp hạng

- **Phá sản (thua, bị loại)** khi sau bước kiểm tra rủi ro (mục 9, B8): (a) vốn chủ < 0, hoặc (b) có nợ quá hạn (`ARREARS > 0`) hai quý liên tiếp.
- Thanh lý (`bankruptcy.js`): tài sản có giá trị thu hồi = tiền + tiền gửi + 80% × (giá trị đất + giá trị còn lại công trình). Thứ tự thanh toán: nợ quá hạn → thuế phải nộp → vay & trái phiếu theo tỷ lệ gốc. Phần thiếu hụt: lỗ của ngân hàng trừ vào `bank.capital`; lỗ của nhà đầu tư trừ vào `investors.bondsHeld`. Công trình bị xóa sổ; đất về trạng thái `foreclosure` (rao ở các quý sau với giá sàn 80%). Người chơi chuyển sang chế độ **khán giả** (xem được tất cả, không hành động).
- **Xếp hạng cuối:** người còn `active` xếp theo tài sản ròng (vốn chủ) giảm dần, đồng hạng thì ai tiền mặt cao hơn. Sau đó đến người `acquired`/`bankrupt` xếp theo `finalNetWorth` (vốn chủ ngay trước khi bị loại). Nếu mọi người cùng phá sản trong một quý, xếp theo vốn chủ trước thanh lý.
- Tài sản ròng = tổng tài sản − tổng nợ phải trả, với đất theo giá thị trường (đã định giá lại), công trình theo giá trị còn lại.

---

## 6. Mô hình kinh tế

Quý ký hiệu `t`. Lãi suất ở dạng năm, các tỷ lệ tăng ở dạng quý (q/q); khi hiển thị lạm phát/tăng trưởng, nhân 4 để ra "quy năm" và ghi rõ.

### 6.1 Chu kỳ kinh tế (chuỗi Markov)

```js
const TRANSITION = {
  stable:    { boom: 0.25, stable: 0.60, recession: 0.15 },
  boom:      { boom: 0.65, stable: 0.30, recession: 0.05 },
  recession: { boom: 0.05, stable: 0.40, recession: 0.55 },
};
```

Ràng buộc: giữ tối thiểu 2 quý trước khi chuyển (`phaseAge ≥ 2`). Điều chỉnh nội sinh: nếu `phase = boom` và `phaseAge ≥ 4` thì cộng 0,10 xác suất sang `recession` (trừ từ `boom`); nếu lạm phát quy năm > 8% thì cộng 0,10 xác suất sang `recession`. Chuẩn hóa lại tổng = 1. Pha của quý t+1 được quyết định ở cuối quý t và công bố đầu quý t+1 ("Dự báo: kinh tế bước vào giai đoạn …").

### 6.2 Sự kiện ngẫu nhiên

Mỗi quý (từ quý 3) có xác suất 0,4 xuất hiện **một** sự kiện mới, chọn theo trọng số. Sự kiện hiệu lực từ quý được công bố và được công bố đầu quý (người chơi thấy trước khi hành động). Hiệu ứng nhân/cộng áp dụng **mỗi quý trong thời lượng**, trừ mục ghi "(một lần)".

| id | Tên | Trọng số | Số quý | Hiệu ứng |
|---|---|---|---|---|
| `epidemic` | Dịch bệnh lan rộng | 4 | 2 | cầu du lịch ×0,5; niềm tin −8 |
| `harvest_fail` | Mất mùa, thiên tai | 5 | 1 | cung NPC nông nghiệp ×0,8; nguyên liệu +10% (một lần) |
| `ai_boom` | Làn sóng công nghệ mới | 5 | 2 | cầu công nghệ ×1,3 |
| `energy_spike` | Giá năng lượng tăng vọt | 5 | 1 | nguyên liệu +12% (một lần) |
| `re_support` | Chính sách hỗ trợ bất động sản | 4 | 2 | cầu BĐS ×1,2; giá đất +3% (một lần) |
| `bank_stress` | Ngân hàng nhỏ gặp sự cố | 3 | 2 | `bank.capital` −15% (một lần); room ×0,6 |
| `tourism_season` | Mùa du lịch bội thu | 5 | 1 | cầu du lịch ×1,25; niềm tin +5 (một lần) |
| `agri_export` | Xuất khẩu nông sản tăng | 5 | 2 | cầu nông nghiệp ×1,2 |
| `min_wage` | Tăng lương tối thiểu | 4 | 1 | `wageIndex` +4% (một lần) |
| `stimulus` | Gói kích cầu chính phủ | 3 | 1 | `demandIndex` +2% (một lần); niềm tin +5 (một lần) |
| `trade_war` | Căng thẳng thương mại | 3 | 2 | cầu công nghệ ×0,85; cầu nông nghiệp ×0,9; niềm tin −5 (một lần) |

Định nghĩa dưới dạng dữ liệu (`events.js`) với các trường: `demandMult`, `supplyMult`, `commodityShock`, `wageShock`, `landShock`, `confidenceDelta`, `demandIndexShock`, `bankCapitalPct`, `roomMult`; nhóm `once` áp dụng đúng một lần khi kích hoạt.

### 6.3 Cầu và cung theo ngành

Đơn vị: công suất ("đơn vị"). Với mỗi ngành `s`:

```js
npcCap0[s] = SECTOR[s].npcBase * (0.6 + 0.1 * nPlayers)
npcCap[s](t) = npcCap[s](t-1) * (1 + CONFIG.npcTrend) * eventSupplyMult(s)   // chỉ áp eventSupplyMult cho quý hiệu lực

// Cầu (đơn vị thực)
D[s] = npcCap0[s] * macro.demandIndex * m[s] * eventDemandMult(s)

m.agri        = 1.0
m.tourism     = 0.7 + 0.6 * confidence / 100
m.real_estate = clamp(1 - 4 * (policyRate - 0.06) + 0.004 * (confidence - 50), 0.6, 1.4)
m.tech        = 0.85 + 0.3 * confidence / 100

// Cung: doanh nghiệp NPC nhường thị phần khi người chơi vào ngành, nhưng không dưới 40%
playerCap[s] = Σ capacity_eff của doanh nghiệp operating (xem 7.1; chưa nhân hiệu suất/cụm)
npcEff[s]    = max(0.4 * npcCap[s], npcCap[s] - 0.8 * playerCap[s])
S[s]         = npcEff[s] + playerCap[s]

ratio[s] = D[s] / S[s]
util[s]  = min(1, ratio[s])                       // tỷ lệ công suất bán được
```

Hệ quả: người chơi cùng đổ vào một ngành → `ratio < 1` → giá giảm, hụt công suất (cung vượt cầu). Ngành thiếu cung (`ratio > 1`) → giá tăng, lợi nhuận tăng, hút người chơi vào. Các cú sốc cầu theo pha chu kỳ tự tạo lạm phát cầu kéo; cú sốc nguyên liệu/lương tạo lạm phát chi phí đẩy.

### 6.4 Giá ngành, lạm phát

```js
costPush[s]   = 0.5 * (SECTOR[s].cogs * macro.commodityGrowth + 0.2 * macro.wageGrowth)
priceGrowth[s] = clamp(0.002 + 0.30 * ln(ratio[s]) + costPush[s], -0.03, 0.04)
price[s](t)   = clamp(price[s](t-1) * (1 + priceGrowth[s]), 0.7, 2.0)
inflation(t)  = Σ_s SECTOR[s].weight * priceGrowth[s]          // q/q thực hiện
cpi(t)        = cpi(t-1) * (1 + inflation(t))
```

### 6.5 Người dân (hộ gia đình)

Hộ gia đình là một vai trò tổng hợp, không có sổ riêng; trạng thái nằm trong `macro`:

```js
laborForce = 1500 * nPlayers
playerWorkers = Σ workers (mọi doanh nghiệp đang operating/upgrading của người chơi active)

// cuối quý t, cho quý t+1:
Δu = -0.35 * (g_next - 0.010) - (playerWorkers_t - playerWorkers_{t-1}) / laborForce + 0.1 * (0.05 - u_t)
unemployment_next = clamp(u_t + Δu, 0.02, 0.15)

wageGrowth_next = clamp(0.7 * inflation_t + 0.05 * (0.06 - u_t), -0.01, 0.04)
wageIndex_next  = wageIndex_t * (1 + wageGrowth_next)       // cộng cú sốc sự kiện min_wage nếu có

confidenceTarget = 50 + 400 * g_next - 150 * max(0, 4*inflation_t - 0.05) - 250 * (u_next - 0.06) + eventConfidence
confidence_next  = clamp(confidence_t + 0.5 * (confidenceTarget - confidence_t), 10, 95)
```

Khoản tiết kiệm của người dân chịu lãi suất tiền gửi: lãi tiền gửi cao làm giảm tiêu dùng, thể hiện qua hệ số `0.15*(rate−0.06)` ở công thức tăng trưởng (6.6).

### 6.6 Tăng trưởng cầu, giá đất, nguyên liệu

```js
base = { boom: 0.025, stable: 0.010, recession: -0.015 }[phase_next]
g_next = clamp(
    base
  - 0.15 * (policyRate_next - 0.06)                      // lãi suất cao kìm tiêu dùng/đầu tư
  + 0.0002 * (confidence_t - 50)
  + 0.004 * (creditUsed_t / max(1, creditRoom_t) - 0.5)  // tín dụng được hút nhiều thì cầu tăng
  + govImpulse_t
  + eventDemandIndexShock
  + rng.normal(0, 0.004),
  -0.04, 0.05)
demandIndex_next = demandIndex_t * (1 + g_next)

govImpulse_t = clamp(0.3 * govSpend_t / nominalDemand_t, 0, 0.01)
nominalDemand_t = Σ_s D[s] * price[s] * CONFIG.unitValue

landGrowth_next = clamp(0.4 * inflation_t + 0.7 * g_next - 0.4 * (policyRate_next - 0.06) + eventLandShock + rng.normal(0, 0.004), -0.06, 0.06)
landIndex_next  = landIndex_t * (1 + landGrowth_next)

commodityShockDice = { 1: +0.08, 2: +0.03, 3: 0, 4: 0, 5: -0.03, 6: -0.08 }[dice.b]
commodityGrowth_next = commodityShockDice + eventCommodityShock + 0.1 * (1 - commodityIndex_t)  // hồi quy về 1
commodityIndex_next  = clamp(commodityIndex_t * (1 + commodityGrowth_next), 0.7, 1.8)
```

Lưu ý: xúc xắc B của quý t+1 được tung **trước** khi tính `commodityGrowth_next` (tung xúc xắc ở bước C3 trước C1; xem mục 9).

### 6.7 Ngân hàng trung ương và ngân hàng thương mại

**Lãi suất cơ bản** (cuối quý t, cho quý t+1):

```js
inflAnn = 4 * inflation_t
target = 0.06 + 0.8 * (inflAnn - 0.04) - 0.4 * (unemployment_t - 0.06) - (phase_next === 'recession' ? 0.005 : 0)
delta  = clamp(target - policyRate_t, -0.0075, 0.0075)
policyRate_next = clamp(round((policyRate_t + delta) / 0.0025) * 0.0025, 0.015, 0.14)
depositRate = max(0.005, policyRate - 0.015); lendingBase = policyRate + 0.025; govYield = policyRate + 0.01
```

**Room tín dụng** (tổng cho vay mới của hệ thống trong quý):

```js
stance = (inflAnn > 0.08 || policyRate_next > 0.10) ? 0.6
       : (inflAnn < 0.01 && phase_next === 'recession') ? 1.4 : 1.0
bankHealth = clamp(bank.capital / CONFIG.bank.capital0, 0.4, 1.2)
creditRoom_next = round(2500 * nPlayers * stance * bankHealth * eventRoomMult)
```

**Cấp vốn vay** (`borrow`), cho từng người chơi:

```js
collateral = Σ landValue(ô của mình) + Σ NBV công trình
maxDE = { A: 2.5, B: 1.8, C: 1.0, D: 0.3 }[rating]
totalDebt = BANK_LOAN + BONDS_PAYABLE + ARREARS
allowed = max(0, min(requested,
                     maxDE * equity - totalDebt,
                     0.7 * collateral - BANK_LOAN))
// nếu Σ allowed của mọi người > creditRoom còn lại: nhân tất cả với (creditRoom / Σ allowed)
```

Lãi vay thả nổi: `rate = macro.lendingBase + loan.spread`, `spread` cố định theo hạng lúc vay: `A 0.005, B 0.015, C 0.035, D 0.07`. Mỗi quý trả lãi `principal × rate / 4`. Kỳ hạn 8 quý, trả gốc một lần khi đáo hạn; khi đáo hạn, nếu thiếu tiền thì thử **tái cấp vốn tự động** phần thiếu (hạng ≥ C, còn room, thỏa `maxDE`, kỳ hạn mới 4 quý); phần còn thiếu thành nợ quá hạn.

**Ngân hàng:** `bank.deposits` = tổng tiền gửi người chơi; `bank.loans` = tổng dư nợ người chơi; `bank.capital` khởi đầu `CONFIG.bank.capital0 = 20000`, mỗi quý cộng `+300 + 25% × (lãi thu − lãi trả tiền gửi)` và trừ khoản lỗ khi người chơi phá sản/sự kiện. `bank.capital` thấp ⇒ `bankHealth` thấp ⇒ room co lại (chuỗi lan truyền: vỡ nợ → ngân hàng yếu → siết tín dụng).

**Nợ quá hạn:** lãi phạt `(lendingBase + 0.05) / 4` mỗi quý trên `ARREARS`.

### 6.8 Chính phủ và thuế

- **Thuế thu nhập doanh nghiệp (TNDN)** lũy tiến theo bậc trên lợi nhuận chịu thuế quý: 0–500 triệu: 15%; >500–1.500: 22%; >1.500: 30% (tính cận biên theo bậc, không tính cả khoản).
  `taxable = max(0, EBT - taxLossCarry)`; nếu `EBT < 0` thì `taxLossCarry += -EBT`; nếu `EBT > 0` thì `taxLossCarry = max(0, taxLossCarry - EBT)`. `EBT = EBIT + lãi tiền gửi − lãi vay − coupon` (không gồm lãi/lỗ đánh giá lại đất).
- **Thuế đất trống:** ô có `idleQuarters ≥ 2` chịu `1.5% × landValue` mỗi quý, nộp ngay (chống đầu cơ).
- Thuế quý t ghi nhận phải nộp (`TAX_PAYABLE`) và **nộp ở bước đầu xử lý quý t+1**; tờ khai thuế hiển thị từng bậc.
- `gov.cash` cộng mọi khoản thuế; mỗi quý chi `govSpend = 0.5 × gov.cash` cho kích cầu (đưa vào `govImpulse`, 6.6) và giảm `gov.cash` tương ứng.

### 6.9 Nhà đầu tư và xếp hạng tín nhiệm

#### 6.9.1 Xếp hạng tín nhiệm (`rating.js`, tính cuối mỗi quý cho từng người chơi active)

```js
D_E       = totalDebt / max(1, equity)
coverage  = interest_q > 0 ? (EBIT_q + depreciation_q) / interest_q : 99     // hệ số thanh toán lãi
liquidity = (CASH + DEPOSIT) / (0.15 * totalDebt + 500)
netMargin = revenue_q > 0 ? netIncome_q / revenue_q : 0

score = clamp(30 * (1 - D_E / 3), 0, 30)
      + clamp(25 * min(coverage, 5) / 5, 0, 25)
      + clamp(25 * min(liquidity, 1), 0, 25)
      + clamp(20 * netMargin / 0.15, 0, 20)
      - (ARREARS > 0 ? 20 : 0)
rating = score >= 75 ? 'A' : score >= 55 ? 'B' : score >= 35 ? 'C' : 'D'
```

Người chơi mới (chưa có doanh nghiệp `operating` nào) giữ hạng `B` cho đến khi có dữ liệu.

#### 6.9.2 Trái phiếu (`issueBond`)

Nhà đầu tư **chỉ mua** khi thỏa tất cả: có ≥ 1 doanh nghiệp `operating`; hạng ≠ `D`; `coverage ≥ 1.2`; `D/E` sau phát hành ≤ `maxDE[rating]`. Nếu không, ghi lý do vào nhật ký (mục 10).

```js
coupon = macro.govYield + { A: 0.01, B: 0.025, C: 0.05 }[rating]        // năm, cố định suốt kỳ hạn
ρ = clamp(0.5 + confidence/100, 0.6, 1.4) * (phase === 'recession' ? 0.8 : 1)
bondBudget = 0.5 * investors.cash * ρ
fillFactor = min(1, bondBudget / Σ requestedEligible)        // chia tỷ lệ giữa các người phát hành
issued = floor(requested * fillFactor)
fee = round(0.01 * issued)                                   // 5990 FEES
```

Trả coupon `principal × coupon / 4` mỗi quý, trả gốc một lần khi đáo hạn (thiếu tiền → nợ quá hạn; trái phiếu không tái cấp). `investors.cash -= issued`, `investors.bondsHeld += issued`.

#### 6.9.3 Cổ phiếu (`issueShares`)

Điều kiện như trái phiếu trừ `coverage`. Định giá:

```js
PE = clamp(12 * (0.6 + confidence/100) * (1 - 4 * (policyRate - 0.06)), 6, 24)
ttmNI = tổng netIncome tối đa 4 quý gần nhất (không gồm lãi/lỗ đánh giá lại)
V = history.length >= 2 ? 0.5 * equity + 0.5 * max(0, ttmNI * (4 / history4.length)) * PE : equity
sharePrice = V / shares.outstanding                           // triệu/cổ phiếu
issuePrice = 0.95 * sharePrice
newShares = round(outstanding * fraction)
equityBudget = 0.3 * investors.cash * ρ
// chia tỷ lệ tương tự trái phiếu; sold = floor(newShares * fillFactor)
gross = sold * issuePrice;  fee = round(0.02 * gross)
```

Bút toán: Nợ `CASH` (gross − fee), Nợ `FEES` (fee) / Có `PAID_IN_CAPITAL` (gross). `shares.outstanding += sold`, `shares.float += sold`, `investors.cash -= gross`. **Tỷ lệ sở hữu của người sáng lập** = `(outstanding − float) / outstanding` — hiển thị công khai.

#### 6.9.4 Chào mua công khai (M10, tùy chọn)

`tenderOffer{targetPlayerId}`: hợp lệ khi `target.float / target.outstanding > 0.5`. Giá = `float × sharePrice(target) × 1.2`; người mua phải đủ tiền. Thành công: người mua trả tiền cho nhà đầu tư (`investors.cash += giá`), **hợp nhất** toàn bộ tài sản và nợ của target vào người mua theo giá sổ (chuyển từng dòng số dư; chênh lệch ghi `GOODWILL` nếu người mua trả hơn vốn chủ nhận về, hoặc `BARGAIN_GAIN` nếu ít hơn), đất và doanh nghiệp đổi chủ, target thành `acquired` (bị loại). Đây là hậu quả cố ý của việc pha loãng mất quyền kiểm soát.

#### 6.9.5 Dòng tiền của nhà đầu tư

```js
investors.cash_next = investors.cash + 3000 * nPlayers * (0.6 + 0.8 * confidence / 100)
                      + coupon thu được + gốc trái phiếu được trả − mua mới
```

---

## 7. Kinh tế doanh nghiệp (công thức ghi sổ mỗi quý)

### 7.1 Doanh nghiệp đang vận hành

```js
capEff   = CONFIG.levels.capacity[level-1] * staffing              // đơn vị công suất
clusterRev, clusterCogs: xem 5.4;  ext: xem 5.4 (±10%)

revenue = round(capEff * util[s] * price[s] * efficiency * (1 + clusterRev + ext) * CONFIG.unitValue)
cogs    = round(SECTOR[s].cogs * (1 - clusterCogs) * capEff * util[s] * macro.commodityIndex * CONFIG.unitValue)
wages   = round(workers * CONFIG.baseWage * macro.wageIndex * SECTOR[s].wageMult)
maint   = round(CONFIG.maintenanceRate * NBV)                       // NBV = grossCost − khấu hao lũy kế
rnd     = round(rndRate * revenue)
dep     = min(round(CONFIG.depreciationRate * grossCost), NBV)
hr      = round(hireCost * wage1 * max(0, workers - prevWorkers) + fireCost * wage1 * max(0, prevWorkers - workers))   // wage1 = lương 1 người/quý
EBIT    = revenue − cogs − wages − maint − rnd − dep − hr
```

Doanh nghiệp `building`/`converting`: không doanh thu, không lương, chỉ chịu bảo trì bằng 0. `upgrading`: vận hành ở cấp cũ.

### 7.2 Hiệu suất (R&D)

Cuối mỗi quý: `efficiency = clamp(efficiency + effDelta[rndRate], 0.7, 1.2)` (config).

### 7.3 Tổng hợp cấp người chơi

```
Lãi tiền gửi   = round(DEPOSIT_đầu_bước × depositRate / 4)
Lãi vay        = Σ loan.principal × (lendingBase + spread) / 4
Coupon         = Σ bond.principal × coupon / 4
Lãi phạt       = ARREARS × (lendingBase + 0.05) / 4
Định giá lại đất = Σ (landValue mới − số dư sổ của ô)  → REVAL_GAIN / REVAL_LOSS
EBT = ΣEBIT + lãi tiền gửi − lãi vay − coupon − lãi phạt − thuế đất trống
Thuế TNDN: theo 6.8
Lợi nhuận ròng = EBT + định giá lại − thuế TNDN
```

---

## 8. Kế toán (vai trò Kế toán)

### 8.1 Hệ thống tài khoản (mỗi người chơi một sổ cái)

Số dư lưu dạng **có dấu = Nợ − Có** cho mọi tài khoản. Báo cáo đổi dấu cho nhóm Nợ phải trả, Vốn chủ, Doanh thu.

| Mã | Tên (`vi.js`) | Nhóm |
|---|---|---|
| 1100 `CASH` | Tiền mặt | Tài sản |
| 1200 `DEPOSIT` | Tiền gửi ngân hàng | Tài sản |
| 1500 `LAND` | Đất | Tài sản |
| 1600 `BUILDINGS` | Công trình (nguyên giá) | Tài sản |
| 1650 `ACC_DEPR` | Hao mòn lũy kế (số dư Có) | Tài sản (điều chỉnh giảm) |
| 1900 `GOODWILL` | Lợi thế thương mại | Tài sản |
| 2100 `BANK_LOAN` | Vay ngân hàng | Nợ |
| 2200 `BONDS_PAYABLE` | Trái phiếu phát hành | Nợ |
| 2300 `TAX_PAYABLE` | Thuế phải nộp | Nợ |
| 2900 `ARREARS` | Nợ quá hạn | Nợ |
| 3100 `PAID_IN_CAPITAL` | Vốn góp | Vốn chủ |
| 3200 `RETAINED_EARNINGS` | Lợi nhuận giữ lại | Vốn chủ |
| 4100 `REVENUE` | Doanh thu | Thu nhập |
| 4200 `INTEREST_INCOME` | Lãi tiền gửi | Thu nhập |
| 4300 `REVAL_GAIN` | Lãi đánh giá lại đất | Thu nhập |
| 4400 `BARGAIN_GAIN` | Lãi mua rẻ (thâu tóm) | Thu nhập |
| 4500 `DISPOSAL_GAIN` | Lãi thanh lý ô đất | Thu nhập |
| 5100 `COGS` | Giá vốn (nguyên liệu) | Chi phí |
| 5200 `WAGES` | Lương | Chi phí |
| 5300 `MAINTENANCE` | Bảo trì | Chi phí |
| 5400 `RND` | Tái đầu tư / R&D | Chi phí |
| 5500 `DEPRECIATION` | Khấu hao | Chi phí |
| 5600 `INTEREST_EXPENSE` | Lãi vay & coupon | Chi phí |
| 5700 `TAX_EXPENSE` | Thuế TNDN | Chi phí |
| 5800 `IDLE_LAND_TAX` | Thuế đất trống | Chi phí |
| 5850 `HR_COSTS` | Chi phí tuyển / thôi việc | Chi phí |
| 5900 `REVAL_LOSS` | Lỗ đánh giá lại đất | Chi phí |
| 5950 `DISPOSAL_LOSS` | Lỗ thanh lý ô đất | Chi phí |
| 5990 `FEES` | Phí phát hành & khác | Chi phí |

### 8.2 Bút toán mẫu (`ledger.post(entry)` với `entry = { playerId, memo, category, lines[] }`)

| Sự kiện | Nợ | Có | category |
|---|---|---|---|
| Vốn ban đầu | CASH | PAID_IN_CAPITAL | financing |
| Gửi / rút tiền gửi | DEPOSIT / CASH (rút: ngược lại) | CASH / DEPOSIT | transfer |
| Vay | CASH | BANK_LOAN | financing |
| Trả gốc vay | BANK_LOAN | CASH | financing |
| Phát hành trái phiếu | CASH (net), FEES | BONDS_PAYABLE (gross) | financing |
| Phát hành cổ phiếu | CASH (net), FEES | PAID_IN_CAPITAL (gross) | financing |
| Mua đất | LAND | CASH | investing |
| Xây / nâng cấp / chuyển ngành | BUILDINGS | CASH | investing |
| Doanh thu | CASH | REVENUE | operating |
| Giá vốn, lương, bảo trì, R&D, HR | COGS / WAGES / MAINTENANCE / RND / HR_COSTS | CASH | operating |
| Khấu hao | DEPRECIATION | ACC_DEPR | operating |
| Lãi tiền gửi | CASH | INTEREST_INCOME | operating |
| Lãi vay, coupon | INTEREST_EXPENSE | CASH (hoặc ARREARS nếu thiếu) | operating |
| Ghi nhận thuế TNDN | TAX_EXPENSE | TAX_PAYABLE | tax |
| Nộp thuế | TAX_PAYABLE | CASH | tax |
| Thuế đất trống | IDLE_LAND_TAX | CASH | tax |
| Định giá lại đất | LAND ↔ REVAL_GAIN / REVAL_LOSS ↔ LAND | | system |
| Bán ô đất | CASH, ACC_DEPR (phần hao mòn), [DISPOSAL_LOSS] | LAND, BUILDINGS (nguyên giá), [DISPOSAL_GAIN] | investing |
| Chuyển nợ quá hạn | (tài khoản chi phí/nợ gốc tương ứng) | ARREARS | system |
| Trả nợ quá hạn | ARREARS | CASH | financing |
| Đóng sổ cuối quý | mỗi TK 4xxx/5xxx về 0 | RETAINED_EARNINGS | system |

**Hàm trả tiền** `payOrArrears(player, amount, debitAccount, category)`: dùng `CASH` trước; thiếu thì tự rút `DEPOSIT` (ghi bút toán chuyển); vẫn thiếu thì phần còn lại ghi Có `ARREARS`.

### 8.3 Báo cáo mỗi quý (`statements.js`, công khai cho mọi người trong phòng)

`QuarterReportData`:

- **Bảng cân đối kế toán** — tách riêng: *Tài sản* (tiền mặt, tiền gửi, đất, công trình ròng, lợi thế thương mại, tổng), *Nợ phải trả* (vay, trái phiếu, thuế phải nộp, quá hạn, tổng), *Vốn chủ* (vốn góp, lợi nhuận giữ lại, tổng). **Không gộp thành một con số.** Kiểm tra Tài sản = Nợ + Vốn chủ.
- **Kết quả kinh doanh** — doanh thu, giá vốn, lương, bảo trì, R&D, khấu hao, HR, EBIT, lãi tiền gửi, lãi vay & coupon, thuế đất, lãi/lỗ đánh giá lại, EBT, thuế TNDN, lợi nhuận ròng; chia nhỏ theo từng doanh nghiệp.
- **Lưu chuyển tiền tệ** — tổng theo `category` (operating, investing, financing, tax), loại trừ `transfer`.
- **Tờ khai thuế** — lợi nhuận chịu thuế, từng bậc, lỗ chuyển kỳ, thuế phải nộp.
- **Chỉ số tài chính:** D/E, hệ số thanh toán lãi, thanh khoản, biên lợi nhuận, xếp hạng tín nhiệm, tỷ lệ sở hữu của người sáng lập.

### 8.4 Bất biến (kiểm tra bằng test sau mỗi lần chốt quý)

1. Mỗi bút toán có Σ Nợ = Σ Có.
2. Với mỗi người: Tài sản = Nợ + Vốn chủ (sau đóng sổ).
3. `balances` trong state = tổng cộng từ các `LedgerEntry` đã lưu.
4. `CASH ≥ 0`, mọi số dư tiền là số nguyên.
5. Σ `player.loans.principal` = `bank.loans`; Σ `DEPOSIT` = `bank.deposits`; Σ `player.bonds.principal` + (khoản đã xóa nợ) = `investors.bondsHeld` (cho phép sai khác đúng bằng tổng thua lỗ đã ghi).
6. Không có `NaN`/`Infinity` trong state.

---

## 9. Quy trình chốt quý (`resolve.js`)

`resolveQuarter(state, pendingByPlayer) → { state, journal, reports, market, results }`

```
R0  Nạp hành động của người chơi active (thiếu = []). Kiểm tra lại từng hành động; sai → results ok:false.

A. Hành động người chơi (thứ tự 5.6)
 A1 withdraw
 A2 sellPlot
 A3 borrow → issueBond → issueShares       (chia tỷ lệ theo room / ngân sách nhà đầu tư)
 A4 bid (đấu giá) → claimIdle → [tenderOffer]
 A5 build / upgrade / convert
 A6 repay
 A7 deposit
 A8 setWorkers, setReinvest

B. Vận hành quý t
 B1 Hoàn thành công trình/nâng cấp/chuyển ngành có readyQuarter ≤ t
 B2 Tính D, S, ratio, util, priceGrowth, price, inflation, cpi của quý t (6.3–6.4)
 B3 Nhận doanh thu (nhận trước, chi sau)
 B4 Trả chi phí vận hành (giá vốn, lương, bảo trì, R&D, HR); lãi tiền gửi nhận; lãi vay, coupon, lãi phạt phải trả
 B5 Nghĩa vụ đến hạn theo thứ tự: nợ quá hạn → thuế phải nộp của quý t−1 → gốc vay đáo hạn (tái cấp vốn nếu thiếu) → gốc trái phiếu đáo hạn
 B6 Khấu hao; thuế TNDN quý t (ghi nhận phải nộp); thuế đất trống (nộp ngay)
 B7 Định giá lại đất theo landValue mới; cập nhật idleQuarters; cập nhật efficiency
 B8 Kiểm tra rủi ro: equity < 0 → phá sản; ARREARS > 0 → distressQuarters++ (≥ 2 → phá sản), ngược lại về 0 → thanh lý (5.8)
 B9 Đóng sổ; tính hạng tín nhiệm; sinh QuarterReport; ghi history

C. Chuẩn bị quý t+1
 C1 Tung xúc xắc (dice) cho quý t+1
 C2 Chọn pha chu kỳ mới (6.1); rút sự kiện mới (6.2); giảm remaining của sự kiện đang chạy
 C3 Tính g_next, thất nghiệp, lương, niềm tin, nguyên liệu, giá đất, lãi suất, room (6.5–6.7); cập nhật ngân hàng, nhà đầu tư, chính phủ
 C4 Lập danh sách rao bán (5.7), gồm ô phát mại
 C5 Sinh nhật ký "vì sao" cho từng vai trò (mục 10) và MarketReport
 C6 Kiểm tra kết thúc game (quý cuối hoặc còn ≤ 1 người active) → xếp hạng
 C7 quarter++, đặt lại ready=false và pending=[] cho người active; version++
```

Trong cùng một bước, nếu có nhiều người chơi, xử lý theo thứ tự `seat` (ngoại trừ các phần chia tỷ lệ/đấu giá nêu rõ). Mọi phép chia/làm tròn: dùng `Math.round` ở thời điểm ghi bút toán và đảm bảo tổng các phần chia khớp tổng (phần dư dồn cho người đầu tiên).

---

## 10. Nhật ký "vì sao" (`explain.js`)

Mỗi quý engine sinh `roleLogs: { role, severity: 'info'|'warn'|'good', text }[]` bằng template (luôn có, là nguồn sự thật về số liệu và lý do). Nếu bật LLM (mục 3.6) thì LLM viết lại lời văn theo giọng từng vai trò nhưng giữ nguyên mọi con số; bản template là dự phòng. Hiển thị ở tab Thị trường, có tag vai trò. Các template tối thiểu (biến trong `{}`):

| Vai trò | Điều kiện | Mẫu câu |
|---|---|---|
| Người dân | confidence giảm ≥ 5 | "Niềm tin tiêu dùng giảm xuống {conf} do thất nghiệp {u}% và lạm phát {infl}% (quy năm); người dân cắt giảm chi tiêu du lịch." |
| Người dân | confidence tăng ≥ 5 | "Thu nhập tăng, thất nghiệp {u}%: người dân chi tiêu mạnh hơn cho du lịch và công nghệ." |
| Người dân | lãi suất tiền gửi tăng | "Lãi suất tiền gửi lên {dr}%: người dân gửi nhiều hơn, tiêu dùng chậm lại." |
| Thị trường | ratio ngành > 1.1 | "Ngành {sector}: cầu vượt cung {pct}%, giá tăng {pg}% — lạm phát cầu kéo." |
| Thị trường | ratio ngành < 0.9 | "Ngành {sector}: cung vượt cầu {pct}%, doanh nghiệp chỉ bán được {util}% công suất, giá giảm." |
| Thị trường | commodityGrowth ≥ 0.05 | "Giá nguyên liệu tăng {pct}% — lạm phát chi phí đẩy, biên lợi nhuận bị ép." |
| NHTW | đổi lãi suất | "Ngân hàng trung ương {tăng/giảm} lãi suất cơ bản lên {r}% vì lạm phát {infl}% và thất nghiệp {u}%." |
| NHTW | đổi room | "Room tín dụng quý này {room} tỷ ({thắt chặt/nới lỏng})." |
| Ngân hàng | vay bị cắt | "Ngân hàng chỉ cho {player} vay {x}/{y} triệu vì {lý do: vượt trần D/E {cap}× / tài sản đảm bảo / hết room}." |
| Ngân hàng | tái cấp vốn | "Khoản vay của {player} đáo hạn; ngân hàng tái cấp vốn {x} triệu / từ chối vì hạng {r}." |
| Nhà đầu tư | từ chối trái phiếu | "Nhà đầu tư từ chối trái phiếu của {player}: {hạng D / hệ số thanh toán lãi {c} < 1,2 / D/E vượt trần / chưa có hoạt động kinh doanh}." |
| Nhà đầu tư | mua một phần | "Nhà đầu tư chỉ mua {pct}% trái phiếu quý này vì ngân sách còn {x} triệu cho nhiều người phát hành." |
| Nhà đầu tư | cổ phiếu | "Cổ phiếu {player} định giá {p} triệu/cp (P/E {pe}); phát hành làm tỷ lệ sở hữu của người sáng lập còn {own}%." |
| Chính phủ | mỗi quý | "Chính phủ thu thuế {tax} triệu, chi kích cầu {spend} triệu." |
| Kế toán | phá sản | "{player} phá sản: {vốn chủ âm / nợ quá hạn hai quý liên tiếp}. Ngân hàng chịu lỗ {x} triệu." |
| Sự kiện | sự kiện mới | "Sự kiện: {tên} — {mô tả hiệu ứng}." |

`glossary.js` có tối thiểu các mục: lạm phát cầu kéo, lạm phát chi phí đẩy, lãi suất cơ bản, room tín dụng, đòn bẩy, D/E, hệ số thanh toán lãi, tài sản đảm bảo, chu kỳ kinh tế, cung–cầu, thất nghiệp, thuế lũy tiến, pha loãng cổ phần, chi phí cơ hội, đa dạng hóa, giá trị còn lại (NBV), P/E.

---

## 11. API

Header xác thực: `x-player-token`. Token (32 byte hex) sinh khi tạo/vào phòng, lưu hash SHA-256 trong DB, client lưu `localStorage['ptk:'+code]`. Link khôi phục: `/g/{code}?token={token}` (client lưu token rồi xóa khỏi URL). Lỗi trả `{ error: { code, message } }` với `message` tiếng Việt.

| Method + đường dẫn | Mô tả |
|---|---|
| `POST /api/games` | Body `{ hostName, totalQuarters, quarterSeconds }` → `{ code, playerId, token }` |
| `POST /api/games/:code/join` | Body `{ name }` (2–20 ký tự, duy nhất trong phòng; chỉ khi lobby, ≤ 6 người) → `{ playerId, token }` |
| `POST /api/games/:code/start` | Chủ phòng; ≥ 2 người → khởi tạo engine, `phase='action'`, `quarter=1`, đặt `deadlineAt` nếu có |
| `GET /api/games/:code?v=` | View model (11.1). Nếu `v` bằng version hiện tại → `{ unchanged:true, version }`. Kiểm tra hạn chót dự phòng tại đây (3.3) |
| `PUT /api/games/:code/actions` | Body `{ actions: Action[] }` thay toàn bộ hành động đang chờ của người gọi (quý hiện tại). Validate mục 5.5; trả lỗi theo từng chỉ số. Bỏ `ready` về false khi sửa |
| `POST /api/games/:code/preview` | Body `{ actions: Action[] }` → `{ cashAfter, warnings }`. Xem trước hành động đang soạn (engine `preview.js`), không lưu gì |
| `POST /api/games/:code/ready` | Body `{ ready: boolean }`. Nếu mọi người active đều ready → chốt quý ngay trong request |
| `POST /api/games/:code/resolve` | Chủ phòng chốt ngay |
| `POST /api/games/:code/advisor` | Body `{ question }` (≤ 300 ký tự), tối đa 3 câu/người/quý → `{ answer }`. Cố vấn kinh tế (LLM) trả lời dựa trên báo cáo của chính người hỏi + macro; `503 LLM_OFF` nếu tắt |
| `GET /api/games/:code/ledger?playerId=&quarter=` | Sổ cái (người chơi xem được sổ của mọi người sau khi quý đã chốt) |
| `GET /api/games/:code/reports/:quarter` | Báo cáo tài chính + MarketReport của quý |
| `GET /api/health` | `{ ok: true }` |

Mã lỗi: `400 INVALID`, `401 NO_TOKEN`, `403 NOT_HOST`, `404 NOT_FOUND`, `409 PHASE`, `422 RULE`.

### 11.1 View model (`view.js`)

```js
{
  version, now,
  game: { code, status, phase, quarter, totalQuarters, deadlineAt, hostPlayerId },
  me: { playerId, seat } | null,
  players: [{ id, name, seat, status, ready, color, netWorth, rating, founderStake }],  // công khai
  macro: Macro,                    // quý hiện tại
  macroHistory: Macro[],
  dice, listings, activeEvents,
  plots: [{ id, x, y, tier, ownerId, idleQuarters, landValue, business?: { sector, level, status } }],
  myState: PlayerState,            // đầy đủ
  myPending: Action[], myApLeft: number,
  myPreview: { cashAfter, warnings: [ ... ] },       // preview.js, không ràng buộc
  lastMarketReport, lastReports: { [playerId]: QuarterReportData },
  netWorthHistory: { quarter, [playerId]: number }[],
  ranking?                         // khi finished
}
```

Không bao giờ trả `pending` của người khác, `tokenHash`, hay seed.

---

## 12. Giao diện

Desktop-first, dùng được trên điện thoại. Định dạng số: `Intl.NumberFormat('vi-VN')`; `fmtMoney(triệu)` → "10,00 tỷ" khi ≥ 1.000, ngược lại "850 triệu". Lãi suất/lạm phát hiển thị "x,x%/năm" (quý × 4) kèm tooltip.

### 12.1 Trang

- `/` — Tạo phòng (tên, số quý, thời gian mỗi quý) hoặc vào phòng bằng mã + tên.
- `/g/:code` — Màn hình chính, tự chuyển theo trạng thái: Sảnh (danh sách người, mã phòng, link mời, nút Bắt đầu cho chủ phòng) → Đang chơi → Kết quả.
- `/luat-choi` — Trang luật chơi tĩnh + bảng thuật ngữ.

### 12.2 Màn hình đang chơi

Thanh trên cùng: "Quý {t}/{N} · Năm {ceil(t/4)}", đồng hồ đếm ngược (nếu có hạn), chấm trạng thái sẵn sàng của từng người, nút Chốt quý ngay (chủ phòng).

Bố cục 3 cột (desktop) / tab dưới (mobile):

1. **Thị trường:** thẻ chỉ số (lãi suất cơ bản, lãi suất tiền gửi, lãi vay, lạm phát, thất nghiệp, niềm tin, tăng trưởng, room tín dụng, pha chu kỳ, giá từng ngành kèm cung–cầu); hai xúc xắc (hiệu ứng lăn khi quý mới); sự kiện đang hiệu lực; **nhật ký "vì sao"** theo vai trò (mục 10); biểu đồ lịch sử (Recharts).
2. **Bản đồ 6×6:** ô tô màu theo chủ; biểu tượng ngành và cấp; huy hiệu "đang rao bán" (kèm giá sàn); ô đất trống lâu có cảnh báo; làm nổi bật cụm cùng ngành; bấm ô mở bảng hành động (`bid` / `build` / `upgrade` / `convert` / `sellPlot` / `claimIdle` / `setWorkers` / `setReinvest`).
3. **Hành động & tài chính của tôi:** bộ đếm ĐHĐ (còn x/3); form hành động tài chính nhanh (gửi, rút, vay, trả nợ, phát hành trái phiếu/cổ phiếu); danh sách hành động đang chờ (xóa/sửa) kèm **xem trước** (`preview.js`: tiền mặt dự kiến sau hành động, cảnh báo thiếu tiền/vượt trần D/E); thứ tự xử lý; nút **Xong lượt**.

Tab phụ (toàn chiều rộng):

- **Báo cáo tài chính:** chọn người chơi + quý; ba bảng riêng (Bảng cân đối tách Tài sản / Nợ / Vốn chủ; Kết quả kinh doanh; Lưu chuyển tiền tệ) + Tờ khai thuế + chỉ số + xếp hạng tín nhiệm.
- **Sổ cái:** bảng bút toán lọc theo người/quý/tài khoản/category; mỗi dòng hiện Nợ/Có.
- **Xếp hạng:** bảng tài sản ròng hiện tại + biểu đồ đường tài sản ròng theo quý.
- **Kết quả đấu giá & hành động quý trước:** tất cả giá thầu, người thắng, hành động của mọi người đã chốt (công khai sau khi chốt) với kết quả thành/bại và lý do.

Màn hình **Kết quả:** bảng xếp hạng, người thắng, biểu đồ tài sản ròng, "khoảnh khắc đáng nhớ" (quý có lãi nhiều nhất, quý lỗ nặng nhất), nút tạo ván mới.

Khán giả (phá sản/bị thâu tóm): banner "Bạn đã bị loại", ẩn form hành động, vẫn xem được mọi thứ.

### 12.3 Hành vi client

- Hook `useGame(code)`: kết nối Socket.IO cùng origin, emit `join` và nhận sự kiện của phòng `game-{code}`, nhận `version` mới thì refetch kèm `?v=`; polling dự phòng 15s khi socket kết nối, 3s khi mất kết nối; tự dừng khi `finished`. Có chấm trạng thái kết nối (xanh = realtime, vàng = polling).
- Sự kiện `dice` kích hoạt hiệu ứng lăn xúc xắc đồng bộ cho cả phòng.
- Thẻ **Bản tin** ở tab Thị trường: hiện bản template ngay; khi bản LLM về (version đổi) thì thay bằng bản LLM kèm nhãn.
- Panel **Cố vấn kinh tế**: ô chat nhỏ, hiện số câu hỏi còn lại trong quý.
- Mọi nút hành động gọi API rồi `mutate()` ngay; hiển thị lỗi tiếng Việt từ `error.message`.
- Trạng thái tải/ lỗi mạng: banner "Mất kết nối, đang thử lại…"; không mất hành động đang soạn (giữ trong state cục bộ đến khi `PUT` thành công).
- Tooltip thuật ngữ `<Term id="credit_room">` đọc từ `glossary.js`.
- `lib/api.js` dùng `import.meta.env.VITE_API_URL ?? ''` làm địa chỉ gốc cho mọi lời gọi API; `useGame` dùng cùng địa chỉ này cho Socket.IO.

---

## 13. `config.js` (giá trị khởi đầu)

```js
export const CONFIG = {
  quartersOptions: [12, 16, 20, 24], defaultQuarters: 20,
  players: { min: 2, max: 6 },
  startCash: 10_000, startShares: 10_000, actionPoints: 3,
  grid: { w: 6, h: 6 },
  landBase: { core: 1400, mid: 1000, edge: 650 },
  landNeighborBonus: { perBusiness: 0.04, cap: 0.12 },
  idle: { taxRate: 0.015, taxAfter: 2, claimAfter: 4, claimPremium: 1.15 },
  foreclosureReserve: 0.8,
  sellPlot: { landRate: 0.85, buildingRate: 0.6 },
  unitValue: 1000,
  levels: { capacity: [1.0, 2.1, 3.3], workers: [5, 10, 15] },
  baseWage: 40,
  hr: { hireCost: 0.2, fireCost: 0.5 },
  maintenanceRate: 0.015, depreciationRate: 0.02,
  rnd: { rates: [0, 0.03, 0.06, 0.10], effDelta: [-0.03, 0, 0.015, 0.03], effMin: 0.7, effMax: 1.2 },
  cluster: { revPerNeighbor: 0.04, revCap: 0.16, cogsPerNeighbor: 0.02, cogsCap: 0.08 },
  externalityCap: 0.10,
  externality: {                         // doanh thu cộng/trừ cho mỗi doanh nghiệp operating liền kề thuộc ngành khác
    tourism:     { agri: 0.03, real_estate: 0.02 },
    real_estate: { tourism: 0.03, tech: 0.02, agri: -0.02 },
    tech:        { real_estate: 0.02 },
    agri:        { real_estate: -0.03 },
  },
  sectors: {
    agri:        { name: 'Nông nghiệp',  cogs: 0.60, wageMult: 1.0, build: [1000, 1300, 1800], npcBase: 9, weight: 0.30 },
    real_estate: { name: 'Bất động sản', cogs: 0.62, wageMult: 0.8, build: [1500, 2000, 2800], npcBase: 6, weight: 0.20 },
    tech:        { name: 'Công nghệ',    cogs: 0.45, wageMult: 1.5, build: [1300, 1800, 2600], npcBase: 6, weight: 0.20 },
    tourism:     { name: 'Du lịch',      cogs: 0.57, wageMult: 1.1, build: [1200, 1600, 2300], npcBase: 9, weight: 0.30 },
  },
  npcTrend: 0.008,
  tax: { brackets: [{ upTo: 500, rate: 0.15 }, { upTo: 1500, rate: 0.22 }, { upTo: Infinity, rate: 0.30 }] },
  loan: { termQuarters: 8, rolloverQuarters: 4, minAmount: 500, collateralRate: 0.7,
          spread: { A: 0.005, B: 0.015, C: 0.035, D: 0.07 }, maxDE: { A: 2.5, B: 1.8, C: 1.0, D: 0.3 }, penaltySpread: 0.05 },
  bond: { minAmount: 1000, terms: [4, 8], spread: { A: 0.01, B: 0.025, C: 0.05 }, minCoverage: 1.2, fee: 0.01 },
  equity: { maxFraction: 0.3, discount: 0.95, fee: 0.02 },
  macroInit: { policyRate: 0.06, inflation: 0.005, unemployment: 0.05, confidence: 55, phase: 'stable' },
  bank: { capital0: 20000 },
  investors: { cashPerPlayer: 6000, inflowPerPlayer: 3000 },
  roomPerPlayer: 2500,
  eventChance: 0.4, eventFromQuarter: 3,
};
```

---

## 14. Kiểm thử và mô phỏng

### 14.1 Unit test (Vitest) bắt buộc

- `ledger`: bút toán lệch → ném lỗi; `payOrArrears` đúng thứ tự cash → deposit → arrears.
- `statements`: Tài sản = Nợ + Vốn chủ trong các kịch bản (xây, vay, phát hành, bán đất, phá sản).
- `rng`: cùng seed + purpose + quarter → cùng dãy; khác purpose → khác dãy.
- `map`: liền kề, hạng ô, `landValue`, cụm cùng ngành (thành phần liên thông), ngoại tác (cap ±10%).
- `auction`: giá cao thắng; đồng hạng ổn định theo seed; người thiếu tiền bị bỏ qua; không ô nào có hai chủ.
- `credit`: chia tỷ lệ room; clip theo D/E, tài sản đảm bảo; phạt quá hạn; tái cấp vốn.
- `investors`: từng lý do từ chối trái phiếu; fillFactor; pha loãng cổ phiếu.
- `tax`: từng bậc, lỗ chuyển kỳ, thuế đất trống.
- `bankruptcy`: waterfall, lỗ ngân hàng, đất sang `foreclosure`.
- `resolve`: **tính xác định** (hai lần chạy cùng input → output bằng nhau từng byte JSON); thứ tự gửi hành động không ảnh hưởng kết quả.
- `macro`: mọi biến luôn trong biên clamp trong 1.000 quý mô phỏng ngẫu nhiên.
- `realtime`: `NoopAdapter` khi chạy test/mô phỏng; `publish` được gọi sau mỗi lần `version++` (dùng adapter giả).
- `scheduler`: quá hạn thì tự chốt quý đúng một lần; khởi động lại server dựng lại timer từ DB.
- `llm`: schema Zod chặt; thiếu key, timeout hoặc lỗi thì trả template; LLM không đổi được số liệu nào (so sánh state trước/sau); tên người chơi được sanitize; sự kiện LLM bị clamp đúng biên.

### 14.2 Mô phỏng cân bằng (`npm run sim`)

`be/scripts/simulate.js` chạy N ván (mặc định 300, 20 quý, 4 bot) với seed 1..N, in bảng tóm tắt và thoát mã ≠ 0 nếu vi phạm bất biến. Bot:

- `passive`: chỉ gửi tiết kiệm.
- `conservative`: mua đất rải 3–4 ngành, xây tuần tự, vay tối đa D/E 0,5, giữ tiền mặt ≥ 15% tài sản.
- `aggressive`: dồn một ngành, vay tối đa, xây/nâng cấp tối đa mỗi quý.
- `balanced`: đa dạng hóa, D/E ≤ 1,0, dùng trái phiếu khi hạng ≥ B.
- `random`: hành động hợp lệ ngẫu nhiên.

**Mục tiêu cân bằng (nếu lệch, chỉ chỉnh `config.js`):**

| Chỉ tiêu | Mục tiêu |
|---|---|
| Lỗi runtime / vi phạm bất biến mục 8.4 | 0 |
| Tài sản ròng trung vị `conservative` so với `passive` | cao hơn ≥ 15% |
| Tỷ lệ phá sản `conservative` | ≤ 8% |
| Tỷ lệ phá sản `aggressive` | 25–75% |
| Tỷ lệ thắng của một loại bot bất kỳ trong ván hỗn hợp | ≤ 55% |
| Lạm phát q/q nằm trong [−2%, +6%] | ≥ 95% số quý |
| Thất nghiệp trong [2%, 15%]; lãi suất cơ bản trong [1,5%, 14%] | 100% |
| Ván có ≥ 1 giai đoạn `recession` kéo dài ≥ 2 quý | ≥ 20% số ván |
| Ván có ≥ 1 giai đoạn `boom` kéo dài ≥ 2 quý | ≥ 20% số ván |
| Thời gian một lần chốt quý (6 người) | < 300 ms |

`be/scripts/smoke.js`: gọi API thật (local hoặc URL truyền vào) tạo phòng, vào 2 người, chơi 3 quý tự động, kiểm tra `finished` không lỗi.

---

## 15. Chạy local và chia sẻ cho bạn bè

### 15.1 Chuẩn bị (một lần)

- Node.js 20+.
- PostgreSQL 16: cài trực tiếp, hoặc dùng `db/docker-compose.yml` (một service `db`: `postgres:16`, volume `pgdata`, cổng 5432, user/password `postgres`, database `tycoon`) bằng `npm run db:up`.
- `cloudflared` (Cloudflare Tunnel) hoặc ngrok để mở link cho bạn bè.

### 15.2 Phát triển

1. `npm install`
2. Sao chép `.env.example` thành `.env` trong cả ba thư mục `db/`, `be/`, `fe/`.
3. `npm run db:up` (nếu dùng Docker) rồi `npm run db:migrate`.
4. `npm run dev`, mở http://localhost:5173 (Vite proxy sang `be` ở cổng 3000).

### 15.3 Cho bạn bè chơi

1. `npm run build` rồi `npm start`. `be` chạy ở cổng 3000, phục vụ cả giao diện đã build (`fe/dist`), API và WebSocket.
2. Mở tunnel: `cloudflared tunnel --url http://localhost:3000`. Lệnh in ra link dạng `https://xxxx.trycloudflare.com`.
3. Gửi link đó cho bạn bè. Một link duy nhất cho tất cả, bạn bè không cần cài gì. Link đổi mỗi lần chạy lại tunnel; muốn link cố định thì dùng named tunnel với một tên miền, hoặc ngrok có domain tĩnh.
4. Bạn tạo phòng trên link đó, chia sẻ mã phòng cho bạn bè vào.
5. Chạy `npm run smoke -- <link tunnel>` trước buổi chơi để chắc mọi thứ hoạt động.

### 15.4 Lưu ý khi laptop làm server

- Tắt chế độ sleep khi đang chơi; đóng terminal hoặc tắt máy là ngắt game (khởi động lại thì game đang chơi vẫn còn trong DB và scheduler dựng lại timer).
- Chạy `db/backup.sh` (`pg_dump`) trước khi tắt máy nếu muốn giữ dữ liệu.
- Không commit các file `.env`; `ANTHROPIC_API_KEY` chỉ nằm trên máy bạn.
- Chỉ chạy một instance `be`.

### 15.5 Sau này

Muốn chạy thường trực thì thuê VPS, cài Node + PostgreSQL và chạy đúng `npm run build && npm start`; hoặc tách `fe` ra hosting tĩnh riêng (dùng `VITE_API_URL` và `CORS_ORIGIN`, mục 3.3). Việc này ngoài phạm vi v1.

---

## 16. Milestones và tiêu chí hoàn thành

| # | Nội dung | Tiêu chí xong |
|---|---|---|
| M0 | Khởi tạo repo với ba thư mục `db/`, `be/`, `fe/` và npm workspaces (mục 2.1): Express, React + Vite, Tailwind + daisyUI, Prisma, Vitest, ESLint, Prettier, các lệnh gốc, `db/docker-compose.yml`, `.env.example` mỗi thư mục | `npm run dev`, `npm test`, `npm run lint` chạy được từ thư mục gốc |
| M1 | Engine nền: `config`, `types`, `rng`, `money`, `accounts`, `ledger`, `statements`, `init` | Test ledger/statements/rng pass |
| M2 | Thị trường: chu kỳ, sự kiện, xúc xắc, cầu–cung ngành, giá, người dân, NHTW, room, chính phủ | Test macro pass; chạy 1.000 quý không NaN, trong biên |
| M3 | Kinh tế người chơi: bản đồ, doanh nghiệp, hành động (trừ tài trợ vốn đặc biệt), đấu giá, thuế, `resolve`, phá sản, kết thúc game | Test resolve/auction/tax/bankruptcy pass; bất biến 8.4 pass |
| M4 | Tài chính: vay, trái phiếu, cổ phiếu, xếp hạng, nhà đầu tư, `claimIdle`, tái cấp vốn; `explain.js`; `glossary.js` | Test credit/investors pass |
| M5 | Mô phỏng: bot, `npm run sim`, tinh chỉnh `config.js` | Đạt bảng mục tiêu 14.2 |
| M6 | `db`: schema + migration + `index.js` export `prisma`; `be`: auth token, API (mục 11), khóa chống xung đột, `scheduler` hạn chót, view model, API `preview` | `npm run smoke` pass local |
| M7 | UI đầy đủ (mục 12), `useGame` (polling trước, M8 thêm WebSocket), xem trước hành động, báo cáo, sổ cái, biểu đồ, kết quả, trang luật chơi | Chơi hết một ván 2 người trên 2 trình duyệt không lỗi |
| M8 | Realtime + LLM: `realtime.js` (Socket.IO), `useGame` nhận push + polling dự phòng, xúc xắc đồng bộ; `llm.js` (bản tin, lời vai trò, sự kiện flavor tùy chọn), `advisor.js`, dự phòng template, giới hạn chi phí | Chơi 2 trình duyệt thấy cập nhật tức thì; xóa key LLM vẫn chơi bình thường |
| M9 | Hoàn thiện: README, DECISIONS, kiểm tra mobile, xử lý lỗi/offline, chạy production `npm start` và qua Cloudflare Tunnel | `npm run smoke -- <link tunnel>` pass |
| M10 | (Tùy chọn) `tenderOffer` thâu tóm | Test hợp nhất sổ cái: Tài sản = Nợ + Vốn chủ cho cả hai bên |

### Definition of Done (toàn dự án)

- [ ] Một ván 2–6 người chơi hết N quý, kết thúc đúng điều kiện, xếp hạng đúng 5.8.
- [ ] Mọi bất biến 8.4 pass sau mỗi quý trong mô phỏng 300 ván.
- [ ] Bảng cân đối luôn hiển thị **tách** Tài sản / Nợ / Vốn chủ.
- [ ] Mọi quyết định của ngân hàng và nhà đầu tư đều có dòng giải thích lý do (mục 10).
- [ ] Lạm phát, lãi suất, thất nghiệp, room tín dụng phản ứng đúng chiều với hành vi của người chơi (hiển thị qua biểu đồ).
- [ ] Ba thư mục `db/`, `be/`, `fe/` tách riêng đúng mục 2.4 (fe không import be/db; be chỉ dùng DB qua `@tycoon/db`).
- [ ] Không có file TypeScript; không còn `Math.random`/`Date.now` trong `be/src/engine`.
- [ ] Realtime chạy qua Socket.IO và vẫn chơi được khi socket bị chặn (polling dự phòng).
- [ ] LLM bật/tắt bằng env; tắt hoặc lỗi thì game không bị ảnh hưởng; LLM không bao giờ thay đổi số liệu.
- [ ] `README.md`, `DECISIONS.md` có đủ nội dung; làm theo README là chạy được local và mở link cho bạn bè qua tunnel.

---

## 17. Ngoài phạm vi (v1)

Đăng nhập tài khoản, giao dịch tay đôi giữa người chơi, xếp hạng/lịch sử nhiều ván, thanh toán, đa ngôn ngữ ngoài tiếng Việt, ứng dụng native, chạy nhiều instance song song (cần Redis adapter cho Socket.IO), đưa lên server thường trực, TypeScript. Nâng cấp sau này: LLM đóng vai nhà đầu tư/người dân đối thoại trực tiếp, đàm phán giữa người chơi.
