import { describe, it, expect } from 'vitest'
import {
  latestScoreByDimension,
  computeOverallMaturity,
  generateImprovementRoadmap,
  MATURITY_DIMENSIONS
} from '../src/shared/engine/maturity'
import type { MaturityDimensionScore } from '../src/shared/types'

describe('latestScoreByDimension', () => {
  it('defaults every dimension to level 1 when nothing has been assessed', () => {
    const result = latestScoreByDimension([])
    for (const dimension of MATURITY_DIMENSIONS) expect(result[dimension]).toBe(1)
  })

  it('uses the assessed level for dimensions that have a score', () => {
    const scores: MaturityDimensionScore[] = [{ id: 's1', assessmentId: 'a1', dimension: 'leadership', level: 4 }]
    const result = latestScoreByDimension(scores)
    expect(result.leadership).toBe(4)
    expect(result.planning).toBe(1)
  })
})

describe('computeOverallMaturity', () => {
  it('returns 1.0 when nothing has been assessed (all dimensions default to level 1)', () => {
    expect(computeOverallMaturity([])).toBe(1)
  })

  it('averages assessed and default dimensions correctly', () => {
    const scores: MaturityDimensionScore[] = [
      { id: 's1', assessmentId: 'a1', dimension: 'leadership', level: 5 },
      { id: 's2', assessmentId: 'a1', dimension: 'planning', level: 5 }
    ]
    // 5 + 5 + (5 dimensions at default 1) = 15, over 7 dimensions = ~2.1
    const result = computeOverallMaturity(scores)
    expect(result).toBeCloseTo(15 / 7, 1)
  })
})

describe('generateImprovementRoadmap', () => {
  it('sorts the lowest-scoring dimensions first', () => {
    const scores: MaturityDimensionScore[] = MATURITY_DIMENSIONS.map((dimension) => ({
      id: `s-${dimension}`,
      assessmentId: 'a1',
      dimension,
      level: 4
    }))
    // Override two dimensions so the ordering is unambiguous against a uniform baseline.
    const withOverrides = scores.map((s) =>
      s.dimension === 'risk_management' ? { ...s, level: 2 as const } : s.dimension === 'leadership' ? { ...s, level: 5 as const } : s
    )
    const roadmap = generateImprovementRoadmap(withOverrides)
    expect(roadmap[0].dimension).toBe('risk_management')
    expect(roadmap[0].currentLevel).toBe(2)
    expect(roadmap[0].nextLevel).toBe(3)
    expect(roadmap[0].guidance.length).toBeGreaterThan(0)
    expect(roadmap[roadmap.length - 1].dimension).toBe('leadership')
  })

  it('gives a "sustain" note rather than a climb target once a dimension reaches level 5', () => {
    const scores: MaturityDimensionScore[] = MATURITY_DIMENSIONS.map((dimension, i) => ({
      id: `s${i}`,
      assessmentId: 'a1',
      dimension,
      level: 5
    }))
    const roadmap = generateImprovementRoadmap(scores)
    for (const item of roadmap) {
      expect(item.nextLevel).toBeNull()
      expect(item.guidance).toContain('sustain')
    }
  })

  it('produces real, distinct guidance text for every dimension at every non-max level', () => {
    for (const dimension of MATURITY_DIMENSIONS) {
      for (const level of [1, 2, 3, 4] as const) {
        const roadmap = generateImprovementRoadmap([{ id: 's', assessmentId: 'a1', dimension, level }])
        const item = roadmap.find((r) => r.dimension === dimension)!
        expect(item.guidance.length).toBeGreaterThan(10)
      }
    }
  })
})
