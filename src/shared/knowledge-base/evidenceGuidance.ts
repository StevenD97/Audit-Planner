/**
 * Example evidence for each clause's interview questions, written for a
 * corporate office / facilities management context specifically (cleaning,
 * security, catering and M&E contractors; landlord/shared-building
 * arrangements; energy, waste and water in an office setting) rather than
 * manufacturing or heavy industry, which is what most generic ISO audit
 * checklists assume.
 *
 * Keyed by `${clauseId}::${questionIndex}` — the index of the question
 * within that clause's `interviewQuestions` array (see knowledge-base/iso*
 * files). Index-based rather than matching question text verbatim, so a
 * later wording tweak to a question doesn't silently break the lookup.
 *
 * This is guidance to prompt where to look, not a definitive checklist —
 * every office is set up differently.
 */

const EVIDENCE_GUIDANCE: Record<string, string> = {
  // ---- ISO 14001 ----
  'iso14001-4.1::0':
    "A PESTLE or SWOT-style register covering energy prices, waste/recycling regulation, landlord/lease sustainability clauses, and climate risks to the building (e.g. flooding, extreme heat affecting cooling demand) — reviewed at least annually.",
  'iso14001-4.1::1':
    'Version history or a review log on the context register showing the date of the last update and what triggered it — e.g. a new EPC rating, a landlord green-lease clause, or a change of waste contractor.',
  'iso14001-4.1::2':
    'A section of the context register specifically addressing climate risk to the building (cooling demand in heatwaves, water restrictions) and resource security (energy price volatility, consumables supply).',
  'iso14001-4.2::0':
    'An interested parties register listing the landlord, local authority, building occupiers, and cleaning/security/catering contractors, with a column showing which expectations became formal compliance obligations (e.g. lease sustainability clauses, waste duty of care).',
  'iso14001-4.2::1':
    'A dated example — e.g. the landlord introducing a new recycling segregation requirement, or a client RFP requiring a carbon reduction commitment — and the resulting update to a procedure or objective.',
  'iso14001-4.3::0':
    'The EMS scope statement plus a floor plan or lease schedule showing exactly which floors/areas are included, and a note on anything excluded (e.g. a sub-let floor outside your operational control).',
  'iso14001-4.3::1':
    'Compare the scope wording on the certificate, EMS manual, and any public sustainability statement — they should all say the same thing.',
  'iso14001-4.4::0':
    'A process map or RACI showing how the EMS touches procurement (green purchasing), HR (induction/training), and the facilities helpdesk (job requests that trigger environmental controls, e.g. a leak or spill).',
  'iso14001-5.1::0':
    "Top management's own objectives/KPIs (e.g. a signed-off carbon or waste-diversion target) plus a resourcing decision they made, such as approving a recycling contract, LED upgrade, or EV charger install.",
  'iso14001-5.1::1':
    'A budget or capital approval (email, PO, or business case) for something like LED relamping, a BMS upgrade, or extra recycling bins, with the environmental driver stated.',
  'iso14001-5.1::2':
    'Intranet posts, all-staff emails, digital signage, or town-hall slides where a director discusses environmental performance — not just the policy poster in reception.',
  'iso14001-5.2::0':
    "Ask a receptionist or office coordinator to show you where the policy is displayed/accessible (intranet, noticeboard) and paraphrase what it commits the organisation to.",
  'iso14001-5.2::1':
    "The policy document's version-control footer showing the review date, cross-referenced to management review minutes discussing why it changed (e.g. adding a net-zero commitment).",
  'iso14001-5.3::0':
    'The FM/facilities job description or a RACI showing named authority to halt a contractor activity (e.g. a chemical spill, or waste going to general instead of recycling), plus a real example of it being used.',
  'iso14001-6.1.1::0':
    'The combined aspects/obligations/risk register, plus a short narrative or diagram showing how an aspect (e.g. paper use) links through to a risk/opportunity and an objective.',
  'iso14001-6.1.2::0':
    'The aspects register with a consistent scoring methodology (e.g. likelihood x severity x scale) — ask to see the scoring behind something like general waste volume or energy use.',
  'iso14001-6.1.2::1':
    'Ask a facilities or cleaning team member which of their daily tasks (handling confidential waste, cleaning chemicals, print room operation) they would flag as environmentally significant.',
  'iso14001-6.1.2::2':
    'A fit-out or refurbishment brief showing an environmental design checklist item (LED specification, recycled materials, water-efficient sanitaryware) signed off before works started.',
  'iso14001-6.1.3::0':
    "A legal-register update log or subscription to a legislation update service, with a dated example of a new requirement being added — e.g. an SECR reporting change or updated waste regulations.",
  'iso14001-6.1.3::1':
    "For an office this is often a waste duty-of-care transfer note requirement linked to the collection schedule, or a trade-effluent consent for a staff restaurant linked to grease-trap servicing records.",
  'iso14001-6.1.4::0':
    "Ask directly — a strong answer names something specific (energy price volatility, landlord non-cooperation on sustainability, reputational risk from a poor waste audit), not just \"whatever's on the register\".",
  'iso14001-6.1.5::0':
    "For a significant aspect like general waste, the action plan (e.g. 'introduce segregated recycling on floor 3'), a named owner, a target date, and before/after data (recycling rate %) showing it worked.",
  'iso14001-6.2.1::0':
    "Trace one objective (e.g. 'reduce paper use by 20%') back to the aspect (print volume) or obligation (SECR reporting) that justified setting it.",
  'iso14001-6.2.2::0':
    'A resourced action plan — budget line, named owner, timeline — for an objective, e.g. funding approved for a print-management system or extra recycling bins.',
  'iso14001-6.3::0':
    'For the last office move, refurbishment, or new contractor onboarding, evidence the environmental impact was assessed beforehand (a change-assessment form or fit-out checklist), not written up afterwards.',
  'iso14001-7.1::0':
    'Ask directly, and cross-check the answer against any unresourced action sitting open in the objectives action plan or aspects register.',
  'iso14001-7.2::0':
    'Training records (induction pack, e-learning completion, toolbox talk register) for environmental awareness or waste segregation, plus how competence was checked — e.g. a quiz, or a supervisor spot-check of bin contents.',
  'iso14001-7.2::1':
    'A training needs matrix linking specific roles (cleaning supervisor, print room operator) to the significant aspects they affect.',
  'iso14001-7.3::0':
    "Ask a general staff member or a cleaning/security contractor what could go wrong if the waste segregation or spill procedure wasn't followed — a good answer shows real understanding, not just poster recall.",
  'iso14001-7.4.1::0':
    "A logged external enquiry or complaint — e.g. a neighbour's noise complaint about deliveries, or a tenant query about recycling — with a recorded response and closure.",
  'iso14001-7.4.2::0':
    "An intranet suggestion scheme, staff forum, or green-champions network entry showing an environmental suggestion (e.g. 'add a compost bin to the kitchen') and what happened to it.",
  'iso14001-7.4.3::0':
    'An SECR report, ESOS compliance notification, sustainability report, or landlord ESG questionnaire response, with the submission date.',
  'iso14001-7.5.1::0':
    'A documented-information index showing the rationale — e.g. waste segregation is a laminated poster (competence-based) while a legionella control scheme is a formal written procedure (risk-based).',
  'iso14001-7.5.2::0':
    'A document control log or approval workflow (e.g. sign-off by the FM manager or SHE advisor) for the current version of a procedure such as the waste management plan.',
  'iso14001-7.5.3::0':
    "Ask a member of staff to actually pull up the current recycling procedure or spill-response card from the intranet/QR code — check it isn't an out-of-date printed copy pinned to a wall.",
  'iso14001-8.1::0':
    'For an office this might be printer toner/cartridge handling limits, cleaning-chemical storage limits, or BMS setpoints for heating/cooling — show the documented limit and what happens if it is exceeded (an alarm or escalation).',
  'iso14001-8.1::1':
    'A contractor induction pack, method statement sign-off, or a clause in the cleaning/M&E contract requiring waste segregation and approved chemicals — with evidence it is actually issued before work starts.',
  'iso14001-8.2::0':
    'Ask a cleaner or facilities assistant to describe the spill response (spill kit location, who to call, evacuation if needed) and check it matches the written procedure.',
  'iso14001-8.2::1':
    'A fire/evacuation drill record (date, attendance, observations) and a follow-up action log showing what was fixed afterwards — e.g. a blocked fire exit or unclear assembly point.',
  'iso14001-9.1.1::0':
    'Utility/BMS data (electricity, gas, water) reviewed monthly, with an example of a spike triggering an investigation — e.g. a stuck-open air handling unit or after-hours lighting left on.',
  'iso14001-9.1.1::1':
    'Calibration certificates for any metered equipment (sub-meters, BMS sensors) or waste-weighing scales, with the calibration due date visible.',
  'iso14001-9.1.2::0':
    'A compliance evaluation record (e.g. an annual legal register review) for something like SECR/ESOS reporting deadlines or waste carrier licence renewal, with the date of the last check.',
  'iso14001-9.2.1::0':
    "An internal audit checklist that includes your own site-specific procedures (e.g. the waste segregation SOP) alongside the standard's clauses, not just a generic template.",
  'iso14001-9.2.2::0':
    'The audit programme/schedule showing higher-risk areas (waste handling, contractor management) audited more frequently than lower-risk ones (general office recycling).',
  'iso14001-9.2.2::1':
    "The audit programme showing auditors are never assigned to their own area — e.g. the FM coordinator doesn't audit their own waste contract.",
  'iso14001-9.3.1::0':
    'Management review minutes or a calendar record showing the frequency (typically annual, sometimes quarterly) and the outcome/actions from the last one.',
  'iso14001-9.3.2::0':
    'Ask directly — a common honest answer for an office EMS is compiling external-issue changes or interested-party feedback, since these are tracked less routinely than compliance status or objective progress.',
  'iso14001-9.3.3::0':
    "A specific management review action with an owner and date (e.g. 'approve budget for EV charging points') and evidence it was actioned, not just minuted.",
  'iso14001-10.1::0':
    'An initiative that was not triggered by an audit finding or complaint — e.g. proactively switching to a lower-carbon waste contractor, or a green-champions scheme reducing single-use plastics in the kitchen.',
  'iso14001-10.2::0':
    "A completed root-cause analysis (5 Whys or similar) for something like a recycling contamination incident or a missed compliance deadline, with the corrective action linked back to the root cause, not just the symptom.",
  'iso14001-10.2::1':
    'Evidence the same issue (e.g. mixed waste streams) was checked across other floors/sites, not just fixed where it was originally found.',

  // ---- ISO 45001 ----
  'iso45001-4.1::0':
    'A context register covering things like lone working for out-of-hours facilities staff, hybrid/home-working ergonomics, and climate-related risks such as heat stress in plant rooms or extreme weather affecting commuting.',
  'iso45001-4.2::0':
    'A staff survey, safety committee minutes, or a documented consultation (e.g. on DSE assessments or building access) showing workers or their representative were actually asked, not just informed.',
  'iso45001-4.3::0':
    'For a multi-tenant office building, the scope statement plus any agreement with the landlord/managing agent on shared-area responsibilities (fire safety, lifts, shared plant rooms).',
  'iso45001-4.4::0':
    'A process map showing how OH&S touches HR (onboarding, occupational health referrals) and the facilities helpdesk (hazard reports, DSE requests).',
  'iso45001-5.1::0':
    'A specific action — attending a safety committee meeting, walking the building with the FM team, reviewing accident/near-miss trends personally — not just a signed policy.',
  'iso45001-5.1::1':
    "A 'no blame'/fair-culture policy statement, plus a real example of a near-miss report that named a process or supervisor decision without the reporter facing any repercussion.",
  'iso45001-5.1::2':
    'Safety committee minutes showing management attendance, actions being closed out, and evidence a committee recommendation actually changed something — e.g. relocating a trip hazard.',
  'iso45001-5.2::0':
    'Ask a general staff member to paraphrase the OH&S policy — check it is accessible (intranet, noticeboard), not just filed.',
  'iso45001-5.3::0':
    'Ask a worker directly; a strong answer names a real example — refusing a faulty ladder, stopping contractor work on an unguarded opening — and confirms no negative consequence followed.',
  'iso45001-5.4::0':
    'A sign-off sheet or meeting minutes showing worker/representative input was captured on a risk assessment (DSE, lone working, a new floor layout) before it was finalised, not just circulated after.',
  'iso45001-5.4::1':
    'Safety committee minutes or a consultation log showing a raised obstacle (e.g. shift patterns preventing attendance) and what was done about it — e.g. rotating meeting times.',
  'iso45001-5.4::2':
    'Evidence workers or their reps had input into what the internal audit programme covers — e.g. a suggestion to audit lone-working arrangements for evening cleaners.',
  'iso45001-6.1.1::0':
    'For a temporary change like an office move, a floor refurbishment, or a shutdown for M&E works, a risk assessment dated before the work started — not written up afterwards to fill a gap.',
  'iso45001-6.1.3::0':
    'A legal-register update log or subscription service, with an example of new/changed legislation (e.g. updated fire safety guidance or DSE regulations) being incorporated, dated.',
  'iso45001-6.1.4::0':
    'For a specific risk (manual handling of deliveries, working at height for window/light access), a documented rationale for why the chosen control (a trolley, a scissor-lift booking) was picked over elimination or substitution.',
  'iso45001-6.2.1::0':
    "Safety committee minutes or a sign-off showing worker representatives had input into this year's OH&S objectives — e.g. reducing DSE-related complaints, or improving fire warden coverage.",
  'iso45001-6.2.2::0':
    'A budget approval or purchase order for something like ergonomic equipment, fire warden training, or a lone-working alarm system, tied to the objective.',
  'iso45001-7.1::0':
    'Ask directly — common honest gaps in an office are things like a sit-stand desk, better lighting, or PPE for facilities/maintenance staff.',
  'iso45001-7.2::0':
    'Training records for role-specific hazard awareness — manual handling for post-room staff, working-at-height for facilities technicians, fire warden training — with a check of effectiveness such as a practical assessment or drill performance.',
  'iso45001-7.3::0':
    'Ask a worker directly whether they know they can stop an immediately dangerous task (a suspected gas leak, an unstable ceiling tile) and confirm the policy protects them for doing so.',
  'iso45001-7.4.1::0':
    'A visitor sign-in process including a safety briefing card or induction video, and a separate contractor induction pack covering site-specific hazards (fire exits, permit-to-work areas, welfare facilities).',
  'iso45001-7.4.2::0':
    'An intranet hazard-reporting tool, suggestion box, or safety committee log showing a worker-raised suggestion (e.g. better lighting in a stairwell) and its outcome.',
  'iso45001-7.4.3::0':
    'RIDDOR report submissions (or a log confirming none were required), with dates — the clearest evidence trail for an office.',
  'iso45001-7.5.1::0':
    'A rationale — e.g. fire evacuation procedures are formally documented (life-safety critical) while routine desk-based tasks rely on induction and competence.',
  'iso45001-7.5.2::0':
    'A document control log or approval trail (e.g. SHE advisor or FM manager sign-off) for the current fire risk assessment or safe system of work.',
  'iso45001-7.5.3::0':
    "Ask a worker representative to pull up the current risk assessment for their area via the intranet or QR code, confirming it isn't an outdated printed copy.",
  'iso45001-8.1.1::0':
    'A service level agreement or coordination log with the landlord/managing agent covering shared-area fire safety, lift maintenance, and emergency response roles.',
  'iso45001-8.1.2::0':
    'For a specific task (handling cleaning chemicals, changing light fittings), evidence a higher-level control was considered first — a safer chemical, a guarded fitting, a scissor lift instead of a stepladder — before PPE was issued.',
  'iso45001-8.1.3::0':
    'A management-of-change form for a shift-pattern change (e.g. moving cleaning to daytime) or workforce change (e.g. reduced out-of-hours security cover), assessed for OH&S impact before implementation.',
  'iso45001-8.2::0':
    "Ask a general staff member their fire warden/evacuation role and check it matches the fire evacuation plan/floor warden list.",
  'iso45001-8.2::1':
    "A record of liaison with the local fire service or the building's emergency planning team — e.g. a fire brigade familiarisation visit or a drill debrief shared with the landlord.",
  'iso45001-9.1.1::0':
    'Leading indicators such as near-miss reporting rate, DSE assessment completion %, fire drill participation, or overdue action closure rate — not just lagging incident counts.',
  'iso45001-9.1.2::0':
    'Statutory inspection records — fire risk assessment review date, lift (LOLER) inspection certificate, fixed electrical (EICR) test, or PAT testing schedule — with the date of the last formal legal compliance check.',
  'iso45001-9.2.1::0':
    "An internal audit checklist that tests against your own site-specific procedures (e.g. the DSE assessment process) as well as the standard's requirements.",
  'iso45001-9.2.2::0':
    'Safety committee minutes or an intranet post showing internal audit findings and actions were actually shared with the workforce, not just kept in a management report.',
  'iso45001-9.2.2::1':
    'Evidence workers/reps had input into audit scope or frequency — e.g. requesting more frequent checks on lone-working arrangements.',
  'iso45001-9.3::0':
    'Management review minutes with a specific agenda item on worker consultation/participation, and a decision or action that followed from it.',
  'iso45001-10.1::0':
    'A single central log — not several disconnected spreadsheets — capturing improvement opportunities from audits, incidents, near-misses, and worker suggestions alike.',
  'iso45001-10.2::0':
    'An incident investigation report showing the affected worker or a colleague contributed (interview notes, sign-off), not just a management-only write-up.',
  'iso45001-10.2::1':
    'For a significant incident\'s corrective action (installing a new barrier, changing a process), evidence the change itself was risk-assessed for new hazards it might introduce.',
  'iso45001-10.3::0':
    "A safety improvement suggested and driven by staff rather than management — e.g. a cleaning team's own idea for safer chemical storage, adopted and credited to them.",
  'iso45001-6.1.2.1::0':
    'A stress/wellbeing risk assessment or workload survey covering things like excessive workload, shift patterns for security/cleaning staff, or unacceptable behaviour as recognised OH&S hazards, not just physical ones.',
  'iso45001-6.1.2.1::1':
    'A permit-to-work or dynamic risk assessment process for non-scheduled facilities work — e.g. emergency M&E breakdown repairs or an unplanned lift call-out — since these do not appear on a fixed schedule.',
  'iso45001-6.1.2.2::0':
    "The risk assessment matrix showing both an 'inherent' and 'residual' score, with existing controls (fire suppression, guarding, training) explicitly factored into the residual score.",
  'iso45001-6.1.2.3::0':
    'An opportunity distinct from closing out a risk — e.g. introducing sit-stand desks proactively, or upgrading to quieter equipment ahead of it becoming a complaint.',
  'iso45001-8.1.4.1::0':
    'A purchasing/procurement checklist or supplier onboarding form with an OH&S check — e.g. confirming new office furniture or equipment meets safety standards before it is ordered.',
  'iso45001-8.1.4.2::0':
    'A contractor risk assessment covering hazards your building poses to them — e.g. asbestos register information given to a contractor drilling into a wall, or confined-space risks in a plant room — not just their own method statement.',
  'iso45001-8.1.4.2::1':
    'A signed contractor induction record and site-specific hazard briefing (fire exits, permit-to-work areas, welfare facilities) dated before work started, cross-checked with the contractor\'s own account.',
  'iso45001-8.1.4.3::0':
    'A list of outsourced OH&S-relevant functions (fire risk assessment, legionella monitoring, lift maintenance, security) with evidence of provider competence checks — accreditation, contract KPIs, or a periodic performance review.'
}

/** Example evidence for a clause's question, tailored to a corporate office
 * / facilities management context. Returns undefined if nothing is authored
 * for that question yet — callers should treat the hint as optional. */
export function getEvidenceGuidance(clauseId: string, questionIndex: number): string | undefined {
  return EVIDENCE_GUIDANCE[`${clauseId}::${questionIndex}`]
}
