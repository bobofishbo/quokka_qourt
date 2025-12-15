import Fastify from "fastify";
import dotenv from "dotenv";
import { caseRoutes } from "./api/cases.routes";
import { profileRoutes } from "./api/profile.routes";

// Load environment variables from .env file
dotenv.config();

const app = Fastify();

// Root route
app.get("/", async () => ({
  message: "Judge API",
  version: "1.0.0",
  endpoints: {
    health: "/health",
    profile: {
      get: "/profile/me",
      create: "/profile/onboarding",
    },
    cases: {
      create: "/cases",
      get: "/cases/:id",
    },
  },
}));

app.get("/health", async () => ({ status: "ok" }));

// Register routes
app.register(caseRoutes);
app.register(profileRoutes);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen({ port: PORT, host: HOST }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running on ${address}`);
  console.log(`Health check: ${address}/health`);
});

