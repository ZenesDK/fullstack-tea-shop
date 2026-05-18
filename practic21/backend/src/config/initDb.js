const db = require('./db');

async function initDatabase() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(10) PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                is_blocked BOOLEAN DEFAULT FALSE
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS products (
                id VARCHAR(10) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                description TEXT,
                price NUMERIC(10, 2) NOT NULL,
                image_url TEXT
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                token TEXT PRIMARY KEY,
                user_id VARCHAR(10) REFERENCES users(id) ON DELETE CASCADE
            );
        `);
        
        // Проверка наличия админа
        const adminExists = await db.query('SELECT * FROM users WHERE email = $1', ['admin@example.com']);
        if (adminExists.rows.length === 0) {
            const bcrypt = require('bcrypt');
            const hash = await bcrypt.hash('admin123', 10);
            await db.query(
                'INSERT INTO users (id, email, first_name, last_name, hashed_password, role) VALUES ($1, $2, $3, $4, $5, $6)',
                ['admin01', 'admin@example.com', 'Admin', 'User', hash, 'admin']
            );
            console.log('✅ Default admin created');
        }

        console.log('✅ Database tables initialized');
    } catch (err) {
        console.error('❌ DB Initialization Error:', err);
    }
}

module.exports = initDatabase;