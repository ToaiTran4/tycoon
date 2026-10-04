import { CONFIG } from './config.js';

const SECTORS_LABELS = {
  agri: 'Nông nghiệp',
  real_estate: 'Bất động sản',
  tech: 'Công nghệ',
  tourism: 'Du lịch',
};

function fmtMoney(amount) {
  const v = Math.round(Number(amount || 0));
  if (Math.abs(v) >= 1000) {
    const ty = (v / 1000);
    return `${ty.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ`;
  }
  return `${v.toLocaleString('vi-VN')} triệu`;
}

function fmtPct(x, { multiply = true, decimals = 1 } = {}) {
  const v = multiply ? x * 100 : x;
  return `${v.toFixed(decimals).replace('.', ',')}%`;
}

function fmtSector(s) { return SECTORS_LABELS[s] || s; }

export function buildRoleLogs(state, extra = {}) {
  const logs = [];
  const macro = state.macro;
  const prevMacro = extra.prevMacro || null;
  const inflAnn = 4 * (macro.inflation || 0);
  const u = macro.unemployment || 0;
  const conf = macro.confidence || 50;

  if (prevMacro) {
    const deltaConf = conf - (prevMacro.confidence || 50);
    if (deltaConf <= -5) {
      logs.push({
        role: 'Người dân',
        severity: 'warn',
        text: `Niềm tin tiêu dùng giảm xuống ${Math.round(conf)} do thất nghiệp ${fmtPct(u, { decimals: 1 })} và lạm phát ${fmtPct(inflAnn, { multiply: false, decimals: 1 })} (quy năm); người dân cắt giảm chi tiêu du lịch.`,
      });
    } else if (deltaConf >= 5) {
      logs.push({
        role: 'Người dân',
        severity: 'good',
        text: `Thu nhập tăng, thất nghiệp ${fmtPct(u, { decimals: 1 })}: người dân chi tiêu mạnh hơn cho du lịch và công nghệ.`,
      });
    }
    const dr = macro.depositRate || 0;
    const prevDr = prevMacro.depositRate || 0;
    if (dr > prevDr + 0.0001) {
      logs.push({
        role: 'Người dân',
        severity: 'info',
        text: `Lãi suất tiền gửi lên ${fmtPct(dr, { decimals: 2 })}: người dân gửi nhiều hơn, tiêu dùng chậm lại.`,
      });
    }
  }

  for (const s of Object.keys(CONFIG.sectors)) {
    const info = macro.sectors?.[s];
    if (!info) continue;
    const ratio = info.ratio ?? 1;
    const util = info.util ?? 1;
    const pg = info.priceGrowth ?? 0;
    if (ratio > 1.1) {
      const pct = fmtPct((ratio - 1), { decimals: 0 });
      logs.push({
        role: 'Thị trường',
        severity: 'good',
        text: `Ngành ${fmtSector(s)}: cầu vượt cung ${pct}, giá tăng ${fmtPct(pg, { decimals: 1 })} — lạm phát cầu kéo.`,
      });
    } else if (ratio < 0.9) {
      const pct = fmtPct((1 - ratio), { decimals: 0 });
      logs.push({
        role: 'Thị trường',
        severity: 'warn',
        text: `Ngành ${fmtSector(s)}: cung vượt cầu ${pct}, doanh nghiệp chỉ bán được ${fmtPct(util, { decimals: 0 })} công suất, giá giảm.`,
      });
    }
  }

  if ((macro.commodityGrowth || 0) >= 0.05) {
    logs.push({
      role: 'Thị trường',
      severity: 'warn',
      text: `Giá nguyên liệu tăng ${fmtPct(macro.commodityGrowth, { decimals: 0 })} — lạm phát chi phí đẩy, biên lợi nhuận bị ép.`,
    });
  }

  if (prevMacro) {
    const pr = macro.policyRate || 0;
    const prevPr = prevMacro.policyRate || 0;
    if (Math.abs(pr - prevPr) > 0.0001) {
      const dir = pr > prevPr ? 'tăng' : 'giảm';
      logs.push({
        role: 'NHTW',
        severity: 'info',
        text: `Ngân hàng trung ương ${dir} lãi suất cơ bản lên ${fmtPct(pr, { decimals: 2 })} vì lạm phát ${fmtPct(inflAnn, { multiply: false, decimals: 1 })} và thất nghiệp ${fmtPct(u, { decimals: 1 })}.`,
      });
    }
    const room = macro.creditRoom || 0;
    const prevRoom = prevMacro.creditRoom || 1;
    if (prevRoom > 0) {
      const ratioRoom = room / prevRoom;
      if (ratioRoom <= 0.8 || ratioRoom >= 1.25) {
        const action = ratioRoom < 1 ? 'thắt chặt' : 'nới lỏng';
        logs.push({
          role: 'NHTW',
          severity: ratioRoom < 1 ? 'warn' : 'good',
          text: `Room tín dụng quý này ${fmtMoney(room)} (${action}).`,
        });
      }
    }
  }

  const borrowLogs = extra.borrowLogs || [];
  for (const b of borrowLogs) {
    const p = state.players[b.pid];
    if (!p) continue;
    if (b.ok === false || (b.requested || 0) > (b.allowed || 0)) {
      logs.push({
        role: 'Ngân hàng',
        severity: 'warn',
        text: `Ngân hàng chỉ cho ${p.name} vay ${fmtMoney(b.allowed || 0)}/${fmtMoney(b.requested || 0)} triệu vì ${b.reason || 'điều kiện không đủ'}.`,
      });
    }
  }

  const rolloverLogs = extra.rolloverLogs || [];
  for (const r of rolloverLogs) {
    const p = state.players[r.pid];
    if (!p) continue;
    if (r.ok) {
      logs.push({
        role: 'Ngân hàng',
        severity: 'info',
        text: `Khoản vay của ${p.name} đáo hạn; ngân hàng tái cấp vốn ${fmtMoney(r.refinanced || 0)} triệu.`,
      });
    } else {
      logs.push({
        role: 'Ngân hàng',
        severity: 'warn',
        text: `Khoản vay của ${p.name} đáo hạn; ngân hàng từ chối tái cấp vốn vì hạng ${r.reason || p.rating}.`,
      });
    }
  }

  const bondLogs = extra.bondLogs || [];
  for (const b of bondLogs) {
    const p = state.players[b.pid];
    if (!p) continue;
    if (b.ok === false) {
      logs.push({
        role: 'Nhà đầu tư',
        severity: 'warn',
        text: `Nhà đầu tư từ chối trái phiếu của ${p.name}: ${b.reason || 'điều kiện không đủ'}.`,
      });
    } else if (b.fillFactor != null && b.fillFactor < 0.999) {
      const pct = fmtPct(b.fillFactor, { decimals: 0 });
      logs.push({
        role: 'Nhà đầu tư',
        severity: 'info',
        text: `Nhà đầu tư chỉ mua ${pct} trái phiếu quý này của ${p.name} vì ngân sách còn ${fmtMoney(b.budget || 0)} cho nhiều người phát hành.`,
      });
    }
  }

  const shareLogs = extra.shareLogs || [];
  for (const s of shareLogs) {
    const p = state.players[s.pid];
    if (!p) continue;
    const pe = s.pe != null ? s.pe.toFixed(1).replace('.', ',') : '—';
    const price = fmtMoney(s.sharePrice || 0);
    const stake = s.founderStake != null ? fmtPct(s.founderStake, { decimals: 0 }) : '—';
    logs.push({
      role: 'Nhà đầu tư',
      severity: 'info',
      text: `Cổ phiếu ${p.name} định giá ${price}/cp (P/E ${pe}); phát hành làm tỷ lệ sở hữu của người sáng lập còn ${stake}.`,
    });
  }

  const govTax = extra.govTax || 0;
  const govSpend = extra.govSpend || 0;
  if (govTax > 0 || govSpend > 0) {
    logs.push({
      role: 'Chính phủ',
      severity: 'info',
      text: `Chính phủ thu thuế ${fmtMoney(govTax)} triệu, chi kích cầu ${fmtMoney(govSpend)} triệu.`,
    });
  }

  const bankrupts = extra.bankrupts || [];
  for (const bk of bankrupts) {
    const p = state.players[bk.pid];
    if (!p) continue;
    const reason = bk.reason || 'vốn chủ âm / nợ quá hạn hai quý liên tiếp';
    logs.push({
      role: 'Kế toán',
      severity: 'warn',
      text: `${p.name} phá sản: ${reason}. Ngân hàng chịu lỗ ${fmtMoney(bk.bankLoss || 0)} triệu.`,
    });
  }

  const newEvents = extra.newEvents || [];
  for (const ev of newEvents) {
    logs.push({
      role: 'Sự kiện',
      severity: ev.severity || 'info',
      text: `Sự kiện: ${ev.name} — ${ev.description || ''}`,
    });
  }

  return logs;
}

export default buildRoleLogs;
