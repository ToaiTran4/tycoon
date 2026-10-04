#!/usr/bin/env node
// Kiểm tra khói API (chi tiết ở M9)
const base = process.argv[2] || 'http://localhost:3000';
async function run() {
  const h = await fetch(`${base}/api/health`).then(r => r.json()).catch(e => ({ error: e.message }));
  console.log('[smoke] health=', h);
  if (!h?.ok) { console.error('[smoke] FAIL'); process.exit(1); }
  console.log('[smoke] OK (đơn giản — M9 sẽ mở rộng)');
}
run();
