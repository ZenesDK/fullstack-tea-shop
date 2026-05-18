const db = require('../config/db');

class TokenRepository {
    /**
     * Сохраняет refresh токен
     * @param {string} token - сам токен
     * @param {string} userId - ID пользователя
     */
    async save(token, userId) {
        // INSERT ... ON CONFLICT DO NOTHING чтобы избежать ошибок при дубликатах, если вдруг
        await db.query(
            'INSERT INTO refresh_tokens (token, user_id) VALUES ($1, $2) ON CONFLICT (token) DO NOTHING', 
            [token, userId]
        );
    }

    async find(token) {
        const res = await db.query('SELECT * FROM refresh_tokens WHERE token = $1', [token]);
        return res.rows[0];
    }

    async remove(token) {
        await db.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
    }
    
    async removeAllForUser(userId) {
         await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
    }
}

module.exports = TokenRepository;