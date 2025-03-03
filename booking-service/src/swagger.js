const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Booking Service API',
      version: '1.0.0',
      description: 'API documentation for the Booking Service',
    },
    servers: [
      {
        url: process.env.SERVER_URL || 'http://localhost:3001',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
      },
    },
  },
  apis: ['./index.js'], // Adjust this path if your main file is named differently
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;