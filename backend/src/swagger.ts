import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Demo SUT API",
      version: "1.0.0",
      description: "REST API documentation for Demo SUT backend",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT ?? 3000}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            message: { type: "string", example: "Something went wrong" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "integer", description: "User ID", example: 1 },
            name: { type: "string", description: "User's full name", example: "John Doe" },
            email: { type: "string", format: "email", description: "User's email address", example: "john.doe@example.com" },
            role: { type: "string", description: "User's role", example: "REGULAR_USER" },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", description: "Full name of the user", example: "John Doe" },
            email: { type: "string", format: "email", description: "User's email address", example: "john.doe@example.com" },
            password: { type: "string", format: "password", description: "User's password (minimum 6 characters)", example: "securePassword123" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", description: "User's email address", example: "john.doe@example.com" },
            password: { type: "string", format: "password", description: "User's password", example: "securePassword123" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            data: {
              type: "object",
              properties: {
                accessToken: { type: "string", description: "JWT access token" },
                user: { $ref: "#/components/schemas/User" },
              },
            },
          },
        },
        RefreshResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            data: {
              type: "object",
              properties: {
                accessToken: { type: "string", description: "New JWT access token" },
              },
            },
          },
        },
        CreateQuoteRequest: {
          type: "object",
          required: ["text"],
          properties: {
            text: {
              type: "string",
              description: "Quote content",
              example: "The only way to do great work is to love what you do.",
            },
          },
        },
        DeleteQuoteRequest: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "integer",
              description: "Quote ID",
              example: 12,
            },
          },
        },
        Quote: {
          type: "object",
          properties: {
            id: { type: "integer", example: 12 },
            text: {
              type: "string",
              example: "The only way to do great work is to love what you do.",
            },
            owner: { $ref: "#/components/schemas/User" },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2026-04-17T08:30:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2026-04-17T08:30:00.000Z",
            },
          },
        },
        QuoteResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            data: { $ref: "#/components/schemas/Quote" },
          },
        },
        QuotesListResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            data: {
              type: "object",
              properties: {
                quotes: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Quote" },
                },
                pagination: {
                  type: "object",
                  properties: {
                    page: { type: "integer", example: 1 },
                    limit: { type: "integer", example: 10 },
                    totalItems: { type: "integer", example: 42 },
                    totalPages: { type: "integer", example: 5 },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  // Glob patterns for files containing @swagger JSDoc comments
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
