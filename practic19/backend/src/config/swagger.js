const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tea Shop API (PostgreSQL)',
      version: '1.0.0',
      description: 'API для учебного проекта "Мир чая" с использованием PostgreSQL и принципов SOLID.',
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
  apis: ['./src/routes/*.js', './src/controllers/*.js'], // Указываем, где искать JSDoc комментарии
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  ui: swaggerUi.serve,
  setup: swaggerUi.setup(specs),
};