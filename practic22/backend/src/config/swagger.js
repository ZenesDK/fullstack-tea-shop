const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tea Shop API (MongoDB + Redis Cache)', // Обновленный заголовок
      version: '2.1.0', // Версия практики
      description: `
API для учебного проекта "Мир чая" (Практика 21).

**Архитектура:**
- **БД:** MongoDB (Mongoose)
- **Кэш:** Redis (для маршрутов GET /users и /products)
- **Принципы:** SOLID, Repository Pattern, Dependency Injection

**Кэширование:**
- \`GET /api/users\`: TTL 60 сек
- \`GET /api/products\`: TTL 600 сек
- Кэш автоматически инвалидируется при POST/PUT/DELETE запросах.
      `,
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    './src/routes/*.js', 
    './src/controllers/UserController.js', 
    './src/controllers/ProductController.js',
    './src/controllers/AuthController.js'
  ], // Сканируем контроллеры на наличие JSDoc
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  ui: swaggerUi.serve,
  setup: swaggerUi.setup(specs),
};