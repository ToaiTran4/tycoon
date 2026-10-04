import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function generateNarrative(state, extra) {
  const { quarter, macro, players } = state;
  const { prevMacro, bankrupts, newEvents } = extra;

  const prompt = `
    Bạn là một phóng viên kinh tế tài ba. Hãy viết bản tin ngắn về tình hình thị trường Quý ${quarter}.
    Thông số vĩ mô: Lãi suất ${Math.round(macro.policyRate * 100)}%, Lạm phát ${Math.round(macro.inflation * 100)}%, Niềm tin ${macro.confidence}.
    Sự kiện mới: ${newEvents.join(', ') || 'Không có'}.
    Phá sản: ${bankrupts.map(p => p.name).join(', ') || 'Không có'}.
    Hãy viết 1 tiêu đề (headline) và 1 đoạn tin vắn (narrative) sinh động, hài hước nhưng chuyên nghiệp.
    Trả về định dạng JSON: { "headline": "...", "narrative": "..." }
  `;

  if (!ANTHROPIC_API_KEY) {
    // Fallback template
    const headline = `Quý ${quarter}: ${macro.confidence > 60 ? 'Thị trường khởi sắc' : 'Thị trường thận trọng'}`;
    const narrative = `Lãi suất duy trì ở mức ${Math.round(macro.policyRate * 100)}%. ${newEvents.length ? `Sự kiện ${newEvents[0]} đang tác động mạnh.` : 'Không có biến động lớn.'}`;
    return { headline, narrative };
  }

  try {
    const { text } = await generateText({
      model: anthropic('claude-3-haiku-20240307'),
      prompt,
    });
    return JSON.parse(text);
  } catch (e) {
    console.warn('[LLM] Narrative failed', e.message);
    return { headline: `Quý ${quarter} Tóm tắt`, narrative: 'Thị trường đang trong giai đoạn chuyển giao.' };
  }
}
