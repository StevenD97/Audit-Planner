import type { AuditTrailDefinition, Clause, StandardId } from '../types'
import { auditTrails, getClause, resolveRelatedClauses } from '../knowledge-base'

/** Canonical, curated trails applicable to the standards selected for an audit. */
export function suggestCanonicalTrails(standardIds: StandardId[]): AuditTrailDefinition[] {
  return auditTrails.filter(
    (t) => t.standardIds === 'combined' || t.standardIds.some((s) => standardIds.includes(s))
  )
}

export interface CustomTrailStep {
  clause: Clause
  depth: number
}

/**
 * Builds a custom trail by walking the related-clause graph outward from a
 * seed clause (breadth-first, deduplicated), up to maxDepth hops. This is
 * how the AI Assistant proposes organization-specific trails beyond the
 * fixed catalogue — e.g. starting from whichever clause scored worst in the
 * latest gap assessment.
 */
export function buildCustomTrail(seed: Clause, maxDepth = 3): CustomTrailStep[] {
  const visited = new Set<string>([seed.id])
  const result: CustomTrailStep[] = [{ clause: seed, depth: 0 }]
  let frontier: Clause[] = [seed]

  for (let depth = 1; depth <= maxDepth; depth++) {
    const next: Clause[] = []
    for (const clause of frontier) {
      for (const related of resolveRelatedClauses(clause)) {
        if (visited.has(related.id)) continue
        visited.add(related.id)
        result.push({ clause: related, depth })
        next.push(related)
      }
    }
    frontier = next
    if (frontier.length === 0) break
  }

  return result
}

export function resolveTrailClauses(trail: AuditTrailDefinition): Clause[] {
  return trail.steps.map((s) => getClause(s.standardId, s.clauseNumber)).filter((c): c is Clause => Boolean(c))
}
