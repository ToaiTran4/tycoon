# Bộ prompt nâng cấp v2 — Tycoon Kinh Tế

## Cách dùng

1. Đặt **Khối quy tắc chung** (ngay bên dưới) vào file hướng dẫn của công cụ AI trong repo (ví dụ `AGENTS.md`, `CLAUDE.md` hoặc `.github/copilot-instructions.md`). Nếu công cụ không có file đó thì dán khối này trước mỗi prompt.
2. Chạy theo thứ tự. Sau **mỗi** prompt: chạy `npm run lint && npm test`, đọc lại thay đổi, commit, rồi mới sang prompt sau. Không gộp nhiều prompt vào một lần.
3. Bạn đang làm giao diện, nên thứ tự gợi ý là: P0 → P1 → P2 (hợp đồng dữ liệu + dữ liệu giả) → P3, P4, P5 (giao diện chạy bằng dữ liệu giả) → P6 đến P13 (engine, server, bot).
4. Nếu AI đề nghị đổi một quyết định đã chốt, trả lời: "giữ nguyên theo PROJECT_SPEC.md".
5. Mỗi prompt nằm trong một khối code để copy nguyên khối.

| Prompt | Việc |
|---|---|
| P0 | Khảo sát hiện trạng, chưa sửa code |
| P1 | Cập nhật `PROJECT_SPEC.md` lên v2 |
| P2 | Hợp đồng dữ liệu (view model) và dữ liệu giả cho giao diện |
| P3 | Giao diện: khung chính và bản đồ |
| P4 | Giao diện: chỉ số, hộp thư, form vay, đối thủ, nhà nước, dân số |
| P5 | Giao diện: phòng tập bot, replay, hướng dẫn, báo cáo cuối ván |
| P6 | Engine: bản đồ mới, tiền ×10, dân số, lao động |
| P7 | Engine: mùa vụ, thời tiết, thiên tai |
| P8 | Engine: hạ tầng và nhà nước |
| P9 | Engine: giá đất, thông tin ai được biết gì, xếp hạng ước tính |
| P10 | Engine: vay ngân hàng và hộp thư |
| P11 | Engine: chỉ số vĩ mô và chỉ số doanh nghiệp |
| P12 | DB, API, realtime, log dữ liệu huấn luyện |
| P13 | Bot, phòng tập, mô phỏng và cân bằng |

---

## Khối quy tắc chung (dán vào file hướng dẫn của AI)

```
Bối cảnh: game kinh doanh theo quý "Tycoon Kinh Tế". Repo có 3 thư mục tách riêng:
db/ (Prisma + PostgreSQL), be/ (Express + Socket.IO + engine thuần), fe/ (React + Vite).
Tài liệu gốc: PROJECT_SPEC.md (sau prompt P1 là bản v2).

Quy tắc bắt buộc:
- Chỉ JavaScript (ESM), KHÔNG TypeScript. Cần mô tả kiểu thì dùng JSDoc @typedef.
- Tiền là số nguyên, đơn vị triệu đồng; không dùng số thực cho số dư.
- be/src/engine là code thuần: không import express/react/prisma, không I/O,
  không Math.random/Date.now/new Date. Ngẫu nhiên chỉ qua rngFor(seed, purpose, quarter).
- Mọi hằng số và tham số cân bằng đặt trong be/src/engine/config.js.
  Không hard-code số ở nơi khác.
- Mọi bút toán đi qua ledger.post() (Nợ = Có).
- fe chỉ nói chuyện với be qua HTTP/WebSocket, không import code từ be hoặc db.
  be chỉ dùng database qua @tycoon/db.
- Ưu tiên dùng thư viện có sẵn thay vì tự viết lại.
- Làm từng bước nhỏ, mỗi bước chạy được test. Không refactor ngoài phạm vi yêu cầu.
  Không xóa hay sửa test đang có chỉ để cho pass.
- Khi xong: chạy npm run lint && npm test, liệt kê file đã tạo/sửa, nêu điều chưa làm
  và các giả định đã dùng (ghi vào DECISIONS.md).
- Nếu yêu cầu mâu thuẫn với code hiện có, nêu rõ chỗ mâu thuẫn và chọn phương án
  nhỏ nhất. Đừng im lặng bỏ qua.
- Code dễ đọc cho người mới học: hàm nhỏ, tên rõ ràng, comment tiếng Việt ngắn
  ở chỗ công thức kinh tế.
```

---

## P0 — Khảo sát hiện trạng (chưa sửa code)

```
Hãy khảo sát toàn bộ repo (db/, be/, fe/) và so với PROJECT_SPEC.md hiện tại.
KHÔNG sửa code ở bước này. Tạo file docs/AUDIT.md gồm:

1. Phần đã làm xong, làm dở, chưa làm (theo từng mục của spec).
2. Chỗ code khác với spec (tên, công thức, tham số, API, schema DB).
3. Danh sách API hiện có (method, đường dẫn, request, response) và các sự kiện Socket.IO.
4. Danh sách màn hình và component fe hiện có, mỗi component lấy dữ liệu từ đâu.
5. Tham số tiền trong config.js hiện tại (vốn đầu, giá đất, chi phí xây, lương, doanh thu,
   ngưỡng thuế, room, vốn ngân hàng) để so với bảng nhân 10 lần ở bản v2.
6. Test hiện có và test đang fail (nếu có).
7. Rủi ro khi nâng lên v2: module nào bị ảnh hưởng, migration DB nào cần.

Kết thúc bằng 10 dòng tóm tắt.
```

---

## P1 — Cập nhật PROJECT_SPEC.md lên v2 (chỉ sửa tài liệu)

```
Hãy cập nhật PROJECT_SPEC.md lên bản v2. CHỈ sửa tài liệu, KHÔNG sửa code.
Giữ nguyên đánh số các mục cũ nếu không bắt buộc đổi. Thêm phần "Changelog v2" ở đầu file.
Thêm các mục mới dưới đây với đúng tên V2-A … V2-L (các prompt code sau này sẽ tham chiếu
theo tên). Với mỗi mục mới, ghi công thức, bảng tham số, quy tắc và ví dụ số. Mọi tham số
cân bằng phải được ghi để đưa vào config.js. Cuối cùng sửa các mục cũ bị xung đột (danh sách ở cuối).

=== V2-A. Quy mô tiền và bảng tham số (nhân 10 lần) ===
Nhân mọi số tiền lên 10 lần, công thức giữ nguyên:
- startCash 100.000 (100 tỷ); unitValue 10.000 (1 đơn vị công suất ở giá 1,0 = 10.000 triệu doanh thu/quý).
- Chi phí xây cấp 1 / nâng lên cấp 2 / nâng lên cấp 3: nông nghiệp 10.000/13.000/18.000;
  bất động sản 15.000/20.000/28.000; công nghệ 13.000/18.000/26.000; du lịch 12.000/16.000/23.000.
- loan.minAmount 5.000; bond.minAmount 10.000; thuế TNDN bậc 5.000 và 15.000 (thuế suất giữ 15/22/30%);
  roomPerPlayer 25.000; bank.capital0 200.000 (cộng 3.000/quý); investors.cashPerPlayer 60.000,
  inflowPerPlayer 30.000. Cổ phiếu khởi đầu vẫn 10.000 cổ phiếu (giá 10 triệu/cổ phiếu).
- Bỏ levels.workers và baseWage. Thay bằng bảng theo ngành (cấp 1; cấp 2 và 3 = cấp 1 × 2,1 và × 3,3, làm tròn):
  nông nghiệp 150 lao động, 13,3 triệu/người/quý (khoảng 4,4 triệu/tháng), tổng lương cấp 1 = 2.000;
  du lịch 100 lao động, 22 triệu/quý (7,3 triệu/tháng), tổng 2.200;
  công nghệ 60 lao động, 50 triệu/quý (16,7 triệu/tháng), tổng 3.000;
  bất động sản 40 lao động, 40 triệu/quý (13,3 triệu/tháng), tổng 1.600.
  (Tỷ lệ lương trên doanh thu giữ như bản cũ. Lương thực trả = số lao động × lương/người × chỉ số lương của khu.)
- Bỏ hành động setWorkers. Doanh nghiệp xây xong tự tuyển đủ số lao động của cấp (nếu nguồn lao động đủ,
  xem V2-C). Chi phí tuyển = 0,2 × lương một quý cho mỗi người mới tuyển (khi hoàn thành hoặc nâng cấp).
  Không có sa thải trong v2.

=== V2-B. Bản đồ, vùng, địa hình, mục đích đất ===
Thay lưới 6×6 bằng lưới 10×8 = 80 ô (x 0–9, y 0–7), mẫu CỐ ĐỊNH (không ngẫu nhiên), có test kiểm đếm.
- Ba vùng theo mật độ dân cư (theo cột): đô thị x 0–2 (đông), ven đô x 3–5 (vừa), nông thôn–ven biển x 6–9 (thưa).
  Mỗi vùng chia thành 2 khu (bắc y 0–3, nam y 4–7), tổng 6 khu. Chỉ số hạ tầng tính theo khu.
- Mặt nước: một con sông chạy ngang (hàng y = 3, x 0–8) và biển ở cột x = 9; tổng khoảng 17 ô.
- Mục đích sử dụng đất của mỗi ô: residential (đất ở của người dân, người chơi không mua được),
  business (đất kinh doanh, người chơi mua), public (đường, trường, bệnh viện; mỗi khu 2 ô, tổng 12), water.
  Mục tiêu: business 31 (đô thị ~9, ven đô ~10, nông thôn–ven biển ~12), residential 20, public 12, water 17.
- Mỗi ô có: zone, district, use, elevation (high/mid/low), waterAdjacency (none/river/canal/coast),
  soil (alluvial/acid/saline). Quy tắc: ô sát sông hoặc cột x ≥ 7 là thấp (low); đô thị là cao (high);
  còn lại trung bình. Đất nhiễm mặn (saline) ở cột x ≥ 7; đất phù sa (alluvial) gần sông; còn lại phèn (acid).
- Ngành được phép theo ô: agri chỉ ở ven đô và nông thôn (không ở đô thị); tourism ở ô sát nước hoặc đô thị/ven đô;
  tech và real_estate ở đô thị và ven đô. Chuyển mục đích sử dụng đất: để giai đoạn sau.
- Hiển thị: ô ở dùng biểu tượng người dân 3 màu theo vùng (kèm 1, 2, 3 hình người để người mù màu phân biệt).
  Bỏ phân hạng core/mid/edge cũ.

=== V2-C. Dân số và lao động ===
- Dân số theo vùng và theo 5 nhóm tuổi: 0–14, 15–24, 25–54, 55–64, 65+. Tổng khoảng 80.000 cho 4 người chơi
  (co giãn tuyến tính theo số người, tối thiểu 50%). Tỷ lệ chia vùng: đô thị 50%, ven đô 32%, nông thôn 18%.
  Cơ cấu tuổi ban đầu theo cấu hình (ví dụ 22/15/45/10/8 %).
- Cập nhật mỗi năm game (cuối quý chia hết cho 4):
  sinh = tỷ lệ sinh × dân số vùng (đô thị 12‰, ven đô 14‰, nông thôn 16‰);
  chuyển nhóm tuổi theo độ dài nhóm (1/15, 1/10, 1/30, 1/10 mỗi năm);
  tử vong theo nhóm mỗi năm: 0,1% / 0,1% / 0,3% / 1% / 4,5%.
- Tỷ lệ tham gia lao động: 0% / 45% / 85% / 60% / 10%. Lực lượng lao động = Σ nhóm × tỷ lệ.
- Di cư giữa các vùng mỗi năm: điểm hấp dẫn A_z = 0,4×(1 − thất nghiệp_z) + 0,25×(lương thực_z chuẩn hóa)
  + 0,2×(hạ tầng xã hội_z/100) + 0,15×(1 − chỉ số thiệt hại thiên tai_z). Mỗi năm 2% dân 15–54 của vùng có A thấp
  hơn trung bình chuyển sang vùng có A cao hơn, tỷ lệ theo chênh lệch (hằng số trong config).
- Thất nghiệp theo vùng: u_z = clamp(u_nền_z − việc làm do người chơi tạo_z / lực lượng lao động_z, 1%, 20%),
  trong đó u_nền_z theo chu kỳ và tăng trưởng như công thức cũ cộng chênh lệch vùng (đô thị 4%, ven đô 5%, nông thôn 7%).
  Thất nghiệp toàn quốc = trung bình theo lực lượng lao động.
- Tuyển dụng: doanh nghiệp lấy lao động từ người thất nghiệp của vùng mình, cộng một phần của vùng lân cận:
  0,25 × (hạ tầng giao thông khu đó/100) × số thất nghiệp vùng lân cận. Nhiều doanh nghiệp tranh cùng nguồn thì chia
  tỷ lệ. Thiếu người: staffing = đã tuyển / yêu cầu < 1 làm giảm công suất, đồng thời chỉ số lương của vùng tăng thêm
  0,05 × max(0, 4% − u_z) mỗi quý. Chỉ số lương tách theo vùng, lương nền: đô thị 1,15, ven đô 1,0, nông thôn 0,85.
- Cầu cơ sở của mỗi ngành tỷ lệ với tổng dân số so với dân số ban đầu (thay cho hằng số theo số người chơi).
- Số trẻ em tác động tới nhu cầu hạ tầng xã hội (trường học) và cầu tiêu dùng. Ghi rõ: trẻ sinh ra trong ván chưa
  vào lực lượng lao động trước khi ván kết thúc, vì ván chỉ dài khoảng 5 năm game.

=== V2-D. Khí hậu, mùa vụ, thiên tai (mặc định ĐBSCL) ===
- Quý trong năm = ((quý − 1) mod 4) + 1. Ván bắt đầu ở quý 1 của năm 1 (cho phép cấu hình quý bắt đầu).
- Mùa vụ (biết trước), hệ số cầu theo quý 1/2/3/4: nông nghiệp 1,05/1,10/0,95/0,90; du lịch 1,25/1,10/1,15/0,80;
  công nghệ 1,00/1,00/1,00/1,05; bất động sản 0,95/1,05/1,00/1,05. Chi phí xây ×1,05 ở quý 3 và 4 (mùa mưa).
- Bốn loại thiên tai: bão/áp thấp (typhoon), lũ/triều cường (flood), xâm nhập mặn (salinity), hạn (drought).
  Xác suất cơ bản theo quý 1/2/3/4: typhoon 0,01/0,03/0,18/0,15; flood 0,02/0,05/0,20/0,28;
  salinity 0,35/0,30/0,02/0,03; drought 0,20/0,18/0,03/0,02. Hạn đang xảy ra nhân xác suất mặn lên 1,5.
- Mức phơi nhiễm theo ô: typhoon theo vùng (nông thôn–ven biển 1,0; ven đô 0,5; đô thị 0,4);
  flood theo địa hình (thấp 1,0; trung bình 0,5; cao 0,1), ven sông nhân 1,3; salinity cao ở ô ven biển và đất saline;
  drought theo ngành nông nghiệp.
- Dự báo: đầu mỗi quý hiển thị cho từng loại thiên tai mức thấp/vừa/cao và phần trăm (= xác suất thật × (1 + nhiễu
  N(0; 0,2)), chặn trong khoảng hợp lý). Kết quả thật được bốc lúc chốt quý, TRƯỚC bước vận hành.
- Mức độ khi xảy ra: nhẹ 0,4 / vừa 0,7 / nặng 1,0 (bốc theo rng). Thiệt hại cho mỗi doanh nghiệp:
  doanh thu mất = 15% × mức độ × phơi nhiễm × (1 − bảo vệ) × doanh thu quý; chi phí sửa chữa = 4% × mức độ × phơi nhiễm
  × (1 − bảo vệ) × nguyên giá công trình (tài khoản chi phí DISASTER_LOSS). Hệ số theo ngành: nông nghiệp ×1,5
  (flood, salinity, drought); du lịch ×1,3 (typhoon, flood); công nghệ và bất động sản ×0,6.
  Salinity: nông nghiệp ở ô phơi nhiễm mất thêm 25% × mức độ. Drought: nông nghiệp mất 15% × mức độ sản lượng.
  Bảo vệ = giảm theo mức gia cố của doanh nghiệp (0/40%/70%) cộng 50% × chỉ số hạ tầng thủy lợi của khu/100,
  tối đa 85%.
- Hành động mới `fortify {plotId}` (1 ĐHĐ): nâng mức gia cố 0→1→2 (cống ngăn mặn, gia cố chống bão/lũ),
  chi phí 8% và 15% nguyên giá công trình, hiệu lực vĩnh viễn.
- Tác động vĩ mô: niềm tin −3 × mức độ; cung NPC của ngành nông nghiệp ×(1 − 0,15 × mức độ) trong quý (giá tăng);
  chỉ số thiệt hại thiên tai theo vùng (damageIndex_z, giảm 40% mỗi quý) tăng theo thiệt hại và đưa vào di cư,
  giá đất và ưu tiên hạ tầng. Bỏ sự kiện harvest_fail cũ (đã thay bằng thời tiết). Các sự kiện kinh tế còn lại giữ nguyên.
- Bảo hiểm thiên tai: ghi chú "giai đoạn sau", không làm ở v2.

=== V2-E. Hạ tầng và Nhà nước ===
- Ba loại hạ tầng, chỉ số 0–100 theo từng khu: giao thông (logistics, đi lại, nguồn lao động), thủy lợi–chống thiên tai
  (giảm thiệt hại), dịch vụ xã hội (điện nước, trường, y tế: giữ dân, giảm di cư, tăng năng suất chậm).
  Giá đất cũng phản ánh hạ tầng nhưng chỉ là một trong các kênh.
- Tác động cụ thể: giá vốn × (1 − 0,10 × giao thông/100); nguồn lao động lân cận (V2-C); bảo vệ thiên tai (V2-D);
  điểm hấp dẫn di cư (V2-C); năng suất × (1 + 0,05 × xã hội/100), áp dụng cho mọi doanh nghiệp trong khu.
- Hạ tầng xuống cấp 0,5 điểm/quý nếu không bảo trì.
- Nhà nước là module riêng chia 4 bộ phận, chạy theo quy tắc và minh bạch: centralBank (lãi suất, room: đã có),
  treasury (thuế, ngân sách), planning (dự án hạ tầng), disasterRelief (quỹ dự phòng).
- Ngân sách mỗi quý = thuế thu từ người chơi (TNDN, thuế đất trống, phí giao dịch đất) + thuế nền từ nền kinh tế NPC
  (4% × cầu danh nghĩa). Chia: 25% kích cầu (govImpulse như cũ), 50% dự án hạ tầng, 15% bảo trì, 10% quỹ dự phòng thiên tai.
  Quỹ dự phòng chi 30% chi phí khôi phục hạ tầng công và giảm damageIndex khi có thiên tai; người chơi không được bồi thường.
- Phong cách điều hành (chủ phòng chọn, mặc định cân bằng): balanced, growth, equity.
- Điểm ưu tiên dự án của mỗi khu:
  ưu tiên = w1×thiếu hụt + w2×dân số được phục vụ + w3×hoạt động kinh tế + w4×thiệt hại thiên tai gần đây − w5×chi phí.
  Các thành phần chuẩn hóa về 0–1: thiếu hụt = (100 − chỉ số)/100; dân số = dân khu/dân khu lớn nhất; kinh tế = (doanh thu
  doanh nghiệp + việc làm trong khu)/giá trị lớn nhất; thiệt hại = damageIndex; chi phí = chi phí dự án/chi phí lớn nhất.
  Trọng số (w1..w5): balanced 0,30/0,25/0,20/0,15/0,10; growth 0,15/0,15/0,45/0,15/0,10; equity 0,40/0,30/0,05/0,15/0,10.
  Loại dự án chọn theo nhu cầu lớn nhất của khu (thiên tai gần đây → thủy lợi; dân đông mà dịch vụ xã hội thấp → xã hội;
  còn lại → giao thông).
- Dự án: {id, khu, loại, chi phí (20.000–60.000), quý công bố, quý khởi công, quý hoàn thành, mức tăng +10 đến +25}.
  Công bố trước 1–2 quý, thi công 2–4 quý, hiệu lực khi hoàn thành. Mỗi quý chọn các dự án điểm cao nhất trong ngân sách.
  Mỗi quyết định có dòng "vì sao" và thông báo công khai cho mọi người.
- Chế độ cho người chơi đóng vai nhà nước: ghi chú "giai đoạn sau".

=== V2-F. Giá đất và giao dịch đất ===
- Giá thị trường thật (ẩn, không ai thấy):
  landValue = giá nền vùng × landIndex × (1 + vị trí) × (1 + hạ tầng) × (1 − rủi ro) × (1 + hàng xóm).
  Giá nền (triệu/ô): đô thị 18.000, ven đô 10.000, nông thôn 5.000. Vị trí: +10% nếu sát sông/biển hoặc sát đường.
  Hạ tầng = 0,3 × (trung bình 3 chỉ số của khu/100 − 0,5), nằm trong ±15%. Rủi ro = 0,2 × rủi ro ô (0–1, từ địa hình,
  ven biển, thiệt hại gần đây), tối đa 20%. Hàng xóm: +4% cho mỗi ô liền kề có doanh nghiệp đang vận hành, tối đa +12%.
- Người chơi thấy 3 loại giá:
  (1) giá tham chiếu theo khu: công khai, trung bình mượt 4 quý của landValue trong khu, trễ 1 quý;
  (2) giá khởi điểm đang rao = landValue × U(0,9; 1,1) (bốc theo rng, lưu cố định trong listing); giá sàn đấu giá = giá rao;
      ô phát mại: sàn = 0,8 × landValue;
  (3) giá ngân hàng định giá = 0,85 × landValue (đất) hoặc giá trị còn lại (công trình): chỉ hiện trong hồ sơ vay.
- Phí giao dịch đất 2% giá trị trên mỗi lần mua và mỗi lần bán (kể cả claimIdle), ghi vào chi phí FEES, thu vào ngân sách nhà nước.
- Kết quả đấu giá công khai: ô, người trúng, giá trúng, số giá thầu. Giá thầu thua và số tiền các bên còn lại ẩn.

=== V2-G. Thông tin: ai được biết gì ===
Quy tắc nền: tầng engine tạo state đầy đủ; mọi dữ liệu gửi cho người chơi PHẢI đi qua hàm projectViewFor(state, playerId).
- Công khai ngay: chủ ô đất, ngành, cấp và trạng thái xây dựng của doanh nghiệp (nhìn thấy trên bản đồ), chỉ số vĩ mô,
  tin tức, thiên tai và dự báo, đất đang rao, kết quả đấu giá (người trúng, giá trúng), dự án hạ tầng đã công bố, phát hành
  trái phiếu/cổ phiếu (là sự kiện thị trường).
- Công khai có trễ: giá tham chiếu khu (trễ 1 quý).
- Riêng tư (chỉ chủ sở hữu): tiền mặt, tiền gửi, khoản vay, lãi lỗ chi tiết, sổ cái, hành động đang soạn, giá thầu thua,
  lý do và checklist hồ sơ vay, mức R&D, mức gia cố, hộp thư.
- Lộ khi có điều kiện: báo cáo tài chính và xếp hạng tín nhiệm của một người chơi chỉ công khai cho người khác trong quý
  người đó phát hành trái phiếu hoặc cổ phiếu (và giữ bản mới nhất đã công bố, ghi rõ "công bố ở quý t").
- Xếp hạng trong ván: chỉ hiển thị ước tính. Ước tính quy mô = tài sản nhìn thấy được (đất theo giá tham chiếu khu,
  công trình theo chi phí xây công khai theo ngành và cấp), hiển thị dạng khoảng ±15%, không gồm tiền và nợ. Ba tiêu chí:
  quy mô (ước tính), hiệu quả (ROE, "chưa công bố" nếu chưa công bố), an toàn (hạng tín nhiệm, "chưa công bố" nếu chưa
  công bố). Xếp hạng thật chỉ công bố cuối ván. Khi ván kết thúc, mở toàn bộ báo cáo và sổ cái.
- Sửa các chỗ cũ đang lộ: bản tin công khai mọi giá thầu; báo cáo tài chính của mọi người công khai mỗi quý;
  endpoint sổ cái và báo cáo xem được của người khác; lastReports trong view model.

=== V2-H. Vay ngân hàng và hộp thư ===
- Hành động borrow có thêm purpose: 'build' (xây/nâng cấp) hoặc 'working' (vốn lưu động).
- Điều kiện (mỗi điều kiện có mã lý do):
  NO_BUSINESS (loại working cần ≥ 1 doanh nghiệp đang vận hành); RATING_D (hạng D bị từ chối); ARREARS (đang có nợ quá hạn);
  DE_CAP (D/E sau vay > trần theo hạng); COLLATERAL (dư nợ ngân hàng sau vay > 70% giá ngân hàng định giá tài sản);
  COVERAGE (loại working: hệ số thanh toán lãi < 1,2 sau khi tính lãi vay mới); EQUITY_CONTRIBUTION (loại build: số vay
  vượt 70% tổng chi phí xây/nâng cấp đang soạn trong cùng quý, tức vốn đối ứng < 30%); WORKING_CAP (loại working: vượt 30%
  doanh thu quy năm); ROOM (hết room, được chia tỷ lệ).
- Kết quả: APPROVED (đủ), PARTIAL (một phần, kèm mã lý do và số tiền được duyệt), REJECTED (kèm danh sách điều kiện chưa
  đạt và gợi ý khắc phục bằng tiếng Việt). Thông báo gửi vào hộp thư.
- Xem trước hồ sơ (không ràng buộc): trả checklist từng điều kiện (đạt/không đạt, giá trị hiện tại, ngưỡng) và mức khả năng
  duyệt cao/vừa/thấp: mọi điều kiện đạt và số xin vay < 10% room → cao; đạt nhưng 10–30% room → vừa; còn lại → thấp.
  Ghi chú trong giao diện "đang có người khác cùng xin vay" vì room được chia tỷ lệ.
- Hộp thư (Message): loại bank, investor, government, accountant, weather, system; mức info/good/warn; tiêu đề, nội dung,
  mã lý do, đã đọc hay chưa; có thể gửi riêng một người hoặc cho tất cả.

=== V2-I. Chỉ số ===
Chỉ số vĩ mô (hiển thị theo ba tầng nền kinh tế / ngành / doanh nghiệp):
- Tăng trưởng (hiển thị quy năm) và lạm phát (quy năm) ghép thành "nhiệt kế" 2×2: tăng trưởng ≥ 4%/năm là cao; lạm phát
  ≥ 5%/năm là cao. Nhãn: cao+thấp = Thuận lợi; cao+cao = Quá nóng; thấp+cao = Đình lạm; thấp+thấp = Suy thoái.
  Không hiển thị GDP tuyệt đối.
- Lãi suất thực (vay và gửi) = lãi suất danh nghĩa − lạm phát quy năm; lương thực tế = chỉ số lương/CPI (theo vùng);
  chỉ số giá đất; sức khỏe ngân hàng = vốn ngân hàng/vốn ban đầu; thất nghiệp theo vùng và toàn quốc; niềm tin;
  mức sử dụng room tín dụng; thiếu hàng/thừa hàng theo ngành (đã có).
Chỉ số doanh nghiệp (5 chỉ số trả lời "mình kinh doanh có tốt không", mỗi chỉ số có đèn xanh/vàng/đỏ, xu hướng so với quý
trước, một câu giải thích, và so với mức chuẩn của ngành):
1. Biên lợi nhuận ròng (quý và 4 quý gần nhất).
2. ROE = lợi nhuận ròng 4 quý (không gồm đánh giá lại) / vốn chủ.
3. An toàn vay = D/E kết hợp hệ số thanh toán lãi (xanh: D/E < 1 và hệ số > 3; vàng: dưới trần D/E và hệ số ≥ 1,5; đỏ: còn lại).
4. Thời gian sống sót (quý) = (tiền + tiền gửi) / chi phí tiền cố định mỗi quý (lương, bảo trì, lãi, coupon).
5. Công suất đang dùng so với công suất hòa vốn của từng doanh nghiệp, hòa vốn u* = (lương + bảo trì + khấu hao + chi phí tuyển)
   / (doanh thu ở 100% công suất × (1 − tỷ lệ R&D) − giá vốn ở 100% công suất).
- Chỉ số ghép quan trọng: ROIC so với lãi vay bình quân. ROIC = EBIT 4 quý × (1 − thuế suất hiệu dụng) / (nợ + vốn chủ);
  lãi vay bình quân có trọng số theo dư nợ. Hiển thị "vay đang có lợi" khi ROIC > lãi vay, ngược lại cảnh báo.
- Mức chuẩn của ngành: engine tính biên lợi nhuận mô hình ở công suất thị trường hiện tại của từng ngành (benchmark).
Tham số ngưỡng đưa vào config.js. Bổ sung thuật ngữ vào glossary.

=== V2-J. Dữ liệu huấn luyện (log) ===
Ghi log từ bây giờ để sau này huấn luyện AI điều hành doanh nghiệp và quản lý thị trường (chưa làm huấn luyện).
Mỗi quý, mỗi tác nhân ghi 1 bản: gameId, quarter, actorType (human | bot:<hồ sơ> | system:<vai>), actorId,
observation (chính view đã chiếu riêng cho tác nhân đó, không phải state đầy đủ), actions, outcome (thay đổi chỉ số kết quả),
thinkMs (với người), ruleVersion, configHash, seed, thời điểm. Tác nhân system gồm: centralBank, treasury, planning,
disasterRelief, bank, investors, household (đầu vào và quyết định của từng vai). Có script xuất JSONL. Ghi trong cùng transaction chốt quý.

=== V2-K. Giao diện: danh mục thành phần ===
Liệt kê và đặt chỗ ngay cho: thanh trạng thái (quý, mùa, đồng hồ); bảng thời tiết–dự báo–độ mặn; bản đồ 10×8 với các lớp
bật tắt (địa hình, mật độ dân, hạ tầng, rủi ro thiên tai, chủ sở hữu, giá đất) và viền 3 vùng; chi tiết một ô (3 loại giá,
3 chỉ số hạ tầng, rủi ro, hàng xóm, nguồn lao động gần đó, lịch sử giá trúng); tháp dân số theo vùng; hộp thư; form vay và
phát hành có checklist; bảng chỉ số 3 tầng và nhiệt kế 2×2; 5 chỉ số doanh nghiệp có đèn; thẻ đối thủ với nhãn
"ước tính"/"chưa công bố"; xếp hạng 3 tiêu chí; bảng nhà nước (dự án hạ tầng đã công bố, phong cách, ngân sách, nhật ký
"vì sao"); nhật ký "vì sao" có lọc theo vai; cố vấn LLM; replay theo quý; phòng tập bot (chọn hồ sơ bot, tạm dừng, từng bước,
chế độ "xem tất cả" có banner cảnh báo); hướng dẫn quý đầu; báo cáo cuối ván kiểu chẩn đoán.

=== V2-L. Chế độ thời gian ===
Hai chế độ phòng: relaxed (không giới hạn) và standard (hạn chót mỗi quý, mặc định 240 giây, có đồng hồ). Chế độ đồng hồ
cờ vua (mỗi người có quỹ thời gian tổng) để giai đoạn sau; giao diện hiển thị lựa chọn đó ở trạng thái "sắp có".

=== Sửa các mục cũ bị xung đột ===
- Mục luật chơi và bản đồ: lưới 6×6 → 10×8; bỏ tier core/mid/edge; công thức landValue cũ → V2-F; thêm use/zone/district.
- Mục 5.5 bảng hành động: bỏ setWorkers; thêm fortify; borrow có purpose; thêm purpose vào schema Zod.
- Mục 5.7: đấu giá công khai chỉ người trúng và giá trúng.
- Mục 6.3 và 6.5: laborForce = 1500 × số người chơi → mô hình dân số V2-C; unemployment theo vùng; wageIndex theo vùng.
- Mục 6.2 bảng sự kiện: bỏ harvest_fail; thêm tham chiếu V2-D.
- Mục 6.8: ngân sách và thuế theo V2-E; thêm phí giao dịch đất.
- Mục 7 và 8: bỏ workers cố định; tài khoản mới DISASTER_LOSS; phí giao dịch ghi FEES.
- Mục 11 (API) và 11.1 (view model): mọi view qua projectViewFor; bỏ lastReports công khai; thêm endpoint hộp thư, xem trước
  hồ sơ vay, thông tin ô đất, dân số, nhà nước. Mục 4.2 (kiểu dữ liệu): Plot, Macro, PlayerState, GameState có trường mới.
- Mục 12 (UI) và 13 (config) và 14 (mô phỏng) và 16 (milestone): cập nhật theo V2-K, V2-A và các mục mới.
- Cập nhật Definition of Done.

Khi xong, liệt kê các mục đã sửa và các chỗ còn mâu thuẫn hoặc mơ hồ (nếu có) để tôi quyết.
```

---

## P2 — Hợp đồng dữ liệu (view model) và dữ liệu giả

```
Đọc PROJECT_SPEC.md bản v2 (đặc biệt V2-G và V2-K). Mục tiêu: để giao diện làm được ngay cả khi engine chưa xong.

1. Tạo docs/VIEW_MODEL.md mô tả JSON mà API trả cho người chơi sau khi qua projectViewFor. Mỗi trường ghi rõ mức
   hiển thị: public | delayed | private | disclosed. Phải có các khối: game, me, players (thẻ đối thủ có cờ
   "estimated" và "undisclosed"), map (80 ô: zone, district, use, elevation, waterAdjacency, soil, owner,
   business công khai, landPrices {reference, asking, appraisal chỉ khi có), season, weather {forecast, lastEvent},
   macro, indicators (nhiệt kế 2x2, lãi suất thực, lương thực tế, giá đất, sức khỏe ngân hàng, thất nghiệp theo vùng),
   population (tháp tuổi theo vùng), infrastructure (chỉ số theo khu, dự án đã công bố, ngân sách, phong cách),
   listings, auctionResults, inbox (số chưa đọc + danh sách gần đây), myKpi (5 chỉ số, mỗi chỉ số có value, status,
   trend, explanation, benchmark), loanPreview, rankingEstimate (3 tiêu chí), whyLog (có role), history cho biểu đồ.
2. Tạo fe/src/mocks/ gồm ít nhất 3 kịch bản JSON đúng hợp đồng: "quý đầu", "giữa ván bình thường",
   "khủng hoảng" (bão + hạ tầng yếu + một người chơi sắp phá sản). Dùng dữ liệu hợp lý (80 ô đầy đủ).
3. Thêm cờ môi trường VITE_USE_MOCK=true: fe/src/lib/api.js trả dữ liệu giả thay vì gọi be; có công tắc đổi kịch bản
   trong một thanh công cụ dev nhỏ (chỉ hiện khi dùng mock).
4. Viết một hàm validate (Zod) cho view model ở fe/src/lib/viewModelSchema.js để phát hiện lệch hợp đồng khi dev.

Không sửa engine. Không đổi giao diện hiện có ở bước này, chỉ chuẩn bị dữ liệu và công tắc mock.
```

---

## P3 — Giao diện: khung chính và bản đồ

```
Dùng dữ liệu giả từ P2 (VITE_USE_MOCK=true). Xây khung giao diện chính và bản đồ theo V2-B, V2-F, V2-K.

Khung: thanh trạng thái (quý/năm, mùa, đồng hồ đếm ngược nếu có, trạng thái sẵn sàng của người chơi, chấm kết nối
realtime); bố cục 3 cột trên desktop và tab dưới trên điện thoại: cột Thị trường, cột Bản đồ, cột Hành động và tài chính của tôi.

Bản đồ 10x8:
- Mỗi ô hiển thị theo mục đích sử dụng: đất kinh doanh (màu theo chủ, biểu tượng ngành và cấp, trạng thái đang xây),
  đất ở (biểu tượng người dân 3 màu theo vùng, kèm 1/2/3 hình người), đất công (biểu tượng đường/trường/bệnh viện),
  mặt nước (sông, biển).
- Địa hình thể hiện rõ: độ cao (đổ bóng hoặc viền), sát sông/biển, đất nhiễm mặn (họa tiết).
- Lớp bật tắt: địa hình, mật độ dân, hạ tầng, rủi ro thiên tai, chủ sở hữu, giá đất. Có chú giải.
- Viền 3 vùng và ranh giới 6 khu, nhãn tên vùng.
- Huy hiệu đang rao bán (kèm giá khởi điểm), cảnh báo đất bỏ trống lâu, làm nổi bật cụm cùng ngành của người chơi.
- Bấm một ô mở bảng chi tiết bên cạnh: 3 loại giá (tham chiếu, đang rao, ngân hàng định giá nếu có),
  3 chỉ số hạ tầng của khu, rủi ro thiên tai, hàng xóm, nguồn lao động gần đó, lịch sử giá trúng, các nút hành động hợp lệ
  (bid, build, upgrade, convert, fortify, sellPlot, claimIdle) và chỉ hiện nút đúng với quyền và trạng thái của ô.
- Màu không phải là kênh thông tin duy nhất: luôn có biểu tượng hoặc chữ đi kèm.

Dùng Tailwind + daisyUI, lucide-react. Responsive, dùng được trên điện thoại. Mọi nhãn tiếng Việt. Không gọi API thật.
Mỗi component có file riêng, nhận dữ liệu qua props theo docs/VIEW_MODEL.md.
```

---

## P4 — Giao diện: chỉ số, hộp thư, form vay, đối thủ, nhà nước, dân số

```
Tiếp tục với dữ liệu giả. Xây các thành phần theo V2-G, V2-H, V2-I, V2-K và docs/VIEW_MODEL.md:

1. Bảng chỉ số 3 tầng (nền kinh tế / ngành / doanh nghiệp). Nền kinh tế có nhiệt kế 2x2 (Thuận lợi, Quá nóng, Đình lạm,
   Suy thoái) đánh dấu vị trí hiện tại, lãi suất thực, lương thực tế, giá đất, sức khỏe ngân hàng, thất nghiệp theo vùng.
   Mỗi chỉ số có tooltip thuật ngữ ngắn gọn cho người không chuyên.
2. 5 chỉ số doanh nghiệp: biên lợi nhuận, ROE, an toàn vay, thời gian sống sót, công suất so với hòa vốn. Mỗi chỉ số có đèn
   xanh/vàng/đỏ (kèm biểu tượng), xu hướng, một câu giải thích và mức chuẩn ngành. Khối "vay có lợi không" so ROIC với lãi vay.
3. Hộp thư: danh sách có lọc theo loại (ngân hàng, nhà đầu tư, nhà nước, kế toán, thời tiết, hệ thống), đánh dấu chưa đọc,
   huy hiệu số chưa đọc trên thanh trên cùng.
4. Form vay và phát hành: chọn mục đích (xây/vốn lưu động), nhập số tiền; hiện checklist điều kiện (đạt/không đạt,
   giá trị hiện tại so với ngưỡng), mức khả năng duyệt cao/vừa/thấp kèm ghi chú "có thể có người khác cùng xin vay";
   sau khi chốt quý hiện kết quả APPROVED/PARTIAL/REJECTED với lý do và gợi ý khắc phục.
5. Thẻ đối thủ: chỉ hiện thông tin công khai (ô đất, ngành, cấp), nhãn "ước tính" với khoảng ±15%, nhãn "chưa công bố"
   cho ROE và xếp hạng tín nhiệm khi chưa công bố; khi đã công bố thì hiện kèm "công bố ở quý t".
6. Xếp hạng 3 tiêu chí (quy mô ước tính, hiệu quả, an toàn); xếp hạng thật chỉ hiện khi ván kết thúc.
7. Bảng nhà nước: phong cách điều hành, ngân sách và cách chia, danh sách dự án hạ tầng đã công bố (khu, loại, quý hoàn
   thành, mức tăng), nhật ký "vì sao" của các quyết định; bảng chỉ số hạ tầng theo 6 khu.
8. Tháp dân số theo vùng (5 nhóm tuổi), tổng dân, lực lượng lao động, số thất nghiệp; thanh thời tiết/dự báo bốn loại thiên
   tai với mức thấp/vừa/cao và phần trăm; lịch mùa vụ 4 quý.
9. Nhật ký "vì sao" có lọc theo vai trò. Biểu đồ lịch sử bằng Recharts (lãi suất, lạm phát, thất nghiệp, giá đất, tài sản ròng
   của tôi).

Chỉ dùng dữ liệu giả. Thêm các thuật ngữ mới vào glossary.js của fe (hoặc đọc từ be nếu đã có) và dùng component <Term>.
```

---

## P5 — Giao diện: phòng tập bot, replay, hướng dẫn, báo cáo cuối ván

```
Với dữ liệu giả, xây các màn hình và thành phần sau (V2-K, V2-L):

1. Phòng tập bot: chọn số bot và hồ sơ từng bot (conservative, aggressive, balanced, passive, random), chọn seed, tốc độ,
   tạm dừng và chạy từng bước (từng quý). Chế độ "xem tất cả" (god view) hiện đầy đủ state, có banner đỏ cảnh báo
   "chế độ kiểm thử, không phải góc nhìn người chơi". Công tắc này chỉ hiện khi phòng là phòng tập.
2. Replay theo quý: thanh trượt thời gian đọc lịch sử, xem lại bản đồ, chỉ số, hộp thư và hành động tại từng quý.
3. Hướng dẫn quý đầu: lớp phủ từng bước (bản đồ, đấu giá, xây, vay, chốt quý), có thể bỏ qua và mở lại từ menu.
4. Báo cáo cuối ván kiểu chẩn đoán: bảng xếp hạng thật, biểu đồ tài sản ròng theo quý, phân tích nguyên nhân thắng/thua
   (đòn bẩy, chu kỳ, thiên tai, quyết định đầu tư lớn) bằng các câu giải thích rút từ dữ liệu lịch sử, các quý đáng nhớ.
5. Màn hình tạo phòng: chọn chế độ thời gian (relaxed, standard; "đồng hồ cờ vua" hiện ở trạng thái "sắp có" và bị khóa),
   phong cách điều hành nhà nước (balanced, growth, equity), số quý, quý bắt đầu.
6. Trang luật chơi cập nhật các khái niệm mới (mùa vụ, thiên tai, hạ tầng, dân số, vay và điều kiện, thông tin ẩn/hiện).

Dùng dữ liệu giả; phần cần dữ liệu thật ghi rõ bằng TODO và liệt kê trong DECISIONS.md.
```

---

## P6 — Engine: bản đồ mới, tiền ×10, dân số, lao động

```
Đọc PROJECT_SPEC.md v2, mục V2-A, V2-B, V2-C. Chỉ làm trong be/src/engine (và test).

1. config.js: đổi toàn bộ tham số tiền theo V2-A; bỏ levels.workers và baseWage; thêm bảng lao động và lương theo ngành;
   thêm tham số dân số, di cư, tham gia lao động, chênh lệch vùng (V2-C).
2. map.js: tạo bản đồ 10x8 cố định đúng V2-B (zone, district, use, elevation, waterAdjacency, soil, ngành được phép).
   Có test kiểm đếm số ô theo mục đích và theo vùng, test ngành được phép, test đồ thị liền kề.
3. population.js: trạng thái dân số theo vùng và nhóm tuổi, cập nhật mỗi 4 quý (sinh, chuyển nhóm, tử vong, di cư),
   lực lượng lao động, thất nghiệp theo vùng, chỉ số lương theo vùng.
4. Tuyển dụng trong business.js/resolve.js: doanh nghiệp xây xong hoặc nâng cấp thì tuyển theo V2-C (nguồn lao động của
   vùng + phần vùng lân cận, chia tỷ lệ khi tranh chấp), tính staffing, chi phí tuyển. Xóa hành động setWorkers khỏi
   actions.js, validate.js, preview.js, schema Zod và test.
5. Cầu cơ sở của ngành tỷ lệ theo dân số tổng; xóa laborForce cũ theo số người chơi; nối thất nghiệp theo vùng vào macro.
6. Cập nhật init.js (tạo dân số, bản đồ mới) và mọi chỗ dùng ô cũ (tier). Chuyển mọi dữ liệu mẫu và test sang quy mô ×10.

Không làm khí hậu, hạ tầng, giá đất mới, vay mới ở prompt này. Chạy test và chỉ ra mọi test cũ phải đổi và lý do.
```

---

## P7 — Engine: mùa vụ, thời tiết, thiên tai

```
Đọc PROJECT_SPEC.md v2, mục V2-D. Làm trong be/src/engine.

1. climate.js: hệ số mùa vụ theo quý trong năm (cầu và chi phí xây); xác suất bốn loại thiên tai theo quý; phơi nhiễm theo ô;
   bốc kết quả bằng rngFor(seed, 'weather', quarter); dự báo (xác suất thật × nhiễu, hiển thị mức thấp/vừa/cao + %);
   thiệt hại doanh thu và chi phí sửa chữa theo công thức V2-D; tác động vĩ mô (niềm tin, cung NPC nông nghiệp);
   damageIndex theo vùng giảm 40% mỗi quý.
2. Nối vào resolve.js: bốc thiên tai trước bước vận hành (B), áp thiệt hại trong B, sinh dự báo cho quý sau ở bước C.
   Thêm tài khoản DISASTER_LOSS vào accounts.js và statements.js (hiện trong kết quả kinh doanh).
3. Hành động fortify {plotId} (1 ĐHĐ): mức gia cố 0→1→2, chi phí 8% và 15% nguyên giá, hiệu lực vĩnh viễn; thêm vào actions.js,
   validate.js, preview.js, schema Zod. Thêm trường gia cố vào Business.
4. Hệ số mùa vụ nhân vào cầu ngành (6.3) và chi phí xây (constructionIndex). Bỏ sự kiện harvest_fail khỏi events.js.
5. Sinh tin nhắn thời tiết (kind: weather) và dòng "vì sao" cho mỗi thiên tai (ô bị ảnh hưởng, thiệt hại).
6. Test: phân phối thiên tai trên nhiều seed khớp xác suất cấu hình (sai số hợp lý); thiệt hại không bao giờ làm số dư âm
   hoặc NaN; fortify giảm thiệt hại đúng tỷ lệ; xác định (cùng seed, cùng kết quả).

Không làm hạ tầng và nhà nước ở prompt này (dùng chỉ số thủy lợi = 0 làm tạm, ghi TODO để P8 nối vào).
```

---

## P8 — Engine: hạ tầng và nhà nước

```
Đọc PROJECT_SPEC.md v2, mục V2-E. Làm trong be/src/engine, tách module nhà nước thành thư mục government/:
centralBank.js (đã có, chuyển vào), treasury.js, planning.js, disasterRelief.js.

1. infrastructure.js: chỉ số 3 loại hạ tầng theo 6 khu, xuống cấp 0,5 điểm/quý nếu không bảo trì, bảo trì bằng ngân sách.
2. treasury.js: ngân sách mỗi quý (thuế người chơi + thuế nền 4% cầu danh nghiệp + phí giao dịch đất), chia 25/50/15/10 theo V2-E,
   kích cầu govImpulse như cũ.
3. planning.js: điểm ưu tiên theo công thức V2-E, ba phong cách điều hành (trọng số trong config), chọn loại dự án, vòng đời dự án
   (công bố 1–2 quý trước, thi công 2–4 quý, hoàn thành thì tăng chỉ số), chọn dự án trong ngân sách.
4. disasterRelief.js: quỹ dự phòng, chi 30% khôi phục hạ tầng công và giảm damageIndex khi có thiên tai (nối với P7).
5. Nối tác động hạ tầng: giá vốn (giao thông), nguồn lao động lân cận (giao thông, V2-C), bảo vệ thiên tai (thủy lợi, V2-D),
   di cư và năng suất (xã hội), và đưa vào giá đất ở P9 sau.
6. Mọi quyết định của nhà nước sinh dòng "vì sao" và tin nhắn công khai (kind: government). Ghi đầu vào/đầu ra của từng bộ phận
   vào cấu trúc mà P12 sẽ ghi log (chưa cần ghi DB ở bước này).
7. Test: ưu tiên đổi đúng theo phong cách; ngân sách không âm; dự án hoàn thành đúng quý; chỉ số luôn trong [0,100];
   mô phỏng 20 quý không NaN; xác định.

Nếu thấy thuật toán nhà nước cần can thiệp tay quá nhiều hoặc quá phức tạp, hãy đề xuất cải thiện trong DECISIONS.md thay vì tự đổi lớn.
```

---

## P9 — Engine: giá đất, thông tin ai được biết gì, xếp hạng ước tính

```
Đọc PROJECT_SPEC.md v2, mục V2-F và V2-G. Làm trong be/src/engine.

1. landPricing.js: landValue thật (ẩn) theo công thức V2-F (giá nền vùng, vị trí, hạ tầng, rủi ro, hàng xóm); giá tham chiếu theo khu
   (trung bình mượt 4 quý, trễ 1 quý); giá khởi điểm đang rao = landValue × U(0,9; 1,1) bốc bằng rngFor(seed, 'asking', quarter),
   lưu cố định trong listing; giá ngân hàng định giá = 0,85 × landValue. Cập nhật Listing (có askingPrice, reserve, source).
2. Phí giao dịch đất 2% cho mua, bán, claimIdle: bút toán FEES, thu vào ngân sách nhà nước (nối treasury).
3. Đấu giá: giữ cơ chế cũ nhưng kết quả công khai chỉ gồm ô, người trúng, giá trúng, số giá thầu. Giá thầu thua ở lại trong state
   riêng tư.
4. visibility.js: hàm projectViewFor(state, playerId) trả đúng view theo hợp đồng docs/VIEW_MODEL.md và bảng V2-G
   (công khai / trễ / riêng tư / lộ khi có điều kiện). Quy tắc công bố: báo cáo và xếp hạng tín nhiệm của một người chơi chỉ lộ
   trong quý họ phát hành trái phiếu/cổ phiếu và giữ bản mới nhất đã công bố (kèm "công bố ở quý t").
5. rankingEstimate: ước tính quy mô từ tài sản nhìn thấy được (đất theo giá tham chiếu khu, công trình theo chi phí xây công khai
   theo ngành và cấp), khoảng ±15%, không gồm tiền và nợ; ba tiêu chí quy mô/hiệu quả/an toàn với nhãn "chưa công bố" khi cần.
   Xếp hạng thật chỉ có khi game finished.
6. Test chống rò rỉ: đặt giá trị "mồi" riêng biệt vào tiền mặt, nợ, giá thầu thua, R&D, mức gia cố của người A; quét sâu
   (deep scan) toàn bộ JSON view của người B và khẳng định không chứa giá trị mồi nào. Test thêm: view của chính A có đầy đủ;
   sau khi game kết thúc view mở toàn bộ.

Không làm API ở prompt này; chỉ engine và test.
```

---

## P10 — Engine: vay ngân hàng và hộp thư

```
Đọc PROJECT_SPEC.md v2, mục V2-H. Làm trong be/src/engine.

1. lending.js: hàm evaluateLoanApplication(state, playerId, request, pendingActions) trả
   { checklist: [{ code, passed, current, threshold, message }], chance: 'high'|'medium'|'low', approvedAmount,
   result: 'APPROVED'|'PARTIAL'|'REJECTED', reasons: [codes], remedies: [text] }. Các mã: NO_BUSINESS, RATING_D, ARREARS, DE_CAP,
   COLLATERAL, COVERAGE, EQUITY_CONTRIBUTION, WORKING_CAP, ROOM. Dùng giá ngân hàng định giá (0,85 × landValue cho đất).
2. Hành động borrow có thêm purpose: 'build' | 'working' (cập nhật actions.js, validate.js, schema Zod, preview.js).
3. Khi chốt quý, resolve.js phải dùng CHÍNH hàm evaluateLoanApplication (không có logic thứ hai) để quyết định duyệt, chia
   room tỷ lệ khi nhiều người xin. preview.js dùng cùng hàm nên xem trước và kết quả thật luôn nhất quán (trừ phần room bị tranh).
4. messages.js: cấu trúc Message { id, quarter, to (playerId hoặc 'all'), kind (bank|investor|government|accountant|weather|system),
   severity (info|good|warn), title, body, codes }. Sinh tin nhắn cho mọi kết quả vay, từ chối trái phiếu/cổ phiếu, tái cấp vốn,
   nợ quá hạn, phá sản, thông báo nhà nước, thời tiết. Engine chỉ trả mảng messages; lưu DB ở P12.
5. Cập nhật explain.js: mỗi mã lý do có câu giải thích và gợi ý khắc phục tiếng Việt.
6. Test: mỗi mã lý do có ít nhất một test (đạt và không đạt); APPROVED, PARTIAL, REJECTED đều có test; xem trước và kết quả
   thật khớp khi chỉ có một người xin; không thể vay vượt trần D/E bằng cách chia nhỏ yêu cầu.
```

---

## P11 — Engine: chỉ số vĩ mô và chỉ số doanh nghiệp

```
Đọc PROJECT_SPEC.md v2, mục V2-I. Làm trong be/src/engine.

1. market/indicators.js: nhiệt kế 2x2 (ngưỡng tăng trưởng 4%/năm, lạm phát 5%/năm trong config), lãi suất thực (vay và gửi),
   lương thực tế theo vùng, chỉ số giá đất, sức khỏe ngân hàng, thất nghiệp theo vùng và toàn quốc, mức dùng room, thiếu hàng/thừa
   hàng theo ngành, benchmark biên lợi nhuận của từng ngành.
2. kpi.js: 5 chỉ số doanh nghiệp (biên lợi nhuận ròng, ROE, an toàn vay, thời gian sống sót, công suất so với hòa vốn) và chỉ số ghép
   ROIC so với lãi vay bình quân. Mỗi chỉ số trả { value, status: 'green'|'yellow'|'red', trend, explanation, benchmark }.
   Công thức đúng V2-I, ngưỡng trong config.js. Công suất hòa vốn tính cho từng doanh nghiệp rồi tổng hợp có trọng số theo doanh thu.
3. Mẫu câu giải thích cho mỗi trạng thái xanh/vàng/đỏ, bằng tiếng Việt cho người không chuyên.
4. Bổ sung thuật ngữ vào glossary.js: nhiệt kế kinh tế, lãi suất thực, lương thực tế, ROE, ROIC, công suất hòa vốn, thời gian sống sót,
   mùa vụ, thiên tai, hạ tầng, dân số, già hóa, di cư.
5. Nối kết quả vào view qua visibility.js (myKpi chỉ chủ sở hữu thấy, indicators công khai).
6. Test: ví dụ số cụ thể cho từng công thức; trường hợp biên (doanh thu 0, nợ 0, vốn chủ ≤ 0); không NaN/Infinity.
```

---

## P12 — DB, API, realtime, log dữ liệu huấn luyện

```
Đọc PROJECT_SPEC.md v2 (V2-G, V2-H, V2-J). Làm ở db/ và be/.

1. db/prisma/schema.prisma: thêm model Message (gameId, playerId nullable cho tin gửi tất cả, quarter, kind, severity, title, body,
   codes Json, read Boolean), model TrainingLog (gameId, quarter, actorType, actorId, observation Json, actions Json, outcome Json,
   thinkMs Int?, ruleVersion, configHash, seed, createdAt); thêm Game.settings Json (timeMode, quarterSeconds, governmentStyle,
   startQuarter, isPractice) và Player.isBot Boolean, Player.botProfile String?. Tạo migration.
2. be/src/services: mọi view gửi người chơi PHẢI đi qua projectViewFor. Siết quyền: endpoint sổ cái và báo cáo chỉ trả dữ liệu của
   chính người gọi (và trả toàn bộ chỉ khi game finished). Bỏ lastReports công khai.
3. Endpoint mới: GET inbox, POST đánh dấu đã đọc, POST xem trước hồ sơ vay (gọi evaluateLoanApplication), GET thông tin ô đất
   (3 loại giá theo quyền), GET dân số, GET nhà nước (dự án, ngân sách, phong cách). Thêm sự kiện Socket.IO "inbox" {count}.
4. Chốt quý lưu messages vào DB và ghi TrainingLog trong CÙNG transaction: mỗi tác nhân người/bot một bản với observation là
   view đã chiếu riêng của họ; các tác nhân system (centralBank, treasury, planning, disasterRelief, bank, investors, household)
   ghi đầu vào và quyết định. ruleVersion lấy từ package.json, configHash là băm của CONFIG.
5. Phòng tập: endpoint tạo phòng tập với bot, tạm dừng/chạy từng bước; endpoint "xem tất cả" chỉ hoạt động khi
   Game.settings.isPractice = true và biến môi trường ENABLE_GODVIEW=true.
6. Script be/scripts/export-logs.js xuất TrainingLog ra JSONL (lọc theo game, actorType).
7. Test API với supertest hoặc tương đương: quyền xem, không rò dữ liệu riêng tư, inbox, xem trước hồ sơ vay, chốt quý ghi log đủ bản.
8. Cập nhật npm run smoke cho các endpoint mới.
```

---

## P13 — Bot, phòng tập, mô phỏng và cân bằng

```
Đọc PROJECT_SPEC.md v2. Làm ở be/ (bot và mô phỏng).

1. Cập nhật bot theo cơ chế mới: mua đất theo ngành được phép và vùng, tính đến mùa vụ, dự báo thiên tai (gia cố khi dự báo cao),
   hạ tầng, giá tham chiếu, điều kiện vay (dùng evaluateLoanApplication để xem trước), không setWorkers.
   Hồ sơ: conservative, aggressive, balanced, passive, random, thêm climate_aware.
2. QUAN TRỌNG: bot chỉ được dùng view đã chiếu (projectViewFor), không đọc state đầy đủ. Có test chứng minh bot không truy cập
   state ẩn (ví dụ truyền vào đúng view và khẳng định chạy được).
3. Cập nhật be/scripts/simulate.js: 300 ván, 20 quý, 4 bot, seed 1..N, ghi TrainingLog dạng JSONL (tùy chọn, tắt mặc định),
   thống kê theo hồ sơ bot, thoát mã khác 0 nếu vi phạm bất biến.
4. Mục tiêu cân bằng (chỉnh trong config.js nếu lệch): giữ các mục tiêu cũ ở mục 14.2; thêm: thiệt hại thiên tai trung bình mỗi ván
   chiếm 2–8% doanh thu; thất nghiệp từng vùng trong [1%, 20%]; tổng dân số thay đổi trong ±15% sau 5 năm; mọi chỉ số hạ tầng trong
   [10, 95]; ngân sách nhà nước không âm; ít nhất 10% số ván có người phá sản vì thiên tai cộng đòn bẩy cao; không có hồ sơ bot nào
   thắng quá 45% trong ván hỗn hợp; test chống rò rỉ P9 luôn pass.
5. Báo cáo kết quả mô phỏng vào docs/BALANCE_REPORT.md (bảng chỉ số, tham số đã đổi và lý do). Nếu mục tiêu nào không đạt sau khi
   chỉnh hợp lý, ghi rõ và đề xuất phương án thay vì ép số.
```

---

## Ghi chú thảo luận (chưa làm ở giai đoạn này)

- **AI điều hành doanh nghiệp và quản lý thị trường:** P12 đã ghi log từ bây giờ (quan sát riêng của từng tác nhân, hành động, kết quả, phiên bản luật). Phần lớn dữ liệu huấn luyện sau này sẽ đến từ mô phỏng hàng loạt bằng engine thuần, còn dữ liệu từ ván của bạn bè dùng để tinh chỉnh và đánh giá. Bot chỉ dùng view đã chiếu (P13) để dữ liệu giống điều kiện thông tin của người thật.
- **Chế độ người chơi vai nhà nước** và **đồng hồ cờ vua** đã chừa chỗ trong giao diện (trạng thái "sắp có").
- **Bảo hiểm thiên tai** và **chuyển mục đích sử dụng đất** là hai ứng viên tốt cho đợt nâng cấp sau.
- Trước khi chạy P6 trở đi, nên chơi thử ít nhất một ván hoàn chỉnh với bot để ghi lại những chỗ còn thiếu thông tin.
