const express = require('express');
const cors = require('cors');
const config = require('./config');
const { fail, ok } = require('./utils/respond');
if (config.jwtSecret.length < 32 || config.jwtSecret === 'THAY_BANG_CHUOI_NGAU_NHIEN_DAI_IT_NHAT_32_KY_TU') {
  console.error('Hãy cấu hình JWT_SECRET ngẫu nhiên >= 32 ký tự trong .env');
  process.exit(1);
}
const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: config.corsOrigin.split(',').map(s => s.trim()) }));
app.use(express.json({ limit: '200kb' }));
app.get('/', (_req, res) => ok(res, { name: 'News Backend API', version: '1.0.0' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/news', require('./routes/news'));
app.use('/api/files', require('./routes/files'));
app.use('/uploads', express.static(config.uploadDir, { index: false, dotfiles: 'deny' }));
app.use((_req, res) => fail(res, 'API không tồn tại', 404));
app.use((err, _req, res, _next) => {
  console.error(err);
  return fail(res, err.type === 'entity.parse.failed' ? 'JSON không hợp lệ' : 'Lỗi máy chủ', err.type === 'entity.parse.failed' ? 400 : 500);
});
app.listen(config.port, config.host, () => console.log(`API: http://${config.host}:${config.port}`));
