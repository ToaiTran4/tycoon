const BASE = import.meta.env.VITE_API_URL ?? '';

async function request(path, { method = 'GET', body, token, headers = {} } = {}) {
  const h = { 'Content-Type': 'application/json', ...headers };
  if (token) h['x-player-token'] = token;
  const res = await fetch(`${BASE}${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = data?.error?.message || (typeof data === 'string' ? data : `Lỗi ${res.status}`);
    throw Object.assign(new Error(msg), { code: data?.error?.code, status: res.status, data });
  }
  return data;
}

export const api = {
  createGame: (body) => request('/api/games', { method: 'POST', body }),
  joinGame: (code, body) => request(`/api/games/${code}/join`, { method: 'POST', body }),
  startGame: (code, token) => request(`/api/games/${code}/start`, { method: 'POST', token }),
  getGame: (code, { v, token } = {}) => request(`/api/games/${code}${v ? `?v=${v}` : ''}`, { token }),
  putActions: (code, actions, token) => request(`/api/games/${code}/actions`, { method: 'PUT', body: { actions }, token }),
  previewActions: (code, actions, token) => request(`/api/games/${code}/preview`, { method: 'POST', body: { actions }, token }),
  setReady: (code, ready, token) => request(`/api/games/${code}/ready`, { method: 'POST', body: { ready }, token }),
  resolve: (code, token) => request(`/api/games/${code}/resolve`, { method: 'POST', token }),
  advisor: (code, question, token) => request(`/api/games/${code}/advisor`, { method: 'POST', body: { question }, token }),
  getLedger: (code, { playerId, quarter, token } = {}) => {
    const qs = new URLSearchParams();
    if (playerId) qs.set('playerId', playerId);
    if (quarter != null) qs.set('quarter', quarter);
    return request(`/api/games/${code}/ledger?${qs}`, { token });
  },
  getReports: (code, quarter, token) => request(`/api/games/${code}/reports/${quarter}`, { token }),
  health: () => request('/api/health'),
};
