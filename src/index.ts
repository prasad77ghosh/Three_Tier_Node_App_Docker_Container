import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createClient } from "redis";
import { Client as ElasticClient } from "@elastic/elasticsearch";

const app = express();
const PORT = 3000;

// PostgreSQL connection
const prisma = new PrismaClient();

// Redis connection
const redis = createClient({ url: process.env.REDIS_URL });

redis.on("error", (err) => console.error("Redis Connection Error:", err));
redis
  .connect()
  .then(() => console.log("Redis Connected!"))
  .catch(console.error);

// Elasticsearch connection
const elasticsearch = new ElasticClient({
  node: process.env.ELASTICSEARCH_URL,
});

async function checkDatabase() {
  try {
    await prisma.$connect();
    console.log("PostgreSQL connected!");
  } catch (error) {
    console.error("Error connecting to PostgreSQL:", error);
  }
}

async function checkElasticsearch() {
  try {
    await elasticsearch.ping();
    console.log("Elasticsearch connected!");
  } catch (error) {
    console.error("Error connecting to Elasticsearch:", error);
  }
}

app.get("/", async (req: Request, res: Response) => {
  res.send("Hello from Express.js!");
});

// Health Check Endpoint
app.get("/health", async (req: Request, res: Response) => {
  try {
    // Check PostgreSQL, Redis, and Elasticsearch connections
    await checkDatabase();
    await redis.ping(); // Check Redis
    await checkElasticsearch(); // Check Elasticsearch

    res.status(200).json({
      message: "All systems are running smoothly.",
      database: "Connected",
      redis: "Connected",
      elasticsearch: "Connected",
    });
  } catch (error) {
    res.status(500).json({
      message: "One or more services are down.",
      database: "Error connecting",
      redis: error instanceof Error ? error.message : "Error",
      elasticsearch: error instanceof Error ? error.message : "Error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
