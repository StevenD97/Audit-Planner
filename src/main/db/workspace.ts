import fs from 'node:fs'
import path from 'node:path'
import initSqlJs from 'sql.js'
import { SqlWorkspaceCore, type EntityTable } from '../../shared/workspaceEntities'
import { encryptBytes, decryptBytes, isEncrypted, NeedsPassphraseError } from '../../shared/crypto'

export type { EntityTable }
export { NeedsPassphraseError }

let sqlJsModulePromise: ReturnType<typeof initSqlJs> | null = null

function loadSqlJs() {
  if (!sqlJsModulePromise) {
    // sql.js's package.json has no "./package.json" export subpath, so resolve
    // via its main entry (dist/sql-wasm.js) instead and locate the wasm binary
    // alongside it.
    const sqlJsDist = path.dirname(require.resolve('sql.js'))
    sqlJsModulePromise = initSqlJs({
      locateFile: (file: string) => path.join(sqlJsDist, file)
    })
  }
  return sqlJsModulePromise
}

export class Workspace {
  private constructor(
    private core: SqlWorkspaceCore,
    public filePath: string | null,
    /** Held only in memory for this process's lifetime; never written to disk. */
    private passphrase: string | null
  ) {}

  static async createNew(): Promise<Workspace> {
    const SQL = await loadSqlJs()
    return new Workspace(new SqlWorkspaceCore(new SQL.Database()), null, null)
  }

  /**
   * Reads a file from disk. If it's passphrase-protected and no passphrase
   * is supplied, throws `NeedsPassphraseError` carrying the raw encrypted
   * bytes so the caller can prompt and retry via `fromDecryptedBytes`.
   */
  static async openFile(filePath: string, passphrase?: string): Promise<Workspace> {
    const bytes = new Uint8Array(fs.readFileSync(filePath))
    if (isEncrypted(bytes)) {
      if (!passphrase) throw new NeedsPassphraseError(bytes)
      const decrypted = await decryptBytes(bytes, passphrase)
      return Workspace.fromDecryptedBytes(decrypted, filePath, passphrase)
    }
    return Workspace.fromDecryptedBytes(bytes, filePath, null)
  }

  static async fromDecryptedBytes(
    bytes: Uint8Array,
    filePath: string,
    passphrase: string | null
  ): Promise<Workspace> {
    const SQL = await loadSqlJs()
    return new Workspace(new SqlWorkspaceCore(new SQL.Database(bytes)), filePath, passphrase)
  }

  get isEncrypted(): boolean {
    return this.passphrase !== null
  }

  /** Sets/changes/removes (pass null) passphrase protection for future saves. */
  setPassphrase(passphrase: string | null): void {
    this.passphrase = passphrase
  }

  private async exportBytes(): Promise<Uint8Array> {
    const raw = this.core.export()
    return this.passphrase ? encryptBytes(raw, this.passphrase) : raw
  }

  async saveAs(filePath: string): Promise<void> {
    fs.writeFileSync(filePath, Buffer.from(await this.exportBytes()))
    this.filePath = filePath
  }

  async save(): Promise<void> {
    if (!this.filePath) throw new Error('Workspace has no file path yet; use saveAs.')
    await this.saveAs(this.filePath)
  }

  close(): void {
    this.core.close()
  }

  upsert(table: EntityTable, id: string, row: Record<string, unknown>, data: unknown): void {
    this.core.upsert(table, id, row, data)
  }

  remove(table: EntityTable, id: string): void {
    this.core.remove(table, id)
  }

  getAll<T>(table: EntityTable, whereAuditProjectId?: string): T[] {
    return this.core.getAll<T>(table, whereAuditProjectId)
  }

  getSetting(key: string): string | null {
    return this.core.getSetting(key)
  }

  setSetting(key: string, value: string): void {
    this.core.setSetting(key, value)
  }
}
