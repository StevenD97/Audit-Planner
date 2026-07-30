import ExcelJS from 'exceljs'
import { createPdf } from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces'
import type { ExportDocument, ExportTable } from '@shared/export'

function sheetName(title: string): string {
  return title.replace(/[\\/*?:[\]]/g, ' ').slice(0, 31)
}

export async function buildExcelBlob(doc: ExportDocument): Promise<Blob> {
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

  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

function tableContent(table: ExportTable): Content {
  const body: TableCell[][] = [
    table.columns.map((c) => ({ text: c, bold: true, fillColor: '#0f766e', color: 'white' }) as TableCell),
    ...table.rows.map((row) => row.map((cell) => String(cell)) as TableCell[])
  ]
  return {
    table: { headerRows: 1, widths: table.columns.map(() => '*'), body },
    layout: { fillColor: (rowIndex: number) => (rowIndex === 0 ? null : rowIndex % 2 === 0 ? '#f8fafc' : null) },
    margin: [0, 4, 0, 12]
  }
}

export function buildPdfBlob(doc: ExportDocument): Promise<Blob> {
  const content: Content[] = [
    { text: doc.title, style: 'title' },
    ...(doc.subtitle ? [{ text: doc.subtitle, style: 'subtitle' } as Content] : []),
    { text: `Generated: ${new Date(doc.generatedAt).toLocaleString()}`, style: 'meta', margin: [0, 0, 0, 16] }
  ]
  for (const section of doc.sections) {
    if (section.heading) content.push({ text: section.heading, style: 'sectionHeading' })
    for (const p of section.paragraphs ?? []) content.push({ text: p, margin: [0, 0, 0, 8] })
    if (section.table) content.push(tableContent(section.table))
  }

  const docDefinition: TDocumentDefinitions = {
    content,
    styles: {
      title: { fontSize: 20, bold: true, color: '#0f766e', margin: [0, 0, 0, 4] },
      subtitle: { fontSize: 12, italics: true, margin: [0, 0, 0, 8] },
      meta: { fontSize: 9, color: '#64748b' },
      sectionHeading: { fontSize: 14, bold: true, margin: [0, 12, 0, 6] }
    },
    defaultStyle: { fontSize: 10 },
    pageMargins: [40, 40, 40, 40]
  }

  return new Promise((resolve, reject) => {
    try {
      createPdf(docDefinition, undefined, undefined, pdfFonts).getBlob((blob: Blob) => resolve(blob))
    } catch (err) {
      reject(err)
    }
  })
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
