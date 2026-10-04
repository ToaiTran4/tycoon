import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { saveToken } from '../lib/useGame.js';

export default function Home() {
  const navigate = useNavigate();
  const [createName, setCreateName] = useState('');
  const [totalQuarters, setTotalQuarters] = useState(20);
  const [quarterSeconds, setQuarterSeconds] = useState(0);
  
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (createName.length < 2) return alert('Tên quá ngắn');
    setLoading(true);
    try {
      const res = await api.createGame({ hostName: createName, totalQuarters, quarterSeconds });
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
    if (joinCode.length < 6) return alert('Mã phòng không hợp lệ');
    if (joinName.length < 2) return alert('Tên quá ngắn');
    setLoading(true);
    try {
      const res = await api.joinGame(joinCode.toUpperCase(), { name: joinName });
      saveToken(res.code, res.token);
      navigate(`/game/${res.code}`);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-base-300">
      <div className="card bg-base-100 shadow-xl w-full max-w-lg border border-base-300">
        <div className="card-body">
          <h1 className="card-title text-3xl text-center justify-center mb-2">🏢 Tycoon Kinh Tế</h1>
          <p className="text-center opacity-60 text-sm mb-4">Mô phỏng kinh tế thực tế — Xây dựng đế chế kinh doanh của bạn!</p>
          
          <div role="tablist" className="tabs tabs-lifted">
            <input type="radio" name="home_tabs" role="tab" className="tab" aria-label="Tạo phòng" defaultChecked />
            <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <label className="form-control w-full">
                  <div className="label"><span className="label-text font-bold">Tên của bạn</span></div>
                  <input 
                    type="text" 
                    className="input input-bordered w-full" 
                    placeholder="Nhập tên của bạn" 
                    value={createName}
                    onChange={e => setCreateName(e.target.value)}
                    disabled={loading}
                  />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="form-control w-full">
                    <div className="label"><span className="label-text font-bold">Số quý</span></div>
                    <select 
                      className="select select-bordered w-full"
                      value={totalQuarters}
                      onChange={e => setTotalQuarters(parseInt(e.target.value))}
                      disabled={loading}
                    >
                      <option value={12}>12 quý (~3 năm)</option>
                      <option value={16}>16 quý (~4 năm)</option>
                      <option value={20}>20 quý (~5 năm)</option>
                      <option value={24}>24 quý (~6 năm)</option>
                    </select>
                  </label>
                  <label className="form-control w-full">
                    <div className="label"><span className="label-text font-bold">Giây/quý</span></div>
                    <input 
                      type="number" 
                      className="input input-bordered w-full" 
                      placeholder="0 = vô hạn" 
                      value={quarterSeconds}
                      onChange={e => setQuarterSeconds(parseInt(e.target.value))}
                      disabled={loading}
                    />
                  </label>
                </div>
                <button type="submit" className={`btn btn-primary mt-2 ${loading ? 'loading' : ''}`} disabled={loading}>
                  Tạo phòng mới
                </button>
              </form>
            </div>

            <input type="radio" name="home_tabs" role="tab" className="tab" aria-label="Vào phòng" />
            <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
              <form onSubmit={handleJoin} className="flex flex-col gap-4">
                <label className="form-control w-full">
                  <div className="label"><span className="label-text font-bold">Mã phòng</span></div>
                  <input 
                    type="text" 
                    className="input input-bordered w-full font-mono uppercase" 
                    placeholder="6 ký tự" 
                    maxLength={6}
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value)}
                    disabled={loading}
                  />
                </label>
                <label className="form-control w-full">
                  <div className="label"><span className="label-text font-bold">Tên của bạn</span></div>
                  <input 
                    type="text" 
                    className="input input-bordered w-full" 
                    placeholder="Nhập tên của bạn" 
                    value={joinName}
                    onChange={e => setJoinName(e.target.value)}
                    disabled={loading}
                  />
                </label>
                <button type="submit" className={`btn btn-secondary mt-2 ${loading ? 'loading' : ''}`} disabled={loading}>
                  Tham gia phòng
                </button>
              </form>
            </div>
          </div>
          
          <div className="flex justify-center gap-4 mt-6 text-sm opacity-60">
            <a className="link link-hover" href="/luat-choi">📖 Luật chơi</a>
            <span>•</span>
            <a className="link link-hover" target="_blank" href="https://github.com">💻 GitHub</a>
          </div>
        </div>
      </div>
    </div>
  );
}
