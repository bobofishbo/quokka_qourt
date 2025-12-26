import Fastify from "fastify";
import dotenv from "dotenv";
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { caseRoutes } from "./api/cases.routes";
import { profileRoutes } from "./api/profile.routes";
import { lawyerRoutes } from './api/lawyer.routes';

// Load environment variables from .env file
dotenv.config();

const app = Fastify();

// Register Swagger
app.register(swagger, {
  openapi: {
    info: {
      title: 'Judge API',
      description: 'API for the Judge application',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Development server',
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
  },
});

app.register(swaggerUI, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false,
  },
  staticCSP: true,
  transformStaticCSP: (header: any) => header,
});

// Root route
app.get("/", async () => ({
  message: "Judge API",
  version: "1.0.0",
  docs: "/docs",
  endpoints: {
    health: "/health",
    profile: {
      get: "/profile/me",
      create: "/profile/onboarding",
      update: "/profile/me",
    },
    cases: {
      create: "/cases",
      get: "/cases/:id",
    },
    lawyer: {
      chat: "/lawyer/chat",
    },
  },
}));

app.get("/health", async () => ({ status: "ok" }));

// Register routes
app.register(caseRoutes);
app.register(profileRoutes);
app.register(lawyerRoutes);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen({ port: PORT, host: HOST }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running on ${address}`);
  console.log(`Health check: ${address}/health`);
  console.log(`API Documentation: ${address}/docs`);
});

