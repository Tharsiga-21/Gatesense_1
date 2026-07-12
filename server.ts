/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { generateLocalReasoning } from "./src/utils/reasoningFallback";
import { GateData, QueryResponse } from "./src/types";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON parsing
app.use(express.json());

// Initialize Gemini API client lazily
let aiClient: GoogleGenAI | null = null;

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

// API endpoint for fan queries
app.post("/api/gates/query", async (req, res) => {
  const { query, gates } = req.body as { query: string; gates: GateData[] };

  if (!query || !Array.isArray(gates)) {
    return res.status(400).json({ error: "Invalid request body. 'query' and 'gates' are required." });
  }

  // Check if we can use the actual Gemini API
  const ai = getGeminiClient();

  if (!ai) {
    // Satisfy "without api I need an ai chat": fall back to highly-polished local reasoning engine
    // Add a small artificial delay (e.g. 800ms) to simulate LLM thinking time
    await new Promise((resolve) => setTimeout(resolve, 800));
    const fallbackResponse = generateLocalReasoning(query, gates);
    return res.json(fallbackResponse);
  }

  try {
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
    return res.json({
      recommendedGate: result.recommendedGate,
      reasoning: result.reasoning,
      detectedLanguage: result.detectedLanguage,
      response: result.response,
      isFallback: false,
    });
  } catch (err: any) {
    console.error("Gemini API Error, reverting to local fallback:", err.message);
    // Graceful error fallback to preserve user experience
    const fallbackResponse = generateLocalReasoning(query, gates);
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GateSense server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
