const UserRepository = require('../repositories/UserRepository');
const TokenRepository = require('../repositories/TokenRepository');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Управление пользователями (Admin only)
 */

class UserController {
    constructor() {
        this.userRepo = new UserRepository();
        this.tokenRepo = new TokenRepository();
    }

    /**
     * @swagger
     * /api/users:
     *   get:
     *     summary: Получить список всех пользователей
     *     tags: [Users]
     *     responses:
     *       200:
     *         description: Список пользователей
     *       403:
     *         description: Доступ запрещен
     */
    async getAll(req, res) {
        try {
            const users = await this.userRepo.findAll();
            res.json(users);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * @swagger
     * /api/users/{id}:
     *   put:
     *     summary: Обновить данные пользователя (роль, блокировка)
     *     tags: [Users]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               role:
     *                 type: string
     *                 enum: [user, seller, admin]
     *               isBlocked:
     *                 type: boolean
     *     responses:
     *       200:
     *         description: Пользователь обновлен
     *       404:
     *         description: Пользователь не найден
     */
    async update(req, res) {
        try {
            const id = req.params.id;
            const updateData = req.body;
            const updatedUser = await this.userRepo.update(id, updateData);
            
            if (!updatedUser) return res.status(404).json({ error: "User not found" });

            if (updateData.role || updateData.isBlocked !== undefined) {
                await this.tokenRepo.removeAllForUser(id);
            }

            res.json(updatedUser);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * @swagger
     * /api/users/{id}:
     *   delete:
     *     summary: Заблокировать пользователя
     *     tags: [Users]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       204:
     *         description: Пользователь заблокирован
     */
    async delete(req, res) {
        try {
            const id = req.params.id;
            await this.userRepo.blockUser(id);
            await this.tokenRepo.removeAllForUser(id);
            res.status(204).send();
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * @swagger
     * /api/users/{id}/unblock:
     *   patch:
     *     summary: Разблокировать пользователя
     *     tags: [Users]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Пользователь разблокирован
     */
    async unblock(req, res) {
        try {
            const id = req.params.id;
            await this.userRepo.unblockUser(id);
            res.json({ message: "User unblocked" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
        }
    }
}

module.exports = UserController;