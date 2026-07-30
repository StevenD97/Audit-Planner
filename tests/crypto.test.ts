import { describe, it, expect } from 'vitest'
import { encryptBytes, decryptBytes, isEncrypted, IncorrectPassphraseError } from '@shared/crypto'

describe('passphrase encryption at rest', () => {
  it('round-trips data through encrypt/decrypt with the correct passphrase', async () => {
    const original = new TextEncoder().encode('sensitive audit gap assessment narrative')
    const encrypted = await encryptBytes(original, 'correct horse battery staple')
    expect(isEncrypted(encrypted)).toBe(true)
    const decrypted = await decryptBytes(encrypted, 'correct horse battery staple')
    expect(new TextDecoder().decode(decrypted)).toBe('sensitive audit gap assessment narrative')
  })

  it('rejects the wrong passphrase', async () => {
    const original = new TextEncoder().encode('top secret')
    const encrypted = await encryptBytes(original, 'right-passphrase')
    await expect(decryptBytes(encrypted, 'wrong-passphrase')).rejects.toThrow(IncorrectPassphraseError)
  })

  it('does not flag plain (legacy, unencrypted) bytes as encrypted', () => {
    const plainSqliteHeader = new TextEncoder().encode('SQLite format 3\0')
    expect(isEncrypted(plainSqliteHeader)).toBe(false)
  })

  it('produces different ciphertext for the same plaintext each time (random salt/IV)', async () => {
    const original = new TextEncoder().encode('same input')
    const a = await encryptBytes(original, 'pw')
    const b = await encryptBytes(original, 'pw')
    expect(a).not.toEqual(b)
    expect(new TextDecoder().decode(await decryptBytes(a, 'pw'))).toBe('same input')
    expect(new TextDecoder().decode(await decryptBytes(b, 'pw'))).toBe('same input')
  })
})
