import Fastify from "fastify";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const app = Fastify();

app.get("/health", async () => ({ status: "ok" }));

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

