const fs = require('fs');
let content = fs.readFileSync('backend/src/index.js', 'utf8');
content = content.replace(/module\.exports = app;/g, 'module.exports = (req, res) => app(req, res);');
fs.writeFileSync('backend/src/index.js', content);
