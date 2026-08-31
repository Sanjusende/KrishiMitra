/**
 * queryHelpers.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared, reusable security utilities for building safe MongoDB query objects
 * from user-controlled inputs (req.query / req.body / req.params).
 *
 * Usage:
 *   import { escapeRegex, pickAllowed, safeInt, safeString } from '../../utils/queryHelpers.js';
 */

/**
 * Escape special regex metacharacters from a user-supplied string.
 * Prevents Regular Expression Injection / ReDoS attacks.
 *
 * @param  {string} str - Raw user input
 * @returns {string}    - Safe, escaped string for use inside new RegExp()
 *
 * @example
 *   query.name = { $regex: escapeRegex(req.query.search), $options: 'i' };
 */
export const escapeRegex = (str) =>
  String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Return a string value only if it exists in the allowedValues whitelist.
 * Silently drops the value if it is not in the list.
 *
 * @param  {string}   value         - Raw value from req.query / req.body
 * @param  {string[]} allowedValues - Array of accepted string literals
 * @returns {string|undefined}      - Validated value, or undefined
 *
 * @example
 *   const status = pickAllowed(req.query.status, ALLOWED_STATUS);
 *   if (status) query.status = status;
 */
export const pickAllowed = (value, allowedValues) => {
  const v = typeof value === 'string' ? value.trim() : '';
  return allowedValues.includes(v) ? v : undefined;
};

/**
 * Safely parse a query-string integer with a specified default and bounds.
 *
 * @param  {string|number} value   - Raw value from req.query
 * @param  {number}        def     - Default value when parsing fails
 * @param  {number}        [min=1] - Minimum allowed value
 * @param  {number}        [max]   - Maximum allowed value (optional)
 * @returns {number}
 *
 * @example
 *   const page  = safeInt(req.query.page,  1, 1, 10000);
 *   const limit = safeInt(req.query.limit, 10, 1, 100);
 */
export const safeInt = (value, def, min = 1, max = undefined) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return def;
  if (n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
};

/**
 * Safely cast a value to a trimmed string, returning a fallback when null/undefined.
 *
 * @param  {*}      value    - Raw value from req.query / req.body
 * @param  {string} [def=''] - Fallback default
 * @returns {string}
 */
export const safeString = (value, def = '') =>
  typeof value === 'string' ? value.trim() : def;
