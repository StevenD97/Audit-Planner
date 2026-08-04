import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './app/Layout'
import { useWorkspaceStore } from './store/workspaceStore'
import DashboardPage from './features/dashboard/DashboardPage'
import AuditWizardPage from './features/audit-wizard/AuditWizardPage'
import CalendarPage from './features/calendar/CalendarPage'
import ProcessExplorerPage from './features/process-explorer/ProcessExplorerPage'
import LegalCompliancePage from './features/legal-compliance/LegalCompliancePage'
import FindingsPage from './features/findings/FindingsPage'
import RiskRegisterPage from './features/risk-register/RiskRegisterPage'
import SamplingPlansPage from './features/sampling/SamplingPlansPage'
import MaturityPage from './features/maturity/MaturityPage'
import ProgrammeBuilderPage from './features/programme-builder/ProgrammeBuilderPage'
import ClauseExplorerPage from './features/clause-explorer/ClauseExplorerPage'
import ChecklistGeneratorPage from './features/checklist-generator/ChecklistGeneratorPage'
import EvidencePlannerPage from './features/evidence-planner/EvidencePlannerPage'
import ReadinessPage from './features/readiness/ReadinessPage'
import AuditTrailsPage from './features/audit-trails/AuditTrailsPage'
import ReportingPage from './features/reporting/ReportingPage'

export default function App(): JSX.Element {
  const init = useWorkspaceStore((s) => s.init)
  const loading = useWorkspaceStore((s) => s.loading)

  useEffect(() => {
    init()
  }, [init])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Loading Audit Planner…
      </div>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/wizard" element={<AuditWizardPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/processes" element={<ProcessExplorerPage />} />
        <Route path="/legal" element={<LegalCompliancePage />} />
        <Route path="/programme" element={<ProgrammeBuilderPage />} />
        <Route path="/clauses" element={<ClauseExplorerPage />} />
        <Route path="/checklist" element={<ChecklistGeneratorPage />} />
        <Route path="/sampling" element={<SamplingPlansPage />} />
        <Route path="/evidence" element={<EvidencePlannerPage />} />
        <Route path="/findings" element={<FindingsPage />} />
        <Route path="/risk-register" element={<RiskRegisterPage />} />
        <Route path="/readiness" element={<ReadinessPage />} />
        <Route path="/maturity" element={<MaturityPage />} />
        <Route path="/trails" element={<AuditTrailsPage />} />
        <Route path="/reporting" element={<ReportingPage />} />
      </Routes>
    </Layout>
  )
}
