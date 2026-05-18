// 🔥 Polyfill для Web Crypto API в Node.js 18 (ДОЛЖЕН БЫТЬ ПЕРВЫМ!)
if (typeof global.crypto === 'undefined') {
  global.crypto = require('crypto').webcrypto;
}

// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const db = require('./src/config/db');
const cacheService = require('./src/services/CacheService');
const setupRoutes = require('./src/routes');
const { specs, ui, setup } = require('./src/config/swagger');
const app = express();
const PORT = process.env.PORT || 3000;
const SERVER_ID = process.env.SERVER_ID || 'unknown';

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  credentials: true
}));

// Static Files for Uploads
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOAD_DIR));

// Swagger UI
app.use('/api-docs', ui, setup);

// --- Эндпоинт для проверки балансировки ---
app.get('/api/check-balance', (req, res) => {
  res.json({
    message: "Response from backend server",
    serverId: SERVER_ID,
    port: PORT.toString(),
    instance: `backend${PORT}`
  });
});

// Initialize DB and Cache and Start Server
Promise.all([db.connect(), cacheService.connect()])
  .then(() => {
    setupRoutes(app);
    // 🔥 Важно для Docker: слушаем на 0.0.0.0
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 [${SERVER_ID}] Server running on http://0.0.0.0:${PORT}`);
      console.log(`✅ Connected to MongoDB & Redis`);
    });
  })
  .catch(err => {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  });

module.exports = app;