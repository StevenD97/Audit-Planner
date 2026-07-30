import fs from 'node:fs'
// pdfmake's browser-style bundle also works fine under Node; it embeds base64
// font data via vfs_fonts rather than requiring filesystem font paths, which
// avoids bundling/locating .ttf files across platforms for this desktop app.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfMake = require('pdfmake/build/pdfmake')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const vfsFonts = require('pdfmake/build/vfs_fonts')
import type { ExportDocument, ExportTable } from '../../shared/export'
import type { Content, TableCell } from 'pdfmake/interfaces'

pdfMake.vfs = vfsFonts.pdfMake ? vfsFonts.pdfMake.vfs : vfsFonts.vfs

function tableContent(table: ExportTable): Content {
  const body: TableCell[][] = [
    table.columns.map((c) => ({ text: c, bold: true, fillColor: '#0f766e', color: 'white' }) as TableCell),
    ...table.rows.map((row) => row.map((cell) => String(cell)) as TableCell[])
  ]
  return {
    table: {
      headerRows: 1,
      widths: table.columns.map(() => '*'),
      body
    },
    layout: {
      fillColor: (rowIndex: number) => (rowIndex === 0 ? null : rowIndex % 2 === 0 ? '#f8fafc' : null)
    },
    margin: [0, 4, 0, 12]
  }
}

export async function writePdf(doc: ExportDocument, filePath: string): Promise<void> {
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

  const docDefinition = {
    content,
    styles: {
      title: { fontSize: 20, bold: true, color: '#0f766e', margin: [0, 0, 0, 4] },
      subtitle: { fontSize: 12, italics: true, margin: [0, 0, 0, 8] },
      meta: { fontSize: 9, color: '#64748b' },
      sectionHeading: { fontSize: 14, bold: true, margin: [0, 12, 0, 6] }
    },
    defaultStyle: { fontSize: 10 },
    pageMargins: [40, 40, 40, 40] as [number, number, number, number]
  }

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = pdfMake.createPdf(docDefinition)
      pdfDoc.getBuffer((buffer: Buffer) => {
        fs.writeFileSync(filePath, buffer)
        resolve()
      })
    } catch (err) {
      reject(err)
    }
  })
}
