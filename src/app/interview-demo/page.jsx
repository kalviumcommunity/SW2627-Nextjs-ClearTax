"use client";

import React, { useState } from "react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import EventLoopVisualizer from "../../components/interview/EventLoopVisualizer";
import PromisesLab from "../../components/interview/PromisesLab";
import CallbacksSimulator from "../../components/interview/CallbacksSimulator";
import HoistingVisualizer from "../../components/interview/HoistingVisualizer";
import MiddlewareVisualizer from "../../components/interview/MiddlewareVisualizer";
import InterviewerGuide from "../../components/interview/InterviewerGuide";
import {
  Cpu,
  Zap,
  RefreshCw,
  Sparkles,
  BookOpen,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

export default function InterviewDemoPage() {
  const [activeTab, setActiveTab] = useState("event-loop");

  const TABS = [
    { id: "event-loop", label: "Event Loop Visualizer", icon: Cpu, badge: "Stack & Queues" },
    { id: "promises", label: "Promises & Async Lab", icon: Sparkles, badge: "States & Concurrency" },
    { id: "callbacks", label: "Callbacks Simulator", icon: RefreshCw, badge: "Sync vs Async" },
    { id: "hoisting", label: "Hoisting & TDZ", icon: Zap, badge: "Scope & Creation" },
    { id: "middleware", label: "Middleware Pipeline & Guards", icon: ShieldCheck, badge: "Onion & Auth Guards" },
    { id: "cheatsheet", label: "Interview Cheatsheet", icon: BookOpen, badge: "Q&A Talk Tracks" },
  ];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-[#5a38ef] selection:text-white">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-stone-900 via-indigo-950 to-stone-900 p-8 sm:p-10 border border-indigo-500/20 shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              JS Engine Studio & Interview Showcase
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold font-outfit tracking-tight text-white leading-tight">
              Master & Showcase JavaScript Core Concepts
            </h1>

            <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
              Interactive visual execution engines designed to demonstrate <strong>Event Loop priority</strong>, <strong>Promise immutability & concurrency</strong>, <strong>Middleware Onion Pipeline</strong>, <strong>Callbacks</strong>, and <strong>Hoisting TDZ</strong> live during tech interviews.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 p-2 bg-stone-900/80 backdrop-blur-md rounded-2xl border border-stone-800 no-scrollbar">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-5 py-3 rounded-xl text-xs font-semibold transition-all duration-200 shrink-0 ${
                  isActive
                    ? "bg-[#5a38ef] text-white shadow-lg shadow-indigo-500/30 ring-1 ring-indigo-400/40"
                    : "text-stone-400 hover:text-stone-200 hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-stone-400"}`} />
                <div className="flex flex-col items-start text-left">
                  <span>{tab.label}</span>
                  <span className={`text-[10px] ${isActive ? "text-indigo-200" : "text-stone-500"}`}>{tab.badge}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          {activeTab === "event-loop" && <EventLoopVisualizer />}
          {activeTab === "promises" && <PromisesLab />}
          {activeTab === "callbacks" && <CallbacksSimulator />}
          {activeTab === "hoisting" && <HoistingVisualizer />}
          {activeTab === "middleware" && <MiddlewareVisualizer />}
          {activeTab === "cheatsheet" && <InterviewerGuide />}
        </motion.div>

      </main>

      <Footer />
    </div>
  );
}
