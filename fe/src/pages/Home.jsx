import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { saveToken } from '../lib/useGame.js';
import { CONFIG } from '../lib/config.js';
import {
  Sparkles, Building2, Users, Clock, Trophy, Play,
  ArrowRight, Copy, BookOpen, HelpCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarPicker } from '../components/ChibiAvatar.jsx';

export default function Home() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('create');
  const [createName, setCreateName] = useState('');
  const [createAvatar, setCreateAvatar] = useState('male');
  const [totalQuarters, setTotalQuarters] = useState(20);
  const [quarterSeconds, setQuarterSeconds] = useState(0);

  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinAvatar, setJoinAvatar] = useState('male');
  const [loading, setLoading] = useState(false);
  const [faq, setFaq] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (createName.length < 2) return alert('Tên quá ngắn (tối thiểu 2 ký tự)');
    setLoading(true);
    try {
      const res = await api.createGame({ hostName: createName, avatar: createAvatar, totalQuarters, quarterSeconds });
      saveToken(res.code, res.token);
      navigate(`/game/${res.code}`);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (joinCode.length < 6) return alert('Mã phòng gồm 6 ký tự');
    if (joinName.length < 2) return alert('Tên quá ngắn');
    setLoading(true);
    try {
      const res = await api.joinGame(joinCode.toUpperCase(), { name: joinName, avatar: joinAvatar });
      saveToken(res.code, res.token);
      navigate(`/game/${res.code}`);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    { q: 'Cách chơi đơn giản?', a: 'Mỗi quý bạn có 3 điểm hành động (AP). Dùng AP để đấu giá đất, xây nhà máy, nâng cấp, phát hành trái phiếu/cổ phiếu... Hết lượt bấm "Sẵn sàng" → engine tự chốt quý (tính doanh thu, lãi suất, thuế, sự kiện...) và đến quý mới. Kết thúc N quý, người có TÀI SẢN RỒNG (VCSH) cao nhất là người thắng!' },
    { q: 'Có cần kiến thức kinh tế không?', a: 'Không! Luật chơi được thiết kế để bạn học ngay trong game. Thử các chiến thuật đa dạng: đầu tư nhiều ngành, vay đòn bẩy, mua đất trống, hoặc "ăn chắc" gửi ngân hàng. Game sẽ giải thích mọi thuật ngữ qua tooltips và cố vấn AI (khi bật LLM).' },
    { q: 'Có thể chơi cùng bạn bè không?', a: 'Có! Tạo phòng, gửi mã 6 ký tự + link cho bạn bè (hoặc dùng Cloudflare Tunnel cho link công khai). Ứng dụng hỗ trợ 2–6 người chơi theo lượt, mỗi ván 20 quý (~45-60 phút).' },
    { q: 'Nguồn gốc các chỉ số KT?', a: 'Lãi suất, lạm phát, tăng trưởng, niềm tin, thất nghiệp được tính theo công thức mô phỏng chu kỳ kinh tế + cú sốc xúc xắc + cung/ cầu theo ngành. Động lực chính: quyết định đầu tư của NGƯỜI CHƠI tác động ngược lại nền kinh tế!' },
    { q: 'Phá sản thì sao?', a: 'Nợ quá hạn > 300 triệu hoặc không trả được lãi/vốn → phá sản. Bạn vẫn xem game với tư cách "khán giả" (xếp hạng = cuối bảng). Tài sản của bạn được thanh lý, nhà đầu tư và ngân hàng chia số còn lại theo luật ưu tiên.' },
  ];

  return (
    <div className="min-h-screen py-6 px-3 md:py-10 flex flex-col items-center">
      {/* Background deco */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background:
          'radial-gradient(600px 300px at 20% -10%, rgba(251,191,36,0.15), transparent 60%),' +
          'radial-gradient(500px 250px at 100% 20%, rgba(59,130,246,0.14), transparent 60%),' +
          'radial-gradient(400px 250px at 50% 120%, rgba(16,185,129,0.12), transparent 60%)',
      }} />

      <div className="w-full max-w-5xl relative z-10 space-y-6">
        {/* Hero */}
        <motion.header
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900/60 border border-slate-700/70 backdrop-blur mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
            <span className="text-[11px] uppercase font-black tracking-widest text-slate-400">
              Engine mô phỏng • Node.js + React • Realtime qua WebSocket
            </span>
            <Trophy size={14} className="text-amber-400" />
          </div>

          <div className="flex items-center justify-center gap-3 mb-2">
            <motion.div
              animate={{ rotate: [0, -6, 6, 0] }} transition={{ repeat: Infinity, duration: 6 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center shadow-glow-yellow shadow-xl"
            >
              <Building2 size={30} className="text-white" strokeWidth={2.2} />
            </motion.div>
            <h1 className="font-display font-black text-4xl md:text-5xl tracking-tight">
              <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-300 bg-clip-text text-transparent">
                TYCOON KINH TẾ
              </span>
            </h1>
            <Sparkles size={22} className="text-amber-400 animate-float" />
          </div>

          <p className="text-slate-300 max-w-2xl mx-auto text-sm md:text-base">
            Game mô phỏng kinh tế theo lượt 2–6 người chơi.
            Mua đất, xây công ty, vay vốn, phát hành cổ phiếu, đầu tư R&amp;D.
            <span className="text-amber-300"> Người có tài sản ròng cao nhất khi kết thúc là GIÀNH CHIẾN THẮNG!</span>
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-2 text-[11px]">
            {[
              ['💰', '10 tỷ vốn ban đầu'],
              ['🏘️', '4 ngành kinh tế'],
              ['📈', 'Chu kỳ kinh tế thực tế'],
              ['🏛️', 'Vay / Trái phiếu / Cổ phiếu'],
              ['👑', '20 quý / ván'],
              ['🤖', 'Bot AI / Cố vấn'],
            ].map(([i, t]) => (
              <span key={t} className="stat-chip shadow-md">
                <span className="text-base">{i}</span>{t}
              </span>
            ))}
          </div>
        </motion.header>

        {/* Create / Join card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="game-card max-w-2xl mx-auto overflow-hidden"
        >
          <div className="tabs tabs-lifted !rounded-none">
            <button
              onClick={() => setTab('create')}
              className={`tab ${tab === 'create' ? 'tab-active !bg-slate-800 !text-amber-300 border-b-2 border-amber-500' : '!text-slate-400'}`}
            >
              <Play size={13} className="mr-1" /> TẠO PHÒNG MỚI
            </button>
            <button
              onClick={() => setTab('join')}
              className={`tab ${tab === 'join' ? 'tab-active !bg-slate-800 !text-blue-300 border-b-2 border-blue-500' : '!text-slate-400'}`}
            >
              <Users size={13} className="mr-1" /> VÀO PHÒNG CÓ SẴN
            </button>
          </div>

          <div className="p-5 md:p-6">
            <AnimatePresence mode="wait">
              {tab === 'create' && (
                <motion.form
                  key="create" onSubmit={handleCreate}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                  className="space-y-4"
                >
                  <label className="form-control w-full">
                    <div className="label"><span className="label-text font-bold">👤 Tên của bạn (chủ phòng)</span></div>
                    <input
                      type="text" maxLength={20} minLength={2}
                      className="input input-bordered w-full focus:border-amber-500"
                      placeholder="VD: Tỷ phú Trần Văn Lắm"
                      value={createName}
                      onChange={e => setCreateName(e.target.value)}
                      disabled={loading}
                    />
                  </label>
                  <div>
                    <div className="label"><span className="label-text font-bold">🎭 Chọn nhân vật</span></div>
                    <AvatarPicker value={createAvatar} onChange={setCreateAvatar} disabled={loading} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="form-control w-full">
                      <div className="label"><span className="label-text font-bold flex items-center gap-1.5"><Trophy size={13}/> Số quý (độ dài ván)</span></div>
                      <select className="select select-bordered w-full"
                        value={totalQuarters} onChange={e => setTotalQuarters(parseInt(e.target.value))} disabled={loading}>
                        <option value={12}>12 quý (~3 năm · nhanh 30')</option>
                        <option value={16}>16 quý (~4 năm · 40')</option>
                        <option value={20}>20 quý (~5 năm · 50' · MẶC ĐỊNH)</option>
                        <option value={24}>24 quý (~6 năm · chiến lược)</option>
                      </select>
                    </label>
                    <label className="form-control w-full">
                      <div className="label"><span className="label-text font-bold flex items-center gap-1.5"><Clock size={13}/> Thời gian / quý</span></div>
                      <input
                        type="number" min={0} max={3600}
                        className="input input-bordered w-full font-mono"
                        placeholder="0 = không giới hạn (bấm Sẵn sàng)"
                        value={quarterSeconds}
                        onChange={e => {
                          const v = parseInt(e.target.value);
                          setQuarterSeconds(isNaN(v) ? 0 : Math.max(0, v));
                        }}
                        disabled={loading}
                      />
                      <div className="label !py-1"><span className="label-text-alt text-slate-500">
                        0 = chơi không đồng hồ (đề xuất). Nếu đặt &gt; 0: sẽ tự động chốt quý khi hết giờ.
                      </span></div>
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || createName.length < 2}
                    className={`btn-game btn btn-lg w-full border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-amber-950 shadow-lg shadow-amber-500/20 hover:shadow-glow-yellow ${loading ? 'loading' : ''}`}
                  >
                    {loading ? 'Đang khởi tạo ván...' : (<><Play size={18} className="mr-2" /> TẠO VÁN GAME · BẮT ĐẦU ĐẦU TƯ</>)}
                  </button>
                </motion.form>
              )}

              {tab === 'join' && (
                <motion.form
                  key="join" onSubmit={handleJoin}
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                  className="space-y-4"
                >
                  <label className="form-control w-full">
                    <div className="label"><span className="label-text font-bold">🔑 Mã phòng (6 ký tự)</span></div>
                    <div className="flex gap-2">
                      <input
                        type="text" maxLength={6} minLength={6}
                        className="input input-bordered w-full font-mono uppercase tracking-widest text-xl focus:border-blue-500"
                        placeholder="ABC123"
                        value={joinCode}
                        onChange={e => setJoinCode(e.target.value)}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => navigator.clipboard?.readText?.().then(t => setJoinCode(t.trim().toUpperCase()))}
                        className="btn btn-outline"
                        title="Dán từ bộ đệm"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </label>
                  <div>
                    <div className="label"><span className="label-text font-bold">🎭 Chọn nhân vật</span></div>
                    <AvatarPicker value={joinAvatar} onChange={setJoinAvatar} disabled={loading} />
                  </div>
                  <label className="form-control w-full">
                    <div className="label"><span className="label-text font-bold">👤 Tên hiển thị của bạn</span></div>
                    <input
                      type="text" maxLength={20} minLength={2}
                      className="input input-bordered w-full focus:border-blue-500"
                      placeholder="Tên của bạn trong game"
                      value={joinName}
                      onChange={e => setJoinName(e.target.value)}
                      disabled={loading}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={loading || joinCode.length < 6 || joinName.length < 2}
                    className={`btn-game btn btn-lg w-full border-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-glow-blue ${loading ? 'loading' : ''}`}
                  >
                    {loading ? 'Đang tham gia phòng...' : (<><Users size={18} className="mr-2" /> THAM GIA VÁN GAME</>)}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Sectors preview */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="game-card p-5 md:p-6"
        >
          <div className="game-card-title mb-4 text-base">
            <Trophy size={16} className="text-amber-400" /> CÁC NGÀNH ĐẦU TƯ CHÍNH
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(CONFIG.sectors).map(([k, s], i) => (
              <motion.div
                key={k} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 + i * 0.06 }}
                className="relative rounded-xl border border-slate-700/70 p-4 bg-slate-900/60 hover:border-amber-500/40 transition-all hover:-translate-y-1 hover:shadow-lg overflow-hidden"
              >
                <div className="text-3xl mb-1">{s.icon}</div>
                <div className="font-black text-slate-100">{s.name}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {k === 'agri' && 'Vốn thấp, ổn định, nhạy cảm thời tiết & giá nông sản.'}
                  {k === 'real_estate' && 'Đón đầu sóng tăng giá đất, nhạy cảm lãi suất & tín dụng.'}
                  {k === 'tech' && 'Lợi nhuận cao, cạnh tranh, cần R&D thường xuyên.'}
                  {k === 'tourism' && 'Phụ thuộc niềm tin & chu kỳ, mùa vụ rõ rệt.'}
                </div>
                <div className="absolute -bottom-6 -right-4 text-6xl opacity-5 rotate-12">{s.icon}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="game-card p-5 md:p-6"
        >
          <div className="game-card-title mb-3 text-base">
            <HelpCircle size={16} className="text-amber-400" /> CÂU HỎI THƯỜNG GẶP
          </div>
          <div className="space-y-2">
            {faqs.map((f, i) => (
              <button key={i} onClick={() => setFaq(faq === i ? null : i)}
                className="w-full text-left rounded-xl border border-slate-700/70 bg-slate-900/50 px-4 py-3 hover:border-amber-500/40 transition-all">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-200">{f.q}</span>
                  {faq === i ? <ChevronUp size={16} className="text-amber-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
                <AnimatePresence>
                  {faq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 pt-2 border-t border-slate-700/70 text-[13px] text-slate-300 leading-relaxed">
                        {f.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Footer nav */}
        <footer className="flex flex-wrap items-center justify-center gap-4 text-[12px] text-slate-400 py-4">
          <a href="/luat-choi" className="link link-hover flex items-center gap-1.5">
            <BookOpen size={14} /> Luật chơi chi tiết
          </a>
          <span className="opacity-40">•</span>
          <a href="#" onClick={(e) => { e.preventDefault(); alert('Source code: mở package.json & README.md để xem chi tiết.'); }} className="link link-hover">
            💻 Thông tin dự án
          </a>
          <span className="opacity-40">•</span>
          <span>© {new Date().getFullYear()} Chest / Tycoon Kinh Tế Engine</span>
        </footer>
      </div>
    </div>
  );
}
