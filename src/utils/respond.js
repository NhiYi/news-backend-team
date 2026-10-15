function ok(res, data, message = 'Thành công', status = 200) {
  return res.status(status).json({ success: true, message, data });
}
function fail(res, message, status = 400) {
  return res.status(status).json({ success: false, message, data: null });
}
module.exports = { ok, fail };
