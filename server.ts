/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { Server } from "http";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import { generateLocalReasoning, generateLocalStaffSummary } from "./src/utils/reasoningFallback";
import { validateAndNormalizeGate } from "./src/utils/parser";
import { GateData, QueryResponse } from "./src/types";
import {
  ACCESSIBILITY_NOTES,
  SUSTAINABILITY_NOTES,
  SUPPORTED_LANGUAGES
} from "./src/utils/localizedContent";

// Named Constants extracted from the code to improve configuration and quality
const PORT = 3000;
export const FALLBACK_ARTIFICIAL_DELAY_MS = 800;
export const QUERY_TRUNCATION_LIMIT = 500;
export const CACHE_TTL_MS = 15000; // 15 seconds caching window
const MAX_CACHE_SIZE = 500; // Cap cache size to prevent unbounded memory growth

// Load environment variables
dotenv.config();

const app = express();
// Enable trust proxy for correct client IP detection under reverse proxy setups (e.g. Render)
app.set("trust proxy", 1);
const isProd = process.env.NODE_ENV === "production";

// Secure server with Helmet headers and a scoped CSP policy compatible with Vite/HMR
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: isProd 
          ? ["'self'"] 
          : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Required for inline styles / Tailwind CSS
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://*"],
        connectSrc: isProd 
          ? ["'self'"] 
          : ["'self'", "ws://localhost:*", "http://localhost:*", "ws://127.0.0.1:*", "http://127.0.0.1:*", "https://*"],
        upgradeInsecureRequests: isProd ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Tightened CORS configuration restricted to known frontend origins and development sandboxes
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(",") 
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin requests (origin is undefined for same-origin or server-to-server calls)
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Allow loopback and Google Cloud Run/AI Studio preview sandboxes in non-production
      const hostname = new URL(origin).hostname;
      if (
        !isProd &&
        (hostname === "localhost" ||
          hostname === "127.0.0.1" ||
          hostname.endsWith(".run.app") ||
          hostname.endsWith(".aistudio.google"))
      ) {
        return callback(null, true);
      }
      return callback(new Error("CORS Policy Violation: Origin not allowed."));
    },
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
    console.log("[RateLimiter] Production Redis store active.");
  } catch (err) {
    console.warn("Could not load Redis store, falling back to memory:", err);
  }
}

// Rate limit specifically for the query API (15 requests per minute per IP for enhanced protection)
const queryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // Limit each IP to 15 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: rateLimitStore, // Defaults to in-memory store if undefined
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: "Too many safety requests from this IP. Please try again after 60 seconds."
    });
  }
});

// Simple in-memory cache to optimize identical requests within a 15-second window
interface CacheEntry {
  response: QueryResponse;
  expiresAt: number;
}
const queryCache = new Map<string, CacheEntry>();

// Simple in-memory cache specifically for the staff summary to optimize throughput
interface StaffSummaryCacheEntry {
  summary: string;
  isFallback: boolean;
  expiresAt: number;
}
const staffSummaryCache = new Map<string, StaffSummaryCacheEntry>();
const STAFF_CACHE_TTL_MS = 60000; // 60 seconds TTL for staff operations

/**
 * Sanitizes messages to prevent sensitive secrets (like GEMINI_API_KEY) from being printed in logs or sent to clients.
 */
function sanitizeMessage(msg: string): string {
  const key = process.env.GEMINI_API_KEY;
  if (key && key.length > 5 && key !== "MY_GEMINI_API_KEY") {
    // Escape special regex chars
    const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    return msg.replace(new RegExp(escapedKey, "g"), "[REDACTED_API_KEY]");
  }
  return msg;
}

/**
 * Adds an entry to the query cache, enforcing a maximum size limit and evicting older elements.
 */
function setInCache(key: string, response: QueryResponse, expiresAt: number): void {
  const now = Date.now();
  // Cleanup expired items first
  for (const [k, entry] of queryCache.entries()) {
    if (entry.expiresAt <= now) {
      queryCache.delete(k);
    }
  }

  // If over limit, evict the oldest inserted key
  if (queryCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = queryCache.keys().next().value;
    if (oldestKey !== undefined) {
      queryCache.delete(oldestKey);
    }
  }

  queryCache.set(key, { response, expiresAt });
}

// Initialize Gemini API client lazily
let aiClient: GoogleGenAI | null = null;

/**
 * Lazily instantiates and returns the GoogleGenAI client if a valid API key exists.
 * 
 * @returns {GoogleGenAI | null} The GoogleGenAI instance, or null if key is missing/placeholder.
 */
function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "" || key === "dummy_invalid_key_to_force_api_failure") {
    aiClient = null;
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
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

  // Normalize Unicode representation to guard against spoofing/unicode bypass tricks
  const normalizedRawQuery = rawQuery.normalize("NFKC");

  // Strip potentially malicious HTML/XML tags from user query
  let sanitizedQuery = normalizedRawQuery.replace(/<[^>]*>/g, "").trim();
  
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

  // Input sanitization: Block oversized gate arrays to prevent denial of service (DoS) attacks
  if (rawGates.length > 10) {
    throw new Error("Invalid request body. 'gates' array cannot contain more than 10 records.");
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
        description: "The name of the detected language (e.g., 'Spanish', 'French', 'Portuguese', 'German', 'English', 'Arabic', 'Japanese', 'Chinese', 'Korean', 'Hindi').",
      },
      response: {
        type: Type.STRING,
        description: "A friendly, warm, highly-personalized response written entirely in the detected language (matching appropriate formal/polite register of that language), addressing their concerns, incorporating transit/accessibility guidelines.",
      },
    },
    required: ["recommendedGate", "reasoning", "detectedLanguage", "response"],
  };

  const systemInstruction = `You are GateSense, an intelligent crowd management, stadium safety, and navigation assistant for fans attending the FIFA World Cup 2026.
Your primary task is to analyze the fan's query and the current real-time gate density data to recommend the safest, least crowded entrance gate (A through F).
You must reason logically over the provided density values.
If a fan mentions being near a congested gate (>80% density), direct them to a nearby gate that is significantly less crowded (<50% density).
If all gates are at 100% capacity, you must be honest, declare recommendedGate as "NONE", and explain that no safe entries are available; advise them to seek stadium security and stay safe.

Accessibility Guidelines:
- If the fan mentions mobility needs, wheelchairs, ramps, stroller, elevator, or accessibility: prioritize recommending Gates C and D as they are fully equipped with step-free priority ramps and sensory-friendly wide lanes. Explicitly note this in your response.
Specifically, you should include or translate the appropriate accessibility note based on the detected language from these pre-translated strings:
${JSON.stringify(ACCESSIBILITY_NOTES, null, 2)}

Sustainability Guidelines:
- If the fan mentions public transit, metro, bus, train, parking, or sustainability/eco-friendly travel: guide them to public transit options like CDMX Metro Line 3 (Exit Gate D) or Metrobus Line 1 (Exit Gate F) and highlight the stadium's eco recycling hubs situated at Gates A and E.
Specifically, you should include or translate the appropriate sustainability note based on the detected language from these pre-translated strings:
${JSON.stringify(SUSTAINABILITY_NOTES, null, 2)}

Supported Languages Reference:
${JSON.stringify(SUPPORTED_LANGUAGES, null, 2)}

The "response" property MUST be written in the detected language. The "reasoning" property must be a brief explanation in English.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
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
  console.log(`[Cognitive Routing Fallback Triggered] Cause: ${sanitizeMessage(errorMsg)}`);
  return generateLocalReasoning(query, gates);
}

// API endpoint for fan queries with robust rate-limiting, validation, and query caching
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

  // Generate a safe cache key by using normalized query text and sorted gate names/densities
  const sortedGatesKey = [...gates]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((g) => `${g.name}:${g.density}`)
    .join("|");
  const cacheKey = `${query.toLowerCase()}::${sortedGatesKey}`;
  
  const now = Date.now();
  const cached = queryCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    console.log("[Cache Hit] Serving cached response for identical query.");
    return res.json(cached.response);
  }

  // Check if actual Gemini API is active
  const ai = getGeminiClient();

  if (!ai) {
    // Satisfy offline requirement: return deterministic reasoning with artificial wait to mimic AI processing
    await new Promise((resolve) => setTimeout(resolve, FALLBACK_ARTIFICIAL_DELAY_MS));
    const fallbackResponse = handleFallback(query, gates, "Gemini client not configured.");
    
    // Cache the fallback response
    setInCache(cacheKey, fallbackResponse, Date.now() + CACHE_TTL_MS);
    
    return res.json(fallbackResponse);
  }

  try {
    const result = await callGeminiModel(query, gates, ai);
    
    // Cache the success response
    setInCache(cacheKey, result, Date.now() + CACHE_TTL_MS);
    
    return res.json(result);
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    // Graceful error fallback to preserve high availability and prevent leak of raw exception
    const fallbackResponse = handleFallback(query, gates, errMessage);
    
    // Cache the errored fallback response
    setInCache(cacheKey, fallbackResponse, Date.now() + CACHE_TTL_MS);
    
    return res.json(fallbackResponse);
  }
});

// API endpoint for staff operational summary
app.post("/api/staff/summary", express.json(), async (req: Request, res: Response) => {
  try {
    const { gates } = req.body;
    if (!gates || !Array.isArray(gates)) {
      return res.status(400).json({ error: "Invalid gates array provided" });
    }

    // Build a cache key based on simplified state to optimize hit rate:
    // we care about which gates are above 80% (high), below 50% (low), or moderate (med).
    const cacheKey = gates.map((g: any) => {
      const name = String(g.name || "").toLowerCase();
      const density = Number(g.density) || 0;
      const status = density > 80 ? "high" : density < 50 ? "low" : "med";
      return `${name}:${status}`;
    }).sort().join(",");

    const now = Date.now();
    const cached = staffSummaryCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return res.json({ summary: cached.summary, isFallback: cached.isFallback });
    }

    const ai = getGeminiClient();
    if (!ai) {
      await new Promise((resolve) => setTimeout(resolve, FALLBACK_ARTIFICIAL_DELAY_MS));
      const summary = generateLocalStaffSummary(gates);
      // Cache fallback responses too to avoid excessive processing
      staffSummaryCache.set(cacheKey, { summary, isFallback: true, expiresAt: now + STAFF_CACHE_TTL_MS });
      return res.json({ summary, isFallback: true });
    }

    const prompt = `You are the GateSense AI Operations Intelligence system, assisting organizers, venue staff, and volunteers at Estadio Azteca for World Cup 2026.

Current gate density snapshots:
${JSON.stringify(gates, null, 2)}

Provide a concise, high-impact 2-3 sentence operational guidance summary in English for the stadium control staff. 
Focus strictly on crowd flow, identifying heavily congested bottlenecks (>80% density), and proposing immediate redirection of pedestrian foot traffic to clear gates (<50% density). 
Do NOT use markdown. Keep the response direct, professional, and actionable.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    const summaryText = response.text?.trim() || generateLocalStaffSummary(gates);

    // Proactively clean up expired entries in cache to prevent memory leaks
    for (const [k, entry] of staffSummaryCache.entries()) {
      if (entry.expiresAt <= now) {
        staffSummaryCache.delete(k);
      }
    }
    // Cap cache size
    if (staffSummaryCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = staffSummaryCache.keys().next().value;
      if (oldestKey !== undefined) {
        staffSummaryCache.delete(oldestKey);
      }
    }

    staffSummaryCache.set(cacheKey, { summary: summaryText, isFallback: false, expiresAt: now + STAFF_CACHE_TTL_MS });
    return res.json({ summary: summaryText, isFallback: false });
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    console.warn("[Staff Summary API Error]", sanitizeMessage(errMessage));
    const summary = generateLocalStaffSummary(req.body?.gates || []);
    return res.json({ summary, isFallback: true });
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
    const errorStr = err instanceof Error ? err.stack || err.message : String(err);
    console.error("Global Server Error:", sanitizeMessage(errorStr));
    res.status(500).json({ error: "A secure server error occurred. Please try again." });
  });

  const listenPort = (process.env.VITEST === "true" || process.env.NODE_ENV === "test") ? 0 : PORT;

  serverInstance = app.listen(listenPort, "0.0.0.0", () => {
    const address = serverInstance.address();
    const boundPort = typeof address === "object" && address ? address.port : listenPort;
    console.log(`GateSense server running on http://0.0.0.0:${boundPort}`);
    if (resolveServerReady) {
      resolveServerReady(boundPort);
    }
  });
}

export let serverInstance: Server | null = null;

let resolveServerReady: (port: number) => void;
export const serverReady = new Promise<number>((resolve) => {
  resolveServerReady = resolve;
});

startServer();
