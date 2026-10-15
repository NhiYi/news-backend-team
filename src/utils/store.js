const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const config = require('../config');
fs.mkdirSync(config.dataDir, { recursive: true });
function filename(collection) {
  if (!['users', 'news'].includes(collection)) throw new Error('Invalid collection');
  return path.join(config.dataDir, collection + '.json');
}
function read(collection) {
  const file = filename(collection);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function write(collection, records) {
  const file = filename(collection);
  const tmp = file + '.' + randomUUID() + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(records, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}
module.exports = { read, write };
