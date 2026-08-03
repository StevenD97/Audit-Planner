import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './app/Layout'
import { useWorkspaceStore } from './store/workspaceStore'
import DashboardPage from './features/dashboard/DashboardPage'
import AuditPlannerPage from './features/audit-planner/AuditPlannerPage'
import ProcessExplorerPage from './features/process-explorer/ProcessExplorerPage'
import LegalCompliancePage from './features/legal-compliance/LegalCompliancePage'
import ProgrammeBuilderPage from './features/programme-builder/ProgrammeBuilderPage'
import ClauseExplorerPage from './features/clause-explorer/ClauseExplorerPage'
import ChecklistGeneratorPage from './features/checklist-generator/ChecklistGeneratorPage'
import EvidencePlannerPage from './features/evidence-planner/EvidencePlannerPage'
import GapAssessmentPage from './features/gap-assessment/GapAssessmentPage'
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
        <Route path="/planner" element={<AuditPlannerPage />} />
        <Route path="/processes" element={<ProcessExplorerPage />} />
        <Route path="/legal" element={<LegalCompliancePage />} />
        <Route path="/programme" element={<ProgrammeBuilderPage />} />
        <Route path="/clauses" element={<ClauseExplorerPage />} />
        <Route path="/checklist" element={<ChecklistGeneratorPage />} />
        <Route path="/evidence" element={<EvidencePlannerPage />} />
        <Route path="/gap-assessment" element={<GapAssessmentPage />} />
        <Route path="/readiness" element={<ReadinessPage />} />
        <Route path="/trails" element={<AuditTrailsPage />} />
        <Route path="/reporting" element={<ReportingPage />} />
      </Routes>
    </Layout>
  )
}
