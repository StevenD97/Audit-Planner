/**
 * Passphrase-based encryption-at-rest for workspace files.
 *
 * Deliberately built entirely on the standard Web Crypto API
 * (`crypto.subtle`) rather than any custom cryptography — that API is
 * identical in Node (Electron's main process, Node 20+) and in the browser,
 * so this one file is the single implementation both platforms use; there
 * is no second copy to drift out of sync or get a subtle bug in.
 *
 * Format written to disk / IndexedDB (all lengths in bytes):
 *   [8: magic "IAAPENC1"] [16: PBKDF2 salt] [12: AES-GCM IV] [ciphertext+tag]
 *
 * Threat model — what this protects against:
 *   - Someone getting a copy of the workspace file (emailed, synced to
 *     personal cloud storage, a stolen/lost laptop's disk) cannot read its
 *     contents without the passphrase.
 * What this does NOT protect against (be explicit with users about this):
 *   - Anyone with access to the *unlocked, running* app sees everything —
 *     this is encryption at rest, not an access-control system.
 *   - A forgotten passphrase is unrecoverable by design (nothing about it
 *     is stored anywhere); losing it means losing the data.
 *   - Malware/keyloggers on the machine while you type the passphrase.
 */

const MAGIC = new TextEncoder().encode('IAAPENC1')
const SALT_LENGTH = 16
const IV_LENGTH = 12
// OWASP (2023) minimum recommendation for PBKDF2-HMAC-SHA256.
const PBKDF2_ITERATIONS = 210_000

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export function isEncrypted(data: Uint8Array): boolean {
  if (data.length < MAGIC.length) return false
  for (let i = 0; i < MAGIC.length; i++) {
    if (data[i] !== MAGIC[i]) return false
  }
  return true
}

export async function encryptBytes(data: Uint8Array, passphrase: string): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(passphrase, salt)
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, data as BufferSource)
  )
  const out = new Uint8Array(MAGIC.length + salt.length + iv.length + ciphertext.length)
  out.set(MAGIC, 0)
  out.set(salt, MAGIC.length)
  out.set(iv, MAGIC.length + salt.length)
  out.set(ciphertext, MAGIC.length + salt.length + iv.length)
  return out
}

export class IncorrectPassphraseError extends Error {
  constructor() {
    super('Incorrect passphrase, or this file is corrupted.')
    this.name = 'IncorrectPassphraseError'
  }
}

/** Thrown when opening/restoring a workspace whose bytes are encrypted and no passphrase was supplied yet. */
export class NeedsPassphraseError extends Error {
  constructor(public readonly encryptedBytes: Uint8Array) {
    super('This workspace is passphrase-protected.')
    this.name = 'NeedsPassphraseError'
  }
}

export async function decryptBytes(data: Uint8Array, passphrase: string): Promise<Uint8Array> {
  if (!isEncrypted(data)) throw new Error('This file is not passphrase-protected.')
  const salt = data.slice(MAGIC.length, MAGIC.length + SALT_LENGTH)
  const iv = data.slice(MAGIC.length + SALT_LENGTH, MAGIC.length + SALT_LENGTH + IV_LENGTH)
  const ciphertext = data.slice(MAGIC.length + SALT_LENGTH + IV_LENGTH)
  const key = await deriveKey(passphrase, salt)
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      ciphertext as BufferSource
    )
    return new Uint8Array(plain)
  } catch {
    // AES-GCM's authentication tag check fails for a wrong key just as
    // readily as for corrupted ciphertext — either way, we can't tell them
    // apart, so the error message intentionally doesn't guess which.
    throw new IncorrectPassphraseError()
  }
}
