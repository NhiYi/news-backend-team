const express = require('express');
const { randomUUID } = require('crypto');
const auth = require('../middleware/auth');
const { read, write } = require('../utils/store');
const { ok, fail } = require('../utils/respond');
const router = express.Router();
const allowedSort = ['createdAt', 'updatedAt', 'title'];
function result(req, res, source) {
  const search = String(req.query.q || '').trim().toLowerCase();
  const sortBy = allowedSort.includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
  const order = req.query.order === 'asc' ? 1 : -1;
  const page = Math.max(1, Math.min(100000, parseInt(req.query.page, 10) || 1));
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
  const filtered = source.filter(n => !search || (n.title + ' ' + n.content).toLowerCase().includes(search));
  filtered.sort((a, b) => String(a[sortBy]).localeCompare(String(b[sortBy]), 'vi') * order);
  return ok(res, { items: filtered.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) } });
}
function validate(body) {
  if (!body || typeof body.title !== 'string' || !body.title.trim() || body.title.length > 200) return 'Tiêu đề phải dài 1-200 ký tự';
  if (typeof body.content !== 'string' || !body.content.trim() || body.content.length > 20000) return 'Nội dung phải dài 1-20000 ký tự';
  if (body.imageUrl !== undefined && (typeof body.imageUrl !== 'string' || body.imageUrl.length > 500 || (body.imageUrl && !/^\/uploads\/[\w.-]+$/.test(body.imageUrl)))) return 'imageUrl phải là đường dẫn /uploads/<tên file>';
  return null;
}
// Public: trả về mọi bài đã đăng
router.get('/public', (req, res) => result(req, res, read('news')));
router.get('/public/:id', (req, res) => {
  const item = read('news').find(n => n.id === req.params.id);
  return item ? ok(res, item) : fail(res, 'Không tìm thấy tin tức', 404);
});
// Private: mỗi tài khoản quản lý bài của chính mình
router.use(auth);
router.get('/', (req, res) => result(req, res, read('news').filter(n => n.authorId === req.user.id)));
router.post('/', (req, res) => {
  const err = validate(req.body);
  if (err) return fail(res, err);
  const now = new Date().toISOString();
  const item = { id: randomUUID(), title: req.body.title.trim(), content: req.body.content.trim(), imageUrl: req.body.imageUrl || '', authorId: req.user.id, createdAt: now, updatedAt: now };
  const news = read('news'); news.push(item); write('news', news);
  return ok(res, item, 'Thêm tin thành công', 201);
});
router.get('/:id', (req, res) => {
  const item = read('news').find(n => n.id === req.params.id && n.authorId === req.user.id);
  return item ? ok(res, item) : fail(res, 'Không tìm thấy tin thuộc tài khoản', 404);
});
router.put('/:id', (req, res) => {
  const err = validate(req.body); if (err) return fail(res, err);
  const news = read('news');
  const item = news.find(n => n.id === req.params.id && n.authorId === req.user.id);
  if (!item) return fail(res, 'Không tìm thấy tin thuộc tài khoản', 404);
  item.title = req.body.title.trim(); item.content = req.body.content.trim(); item.imageUrl = req.body.imageUrl || ''; item.updatedAt = new Date().toISOString();
  write('news', news); return ok(res, item, 'Cập nhật thành công');
});
router.delete('/:id', (req, res) => {
  const news = read('news');
  const item = news.find(n => n.id === req.params.id && n.authorId === req.user.id);
  if (!item) return fail(res, 'Không tìm thấy tin thuộc tài khoản', 404);
  write('news', news.filter(n => n.id !== item.id));
  return ok(res, { id: item.id }, 'Xóa tin thành công');
});
module.exports = router;
