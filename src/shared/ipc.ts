import type {
  AuditProject,
  ChecklistItem,
  EvidencePlanItem,
  GapAssessment,
  ProgrammeSlot,
  ReadinessSnapshot,
  ReportRecord
} from './types'
import type { ExportDocument } from './export'
import type { EntityTable } from '../main/db/workspace'

export interface WorkspaceState {
  filePath: string | null
  auditProjects: AuditProject[]
  programmeSlots: ProgrammeSlot[]
  checklistItems: ChecklistItem[]
  evidencePlanItems: EvidencePlanItem[]
  gapAssessments: GapAssessment[]
  readinessSnapshots: ReadinessSnapshot[]
  reports: ReportRecord[]
}

export interface OpenResult {
  canceled: boolean
  state?: WorkspaceState
}

export interface SaveAsResult {
  canceled: boolean
  filePath?: string
}

export interface ExportResult {
  canceled: boolean
  filePath?: string
}

/** The typed surface exposed on `window.api` by the preload bridge. */
export interface PreloadApi {
  workspaceNew(): Promise<WorkspaceState>
  workspaceOpen(): Promise<OpenResult>
  workspaceSave(): Promise<SaveAsResult>
  workspaceSaveAs(): Promise<SaveAsResult>
  workspaceGetState(): Promise<WorkspaceState>
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
  workspaceSave: 'workspace:save',
  workspaceSaveAs: 'workspace:saveAs',
  workspaceGetState: 'workspace:getState',
  entityUpsert: 'entity:upsert',
  entityBulkUpsert: 'entity:bulkUpsert',
  entityRemove: 'entity:remove',
  exportDocument: 'export:document'
} as const
