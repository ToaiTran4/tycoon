import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function advise(state, player, question) {
  const prompt = `
    Bạn là một cố vấn tài chính cao cấp cho người chơi ${player.name} trong game Tycoon Kinh Tế.
    Tình trạng của người chơi: Tiền mặt ${player.balances.CASH}, Xếp hạng ${player.rating}.
    Tình hình thị trường: Lãi suất ${Math.round(state.macro.policyRate * 100)}%, Lạm phát ${Math.round(state.macro.inflation * 100)}%.
    Câu hỏi của người chơi: "${question}"
    Hãy đưa ra lời khuyên ngắn gọn (dưới 100 từ), tập trung vào các hành động thực tế trong game như: vay vốn, đầu tư, tiết kiệm hoặc mở rộng ngành nghề.
  `;

  if (!ANTHROPIC_API_KEY) {
    return { answer: '⚠️ Cố vấn chưa được bật. Hãy đặt ANTHROPIC_API_KEY trong be/.env để dùng LLM.' };
  }

  try {
    const { text } = await generateText({
      model: anthropic('claude-3-haiku-20240307'),
      prompt,
    });
    return { answer: text };
  } catch (e) {
    console.warn('[LLM] Advisor failed', e.message);
    return { answer: 'Rất tiếc, cố vấn của bạn đang đi nghỉ mát. Hãy thử lại sau!' };
  }
}
