import type { RiskLevel, SamplingMethodType, SamplingArtefactTypeValue } from '../types'

export const ARTEFACT_LABELS: Record<SamplingArtefactTypeValue, string> = {
  training_records: 'Training records',
  inspections: 'Inspections',
  permits: 'Permits',
  contractors: 'Contractors',
  incident_investigations: 'Incident investigations',
  competence_records: 'Competence records'
}

/** Guidance for what to prioritise within the sample, per artefact type — used alongside the numeric sample size, not instead of it. */
export const ARTEFACT_GUIDANCE: Record<SamplingArtefactTypeValue, string> = {
  training_records:
    'Sample across roles and recency — prioritise roles tied to high-risk activities and any training that has recently expired or been renewed.',
  inspections:
    'Sample across locations/equipment types and time periods — prioritise overdue or recently-failed inspections.',
  permits:
    'Sample active and recently-closed permits — prioritise high-risk permit types (hot work, confined space, isolation).',
  contractors:
    'Sample across contractor companies and risk categories — prioritise any contractor with a prior incident or finding.',
  incident_investigations:
    'Sample across severity levels and root-cause methods used — prioritise repeat incident types.',
  competence_records:
    'Sample across roles and certification types — prioritise safety-critical competencies and any nearing expiry.'
}

export interface SampleRecommendation {
  sampleSize: number
  rationale: string
}

/**
 * Practical sample-size guidance per method — explicitly a pragmatic
 * heuristic (percentage-of-population with sensible floors), not a formal
 * statistical confidence-interval calculation. Said plainly in every
 * rationale string rather than implying more rigour than is actually here.
 */
export function recommendSampleSize(
  populationSize: number,
  method: SamplingMethodType,
  riskLevel: RiskLevel = 'medium'
): SampleRecommendation {
  if (populationSize <= 0) return { sampleSize: 0, rationale: 'No population to sample from.' }

  if (method === 'judgment') {
    const sampleSize = Math.min(populationSize, Math.max(3, Math.ceil(populationSize * 0.05)))
    return {
      sampleSize,
      rationale: `Judgment sampling: the auditor selects ${sampleSize} item(s) based on experience and known risk areas, not a formula — this is a floor suggestion (minimum 3, or 5% of the population), not a statistical target.`
    }
  }

  if (method === 'risk_based') {
    const pct = riskLevel === 'high' ? 0.25 : riskLevel === 'medium' ? 0.15 : 0.08
    const sampleSize = Math.min(populationSize, Math.max(3, Math.ceil(populationSize * pct)))
    return {
      sampleSize,
      rationale: `Risk-based sampling at ${riskLevel} risk: ${Math.round(pct * 100)}% of the population (minimum 3), weighted toward the highest-risk items first.`
    }
  }

  if (method === 'random') {
    const pct = populationSize <= 50 ? 0.2 : populationSize <= 200 ? 0.1 : 0.05
    const sampleSize = Math.min(populationSize, Math.max(5, Math.ceil(populationSize * pct)))
    return {
      sampleSize,
      rationale: `Simple random sampling heuristic: ${Math.round(pct * 100)}% of a population of ${populationSize} (minimum 5), each item selected with equal probability — a practical approximation, not a formal confidence-interval calculation.`
    }
  }

  // stratified (flat estimate; see recommendStratifiedSampleSizes for a real per-stratum breakdown)
  const sampleSize = Math.min(populationSize, Math.max(3, Math.ceil(populationSize * 0.1)))
  return {
    sampleSize,
    rationale: `Stratified sampling: the population is divided into strata (e.g. by site, role or risk category), each sampled proportionally (~10%, minimum 3 per stratum) — use per-stratum sizing for the actual plan once strata are defined.`
  }
}

export interface Stratum {
  name: string
  size: number
}

export interface StratumSample {
  name: string
  populationSize: number
  sampleSize: number
}

/** Proportional (~10%, minimum 2) sample size per stratum, for when the population is naturally grouped (by site, role, risk category, ...). */
export function recommendStratifiedSampleSizes(strata: Stratum[]): StratumSample[] {
  return strata.map((s) => ({
    name: s.name,
    populationSize: s.size,
    sampleSize: s.size <= 0 ? 0 : Math.min(s.size, Math.max(2, Math.ceil(s.size * 0.1)))
  }))
}
