/** Generic, presentation-agnostic document shape used by both export generators (Excel/PDF). */
export interface ExportTable {
  title: string
  columns: string[]
  rows: (string | number)[][]
}

export interface ExportSection {
  heading?: string
  paragraphs?: string[]
  table?: ExportTable
}

export interface ExportDocument {
  title: string
  subtitle?: string
  generatedAt: string
  sections: ExportSection[]
}
