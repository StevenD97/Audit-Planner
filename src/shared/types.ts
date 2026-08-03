// Shared domain types used by main process, preload bridge and renderer.
// Kept dependency-free (no Electron/DOM imports) so it can be unit tested
// and reused by the export generators running in the main process.

export type StandardId = 'iso14001' | 'iso45001'

export interface Standard {
  id: StandardId
  name: string
  fullTitle: string
  edition: string
  discipline: string
}

export type EvidenceCategory = 'procedure' | 'record' | 'monitoring_data' | 'competence' | 'other'
export type QuestionAudience = 'Top management' | 'Process owner' | 'Worker' | 'Worker representative' | 'Contractor'
export type QuestionType = 'open' | 'trace' | 'verification'
export type FindingSeverity = 'OFI' | 'Minor' | 'Major'
export type RelationshipType = 'feeds_into' | 'depends_on' | 'verified_by' | 'same_trail'
export type EquivalenceRelationship = 'equivalent' | 'partial_overlap' | 'analogous_concept'

export interface EvidenceItem {
  category: EvidenceCategory
  description: string
  typicalSource?: string
}

export interface InterviewQuestion {
  audienceRole: QuestionAudience
  question: string
  questionType: QuestionType
}

export interface AuditTest {
  description: string
}

export interface PotentialFinding {
  severityHint: FindingSeverity
  description: string
}

export interface RelatedClauseRef {
  clauseNumber: string
  relationship: RelationshipType
}

export interface CrossStandardEquivalence {
  standardId: StandardId
  clauseNumber: string
  relationship: EquivalenceRelationship
  note?: string
}

export interface RiskPrompt {
  prompt: string
  riskWeight: 1 | 2 | 3 | 4 | 5
}

export interface MandatoryDocumentedInfo {
  description: string
  kind: 'document' | 'record'
}

export interface Clause {
  id: string // `${standardId}-${clauseNumber}`
  standardId: StandardId
  clauseNumber: string
  parentClauseNumber?: string
  title: string
  sortOrder: number
  isContainer: boolean // true for structural parent clauses (e.g. "6", "6.1") with no direct auditable requirement
  requirementSummary: string
  explanation: string
  auditIntent: string
  processOwnerRoles: string[]
  assumptions?: string[]
  mandatoryDocumentedInfo: MandatoryDocumentedInfo[]
  evidenceRequired: EvidenceItem[]
  interviewQuestions: InterviewQuestion[]
  auditTests: AuditTest[]
  potentialFindings: PotentialFinding[]
  relatedClauses: RelatedClauseRef[]
  crossStandardEquivalents: CrossStandardEquivalence[]
  riskPrompts: RiskPrompt[]
}

export interface AuditTrailDefinition {
  id: string
  name: string
  description: string
  standardIds: StandardId[] | 'combined'
  steps: { standardId: StandardId; clauseNumber: string; note: string }[]
}

// ---- Audit project domain (persisted in the per-project .iaap SQLite file) ----

export type AuditType =
  | 'internal'
  | 'external_stage1'
  | 'external_stage2'
  | 'surveillance'
  | 'certification'

export type AuditProjectStatus = 'planning' | 'scheduled' | 'in_progress' | 'completed' | 'closed'

export interface Site {
  id: string
  name: string
  address?: string
}

export interface Department {
  id: string
  name: string
  siteId: string
  processOwner?: string
}

export interface AuditTeamMember {
  name: string
  role: string
}

export interface AuditProject {
  id: string
  name: string
  standards: StandardId[]
  scopeStatement: string
  sites: Site[]
  departments: Department[]
  auditType: AuditType
  startDate?: string
  endDate?: string
  durationDays?: number
  leadAuditor?: string
  auditTeam: AuditTeamMember[]
  status: AuditProjectStatus
  createdAt: string
  updatedAt: string
  /** Processes (from the Process Explorer) in scope for this audit, in addition to standard-driven clause scope. */
  processIds?: string[]
}

export type ProgrammeActivityType =
  | 'opening_meeting'
  | 'interview'
  | 'document_review'
  | 'site_inspection'
  | 'closing_meeting'
  | 'break'

export interface ProgrammeSlot {
  id: string
  auditProjectId: string
  dayNumber: number
  startTime: string
  endTime: string
  activityType: ProgrammeActivityType
  clauseIds: string[]
  processOwner?: string
  location?: string
  notes?: string
}

export type ChecklistStatus = 'pending' | 'answered' | 'na'
export type RiskLevel = 'low' | 'medium' | 'high'

export interface ChecklistItem {
  id: string
  auditProjectId: string
  clauseId: string
  question: string
  riskLevel: RiskLevel
  process?: string
  status: ChecklistStatus
  response?: string
  evidenceNotes?: string
}

export type EvidenceStatus = 'requested' | 'obtained' | 'not_available' | 'not_applicable'

export interface EvidencePlanItem {
  id: string
  auditProjectId: string
  clauseId: string
  category: EvidenceCategory
  description: string
  status: EvidenceStatus
  locationOwner?: string
  notes?: string
}

export type GapRating = 'conforms' | 'ofi' | 'minor_nc' | 'major_nc' | 'not_assessed'

export interface GapAssessment {
  id: string
  auditProjectId: string
  clauseId: string
  rating: GapRating
  narrative?: string
  recommendedAction?: string
  riskRating?: RiskLevel
  assessedBy?: string
  assessedAt?: string
}

export interface ReadinessSnapshot {
  id: string
  auditProjectId: string
  takenAt: string
  overallPct: number
  byClause: { clauseId: string; score: number }[]
  highRiskGaps: { clauseId: string; reason: string }[]
  recommendedActions: string[]
}

export type ReportType = 'audit_plan' | 'schedule' | 'prep_pack' | 'gap_report'
export type ReportFormat = 'xlsx' | 'pdf'

export interface ReportRecord {
  id: string
  auditProjectId: string
  reportType: ReportType
  format: ReportFormat
  filePath: string
  generatedAt: string
}

// ---- Process-centric organisational model (workspace-scoped master data,
// independent of any one audit project — see docs/AUDIT_INTELLIGENCE_PLATFORM_STRATEGY.md
// §3.1). Named `OrgSite`/`OrgDepartment` rather than reusing `Site`/`Department`
// above: those remain the ad hoc, audit-scope entries a wizard step edits
// per audit; these are the standing organisational hierarchy a Process hangs
// off, reusable across many audits. ----

export interface Organisation {
  id: string
  name: string
}

export interface Region {
  id: string
  organisationId: string
  name: string
}

export interface OrgSite {
  id: string
  organisationId: string
  regionId?: string
  name: string
  address?: string
}

export interface OrgDepartment {
  id: string
  siteId: string
  name: string
}

export interface OrgFunction {
  id: string
  departmentId: string
  name: string
}

export interface Process {
  id: string
  functionId: string
  name: string
  description?: string
  inputs: string[]
  activities: string[]
  outputs: string[]
  kpis: string[]
  /** Clauses this process is directly relevant to (beyond what its controls already evidence). */
  clauseIds: string[]
}

export interface Activity {
  id: string
  processId: string
  name: string
  description?: string
}

export type RiskCategory = 'environmental_aspect' | 'ohs_hazard' | 'compliance' | 'business'

export interface Risk {
  id: string
  processId: string
  category: RiskCategory
  description: string
  likelihood: 1 | 2 | 3 | 4 | 5
  severity: 1 | 2 | 3 | 4 | 5
}

export interface Control {
  id: string
  riskId: string
  description: string
  controlType?: string
  /** Which ISO clauses this control is the evidence trail for. */
  clauseIds: string[]
}
