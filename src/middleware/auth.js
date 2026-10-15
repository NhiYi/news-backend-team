const jwt = require('jsonwebtoken');
const config = require('../config');
const { read } = require('../utils/store');
const { fail } = require('../utils/respond');
module.exports = (req, res, next) => {
  const match = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '');
  if (!match) return fail(res, 'Thiếu Bearer token', 401);
  try {
    const payload = jwt.verify(match[1], config.jwtSecret, { algorithms: ['HS256'] });
    const user = read('users').find(x => x.id === payload.sub);
    if (!user) return fail(res, 'Tài khoản không tồn tại', 401);
    req.user = { id: user.id, username: user.username };
    next();
  } catch { return fail(res, 'Token không hợp lệ hoặc đã hết hạn', 401); }
};
