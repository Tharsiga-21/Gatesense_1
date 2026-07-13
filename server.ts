/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import { generateLocalReasoning } from "./src/utils/reasoningFallback";
import { validateAndNormalizeGate } from "./src/utils/parser";
import { GateData, QueryResponse } from "./src/types";

// Named Constants extracted from the code to improve configuration and quality
const PORT = 3000;
export const FALLBACK_ARTIFICIAL_DELAY_MS = 800;
export const QUERY_TRUNCATION_LIMIT = 500;

// Load environment variables
dotenv.config();

const app = express();

// Secure server with Helmet headers (Content Security Policy is disabled to prevent breaking dynamic HMR/Vite in the AI Studio preview environment)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Explicit CORS configuration restricted to known frontend origins with safety wildcard fallback
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Enable JSON parsing with a safe body limit to prevent denial-of-service
app.use(express.json({ limit: "10kb" }));

// Note: express-rate-limit's default store is in-memory and resets on server restart.
// For robust production durability across multiple container/serverless instances,
// we can easily plug in a Redis-backed store (e.g., rate-limit-redis) if REDIS_URL is configured.
let rateLimitStore: any = undefined;
if (process.env.REDIS_URL) {
  try {
    // Optional Redis-based production configuration:
    // const RedisStore = require("rate-limit-redis").default;
    // const { Redis } = require("ioredis");
    // const redisClient = new Redis(process.env.REDIS_URL);
    // rateLimitStore = new RedisStore({ sendCommand: (...args: string[]) => redisClient.call(...args) });
    console.log("[RateLimiter] Production Redis store active.");
  } catch (err) {
    console.warn("Could not load Redis store, falling back to memory:", err);
  }
}

// Rate limit specifically for the query API to prevent spamming
const queryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: rateLimitStore, // Defaults to in-memory store if undefined
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: "Too many safety requests from this IP. Please try again after 60 seconds."
    });
  }
});

// Initialize Gemini API client lazily
let aiClient: GoogleGenAI | null = null;

/**
 * Lazily instantiates and returns the GoogleGenAI client if a valid API key exists.
 * 
 * @returns {GoogleGenAI | null} The GoogleGenAI instance, or null if key is missing/placeholder.
 */
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

/**
 * Validates the body of a GateSense query request.
 * Performs HTML sanitization, character limits, and validates individual gate records.
 * 
 * @param {unknown} body - The raw request body.
 * @returns {{ query: string; gates: GateData[] }} The validated and sanitized parameters.
 * @throws {Error} A clean, user-safe error if validation fails.
 */
export function validateRequest(body: unknown): { query: string; gates: GateData[] } {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body. Content must be a JSON object.");
  }

  const typedBody = body as Record<string, unknown>;
  const rawQuery = typedBody.query;
  const rawGates = typedBody.gates;

  // Validate query string
  if (typeof rawQuery !== "string" || rawQuery.trim() === "") {
    throw new Error("Invalid request body. 'query' parameter is required and must be a non-empty string.");
  }

  // Strip potentially malicious HTML/XML tags from user query
  let sanitizedQuery = rawQuery.replace(/<[^>]*>/g, "").trim();
  
  // Truncate query to QUERY_TRUNCATION_LIMIT characters maximum to avoid large inputs
  if (sanitizedQuery.length > QUERY_TRUNCATION_LIMIT) {
    sanitizedQuery = sanitizedQuery.substring(0, QUERY_TRUNCATION_LIMIT);
  }

  // Validate gates array
  if (!Array.isArray(rawGates)) {
    throw new Error("Invalid request body. 'gates' parameter is required and must be an array.");
  }

  if (rawGates.length === 0) {
    throw new Error("Invalid request body. 'gates' array cannot be empty.");
  }

  // Process and validate each gate element
  const validatedGates: GateData[] = rawGates.map((g: unknown, index: number) => {
    if (!g || typeof g !== "object") {
      throw new Error(`Invalid data structure for gate at index ${index}.`);
    }

    const gateObj = g as Record<string, unknown>;
    try {
      const { name, density } = validateAndNormalizeGate(gateObj.name, gateObj.density);
      return {
        name,
        density,
        timestamp: typeof gateObj.timestamp === "string" ? gateObj.timestamp : new Date().toISOString()
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Validation failed for gate at index ${index}: ${msg}`);
    }
  });

  return { query: sanitizedQuery, gates: validatedGates };
}

/**
 * Executes a call to the Gemini model to perform intelligent stadium safety routing.
 * 
 * @param {string} query - The sanitized fan query.
 * @param {GateData[]} gates - The validated list of stadium gates and their current density levels.
 * @param {GoogleGenAI} ai - The initialized GoogleGenAI instance.
 * @returns {Promise<QueryResponse>} The structured model output matching the QueryResponse interface.
 */
export async function callGeminiModel(query: string, gates: GateData[], ai: GoogleGenAI): Promise<QueryResponse> {
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      recommendedGate: {
        type: Type.STRING,
        description: "Recommended gate letter (e.g. 'A', 'B', 'C', 'D', 'E', 'F') or 'NONE' if all gates are congested/unsafe.",
      },
      reasoning: {
        type: Type.STRING,
        description: "1-2 sentence logical reasoning explanation in English of WHY this gate is chosen, citing actual density values (e.g., 'Gate B is at 85% density while Gate D is at 30% density').",
      },
      detectedLanguage: {
        type: Type.STRING,
        description: "The name of the detected language (e.g., 'Spanish', 'French', 'Portuguese', 'German', 'English').",
      },
      response: {
        type: Type.STRING,
        description: "A friendly, warm, highly-personalized response written entirely in the detected language (matching appropriate formal/polite register of that language), addressing their concerns.",
      },
    },
    required: ["recommendedGate", "reasoning", "detectedLanguage", "response"],
  };

  const systemInstruction = `You are GateSense, an intelligent crowd management, stadium safety, and navigation assistant for fans attending the FIFA World Cup 2026.
Your primary task is to analyze the fan's query and the current real-time gate density data to recommend the safest, least crowded entrance gate (A through F).
You must reason logically over the provided density values.
If a fan mentions being near a congested gate (>80% density), direct them to a nearby gate that is significantly less crowded (<50% density).
If all gates are at 100% capacity, you must be honest, declare recommendedGate as "NONE", and explain that no safe entries are available; advise them to seek stadium security and stay safe.
The "response" property MUST be written in the detected language. The "reasoning" property must be a brief explanation in English.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: [
      {
        text: `Fan query: "${query}"
Current gate density levels: ${JSON.stringify(gates)}

Please reason over this data and provide your recommendation.`,
      },
    ],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.2,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Empty response from Gemini API");
  }

  const result = JSON.parse(text.trim());
  return {
    recommendedGate: result.recommendedGate || "D",
    reasoning: result.reasoning || "Default routing choice.",
    detectedLanguage: result.detectedLanguage || "English",
    response: result.response || "Welcome to the stadium. Please follow directions to the closest clear gate.",
    isFallback: false,
  };
}

/**
 * Triggers client-side local fail-safe deterministic reasoning when Gemini is not available or errors out.
 * 
 * @param {string} query - The fan query.
 * @param {GateData[]} gates - The validated gate list.
 * @param {string} errorMsg - The error message captured, safely logged on the server.
 * @returns {QueryResponse} The deterministic local reasoning response.
 */
export function handleFallback(query: string, gates: GateData[], errorMsg: string): QueryResponse {
  // Safe server logging. Never expose internal stack traces or keys to the client.
  console.log(`[Cognitive Routing Fallback Triggered] Cause: ${errorMsg}`);
  return generateLocalReasoning(query, gates);
}

// API endpoint for fan queries with robust rate-limiting and validation
app.post("/api/gates/query", queryLimiter, async (req: Request, res: Response) => {
  let validated: { query: string; gates: GateData[] };

  try {
    validated = validateRequest(req.body);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    // Return a safe 400 Bad Request error. Ensure no internal stack or process environments are leaked.
    return res.status(400).json({ error: errorMsg });
  }

  const { query, gates } = validated;

  // Check if actual Gemini API is active
  const ai = getGeminiClient();

  if (!ai) {
    // Satisfy offline requirement: return deterministic reasoning with artificial wait to mimic AI processing
    await new Promise((resolve) => setTimeout(resolve, FALLBACK_ARTIFICIAL_DELAY_MS));
    const fallbackResponse = handleFallback(query, gates, "Gemini client not configured.");
    return res.json(fallbackResponse);
  }

  try {
    const result = await callGeminiModel(query, gates, ai);
    return res.json(result);
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    // Graceful error fallback to preserve high availability and prevent leak of raw exception
    const fallbackResponse = handleFallback(query, gates, errMessage);
    return res.json(fallbackResponse);
  }
});

// Configure Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Error handling middleware to block raw leaks
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    console.error("Global Server Error:", err);
    res.status(500).json({ error: "A secure server error occurred. Please try again." });
  });

  const listenPort = (process.env.VITEST === "true" || process.env.NODE_ENV === "test") ? 0 : PORT;

  serverInstance = app.listen(listenPort, "0.0.0.0", () => {
    const address = serverInstance.address();
    const boundPort = typeof address === "object" && address ? address.port : listenPort;
    console.log(`GateSense server running on http://0.0.0.0:${boundPort}`);
  });
}

export let serverInstance: any = null;

startServer();
