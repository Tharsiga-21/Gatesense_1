/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GateData {
  name: string; // e.g. "Gate A", "Gate B", etc.
  density: number; // 0 to 100
  timestamp: string; // ISO string or format
}

export interface QueryRequest {
  query: string;
  gates: GateData[];
}

export interface QueryResponse {
  recommendedGate: string; // "A" | "B" | "C" | "D" | "E" | "F"
  reasoning: string;       // 1-2 sentence explanation of WHY in English or technical explanation
  detectedLanguage: string;// Detected language name or code, e.g. "Spanish" or "es"
  response: string;        // The actual chat response in the detected language
  isFallback: boolean;     // Whether the local fallback reasoning engine was used
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  data?: QueryResponse; // contains the structured reasoning
}
