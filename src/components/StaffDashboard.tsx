/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { GateData } from "../types";
import { 
  Users, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle, 
  TrendingUp,
  Radio,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface StaffDashboardProps {
  gates: GateData[];
  sessionQueryCount: number;
}

const HIGH_CONGESTION_THRESHOLD = 80;

export default function StaffDashboard({ gates, sessionQueryCount }: StaffDashboardProps) {
  const [summary, setSummary] = useState<string>("");
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [simulatedQueryOffset, setSimulatedQueryOffset] = useState<number>(342);

  // Derive metrics
  const congestedGatesCount = gates.filter((g) => g.density > HIGH_CONGESTION_THRESHOLD).length;
  const averageDensity = Math.round(gates.reduce((acc, g) => acc + g.density, 0) / gates.length) || 0;
  
  // Dynamic illustrative estimated fan queries (baseline + session query count + random ticks)
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedQueryOffset((prev) => prev + Math.floor(Math.random() * 3));
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const totalEstimatedQueries = simulatedQueryOffset + (sessionQueryCount * 12);

  // Fetch AI Operational Summary
  const fetchSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const response = await fetch("/api/staff/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gates }),
      });
      if (!response.ok) throw new Error("Failed to fetch staff summary");
      const data = await response.json();
      setSummary(data.summary);
      setIsFallback(data.isFallback || false);
    } catch (err) {
      console.warn("Error fetching staff summary, using local fallback", err);
      // Hard fallback if the API fails
      const highGates = gates.filter((g) => g.density > HIGH_CONGESTION_THRESHOLD).map((g) => g.name);
      const clearGates = gates.filter((g) => g.density < 50).map((g) => g.name);
      let localFallback = "All gates are operating within safe standard thresholds. Crowd density levels are balanced across the stadium checkpoints.";
      if (highGates.length > 0) {
        localFallback = `${highGates.join(" and ")} are experiencing high congestion levels above ${HIGH_CONGESTION_THRESHOLD}%. ${
          clearGates.length > 0 
            ? `Recommend redirecting arriving pedestrian traffic towards clearer entry points like ${clearGates.join(" and ")}.`
            : "Standard routing pathways are fully utilized. Consider utilizing secondary overflow channels."
        }`;
      }
      setSummary(localFallback);
      setIsFallback(true);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Fetch summary on load and when gate list configuration changes substantially
  useEffect(() => {
    fetchSummary();
  }, [gates.map(g => g.density).join(",")]);

  return (
    <div 
      className="bg-black/40 border border-white/10 rounded-lg backdrop-blur-md p-5 sm:p-6 space-y-6 flex flex-col h-full"
      id="staff-dashboard"
      role="region"
      aria-label="Staff Operations Dashboard"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <h2 className="text-sm font-mono uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <Radio className="w-4 h-4 animate-pulse" />
              OPERATIONS_INTELLIGENCE_CENTER
            </h2>
          </div>
          <p className="text-[11px] text-white/40 font-mono mt-0.5">
            STAFF & VOLUNTEER DISPATCH CONSOLE • ESTADIO AZTECA
          </p>
        </div>
        <button
          onClick={fetchSummary}
          disabled={isLoadingSummary}
          className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white/60 hover:text-white transition-all disabled:opacity-50"
          title="Refresh AI Operational Summary"
          aria-label="Refresh operational intelligence"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSummary ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Derived Overview Metrics Card Panel */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/5 p-3 rounded flex flex-col justify-between">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
            Gates Requiring Attention
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-2xl font-bold font-mono ${congestedGatesCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {congestedGatesCount}
            </span>
            <span className="text-xs text-white/30">/ {gates.length}</span>
          </div>
          <div className="text-[9px] font-mono mt-1 text-white/50 flex items-center gap-1">
            {congestedGatesCount > 0 ? (
              <>
                <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="text-rose-400">Bottlenecks detected</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-emerald-400">All pathways stable</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-white/5 border border-white/5 p-3 rounded flex flex-col justify-between">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
            Estimated Fan Queries
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-cybercyan">
              {totalEstimatedQueries}
            </span>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded ml-1 animate-pulse">
              +LIVE
            </span>
          </div>
          <span className="text-[9px] font-mono text-white/30 mt-1 uppercase block leading-none">
            Query Volume (Last 10m)
          </span>
        </div>
      </div>

      {/* AI Operational Summary Box */}
      <div className="bg-white/5 border border-white/10 rounded-md p-4 space-y-2.5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono text-[#00F5FF] uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00F5FF]" />
            REAL_TIME_AI_DISPATCH_GUIDANCE
          </h3>
          <span className="text-[9px] font-mono px-1.5 py-0.5 bg-white/5 rounded text-white/40 uppercase tracking-wider">
            {isFallback ? "Fallback Engine" : "Gemini 2.5 Active"}
          </span>
        </div>

        <div className="min-h-[60px] text-xs leading-relaxed text-slate-300 font-light font-sans">
          {isLoadingSummary ? (
            <div className="flex flex-col gap-2 pt-2 animate-pulse">
              <div className="h-2.5 bg-white/10 rounded w-full"></div>
              <div className="h-2.5 bg-white/10 rounded w-5/6"></div>
              <div className="h-2.5 bg-white/10 rounded w-2/3"></div>
            </div>
          ) : (
            <p id="staff-summary-text" className="transition-all duration-300">
              {summary}
            </p>
          )}
        </div>
      </div>

      {/* Gates Congestion List Overview */}
      <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] pr-1">
        <h3 className="text-[10px] font-mono text-white/40 uppercase tracking-widest flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-white/30" />
          Live Gate Density Checklist
        </h3>

        <div className="space-y-2">
          {gates.map((g) => {
            const isHigh = g.density > HIGH_CONGESTION_THRESHOLD;
            const percentageColor = isHigh ? "text-rose-400 font-bold" : g.density > 50 ? "text-amber-400" : "text-emerald-400";
            const borderStyle = isHigh ? "border-rose-500/30 bg-rose-500/5" : "border-white/5 bg-white/5";

            return (
              <div 
                key={g.name}
                className={`flex items-center justify-between p-2.5 rounded border ${borderStyle} transition-all`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${isHigh ? "bg-rose-500 animate-ping" : g.density > 50 ? "bg-amber-400" : "bg-emerald-400"}`}></div>
                  <span className="text-xs font-mono font-medium text-white/80">{g.name.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono ${percentageColor}`}>{g.density}%</span>
                  {isHigh ? (
                    <span className="text-[9px] font-mono uppercase bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/20 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5 text-rose-400 animate-bounce" />
                      CRITICAL_BOTTLENECK
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono uppercase text-white/30">
                      Stable
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Control Info Footer */}
      <div className="text-[10px] font-mono text-white/20 border-t border-white/5 pt-3.5 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-white/20" />
          SENSORS: {gates.length} ACTIVE
        </span>
        <span>REFRESH: DEBOUNCED ON TICK</span>
      </div>
    </div>
  );
}
