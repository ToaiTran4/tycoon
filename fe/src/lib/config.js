export const CONFIG = {
  actionPoints: 3,
  grid: { w: 6, h: 6 },
  startCash: 10_000,
  startShares: 10_000,
  landBase: { core: 1400, mid: 1000, edge: 650 },
  idle: { taxRate: 0.015, taxAfter: 2, claimAfter: 4, claimPremium: 1.15 },
  levels: { capacity: [1.0, 2.1, 3.3], workers: [5, 10, 15] },
  baseWage: 40,
  sectors: {
    agri:        { name: 'Nông nghiệp',  short: 'NN',  icon: '🌾', color: 'emerald', build: [1000, 1300, 1800] },
    real_estate: { name: 'Bất động sản', short: 'BDS', icon: '🏘️', color: 'blue', build: [1500, 2000, 2800] },
    tech:        { name: 'Công nghệ',    short: 'CN',  icon: '💻', color: 'violet', build: [1300, 1800, 2600] },
    tourism:     { name: 'Du lịch',      short: 'DL',  icon: '🏖️', color: 'amber', build: [1200, 1600, 2300] },
  },
  tierNames: { core: 'Trung tâm', mid: 'Nửa vòng', edge: 'Vành ngoài' },
  seats: [
    { bg: 'bg-amber-500',  fg: 'text-amber-950',  ring: 'ring-amber-500',  light: 'bg-amber-500/20',  text: 'text-amber-400'  },
    { bg: 'bg-blue-500',   fg: 'text-blue-950',   ring: 'ring-blue-500',   light: 'bg-blue-500/20',   text: 'text-blue-400'   },
    { bg: 'bg-emerald-500',fg: 'text-emerald-950',ring: 'ring-emerald-500',light: 'bg-emerald-500/20',text: 'text-emerald-400'},
    { bg: 'bg-rose-500',   fg: 'text-rose-950',   ring: 'ring-rose-500',   light: 'bg-rose-500/20',   text: 'text-rose-400'   },
    { bg: 'bg-violet-500', fg: 'text-violet-950', ring: 'ring-violet-500', light: 'bg-violet-500/20', text: 'text-violet-400' },
    { bg: 'bg-cyan-500',   fg: 'text-cyan-950',   ring: 'ring-cyan-500',   light: 'bg-cyan-500/20',   text: 'text-cyan-400'   },
  ],
  rndRates: [0, 0.03, 0.06, 0.1],
  phaseNames: { boom: 'Phát triển', stable: 'Ổn định', recession: 'Suy thoái' },
  phaseColors: {
    boom: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    stable: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    recession: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  },
  ratingColors: {
    A: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    B: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    C: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    D: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
  },
};

export const SEAT_COLORS = CONFIG.seats;

export function seatColor(seat) {
  return CONFIG.seats[seat % CONFIG.seats.length];
}

export default CONFIG;
