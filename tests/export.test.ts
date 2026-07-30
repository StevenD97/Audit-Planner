import { describe, it, expect, afterAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { writeExcel } from '../src/main/export/excel'
import { writePdf } from '../src/main/export/pdf'
import type { ExportDocument } from '@shared/export'

const doc: ExportDocument = {
  title: 'Test Audit Plan',
  subtitle: 'ISO 14001 + ISO 45001',
  generatedAt: new Date('2026-01-01T00:00:00Z').toISOString(),
  sections: [
    { heading: 'Scope', paragraphs: ['Covers Site A manufacturing operations.'] },
    {
      heading: 'Sites',
      table: { title: 'Sites', columns: ['Site', 'Address'], rows: [['Site A', '1 Main St']] }
    }
  ]
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-planner-export-'))

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('export generators', () => {
  it('writes a non-empty .xlsx file', async () => {
    const filePath = path.join(tmpDir, 'plan.xlsx')
    await writeExcel(doc, filePath)
    expect(fs.existsSync(filePath)).toBe(true)
    expect(fs.statSync(filePath).size).toBeGreaterThan(0)
  })

  it('writes a non-empty .pdf file', async () => {
    const filePath = path.join(tmpDir, 'plan.pdf')
    await writePdf(doc, filePath)
    expect(fs.existsSync(filePath)).toBe(true)
    const buf = fs.readFileSync(filePath)
    expect(buf.slice(0, 4).toString()).toBe('%PDF')
  })
})
