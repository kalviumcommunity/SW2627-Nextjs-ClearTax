"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Zap,
  Layers,
  ArrowRight,
  Code,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

export default function CallbacksSimulator() {
  const [activeMode, setActiveMode] = useState("syncVsAsync"); // "syncVsAsync" | "callbackHell" | "promisify"
  const [executionLog, setExecutionLog] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  // Sync vs Async Execution Simulator
  const runSyncVsAsyncDemo = () => {
    setIsRunning(true);
    setExecutionLog(["[1] Outer Function Execution Started (Sync Stack)"]);

    // Synchronous Callback (e.g., Array.prototype.forEach)
    setExecutionLog((prev) => [...prev, "[2] Executing Synchronous Callback Array.forEach(...)"]);
    [101, 102].forEach((id) => {
      setExecutionLog((prev) => [...prev, `    -> Sync Callback Executed for Invoice #${id}`]);
    });

    // Asynchronous Callback (Web API timer)
    setExecutionLog((prev) => [...prev, "[3] Offloading Asynchronous Callback to Web API (setTimeout 500ms)..."]);
    setTimeout(() => {
      setExecutionLog((prev) => [
        ...prev,
        "[5] Async Callback popped from Macrotask Queue to Call Stack -> Executed!",
      ]);
      setIsRunning(false);
    }, 500);

    setExecutionLog((prev) => [...prev, "[4] Outer Function Execution Completed (Sync Stack Empty)"]);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 bg-gradient-to-r from-stone-900 via-emerald-950 to-slate-900 rounded-3xl text-white shadow-xl border border-emerald-500/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              Callback Engine Simulator
            </div>
            <h2 className="text-2xl font-bold font-outfit text-white">Callbacks & Promisification</h2>
            <p className="text-stone-300 text-sm mt-1 max-w-xl">
              Understand the difference between <strong>Synchronous Callbacks</strong> vs <strong>Asynchronous Callbacks</strong>, inspect Callback Hell, and master Promisification.
            </p>
          </div>

          {/* Mode Picker */}
          <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveMode("syncVsAsync")}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeMode === "syncVsAsync" ? "bg-emerald-600 text-white shadow-md" : "text-stone-400 hover:text-white"
              }`}
            >
              Sync vs Async Callbacks
            </button>
            <button
              onClick={() => setActiveMode("callbackHell")}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeMode === "callbackHell" ? "bg-emerald-600 text-white shadow-md" : "text-stone-400 hover:text-white"
              }`}
            >
              Callback Hell vs Clean Code
            </button>
            <button
              onClick={() => setActiveMode("promisify")}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeMode === "promisify" ? "bg-emerald-600 text-white shadow-md" : "text-stone-400 hover:text-white"
              }`}
            >
              Promisify Wrapper Pattern
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: SYNC VS ASYNC CALLBACKS */}
      {activeMode === "syncVsAsync" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 bg-stone-900 rounded-3xl border border-stone-800 space-y-4">
              <h3 className="text-sm font-bold text-stone-200 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" /> Run Synchronous vs Async Test
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Not all callbacks are asynchronous! Higher-order array methods like <code>Array.prototype.map()</code> run synchronously on the call stack, while Web API callbacks run asynchronously via the task queue.
              </p>

              <button
                onClick={runSyncVsAsyncDemo}
                disabled={isRunning}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" /> Trigger Execution Test
              </button>

              <div className="pt-2">
                <div className="text-xs font-mono text-stone-400 mb-2">Live Timeline Log:</div>
                <div className="p-3 bg-black/60 rounded-2xl border border-stone-800 font-mono text-xs space-y-1 min-h-[160px] overflow-y-auto">
                  {executionLog.length === 0 ? (
                    <span className="text-stone-600 italic">Click trigger button above...</span>
                  ) : (
                    executionLog.map((log, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-emerald-300">
                        {log}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 bg-stone-900 rounded-3xl border border-stone-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-200">Execution Mechanism Breakdown</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-black/50 border border-stone-800 rounded-2xl">
                  <div className="text-xs font-bold text-indigo-400 font-mono mb-2 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" /> Synchronous Callback
                  </div>
                  <pre className="text-[11px] font-mono text-stone-300 bg-stone-900 p-2 rounded-xl mb-2">
{`[1, 2].forEach(item => {
  console.log(item);
});`}
                  </pre>
                  <p className="text-xs text-stone-400">
                    Blocks execution stack immediately. Finishes before outer function returns.
                  </p>
                </div>

                <div className="p-4 bg-black/50 border border-stone-800 rounded-2xl">
                  <div className="text-xs font-bold text-emerald-400 font-mono mb-2 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5" /> Asynchronous Callback
                  </div>
                  <pre className="text-[11px] font-mono text-stone-300 bg-stone-900 p-2 rounded-xl mb-2">
{`setTimeout(() => {
  console.log("Async Done");
}, 500);`}
                  </pre>
                  <p className="text-xs text-stone-400">
                    Offloaded to Web APIs / Task Queue. Outer function returns first; callback executes later.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl text-xs text-emerald-200">
                <strong>Interview Tip:</strong> When asked &quot;Are callbacks asynchronous?&quot;, clarify that callbacks are simply higher-order functions passed as arguments. The function executing them determines whether they run synchronously or asynchronously!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: CALLBACK HELL */}
      {activeMode === "callbackHell" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-stone-900 rounded-3xl border border-stone-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" /> Callback Hell (&quot;Pyramid of Doom&quot;)
            </div>
            <pre className="p-4 bg-black/70 rounded-2xl border border-rose-500/30 text-[11px] font-mono text-rose-200 leading-relaxed overflow-x-auto">
{`getUser(userId, (err, user) => {
  if (err) return handleError(err);
  getInvoices(user.id, (err, invoices) => {
    if (err) return handleError(err);
    processPayment(invoices[0], (err, receipt) => {
      if (err) return handleError(err);
      sendNotification(receipt, (err, status) => {
        // Deeply nested pyramid of callbacks
      });
    });
  });
});`}
            </pre>
            <p className="text-xs text-stone-400">
              Unmaintainable error-handling repetition, deep indentation, and tight coupling.
            </p>
          </div>

          <div className="p-6 bg-stone-900 rounded-3xl border border-stone-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Clean async/await Solution
            </div>
            <pre className="p-4 bg-black/70 rounded-2xl border border-emerald-500/30 text-[11px] font-mono text-emerald-200 leading-relaxed overflow-x-auto">
{`try {
  const user = await getUser(userId);
  const invoices = await getInvoices(user.id);
  const receipt = await processPayment(invoices[0]);
  const status = await sendNotification(receipt);
} catch (err) {
  handleError(err);
}`}
            </pre>
            <p className="text-xs text-stone-400">
              Flat linear reading flow, single centralized <code>try/catch</code> error handling block.
            </p>
          </div>
        </div>
      )}

      {/* MODE 3: PROMISIFY PATTERN */}
      {activeMode === "promisify" && (
        <div className="p-6 bg-stone-900 rounded-3xl border border-stone-800 space-y-4">
          <h3 className="text-sm font-bold text-stone-200 uppercase tracking-wider flex items-center gap-2">
            <Code className="w-4 h-4 text-emerald-400" /> Promisify Higher-Order Function Implementation
          </h3>
          <p className="text-xs text-stone-400">
            Node.js style error-first callbacks follow the signature <code>callback(err, data)</code>. Here is how to wrap any legacy callback function into a modern Promise-returning function:
          </p>

          <pre className="p-4 bg-black/70 rounded-2xl border border-stone-800 text-xs font-mono text-stone-200 leading-relaxed overflow-x-auto">
{`function promisify(legacyFn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      // Append Node error-first callback to arguments
      legacyFn.call(this, ...args, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };
}`}
          </pre>
        </div>
      )}
    </div>
  );
}
