/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GateData } from "../types";

/**
 * Validates and normalizes gate name and density.
 * Gate name normalization: supports variations like "Gate A", "A", "gate a", "GATE_A", "gate-a"
 * Density bounds check: must be a number between 0 and 100 inclusive.
 * 
 * @throws Error if validation fails
 */
export function validateAndNormalizeGate(rawName: any, rawDensity: any): { name: string; density: number } {
  if (rawName === undefined || rawName === null || String(rawName).trim() === "") {
    throw new Error("Gate name is missing");
  }
  
  if (rawDensity === undefined || rawDensity === null || String(rawDensity).trim() === "") {
    throw new Error("Gate density is missing");
  }

  // Normalize gate name
  let nameStr = String(rawName).trim().toUpperCase();
  
  // Strip common gate prefix words to avoid false letter matches (e.g. "GATE" contains A and E)
  nameStr = nameStr.replace(/\b(GATE|PORTE|TOR|PORTAO|PORTÃO|PUERTA)\b/g, "").trim();

  // Extract a letter A-F
  let letter = "";
  
  // Try to find if there is a single letter A-F in the remaining string
  const match = nameStr.match(/\b([A-F])\b/) || nameStr.match(/^([A-F])$/);
  if (match) {
    letter = match[1];
  } else {
    // If we have a single character A-F anywhere in the remaining text
    for (const char of nameStr) {
      if (char >= 'A' && char <= 'F') {
        letter = char;
        break;
      }
    }
  }

  if (!letter) {
    throw new Error(`Invalid or unsupported gate name: "${rawName}". Gate must be A, B, C, D, E, or F.`);
  }

  const normalizedName = `Gate ${letter}`;

  // Parse and validate density
  const densityNum = Number(rawDensity);
  if (isNaN(densityNum)) {
    throw new Error(`Density must be a number: "${rawDensity}"`);
  }

  if (densityNum < 0 || densityNum > 100) {
    throw new Error(`Density must be between 0 and 100 inclusive: ${densityNum}`);
  }

  return {
    name: normalizedName,
    density: Math.round(densityNum)
  };
}

/**
 * Parses and validates CSV content representing crowd data.
 * Format: gate,density,timestamp
 */
export function parseCrowdCSV(csvText: string): GateData[] {
  const lines = csvText.split(/\r?\n/);
  const results: GateData[] = [];
  
  if (lines.length === 0 || (lines.length === 1 && !lines[0].trim())) {
    throw new Error("Uploaded CSV file is empty");
  }

  let hasHeaders = false;
  // Check if first line is a header (contains non-numeric density)
  const firstLine = lines[0].split(",");
  if (firstLine.length >= 2) {
    const rawDens = firstLine[1].trim();
    if (isNaN(Number(rawDens))) {
      hasHeaders = true;
    }
  }

  const startIndex = hasHeaders ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // skip empty lines

    const parts = line.split(",").map(p => p.replace(/^["']|["']$/g, '').trim());
    if (parts.length < 2) {
      throw new Error(`Line ${i + 1} has insufficient columns. Format should be: gate,density,[timestamp]`);
    }

    try {
      const { name, density } = validateAndNormalizeGate(parts[0], parts[1]);
      const timestamp = parts[2] || new Date().toISOString();
      results.push({ name, density, timestamp });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`Line ${i + 1} error: ${errMsg}`);
    }
  }

  if (results.length === 0) {
    throw new Error("No valid gate data found in CSV file");
  }

  // We want to ensure we have a unique record per gate, or just return the parsed list.
  // Let's deduplicate to keep the latest or just group them.
  return deduplicateGates(results);
}

/**
 * Parses and validates JSON content representing crowd data.
 */
export function parseCrowdJSON(jsonText: string): GateData[] {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid JSON format: ${errMsg}`);
  }

  const list = Array.isArray(parsed) ? parsed : [parsed];
  const results: GateData[] = [];

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (typeof item !== "object" || item === null) {
      throw new Error(`Item at index ${i} is not a valid object`);
    }

    // Support flexible keys: 'gate' or 'name', 'density' or 'capacity'
    const gateKey = item.gate !== undefined ? item.gate : (item.name !== undefined ? item.name : undefined);
    const densityKey = item.density !== undefined ? item.density : (item.capacity !== undefined ? item.capacity : undefined);
    const timestamp = item.timestamp || new Date().toISOString();

    try {
      const { name, density } = validateAndNormalizeGate(gateKey, densityKey);
      results.push({ name, density, timestamp });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`Item ${i + 1} ("${gateKey || 'unknown'}") error: ${errMsg}`);
    }
  }

  if (results.length === 0) {
    throw new Error("No valid gate data found in JSON");
  }

  return deduplicateGates(results);
}

/**
 * Ensures there's only one entry per Gate (A to F). Keeps the latest timestamp or order.
 */
function deduplicateGates(data: GateData[]): GateData[] {
  const map = new Map<string, GateData>();
  for (const item of data) {
    map.set(item.name, item);
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}
