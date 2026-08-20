"use client";

import React, { useState } from "react";
import {
  BookOpen,
  HelpCircle,
  Play,
  Terminal,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { demonstrateEventLoopExecution } from "../../utils/interviewCoreConcepts";

const FAQS = [
  {
    category: "Event Loop",
    question: "What is the priority order of JavaScript execution?",
    answer: "1. Synchronous Call Stack execution\n2. Microtask Queue (Promise callbacks, queueMicrotask, MutationObserver)\n3. Macrotask / Task Queue (setTimeout, setInterval, setImmediate, I/O callbacks)\n\nNote: The Microtask Queue is completely drained before the Event Loop picks the next Macrotask."
  },
  {
    category: "Promises",
    question: "What is the difference between Promise.all vs Promise.allSettled?",
    answer: "• Promise.all: Fails fast. If ANY input promise rejects, the returned promise immediately rejects with that error.\n• Promise.allSettled: Always waits for ALL promises to complete (resolved or rejected) and returns an array of status objects ({status: 'fulfilled'|'rejected', value|reason}). It NEVER rejects."
  },
  {
    category: "Callbacks",
    question: "Are callbacks always asynchronous in JavaScript?",
    answer: "No! Callbacks are simply functions passed as arguments to higher-order functions. Array methods like [1, 2].map(cb) execute callbacks SYNCHRONOUSLY on the Call Stack. Callbacks passed to Web APIs like setTimeout(cb) or fs.readFile(cb) execute ASYNCHRONOUSLY."
  },
  {
    category: "Hoisting",
    question: "What is the Temporal Dead Zone (TDZ)?",
    answer: "The TDZ is the region of code between the start of a block scope and the line where a 'let' or 'const' variable is declared. Although memory is allocated during Creation Phase (Phase 1), accessing the variable during TDZ throws a ReferenceError."
  }
];

export default function InterviewerGuide() {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [demoLog, setDemoLog] = useState([]);

  const runLiveUtilTest = () => {
    const logs = [];
    demonstrateEventLoopExecution((msg) => {
      logs.push(msg);
    });
    setDemoLog(logs);
  };

  return (
    <div className="p-6 bg-stone-900 rounded-3xl border border-stone-800 space-y-6 text-stone-100">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5" /> Interview Cheatsheet
          </div>
          <h3 className="text-xl font-bold font-outfit text-white">Technical Interview Q&A & Talk Tracks</h3>
        </div>

        <button
          onClick={runLiveUtilTest}
          className="px-4 py-2 bg-[#5a38ef] hover:bg-[#4727d8] text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <Play className="w-4 h-4" /> Run src/utils/interviewCoreConcepts.js Test
        </button>
      </div>

      {/* Live Helper Utilities Execution Output */}
      {demoLog.length > 0 && (
        <div className="p-4 bg-black/80 rounded-2xl border border-indigo-500/40 font-mono text-xs space-y-1">
          <div className="text-indigo-400 font-bold mb-1 flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5" /> Output from src/utils/interviewCoreConcepts.js:
          </div>
          {demoLog.map((log, i) => (
            <div key={i} className="text-emerald-400">&gt; {log}</div>
          ))}
        </div>
      )}

      {/* Accordion FAQ Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-400" /> High-Frequency Technical Interview Questions
        </h4>

        <div className="space-y-2">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden transition-colors">
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300">
                      {faq.category}
                    </span>
                    <span className="text-xs font-semibold text-stone-200">{faq.question}</span>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                </button>

                {isOpen && (
                  <div className="p-4 pt-0 text-xs text-stone-300 font-mono leading-relaxed whitespace-pre-wrap border-t border-stone-800/50 bg-black/40">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
