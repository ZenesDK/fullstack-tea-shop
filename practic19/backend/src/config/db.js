const { Pool } = require('pg');
require('dotenv').config();

// Инкапсуляция пула соединений
class Database {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });

        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
            process.exit(-1);
        });
    }

    async getClient() {
        return this.pool.connect();
    }

    async query(text, params) {
        const start = Date.now();
        const res = await this.pool.query(text, params);
        const duration = Date.now() - start;
        console.log('executed query', { text, duration, rows: res.rowCount });
        return res;
    }
}

// Singleton pattern for DB connection
const db = new Database();
module.exports = db;