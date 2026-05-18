const mongoose = require('mongoose');
require('dotenv').config();

class Database {
    constructor() {
        this.connection = null;
    }

    async connect() {
        if (this.connection) return this.connection;

        try {
            this.connection = await mongoose.connect(process.env.MONGODB_URI);
            console.log('✅ Connected to MongoDB');
            return this.connection;
        } catch (err) {
            console.error('❌ MongoDB Connection Error:', err);
            throw err;
        }
    }
}

const db = new Database();
module.exports = db;