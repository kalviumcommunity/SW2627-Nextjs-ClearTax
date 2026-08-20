"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Cpu,
  Layers,
  Clock,
  Zap,
  Terminal,
  Info,
  CheckCircle2,
} from "lucide-react";

const SNIPPETS = [
  {
    id: "classic",
    title: "1. Classic Interview Puzzle",
    description: "Demonstrates Sync Stack vs Microtask (Promise) vs Macrotask (setTimeout).",
    code: `console.log("1: Start Sync");

setTimeout(() => {
  console.log("2: Macrotask (setTimeout)");
}, 0);

Promise.resolve().then(() => {
  console.log("3: Microtask (Promise.then)");
});

console.log("4: End Sync");`,
    steps: [
      {
        stepIndex: 1,
        line: 1,
        stack: ['console.log("1: Start Sync")'],
        webApi: [],
        microtasks: [],
        macrotasks: [],
        logs: ['1: Start Sync'],
        explanation: 'Synchronous statement executes immediately on Call Stack.',
        activeComponent: 'stack'
      },
      {
        stepIndex: 2,
        line: 3,
        stack: ['setTimeout(cb, 0)'],
        webApi: [],
        microtasks: [],
        macrotasks: [],
        logs: ['1: Start Sync'],
        explanation: 'setTimeout is invoked. Call Stack registers timer with Web APIs.',
        activeComponent: 'stack'
      },
      {
        stepIndex: 3,
        line: 3,
        stack: [],
        webApi: ['Timer (0ms) -> Callback #1'],
        microtasks: [],
        macrotasks: [],
        logs: ['1: Start Sync'],
        explanation: 'Web API handles timer. Timer expires immediately (0ms) and moves callback to Macrotask Queue.',
        activeComponent: 'webApi'
      },
      {
        stepIndex: 4,
        line: 3,
        stack: [],
        webApi: [],
        microtasks: [],
        macrotasks: ['Callback #1 (log 2)'],
        logs: ['1: Start Sync'],
        explanation: 'Callback #1 is queued inside Macrotask Queue.',
        activeComponent: 'macrotasks'
      },
      {
        stepIndex: 5,
        line: 7,
        stack: ['Promise.resolve().then(...)'],
        webApi: [],
        microtasks: [],
        macrotasks: ['Callback #1 (log 2)'],
        logs: ['1: Start Sync'],
        explanation: 'Promise resolves immediately. Its .then() callback is scheduled into Microtask Queue.',
        activeComponent: 'stack'
      },
      {
        stepIndex: 6,
        line: 7,
        stack: [],
        webApi: [],
        microtasks: ['Promise Callback #2 (log 3)'],
        macrotasks: ['Callback #1 (log 2)'],
        logs: ['1: Start Sync'],
        explanation: 'Microtask is ready in Microtask Queue.',
        activeComponent: 'microtasks'
      },
      {
        stepIndex: 7,
        line: 11,
        stack: ['console.log("4: End Sync")'],
        webApi: [],
        microtasks: ['Promise Callback #2 (log 3)'],
        macrotasks: ['Callback #1 (log 2)'],
        logs: ['1: Start Sync', '4: End Sync'],
        explanation: 'Synchronous statement executes on Call Stack.',
        activeComponent: 'stack'
      },
      {
        stepIndex: 8,
        line: null,
        stack: [],
        webApi: [],
        microtasks: ['Promise Callback #2 (log 3)'],
        macrotasks: ['Callback #1 (log 2)'],
        logs: ['1: Start Sync', '4: End Sync'],
        explanation: 'Call Stack is empty! Event Loop checks Microtask Queue FIRST before Macrotask Queue.',
        activeComponent: 'eventLoop'
      },
      {
        stepIndex: 9,
        line: 8,
        stack: ['console.log("3: Microtask")'],
        webApi: [],
        microtasks: [],
        macrotasks: ['Callback #1 (log 2)'],
        logs: ['1: Start Sync', '4: End Sync', '3: Microtask (Promise.then)'],
        explanation: 'Microtask popped from queue to Call Stack and executed.',
        activeComponent: 'stack'
      },
      {
        stepIndex: 10,
        line: null,
        stack: [],
        webApi: [],
        microtasks: [],
        macrotasks: ['Callback #1 (log 2)'],
        logs: ['1: Start Sync', '4: End Sync', '3: Microtask (Promise.then)'],
        explanation: 'Microtask Queue is now empty. Event Loop moves next to Macrotask Queue.',
        activeComponent: 'eventLoop'
      },
      {
        stepIndex: 11,
        line: 4,
        stack: ['console.log("2: Macrotask")'],
        webApi: [],
        microtasks: [],
        macrotasks: [],
        logs: ['1: Start Sync', '4: End Sync', '3: Microtask (Promise.then)', '2: Macrotask (setTimeout)'],
        explanation: 'Macrotask popped from Task Queue to Call Stack and executed. Execution complete!',
        activeComponent: 'stack'
      }
    ]
  },
  {
    id: "nested-microtasks",
    title: "2. Microtask Priority Chaining",
    description: "Microtasks drain completely before any Macrotask can execute.",
    code: `console.log("A: Start");

setTimeout(() => console.log("B: Timeout"), 0);

Promise.resolve()
  .then(() => {
    console.log("C: Microtask 1");
    return Promise.resolve();
  })
  .then(() => {
    console.log("D: Microtask 2 (Chained)");
  });

console.log("E: End");`,
    steps: [
      {
        stepIndex: 1,
        line: 1,
        stack: ['console.log("A: Start")'],
        webApi: [],
        microtasks: [],
        macrotasks: [],
        logs: ['A: Start'],
        explanation: 'Sync Stack executes line 1.',
        activeComponent: 'stack'
      },
      {
        stepIndex: 2,
        line: 3,
        stack: ['setTimeout(cb, 0)'],
        webApi: [],
        microtasks: [],
        macrotasks: ['Callback B (Timeout)'],
        logs: ['A: Start'],
        explanation: 'setTimeout registers timer, callback moves to Macrotask Queue.',
        activeComponent: 'macrotasks'
      },
      {
        stepIndex: 3,
        line: 5,
        stack: ['Promise.resolve().then(...)'],
        webApi: [],
        microtasks: ['Microtask C'],
        macrotasks: ['Callback B (Timeout)'],
        logs: ['A: Start'],
        explanation: 'First Promise .then() callback is scheduled into Microtask Queue.',
        activeComponent: 'microtasks'
      },
      {
        stepIndex: 4,
        line: 13,
        stack: ['console.log("E: End")'],
        webApi: [],
        microtasks: ['Microtask C'],
        macrotasks: ['Callback B (Timeout)'],
        logs: ['A: Start', 'E: End'],
        explanation: 'Sync Stack finishes line 13.',
        activeComponent: 'stack'
      },
      {
        stepIndex: 5,
        line: 7,
        stack: ['console.log("C: Microtask 1")'],
        webApi: [],
        microtasks: [],
        macrotasks: ['Callback B (Timeout)'],
        logs: ['A: Start', 'E: End', 'C: Microtask 1'],
        explanation: 'Event Loop pulls Microtask C to stack. Returning Promise schedules Microtask D!',
        activeComponent: 'stack'
      },
      {
        stepIndex: 6,
        line: 10,
        stack: ['console.log("D: Microtask 2 (Chained)")'],
        webApi: [],
        microtasks: [],
        macrotasks: ['Callback B (Timeout)'],
        logs: ['A: Start', 'E: End', 'C: Microtask 1', 'D: Microtask 2 (Chained)'],
        explanation: 'Microtask Queue must be FULLY drained before Macrotask B can run!',
        activeComponent: 'microtasks'
      },
      {
        stepIndex: 7,
        line: 3,
        stack: ['console.log("B: Timeout")'],
        webApi: [],
        microtasks: [],
        macrotasks: [],
        logs: ['A: Start', 'E: End', 'C: Microtask 1', 'D: Microtask 2 (Chained)', 'B: Timeout'],
        explanation: 'Macrotask B finally executes after all microtasks are drained.',
        activeComponent: 'macrotasks'
      }
    ]
  }
];

export default function EventLoopVisualizer() {
  const [selectedSnippetId, setSelectedSnippetId] = useState("classic");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(1500);

  const activeSnippet = SNIPPETS.find((s) => s.id === selectedSnippetId) || SNIPPETS[0];
  const currentStep = activeSnippet.steps[currentStepIndex];

  const timerRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < activeSnippet.steps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, speedMs);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, speedMs, activeSnippet]);

  const handleSelectSnippet = (id) => {
    setIsPlaying(false);
    setSelectedSnippetId(id);
    setCurrentStepIndex(0);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const handleNextStep = () => {
    if (currentStepIndex < activeSnippet.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 bg-gradient-to-r from-stone-900 via-indigo-950 to-slate-900 rounded-3xl text-white shadow-xl border border-indigo-500/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              Runtime Visual Engine
            </div>
            <h2 className="text-2xl font-bold font-outfit text-white">Event Loop & Execution Visualizer</h2>
            <p className="text-stone-300 text-sm mt-1 max-w-xl">
              Watch how V8 handles the <strong>Call Stack</strong>, <strong>Web APIs</strong>, <strong>Microtask Queue</strong>, and <strong>Macrotask Queue</strong> in real time.
            </p>
          </div>

          {/* Snippet Picker */}
          <div className="flex flex-wrap gap-2">
            {SNIPPETS.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectSnippet(s.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-2xl transition-all duration-200 ${
                  selectedSnippetId === s.id
                    ? "bg-[#5a38ef] text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-300/40"
                    : "bg-white/10 hover:bg-white/20 text-stone-200"
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-2 px-4 py-2 bg-[#5a38ef] hover:bg-[#4727d8] text-white text-xs font-semibold rounded-xl transition-all shadow-md"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? "Pause Engine" : "Play Execution"}
            </button>
            <button
              onClick={handleNextStep}
              disabled={currentStepIndex >= activeSnippet.steps.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-stone-200 text-xs font-semibold rounded-xl transition-all"
            >
              <SkipForward className="w-4 h-4" /> Step Forward
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-semibold rounded-xl transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-400">Step {currentStepIndex + 1} of {activeSnippet.steps.length}</span>
            <div className="flex items-center gap-1 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 text-xs text-stone-300">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Speed:</span>
              <select
                value={speedMs}
                onChange={(e) => setSpeedMs(Number(e.target.value))}
                className="bg-transparent text-indigo-300 text-xs outline-none font-mono cursor-pointer"
              >
                <option value={2000} className="bg-slate-900 text-stone-200">Slow (2s)</option>
                <option value={1200} className="bg-slate-900 text-stone-200">Normal (1.2s)</option>
                <option value={600} className="bg-slate-900 text-stone-200">Fast (0.6s)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Code Editor on Left, Runtime Architecture on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Code Snippet Viewer */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="p-5 bg-stone-900 rounded-3xl border border-stone-800 shadow-lg text-stone-100 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-800">
                <span className="text-xs font-mono text-stone-400 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" /> code-snippet.js
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">V8 Engine Context</span>
              </div>
              
              <div className="font-mono text-xs leading-relaxed overflow-x-auto p-3 bg-black/50 rounded-2xl border border-stone-800">
                {activeSnippet.code.split("\n").map((lineText, idx) => {
                  const lineNum = idx + 1;
                  const isHighlighted = currentStep.line === lineNum;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center py-1 px-2 rounded-lg transition-colors ${
                        isHighlighted ? "bg-indigo-500/30 text-indigo-200 font-bold border-l-4 border-[#5a38ef]" : "text-stone-300"
                      }`}
                    >
                      <span className="w-8 text-stone-600 select-none text-[11px] font-mono">{lineNum}</span>
                      <span>{lineText}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation Note */}
            <div className="mt-4 p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-indigo-200 mb-1">Step {currentStep.stepIndex} Explanation</h4>
                <p className="text-xs text-indigo-100/80 leading-normal">{currentStep.explanation}</p>
              </div>
            </div>
          </div>

          {/* Console Log Output */}
          <div className="p-4 bg-black rounded-3xl border border-stone-800 shadow-md">
            <div className="flex items-center gap-2 text-xs font-mono text-stone-400 pb-2 mb-2 border-b border-stone-800">
              <Terminal className="w-3.5 h-3.5 text-stone-400" /> Terminal Console Output
            </div>
            <div className="font-mono text-xs space-y-1 min-h-[90px] max-h-[140px] overflow-y-auto">
              {currentStep.logs.length === 0 ? (
                <span className="text-stone-600 italic">[Waiting for execution...]</span>
              ) : (
                currentStep.logs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-emerald-400"
                  >
                    <span className="text-stone-600">&gt;</span>
                    <span>{log}</span>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Event Loop Components (Call Stack, Web API, Microtask Queue, Macrotask Queue) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. CALL STACK */}
            <div className={`p-5 rounded-3xl border transition-all duration-300 bg-stone-900 ${
              currentStep.activeComponent === 'stack' ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500' : 'border-stone-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200">Call Stack</h3>
                </div>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono">LIFO (Sync)</span>
              </div>
              
              <div className="min-h-[130px] flex flex-col-reverse justify-start gap-2 p-3 bg-black/60 rounded-2xl border border-stone-800">
                <AnimatePresence>
                  {currentStep.stack.length === 0 ? (
                    <div className="text-center text-xs text-stone-600 italic py-8">
                      Stack Empty (Idle)
                    </div>
                  ) : (
                    currentStep.stack.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-mono text-xs rounded-xl shadow-md border border-indigo-400/30 flex items-center justify-between"
                      >
                        <span className="truncate">{item}</span>
                        <span className="text-[9px] bg-black/30 px-1.5 py-0.5 rounded text-indigo-200">Frame {idx + 1}</span>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* 2. WEB APIS */}
            <div className={`p-5 rounded-3xl border transition-all duration-300 bg-stone-900 ${
              currentStep.activeComponent === 'webApi' ? 'border-amber-500 shadow-lg shadow-amber-500/20 ring-1 ring-amber-500' : 'border-stone-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200">Web APIs</h3>
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">Async Drivers</span>
              </div>

              <div className="min-h-[130px] flex flex-col justify-start gap-2 p-3 bg-black/60 rounded-2xl border border-stone-800">
                <AnimatePresence>
                  {currentStep.webApi.length === 0 ? (
                    <div className="text-center text-xs text-stone-600 italic py-8">
                      No Active Web API Timers
                    </div>
                  ) : (
                    currentStep.webApi.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="px-3 py-2 bg-amber-950/60 border border-amber-500/40 text-amber-200 font-mono text-xs rounded-xl flex items-center gap-2"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{item}</span>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 3. MICROTASK QUEUE (High Priority) */}
            <div className={`p-5 rounded-3xl border transition-all duration-300 bg-stone-900 ${
              currentStep.activeComponent === 'microtasks' ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500' : 'border-stone-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200">Microtask Queue</h3>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">Priority #1 (Promises)</span>
              </div>

              <div className="min-h-[130px] flex flex-col justify-start gap-2 p-3 bg-black/60 rounded-2xl border border-stone-800">
                <AnimatePresence>
                  {currentStep.microtasks.length === 0 ? (
                    <div className="text-center text-xs text-stone-600 italic py-8">
                      Microtask Queue Empty
                    </div>
                  ) : (
                    currentStep.microtasks.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="px-3 py-2 bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 font-mono text-xs rounded-xl flex items-center justify-between"
                      >
                        <span className="truncate">{item}</span>
                        <span className="text-[9px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">High</span>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* 4. MACROTASK QUEUE (Task Queue) */}
            <div className={`p-5 rounded-3xl border transition-all duration-300 bg-stone-900 ${
              currentStep.activeComponent === 'macrotasks' ? 'border-sky-500 shadow-lg shadow-sky-500/20 ring-1 ring-sky-500' : 'border-stone-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200">Macrotask Queue</h3>
                </div>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-mono">Priority #2 (setTimeout)</span>
              </div>

              <div className="min-h-[130px] flex flex-col justify-start gap-2 p-3 bg-black/60 rounded-2xl border border-stone-800">
                <AnimatePresence>
                  {currentStep.macrotasks.length === 0 ? (
                    <div className="text-center text-xs text-stone-600 italic py-8">
                      Macrotask Queue Empty
                    </div>
                  ) : (
                    currentStep.macrotasks.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="px-3 py-2 bg-sky-950/70 border border-sky-500/40 text-sky-200 font-mono text-xs rounded-xl flex items-center justify-between"
                      >
                        <span className="truncate">{item}</span>
                        <span className="text-[9px] bg-sky-500/20 px-1.5 py-0.5 rounded text-sky-300">Normal</span>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>

          {/* Event Loop Ticker Indicator */}
          <div className="p-4 bg-gradient-to-r from-stone-900 via-indigo-950/60 to-stone-900 border border-indigo-500/30 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                currentStep.activeComponent === 'eventLoop' ? 'bg-amber-400 animate-ping' : 'bg-emerald-500 animate-pulse'
              }`} />
              <span className="text-xs font-semibold text-stone-200 font-outfit">
                Event Loop Ticker Status:
              </span>
              <span className="text-xs font-mono text-indigo-300">
                {currentStep.activeComponent === 'eventLoop'
                  ? "Checking Queues -> Stack Empty"
                  : currentStep.stack.length > 0
                  ? "Executing Synchronous Stack"
                  : "Processing Queues"}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-stone-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Microtask Queue always takes precedent!
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
