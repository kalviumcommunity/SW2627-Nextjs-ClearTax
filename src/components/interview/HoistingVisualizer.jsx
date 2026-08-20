"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  AlertOctagon,
  CheckCircle,
  Play,
  RotateCcw,
  SkipForward,
  Cpu,
  ShieldAlert,
} from "lucide-react";

const HOISTING_PRESETS = [
  {
    id: "var-vs-let",
    title: "1. var vs let & Temporal Dead Zone (TDZ)",
    code: `console.log(a); // Output: undefined
var a = 10;

console.log(b); // Throws ReferenceError (TDZ!)
let b = 20;`,
    creationPhase: [
      { name: "a", type: "var", state: "initialized (undefined)", color: "amber" },
      { name: "b", type: "let", state: "UNINITIALIZED (TDZ Zone)", color: "rose" },
    ],
    executionSteps: [
      {
        line: 1,
        logs: ["a => undefined"],
        explanation: "'var a' was hoisted and initialized to undefined in Phase 1.",
        hasTDZError: false,
      },
      {
        line: 2,
        logs: ["a => undefined", "a assigned = 10"],
        explanation: "Execution line 2 assigns value 10 to variable 'a'.",
        hasTDZError: false,
      },
      {
        line: 4,
        logs: ["a => 10", "Uncaught ReferenceError: Cannot access 'b' before initialization"],
        explanation: "CRITICAL: 'b' is in the Temporal Dead Zone (TDZ). Engine throws ReferenceError!",
        hasTDZError: true,
      },
    ],
  },
  {
    id: "func-declaration-vs-expr",
    title: "2. Function Declaration vs Expression",
    code: `sayHello(); // Works! Output: "Hello World"
function sayHello() {
  return "Hello World";
}

sayBye(); // Throws TypeError: sayBye is not a function
var sayBye = function() {
  return "Goodbye";
};`,
    creationPhase: [
      { name: "sayHello", type: "function decl", state: "fully hoisted with body", color: "emerald" },
      { name: "sayBye", type: "var expr", state: "initialized to undefined", color: "amber" },
    ],
    executionSteps: [
      {
        line: 1,
        logs: ["sayHello() => 'Hello World'"],
        explanation: "Function declarations are fully hoisted with definition during Phase 1.",
        hasTDZError: false,
      },
      {
        line: 6,
        logs: ["sayHello() => 'Hello World'", "Uncaught TypeError: sayBye is not a function"],
        explanation: "'var sayBye' is hoisted as undefined. Calling undefined() throws TypeError!",
        hasTDZError: true,
      },
    ],
  },
];

export default function HoistingVisualizer() {
  const [selectedPresetId, setSelectedPresetId] = useState("var-vs-let");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const activePreset = HOISTING_PRESETS.find((p) => p.id === selectedPresetId) || HOISTING_PRESETS[0];
  const currentStep = activePreset.executionSteps[currentStepIndex];

  const handleSelectPreset = (id) => {
    setSelectedPresetId(id);
    setCurrentStepIndex(0);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-stone-900 via-rose-950 to-slate-900 rounded-3xl text-white shadow-xl border border-rose-500/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              <Cpu className="w-3.5 h-3.5 text-rose-400" />
              Creation vs Execution Phase Visualizer
            </div>
            <h2 className="text-2xl font-bold font-outfit text-white">JavaScript Hoisting & TDZ Lifecycle</h2>
            <p className="text-stone-300 text-sm mt-1 max-w-xl">
              Simulate how JavaScript engines scan memory during <strong>Phase 1 (Creation)</strong> vs <strong>Phase 2 (Execution)</strong>.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10">
            {HOISTING_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                  selectedPresetId === p.id ? "bg-rose-600 text-white shadow-md" : "text-stone-400 hover:text-white"
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Visualizer Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Code Snippet & Phase 1 Memory Environment */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Phase 1: Creation Phase Memory Visualizer */}
          <div className="p-6 bg-stone-900 rounded-3xl border border-stone-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-400" /> Phase 1: Memory Creation Phase Allocation
              </h3>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-mono">Pre-execution Scan</span>
            </div>

            <div className="space-y-2">
              {activePreset.creationPhase.map((varItem, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-2xl border flex items-center justify-between font-mono text-xs ${
                    varItem.color === "rose"
                      ? "bg-rose-950/40 border-rose-500/40 text-rose-200"
                      : varItem.color === "amber"
                      ? "bg-amber-950/40 border-amber-500/40 text-amber-200"
                      : "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 font-semibold">{varItem.type}</span>
                    <span className="font-bold">{varItem.name}</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-lg bg-black/40 border border-white/10">
                    {varItem.state}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Code Viewer */}
          <div className="p-5 bg-black rounded-3xl border border-stone-800 space-y-3 font-mono text-xs">
            <div className="text-stone-400 text-[11px] pb-2 border-b border-stone-800">Source Code:</div>
            <pre className="text-stone-300 whitespace-pre-wrap leading-relaxed">{activePreset.code}</pre>
          </div>

        </div>

        {/* Right: Phase 2 Execution Step Simulator */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 bg-stone-900 rounded-3xl border border-stone-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200">
                Phase 2: Execution Phase Step {currentStepIndex + 1} of {activePreset.executionSteps.length}
              </h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStepIndex(0)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-stone-300 text-xs rounded-xl transition-all flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
                <button
                  onClick={() => setCurrentStepIndex(Math.min(currentStepIndex + 1, activePreset.executionSteps.length - 1))}
                  disabled={currentStepIndex >= activePreset.executionSteps.length - 1}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1"
                >
                  <SkipForward className="w-3.5 h-3.5" /> Next Line
                </button>
              </div>
            </div>

            {/* Explanation box */}
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
              currentStep.hasTDZError
                ? "bg-rose-950/60 border-rose-500 text-rose-100"
                : "bg-indigo-950/40 border-indigo-500/30 text-indigo-100"
            }`}>
              <div className="font-bold mb-1 flex items-center gap-2">
                {currentStep.hasTDZError ? <ShieldAlert className="w-4 h-4 text-rose-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
                Execution Line {currentStep.line}
              </div>
              <p>{currentStep.explanation}</p>
            </div>

            {/* Logs Window */}
            <div>
              <div className="text-xs font-mono text-stone-400 mb-2">Step Output Stream:</div>
              <div className="p-4 bg-black/80 rounded-2xl border border-stone-800 font-mono text-xs space-y-2 min-h-[140px]">
                {currentStep.logs.map((log, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={log.includes("Error") || log.includes("TypeError") ? "text-rose-400 font-bold" : "text-emerald-400"}
                  >
                    &gt; {log}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Key takeaway */}
            <div className="p-4 bg-rose-950/20 border border-rose-500/20 rounded-2xl text-xs text-rose-200">
              <strong>Temporal Dead Zone (TDZ):</strong> The TDZ is the period between entering scope (Phase 1 allocation) and the actual line of declaration (Phase 2 evaluation). Accessing a <code>let</code> or <code>const</code> variable during TDZ causes a <code>ReferenceError</code>.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
