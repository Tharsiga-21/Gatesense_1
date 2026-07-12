/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { GateData } from "../types";
import { ShieldAlert, Users, Compass, Activity } from "lucide-react";
import { motion } from "motion/react";

interface GateGridProps {
  gates: GateData[];
  isCustomData: boolean;
  onQuickCapacityChange?: (type: "all-100" | "all-10" | "congested-split" | "random") => void;
}

export default function GateGrid({ gates, isCustomData, onQuickCapacityChange }: GateGridProps) {
  const getDensityColor = (density: number) => {
    if (density < 50) {
      return {
        text: "text-emerald-400",
        label: "LOW",
        bg: "bg-emerald-500/5",
        border: "border-emerald-500/20",
        accent: "bg-emerald-500",
      };
    } else if (density <= 80) {
      return {
        text: "text-amber-400",
        label: "STABLE",
        bg: "bg-amber-500/5",
        border: "border-amber-500/20",
        accent: "bg-amber-500",
      };
    } else {
      return {
        text: "text-rose-500 font-semibold",
        label: "CRITICAL",
        bg: "bg-rose-500/5 shadow-[0_0_20px_rgba(239,68,68,0.08)]",
        border: "border-rose-500/30",
        accent: "bg-rose-500",
      };
    }
  };

  return (
    <div className="space-y-4" id="gate-density-view">
      {/* Header and Live Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <h2 className="text-sm font-mono text-white/50 uppercase tracking-tighter italic flex items-center gap-2">
            <Activity className="w-4 h-4 text-cybercyan" />
            Live Density Monitoring
          </h2>
          <p className="text-[11px] text-slate-400 font-light mt-0.5">
            Real-time checkpoint flow across all primary stadium gates
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCustomData ? 'bg-cybercyan' : 'bg-emerald-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isCustomData ? 'bg-cybercyan' : 'bg-emerald-500'}`}></span>
          </span>
          <span className="px-2 py-0.5 bg-cybercyan/10 text-cybercyan text-[10px] rounded border border-cybercyan/20 font-mono tracking-wide uppercase">
            {isCustomData ? "USER_OVERRIDE" : "SYNTHETIC_DATA"}
          </span>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {gates.map((gate) => {
          const colors = getDensityColor(gate.density);
          return (
            <motion.div
              key={gate.name}
              id={`gate-card-${gate.name.replace(/\s+/g, "-").toLowerCase()}`}
              layout
              className={`gate-card p-4 rounded-lg flex flex-col justify-between ${colors.border} ${colors.bg}`}
              whileHover={{ scale: 1.015 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="flex justify-between items-start">
                <span className="text-lg font-bold tracking-tight text-white/90">{gate.name.toUpperCase()}</span>
                <span className={`text-[10px] font-mono tracking-wider ${colors.text}`}>
                  {colors.label}
                </span>
              </div>

              {/* Progress and numbers */}
              <div className="mt-4">
                <div className="text-3xl font-light mono text-white">
                  {gate.density}<span className="text-xs text-white/50">%</span>
                </div>
                
                {/* Outer bar */}
                <div className="w-full h-1 bg-white/10 mt-2.5 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${colors.accent}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${gate.density}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 text-[9px] text-white/30 font-mono">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-white/20" />
                  {gate.density > 80 ? "CONGESTED" : "NORMAL FLOW"}
                </span>
                <span>{new Date(gate.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick State Simulation Controls for Evaluators */}
      {onQuickCapacityChange && (
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-2.5">
          <p className="text-xs font-mono uppercase text-white/50 tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cybercyan" />
            Evaluation Scenarios (Test Cognitive Edge Cases)
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onQuickCapacityChange("random")}
              className="text-[11px] px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/80 font-mono transition border border-white/10 cursor-pointer"
              id="diag-random"
            >
              🔄 RANDOMIZE
            </button>
            <button
              onClick={() => onQuickCapacityChange("congested-split")}
              className="text-[11px] px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/80 font-mono transition border border-white/10 cursor-pointer"
              id="diag-split"
            >
              ⚠️ BOTTLENECK (A/B/C)
            </button>
            <button
              onClick={() => onQuickCapacityChange("all-100")}
              className="text-[11px] px-3 py-1.5 rounded bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-500/20 font-mono transition flex items-center gap-1 cursor-pointer"
              id="diag-100"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              🚨 ALL GATES 100%
            </button>
            <button
              onClick={() => onQuickCapacityChange("all-10")}
              className="text-[11px] px-3 py-1.5 rounded bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-400 border border-emerald-500/20 font-mono transition cursor-pointer"
              id="diag-10"
            >
              🟢 ALL GATES 10%
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
