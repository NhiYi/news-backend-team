const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const config = require('../config');
const auth = require('../middleware/auth');
const { ok, fail } = require('../utils/respond');
const router = express.Router();
fs.mkdirSync(config.uploadDir, { recursive: true });
const allowed = new Map([['image/jpeg', '.jpg'], ['image/png', '.png'], ['image/webp', '.webp'], ['application/pdf', '.pdf']]);
const upload = multer({
  storage: multer.diskStorage({ destination: (_req, _file, cb) => cb(null, config.uploadDir), filename: (_req, file, cb) => cb(null, randomUUID() + allowed.get(file.mimetype)) }),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter: (_req, file, cb) => allowed.has(file.mimetype) ? cb(null, true) : cb(new Error('Chỉ hỗ trợ JPG, PNG, WEBP, PDF'))
});
router.use(auth);
router.post('/upload', (req, res, next) => upload.single('file')(req, res, err => {
  if (err) return fail(res, err.code === 'LIMIT_FILE_SIZE' ? 'File vượt dung lượng cho phép' : err.message, 400);
  if (!req.file) return fail(res, 'Thiếu trường file');
  // Chữ ký file được kiểm tra nhằm tránh tin tưởng hoàn toàn MIME do client cung cấp.
  const buf = fs.readFileSync(req.file.path);
  const hex = buf.subarray(0, 12).toString('hex');
  const mime = req.file.mimetype;
  const valid = mime === 'image/jpeg' ? hex.startsWith('ffd8ff') : mime === 'image/png' ? hex.startsWith('89504e470d0a1a0a') : mime === 'image/webp' ? buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP' : hex.startsWith('255044462d');
  if (!valid) { fs.unlinkSync(req.file.path); return fail(res, 'Nội dung file không đúng định dạng'); }
  return ok(res, { filename: req.file.filename, url: '/uploads/' + req.file.filename, size: req.file.size }, 'Upload thành công', 201);
}));
router.delete('/:filename', (req, res) => {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/.test(req.params.filename)) return fail(res, 'Tên file không hợp lệ');
  const target = path.join(config.uploadDir, req.params.filename);
  if (!fs.existsSync(target)) return fail(res, 'File không tồn tại', 404);
  // Demo sử dụng chung: người đã đăng nhập được phép xóa file bất kỳ trong thư mục uploads.
  fs.unlinkSync(target);
  return ok(res, { filename: req.params.filename }, 'Xóa file thành công');
});
module.exports = router;
