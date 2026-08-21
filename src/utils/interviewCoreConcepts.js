/**
 * ============================================================================
 * JAVASCRIPT CORE CONCEPTS & INTERVIEW UTILITIES
 * ============================================================================
 * This module contains production-grade implementations and interview-focused
 * demonstrations of fundamental JavaScript concepts:
 * 1. Event Loop & Task Queues (Sync Stack vs Microtasks vs Macrotasks)
 * 2. Promises & Asynchronous Control Flow (Custom Deferred, Retry, Timeout)
 * 3. Callbacks & Promisification (Error-First pattern, Callback-to-Promise)
 * 4. Hoisting & Scoping Lifecycle (Creation Phase, Temporal Dead Zone)
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. EVENT LOOP & TASK QUEUES
// ----------------------------------------------------------------------------

/**
 * Demonstrates the exact priority execution order of JavaScript runtime engine:
 * Synchronous Stack Execution -> Microtask Queue (Promises/queueMicrotask) -> Macrotask Queue (setTimeout/I/O)
 *
 * @param {Function} logger - Callback to record output sequence
 */
export function demonstrateEventLoopExecution(logger = console.log) {
  logger("[1] Synchronous code starts (Call Stack)");

  // Macrotask 1 (Pushed to Web API -> Task Queue)
  setTimeout(() => {
    logger("[5] Macrotask 1 (setTimeout 0ms)");
  }, 0);

  // Microtask 1 (Pushed to Microtask Queue)
  Promise.resolve().then(() => {
    logger("[3] Microtask 1 (Promise.then)");
  });

  // Microtask 2 (Explicit Microtask Queue insertion)
  if (typeof queueMicrotask === "function") {
    queueMicrotask(() => {
      logger("[4] Microtask 2 (queueMicrotask)");
    });
  }

  // Macrotask 2 (Pushed to Web API -> Task Queue)
  setTimeout(() => {
    logger("[6] Macrotask 2 (setTimeout 10ms)");
  }, 10);

  logger("[2] Synchronous code ends (Call Stack empty)");
}

/**
 * Advanced Event Loop Scheduler: Runs a batch of jobs ensuring UI responsiveness
 * by yielding control back to the event loop using macrotasks when execution time threshold is met.
 *
 * @template T
 * @param {T[]} items - Data batch
 * @param {(item: T, index: number) => void} processor - Item worker
 * @param {number} timeSliceMs - Max execution time before yielding (default 16ms for 60fps)
 * @returns {Promise<void>}
 */
export async function yieldToEventLoop(items, processor, timeSliceMs = 16) {
  let lastYieldTime = performance.now();

  for (let i = 0; i < items.length; i++) {
    processor(items[i], i);

    // Yield control back to Macrotask queue if time slice exceeded
    if (performance.now() - lastYieldTime > timeSliceMs) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      lastYieldTime = performance.now();
    }
  }
}

// ----------------------------------------------------------------------------
// 2. PROMISES & ASYNC CONTROL FLOW
// ----------------------------------------------------------------------------

/**
 * Custom Deferred Promise implementation.
 * Exposes resolve and reject methods externally for fine-grained async control.
 *
 * @template T
 */
export class DeferredPromise {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    this.state = "pending";

    this.promise.then(
      (val) => {
        this.state = "fulfilled";
        return val;
      },
      (err) => {
        this.state = "rejected";
        throw err;
      }
    );
  }
}

/**
 * Custom Promise Retry Wrapper with exponential backoff.
 * Demonstrates Promise chaining and error recovery.
 *
 * @template T
 * @param {() => Promise<T>} fn - Async function returning a promise
 * @param {number} retries - Maximum retry attempts
 * @param {number} delayMs - Base delay between retries
 * @returns {Promise<T>}
 */
export async function retryWithBackoff(fn, retries = 3, delayMs = 300) {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return retryWithBackoff(fn, retries - 1, delayMs * 2);
  }
}

/**
 * Polyfill demonstration for Promise.allSettled.
 *
 * @template T
 * @param {Promise<T>[]} promises
 * @returns {Promise<Array<{status: 'fulfilled'|'rejected', value?: T, reason?: any}>>}
 */
export function customAllSettled(promises) {
  return Promise.all(
    promises.map((p) =>
      Promise.resolve(p).then(
        (value) => ({ status: "fulfilled", value }),
        (reason) => ({ status: "rejected", reason })
      )
    )
  );
}

// ----------------------------------------------------------------------------
// 3. CALLBACKS & PROMISIFICATION
// ----------------------------------------------------------------------------

/**
 * Error-First Callback pattern implementation (Node.js style standard).
 *
 * @param {boolean} shouldFail - Control outcome for interview testing
 * @param {string} data - Simulated payload
 * @param {(err: Error | null, result?: string) => void} callback - Standard Node callback
 */
export function processInvoiceCallback(shouldFail, data, callback) {
  setTimeout(() => {
    if (shouldFail) {
      callback(new Error(`Failed to process invoice data: ${data}`), null);
    } else {
      callback(null, `SUCCESS: Invoice "${data}" processed via callback.`);
    }
  }, 100);
}

/**
 * Converts any Node.js style error-first callback function into a modern Promise-returning function.
 * Demonstrates closure and Higher-Order Function (HOF) principles.
 *
 * @param {Function} fn - Function using (args..., callback(err, res)) signature
 * @returns {Function} Function returning a Promise
 */
export function promisify(fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      fn.call(this, ...args, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };
}

// ----------------------------------------------------------------------------
// 4. HOISTING & SCOPE LIFECYCLE
// ----------------------------------------------------------------------------

/**
 * Inspects variable hoisting behavior across variable declarations: `var`, `let`, `const`, and `function`.
 * Explains Creation Phase vs Execution Phase in V8/JavaScript engines.
 *
 * @returns {{
 *   varHoisting: { creation: string, execution: string },
 *   letTDZ: { creation: string, execution: string },
 *   funcHoisting: { creation: string, execution: string }
 * }}
 */
export function inspectHoistingLifecycle() {
  return {
    varHoisting: {
      creation: "Memory allocated; variable initialized to 'undefined' during Phase 1 (Creation Phase).",
      execution: "Evaluates to 'undefined' prior to assignment line; reassigned to value when line executes.",
    },
    letTDZ: {
      creation: "Memory allocated; variable NOT initialized (enters Temporal Dead Zone).",
      execution: "Accessing before declaration line throws explicit ReferenceError: Cannot access before initialization.",
    },
    funcHoisting: {
      creation: "Function declarations are fully hoisted with full function body definition in Phase 1.",
      execution: "Can be invoked anywhere in the scope, even before the declaration line.",
    },
  };
}

/**
 * Safe Temporal Dead Zone (TDZ) evaluator tool for interview demonstration.
 * Catches ReferenceError when accessing uninitialized `let`/`const`.
 *
 * @param {Function} accessorFn - Function attempting access
 * @returns {{ success: boolean, value?: any, isTDZError?: boolean, error?: string }}
 */
export function safeEvaluateTDZ(accessorFn) {
  try {
    const val = accessorFn();
    return { success: true, value: val };
  } catch (err) {
    const isTDZError =
      err instanceof ReferenceError &&
      (err.message.includes("initialization") || err.message.includes("TDZ"));
    return {
      success: false,
      isTDZError,
      error: err.message,
    };
  }
}

// ----------------------------------------------------------------------------
// 5. MIDDLEWARE PIPELINE & REQUEST GUARDS
// ----------------------------------------------------------------------------

/**
 * Creates an interview-grade Middleware Pipeline Runner (Koa / Express Onion Model).
 * Demonstrates async function chaining, context passing, and pre/post next() execution.
 *
 * @param {Array<Function>} middlewares - Array of (ctx, next) middleware functions
 * @returns {Function} Callable runner accepting (initialContext)
 */
export function createMiddlewareRunner(middlewares = []) {
  return async function runPipeline(ctx = {}) {
    ctx.logs = ctx.logs || [];
    ctx.state = ctx.state || {};
    let index = -1;

    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times in single middleware step");
      }
      index = i;
      const fn = middlewares[i];
      if (!fn) return;

      await fn(ctx, () => dispatch(i + 1));
    }

    await dispatch(0);
    return ctx;
  };
}

/**
 * Demonstrates step-by-step Onion Model execution order of Middleware Pipeline:
 * Inbound: M1 -> M2 -> M3 -> Controller Handler
 * Outbound: Controller -> M3 (Post) -> M2 (Post) -> M1 (Post)
 *
 * @param {Function} logger - Logging callback function
 */
export async function demonstrateMiddlewarePipeline(logger = console.log) {
  logger("🚀 Initiating Request through Middleware Pipeline...");

  const loggingMiddleware = async (ctx, next) => {
    const start = Date.now();
    logger("   [M1 Inbound] Logger: Received Request -> " + ctx.url);
    ctx.logs.push("M1 Inbound");
    
    await next(); // Pass to next middleware in stack
    
    const duration = Date.now() - start;
    logger(`   [M1 Outbound] Logger: Response Status ${ctx.status || 200} (Processed in ${duration}ms)`);
    ctx.logs.push("M1 Outbound");
  };

  const authGuardMiddleware = async (ctx, next) => {
    logger("   [M2 Inbound] Auth Guard: Validating Authorization Header...");
    if (!ctx.headers || !ctx.headers.authorization) {
      ctx.status = 401;
      ctx.body = { error: "Unauthorized: Missing Token" };
      logger("   [M2 Intercept] Auth Guard: Unauthorized! Short-circuiting pipeline (next() NOT called).");
      ctx.logs.push("M2 Blocked");
      return; // Short circuit, do not call next()
    }

    ctx.user = { id: 101, name: "Interview Candidate", role: "ADMIN" };
    logger(`   [M2 Inbound] Auth Guard: Authenticated as User ${ctx.user.id} (${ctx.user.role})`);
    ctx.logs.push("M2 Passed");

    await next();

    logger("   [M2 Outbound] Auth Guard: Injecting Security Headers (X-Content-Type-Options)");
    ctx.responseHeaders = { ...ctx.responseHeaders, "X-Content-Type-Options": "nosniff" };
    ctx.logs.push("M2 Outbound");
  };

  const controllerHandler = async (ctx) => {
    logger("   [Controller Target] Executing Route Business Logic for " + ctx.url);
    ctx.status = 200;
    ctx.body = { success: true, data: "Invoice data payload for " + ctx.user.name };
    ctx.logs.push("Controller Handled");
  };

  const runner = createMiddlewareRunner([loggingMiddleware, authGuardMiddleware, controllerHandler]);

  // Run Test 1: Valid Auth
  logger("\n--- TEST 1: Request WITH Valid Authorization Header ---");
  const ctx1 = { url: "/api/invoices", headers: { authorization: "Bearer valid_jwt_token_2026" } };
  await runner(ctx1);
  logger(`Final Response Body: ${JSON.stringify(ctx1.body)}`);

  // Run Test 2: Missing Auth (Short-circuit)
  logger("\n--- TEST 2: Request WITHOUT Authorization Header (Short Circuit) ---");
  const ctx2 = { url: "/api/invoices", headers: {} };
  await runner(ctx2);
  logger(`Final Response Status: ${ctx2.status}, Body: ${JSON.stringify(ctx2.body)}`);
}

