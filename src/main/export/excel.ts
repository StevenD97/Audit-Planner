import ExcelJS from 'exceljs'
import type { ExportDocument } from '../../shared/export'

export async function writeExcel(doc: ExportDocument, filePath: string): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Audit Planner'
  workbook.created = new Date(doc.generatedAt)

  const cover = workbook.addWorksheet('Overview')
  cover.getColumn(1).width = 100
  cover.addRow([doc.title]).font = { bold: true, size: 16 }
  if (doc.subtitle) cover.addRow([doc.subtitle]).font = { italic: true }
  cover.addRow([`Generated: ${new Date(doc.generatedAt).toLocaleString()}`])
  cover.addRow([])
  for (const section of doc.sections) {
    if (section.heading) {
      const r = cover.addRow([section.heading])
      r.font = { bold: true, size: 12 }
    }
    for (const p of section.paragraphs ?? []) {
      cover.addRow([p]).alignment = { wrapText: true }
    }
    if (section.table) cover.addRow([`See sheet: ${sheetName(section.table.title)}`])
    cover.addRow([])
  }

  for (const section of doc.sections) {
    if (!section.table) continue
    const sheet = workbook.addWorksheet(sheetName(section.table.title))
    sheet.addRow(section.table.columns).font = { bold: true }
    sheet.columns = section.table.columns.map(() => ({ width: 28 }))
    for (const row of section.table.rows) sheet.addRow(row)
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: section.table.columns.length } }
    sheet.views = [{ state: 'frozen', ySplit: 1 }]
  }

  await workbook.xlsx.writeFile(filePath)
}

function sheetName(title: string): string {
  return title.replace(/[\\/*?:[\]]/g, ' ').slice(0, 31)
}
