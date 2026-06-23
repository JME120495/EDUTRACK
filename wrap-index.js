const fs = require('fs');
const content = fs.readFileSync('backend/src/index.js', 'utf8');
const wrapped = `try {\n${content}\n} catch (error) {\n  module.exports = (req, res) => {\n    res.status(500).json({ message: 'Boot error', error: error.message, stack: error.stack });\n  };\n}`;
fs.writeFileSync('backend/src/index.js', wrapped);
