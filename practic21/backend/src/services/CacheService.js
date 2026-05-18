const { createClient } = require('redis');

class CacheService {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    async connect() {
        if (this.isConnected) return;

        this.client = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });

        this.client.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });

        await this.client.connect();
        this.isConnected = true;
        console.log('✅ Connected to Redis');
    }

    async get(key) {
        if (!this.isConnected) return null;
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
    }

    async set(key, value, ttlSeconds) {
        if (!this.isConnected) return;
        // EX - срок жизни в секундах
        await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
    }

    async del(key) {
        if (!this.isConnected) return;
        await this.client.del(key);
    }

    // Очистка кэша по паттерну (например, users:* или products:*)
    async invalidatePattern(pattern) {
        if (!this.isConnected) return;
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
            await this.client.del(keys);
            console.log(`🗑️ Invalidated ${keys.length} keys for pattern: ${pattern}`);
        }
    }
}

// Singleton
const cacheService = new CacheService();
module.exports = cacheService;