"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Play,
  RotateCcw,
  SkipForward,
  ShieldCheck,
  Layers,
  Zap,
  Terminal,
  Code2,
  Copy,
  Check,
  Lock,
  Clock,
  Server,
  FileCode2,
} from "lucide-react";
import { composeMiddleware } from "../../middleware/auth.middleware";

// Code Snippets for visible implementation tabs
const CODE_SNIPPETS = {
  compose: {
    title: "1. Middleware Composition Engine (Onion Model)",
    description: "How async middleware compose() works in Koa & Express under the hood using recursive next() dispatch.",
    code: `/**
 * Composes an array of async middleware functions into a single pipeline chain.
 * Enables pre-processing before next() and post-processing after next().
 */
export function composeMiddleware(...middlewares) {
  return function (context) {
    let index = -1;

    function dispatch(i) {
      // Guard against multiple next() calls in the same middleware
      if (i <= index) {
        return Promise.reject(
          new Error("next() called multiple times in same middleware")
        );
      }
      index = i;
      const fn = middlewares[i];
      if (!fn) return Promise.resolve();

      try {
        // Pass context and bound next function to current middleware
        return Promise.resolve(fn(context, () => dispatch(i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return dispatch(0);
  };
}`,
  },
  authGuard: {
    title: "2. JWT & RBAC Guard Middleware",
    description: "Extracts Bearer token, verifies secret key, and enforces Role-Based Access Control.",
    code: `import jwt from "jsonwebtoken";

// Extract Bearer Token & verify JWT payload
export async function authenticateUser(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) throw new Error("Authorization header missing");

  const token = authHeader.split(" ")[1];
  if (!token) throw new Error("Token missing from authorization header");

  return jwt.verify(token, process.env.JWT_SECRET);
}

// Role-Based Access Control (RBAC) Guard
export async function verifyRole(request, allowedRoles = []) {
  const user = await authenticateUser(request);
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw new Error(\`Forbidden: Role '\${user.role}' lacks required permissions\`);
  }
  return user;
}`,
  },
  rateLimiter: {
    title: "3. Sliding Window Rate Limiter Middleware",
    description: "Prevents API abuse by tracking request counts per IP in an in-memory window.",
    code: `const rateLimitStore = new Map();

export async function rateLimitGuard(request, { limit = 10, windowMs = 60000 } = {}) {
  const ip = request.headers.get("x-forwarded-for") || "client-ip";
  const now = Date.now();
  const record = rateLimitStore.get(ip) || { count: 0, resetAt: now + windowMs };

  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + windowMs;
  } else {
    record.count += 1;
  }

  rateLimitStore.set(ip, record);

  if (record.count > limit) {
    const retrySec = Math.ceil((record.resetAt - now) / 1000);
    throw new Error(\`Rate limit exceeded (\${limit} req/\${windowMs/1000}s). Retry after \${retrySec}s\`);
  }

  return { remaining: limit - record.count };
}`,
  },
  nextProxy: {
    title: "4. Next.js Edge Route Guard (proxy.js / middleware.js)",
    description: "Intercepts request before page rendering, checks cookies, and handles redirects.",
    code: `import { NextResponse } from "next/server";

const PRIVATE_PREFIXES = ["/dashboard", "/upload", "/invoices", "/profile"];

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.get("bip_auth")?.value === "1";

  const isPrivateRoute = PRIVATE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // Short-circuit: Redirect unauthenticated user to login
  if (!isAuthenticated && isPrivateRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/upload/:path*", "/login"],
};`,
  },
  withAuth: {
    title: "5. Higher-Order Route Wrapper (withAuth)",
    description: "Clean decorator pattern wrapping Next.js App Router handlers with middleware logic.",
    code: `export function withAuth(handler, options = {}) {
  return async function (request, routeParams) {
    try {
      if (options.rateLimit) {
        await rateLimitGuard(request, { limit: options.rateLimit });
      }

      const user = options.roles
        ? await verifyRole(request, options.roles)
        : await authenticateUser(request);

      return await handler(request, user, routeParams);
    } catch (error) {
      const isAuth = error.message.includes("Token") || error.message.includes("Authorization");
      const isRate = error.message.includes("Rate limit");
      const status = isRate ? 429 : isAuth ? 401 : 403;

      return Response.json({ success: false, error: error.message }, { status });
    }
  };
}`,
  },
};

// Preset Scenarios for Execution Visualizer
const SCENARIOS = [
  {
    id: "valid",
    label: "1. Valid Request (200 OK)",
    description: "Request with valid Bearer token and under rate limit. Full Onion Model execution.",
    authHeader: "Bearer valid_jwt_token_sample",
    role: "ADMIN",
    rateLimitCount: 2,
    steps: [
      { node: "client", dir: "inbound", message: "Client initiates HTTP GET /api/invoices", activeIndex: 0 },
      { node: "m1", dir: "inbound", message: "M1 [Logger]: Request timestamp recorded, passing to next()", activeIndex: 1 },
      { node: "m2", dir: "inbound", message: "M2 [Auth Guard]: Bearer token verified (User: Candidate, Role: ADMIN)", activeIndex: 2 },
      { node: "m3", dir: "inbound", message: "M3 [Rate Limiter]: Count (3/5). Within limit, passing to next()", activeIndex: 3 },
      { node: "controller", dir: "inbound", message: "Target Controller: Fetching invoice data from database", activeIndex: 4 },
      { node: "m3", dir: "outbound", message: "M3 [Rate Limiter] (Post): Added RateLimit-Remaining: 2 header", activeIndex: 3 },
      { node: "m2", dir: "outbound", message: "M2 [Auth Guard] (Post): Added Security Headers (X-Frame-Options)", activeIndex: 2 },
      { node: "m1", dir: "outbound", message: "M1 [Logger] (Post): Request completed in 14ms with Status 200 OK", activeIndex: 1 },
      { node: "client", dir: "outbound", message: "Client receives 200 OK response with JSON payload", activeIndex: 0 },
    ],
    status: 200,
    body: { success: true, user: "Candidate", invoices: [{ id: "INV-101", amount: "₹1,250.00" }] },
  },
  {
    id: "missing_token",
    label: "2. Unauthorized (401 Short Circuit)",
    description: "Missing Authorization header. Auth Guard short-circuits execution (next() NOT called).",
    authHeader: "",
    role: "USER",
    rateLimitCount: 1,
    steps: [
      { node: "client", dir: "inbound", message: "Client initiates HTTP GET /api/invoices without Auth header", activeIndex: 0 },
      { node: "m1", dir: "inbound", message: "M1 [Logger]: Request timestamp recorded, passing to next()", activeIndex: 1 },
      { node: "m2", dir: "inbound", message: "M2 [Auth Guard]: Authorization header missing! Short-circuiting!", activeIndex: 2 },
      { node: "m1", dir: "outbound", message: "M1 [Logger] (Post): Intercepted 401 response. Processed in 3ms", activeIndex: 1 },
      { node: "client", dir: "outbound", message: "Client receives 401 Unauthorized error", activeIndex: 0 },
    ],
    status: 401,
    body: { success: false, error: "Authorization header missing" },
  },
  {
    id: "rate_limited",
    label: "3. Rate Limit Exceeded (429 Block)",
    description: "Client sent 6 requests in window (limit = 5). Rate Limiter short-circuits request.",
    authHeader: "Bearer valid_jwt_token_sample",
    role: "USER",
    rateLimitCount: 6,
    steps: [
      { node: "client", dir: "inbound", message: "Client sends burst HTTP GET request (Request #6)", activeIndex: 0 },
      { node: "m1", dir: "inbound", message: "M1 [Logger]: Request timestamp recorded, passing to next()", activeIndex: 1 },
      { node: "m2", dir: "inbound", message: "M2 [Auth Guard]: Bearer token verified", activeIndex: 2 },
      { node: "m3", dir: "inbound", message: "M3 [Rate Limiter]: Count (6/5) EXCEEDED limit! Short-circuiting!", activeIndex: 3 },
      { node: "m2", dir: "outbound", message: "M2 [Auth Guard] (Post): Passing 429 status backwards", activeIndex: 2 },
      { node: "m1", dir: "outbound", message: "M1 [Logger] (Post): Logged 429 Rate Limit Exceeded", activeIndex: 1 },
      { node: "client", dir: "outbound", message: "Client receives 429 Too Many Requests (Retry-After: 45s)", activeIndex: 0 },
    ],
    status: 429,
    body: { success: false, error: "Rate limit exceeded (5 requests/60s). Retry after 45s" },
  },
];

export default function MiddlewareVisualizer() {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState("compose");
  const [copied, setCopied] = useState(false);

  // Live Sandbox state
  const [sandboxAuthHeader, setSandboxAuthHeader] = useState("Bearer test_token");
  const [sandboxRole, setSandboxRole] = useState("ADMIN");
  const [sandboxResponse, setSandboxResponse] = useState(null);
  const [sandboxLogs, setSandboxLogs] = useState([]);

  // Handle Scenario Switch
  const handleScenarioChange = (scenario) => {
    setSelectedScenario(scenario);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  // Auto-play timer
  useEffect(() => {
    let timer;
    if (isPlaying) {
      if (currentStepIndex < selectedScenario.steps.length - 1) {
        timer = setTimeout(() => {
          setCurrentStepIndex((prev) => prev + 1);
        }, 1200);
      } else {
        setIsPlaying(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, selectedScenario]);

  // Copy Code to Clipboard
  const copyCode = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Run Live Sandbox Request
  const runLiveSandbox = async () => {
    const logs = [];
    logs.push(`[${new Date().toLocaleTimeString()}] 🚀 Initiating Request to Middleware Pipeline...`);

    const context = {
      url: "/api/secure-invoices",
      headers: { authorization: sandboxAuthHeader },
      userRole: sandboxRole,
      status: 200,
      logs: [],
    };

    const loggingMw = async (ctx, next) => {
      logs.push(`   -> [M1 Logger]: Intercepted Request for ${ctx.url}`);
      await next();
      logs.push(`   <- [M1 Logger]: Response returned with Status ${ctx.status}`);
    };

    const authMw = async (ctx, next) => {
      logs.push(`   -> [M2 Auth Guard]: Validating Bearer Token...`);
      if (!ctx.headers.authorization || !ctx.headers.authorization.startsWith("Bearer ")) {
        ctx.status = 401;
        ctx.body = { success: false, error: "401 Unauthorized: Bearer Token Missing" };
        logs.push(`   ❌ [M2 Auth Guard]: Blocked! Token missing. Short-circuiting pipeline.`);
        return;
      }
      if (sandboxRole !== "ADMIN") {
        ctx.status = 403;
        ctx.body = { success: false, error: "403 Forbidden: ADMIN role required" };
        logs.push(`   ❌ [M2 Auth Guard]: Blocked! User role '${sandboxRole}' is not ADMIN.`);
        return;
      }
      logs.push(`   ✅ [M2 Auth Guard]: Authorized as ADMIN. Passing to next()`);
      await next();
    };

    const controller = async (ctx) => {
      logs.push(`   ⚡ [Controller]: Executing business logic & returning invoice data.`);
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: {
          invoiceId: "INV-2026-9081",
          customer: "Acme Corp",
          taxAmount: "₹45,000",
          status: "PAID",
        },
      };
    };

    const pipeline = composeMiddleware(loggingMw, authMw, controller);
    await pipeline(context);

    setSandboxLogs(logs);
    setSandboxResponse({ status: context.status, body: context.body });
  };

  const currentStep = selectedScenario.steps[currentStepIndex];

  return (
    <div className="space-y-8 text-stone-100 font-sans">
      
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-stone-900 via-indigo-950/80 to-stone-900 rounded-3xl border border-indigo-500/30 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Next.js & Express Middleware Architecture
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-outfit text-white tracking-tight">
            Interview-Ready Middleware & Request Pipeline
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Master the <strong>Onion Architecture</strong>, <code>next()</code> recursion, short-circuit error handling, JWT auth guards, and rate limiting algorithms.
          </p>
        </div>

        <button
          onClick={runLiveSandbox}
          className="px-4 py-2.5 bg-[#5a38ef] hover:bg-[#4727d8] text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 shrink-0"
        >
          <Zap className="w-4 h-4" /> Run Live Pipeline Sandbox
        </button>
      </div>

      {/* SECTION 1: INTERACTIVE ONION MODEL VISUALIZER */}
      <div className="p-6 bg-stone-900/90 rounded-3xl border border-stone-800 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-indigo-400 tracking-wider">
              Visual Execution Engine
            </span>
            <h3 className="text-lg font-bold font-outfit text-white">
              Onion Architecture Execution & Short-Circuit Simulator
            </h3>
          </div>

          {/* Scenario Selector Pills */}
          <div className="flex flex-wrap gap-2">
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handleScenarioChange(scenario)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedScenario.id === scenario.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                    : "bg-stone-800/80 text-stone-400 hover:bg-stone-800 hover:text-stone-200"
                }`}
              >
                {scenario.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline Visual Node Layout */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-stone-950/80 rounded-2xl border border-stone-800">
          {[
            { id: "client", title: "HTTP Client", icon: Server, badge: "Client" },
            { id: "m1", title: "M1: Logger", icon: Layers, badge: "Pre/Post" },
            { id: "m2", title: "M2: Auth Guard", icon: Lock, badge: "JWT & RBAC" },
            { id: "m3", title: "M3: Rate Limiter", icon: Clock, badge: "Sliding Window" },
            { id: "controller", title: "Target Handler", icon: Code2, badge: "Business Logic" },
          ].map((node) => {
            const Icon = node.icon;
            const isActive = currentStep?.node === node.id;
            const isOutbound = currentStep?.dir === "outbound";

            return (
              <motion.div
                key={node.id}
                animate={{
                  scale: isActive ? 1.04 : 1,
                  borderColor: isActive
                    ? isOutbound
                      ? "#10b981"
                      : "#6366f1"
                    : "#27272a",
                }}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isActive
                    ? isOutbound
                      ? "bg-emerald-950/40 text-emerald-200 shadow-lg shadow-emerald-500/20"
                      : "bg-indigo-950/50 text-indigo-200 shadow-lg shadow-indigo-500/20"
                    : "bg-stone-900/60 text-stone-400 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-semibold">
                    {node.badge}
                  </span>
                  <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400 animate-pulse" : "text-stone-500"}`} />
                </div>

                <div className="my-3">
                  <h4 className="text-xs font-bold text-white">{node.title}</h4>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    {isActive ? (isOutbound ? "OUTBOUND (Post)" : "INBOUND (Pre)") : "Idle"}
                  </p>
                </div>

                <div className="h-1.5 w-full bg-stone-800 rounded-full overflow-hidden">
                  {isActive && (
                    <motion.div
                      layoutId="activeBar"
                      className={`h-full ${isOutbound ? "bg-emerald-400" : "bg-indigo-500"}`}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Step Navigation Controls & Explanation Bar */}
        <div className="p-4 bg-black/60 rounded-2xl border border-stone-800 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5" /> {isPlaying ? "Pause" : "Play Flow"}
              </button>

              <button
                onClick={() => {
                  setCurrentStepIndex(0);
                  setIsPlaying(false);
                }}
                className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentStepIndex((prev) => Math.min(prev + 1, selectedScenario.steps.length - 1))}
                disabled={currentStepIndex >= selectedScenario.steps.length - 1}
                className="p-1.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-300 rounded-lg text-xs"
                title="Next Step"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs font-mono text-stone-400">
              Step <span className="text-indigo-400 font-bold">{currentStepIndex + 1}</span> of {selectedScenario.steps.length}
            </div>
          </div>

          {/* Current Step Log Description */}
          <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex items-start gap-3">
            <Terminal className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-semibold text-stone-200">
                {currentStep?.message}
              </div>
              <div className="text-[11px] text-stone-500 font-mono">
                Scenario: {selectedScenario.description}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: VISIBLE IMPLEMENTATION CODE VIEWER */}
      <div className="p-6 bg-stone-900/90 rounded-3xl border border-stone-800 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold uppercase">
              <FileCode2 className="w-3 h-3" /> Interview Code Inspector
            </div>
            <h3 className="text-lg font-bold font-outfit text-white">
              Production Implementation Code
            </h3>
          </div>

          <button
            onClick={() => copyCode(CODE_SNIPPETS[activeCodeTab].code)}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied Code!" : "Copy Code"}
          </button>
        </div>

        {/* Code Tabs */}
        <div className="flex overflow-x-auto gap-2 p-1.5 bg-stone-950 rounded-xl border border-stone-800 no-scrollbar">
          {Object.entries(CODE_SNIPPETS).map(([key, item]) => (
            <button
              key={key}
              onClick={() => setActiveCodeTab(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeCodeTab === key
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-stone-400 hover:text-stone-200 hover:bg-white/5"
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>

        {/* Code Display Area */}
        <div className="p-4 bg-black/90 rounded-2xl border border-stone-800 font-mono text-xs overflow-x-auto space-y-2">
          <div className="text-stone-400 text-[11px] pb-2 border-b border-stone-800">
            // {CODE_SNIPPETS[activeCodeTab].description}
          </div>
          <pre className="text-indigo-200 leading-relaxed">
            <code>{CODE_SNIPPETS[activeCodeTab].code}</code>
          </pre>
        </div>
      </div>

      {/* SECTION 3: LIVE SANDBOX REQUEST TESTER */}
      <div className="p-6 bg-stone-900/90 rounded-3xl border border-stone-800 space-y-6">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase text-indigo-400 tracking-wider">
            Interactive Testbed
          </span>
          <h3 className="text-lg font-bold font-outfit text-white">
            Live Request & Middleware Guard Testing Sandbox
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Controls */}
          <div className="space-y-4 p-4 bg-stone-950 rounded-2xl border border-stone-800">
            <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider">Configure Request Headers</h4>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-stone-400">Authorization Header</label>
              <input
                type="text"
                value={sandboxAuthHeader}
                onChange={(e) => setSandboxAuthHeader(e.target.value)}
                placeholder="Bearer valid_jwt_token..."
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-stone-400">Simulated User Role</label>
              <select
                value={sandboxRole}
                onChange={(e) => setSandboxRole(e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="ADMIN">ADMIN (Allowed)</option>
                <option value="USER">USER (Forbidden for Admin route)</option>
                <option value="GUEST">GUEST (Restricted)</option>
              </select>
            </div>

            <button
              onClick={runLiveSandbox}
              className="w-full py-2.5 bg-[#5a38ef] hover:bg-[#4727d8] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" /> Dispatch Request
            </button>
          </div>

          {/* Console Execution Logs */}
          <div className="space-y-2 p-4 bg-black/80 rounded-2xl border border-stone-800 lg:col-span-2 font-mono text-xs flex flex-col justify-between">
            <div>
              <div className="text-indigo-400 font-bold mb-2 flex items-center gap-2 pb-2 border-b border-stone-800">
                <Terminal className="w-4 h-4" /> Live Middleware Execution Trace
              </div>

              {sandboxLogs.length === 0 ? (
                <div className="text-stone-500 italic py-6 text-center">
                  Click "Dispatch Request" to observe real-time middleware execution log...
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
                  {sandboxLogs.map((log, i) => (
                    <div key={i} className="text-emerald-400 leading-snug">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {sandboxResponse && (
              <div className="mt-4 p-3 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-stone-400 uppercase font-mono">Response Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                      sandboxResponse.status === 200
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}
                  >
                    {sandboxResponse.status} {sandboxResponse.status === 200 ? "OK" : "ERROR"}
                  </span>
                </div>

                <div className="text-[10px] font-mono text-stone-400 truncate max-w-xs">
                  {JSON.stringify(sandboxResponse.body)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
