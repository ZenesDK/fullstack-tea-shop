const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Подключение к БД
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB for initAdmin');
    } catch (err) {
        console.error('❌ DB Connection Error:', err);
        process.exit(1);
    }
};

// Схема пользователя (должна совпадать с твоей моделью User)
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    hashed_password: { type: String, required: true },
    role: { type: String, default: 'user', enum: ['user', 'seller', 'admin'] },
    is_blocked: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
    await connectDB();

    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';

    // Проверяем, есть ли уже админ
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
        console.log('⚠️ Admin already exists.');
        // Если хочешь сбросить пароль, раскомментируй следующие строки:
        /*
        const hash = await bcrypt.hash(adminPassword, 10);
        existingAdmin.hashed_password = hash;
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('🔄 Admin password and role reset.');
        */
    } else {
        const hash = await bcrypt.hash(adminPassword, 10);
        const newAdmin = new User({
            email: adminEmail,
            first_name: 'Admin',
            last_name: 'User',
            hashed_password: hash,
            role: 'admin',
            is_blocked: false
        });
        await newAdmin.save();
        console.log('✅ Default admin created successfully!');
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
    }

    mongoose.disconnect();
}

createAdmin();