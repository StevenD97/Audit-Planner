import { describe, it, expect } from 'vitest'
import { recommendSampleSize, recommendStratifiedSampleSizes } from '../src/shared/engine/sampling'

describe('recommendSampleSize', () => {
  it('returns zero for an empty population', () => {
    expect(recommendSampleSize(0, 'random')).toEqual({ sampleSize: 0, rationale: 'No population to sample from.' })
  })

  it('judgment sampling floors at 3 for a small population', () => {
    const result = recommendSampleSize(10, 'judgment')
    expect(result.sampleSize).toBe(3)
    expect(result.rationale).toContain('auditor selects')
  })

  it('risk-based sampling scales with stated risk level', () => {
    const low = recommendSampleSize(100, 'risk_based', 'low')
    const medium = recommendSampleSize(100, 'risk_based', 'medium')
    const high = recommendSampleSize(100, 'risk_based', 'high')
    expect(low.sampleSize).toBeLessThan(medium.sampleSize)
    expect(medium.sampleSize).toBeLessThan(high.sampleSize)
  })

  it('random sampling uses a smaller percentage for larger populations', () => {
    const small = recommendSampleSize(40, 'random')
    const large = recommendSampleSize(1000, 'random')
    expect(small.sampleSize / 40).toBeGreaterThan(large.sampleSize / 1000)
  })

  it('never recommends a sample larger than the population', () => {
    expect(recommendSampleSize(2, 'random').sampleSize).toBeLessThanOrEqual(2)
    expect(recommendSampleSize(1, 'risk_based', 'high').sampleSize).toBeLessThanOrEqual(1)
  })

  it('every rationale states the method plainly, including that it is a heuristic where relevant', () => {
    expect(recommendSampleSize(50, 'random').rationale).toContain('heuristic')
    expect(recommendSampleSize(50, 'judgment').rationale).toContain('not a statistical target')
  })
})

describe('recommendStratifiedSampleSizes', () => {
  it('samples roughly 10% of each stratum with a floor of 2', () => {
    const result = recommendStratifiedSampleSizes([
      { name: 'Site A', size: 100 },
      { name: 'Site B', size: 10 }
    ])
    expect(result).toEqual([
      { name: 'Site A', populationSize: 100, sampleSize: 10 },
      { name: 'Site B', populationSize: 10, sampleSize: 2 }
    ])
  })

  it('handles an empty stratum without producing a negative or NaN sample size', () => {
    const result = recommendStratifiedSampleSizes([{ name: 'Empty site', size: 0 }])
    expect(result[0].sampleSize).toBe(0)
  })
})
