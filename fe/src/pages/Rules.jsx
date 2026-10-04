export default function Rules() {
  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📖 Luật chơi — Tycoon Kinh Tế</h1>
      <article className="prose prose-invert max-w-none">
        <h2>Tổng quan</h2>
        <p>
          Game kinh doanh theo lượt (mỗi lượt = 1 quý), 2–6 người chơi, mặc định 20 quý.
          Mỗi người điều hành một công ty, khởi đầu <strong>10 tỷ đồng tiền mặt</strong>.
          Thắng: tài sản ròng (vốn chủ) cao nhất khi kết thúc. Phá sản = thua.
        </p>
        <h2>Cách chơi</h2>
        <ol>
          <li>Xem bản tin thị trường, xúc xắc, danh sách đất rao bán.</li>
          <li>Đặt hành động (tối đa 3 điểm hành động/quý): mua đất, xây công ty, vay, phát hành...</li>
          <li>Bấm "Xong lượt" và đợi mọi người.</li>
          <li>Engine chốt quý, phát sinh doanh thu, chi phí, thuế, lãi suất, sự kiện...</li>
        </ol>
        <h2>Các ngành đầu tư</h2>
        <ul>
          <li>🌾 <strong>Nông nghiệp</strong>: vốn thấp, ổn định.</li>
          <li>🏘️ <strong>Bất động sản</strong>: nhạy cảm với lãi suất, giá đất tăng mạnh.</li>
          <li>💻 <strong>Công nghệ</strong>: lợi nhuận cao, cạnh tranh gay gắt.</li>
          <li>🏖️ <strong>Du lịch</strong>: phụ thuộc niềm tin tiêu dùng, mùa vụ.</li>
        </ul>
      </article>
      <a href="/" className="btn btn-outline mt-6">⬅ Quay lại trang chủ</a>
    </div>
  );
}
