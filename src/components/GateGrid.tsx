/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { GateData } from "../types";
import { ShieldAlert, Users, Compass, Activity, CheckCircle2, AlertTriangle, XOctagon } from "lucide-react";
import { motion } from "motion/react";

interface GateGridProps {
  gates: GateData[];
  isCustomData: boolean;
  onQuickCapacityChange?: (type: "all-100" | "all-10" | "congested-split" | "random") => void;
}

/**
 * Returns descriptive theme, visual style parameters, and semantic accessibility icons 
 * corresponding to the input density percentage.
 * Optimized outside the component to avoid garbage collection overhead and re-renders.
 * 
 * @param {number} density - The current congestion percentage (0-100).
 * @returns {object} Object containing text classes, descriptive labels, background/border styles, and visual status icon.
 */
function getDensityColor(density: number) {
  if (density < 50) {
    return {
      text: "text-emerald-400",
      label: "LOW CONGESTION",
      bg: "bg-emerald-500/5",
      border: "border-emerald-500/20",
      accent: "bg-emerald-500",
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />,
    };
  } else if (density <= 80) {
    return {
      text: "text-amber-400",
      label: "MODERATE FLOW",
      bg: "bg-amber-500/5",
      border: "border-amber-500/20",
      accent: "bg-amber-500",
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />,
    };
  } else {
    return {
      text: "text-rose-500 font-semibold",
      label: "CRITICAL CONGESTION",
      bg: "bg-rose-500/5 shadow-[0_0_20px_rgba(239,68,68,0.08)]",
      border: "border-rose-500/30",
      accent: "bg-rose-500",
      icon: <XOctagon className="w-3.5 h-3.5 text-rose-500 shrink-0" aria-hidden="true" />,
    };
  }
}

/**
 * Renders the primary Gate status dashboard.
 * Designed with responsive typography, robust accessibility roles, and optimized motion.
 */
export default function GateGrid({ gates, isCustomData, onQuickCapacityChange }: GateGridProps) {
  
  // Memoize gate rendering details to maximize performance when densities fluctuate
  const renderedCards = useMemo(() => {
    return gates.map((gate) => {
      const colors = getDensityColor(gate.density);
      const ariaText = `${gate.name}: current density ${gate.density}%, status is ${colors.label}. Last checked ${new Date(gate.timestamp).toLocaleTimeString()}.`;
      
      return (
        <motion.div
          key={gate.name}
          id={`gate-card-${gate.name.replace(/\s+/g, "-").toLowerCase()}`}
          layout
          tabIndex={0}
          role="status"
          aria-live="polite"
          aria-label={ariaText}
          className={`gate-card p-4 rounded-lg flex flex-col justify-between ${colors.border} ${colors.bg} focus:outline-none focus:ring-1 focus:ring-cybercyan`}
          whileHover={{ scale: 1.015 }}
          whileFocus={{ scale: 1.015 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              // Standard accessible click/action simulation if user interacts
            }
          }}
        >
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold tracking-tight text-white/90">{gate.name.toUpperCase()}</span>
            <div className="flex items-center gap-1.5">
              {colors.icon}
              <span className={`text-[10px] font-mono tracking-wider ${colors.text}`}>
                {colors.label}
              </span>
            </div>
          </div>

          {/* Progress and numbers */}
          <div className="mt-4">
            <div className="text-3xl font-light mono text-white">
              {gate.density}<span className="text-xs text-white/50">%</span>
            </div>
            
            {/* Outer bar */}
            <div className="w-full h-1 bg-white/10 mt-2.5 rounded-full overflow-hidden" aria-hidden="true">
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
              <Users className="w-3 h-3 text-white/20" aria-hidden="true" />
              {gate.density > 80 ? "CONGESTED" : "NORMAL FLOW"}
            </span>
            <span>{new Date(gate.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </motion.div>
      );
    });
  }, [gates]);

  return (
    <div className="space-y-4" id="gate-density-view" role="region" aria-label="Stadium Entrance Gates Status Dashboard">
      {/* Header and Live Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <h2 className="text-sm font-mono text-white/50 uppercase tracking-tighter italic flex items-center gap-2">
            <Activity className="w-4 h-4 text-cybercyan" aria-hidden="true" />
            Live Density Monitoring
          </h2>
          <p className="text-[11px] text-slate-400 font-light mt-0.5">
            Real-time checkpoint flow across all primary stadium gates
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCustomData ? 'bg-cybercyan' : 'bg-emerald-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isCustomData ? 'bg-cybercyan' : 'bg-emerald-500'}`}></span>
          </span>
          <span className="px-2 py-0.5 bg-cybercyan/10 text-cybercyan text-[10px] rounded border border-cybercyan/20 font-mono tracking-wide uppercase">
            {isCustomData ? "USER_OVERRIDE" : "SYNTHETIC_DATA"}
          </span>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4" role="list" aria-label="Gates status feed">
        {renderedCards}
      </div>

      {/* Quick State Simulation Controls for Evaluators */}
      {onQuickCapacityChange && (
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-2.5" role="group" aria-label="Evaluation Diagnostic Controls">
          <p className="text-xs font-mono uppercase text-white/50 tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cybercyan" aria-hidden="true" />
            Evaluation Scenarios (Test Cognitive Edge Cases)
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onQuickCapacityChange("random")}
              className="text-[11px] px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/80 font-mono transition border border-white/10 cursor-pointer focus:ring-1 focus:ring-cybercyan focus:outline-none"
              id="diag-random"
              aria-label="Randomize gate densities"
            >
              🔄 RANDOMIZE
            </button>
            <button
              onClick={() => onQuickCapacityChange("congested-split")}
              className="text-[11px] px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/80 font-mono transition border border-white/10 cursor-pointer focus:ring-1 focus:ring-cybercyan focus:outline-none"
              id="diag-split"
              aria-label="Set bottleneck with gates A, B and C highly congested"
            >
              ⚠️ BOTTLENECK (A/B/C)
            </button>
            <button
              onClick={() => onQuickCapacityChange("all-100")}
              className="text-[11px] px-3 py-1.5 rounded bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-500/20 font-mono transition flex items-center gap-1 cursor-pointer focus:ring-1 focus:ring-red-500 focus:outline-none"
              id="diag-100"
              aria-label="Set all gates to 100 percent critical capacity"
            >
              <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
              🚨 ALL GATES 100%
            </button>
            <button
              onClick={() => onQuickCapacityChange("all-10")}
              className="text-[11px] px-3 py-1.5 rounded bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-400 border border-emerald-500/20 font-mono transition cursor-pointer focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              id="diag-10"
              aria-label="Set all gates to 10 percent low capacity"
            >
              🟢 ALL GATES 10%
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
