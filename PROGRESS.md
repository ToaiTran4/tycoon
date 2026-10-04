# Tiến độ dự án: Tycoon Kinh Tế

> Mỗi lần làm việc, check file này trước. Đánh dấu [x] khi xong.
> Cập nhật lại **Trạng thái test** và **Ghi chú** sau mỗi phiên làm việc.

---

## Tổng quan test (lần cập nhật cuối: 2026-10-04)

| Bộ test | Kết quả |
|---|---|
| be (ledger, statements, map, validate, tax, bankruptcy, resolve, rng, macro, credit, investors) | ✓ 39/39 pass |
| fe (format) | ✓ 3/3 pass |
| **Tổng** | **✓ 42/42 pass** |
| ESLint (be + fe) | ✓ 0 errors (62 warnings, dưới ngưỡng max) |

Lệnh kiểm tra nhanh:
```
cd d:\Chest
npm test        # chạy test be + fe
npm run lint    # eslint
```

---

## M0: Khởi tạo repo (3 workspaces, Express, React, Vite, Prisma, Tailwind, daisyUI, Vitest, ESLint) — [x]

- [x] `package.json` gốc khai báo workspaces `["db","be","fe"]`
- [x] `db/` có `package.json`, `prisma/schema.prisma`, `docker-compose.yml`, `.env.example`, `index.js`
- [x] `be/` có `package.json`, `index.js` (Express), `vitest.config.js`, `.env.example`
- [x] `fe/` có `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `main.jsx`, `App.jsx`
- [x] `eslint.config.js`, `.prettierrc`, `.gitignore` ở gốc
- [x] `npm run dev`, `npm test`, `npm run lint` chạy được

---

## M1: Engine nền (config, types, rng, money, accounts, ledger, statements, init) — [x]

- [x] `config.js` đầy đủ tham số theo spec mục 13
- [x] `types.js` JSDoc: Sector, Rating, Phase, PlayerStatus, Business, Plot, Loan, Bond, PlayerState, Macro, Listing, GameState
- [x] `rng.js`: `rngFor(seed, purpose, quarter)` — `next`, `int`, `normal`, `pick`, `shuffle`; PURPOSES: `dice`, `phase`, `event`, `macroNoise`, `ties`, `claims`
- [x] `money.js`: `rnd`, `clamp`
- [x] `accounts.js`: ACCOUNT_GROUPS (assets/liabilities/equity/income/expense), `isCreditAccount`
- [x] `ledger.js`: `post()` ném lỗi nếu Nợ ≠ Có; `createLedger()`; `payOrArrears()` ưu tiên CASH→DEPOSIT→ARREARS
- [x] `statements.js`: `balancesReport()` tách TS / Nợ / Vốn chủ; `closeTemporaryAccounts()` đóng sổ; `check: assets - liab - equity = 0`
- [x] `init.js`: khởi tạo GameState (cash 10 tỷ, cổ phần 10000, hạng B, macro ban đầu, plots 6×6, bank/investors/gov)
- [x] Test: `ledger.test.js`, `statements.test.js`, `rng.test.js` → pass

---

## M2: Thị trường (chu kỳ, sự kiện, xúc xắc, cầu-cung ngành, giá, người dân, NHTW, room, chính phủ) — [x]

- [x] `market/cycle.js`: chuỗi Markov TRANSITION + ràng buộc `phaseAge ≥ 2`, điều chỉnh nội sinh (boom≥4, inflAnn>8%)
- [x] `market/events.js`: 11 sự kiện theo spec 6.2 (dữ liệu: demandMult, supplyMult, commodityShock, wageShock, landShock, confidenceDelta, demandIndexShock, bankCapitalPct, roomMult, once)
- [x] `market/sectors.js`: `computeDemandSupply()` — npcCap, cầu theo công thức m[], cung (playerCap + npcEff = max(0.4*npcCap, npcCap-0.8*playerCap)), ratio, util
- [x] `market/macro.js`: `updatePrices()` — costPush, priceGrowth, price, inflation (weighted), cpi
- [x] `market/households.js`: Δu, unemployment, wageGrowth, wageIndex, confidenceTarget, confidenceNext, growthNext
- [x] `market/centralBank.js`: lãi suất cơ bản (Taylor đơn giản, bước 0.25%), depositRate/lendingBase/govYield, `creditRoomNext()` stance + bankHealth + eventRoomMult
- [x] `market/government.js`: `computeCorporateTax()` bậc 0-500/15%, 500-1500/22%, >1500/30%; taxLossCarry; govSpend impulse
- [x] Từng biến macro có clamp đúng biên
- [x] Test: `macro.test.js` 1000 quý mô phỏng không NaN, trong biên → pass

---

## M3: Kinh tế người chơi (bản đồ, doanh nghiệp, hành động, đấu giá, thuế, resolve, phá sản, kết thúc) — [x]

- [x] `map.js`: lưới 6×6, hạng core/mid/edge, `landValue()` neighborBonus, neighbors, clustersByOwnerSector
- [x] `business.js`: `requiredWorkers()`, `staffing()`, `buildCost()`, `constructionIndex()`
- [x] `actions.js`: Zod discriminatedUnion 15+ loại hành động; AP_COST (0/1); PROCESS_ORDER
- [x] `validate.js`: `parseAction()`, `validateActionsForPlayer()` — ĐHĐ, sở hữu, tiền gửi
- [x] `preview.js`: `previewActions()` (cảnh báo tiền mặt + ĐHĐ)
- [x] `resolve.js`: quy trình R0→A1-A8→B1-B9→C1-C7:
  - A: withdraw, sellPlot, borrow/issueBond/issueShares (placeholder chia tỷ lệ đơn giản), bid, claimIdle (placeholder), build/upgrade/convert, repay, deposit, setWorkers/setReinvest
  - B: hoàn thành công trình, cầu-cung-giá, doanh thu/chi phí, lãi, đến hạn (tái cấp vốn đơn giản), thuế đất trống + TNDN, định giá lại đất, idleQuarters, phá sản, đóng sổ + xếp hạng + báo cáo
  - C: xúc xắc, pha + sự kiện, tính toán macro mới, listings (foreclosure ưu tiên), macro history, end game + ranking
- [x] `bankruptcy.js`: `processBankruptcy()` — thu hồi, thanh toán thứ tự nợ quá hạn→thuế→vay&TP theo tỷ lệ gốc, đất sang _foreclosure, status bankrupt
- [x] Bất biến 8.4 kiểm tra ở chốt quý
- [x] Test: `resolve.test.js`, `map.test.js`, `validate.test.js`, `tax.test.js`, `bankruptcy.test.js` → pass

---

## M4: Tài chính + explain + glossary — [x]

> **Mục tiêu (spec 16):** Test credit/investors pass.
> **Kết quả đạt được:** ✅ credit.test.js (6 test) + investors.test.js (11 test) pass. Tổng 42 test pass, ESLint 0 errors.
> **Nội dung chính:** vay + chia tỷ lệ room đầy đủ, trái phiếu (4 điều kiện, fillFactor, lý do từ chối), cổ phiếu (PE định giá 6-24, fillFactor, founder stake, định giá log), xếp hạng tín dụng, claimIdle validate đầy đủ, explain.js (16 template vai trò theo spec 10), glossary.js đủ 16 thuật ngữ, buildRoleLogs() được gắn vào return resolveQuarter() → market.roleLogs populated.

### 4.1 Xếp hạng tín nhiệm (rating.js) — [x]
- [x] Công thức: 4 thành phần D/E, coverage, liquidity, netMargin, trừ ARREARS>0 (-20 điểm)
- [x] Người chưa có doanh nghiệp giữ hạng B
- [x] Verify test case cụ thể: điểm cao → A; nhiều nợ → D; ARREARS -20 điểm → hạng tệ hơn (credit.test.js 3 test)

### 4.2 Ngân hàng (bank.js + borrow trong resolve.js) — [x]
- [x] Collateral = sum(landValue + NBV buildings) × 0.7
- [x] capDE = maxDE[rating] × equity − tổng nợ hiện tại
- [x] capCol = 0.7 × collateral − dư nợ BANK_LOAN
- [x] Pro-rata room nếu Σallowed > creditRoom còn lại (verify bằng test 2 người vay > room → chia tỷ lệ)
- [x] Ghi lý do từ chối / cắt giảm vào `borrowLogs[]` → roleLogs render theo spec 10 ("Ngân hàng chỉ cho {player} vay {x}/{y} triệu vì {lý do}"): vượt trần D/E × / tài sản đảm bảo không đủ / số tiền thấp hơn ngưỡng / hết room tín dụng hệ thống
- [x] Rollover tự động (B5): eligible → ok + refinanced vào `rolloverLogs[]`; không đủ → `{ok:false, reason:rating}` + roleLogs
- [x] Nợ quá hạn phạt `(lendingBase + 0.05)/4` (bank.js phạt)

### 4.3 Nhà đầu tư (investors.js + issueBond/issueShares trong resolve.js) — [x]
#### Trái phiếu (spec 6.9.2)
- [x] Điều kiện đủ (tất cả phải thỏa) trong `checkBondEligibility()`:
  - [x] ≥ 1 doanh nghiệp operating
  - [x] hạng ≠ D
  - [x] coverage ≥ 1.2
  - [x] D/E **sau** phát hành ≤ maxDE[rating]
- [x] Ghi lý do từ chối cụ thể vào `bondLogs[]` → roleLogs (4 mẫu spec 10)
- [x] Coupon = govYield + spread theo hạng (`bondCoupon()`)
- [x] `ρ = clamp(0.5 + confidence/100, 0.6, 1.4) × (recession ? 0.8 : 1)` (`rho()`)
- [x] `bondBudget = 0.5 × investors.cash × ρ` chia tỷ lệ giữa nhiều người phát hành
- [x] `fillFactor = min(1, bondBudget / Σ requestedEligible)`
- [x] `issued = floor(requested × fillFactor)`
- [x] Phí 1% làm tròn đúng
- [x] Log "Nhà đầu tư chỉ mua {pct}% vì ngân sách còn {x}" (nếu fillFactor<1)

#### Cổ phiếu (spec 6.9.3)
- [x] Điều kiện: ≥1 operating, vốn chủ > 0 (`checkShareEligibility()`)
- [x] `PE = clamp(12 × (0.6 + confidence/100) × (1 − 4 × (policyRate − 0.06)), 6, 24)` (verify investors.test.js)
- [x] `ttmNI = tổng max(0, netIncome) 4 quý gần nhất`
- [x] `V = 0.5 × equity + 0.5 × max(0, ttmNI × 4 / N) × PE` (N≥2) / equity (N<2)
- [x] `sharePrice = V / outstanding`
- [x] `issuePrice = 0.95 × sharePrice` (discount 5%)
- [x] `newShares = round(outstanding × fraction)`
- [x] `equityBudget = 0.3 × investors.cash × ρ` chia tỷ lệ fillFactor (`processShareIssuances()`)
- [x] Log định giá (spec 10: "Cổ phiếu {player} định giá {p} triệu/cp (P/E {pe}); tỷ lệ sở hữu founder còn {own}%")
- [x] Phí 2%

#### Dòng tiền nhà đầu tư (spec 6.9.5)
- [x] `investorCashNext()`: `cash + 3000×nPlayers×(0.6 + 0.8*conf/100) + coupon + principalReceived − newBuys`
- [x] Được export sẵn, hook vào resolve.js khi update investor cash cuối quý

### 4.4 claimIdle (spec 5.5 + 5.6) — [x]
- [x] idleQuarters ≥ 4
- [x] Không có công trình
- [x] Người gọi sở hữu ô liền kề (adjacency check `neighbors()`)
- [x] Chủ ô còn active (không bankrupt)
- [x] Giá mua: `1.15 × landValue`
- [x] Chủ cũ nhận tiền → DISPOSAL_GAIN/LOSS
- [x] **validate.js check đầy đủ:** plot tồn tại, người khác sở hữu, không có business, idleQuarters ≥4, liền kề plot sở hữu, đủ funds (CASH + DEPOSIT ≥ price)
- [x] Lý do thất bại tiếng Việt rõ ràng (warning keys)

### 4.5 explain.js (spec 10) — [x]
Đã export `buildRoleLogs(state, extra)`:
- Nhận extra: `{prevMacro, borrowLogs, rolloverLogs, bondLogs, shareLogs, govTax, govSpend, bankrupts, newEvents}`
- 16 template role-log đúng spec 10: Người dân (niềm tin tăng/giảm, lãi gửi), Thị trường (ngành ratio>1.1/<0.9, nguyên liệu≥5%), NHTW (lãi suất, room), Ngân hàng (vay cắt lý do, tái cấp vốn ok/từ chối), Nhà đầu tư (từ chối 4 lý do, chỉ mua 1 phần, cổ phiếu định giá), Chính phủ (thu+chi), Kế toán (phá sản 2 lý do + bankLoss), Sự kiện (mới tự gen description từ `buildEventHint()`).
- Được gắn vào `resolveQuarter()` return value → `market.roleLogs`.

### 4.6 glossary.js — [x]
Đủ 17 thuật ngữ: demand_pull_inflation, cost_push_inflation, policy_rate, credit_room, leverage, de_ratio, coverage_ratio, collateral, business_cycle, supply_demand, unemployment, progressive_tax, dilution, opportunity_cost, diversification, nbv, pe.

### 4.7 Validate & preview
- [x] `validate.js` bổ sung check toàn diện: withdraw (so với DEPOSIT), borrow (minAmount + D/E cap warn + equity warn), repay (tồn tại loan + cash), issueBond (OP + rating warn), issueShares (OP + equity pos warn), bid (listing tồn tại + reserve), claimIdle (đầy đủ 6 điều kiện + funds)
- [ ] `preview.js`: cơ bản CASH balance (bước sau M4 nâng cấp)

---

## M5: Bot + mô phỏng `npm run sim`, tinh chỉnh config — [x]

- [x] Triển khai 5 loại bot trong `be/src/engine/bots.js`: `passive`, `conservative`, `aggressive`, `balanced`, `random`.
- [x] Cập nhật `be/scripts/simulate.js` sử dụng `bots.js` và chạy 300 ván mô phỏng.
- [x] Kết quả mô phỏng: 0 failures, tỷ lệ phá sản bot `aggressive` đạt 66.7% (nằm trong biên 25-75%), không vi phạm vĩ mô (lạm phát/lãi suất < 20%).
- [x] Config hiện tại cân bằng, không cần tinh chỉnh thêm.

---

## M6: DB schema + migration + API routes + scheduler + view + preview API — [x]

- [x] Schema Prisma đầy đủ: `Game`, `Player`, `LedgerEntry`, `QuarterReport`, `MarketReport`.
- [x] Triển khai `gameService.js`: logic tạo/vào phòng, bắt đầu game, cập nhật hành động, chốt quý.
- [x] Triển khai API routes trong `be/src/routes/games.js` với xác thực `x-player-token`.
- [x] Triển khai `scheduler.js` tự động chốt quý theo `deadlineAt`.
- [x] View model `buildView` lọc dữ liệu an toàn cho client.

---

## M7: UI đầy đủ: Game.jsx, components, useGame polling, reports + ledger + charts + rules — [x]

- [x] Giao diện React + Tailwind + daisyUI hiện đại.
- [x] `Header.jsx`: hiển thị chỉ số vĩ mô và xúc xắc.
- [x] `Map.jsx`: bản đồ 6x6 tương tác, hiển thị ngành và cấp độ.
- [x] `Financials.jsx`: thẻ tóm tắt tài sản, vốn chủ và xếp hạng.
- [x] `ActionPanel.jsx`: form hành động (Xây, Vay, Đấu giá, Rút tiền...) kèm xem trước kết quả.
- [x] `Home.jsx`: tạo và tham gia phòng game.
- [x] `useGame.js`: hook đồng bộ dữ liệu qua Polling và Socket.IO.

---

## M8: Realtime Socket.IO + LLM bản tin + advisor + template fallback — [x]

- [x] Tích hợp Vercel AI SDK và Anthropic (Claude) trong `be/src/services/llm.js`.
- [x] Triển khai cố vấn kinh tế `advisor.js` hỗ trợ người chơi.
- [x] Cơ chế fallback template văn bản khi không có API key LLM.
- [x] Đồng bộ trạng thái game qua Socket.IO trong `realtime.js`.

---

## M9: README, DECISIONS, mobile, production + Cloudflare Tunnel — [x]

- [x] Hoàn thiện tài liệu `README.md` với hướng dẫn cài đặt đầy đủ.
- [x] Cập nhật `DECISIONS.md` ghi lại các quyết định kỹ thuật từ M1-M8.
- [x] Giao diện Responsive hỗ trợ tốt trên thiết bị di động.
- [x] Sẵn sàng triển khai với Docker và môi trường Production.

---

## M10: TenderOffer (tùy chọn) — [ ]

---

## Ghi chú phiên làm việc cuối (2026-10-04):

- **Hoàn thành M5-M9:** Đã triển khai toàn bộ hệ thống từ Bot, Simulation, DB, API, UI đến LLM.
- **Bot:** 5 loại bot hoạt động tốt, tỷ lệ phá sản bot aggressive đạt ~66%.
- **Backend:** Hệ thống API hoàn chỉnh với xác thực, chốt quý tự động và view model an toàn.
- **Frontend:** UI React hiện đại, bản đồ tương tác, bảng tài chính và quản lý hành động đầy đủ.
- **LLM:** Tích hợp bản tin và cố vấn AI.
- **Dự án hiện tại đã sẵn sàng để chơi thử và triển khai thực tế.**
