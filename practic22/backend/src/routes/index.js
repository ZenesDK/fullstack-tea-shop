const AuthController = require('../controllers/AuthController');
const UserController = require('../controllers/UserController');
const ProductController = require('../controllers/ProductController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const cacheMiddleware = require('../middleware/cacheMiddleware'); // Импорт кэша
const cacheService = require('../services/CacheService'); // Сервис для ручной инвалидации

function setupRoutes(app) {
    const authController = new AuthController();
    const userController = new UserController();
    const productController = new ProductController();

    // --- AUTH ---
    app.post('/api/auth/register', authController.register.bind(authController));
    app.post('/api/auth/login', authController.login.bind(authController));
    app.post('/api/auth/refresh', authController.refresh.bind(authController));
    app.get('/api/auth/me', authMiddleware, authController.me.bind(authController));

    // --- USERS (Admin only) ---
    
    // GET /api/users - Кэш 60 секунд
    app.get('/api/users', 
        authMiddleware, 
        roleMiddleware(['admin']), 
        cacheMiddleware('users', 60), 
        userController.getAll.bind(userController)
    );

    // GET /api/users/:id - Кэш 60 секунд
    app.get('/api/users/:id', 
        authMiddleware, 
        roleMiddleware(['admin']), 
        cacheMiddleware('users', 60), 
        userController.getById.bind(userController) // Убедись, что этот метод есть в контроллере
    );

    // PUT /api/users/:id - Инвалидация кэша пользователей
    app.put('/api/users/:id', 
        authMiddleware, 
        roleMiddleware(['admin']), 
        async (req, res, next) => {
            await cacheService.invalidatePattern('users:*');
            next();
        },
        userController.update.bind(userController)
    );

    // DELETE /api/users/:id (Block) - Инвалидация кэша пользователей
    app.delete('/api/users/:id', 
        authMiddleware, 
        roleMiddleware(['admin']), 
        async (req, res, next) => {
            await cacheService.invalidatePattern('users:*');
            next();
        },
        userController.delete.bind(userController)
    );

    app.patch('/api/users/:id/unblock', 
        authMiddleware, 
        roleMiddleware(['admin']), 
        async (req, res, next) => {
            await cacheService.invalidatePattern('users:*');
            next();
        },
        userController.unblock.bind(userController)
    );

    // --- PRODUCTS ---

    // GET /api/products - Кэш 600 секунд (10 минут)
    app.get('/api/products', 
        authMiddleware, 
        cacheMiddleware('products', 600), 
        productController.getAll.bind(productController)
    );

    // GET /api/products/:id - Кэш 600 секунд
    app.get('/api/products/:id', 
        authMiddleware, 
        cacheMiddleware('products', 600), 
        productController.getById.bind(productController)
    );

    // POST /api/products - Инвалидация кэша товаров
    app.post('/api/products', 
        authMiddleware, 
        roleMiddleware(['seller', 'admin']), 
        upload.single('image'), 
        async (req, res, next) => {
            await cacheService.invalidatePattern('products:*');
            next();
        },
        productController.create.bind(productController)
    );

    // PUT /api/products/:id - Инвалидация кэша товаров
    app.put('/api/products/:id', 
        authMiddleware, 
        roleMiddleware(['seller', 'admin']), 
        upload.single('image'), 
        async (req, res, next) => {
            await cacheService.invalidatePattern('products:*');
            next();
        },
        productController.update.bind(productController)
    );

    // DELETE /api/products/:id - Инвалидация кэша товаров
    app.delete('/api/products/:id', 
        authMiddleware, 
        roleMiddleware(['admin', 'seller']), 
        async (req, res, next) => {
            await cacheService.invalidatePattern('products:*');
            next();
        },
        productController.delete.bind(productController)
    );
}

module.exports = setupRoutes;