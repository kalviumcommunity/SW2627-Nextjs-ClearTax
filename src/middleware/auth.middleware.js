import jwt from "jsonwebtoken";

/**
 * ----------------------------------------------------------------------------
 * 1. AUTHENTICATION GUARD (Core Export)
 * ----------------------------------------------------------------------------
 * Extracts Bearer token from incoming Request headers and verifies JWT payload.
 * Preserves exact existing function signature and contract.
 *
 * @param {Request} request - Standard Web / Next.js Request object
 * @returns {Promise<Object>} Decoded JWT payload
 */
export async function authenticateUser(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) throw new Error("Authorization header missing");

  const token = authHeader.split(" ")[1];
  if (!token) throw new Error("Token missing from authorization header");

  const secret = process.env.JWT_SECRET || "fallback_interview_secret_key_2026";
  return jwt.verify(token, secret);
}

/**
 * ----------------------------------------------------------------------------
 * 2. ROLE-BASED ACCESS CONTROL (RBAC) GUARD
 * ----------------------------------------------------------------------------
 * Ensures authenticated user possesses one of the allowed roles.
 *
 * @param {Request} request
 * @param {string[]} allowedRoles
 * @returns {Promise<Object>} User object if authorized
 */
export async function verifyRole(request, allowedRoles = []) {
  const user = await authenticateUser(request);
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw new Error(`Forbidden: Role '${user.role}' lacks required permissions`);
  }
  return user;
}

/**
 * ----------------------------------------------------------------------------
 * 3. IN-MEMORY RATE LIMIT GUARD (Sliding Window Algorithm)
 * ----------------------------------------------------------------------------
 * Prevents API abuse by tracking request counts per IP/Token within a time window.
 */
const rateLimitStore = new Map();

export async function rateLimitGuard(request, { limit = 10, windowMs = 60000 } = {}) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "client-ip";
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
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
    throw new Error(`Rate limit exceeded (${limit} requests/${windowMs / 1000}s). Retry after ${retryAfterSec}s`);
  }

  return { success: true, remaining: limit - record.count };
}

/**
 * ----------------------------------------------------------------------------
 * 4. MIDDLEWARE PIPELINE COMPOSER (Koa / Express Async Onion Model)
 * ----------------------------------------------------------------------------
 * Composes an array of middleware functions into a single executable pipeline.
 * Each middleware receives (context, next) and can run logic before and after next().
 *
 * @param {...Function} middlewares
 * @returns {Function} Executable pipeline handler
 */
export function composeMiddleware(...middlewares) {
  return function (context) {
    let index = -1;

    function dispatch(i) {
      if (i <= index) {
        return Promise.reject(new Error("next() called multiple times in same middleware"));
      }
      index = i;
      const fn = middlewares[i];
      if (!fn) return Promise.resolve();

      try {
        return Promise.resolve(fn(context, () => dispatch(i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return dispatch(0);
  };
}

/**
 * ----------------------------------------------------------------------------
 * 5. HIGHER-ORDER ROUTE MIDDLEWARE WRAPPER (withAuth)
 * ----------------------------------------------------------------------------
 * Decorates Next.js Route Handlers with automatic JWT authentication and error handling.
 *
 * @param {Function} handler - Route handler function (req, user, context)
 * @param {Object} options - { roles: string[], rateLimit: number }
 */
export function withAuth(handler, options = {}) {
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
      const isAuthErr = error.message.includes("Authorization") || error.message.includes("Token") || error.message.includes("jwt");
      const isForbidden = error.message.includes("Forbidden");
      const isRateLimit = error.message.includes("Rate limit");

      const status = isRateLimit ? 429 : isForbidden ? 403 : isAuthErr ? 401 : 400;

      return Response.json(
        { success: false, error: error.message },
        { status }
      );
    }
  };
}

