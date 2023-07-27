import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Online Auction System API',
      version: '1.0.0',
      description: 'This is the API documentation for the Online Auction System backend project',
    },
  },
  apis: ['./src/routes.ts'], // Path to your route definitions file
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
