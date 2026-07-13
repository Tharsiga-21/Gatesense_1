/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from "react";
import { parseCrowdCSV, parseCrowdJSON } from "../utils/parser";
import { GateData } from "../types";
import { FileUp, Copy, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

interface UploadPanelProps {
  onDataParsed: (data: GateData[]) => void;
  onReset: () => void;
  isCustomData: boolean;
}

export default function UploadPanel({ onDataParsed, onReset, isCustomData }: UploadPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleCSV = `gate,density,timestamp
Gate A,95,2026-07-12T08:00:00Z
Gate B,88,2026-07-12T08:00:00Z
Gate C,25,2026-07-12T08:00:00Z
Gate D,30,2026-07-12T08:00:00Z
Gate E,100,2026-07-12T08:00:00Z
Gate F,15,2026-07-12T08:00:00Z`;

  const sampleJSON = `[
  { "gate": "Gate A", "density": 10 },
  { "gate": "Gate B", "density": 100 },
  { "gate": "Gate C", "density": 95 },
  { "gate": "Gate D", "density": 100 },
  { "gate": "Gate E", "density": 100 },
  { "gate": "Gate F", "density": 100 }
]`;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        setError(null);
        setSuccess(false);

        let parsed: GateData[];
        if (file.name.endsWith(".json")) {
          parsed = parseCrowdJSON(text);
        } else if (file.name.endsWith(".csv")) {
          parsed = parseCrowdCSV(text);
        } else {
          // Attempt to sniff
          if (text.trim().startsWith("[")) {
            parsed = parseCrowdJSON(text);
          } else {
            parsed = parseCrowdCSV(text);
          }
        }

        onDataParsed(parsed);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setError(errMsg || "Failed to parse crowd file.");
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSample = (type: "csv" | "json") => {
    try {
      setError(null);
      setSuccess(false);
      const text = type === "csv" ? sampleCSV : sampleJSON;
      const parsed = type === "csv" ? parseCrowdCSV(text) : parseCrowdJSON(text);
      onDataParsed(parsed);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Failed to load sample data.");
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-5 space-y-4" id="upload-panel" role="region" aria-label="Crowd Data Injector">
      <div>
        <h3 className="text-xs font-mono uppercase text-white/70 tracking-wider flex items-center gap-2">
          <FileUp className="w-3.5 h-3.5 text-cybercyan" />
          Crowd Data Injector (CSV / JSON)
        </h3>
        <p className="text-[11px] text-slate-200 font-light mt-1">
          Upload custom gate sensor data to override simulated live feed. Gate letter extraction and bounds are validated.
        </p>
      </div>

      {/* Drag & Drop simulated area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="Upload CSV or JSON crowd sensor data override file"
        className="border border-dashed border-white/20 hover:border-cybercyan/50 bg-black/30 rounded-lg p-5 text-center cursor-pointer hover:bg-white/5 focus:bg-white/5 transition duration-150 focus:outline-none focus:ring-1 focus:ring-cybercyan"
      >
        <FileUp className="w-7 h-7 text-white/60 mx-auto mb-2" />
        <span className="text-xs text-slate-200 font-medium block font-mono">
          CLICK TO UPLOAD <span className="text-cybercyan">.CSV</span> OR <span className="text-cybercyan">.JSON</span>
        </span>
        <span className="text-[10px] text-white/60 block mt-1">
          Must define gate letters A-F and densities 0-100
        </span>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,.json"
          className="hidden"
          id="crowd-file-input"
        />
      </div>

      {/* Validation Status & Reset */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        {isCustomData ? (
          <div className="flex items-center gap-1.5 text-cybercyan font-medium font-mono text-[11px]">
            <CheckCircle className="w-3.5 h-3.5 text-cybercyan" />
            SENSOR OVERRIDE ACTIVE
            <button
              onClick={onReset}
              className="ml-2 text-[10px] bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded font-mono flex items-center gap-1 transition cursor-pointer"
              id="reset-sensor-simulation"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              RESET FEED
            </button>
          </div>
        ) : (
          <span className="text-[10px] text-white/60 font-mono uppercase">Status: Awaiting override file</span>
        )}
      </div>

      {/* Quick Sample Load Buttons */}
      <div className="p-3.5 bg-black/30 rounded-lg border border-white/5 space-y-2">
        <span className="text-[10px] font-mono text-white/70 block uppercase tracking-wider">
          Demo Mock Presets (Parser validation test)
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleLoadSample("csv")}
            className="flex items-center justify-center gap-1.5 text-xs text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 p-2 rounded transition-colors font-mono cursor-pointer"
            id="load-preset-csv"
          >
            <Copy className="w-3 h-3 text-emerald-400" />
            SAMPLE_CSV
          </button>
          <button
            onClick={() => handleLoadSample("json")}
            className="flex items-center justify-center gap-1.5 text-xs text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 p-2 rounded transition-colors font-mono cursor-pointer"
            id="load-preset-json"
          >
            <Copy className="w-3 h-3 text-cybercyan" />
            SAMPLE_JSON
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-red-500/5 border border-red-500/20 text-red-400 rounded-lg flex items-start gap-2 text-xs" id="upload-error-alert">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-mono uppercase text-[11px] text-red-400 font-bold block">Validator Rejected Input</span>
            <p className="text-slate-400 leading-normal">{error}</p>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center gap-2 text-xs" id="upload-success-alert">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-mono text-[11px]">PARSER VALIDATION PASSED. FEEDS UPDATED.</span>
        </div>
      )}
    </div>
  );
}
