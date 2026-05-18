const UserRepository = require('../repositories/UserRepository');
const TokenRepository = require('../repositories/TokenRepository');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Управление аутентификацией и сессиями
 */

class AuthController {
    constructor() {
        this.userRepo = new UserRepository();
        this.tokenRepo = new TokenRepository();
        this.ACCESS_SECRET = process.env.ACCESS_SECRET;
        this.REFRESH_SECRET = process.env.REFRESH_SECRET;
    }

    generateAccessToken(user) {
        return jwt.sign(
            { sub: user.id, email: user.email, role: user.role }, 
            this.ACCESS_SECRET, 
            { expiresIn: '15m' }
        );
    }

    generateRefreshToken(user) {
        return jwt.sign(
            { sub: user.id, role: user.role }, 
            this.REFRESH_SECRET, 
            { expiresIn: '7d' }
        );
    }

    /**
     * @swagger
     * /api/auth/register:
     *   post:
     *     summary: Регистрация нового пользователя
     *     tags: [Auth]
     *     security: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - first_name
     *               - last_name
     *               - password
     *             properties:
     *               email:
     *                 type: string
     *                 example: user@example.com
     *               first_name:
     *                 type: string
     *                 example: Иван
     *               last_name:
     *                 type: string
     *                 example: Иванов
     *               password:
     *                 type: string
     *                 example: secret123
     *     responses:
     *       201:
     *         description: Пользователь успешно создан
     *       400:
     *         description: Ошибка валидации или пользователь уже существует
     */
    async register(req, res) {
        try {
            const { email, first_name, last_name, password } = req.body;
            if (!email || !first_name || !last_name || !password) {
                return res.status(400).json({ error: "All fields are required" });
            }

            const existingUser = await this.userRepo.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({ error: "User already exists" });
            }

            const newUser = await this.userRepo.create({ email, first_name, last_name, password });
            const { hashed_password, ...safeUser } = newUser;
            res.status(201).json(safeUser);
        } catch (err) {
            console.error('Register Error:', err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * @swagger
     * /api/auth/login:
     *   post:
     *     summary: Вход в систему
     *     tags: [Auth]
     *     security: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - password
     *             properties:
     *               email:
     *                 type: string
     *               password:
     *                 type: string
     *     responses:
     *       200:
     *         description: Успешный вход, возвращаются токены
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 accessToken:
     *                   type: string
     *                 refreshToken:
     *                   type: string
     *       401:
     *         description: Неверные учетные данные
     *       403:
     *         description: Пользователь заблокирован
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: "Email and password are required" });
            }

            const user = await this.userRepo.findByEmail(email);
            if (!user) return res.status(401).json({ error: "Invalid credentials" });
            if (user.is_blocked) return res.status(403).json({ error: "User is blocked" });

            const isValid = await bcrypt.compare(password, user.hashed_password);
            if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

            const accessToken = this.generateAccessToken(user);
            const refreshToken = this.generateRefreshToken(user);

            await this.tokenRepo.save(refreshToken, user.id);
            res.json({ accessToken, refreshToken });
        } catch (err) {
            console.error('Login Error:', err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * @swagger
     * /api/auth/refresh:
     *   post:
     *     summary: Обновление access токена
     *     tags: [Auth]
     *     security: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               refreshToken:
     *                 type: string
     *     responses:
     *       200:
     *         description: Новая пара токенов
     *       401:
     *         description: Неверный refresh токен
     */
    async refresh(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) return res.status(400).json({ error: "Refresh token is required" });

            const tokenData = await this.tokenRepo.find(refreshToken);
            if (!tokenData) return res.status(401).json({ error: "Invalid refresh token" });

            let payload;
            try {
                payload = jwt.verify(refreshToken, this.REFRESH_SECRET);
            } catch (err) {
                await this.tokenRepo.remove(refreshToken);
                return res.status(401).json({ error: "Expired or invalid refresh token" });
            }

            const user = await this.userRepo.findById(payload.sub);
            if (!user || user.is_blocked) {
                await this.tokenRepo.remove(refreshToken);
                return res.status(403).json({ error: "User not found or blocked" });
            }

            await this.tokenRepo.remove(refreshToken);
            const newAccessToken = this.generateAccessToken(user);
            const newRefreshToken = this.generateRefreshToken(user);
            await this.tokenRepo.save(newRefreshToken, user.id);

            res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
        } catch (err) {
            console.error('Refresh Error:', err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * @swagger
     * /api/auth/me:
     *   get:
     *     summary: Получить информацию о текущем пользователе
     *     tags: [Auth]
     *     responses:
     *       200:
     *         description: Данные пользователя
     *       401:
     *         description: Не авторизован
     */
    async me(req, res) {
        try {
            const userId = req.user.sub;
            const user = await this.userRepo.findById(userId);
            if (!user) return res.status(404).json({ error: "User not found" });
            
            const { hashed_password, ...safeUser } = user;
            res.json(safeUser);
        } catch (err) {
            console.error('Me Error:', err);
            res.status(500).json({ error: "Internal server error" });
        }
    }
}

module.exports = AuthController;