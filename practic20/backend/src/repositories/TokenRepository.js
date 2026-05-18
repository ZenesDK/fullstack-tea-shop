const RefreshToken = require('../models/RefreshToken');

class TokenRepository {
    async save(token, userId) {
        console.log('Saving token for userId:', userId, 'Type:', typeof userId); // Отладка
        
        if (!userId) {
            throw new Error('UserId is required to save token');
        }

        try {
            await RefreshToken.create({
                token: token,
                user_id: userId // Явно передаем в поле user_id
            });
        } catch (err) {
            console.error('Error saving token:', err);
            throw err;
        }
    }

    async find(token) {
        const tokenDoc = await RefreshToken.findOne({ token });
        return tokenDoc ? tokenDoc.toObject() : null;
    }

    async remove(token) {
        await RefreshToken.deleteOne({ token });
    }
    
    async removeAllForUser(userId) {
        await RefreshToken.deleteMany({ user_id: userId });
    }
}

module.exports = TokenRepository;