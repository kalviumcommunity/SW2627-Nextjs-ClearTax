"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Play,
  RotateCcw,
  Zap,
  Split,
  Code2,
} from "lucide-react";

export default function PromisesLab() {
  const [promiseState, setPromiseState] = useState("pending"); // "pending" | "fulfilled" | "rejected"
  const [resultValue, setResultValue] = useState(null);
  const [chainLogs, setChainLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("state"); // "state" | "concurrency" | "asyncawait"

  // Concurrency demo state
  const [concurrencyResults, setConcurrencyResults] = useState(null);
  const [isConcurrencyRunning, setIsConcurrencyRunning] = useState(false);

  const handleCreatePromise = (shouldResolve, delayMs = 1500) => {
    setPromiseState("pending");
    setResultValue(null);
    setChainLogs(["[1] Promise created in PENDING state."]);

    const p = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (shouldResolve) {
          resolve("Invoice #1094 Processed Successfully!");
        } else {
          reject(new Error("Network Error: 504 Gateway Timeout"));
        }
      }, delayMs);
    });

    p.then((val) => {
      setPromiseState("fulfilled");
      setResultValue(val);
      setChainLogs((prev) => [
        ...prev,
        `[2] .then(val => ...): Promise FULFILLED! Payload: "${val}"`,
        `[3] .finally(): Cleanup operations completed.`,
      ]);
    }).catch((err) => {
      setPromiseState("rejected");
      setResultValue(err.message);
      setChainLogs((prev) => [
        ...prev,
        `[2] .catch(err => ...): Promise REJECTED! Error: "${err.message}"`,
        `[3] .finally(): Error handled gracefully.`,
      ]);
    });
  };

  const runConcurrencyDemo = async (mode) => {
    setIsConcurrencyRunning(true);
    setConcurrencyResults(null);

    const taskA = new Promise((res) => setTimeout(() => res("API A: 200 OK (200ms)"), 200));
    const taskB = new Promise((res) => setTimeout(() => res("API B: 200 OK (500ms)"), 500));
    const taskC = new Promise((_, rej) => setTimeout(() => rej(new Error("API C: 500 Error (300ms)")), 300));

    try {
      if (mode === "all") {
        // Will reject because taskC fails
        await Promise.all([taskA, taskB, taskC]);
      } else if (mode === "race") {
        // Will resolve taskA first
        const winner = await Promise.race([taskA, taskB, taskC]);
        setConcurrencyResults({ mode: "Promise.race", status: "fulfilled", winner });
      } else if (mode === "allSettled") {
        const results = await Promise.allSettled([taskA, taskB, taskC]);
        setConcurrencyResults({ mode: "Promise.allSettled", status: "fulfilled", results });
      }
    } catch (err) {
      setConcurrencyResults({ mode: `Promise.${mode}`, status: "rejected", error: err.message });
    } finally {
      setIsConcurrencyRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-stone-900 via-purple-950 to-slate-900 rounded-3xl text-white shadow-xl border border-purple-500/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Async State Engine
            </div>
            <h2 className="text-2xl font-bold font-outfit text-white">Promises & Async/Await Playground</h2>
            <p className="text-stone-300 text-sm mt-1 max-w-xl">
              Inspect Promise state transitions (Pending → Fulfilled/Rejected), chain handlers, and compare <code>Promise.all</code> vs <code>Promise.race</code>.
            </p>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab("state")}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === "state" ? "bg-purple-600 text-white shadow-md" : "text-stone-400 hover:text-white"
              }`}
            >
              State Machine
            </button>
            <button
              onClick={() => setActiveTab("concurrency")}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === "concurrency" ? "bg-purple-600 text-white shadow-md" : "text-stone-400 hover:text-white"
              }`}
            >
              Concurrency Combinators
            </button>
            <button
              onClick={() => setActiveTab("asyncawait")}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === "asyncawait" ? "bg-purple-600 text-white shadow-md" : "text-stone-400 hover:text-white"
              }`}
            >
              Async/Await vs Promises
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: PROMISE STATE MACHINE */}
      {activeTab === "state" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Controls */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 bg-stone-900 rounded-3xl border border-stone-800 space-y-5">
              <h3 className="text-sm font-bold text-stone-200 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" /> Trigger Promise Outcome
              </h3>
              <p className="text-xs text-stone-400">
                Click below to simulate an asynchronous network request and observe state transitions in real time.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleCreatePromise(true, 1500)}
                  disabled={promiseState === "pending"}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-2xl shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <CheckCircle className="w-4 h-4" /> Simulate Fulfill (Resolve 1.5s)
                </button>
                <button
                  onClick={() => handleCreatePromise(false, 1500)}
                  disabled={promiseState === "pending"}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-xs rounded-2xl shadow-lg shadow-rose-600/20 transition-all"
                >
                  <XCircle className="w-4 h-4" /> Simulate Reject (Error 1.5s)
                </button>
              </div>

              <div className="pt-4 border-t border-stone-800">
                <div className="text-xs font-mono text-stone-400 mb-2">Chaining Lifecycle Log:</div>
                <div className="p-3 bg-black/60 rounded-2xl border border-stone-800 font-mono text-xs space-y-1.5 min-h-[100px]">
                  {chainLogs.length === 0 ? (
                    <span className="text-stone-600 italic">Click a button above to start...</span>
                  ) : (
                    chainLogs.map((log, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-purple-300">
                        {log}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right State Inspector Card */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 bg-stone-900 rounded-3xl border border-stone-800 min-h-[350px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-stone-800">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-200">Internal Promise State Inspector</h3>
                  <span className="text-xs font-mono text-stone-400">[[PromiseState]]</span>
                </div>

                {/* State Badge Visualizer */}
                <div className="grid grid-cols-3 gap-3 my-6">
                  {/* PENDING */}
                  <div className={`p-4 rounded-2xl border text-center transition-all ${
                    promiseState === "pending"
                      ? "bg-amber-950/60 border-amber-500 shadow-lg shadow-amber-500/20 ring-1 ring-amber-500 text-amber-200"
                      : "bg-black/30 border-stone-800 text-stone-600 opacity-60"
                  }`}>
                    <Clock className={`w-6 h-6 mx-auto mb-2 ${promiseState === "pending" ? "animate-spin text-amber-400" : ""}`} />
                    <div className="text-xs font-bold font-mono">PENDING</div>
                    <div className="text-[10px] mt-1 text-stone-400">Initial State</div>
                  </div>

                  {/* FULFILLED */}
                  <div className={`p-4 rounded-2xl border text-center transition-all ${
                    promiseState === "fulfilled"
                      ? "bg-emerald-950/60 border-emerald-500 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500 text-emerald-200"
                      : "bg-black/30 border-stone-800 text-stone-600 opacity-60"
                  }`}>
                    <CheckCircle className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
                    <div className="text-xs font-bold font-mono">FULFILLED</div>
                    <div className="text-[10px] mt-1 text-stone-400">Resolved Payload</div>
                  </div>

                  {/* REJECTED */}
                  <div className={`p-4 rounded-2xl border text-center transition-all ${
                    promiseState === "rejected"
                      ? "bg-rose-950/60 border-rose-500 shadow-lg shadow-rose-500/20 ring-1 ring-rose-500 text-rose-200"
                      : "bg-black/30 border-stone-800 text-stone-600 opacity-60"
                  }`}>
                    <XCircle className="w-6 h-6 mx-auto mb-2 text-rose-400" />
                    <div className="text-xs font-bold font-mono">REJECTED</div>
                    <div className="text-[10px] mt-1 text-stone-400">Error Exception</div>
                  </div>
                </div>

                {/* [[PromiseResult]] Payload Box */}
                <div className="p-4 bg-black/70 rounded-2xl border border-stone-800 font-mono text-xs">
                  <div className="text-stone-500 mb-1 text-[11px]">[[PromiseResult]] payload:</div>
                  <div className="text-stone-200 font-bold">
                    {promiseState === "pending" && <span className="text-amber-400 animate-pulse">undefined (Waiting for resolution...)</span>}
                    {promiseState === "fulfilled" && <span className="text-emerald-400">&quot;{resultValue}&quot;</span>}
                    {promiseState === "rejected" && <span className="text-rose-400">{resultValue}</span>}
                  </div>
                </div>
              </div>

              {/* Guarantees Box */}
              <div className="p-4 bg-purple-950/30 border border-purple-500/20 rounded-2xl text-xs text-purple-200">
                <strong>Interview Key Point:</strong> A Promise is <em>immutable</em> once settled. Once it transitions from <code>pending</code> to <code>fulfilled</code> or <code>rejected</code>, its state and payload can NEVER change again.
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: CONCURRENCY COMBINATORS */}
      {activeTab === "concurrency" && (
        <div className="space-y-6">
          <div className="p-6 bg-stone-900 rounded-3xl border border-stone-800">
            <h3 className="text-sm font-bold text-stone-200 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Split className="w-4 h-4 text-purple-400" /> Promise Concurrency Methods Comparison
            </h3>
            <p className="text-xs text-stone-400 mb-6">
              Simulate 3 concurrent API calls (Task A: 200ms success, Task B: 500ms success, Task C: 300ms error).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => runConcurrencyDemo("all")}
                disabled={isConcurrencyRunning}
                className="p-4 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 rounded-2xl text-left transition-all"
              >
                <div className="text-xs font-bold text-indigo-300 font-mono mb-1">Promise.all()</div>
                <div className="text-[11px] text-stone-400">Fails fast on FIRST rejection! If any promise rejects, entire Promise.all rejects.</div>
              </button>

              <button
                onClick={() => runConcurrencyDemo("race")}
                disabled={isConcurrencyRunning}
                className="p-4 bg-sky-950/60 hover:bg-sky-900/60 border border-sky-500/40 rounded-2xl text-left transition-all"
              >
                <div className="text-xs font-bold text-sky-300 font-mono mb-1">Promise.race()</div>
                <div className="text-[11px] text-stone-400">Settles as soon as the VERY FIRST promise settles (resolve or reject).</div>
              </button>

              <button
                onClick={() => runConcurrencyDemo("allSettled")}
                disabled={isConcurrencyRunning}
                className="p-4 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-2xl text-left transition-all"
              >
                <div className="text-xs font-bold text-emerald-300 font-mono mb-1">Promise.allSettled()</div>
                <div className="text-[11px] text-stone-400">Waits for ALL promises to complete, returning array of status objects. Never rejects!</div>
              </button>
            </div>

            {/* Results Panel */}
            <div className="p-4 bg-black/80 rounded-2xl border border-stone-800 font-mono text-xs min-h-[140px]">
              <div className="text-stone-500 mb-2">Concurrency Execution Result:</div>
              {isConcurrencyRunning ? (
                <div className="text-amber-400 animate-pulse">Running concurrent promises...</div>
              ) : concurrencyResults ? (
                <pre className="text-stone-200 overflow-x-auto p-2 bg-stone-900 rounded-xl">
                  {JSON.stringify(concurrencyResults, null, 2)}
                </pre>
              ) : (
                <span className="text-stone-600 italic">Click any method above to run simulation.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ASYNC/AWAIT VS PROMISES */}
      {activeTab === "asyncawait" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-stone-900 rounded-3xl border border-stone-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
              <Code2 className="w-4 h-4" /> Traditional Promise .then() Chaining
            </div>
            <pre className="p-4 bg-black/70 rounded-2xl border border-stone-800 text-xs font-mono text-stone-300 leading-relaxed overflow-x-auto">
{`function fetchInvoiceData(id) {
  return fetch(\`/api/invoices/\${id}\`)
    .then((res) => res.json())
    .then((data) => {
      console.log("Success:", data);
      return processPayment(data);
    })
    .catch((error) => {
      console.error("Failed:", error);
    });
}`}
            </pre>
            <p className="text-xs text-stone-400 leading-relaxed">
              Uses explicit callback handlers registered in the Microtask Queue. Can become nested or harder to read with multiple conditional steps.
            </p>
          </div>

          <div className="p-6 bg-stone-900 rounded-3xl border border-stone-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Code2 className="w-4 h-4" /> Modern async / await Syntax (Syntactic Sugar)
            </div>
            <pre className="p-4 bg-black/70 rounded-2xl border border-stone-800 text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto">
{`async function fetchInvoiceData(id) {
  try {
    const res = await fetch(\`/api/invoices/\${id}\`);
    const data = await res.json();
    console.log("Success:", data);
    return await processPayment(data);
  } catch (error) {
    console.error("Failed:", error);
  }
}`}
            </pre>
            <p className="text-xs text-stone-400 leading-relaxed">
              Built on top of Promises and Generators. Writes asynchronous code in synchronous imperative style with standard <code>try / catch</code> blocks.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
