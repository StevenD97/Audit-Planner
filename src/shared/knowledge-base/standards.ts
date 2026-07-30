import type { Standard } from '../types'

export const standards: Standard[] = [
  {
    id: 'iso14001',
    name: 'ISO 14001',
    fullTitle: 'Environmental management systems — Requirements with guidance for use',
    edition: 'BS EN ISO 14001:2026 (4th edition; supersedes 2015+A1:2024)',
    discipline: 'Environmental'
  },
  {
    id: 'iso45001',
    name: 'ISO 45001',
    fullTitle: 'Occupational health and safety management systems — Requirements with guidance for use',
    edition: 'BS EN ISO 45001:2018, incorporating Amendment 1:2024 (BS EN ISO 45001:2023+A1:2024)',
    discipline: 'OH&S'
  }
]
