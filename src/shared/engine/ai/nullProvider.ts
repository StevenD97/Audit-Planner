import * as recommender from '../recommender'
import type { AiProvider } from './provider'

/** Always available, always the default — the deterministic engine, unchanged. */
export const nullProvider: AiProvider = {
  id: 'none',
  label: 'Deterministic (built-in)',
  available: true,
  recommendQuestions: recommender.recommendQuestions,
  suggestAuditTrails: recommender.suggestAuditTrails,
  identifyWeakAreas: recommender.identifyWeakAreas,
  generateInterviewPlan: recommender.generateInterviewPlan,
  highlightMissingEvidence: recommender.highlightMissingEvidence,
  generateAgenda: recommender.generateAgenda,
  analysePatterns: recommender.analysePatterns
}
