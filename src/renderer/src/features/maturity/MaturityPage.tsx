import { newId } from '@shared/id'
import {
  MATURITY_DIMENSIONS,
  DIMENSION_LABELS,
  LEVEL_LABELS,
  latestScoreByDimension,
  computeOverallMaturity,
  generateImprovementRoadmap
} from '@shared/engine/maturity'
import type { MaturityAssessment, MaturityDimensionScore, MaturityDimension, MaturityLevel } from '@shared/types'
import { AuditProjectPicker, useCurrentAuditProject } from '../../components/common'
import { useWorkspaceStore } from '../../store/workspaceStore'

const CHART_LABELS: Record<MaturityDimension, string> = {
  leadership: 'Leadership',
  planning: 'Planning',
  risk_management: 'Risk Mgmt',
  competence: 'Competence',
  operational_control: 'Op. Control',
  performance_evaluation: 'Perf. Eval.',
  improvement: 'Improvement'
}

function SpiderChart({ scores }: { scores: Record<MaturityDimension, MaturityLevel> }): JSX.Element {
  const size = 260
  const center = size / 2
  const radius = size / 2 - 50
  const n = MATURITY_DIMENSIONS.length

  function pointFor(index: number, value: number): [number, number] {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2
    const r = (value / 5) * radius
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)]
  }

  const polygonPoints = MATURITY_DIMENSIONS.map((d, i) => pointFor(i, scores[d]).join(',')).join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[1, 2, 3, 4, 5].map((ring) => (
        <polygon
          key={ring}
          points={MATURITY_DIMENSIONS.map((_, i) => pointFor(i, ring).join(',')).join(' ')}
          fill="none"
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-700"
          strokeWidth={1}
        />
      ))}
      {MATURITY_DIMENSIONS.map((d, i) => {
        const [x, y] = pointFor(i, 6.4)
        const [x0, y0] = pointFor(i, 0)
        const anchor = x > center + 5 ? 'start' : x < center - 5 ? 'end' : 'middle'
        return (
          <g key={d}>
            <line x1={x0} y1={y0} x2={x} y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth={1} />
            <text x={x} y={y} fontSize={9} textAnchor={anchor} dominantBaseline="middle" className="fill-slate-500">
              {CHART_LABELS[d]}
            </text>
          </g>
        )
      })}
      <polygon points={polygonPoints} fill="#1F5FA833" stroke="#1F5FA8" strokeWidth={2} />
    </svg>
  )
}

function nowIso(): string {
  return new Date().toISOString()
}

export default function MaturityPage(): JSX.Element {
  const project = useCurrentAuditProject()
  const workspace = useWorkspaceStore((s) => s.workspace)
  const upsertEntity = useWorkspaceStore((s) => s.upsertEntity)

  if (!project) return <AuditProjectPicker />

  const assessments = (workspace?.maturityAssessments ?? []).filter((a) => a.auditProjectId === project.id)
  const latestAssessment = assessments.slice().sort((a, b) => b.takenAt.localeCompare(a.takenAt))[0]
  const scoresForAssessment = latestAssessment
    ? (workspace?.maturityDimensionScores ?? []).filter((s) => s.assessmentId === latestAssessment.id)
    : []

  const byDimension = latestScoreByDimension(scoresForAssessment)
  const overall = computeOverallMaturity(scoresForAssessment)
  const roadmap = generateImprovementRoadmap(scoresForAssessment)

  async function ensureAssessment(): Promise<MaturityAssessment> {
    if (latestAssessment) return latestAssessment
    const assessment: MaturityAssessment = { id: newId(), auditProjectId: project!.id, takenAt: nowIso() }
    await upsertEntity('maturity_assessments', { auditProjectId: project!.id }, assessment)
    return assessment
  }

  async function setLevel(dimension: MaturityDimension, level: MaturityLevel): Promise<void> {
    const assessment = await ensureAssessment()
    const existing = (workspace?.maturityDimensionScores ?? []).find(
      (s) => s.assessmentId === assessment.id && s.dimension === dimension
    )
    const score: MaturityDimensionScore = { id: existing?.id ?? newId(), assessmentId: assessment.id, dimension, level }
    await upsertEntity('maturity_dimension_scores', { assessmentId: assessment.id }, score)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Management System Maturity</h1>
      <AuditProjectPicker />
      <p className="text-sm text-slate-500">
        Rate each dimension 1 (Initial) to 5 (Optimised). The improvement roadmap below always targets the dimension
        with the most room to grow first.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        <div className="card flex flex-col items-center">
          <p className="text-sm text-slate-500">Overall maturity</p>
          <p className="text-3xl font-bold text-brand-600 dark:text-brand-400">{overall.toFixed(1)} / 5</p>
          <SpiderChart scores={byDimension} />
        </div>

        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">Rate each dimension</h2>
          <div className="space-y-3">
            {MATURITY_DIMENSIONS.map((dimension) => (
              <div key={dimension} className="flex items-center gap-3">
                <span className="w-48 shrink-0 text-sm">{DIMENSION_LABELS[dimension]}</span>
                <div className="flex gap-1">
                  {([1, 2, 3, 4, 5] as MaturityLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setLevel(dimension, level)}
                      className={`h-8 w-8 rounded-lg text-xs font-semibold ${
                        byDimension[dimension] === level
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600'
                      }`}
                      title={LEVEL_LABELS[level]}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-400">{LEVEL_LABELS[byDimension[dimension]]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">Improvement roadmap (biggest opportunity first)</h2>
        <div className="space-y-2">
          {roadmap.map((item) => (
            <div key={item.dimension} className="rounded-lg border border-slate-100 p-3 dark:border-slate-700">
              <p className="font-medium">
                {DIMENSION_LABELS[item.dimension]} — {LEVEL_LABELS[item.currentLevel]}
                {item.nextLevel && <span className="text-slate-400"> → {LEVEL_LABELS[item.nextLevel]}</span>}
              </p>
              <p className="mt-1 text-xs text-slate-500">{item.guidance}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
