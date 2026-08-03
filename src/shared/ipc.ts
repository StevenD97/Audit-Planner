import type {
  AuditProject,
  ChecklistItem,
  EvidencePlanItem,
  GapAssessment,
  ProgrammeSlot,
  ReadinessSnapshot,
  ReportRecord,
  Organisation,
  Region,
  OrgSite,
  OrgDepartment,
  OrgFunction,
  Process,
  Activity,
  Risk,
  Control,
  Legislation,
  ComplianceObligation,
  ComplianceEvaluation,
  AuditFinding,
  RootCauseAnalysis,
  CorrectiveAction,
  SamplingPlan,
  MaturityAssessment,
  MaturityDimensionScore
} from './types'
import type { ExportDocument } from './export'
import type { EntityTable } from './workspaceEntities'

export interface WorkspaceState {
  filePath: string | null
  /** Whether the *currently open* workspace has a passphrase set for its saves. */
  isEncrypted: boolean
  auditProjects: AuditProject[]
  programmeSlots: ProgrammeSlot[]
  checklistItems: ChecklistItem[]
  evidencePlanItems: EvidencePlanItem[]
  gapAssessments: GapAssessment[]
  readinessSnapshots: ReadinessSnapshot[]
  reports: ReportRecord[]
  organisations: Organisation[]
  regions: Region[]
  orgSites: OrgSite[]
  orgDepartments: OrgDepartment[]
  orgFunctions: OrgFunction[]
  processes: Process[]
  activities: Activity[]
  risks: Risk[]
  controls: Control[]
  legislation: Legislation[]
  complianceObligations: ComplianceObligation[]
  complianceEvaluations: ComplianceEvaluation[]
  auditFindings: AuditFinding[]
  rootCauseAnalyses: RootCauseAnalysis[]
  correctiveActions: CorrectiveAction[]
  samplingPlans: SamplingPlan[]
  maturityAssessments: MaturityAssessment[]
  maturityDimensionScores: MaturityDimensionScore[]
}

export interface OpenResult {
  canceled: boolean
  state?: WorkspaceState
  /** True when the picked/uploaded file is passphrase-protected — call `workspaceUnlock` next. */
  needsPassphrase?: boolean
}

export interface SaveAsResult {
  canceled: boolean
  filePath?: string
}

export interface ExportResult {
  canceled: boolean
  filePath?: string
}

export interface UnlockResult {
  success: boolean
  state?: WorkspaceState
  /** Human-readable reason the unlock failed (wrong passphrase, no pending file, etc). */
  error?: string
}

/** The typed surface exposed on `window.api` by the preload bridge. */
export interface PreloadApi {
  workspaceNew(): Promise<WorkspaceState>
  workspaceOpen(): Promise<OpenResult>
  /** Call after `workspaceOpen`/`workspaceUnlock` reports `needsPassphrase`. */
  workspaceUnlock(passphrase: string): Promise<UnlockResult>
  workspaceSave(): Promise<SaveAsResult>
  workspaceSaveAs(): Promise<SaveAsResult>
  workspaceGetState(): Promise<WorkspaceState>
  /** Sets (or, passing null, removes) passphrase protection for the currently open workspace's future saves. */
  workspaceSetPassphrase(passphrase: string | null): Promise<{ ok: boolean }>
  entityUpsert(table: EntityTable, id: string, row: Record<string, unknown>, data: unknown): Promise<void>
  entityBulkUpsert(
    items: { table: EntityTable; id: string; row: Record<string, unknown>; data: unknown }[]
  ): Promise<void>
  entityRemove(table: EntityTable, id: string): Promise<void>
  exportDocument(format: 'xlsx' | 'pdf', doc: ExportDocument, suggestedName: string): Promise<ExportResult>
}

export const IPC_CHANNELS = {
  workspaceNew: 'workspace:new',
  workspaceOpen: 'workspace:open',
  workspaceUnlock: 'workspace:unlock',
  workspaceSave: 'workspace:save',
  workspaceSaveAs: 'workspace:saveAs',
  workspaceGetState: 'workspace:getState',
  workspaceSetPassphrase: 'workspace:setPassphrase',
  entityUpsert: 'entity:upsert',
  entityBulkUpsert: 'entity:bulkUpsert',
  entityRemove: 'entity:remove',
  exportDocument: 'export:document'
} as const
