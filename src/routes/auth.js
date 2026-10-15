const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const { read, write } = require('../utils/store');
const { ok, fail } = require('../utils/respond');
const config = require('../config');
const auth = require('../middleware/auth');
const router = express.Router();
const { rateLimit } = require('express-rate-limit');
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false });
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || !/^[a-zA-Z0-9_]{3,30}$/.test(username)) return fail(res, 'Username dài 3-30 ký tự, chỉ chữ, số, _');
    if (typeof password !== 'string' || password.length < 8 || password.length > 72) return fail(res, 'Mật khẩu dài 8-72 ký tự');
    const users = read('users');
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) return fail(res, 'Username đã tồn tại', 409);
    const user = { id: randomUUID(), username, passwordHash: await bcrypt.hash(password, 12), createdAt: new Date().toISOString() };
    users.push(user); write('users', users);
    return ok(res, { id: user.id, username: user.username }, 'Đăng ký thành công', 201);
  } catch (err) { next(err); }
});
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string') return fail(res, 'Thiếu username/password');
    const user = read('users').find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return fail(res, 'Thông tin đăng nhập không đúng', 401);
    const token = jwt.sign({}, config.jwtSecret, { subject: user.id, algorithm: 'HS256', expiresIn: config.jwtExpiresIn });
    return ok(res, { token, tokenType: 'Bearer', user: { id: user.id, username: user.username } }, 'Đăng nhập thành công');
  } catch (err) { next(err); }
});
router.get('/me', auth, (req, res) => ok(res, req.user));
module.exports = router;
