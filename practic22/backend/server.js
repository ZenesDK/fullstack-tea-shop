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

// --- Добавим маршрут для проверки балансировки ---
app.get('/api/check-balance', (req, res) => {
    res.json({
        message: "Response from backend server",
        port: PORT.toString(),
        instance: `backend${PORT}` // Уникальный идентификатор экземпляра
    });
});
// --- Конец добавления ---

// Initialize DB and Cache and Start Server
Promise.all([db.connect(), cacheService.connect()])
    .then(() => {
        setupRoutes(app);
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📚 Swagger UI available at http://localhost:${PORT}/api-docs`);
            console.log(`✅ Connected to MongoDB & Redis`);
        });
    })
    .catch(err => {
        console.error("❌ Failed to start server:", err);
        process.exit(1);
    });