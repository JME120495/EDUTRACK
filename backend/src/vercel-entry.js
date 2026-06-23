module.exports = (req, res) => {
  try {
    const app = require('./index.js');
    return app(req, res);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      message: 'Boot error in vercel-entry',
      error: error.message,
      stack: error.stack
    }));
  }
};
