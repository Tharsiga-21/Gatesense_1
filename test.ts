/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { validateAndNormalizeGate, parseCrowdCSV, parseCrowdJSON } from "./src/utils/parser";
import { detectLanguage, generateLocalReasoning } from "./src/utils/reasoningFallback";

console.log("=========================================");
console.log(" RUNNING GATESENSE TEST SUITE ");
console.log("=========================================\n");

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASSED: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAILED: ${message}`);
    failed++;
  }
}

function runTests() {
  // Test 1: validateAndNormalizeGate with various gate name styles
  try {
    const r1 = validateAndNormalizeGate("gate a", 45);
    assert(r1.name === "Gate A" && r1.density === 45, "validateAndNormalizeGate: handles lowercase 'gate a'");

    const r2 = validateAndNormalizeGate("GATE-B", "80");
    assert(r2.name === "Gate B" && r2.density === 80, "validateAndNormalizeGate: handles dash and string density");

    const r3 = validateAndNormalizeGate("  C  ", 0);
    assert(r3.name === "Gate C" && r3.density === 0, "validateAndNormalizeGate: handles padded single character and zero density");
  } catch (e: any) {
    assert(false, `validateAndNormalizeGate validation failed: ${e.message}`);
  }

  // Test 2: validateAndNormalizeGate out-of-bounds error handling
  try {
    validateAndNormalizeGate("Gate A", 110);
    assert(false, "validateAndNormalizeGate should reject density > 100");
  } catch (e: any) {
    assert(e.message.includes("between 0 and 100"), "validateAndNormalizeGate: correctly rejects density > 100");
  }

  try {
    validateAndNormalizeGate("Gate A", -5);
    assert(false, "validateAndNormalizeGate should reject density < 0");
  } catch (e: any) {
    assert(e.message.includes("between 0 and 100"), "validateAndNormalizeGate: correctly rejects density < 0");
  }

  try {
    validateAndNormalizeGate("Gate Z", 50);
    assert(false, "validateAndNormalizeGate should reject invalid gate letter");
  } catch (e: any) {
    assert(e.message.includes("Invalid or unsupported gate name"), "validateAndNormalizeGate: correctly rejects unsupported gate 'Z'");
  }

  // Test 3: parseCrowdCSV
  try {
    const csv = `gate,density,timestamp
Gate A,25,2026-07-12T08:00:00Z
b,90,2026-07-12T08:00:00Z`;
    const parsed = parseCrowdCSV(csv);
    assert(parsed.length === 2, "parseCrowdCSV: parses standard CSV lines");
    assert(parsed[0].name === "Gate A" && parsed[0].density === 25, "parseCrowdCSV: normalizes first gate");
    assert(parsed[1].name === "Gate B" && parsed[1].density === 90, "parseCrowdCSV: normalizes second gate");
  } catch (e: any) {
    assert(false, `parseCrowdCSV failed: ${e.message}`);
  }

  // Test 4: parseCrowdJSON
  try {
    const json = `[
      {"gate": "Gate E", "density": 12},
      {"name": "Gate F", "capacity": 88}
    ]`;
    const parsed = parseCrowdJSON(json);
    assert(parsed.length === 2, "parseCrowdJSON: parses JSON array and flexible field mapping");
    assert(parsed[0].name === "Gate E" && parsed[0].density === 12, "parseCrowdJSON: item 1 fields mapped");
    assert(parsed[1].name === "Gate F" && parsed[1].density === 88, "parseCrowdJSON: item 2 fields mapped");
  } catch (e: any) {
    assert(false, `parseCrowdJSON failed: ${e.message}`);
  }

  // Test 5: Language Detection heuristics
  const langEs = detectLanguage("Hola, estoy en la puerta B intentando entrar.");
  assert(langEs.code === "es", "detectLanguage: detects Spanish");

  const langFr = detectLanguage("Bonjour, je suis près de la porte C");
  assert(langFr.code === "fr", "detectLanguage: detects French");

  const langEn = detectLanguage("I am near Gate F trying to enter Section 214");
  assert(langEn.code === "en", "detectLanguage: defaults to English");

  // Test 6: Reasoning Engine fallback
  const mockGates = [
    { name: "Gate A", density: 90, timestamp: "..." },
    { name: "Gate B", density: 85, timestamp: "..." },
    { name: "Gate C", density: 10, timestamp: "..." },
    { name: "Gate D", density: 25, timestamp: "..." },
    { name: "Gate E", density: 100, timestamp: "..." },
    { name: "Gate F", density: 95, timestamp: "..." },
  ];

  const reasoning = generateLocalReasoning("I am near Gate B, which gate is best?", mockGates);
  assert(reasoning.recommendedGate === "C", "generateLocalReasoning: redirects from crowded Gate B (85%) to best Gate C (10%)");
  assert(reasoning.reasoning.includes("Gate B is at 85%"), "generateLocalReasoning: reasoning includes actual density citations");

  // Test 7: All Gates 100% capacity edge case
  const fullGates = mockGates.map(g => ({ ...g, density: 100 }));
  const fullReasoning = generateLocalReasoning("Can I enter through Gate A?", fullGates);
  assert(fullReasoning.recommendedGate === "NONE", "generateLocalReasoning: handles 'All Gates 100%' safety block");

  console.log("\n=========================================");
  console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED `);
  console.log("=========================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
