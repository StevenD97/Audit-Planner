import { type ReactNode, useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useWorkspaceStore } from '../store/workspaceStore'
import AiAssistantPanel from '../features/ai-assistant/AiAssistantPanel'
import PassphraseModal from '../components/PassphraseModal'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/planner', label: 'Audit Planner', icon: '🗂️' },
  { to: '/processes', label: 'Process Explorer', icon: '🧭' },
  { to: '/legal', label: 'Legal & Compliance', icon: '⚖️' },
  { to: '/programme', label: 'Programme Builder', icon: '📅' },
  { to: '/clauses', label: 'Clause Explorer', icon: '📖' },
  { to: '/checklist', label: 'Checklist Generator', icon: '✅' },
  { to: '/evidence', label: 'Evidence Planner', icon: '🗃️' },
  { to: '/gap-assessment', label: 'Gap Assessment', icon: '📊' },
  { to: '/readiness', label: 'Readiness', icon: '🎯' },
  { to: '/trails', label: 'Audit Trails', icon: '🔗' },
  { to: '/reporting', label: 'Reporting', icon: '🖨️' }
]

export default function Layout({ children }: { children: ReactNode }): JSX.Element {
  const [collapsed, setCollapsed] = useState(false)
  const [dark, setDark] = useState(false)
  const [search, setSearch] = useState('')
  const workspace = useWorkspaceStore((s) => s.workspace)
  const toast = useWorkspaceStore((s) => s.toast)
  const aiPanelOpen = useWorkspaceStore((s) => s.aiPanelOpen)
  const setAiPanelOpen = useWorkspaceStore((s) => s.setAiPanelOpen)
  const openSetPassphraseModal = useWorkspaceStore((s) => s.openSetPassphraseModal)
  const { newWorkspace, openWorkspace, saveWorkspace, saveWorkspaceAs } = useWorkspaceStore()
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  useEffect(() => {
    window.menuEvents?.onNew(() => newWorkspace())
    window.menuEvents?.onOpen(() => openWorkspace())
    window.menuEvents?.onSave(() => saveWorkspace())
    window.menuEvents?.onSaveAs(() => saveWorkspaceAs())
  }, [newWorkspace, openWorkspace, saveWorkspace, saveWorkspaceAs])

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        document.getElementById('global-search')?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function onSearchSubmit(e: React.FormEvent): void {
    e.preventDefault()
    if (search.trim()) navigate(`/clauses?q=${encodeURIComponent(search.trim())}`)
  }

  const fileName = workspace?.filePath ? workspace.filePath.split(/[/\\]/).pop() : 'Untitled Workspace*'

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`flex flex-col border-r border-slate-200 bg-white transition-all dark:border-slate-700 dark:bg-slate-800 ${collapsed ? 'w-16' : 'w-60'}`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          {!collapsed && <span className="text-lg font-bold text-brand-700 dark:text-brand-400">Audit Planner</span>}
          <button className="btn-ghost !px-2" onClick={() => setCollapsed((c) => !c)} title="Toggle sidebar">
            {collapsed ? '»' : '«'}
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                }`
              }
            >
              <span>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-3">
          <button className="btn-secondary w-full justify-center" onClick={() => setAiPanelOpen(!aiPanelOpen)}>
            🤖 {!collapsed && 'Audit Intelligence Engine'}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <button className="btn-ghost" onClick={() => newWorkspace()}>
              New
            </button>
            <button className="btn-ghost" onClick={() => openWorkspace()}>
              Open
            </button>
            <button className="btn-ghost" onClick={() => saveWorkspace()}>
              Save
            </button>
            <button className="btn-ghost" onClick={() => saveWorkspaceAs()} title="Download/export a copy of this workspace">
              Save As
            </button>
            <button
              className="btn-ghost"
              onClick={() => openSetPassphraseModal()}
              title={workspace?.isEncrypted ? 'This workspace is passphrase-protected' : 'Protect this workspace with a passphrase'}
            >
              {workspace?.isEncrypted ? '🔒 Protected' : '🔓 Unprotected'}
            </button>
            <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">{fileName}</span>
          </div>
          <form onSubmit={onSearchSubmit} className="w-96">
            <input
              id="global-search"
              className="input"
              placeholder="Search clauses… (Ctrl/Cmd+K)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <div className="flex items-center gap-2">
            <button className="btn-ghost" onClick={() => setDark((d) => !d)}>
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 dark:bg-slate-900">{children}</main>
      </div>

      {aiPanelOpen && <AiAssistantPanel onClose={() => setAiPanelOpen(false)} />}

      <PassphraseModal />

      {toast && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
