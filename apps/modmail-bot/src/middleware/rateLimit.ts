// src/middleware/rateLimit.js
/** Simple in‑memory rate limiter per user */
const cooldowns = new Map();
const LIMIT_MS = 3000; // 3 seconds between commands

export function checkRateLimit(userId) {
    const now = Date.now();
    const last = cooldowns.get(userId) || 0;
    if (now - last < LIMIT_MS) return false; // too fast
    cooldowns.set(userId, now);
    return true;
}
