require('dotenv').config();
const path = require('path');
const { createServer } = require('./server.cjs');

const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || '0.0.0.0';
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not set. Set it in the host environment before public use.');
}

const app = createServer(dataDir);
app.listen(PORT, HOST, () => {
  console.log('');
  console.log('======================================');
  console.log('       CARRER-X STUDENT BACKEND');
  console.log('======================================');
  console.log(`Listening: http://${HOST}:${PORT}`);
  console.log(`Health:    http://127.0.0.1:${PORT}/api/health`);
  console.log('======================================');
  console.log('');
});
