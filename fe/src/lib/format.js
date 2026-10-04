export function fmtMoney(v) {
  if (v == null) return '—';
  const abs = Math.abs(Number(v));
  if (abs >= 1000) {
    return `${(v / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ`;
  }
  return `${v.toLocaleString('vi-VN')} triệu`;
}

export function fmtPct(v, { multiply = 4, digits = 1, suffix = '/năm' } = {}) {
  if (v == null) return '—';
  const num = Number(v) * multiply * 100;
  return `${num.toLocaleString('vi-VN', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%${suffix ?? ''}`;
}

export function fmtPctQ(v, digits = 1) {
  return fmtPct(v, { multiply: 1, digits, suffix: '/quý' });
}

export function fmtNumber(v, digits = 0) {
  return Number(v).toLocaleString('vi-VN', { maximumFractionDigits: digits });
}

export const SECTOR_NAMES = {
  agri: 'Nông nghiệp',
  real_estate: 'Bất động sản',
  tech: 'Công nghệ',
  tourism: 'Du lịch',
};

export const TIER_NAMES = { core: 'Trung tâm', mid: 'Nửa vòng', edge: 'Vành ngoài' };
