/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GateData, QueryResponse } from "../types";
import {
  detectLanguage,
  detectAccessibilityNeed,
  detectSustainabilityNeed,
  ACCESSIBILITY_NOTES,
  SUSTAINABILITY_NOTES,
  ERROR_RESPONSES,
  FULL_RESPONSES,
  HIGH_CONGESTION_RESPONSES,
  MODERATE_CONGESTION_HIGH_DIFF_RESPONSES,
  MODERATE_CONGESTION_LOW_DIFF_RESPONSES,
  LOW_CONGESTION_RESPONSES,
  NO_GATE_RESPONSES,
  formatResponse
} from "./localizedContent";

// Export these for backward compatibility and tests
export { detectLanguage, detectAccessibilityNeed, detectSustainabilityNeed };

// Named Constants to eliminate magic numbers and strings
export const HIGH_CONGESTION_THRESHOLD = 80;
export const MODERATE_CONGESTION_THRESHOLD = 50;
export const ACCESSIBLE_GATES = ["Gate C", "Gate D"];
export const ACCESSIBLE_GATE_LETTERS = ["C", "D"];

/**
 * Formulates a fallback response when Gemini is not configured or fails.
 * Fully satisfies "without api I need an ai chat" requirements.
 * Evaluates real-time gate congestion and returns safety navigation suggestions.
 * 
 * @param {string} query - Raw user input query.
 * @param {GateData[]} gates - Array of current gates and their corresponding density metrics.
 * @returns {QueryResponse} Structured fallback safety advice object.
 */
export function generateLocalReasoning(query: string, gates: GateData[]): QueryResponse {
  const { code: langCode, name: langName } = detectLanguage(query);
  const normalizedQuery = query.trim().toLowerCase();
  const isAccessible = detectAccessibilityNeed(query);
  const isSustainable = detectSustainabilityNeed(query);

  // Edge Case 1: Empty or very short/gibberish input
  if (
    normalizedQuery.length < 3 ||
    /^[^\w\s\u0600-\u06FF\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF\u0900-\u097F]+$/.test(normalizedQuery)
  ) {
    const resp = ERROR_RESPONSES[langCode] || ERROR_RESPONSES.en;
    return {
      recommendedGate: resp.r,
      reasoning: "Query was identified as too short, empty, or containing invalid characters, triggering fallback instructions.",
      detectedLanguage: `${langName} (Defaulted due to short/gibberish input)`,
      response: resp.msg,
      isFallback: true
    };
  }

  // Check if all gates are at 100% capacity
  const allFull = gates.every((g) => g.density >= 100);
  if (allFull) {
    const responseMsg = FULL_RESPONSES[langCode] || FULL_RESPONSES.en;
    return {
      recommendedGate: "NONE",
      reasoning: "All stadium gates are at maximum density capacity. No safe recommendations are available. Real-time crowd safety block activated.",
      detectedLanguage: langName,
      response: responseMsg,
      isFallback: true
    };
  }

  // Extract mentioned gate from query
  let mentionedGate: string | null = null;
  const gateMatch =
    normalizedQuery.match(/gate\s*([a-f])\b/) ||
    normalizedQuery.match(/puerta\s*([a-f])\b/) ||
    normalizedQuery.match(/porte\s*([a-f])\b/) ||
    normalizedQuery.match(/tor\s*([a-f])\b/) ||
    normalizedQuery.match(/portão\s*([a-f])\b/) ||
    normalizedQuery.match(/portao\s*([a-f])\b/) ||
    normalizedQuery.match(/بوابة\s*([a-f])\b/) ||
    normalizedQuery.match(/ゲート\s*([a-f])\b/) ||
    normalizedQuery.match(/([a-f])\s*号门/) ||
    normalizedQuery.match(/([a-f])\s*门/) ||
    normalizedQuery.match(/게이트\s*([a-f])\b/);

  if (gateMatch) {
    mentionedGate = gateMatch[1].toUpperCase();
  } else {
    // Look for single letters A-F in proximity to proximity terms
    const nearbyMatch = normalizedQuery.match(/\b(near|at|by|cerca|près|bei|perto)\s+([a-f])\b/);
    if (nearbyMatch) {
      mentionedGate = nearbyMatch[2].toUpperCase();
    }
  }

  // Analyze gates for recommendations.
  // If Accessibility is requested, we strongly prefer Gates C and D (Priority Accessible Gates) unless they are extremely congested.
  let bestGateObj = [...gates].sort((a, b) => a.density - b.density)[0];

  if (isAccessible) {
    const gateC = gates.find((g) => g.name === "Gate C");
    const gateD = gates.find((g) => g.name === "Gate D");

    const candidateC = gateC ? gateC.density : 100;
    const candidateD = gateD ? gateD.density : 100;

    // If at least one of C or D is under the HIGH_CONGESTION_THRESHOLD, recommend it.
    if (candidateC < HIGH_CONGESTION_THRESHOLD || candidateD < HIGH_CONGESTION_THRESHOLD) {
      if (candidateC <= candidateD) {
        bestGateObj = gateC || bestGateObj;
      } else {
        bestGateObj = gateD || bestGateObj;
      }
    }
  }

  const bestGateLetter = bestGateObj.name.replace("Gate ", "");
  let finalRecommendedLetter = bestGateLetter;
  let whyEnglish = "";
  let finalResponseInLanguage = "";

  if (mentionedGate) {
    const currentGateObj = gates.find((g) => g.name === `Gate ${mentionedGate}`);
    const currentDensity = currentGateObj ? currentGateObj.density : 100;

    if (currentDensity > HIGH_CONGESTION_THRESHOLD) {
      // The current gate is heavily congested, recommend a cleaner alternative
      const alternativeGate = bestGateObj;
      const altLetter = alternativeGate.name.replace("Gate ", "");
      finalRecommendedLetter = altLetter;
      whyEnglish = `Gate ${mentionedGate} is at ${currentDensity}% capacity and heavily congested. We recommend redirecting to Gate ${altLetter} which is only at ${alternativeGate.density}% capacity, providing a much smoother entry to the stadium.`;

      const rawTemplate = HIGH_CONGESTION_RESPONSES[langCode] || HIGH_CONGESTION_RESPONSES.en;
      finalResponseInLanguage = formatResponse(rawTemplate, {
        mentionedGate,
        currentDensity,
        altLetter,
        altDensity: alternativeGate.density
      });
    } else if (currentDensity > MODERATE_CONGESTION_THRESHOLD) {
      // Moderate density, check if best alternative is significantly better (e.g. >30% better)
      const diff = currentDensity - bestGateObj.density;
      if (diff > 30) {
        const altLetter = bestGateLetter;
        finalRecommendedLetter = altLetter;
        whyEnglish = `Gate ${mentionedGate} is at ${currentDensity}% capacity (moderately busy). Gate ${altLetter} is much clearer at ${bestGateObj.density}% capacity and will save you valuable time.`;

        const rawTemplate = MODERATE_CONGESTION_HIGH_DIFF_RESPONSES[langCode] || MODERATE_CONGESTION_HIGH_DIFF_RESPONSES.en;
        finalResponseInLanguage = formatResponse(rawTemplate, {
          mentionedGate,
          currentDensity,
          altLetter,
          altDensity: bestGateObj.density
        });
      } else {
        // Continue through current gate as it is reasonably low/moderate and there is no massive gain
        whyEnglish = `Gate ${mentionedGate} is at ${currentDensity}% capacity. Since you are already near it, proceeding through Gate ${mentionedGate} is your most direct and efficient option.`;

        const rawTemplate = MODERATE_CONGESTION_LOW_DIFF_RESPONSES[langCode] || MODERATE_CONGESTION_LOW_DIFF_RESPONSES.en;
        finalResponseInLanguage = formatResponse(rawTemplate, {
          mentionedGate,
          currentDensity
        });
      }
    } else {
      // Current gate is very low density (<50%), absolutely stay there!
      whyEnglish = `Gate ${mentionedGate} is operating very smoothly at ${currentDensity}% capacity. Entering here is your fastest and most convenient route.`;

      const rawTemplate = LOW_CONGESTION_RESPONSES[langCode] || LOW_CONGESTION_RESPONSES.en;
      finalResponseInLanguage = formatResponse(rawTemplate, {
        mentionedGate,
        currentDensity
      });
    }
  } else {
    // No gate mentioned, just find the absolute best options
    whyEnglish = `No location gate was specified. We recommend Gate ${bestGateLetter} which is the least crowded at ${bestGateObj.density}% capacity, providing a highly efficient route.`;

    const rawTemplate = NO_GATE_RESPONSES[langCode] || NO_GATE_RESPONSES.en;
    finalResponseInLanguage = formatResponse(rawTemplate, {
      bestGateLetter,
      bestGateDensity: bestGateObj.density
    });
  }

  // Prepend or Append Accessibility / Sustainability notes if triggered
  let finalResponse = finalResponseInLanguage;

  if (isAccessible) {
    const note = ACCESSIBILITY_NOTES[langCode] || ACCESSIBILITY_NOTES.en;
    finalResponse = `${finalResponse}\n\n${note}`;
  }

  if (isSustainable) {
    const note = SUSTAINABILITY_NOTES[langCode] || SUSTAINABILITY_NOTES.en;
    finalResponse = `${finalResponse}\n\n${note}`;
  }

  return {
    recommendedGate: finalRecommendedLetter,
    reasoning: whyEnglish,
    detectedLanguage: langName,
    response: finalResponse,
    isFallback: true
  };
}

/**
 * Generates a local fallback operational summary for staff/operators when Gemini is unavailable.
 * Identifies congested bottlenecks (>80%) and suggests active redirection to clear gates (<50%).
 * 
 * @param {GateData[]} gates - Array of current gates and their corresponding density metrics.
 * @returns {string} The localized deterministic fallback text.
 */
export function generateLocalStaffSummary(gates: GateData[]): string {
  const highGates = gates.filter((g) => g.density > HIGH_CONGESTION_THRESHOLD).map((g) => g.name);
  const clearGates = gates.filter((g) => g.density < MODERATE_CONGESTION_THRESHOLD).map((g) => g.name);

  if (highGates.length === 0) {
    return "All stadium entrance gates are operating within safe density bounds. Pedestrian flows are balanced. Recommend maintaining regular staffing and continuing standard monitoring of entrance thresholds.";
  }

  const redirectionGuidance = clearGates.length > 0
    ? ` Recommend actively redirecting arriving fans towards lower-density entry points like ${clearGates.join(" and ")}, which are operating under 50% capacity.`
    : " All entry checkpoints are experiencing elevated densities; suggest mobilizing standby volunteer guides to assist with line sorting and bottleneck mitigation.";

  return `${highGates.join(" and ")} are currently experiencing heavy congestion exceeding critical density. ${redirectionGuidance} Dispatch venue guides to coordinate crowd redirection and optimize flow rates.`;
}

