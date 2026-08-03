import type { MaturityDimension, MaturityLevel, MaturityDimensionScore } from '../types'

export const MATURITY_DIMENSIONS: MaturityDimension[] = [
  'leadership',
  'planning',
  'risk_management',
  'competence',
  'operational_control',
  'performance_evaluation',
  'improvement'
]

export const DIMENSION_LABELS: Record<MaturityDimension, string> = {
  leadership: 'Leadership',
  planning: 'Planning',
  risk_management: 'Risk Management',
  competence: 'Competence',
  operational_control: 'Operational Control',
  performance_evaluation: 'Performance Evaluation',
  improvement: 'Improvement'
}

export const LEVEL_LABELS: Record<MaturityLevel, string> = {
  1: 'Initial',
  2: 'Reactive',
  3: 'Defined',
  4: 'Proactive',
  5: 'Optimised'
}

/** Guidance for moving from a given level to the next one, per dimension. Level 5 has no entry — there's nowhere further to climb, only to sustain. */
const IMPROVEMENT_GUIDANCE: Record<MaturityDimension, Partial<Record<Exclude<MaturityLevel, 5>, string>>> = {
  leadership: {
    1: 'Establish a documented policy and assign top-management accountability for the management system.',
    2: 'Integrate the management system into business planning cycles; top management actively participates in reviews.',
    3: 'Top management proactively drives improvement targets and resources them ahead of external pressure (audits/incidents).',
    4: 'Leadership behaviours and system integration are benchmarked and continuously refined against best practice.'
  },
  planning: {
    1: 'Identify significant risks/aspects and legal obligations informally, reacting to issues as they arise.',
    2: 'Maintain a documented risk/aspect register and objectives with assigned owners and target dates.',
    3: 'Planning anticipates emerging risks and regulatory change before they become obligations or incidents.',
    4: 'Planning is data-driven, trend-based and integrated with enterprise risk management.'
  },
  risk_management: {
    1: 'Risks are identified reactively, typically after an incident or audit finding.',
    2: 'A structured risk register exists with likelihood/severity ratings reviewed at defined intervals.',
    3: 'Risk controls are proactively tested and adjusted based on leading indicators, not just after failures.',
    4: 'Risk management is predictive, using trend data across sites/processes to pre-empt emerging risk.'
  },
  competence: {
    1: 'Basic role-based training is delivered but not systematically tracked.',
    2: 'A competence matrix defines required training per role, with records maintained and monitored for expiry.',
    3: 'Competence is verified through observed performance, not just training attendance.',
    4: 'Competence development is proactive, anticipating future role/skill needs across the organisation.'
  },
  operational_control: {
    1: 'Controls exist informally, relying on individual knowledge rather than documented procedures.',
    2: 'Documented procedures and controls exist for significant risks/aspects, with defined process owners.',
    3: 'Controls are monitored for effectiveness and adjusted proactively (e.g. management of change is systematic).',
    4: 'Operational controls are continuously optimised using data from monitoring, findings and near-misses.'
  },
  performance_evaluation: {
    1: 'Monitoring is ad hoc, mostly reactive to incidents or complaints.',
    2: 'Defined monitoring/measurement plans exist with scheduled internal audits and management review.',
    3: 'Performance data is trended and used to proactively adjust objectives and resourcing.',
    4: 'Performance evaluation drives continual improvement decisions across the organisation, benchmarked externally.'
  },
  improvement: {
    1: 'Corrective actions are raised but closure is inconsistent and not tracked to completion.',
    2: 'A structured corrective action process exists with root cause analysis and verified closure.',
    3: 'Recurring findings are systematically analysed to prevent, not just correct, nonconformities.',
    4: 'Improvement is embedded as a continuous, proactive practice, driven by trend/predictive analysis.'
  }
}

/** Latest score per dimension (defaults to level 1 "Initial" for any dimension not yet assessed). */
export function latestScoreByDimension(scores: MaturityDimensionScore[]): Record<MaturityDimension, MaturityLevel> {
  const result = {} as Record<MaturityDimension, MaturityLevel>
  for (const dimension of MATURITY_DIMENSIONS) result[dimension] = 1
  for (const score of scores) result[score.dimension] = score.level
  return result
}

export function computeOverallMaturity(scores: MaturityDimensionScore[]): number {
  const byDimension = latestScoreByDimension(scores)
  const total = MATURITY_DIMENSIONS.reduce((sum, d) => sum + byDimension[d], 0)
  return Math.round((total / MATURITY_DIMENSIONS.length) * 10) / 10
}

export interface ImprovementRoadmapItem {
  dimension: MaturityDimension
  currentLevel: MaturityLevel
  nextLevel: MaturityLevel | null
  guidance: string
}

/** Sorted lowest-level-first — the biggest opportunity leads the roadmap. Dimensions already at level 5 get a "sustain" note instead of a climb target. */
export function generateImprovementRoadmap(scores: MaturityDimensionScore[]): ImprovementRoadmapItem[] {
  const byDimension = latestScoreByDimension(scores)
  return MATURITY_DIMENSIONS.map((dimension) => {
    const currentLevel = byDimension[dimension]
    if (currentLevel >= 5) {
      return { dimension, currentLevel, nextLevel: null, guidance: 'Already optimised — focus on sustaining and periodically re-validating this dimension.' }
    }
    const nextLevel = (currentLevel + 1) as MaturityLevel
    const guidance = IMPROVEMENT_GUIDANCE[dimension][currentLevel as Exclude<MaturityLevel, 5>]!
    return { dimension, currentLevel, nextLevel, guidance }
  }).sort((a, b) => a.currentLevel - b.currentLevel)
}
