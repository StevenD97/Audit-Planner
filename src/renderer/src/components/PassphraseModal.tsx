import { useState } from 'react'
import { useWorkspaceStore } from '../store/workspaceStore'

/**
 * Handles both flows: setting/changing/removing passphrase protection for
 * the currently open workspace, and unlocking a passphrase-protected
 * workspace that was just opened/restored. See docs/ARCHITECTURE.md §10 for
 * the threat model this is (and isn't) covering.
 */
export default function PassphraseModal(): JSX.Element | null {
  const modal = useWorkspaceStore((s) => s.passphraseModal)
  const isEncrypted = useWorkspaceStore((s) => s.workspace?.isEncrypted ?? false)
  const closePassphraseModal = useWorkspaceStore((s) => s.closePassphraseModal)
  const submitUnlockPassphrase = useWorkspaceStore((s) => s.submitUnlockPassphrase)
  const submitSetPassphrase = useWorkspaceStore((s) => s.submitSetPassphrase)

  const [passphrase, setPassphrase] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  if (!modal) return null

  async function handleUnlock(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setBusy(true)
    await submitUnlockPassphrase(passphrase)
    setBusy(false)
    setPassphrase('')
  }

  async function handleSet(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setLocalError(null)
    if (passphrase.length < 8) {
      setLocalError('Use at least 8 characters.')
      return
    }
    if (passphrase !== confirm) {
      setLocalError('Passphrases do not match.')
      return
    }
    setBusy(true)
    await submitSetPassphrase(passphrase)
    setBusy(false)
    setPassphrase('')
    setConfirm('')
  }

  async function handleRemove(): Promise<void> {
    setBusy(true)
    await submitSetPassphrase(null)
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800">
        {modal.mode === 'unlock' ? (
          <form onSubmit={handleUnlock}>
            <h2 className="mb-1 text-lg font-semibold">🔒 Enter passphrase</h2>
            <p className="mb-4 text-sm text-slate-500">
              This workspace is passphrase-protected. Enter the passphrase to unlock it.
            </p>
            <input
              autoFocus
              type="password"
              className="input"
              placeholder="Passphrase"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
            />
            {modal.error && <p className="mt-2 text-sm text-status-major">{modal.error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => closePassphraseModal()}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={busy || !passphrase}>
                {busy ? 'Unlocking…' : 'Unlock'}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <h2 className="mb-1 text-lg font-semibold">{isEncrypted ? '🔒 Change protection' : '🔓 Protect this workspace'}</h2>
            <p className="mb-4 text-sm text-slate-500">
              {isEncrypted
                ? 'Set a new passphrase, or remove protection entirely.'
                : 'Recommended if this workspace holds sensitive audit data. Everything saved to disk will be encrypted (AES-256-GCM) and unreadable without this passphrase.'}
            </p>
            <p className="mb-4 rounded-lg bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              There is no password recovery — this passphrase is never stored anywhere. If you lose it, this
              workspace's data cannot be recovered. Keep it somewhere safe (e.g. your organization's password
              manager).
            </p>
            <form onSubmit={handleSet} className="space-y-3">
              <input
                autoFocus
                type="password"
                className="input"
                placeholder="New passphrase (min. 8 characters)"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
              />
              <input
                type="password"
                className="input"
                placeholder="Confirm passphrase"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              {localError && <p className="text-sm text-status-major">{localError}</p>}
              <div className="flex items-center justify-between pt-1">
                <div>
                  {isEncrypted && (
                    <button type="button" className="btn-ghost text-red-600" onClick={handleRemove} disabled={busy}>
                      Remove protection
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-ghost" onClick={() => closePassphraseModal()}>
                    {isEncrypted ? 'Cancel' : 'Skip for now'}
                  </button>
                  <button type="submit" className="btn-primary" disabled={busy || !passphrase}>
                    {busy ? 'Saving…' : 'Set passphrase'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
