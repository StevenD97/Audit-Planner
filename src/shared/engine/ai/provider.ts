import type {
  recommendQuestions,
  suggestAuditTrails,
  identifyWeakAreas,
  generateInterviewPlan,
  highlightMissingEvidence,
  generateAgenda,
  analysePatterns
} from '../recommender'

/**
 * Seam for swapping the deterministic recommender for an LLM-backed one
 * later (see docs/AUDIT_INTELLIGENCE_PLATFORM_STRATEGY.md §3.5) without
 * touching any UI code. `NullProvider` (the only implementation that
 * ships enabled) wraps the existing engine/recommender.ts functions
 * unchanged. A future provider (e.g. a local Ollama endpoint) implements
 * the same shape and is opt-in, off by default, and must leave the app
 * fully functional if unavailable.
 */
export interface AiProvider {
  readonly id: string
  readonly label: string
  readonly available: boolean
  recommendQuestions: typeof recommendQuestions
  suggestAuditTrails: typeof suggestAuditTrails
  identifyWeakAreas: typeof identifyWeakAreas
  generateInterviewPlan: typeof generateInterviewPlan
  highlightMissingEvidence: typeof highlightMissingEvidence
  generateAgenda: typeof generateAgenda
  analysePatterns: typeof analysePatterns
}
