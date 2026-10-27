let app;
let initError = null;

try {
  app = require('../server/src/app');
} catch (err) {
  initError = err;
  console.error('Fatal initialization error in api/index.js:', err);
}

module.exports = (req, res) => {
  if (initError) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      success: false,
      error: 'Backend Initialization Error',
      message: initError.message,
      stack: initError.stack
    });
  }
  return app(req, res);
};

