const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import Config & Services
const db = require('./src/config/db'); // MongoDB connection
const cacheService = require('./src/services/CacheService'); // Redis service
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