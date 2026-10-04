import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Trophy, Users, Coins, Landmark, Building2,
  ChevronDown, ChevronUp, Info, AlertTriangle, Award, Sparkles
} from 'lucide-react';
import { ACCOUNT_NAMES_VI, CATEGORY_NAMES_VI } from '../lib/vi.js';
import { CONFIG } from '../lib/config.js';

export default function Rules() {
  const [open, setOpen] = useState(0);
  const sections = [
    {
      icon: <BookOpen size={16} />, title: 'Tổng quan',
      body: (
        <div className="space-y-2 text-sm leading-relaxed text-slate-300">
          <p>
            <b className="text-amber-300">Tycoon Kinh Tế</b> là game mô phỏng kinh doanh theo lượt (mỗi lượt = 1 quý / 3 tháng),
            dành cho <b className="text-sky-300">2–6 người chơi</b>. Mặc định mỗi ván kéo dài 20 quý (~5 năm KT, ~45–60 phút chơi thực tế).
          </p>
          <p>
            Mỗi người điều hành 1 công ty khởi đầu <b className="text-emerald-300">10 tỷ đồng tiền mặt</b>,
            mua đất, đầu tư xây dựng cơ sở kinh doanh theo ngành, thuê nhân công,
            vay ngân hàng, phát hành trái phiếu / cổ phiếu, R&D để nâng năng suất,
            đấu giá đất công cộng và mua lại đất bỏ trống của người khác.
          </p>
          <p>
            Nền kinh tế (Người dân, Ngân hàng thương mại, Nhà đầu tư, Chính phủ, Ngân hàng trung ương)
            phản ứng theo <b>công thức kinh tế</b> và tác động ngược lại quyết định của bạn:
            lãi suất, lạm phát, tăng trưởng, thất nghiệp, room tín dụng, cung – cầu theo ngành, thuế, xếp hạng tín nhiệm…
          </p>
          <p className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <Trophy size={14} className="inline mr-1.5 text-amber-300" />
            <b>Thắng:</b> Người có <b>TÀI SẢN RỒNG (Vốn chủ sở hữu = Tài sản − Nợ)</b> cao nhất khi kết thúc ván.
            <br/>
            <AlertTriangle size={14} className="inline mr-1.5 text-rose-300 mt-1" />
            <b>Thua (bị loại):</b> Phá sản (nợ quá hạn lớn, không trả được lãi/vốn, tiền mặt cạn, vượt quá hạn mức đòn bẩy theo xếp hạng tín nhiệm).
          </p>
        </div>
      ),
    },
    {
      icon: <Users size={16} />, title: 'Vai trò nền kinh tế',
      body: (
        <ul className="space-y-2 text-sm text-slate-300">
          <li><b className="text-sky-300">👨‍👩‍👧‍👦 Người dân (Hộ gia đình):</b> Đi làm → nhận lương → tiêu dùng (theo cầu từng ngành), còn thừa thì gửi tiết kiệm.</li>
          <li><b className="text-violet-300">💼 Nhà đầu tư:</b> Mua trái phiếu / cổ phiếu dựa trên báo cáo tài chính, xếp hạng tín nhiệm, lãi suất coupon, tỷ lệ pha loãng, ROE.</li>
          <li><b className="text-blue-300">🏦 Ngân hàng thương mại:</b> Nhận tiền gửi, cho vay trong room tín dụng (theo xếp hạng A→D), thu hồi nợ đúng hạn, phạt quá hạn, trích lập dự phòng.</li>
          <li><b className="text-emerald-300">🏛️ Ngân hàng trung ương (NHTW):</b> Đặt lãi suất cơ bản (luật Taylor), đặt room tín dụng tổng thể cho toàn hệ thống.</li>
          <li><b className="text-amber-300">🏛️ Chính phủ:</b> Thu thuế TNDN lũy tiến, thuế đất trống, chi kích cầu khi suy thoái.</li>
          <li><b className="text-rose-300">👩‍💼 Kế toán:</b> Ghi sổ kép EVERY giao dịch, cân đối Nợ = Có, tổng hợp 3 báo cáo (BCT, KQKD, LCTT) cuối quý.</li>
        </ul>
      ),
    },
    {
      icon: <Coins size={16} />, title: 'Điểm hành động (AP) & Luật chơi',
      body: (
        <div className="space-y-3 text-sm text-slate-300">
          <p>Mỗi quý bạn có <b className="text-amber-300">3 điểm hành động (AP)</b>. Các hành động KHÔNG tốn AP (nhanh): gửi tiền, rút tiền, vay, trả nợ, chỉnh nhân công, chỉnh tỷ lệ R&D. Hành động tốn 1 AP:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {[
              ['🛒 Đấu giá đất (bid)', 'Đấu giá ô đất công cộng / ô thanh lý, giá cao nhất thắng khi chốt quý'],
              ['🏗️ Xây công trình (build)', 'Xây cơ sở sản xuất kinh doanh theo ngành (Nông nghiệp, BĐS, Công nghệ, Du lịch)'],
              ['⬆️ Nâng cấp (upgrade)', 'Lên Lv2 / Lv3, tăng công suất & lợi nhuận, tốn 1 quý xây'],
              ['🔄 Đổi ngành (convert)', 'Chuyển cơ sở sang ngành khác, tốn 1 quý và chi phí chuyển đổi'],
              ['💸 Bán ô đất (sellPlot)', 'Bán lại ô đất + cơ sở cho thị trường (sổ cái thanh lý)'],
              ['⚖️ Mua ô bỏ trống (claimIdle)', 'Ô khác đã bỏ trống ≥ 4 quý, chi 1.15× giá trị đất, kiểm tra đủ tiền mặt'],
              ['📜 Phát hành Trái phiếu (issueBond)', 'Phát hành TP kỳ 4/8 quý theo xếp hạng, phí 1%, nhà đầu tư fill % theo điểm'],
              ['📊 Phát hành Cổ phiếu (issueShares)', 'Bán 5–30% cổ phiếu lưu hành cho nhà đầu tư (giảm 5% + phí 2%)'],
            ].map(([t, d]) => (
              <div key={t} className="rounded-lg border border-slate-700/70 bg-slate-900/50 p-2.5">
                <div className="font-bold text-slate-200">{t}</div>
                <div className="text-slate-400 text-[11px] mt-0.5">{d}</div>
              </div>
            ))}
          </div>
          <p className="text-xs bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
            <Info size={13} className="inline mr-1 text-sky-300" />
            Sau khi chốt quý: 1) xử lý tài chính → 2) đấu giá / claimIdle / bán đất → 3) xây/nâng cấp → 4) trả nợ → 5) gửi tiền/R&D/LĐ → ghi sổ & báo cáo.
          </p>
        </div>
      ),
    },
    {
      icon: <Landmark size={16} />, title: 'Xếp hạng tín nhiệm & Đòn bẩy',
      body: (
        <div className="space-y-2 text-sm text-slate-300">
          <p>Xếp hạng tín nhiệm (A→B→C→D) được tính theo các chỉ số tài chính (D/E, khả năng trả lãi, dòng tiền hoạt động, net profit margin, history). Ảnh hưởng:</p>
          <div className="overflow-x-auto rounded-lg border border-slate-700/60">
            <table className="w-full text-xs">
              <thead className="bg-slate-800/80 uppercase font-black tracking-wider">
                <tr className="text-slate-300">
                  <th className="p-2 text-left">Xếp hạng</th>
                  <th className="p-2 text-left">Spread lãi vay</th>
                  <th className="p-2 text-left">Đòn bẩy D/E tối đa</th>
                  <th className="p-2 text-left">Phát hành TP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {[
                  ['A', '+0,5%/năm', '2,5×', 'Được'],
                  ['B', '+1,5%/năm', '1,8×', 'Được'],
                  ['C', '+3,5%/năm', '1,0×', 'Được'],
                  ['D', '+7%/năm  (+phạt 5% nếu quá hạn)', '0,3×', 'KHÔNG đủ điều kiện'],
                ].map((r, i) => (
                  <tr key={i}>
                    {r.map((cell, j) => (
                      <td key={j} className={`p-2 ${j === 0 ? 'font-black text-sm' : 'text-slate-300'} ${
                        i === 0 ? 'text-amber-300' : i === 1 ? 'text-sky-300' : i === 2 ? 'text-orange-300' : 'text-rose-400'
                      }`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400">
            * Lãi suất cho vay = Lãi suất cơ bản (NHTW) + Spread theo hạng. Tiền gửi = Lãi cơ bản − 1,5%/năm. Trái phiếu = Lãi chính phủ + Spread theo hạng.
          </p>
        </div>
      ),
    },
    {
      icon: <Building2 size={16} />, title: '4 ngành đầu tư',
      body: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {Object.entries(CONFIG.sectors).map(([k, s]) => (
            <div key={k} className="rounded-xl border border-slate-700/70 bg-slate-900/50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{s.icon}</span>
                <b className="text-slate-100">{s.name}</b>
              </div>
              <div className="text-[11px] text-slate-400 space-y-0.5">
                <div>Chi phí xây Lv1 → Lv3: <b className="text-amber-300 font-mono">{s.build.map(v => v+'M').join(' / ')}</b></div>
                <div>Tỷ lệ giá vốn: <b className="font-mono">{(s.cogs*100).toFixed(0)}% doanh thu</b></div>
                <div>Nhân công Lv1→Lv3: <b className="text-sky-300">{CONFIG.levels.workers.join(' / ')} công nhân / cơ sở</b></div>
                <div className="mt-1 italic">
                  {k === 'agri' && 'Tốc độ xây nhanh, vốn thấp, ổn định, nhạy cảm giá hàng hóa & sự kiện thời tiết.'}
                  {k === 'real_estate' && 'Cần vốn nhiều, lợi nhuận cao nếu đất tăng giá, nhạy cảm lãi suất & tín dụng.'}
                  {k === 'tech' && 'Lợi nhuận gộp cao, cần R&D thường xuyên để nâng hiệu suất, cạnh tranh gay gắt.'}
                  {k === 'tourism' && 'Phụ thuộc niềm tin & tăng trưởng, thưởng pha boom, thiệt hại nặng khi suy thoái.'}
                </div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <Award size={16} />, title: 'Bảng thuật ngữ kế toán',
      body: (
        <div className="text-xs">
          <p className="mb-2 text-slate-400">Tài khoản trong sổ cái kép (Nợ = Có mọi giao dịch):</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-1">
            {Object.entries(ACCOUNT_NAMES_VI).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded-md bg-slate-900/50 px-2.5 py-1.5 border border-slate-800">
                <span className="font-mono font-bold text-slate-400">{k}</span>
                <span className="text-slate-200">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1 text-slate-400">
            {Object.entries(CATEGORY_NAMES_VI).map(([k, v]) => (
              <div key={k}><b className="text-slate-300">{k}:</b> {v}</div>
            ))}
          </div>
        </div>
      ),
    },
    {
      icon: <Sparkles size={16} />, title: 'Mẹo chơi cho người mới',
      body: (
        <ol className="space-y-2 text-sm text-slate-300 list-decimal list-inside">
          <li><b>Quý 1–3:</b> Gửi tiết kiệm 70% vốn nhận lãi, thử đấu giá vài ô đất VÒNH NGOÀI giá mềm (650M–1000M). Đừng vay đòn bẩy ngay!</li>
          <li><b>Xây đa dạng 2 ngành:</b> Không dồn vốn vào cùng 1 ngành. Công nghệ + Nông nghiệp hoặc BĐS + Du lịch là cặp bổ trợ tốt.</li>
          <li><b>Theo dõi lãi suất & room tín dụng:</b> Khi lãi suất thấp (dưới 5%/năm) → vay dài hạn để xây. Khi cao → trả nợ & gửi tiền hưởng lãi.</li>
          <li><b>Xếp hạng tín nhiệm quan trọng hơn số tài sản:</b> Hạng A cho phép D/E lên 2,5× và vay rẻ. Mất hạng A → lãi vay tăng gấp 3–14 lần.</li>
          <li><b>Tận dụng đất bỏ trống đối thủ:</b> Sau 4 quý bỏ trống, bạn có thể MUA LẠI (claimIdle) giá 115% giá đất, chiếm đất của đối thủ!</li>
          <li><b>Đừng quên R&D (3–6–10% doanh thu):</b> Nâng hiệu suất 70% → 120% (vượt trội đối thủ) sau nhiều quý tích lũy.</li>
          <li><b>Trước khi chốt quý:</b> Nhấn "Xem trước kết quả" (Preview) để kiểm tra tiền mặt sau hành động, cảnh báo thiếu tiền / vượt trần D/E → điều chỉnh kịp thời!</li>
        </ol>
      ),
    },
  ];

  return (
    <div className="min-h-screen py-6 px-3 md:py-10">
      <div className="w-full max-w-4xl mx-auto space-y-5 relative z-10">
        <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/60 border border-slate-700/70 mb-3">
            <BookOpen size={14} className="text-amber-400" />
            <span className="text-[11px] uppercase font-black tracking-widest text-slate-400">
              SÁCH LUẬT · V1.0
            </span>
          </div>
          <h1 className="font-display font-black text-3xl md:text-4xl tracking-tight">
            <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-300 bg-clip-text text-transparent">
              📖 Luật chơi & Thủ thuật
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-2xl mx-auto">
            Hiểu luật = thắng 50% ván game. Đọc kỹ quy tắc xếp hạng tín nhiệm, 4 ngành, cách tính lãi suất, đòn bẩy và cơ chế phá sản bên dưới!
          </p>
        </motion.header>

        <div className="space-y-2">
          {sections.map((s, i) => (
            <button
              key={i}
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full text-left game-card overflow-hidden !transition-all"
            >
              <div className="px-4 md:px-5 py-3 flex items-center gap-3 bg-slate-900/40 hover:bg-slate-900/70 transition-colors">
                <div className={`w-9 h-9 shrink-0 rounded-lg grid place-items-center
                  ${i === 0 ? 'text-amber-400 bg-amber-500/10' :
                    i === 1 ? 'text-sky-300 bg-sky-500/10' :
                    i === 2 ? 'text-emerald-300 bg-emerald-500/10' :
                    i === 3 ? 'text-blue-300 bg-blue-500/10' :
                    i === 4 ? 'text-violet-300 bg-violet-500/10' :
                    i === 5 ? 'text-rose-300 bg-rose-500/10' :
                             'text-orange-300 bg-orange-500/10'}`}>
                  {s.icon}
                </div>
                <span className="font-black text-slate-100 text-base flex-1">{s.title}</span>
                {open === i ? <ChevronUp size={20} className="text-amber-400" /> : <ChevronDown size={20} className="text-slate-500" />}
              </div>
              <div>
                <AnimatePresence>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 md:px-5 py-4 border-t border-slate-700/60">
                        {s.body}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center py-6">
          <a href="/" className="btn btn-primary">
            <span className="mr-2">⬅</span> Quay về màn hình chính · Bắt đầu ván game
          </a>
        </div>
      </div>
    </div>
  );
}
