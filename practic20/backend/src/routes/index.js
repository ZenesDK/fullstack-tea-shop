const AuthController = require('../controllers/AuthController');
const UserController = require('../controllers/UserController');
const ProductController = require('../controllers/ProductController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Перенесите настройку multer сюда

function setupRoutes(app) {
    const authController = new AuthController();
    const userController = new UserController();
    const productController = new ProductController();

    // Auth
    app.post('/api/auth/register', authController.register.bind(authController));
    app.post('/api/auth/login', authController.login.bind(authController));
    app.post('/api/auth/refresh', authController.refresh.bind(authController));
    app.get('/api/auth/me', authMiddleware, authController.me.bind(authController));

    // Users (Admin only)
    app.get('/api/users', authMiddleware, roleMiddleware(['admin']), userController.getAll.bind(userController));
    app.put('/api/users/:id', authMiddleware, roleMiddleware(['admin']), userController.update.bind(userController));
    app.delete('/api/users/:id', authMiddleware, roleMiddleware(['admin']), userController.delete.bind(userController)); // Block
    app.patch('/api/users/:id/unblock', authMiddleware, roleMiddleware(['admin']), userController.unblock.bind(userController));

    // Products
    app.get('/api/products', authMiddleware, productController.getAll.bind(productController));
    app.get('/api/products/:id', authMiddleware, productController.getById.bind(productController));
    app.post('/api/products', authMiddleware, roleMiddleware(['seller', 'admin']), upload.single('image'), productController.create.bind(productController));
    app.put('/api/products/:id', authMiddleware, roleMiddleware(['seller', 'admin']), upload.single('image'), productController.update.bind(productController));
    app.delete('/api/products/:id', authMiddleware, roleMiddleware(['admin', 'seller']), productController.delete.bind(productController));
}

module.exports = setupRoutes;