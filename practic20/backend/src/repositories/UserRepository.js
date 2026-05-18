const IRepository = require('./IRepository');
const User = require('../models/User'); // Импорт Mongoose модели
const bcrypt = require('bcrypt');

class UserRepository extends IRepository {
    /**
     * Получение всех пользователей (без паролей)
     */
    async findAll() {
        // select('-hashed_password') исключает поле пароля из выборки
        const users = await User.find().select('-hashed_password'); 
        return users.map(u => this._formatUser(u));
    }

    /**
     * Получение пользователя по ID
     */
    async findById(id) {
        const user = await User.findById(id);
        return user ? this._formatUser(user) : null;
    }

    /**
     * Поиск пользователя по Email (нужен для логина)
     */
    async findByEmail(email) {
        const user = await User.findOne({ email });
        if (!user) return null;
        // Для login нам нужен хеш пароля, поэтому не используем select('-hashed_password')
        // Но нужно убедиться, что id есть
        const obj = user.toObject();
        return {
            ...obj,
            id: obj._id.toString() // Добавляем id вручную, если _formatUser не вызывается
        };
    }

    /**
     * Создание нового пользователя
     */
    async create(userData) {
        const { email, first_name, last_name, password, role = 'user' } = userData;
        
        // Хеширование пароля перед сохранением
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email,
            first_name,
            last_name,
            hashed_password: hashedPassword,
            role,
            is_blocked: false
        });
        
        await newUser.save();
        return this._formatUser(newUser);
    }

    /**
     * Обновление данных пользователя
     */
    async update(id, updateData) {
        // Если приходит пароль, его нужно хешировать (в текущем API мы пароль не обновляем, но на будущее)
        const updatedUser = await User.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        ).select('-hashed_password');
        
        if (!updatedUser) return null;
        return this._formatUser(updatedUser);
    }

    /**
     * Удаление пользователя
     */
    async delete(id) {
        const deletedUser = await User.findByIdAndDelete(id);
        return deletedUser ? this._formatUser(deletedUser) : null;
    }
    
    /**
     * Блокировка пользователя
     */
    async blockUser(id) {
        return this.update(id, { is_blocked: true });
    }

    /**
     * Разблокировка пользователя
     */
    async unblockUser(id) {
        return this.update(id, { is_blocked: false });
    }

    /**
     * Внутренний метод для приведения документа Mongoose к общему виду
     */
    _formatUser(doc) {
        if (!doc) return null;
        const obj = doc.toObject ? doc.toObject() : doc;
        return {
            ...obj,
            id: obj._id.toString(), // Критично важно для JWT и фронтенда
            _id: undefined,         // Убираем лишний ключ
            __v: undefined          // Убираем версию документа
        };
    }
}

module.exports = UserRepository;