import { describe, it, expect } from 'vitest'
import { PROCESS_LIBRARY } from '../src/shared/process-library'
import { getClauseById } from '../src/shared/knowledge-base'

describe('starter process library', () => {
  it('has at least 8 processes, each with a unique libraryId', () => {
    expect(PROCESS_LIBRARY.length).toBeGreaterThanOrEqual(8)
    const ids = PROCESS_LIBRARY.map((p) => p.libraryId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every clause reference (process-level and control-level) resolves to a real clause', () => {
    for (const process of PROCESS_LIBRARY) {
      for (const clauseId of process.clauseIds) {
        expect(getClauseById(clauseId), `${process.libraryId}: process clause ${clauseId}`).toBeDefined()
      }
      for (const risk of process.risks) {
        for (const control of risk.controls) {
          for (const clauseId of control.clauseIds) {
            expect(getClauseById(clauseId), `${process.libraryId}: control clause ${clauseId}`).toBeDefined()
          }
        }
      }
    }
  })

  it('every process has at least one risk, and every risk has at least one control', () => {
    for (const process of PROCESS_LIBRARY) {
      expect(process.risks.length, process.libraryId).toBeGreaterThan(0)
      for (const risk of process.risks) {
        expect(risk.controls.length, `${process.libraryId}: ${risk.description}`).toBeGreaterThan(0)
      }
    }
  })
})
