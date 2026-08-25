import { randomBytes } from 'node:crypto';

/**
 * Slip has no accounts. An invoice is reached by its token, and holding the
 * token is what grants access — a capability URL.
 *
 * That is a real trade, made deliberately:
 *
 *   - It removes passwords, sessions, resets and the whole account surface
 *     from a tool someone uses six times a month.
 *   - It means anyone who obtains the link has the same access. Links leak
 *     through forwarded email, shared screens and browser history.
 *
 * For an invoice — a document you are about to email to the client anyway —
 * that is an acceptable exchange. It would not be for medical records.
 *
 * The tokens are 160 bits from a CSPRNG, so guessing one is not a threat model
 * worth discussing. `base64url` keeps them URL-safe without escaping.
 */
export function newToken(): string {
  return randomBytes(20).toString('base64url');
}
