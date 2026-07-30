import initSqlJs from 'sql.js/dist/sql-wasm.js'
// Deep-importing the exact same dist file the desktop build uses (rather than
// letting the bundler pick sql.js's "browser" package.json condition) so the
// JS glue and the .wasm binary are guaranteed to be the matching pair — see
// src/main/db/workspace.ts for the Node-side equivalent.
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { SqlWorkspaceCore, type EntityTable } from '@shared/workspaceEntities'
import { encryptBytes, decryptBytes, isEncrypted, NeedsPassphraseError } from '@shared/crypto'
import { idbGet, idbSet } from './idb'

export type { EntityTable }
export { NeedsPassphraseError }

const AUTOSAVE_KEY = 'current-workspace'

let sqlJsModulePromise: ReturnType<typeof initSqlJs> | null = null

function loadSqlJs() {
  if (!sqlJsModulePromise) {
    sqlJsModulePromise = initSqlJs({ locateFile: () => sqlWasmUrl })
  }
  return sqlJsModulePromise
}

export class BrowserWorkspace {
  private constructor(
    private core: SqlWorkspaceCore,
    /** Display-only name; there is no real filesystem path in a browser. */
    public displayName: string | null,
    /** Held only in memory for this tab's lifetime; never written to IndexedDB or a file. */
    private passphrase: string | null
  ) {}

  static async createNew(): Promise<BrowserWorkspace> {
    const SQL = await loadSqlJs()
    return new BrowserWorkspace(new SqlWorkspaceCore(new SQL.Database()), null, null)
  }

  /**
   * Loads an uploaded/picked file's bytes. If passphrase-protected and none
   * supplied, throws `NeedsPassphraseError` carrying the raw bytes so the
   * caller can prompt and retry via `fromDecryptedBytes`.
   */
  static async fromBytes(bytes: Uint8Array, displayName: string, passphrase?: string): Promise<BrowserWorkspace> {
    if (isEncrypted(bytes)) {
      if (!passphrase) throw new NeedsPassphraseError(bytes)
      const decrypted = await decryptBytes(bytes, passphrase)
      return BrowserWorkspace.fromDecryptedBytes(decrypted, displayName, passphrase)
    }
    return BrowserWorkspace.fromDecryptedBytes(bytes, displayName, null)
  }

  static async fromDecryptedBytes(
    bytes: Uint8Array,
    displayName: string | null,
    passphrase: string | null
  ): Promise<BrowserWorkspace> {
    const SQL = await loadSqlJs()
    return new BrowserWorkspace(new SqlWorkspaceCore(new SQL.Database(bytes)), displayName, passphrase)
  }

  /**
   * Reloads whatever was last autosaved to this browser's IndexedDB, if
   * anything. Throws `NeedsPassphraseError` the same way `fromBytes` does
   * when the autosaved copy is passphrase-protected.
   */
  static async fromAutosave(): Promise<BrowserWorkspace | null> {
    const saved = await idbGet<{ bytes: Uint8Array; displayName: string | null }>(AUTOSAVE_KEY)
    if (!saved) return null
    if (isEncrypted(saved.bytes)) throw new NeedsPassphraseError(saved.bytes)
    return BrowserWorkspace.fromDecryptedBytes(saved.bytes, saved.displayName, null)
  }

  get isEncrypted(): boolean {
    return this.passphrase !== null
  }

  /** Sets/changes/removes (pass null) passphrase protection for future saves. */
  setPassphrase(passphrase: string | null): void {
    this.passphrase = passphrase
  }

  async exportBytes(): Promise<Uint8Array> {
    const raw = this.core.export()
    return this.passphrase ? encryptBytes(raw, this.passphrase) : raw
  }

  async persistToIndexedDb(): Promise<void> {
    await idbSet(AUTOSAVE_KEY, { bytes: await this.exportBytes(), displayName: this.displayName })
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
}
