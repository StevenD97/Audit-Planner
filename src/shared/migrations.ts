import type { SqlWorkspaceCore } from './workspaceEntities'
import type { AuditProject, Organisation, Region, OrgSite, OrgDepartment } from './types'
import { newId } from './id'

const SCHEMA_VERSION = '2'

/**
 * One-time, additive, non-destructive migration to the process-centric
 * organisational model (docs/AUDIT_INTELLIGENCE_PLATFORM_STRATEGY.md §5):
 * new tables already exist unconditionally (CREATE TABLE IF NOT EXISTS in
 * workspaceSchema.ts runs on every open regardless of version) — the only
 * real data transformation needed is lifting the ad hoc `sites`/`departments`
 * arrays embedded on each audit_projects row out into standalone, reusable
 * `org_sites`/`org_departments` records, preserving their original ids.
 * Legacy `audit_projects.sites`/`.departments` are left untouched — this
 * never deletes or rewrites existing data, only adds.
 *
 * Idempotent and cheap to call unconditionally on every workspace open
 * (guarded by the `schema_version` setting so it only does real work once
 * per file).
 */
export function runSchemaV2Migration(core: SqlWorkspaceCore): void {
  if (core.getSetting('schema_version') === SCHEMA_VERSION) return

  let org = core.getAll<Organisation>('organisations')[0]
  if (!org) {
    org = { id: newId(), name: 'My Organisation' }
    core.upsert('organisations', org.id, {}, org)
  }

  let region = core.getAll<Region>('regions').find((r) => r.organisationId === org!.id)
  if (!region) {
    region = { id: newId(), organisationId: org.id, name: 'Default Region' }
    core.upsert('regions', region.id, { organisationId: region.organisationId }, region)
  }

  const existingSiteIds = new Set(core.getAll<OrgSite>('org_sites').map((s) => s.id))
  const existingDeptIds = new Set(core.getAll<OrgDepartment>('org_departments').map((d) => d.id))

  for (const project of core.getAll<AuditProject>('audit_projects')) {
    for (const site of project.sites ?? []) {
      if (existingSiteIds.has(site.id)) continue
      const orgSite: OrgSite = {
        id: site.id,
        organisationId: org.id,
        regionId: region.id,
        name: site.name,
        address: site.address
      }
      core.upsert('org_sites', orgSite.id, { organisationId: orgSite.organisationId }, orgSite)
      existingSiteIds.add(site.id)
    }
    for (const dept of project.departments ?? []) {
      if (existingDeptIds.has(dept.id) || !existingSiteIds.has(dept.siteId)) continue
      const orgDept: OrgDepartment = { id: dept.id, siteId: dept.siteId, name: dept.name }
      core.upsert('org_departments', orgDept.id, { siteId: orgDept.siteId }, orgDept)
      existingDeptIds.add(dept.id)
    }
  }

  core.setSetting('schema_version', SCHEMA_VERSION)
}
