export const EVENTS = [
  { id: 'epidemic', name: 'Dịch bệnh lan rộng', weight: 4, duration: 2, demandMult: { tourism: 0.5 }, confidenceDelta: -8 },
  { id: 'harvest_fail', name: 'Mất mùa, thiên tai', weight: 5, duration: 1, supplyMult: { agri: 0.8 }, commodityShock: 0.10, once: true },
  { id: 'ai_boom', name: 'Làn sóng công nghệ mới', weight: 5, duration: 2, demandMult: { tech: 1.3 } },
  { id: 'energy_spike', name: 'Giá năng lượng tăng vọt', weight: 5, duration: 1, commodityShock: 0.12, once: true },
  { id: 're_support', name: 'Chính sách hỗ trợ bất động sản', weight: 4, duration: 2, demandMult: { real_estate: 1.2 }, landShock: 0.03, once: true },
  { id: 'bank_stress', name: 'Ngân hàng nhỏ gặp sự cố', weight: 3, duration: 2, bankCapitalPct: -0.15, roomMult: 0.6, once: true },
  { id: 'tourism_season', name: 'Mùa du lịch bội thu', weight: 5, duration: 1, demandMult: { tourism: 1.25 }, confidenceDelta: 5, once: true },
  { id: 'agri_export', name: 'Xuất khẩu nông sản tăng', weight: 5, duration: 2, demandMult: { agri: 1.2 } },
  { id: 'min_wage', name: 'Tăng lương tối thiểu', weight: 4, duration: 1, wageShock: 0.04, once: true },
  { id: 'stimulus', name: 'Gói kích cầu chính phủ', weight: 3, duration: 1, demandIndexShock: 0.02, confidenceDelta: 5, once: true },
  { id: 'trade_war', name: 'Căng thẳng thương mại', weight: 3, duration: 2, demandMult: { tech: 0.85, agri: 0.9 }, confidenceDelta: -5, once: true },
];
