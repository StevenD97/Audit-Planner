import { useEffect, useState } from 'react'
import type { BuildingOwnership, OrganisationContext } from '@shared/types'
import { TagListEditor } from '../../components/common'
import { useWorkspaceStore } from '../../store/workspaceStore'

/** Singleton row id — this page always upserts the same id, never a list. */
export const ORGANISATION_CONTEXT_ID = 'organisation-context'

const OWNERSHIP_OPTIONS: { id: BuildingOwnership; label: string }[] = [
  { id: 'owned', label: 'Owned outright' },
  { id: 'leased', label: 'Leased (single tenant)' },
  { id: 'multi_tenant', label: 'Multi-tenant / shared building' }
]

export default function OrganisationContextPage(): JSX.Element {
  const workspace = useWorkspaceStore((s) => s.workspace)
  const upsertEntity = useWorkspaceStore((s) => s.upsertEntity)
  const existing = workspace?.organisationContext[0]

  const [organisationName, setOrganisationName] = useState('')
  const [sector, setSector] = useState('')
  const [buildingOwnership, setBuildingOwnership] = useState<BuildingOwnership | ''>('')
  const [approximateHeadcount, setApproximateHeadcount] = useState<number | ''>('')
  const [numberOfFloors, setNumberOfFloors] = useState<number | ''>('')
  const [notableFacilities, setNotableFacilities] = useState<string[]>([])
  const [keyContractors, setKeyContractors] = useState<string[]>([])
  const [additionalContext, setAdditionalContext] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (existing) {
      setOrganisationName(existing.organisationName ?? '')
      setSector(existing.sector ?? '')
      setBuildingOwnership(existing.buildingOwnership ?? '')
      setApproximateHeadcount(existing.approximateHeadcount ?? '')
      setNumberOfFloors(existing.numberOfFloors ?? '')
      setNotableFacilities(existing.notableFacilities)
      setKeyContractors(existing.keyContractors)
      setAdditionalContext(existing.additionalContext ?? '')
    }
  }, [existing?.id])

  async function save(): Promise<void> {
    const data: OrganisationContext = {
      id: ORGANISATION_CONTEXT_ID,
      organisationName: organisationName || undefined,
      sector: sector || undefined,
      buildingOwnership: buildingOwnership || undefined,
      approximateHeadcount: approximateHeadcount === '' ? undefined : approximateHeadcount,
      numberOfFloors: numberOfFloors === '' ? undefined : numberOfFloors,
      notableFacilities,
      keyContractors,
      additionalContext: additionalContext || undefined,
      updatedAt: new Date().toISOString()
    }
    await upsertEntity('organisation_context', {}, data)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Organisation Profile</h1>
        <button className="btn-primary" onClick={save}>
          {saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>
      <p className="text-sm text-slate-500">
        Set this once — it&apos;s shown alongside the generic evidence examples throughout the Audit Wizard and the
        Audit Intelligence Engine, so you can read them against what&apos;s actually true here rather than a generic
        office.
      </p>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">About your organisation</h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            className="input"
            placeholder="Organisation name"
            value={organisationName}
            onChange={(e) => setOrganisationName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Sector / industry (e.g. Financial services)"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
          />
          <select
            className="input"
            value={buildingOwnership}
            onChange={(e) => setBuildingOwnership(e.target.value as BuildingOwnership | '')}
          >
            <option value="">Building ownership — select…</option>
            {OWNERSHIP_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            className="input"
            type="number"
            min={0}
            placeholder="Approximate headcount"
            value={approximateHeadcount}
            onChange={(e) => setApproximateHeadcount(e.target.value === '' ? '' : Number(e.target.value))}
          />
          <input
            className="input"
            type="number"
            min={0}
            placeholder="Number of floors / sites"
            value={numberOfFloors}
            onChange={(e) => setNumberOfFloors(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </div>
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Notable facilities</h2>
        <p className="text-xs text-slate-500">
          e.g. canteen, lifts, generators/UPS, car park, plant rooms, server room, loading bay, EV charging
        </p>
        <TagListEditor label="Facilities" items={notableFacilities} onChange={setNotableFacilities} />
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Key contractors</h2>
        <p className="text-xs text-slate-500">e.g. cleaning, security, catering, M&amp;E, waste, landscaping, pest control</p>
        <TagListEditor label="Contractors" items={keyContractors} onChange={setKeyContractors} />
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Additional context</h2>
        <textarea
          className="input min-h-[100px]"
          placeholder="Other external/internal issues relevant to this site — e.g. a listed building, hybrid-working patterns, an upcoming refurbishment…"
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
        />
      </section>
    </div>
  )
}
