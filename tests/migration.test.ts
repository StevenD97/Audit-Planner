import { describe, it, expect } from 'vitest'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'
import { Workspace } from '../src/main/db/workspace'
import type { AuditProject, Organisation, OrgSite, OrgDepartment } from '../src/shared/types'

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-planner-migration-'))

function makeProject(overrides: Partial<AuditProject> = {}): AuditProject {
  return {
    id: 'proj-1',
    name: 'Legacy Audit',
    standards: ['iso14001'],
    scopeStatement: '',
    sites: [{ id: 'site-1', name: 'Main Site', address: '1 Example Rd' }],
    departments: [{ id: 'dept-1', name: 'Maintenance', siteId: 'site-1' }],
    auditType: 'internal',
    auditTeam: [],
    status: 'planning',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  }
}

/**
 * Builds a workspace file that looks like it predates the schema v2 feature:
 * audit_projects data with embedded sites/departments, but with
 * `schema_version` reset to simulate "never migrated" (a real old file would
 * simply never have set it at all — resetting it here is equivalent, since
 * the migration guard only ever checks for equality with the current
 * version, not presence).
 */
async function createLegacyFile(fileName: string): Promise<string> {
  const ws = await Workspace.createNew()
  const project = makeProject()
  ws.upsert('audit_projects', project.id, { status: project.status, updatedAt: project.updatedAt }, project)
  ws.setSetting('schema_version', '0')
  const filePath = path.join(tmpDir, fileName)
  await ws.saveAs(filePath)
  return filePath
}

describe('schema v2 migration (org hierarchy backfill)', () => {
  it('lifts embedded sites/departments out into standalone org_sites/org_departments, preserving ids', async () => {
    const filePath = await createLegacyFile('legacy1.iaap')
    const reopenedWs = await Workspace.openFile(filePath)

    const orgs = reopenedWs.getAll<Organisation>('organisations')
    expect(orgs.length).toBeGreaterThan(0)

    const sites = reopenedWs.getAll<OrgSite>('org_sites')
    expect(sites).toContainEqual(
      expect.objectContaining({ id: 'site-1', name: 'Main Site', address: '1 Example Rd', organisationId: orgs[0].id })
    )

    const departments = reopenedWs.getAll<OrgDepartment>('org_departments')
    expect(departments).toContainEqual(expect.objectContaining({ id: 'dept-1', name: 'Maintenance', siteId: 'site-1' }))

    // Legacy embedded arrays are untouched (non-destructive).
    const projects = reopenedWs.getAll<AuditProject>('audit_projects')
    expect(projects[0].sites).toEqual(makeProject().sites)
    expect(projects[0].departments).toEqual(makeProject().departments)
  })

  it('is idempotent — reopening an already-migrated file does not duplicate org_sites', async () => {
    const filePath = await createLegacyFile('legacy2.iaap')

    const firstOpen = await Workspace.openFile(filePath)
    await firstOpen.saveAs(filePath)
    const secondOpen = await Workspace.openFile(filePath)

    expect(secondOpen.getAll<OrgSite>('org_sites').filter((s) => s.id === 'site-1')).toHaveLength(1)
    expect(secondOpen.getAll<Organisation>('organisations')).toHaveLength(1)
  })

  it('skips a department whose siteId points nowhere, rather than migrating orphaned data', async () => {
    const ws = await Workspace.createNew()
    const project = makeProject({
      departments: [{ id: 'dept-orphan', name: 'Orphan Dept', siteId: 'no-such-site' }]
    })
    ws.upsert('audit_projects', project.id, { status: project.status, updatedAt: project.updatedAt }, project)
    ws.setSetting('schema_version', '0')
    const filePath = path.join(tmpDir, 'legacy-orphan.iaap')
    await ws.saveAs(filePath)

    const reopened = await Workspace.openFile(filePath)
    expect(reopened.getAll<OrgDepartment>('org_departments')).toHaveLength(0)
  })
})
