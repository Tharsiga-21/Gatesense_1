/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, test, expect, vi } from "vitest";
import { validateAndNormalizeGate, parseCrowdCSV, parseCrowdJSON } from "./src/utils/parser";
import { detectLanguage, generateLocalReasoning } from "./src/utils/reasoningFallback";
import { validateRequest, handleFallback, callGeminiModel } from "./server";
import { GateData } from "./src/types";

// Mock @google/genai so that callGeminiModel does not call the real API during tests
vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify({
            recommendedGate: "C",
            reasoning: "Gate C is at 10% density which is much safer than Gate B at 85%.",
            detectedLanguage: "English",
            response: "Please use Gate C for the safest and fastest entrance."
          })
        })
      };
    },
    Type: {
      OBJECT: "OBJECT",
      STRING: "STRING"
    }
  };
});

describe("GateSense Safety & Parser Test Suite", () => {
  
  // ==========================================
  // Dimension 3 & 6: Gate Validation & Parsing Tests
  // ==========================================
  describe("Gate Name and Density Validation", () => {
    test("handles variations of gate names correctly", () => {
      const r1 = validateAndNormalizeGate("gate a", 45);
      expect(r1.name).toBe("Gate A");
      expect(r1.density).toBe(45);

      const r2 = validateAndNormalizeGate("GATE-B", "80");
      expect(r2.name).toBe("Gate B");
      expect(r2.density).toBe(80);

      const r3 = validateAndNormalizeGate("  C  ", 0);
      expect(r3.name).toBe("Gate C");
      expect(r3.density).toBe(0);
    });

    test("correctly rejects out of bounds density values (>100)", () => {
      expect(() => validateAndNormalizeGate("Gate A", 110)).toThrow(/between 0 and 100/);
    });

    test("correctly rejects out of bounds density values (<0)", () => {
      expect(() => validateAndNormalizeGate("Gate A", -5)).toThrow(/between 0 and 100/);
    });

    test("correctly rejects unsupported gate codes", () => {
      expect(() => validateAndNormalizeGate("Gate Z", 50)).toThrow(/Invalid or unsupported gate name/);
    });
  });

  describe("CSV Input Parser", () => {
    test("parses standard CSV lines accurately with headers", () => {
      const csv = `gate,density,timestamp
Gate A,25,2026-07-12T08:00:00Z
b,90,2026-07-12T08:00:00Z`;
      const parsed = parseCrowdCSV(csv);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe("Gate A");
      expect(parsed[0].density).toBe(25);
      expect(parsed[1].name).toBe("Gate B");
      expect(parsed[1].density).toBe(90);
    });

    test("handles malformed CSV input gracefully", () => {
      const malformedCsv = `gate,density,timestamp
Gate A,,2026-07-12T08:00:00Z`;
      expect(() => parseCrowdCSV(malformedCsv)).toThrow(/density is missing/i);

      const emptyCsv = "";
      expect(() => parseCrowdCSV(emptyCsv)).toThrow(/CSV file is empty/i);

      const badColumnsCsv = `Gate A`;
      expect(() => parseCrowdCSV(badColumnsCsv)).toThrow(/insufficient columns/i);
    });
  });

  describe("JSON Input Parser", () => {
    test("parses JSON array and maps flexible fields", () => {
      const json = `[
        {"gate": "Gate E", "density": 12},
        {"name": "Gate F", "capacity": 88}
      ]`;
      const parsed = parseCrowdJSON(json);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe("Gate E");
      expect(parsed[0].density).toBe(12);
      expect(parsed[1].name).toBe("Gate F");
      expect(parsed[1].density).toBe(88);
    });

    test("handles malformed JSON inputs securely", () => {
      const brokenJson = `[{"gate": "Gate A", "density": 50`;
      expect(() => parseCrowdJSON(brokenJson)).toThrow(/Invalid JSON format/i);

      const wrongFormatJson = `{"gate": "Gate A", "density": "not-a-number"}`;
      expect(() => parseCrowdJSON(wrongFormatJson)).toThrow(/must be a number/i);
    });
  });

  // ==========================================
  // Dimension 6: Multilingual Detection & Localization Tests
  // ==========================================
  describe("Multilingual Detection", () => {
    test("identifies Spanish queries properly", () => {
      const lang = detectLanguage("Hola, la Puerta B está muy llena, ¿cómo llego?");
      expect(lang.code).toBe("es");
      expect(lang.name).toBe("Spanish");
    });

    test("identifies French queries properly", () => {
      const lang = detectLanguage("Bonjour, je suis près de la porte C");
      expect(lang.code).toBe("fr");
      expect(lang.name).toBe("French");
    });

    test("identifies Portuguese queries properly", () => {
      const lang = detectLanguage("olá, portão F está fechado?");
      expect(lang.code).toBe("pt");
      expect(lang.name).toBe("Portuguese");
    });

    test("defaults to English for standard queries", () => {
      const lang = detectLanguage("I'm looking for Section 214 starting from Gate D.");
      expect(lang.code).toBe("en");
      expect(lang.name).toBe("English");
    });
  });

  // ==========================================
  // Dimension 1, 3, 6: Safety Lockout, Fallback & Input Validation
  // ==========================================
  describe("Reasoning Engine Local Fallback", () => {
    const mockGates: GateData[] = [
      { name: "Gate A", density: 90, timestamp: "..." },
      { name: "Gate B", density: 85, timestamp: "..." },
      { name: "Gate C", density: 10, timestamp: "..." },
      { name: "Gate D", density: 25, timestamp: "..." },
      { name: "Gate E", density: 100, timestamp: "..." },
      { name: "Gate F", density: 95, timestamp: "..." },
    ];

    test("redirects from highly congested gates to best alternatives based on safety-over-distance", () => {
      const result = generateLocalReasoning("I am near Gate B, which gate is best?", mockGates);
      expect(result.recommendedGate).toBe("C");
      expect(result.reasoning).toContain("Gate B is at 85%");
      expect(result.reasoning).toContain("Gate C which is only at 10%");
    });

    test("activates 100% emergency lockout when all gates are fully packed", () => {
      const fullyCongestedGates = mockGates.map(g => ({ ...g, density: 100 }));
      const result = generateLocalReasoning("Which gate can I enter?", fullyCongestedGates);
      expect(result.recommendedGate).toBe("NONE");
      expect(result.reasoning).toContain("maximum density capacity");
      expect(result.response).toContain("ATTENTION: All stadium gates");
    });

    test("handles empty or gibberish queries gracefully with supportive instructions", () => {
      const emptyResult = generateLocalReasoning("   ", mockGates);
      expect(emptyResult.recommendedGate).toBe("D");
      expect(emptyResult.detectedLanguage).toContain("Defaulted");
      expect(emptyResult.response).toContain("seems empty or unclear");

      const gibberishResult = generateLocalReasoning("???!!!", mockGates);
      expect(gibberishResult.recommendedGate).toBe("D");
      expect(gibberishResult.response).toContain("seems empty or unclear");
    });
  });

  describe("API Server Helpers & Sanitizers", () => {
    const validGates = [
      { name: "Gate A", density: 30, timestamp: new Date().toISOString() },
      { name: "Gate B", density: 75, timestamp: new Date().toISOString() }
    ];

    test("validateRequest sanitizes HTML and parses correct formats", () => {
      const body = {
        query: "<h1>Hello GateSense</h1>, near Gate B.",
        gates: validGates
      };
      const result = validateRequest(body);
      expect(result.query).toBe("Hello GateSense, near Gate B.");
      expect(result.gates).toHaveLength(2);
      expect(result.gates[0].name).toBe("Gate A");
      expect(result.gates[0].density).toBe(30);
    });

    test("validateRequest rejects empty gates array", () => {
      const body = {
        query: "Which gate is open?",
        gates: []
      };
      expect(() => validateRequest(body)).toThrow(/gates.*array.*empty/i);
    });

    test("validateRequest rejects invalid query parameters", () => {
      const body = {
        query: 1234,
        gates: validGates
      };
      expect(() => validateRequest(body)).toThrow(/query.*required/i);
    });

    test("handleFallback logs message and triggers local reasoning safely", () => {
      const result = handleFallback("near Gate B", validGates, "Simulated network timeout");
      expect(result.isFallback).toBe(true);
      expect(result.recommendedGate).toBe("A"); // B is 75%, A is 30% -> redirects to A
    });

    test("callGeminiModel correctly uses response schema and handles mock call response", async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: JSON.stringify({
          recommendedGate: "C",
          reasoning: "Gate C is at 10% density which is much safer than Gate B at 75%.",
          detectedLanguage: "English",
          response: "Please use Gate C for safe entrance."
        })
      });
      const mockAi = {
        models: {
          generateContent: mockGenerateContent
        }
      } as any;

      const result = await callGeminiModel("I am near Gate B", validGates, mockAi);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(result.recommendedGate).toBe("C");
      expect(result.detectedLanguage).toBe("English");
      expect(result.isFallback).toBe(false);
    });

    test("callGeminiModel propagates standard errors when model call throws", async () => {
      const mockAi = {
        models: {
          generateContent: vi.fn().mockRejectedValue(new Error("API Overloaded / Quota Limit"))
        }
      } as any;

      await expect(callGeminiModel("hello", validGates, mockAi)).rejects.toThrow("API Overloaded / Quota Limit");
    });

    test("API endpoint falls back gracefully to local reasoning when callGeminiModel throws", async () => {
      const originalKey = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = "dummy_invalid_key_to_force_api_failure";

      // Import serverInstance to retrieve the dynamic bound port to prevent port collisions
      const { serverInstance } = await import("./server");
      const address = serverInstance ? serverInstance.address() : null;
      const port = typeof address === "object" && address ? address.port : 3000;

      try {
        const response = await fetch(`http://localhost:${port}/api/gates/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: "I am near Gate B, which gate is best?",
            gates: [
              { name: "Gate A", density: 30, timestamp: new Date().toISOString() },
              { name: "Gate B", density: 85, timestamp: new Date().toISOString() }
            ]
          })
        });

        expect(response.status).toBe(200);
        const data = await response.json() as any;
        expect(data.isFallback).toBe(true);
        expect(data.recommendedGate).toBe("A");
        expect(data.reasoning).toContain("Gate B is at 85%");
      } finally {
        process.env.GEMINI_API_KEY = originalKey;
      }
    });
  });
});
