import { describe, it, expect, afterAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { Workspace, NeedsPassphraseError } from '../src/main/db/workspace'
import { IncorrectPassphraseError } from '../src/shared/crypto'

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-planner-workspace-'))

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

function readHeader(filePath: string, n = 16): Buffer {
  const fd = fs.openSync(filePath, 'r')
  const buf = Buffer.alloc(n)
  fs.readSync(fd, buf, 0, n, 0)
  fs.closeSync(fd)
  return buf
}

describe('main-process Workspace (real file I/O, same class the desktop app uses)', () => {
  it('saves a brand-new workspace as plain (unencrypted) SQLite by default', async () => {
    const ws = await Workspace.createNew()
    const filePath = path.join(tmpDir, 'plain.iaap')
    await ws.saveAs(filePath)
    expect(readHeader(filePath, 15).toString('utf8')).toBe('SQLite format 3')
    expect(ws.isEncrypted).toBe(false)
  })

  it('encrypts on save once a passphrase is set, and the file no longer looks like SQLite', async () => {
    const ws = await Workspace.createNew()
    ws.setPassphrase('correct horse battery staple')
    const filePath = path.join(tmpDir, 'encrypted.iaap')
    await ws.saveAs(filePath)
    const header = readHeader(filePath, 8).toString('utf8')
    expect(header).toBe('IAAPENC1')
    expect(header).not.toBe('SQLite f')
    expect(ws.isEncrypted).toBe(true)
  })

  it('round-trips real audit data through an encrypted save/open cycle', async () => {
    const ws = await Workspace.createNew()
    ws.setPassphrase('hunter2-but-longer')
    ws.upsert('audit_projects', 'proj-1', { status: 'planning', updatedAt: '2026-01-01' }, {
      id: 'proj-1',
      name: 'Sensitive Site Audit',
      status: 'planning'
    })
    const filePath = path.join(tmpDir, 'roundtrip.iaap')
    await ws.saveAs(filePath)

    await expect(Workspace.openFile(filePath)).rejects.toThrow(NeedsPassphraseError)

    const reopened = await Workspace.openFile(filePath, 'hunter2-but-longer')
    expect(reopened.isEncrypted).toBe(true)
    const projects = reopened.getAll<{ id: string; name: string }>('audit_projects')
    expect(projects).toEqual([{ id: 'proj-1', name: 'Sensitive Site Audit', status: 'planning' }])
  })

  it('rejects opening an encrypted file with the wrong passphrase', async () => {
    const ws = await Workspace.createNew()
    ws.setPassphrase('the-real-passphrase')
    const filePath = path.join(tmpDir, 'wrongpass.iaap')
    await ws.saveAs(filePath)
    await expect(Workspace.openFile(filePath, 'not-the-passphrase')).rejects.toThrow(IncorrectPassphraseError)
  })

  it('removing protection (setPassphrase(null)) makes the next save plain again', async () => {
    const ws = await Workspace.createNew()
    ws.setPassphrase('temporary')
    const filePath = path.join(tmpDir, 'unprotect.iaap')
    await ws.saveAs(filePath)
    expect(readHeader(filePath, 8).toString('utf8')).toBe('IAAPENC1')

    ws.setPassphrase(null)
    await ws.saveAs(filePath)
    expect(readHeader(filePath, 15).toString('utf8')).toBe('SQLite format 3')
    expect(ws.isEncrypted).toBe(false)
  })

  it('opens a legacy (pre-encryption-feature) plaintext .iaap file with no passphrase needed', async () => {
    const ws = await Workspace.createNew()
    const filePath = path.join(tmpDir, 'legacy.iaap')
    await ws.saveAs(filePath)
    const reopened = await Workspace.openFile(filePath)
    expect(reopened.isEncrypted).toBe(false)
  })
})
