import type { Payload } from 'payload'
import type { TeamIds } from './team'

/**
 * Pack-3/G4: the first real write to company-info's `founder` group
 * (schema built Pack-2/F2, never seeded until now). `visible: true` is the
 * local-review default per F2's own comment — the public on/off call is
 * Jamal's before any deploy (docs/WORK-ORDER.md decision 5). Only
 * `founder.person` is new information this adds; `updateGlobal` partial-
 * merges, so every other company-info field is left untouched. Safe to
 * re-run — it always just sets `founder` to the same values.
 */
export async function seedCompanyInfoFounder(payload: Payload, team: TeamIds): Promise<void> {
  await payload.updateGlobal({
    slug: 'company-info',
    data: { founder: { visible: true, person: team.jamal } },
  })
  payload.logger.info('👤 company-info.founder.person wired to Jamal Shah (Spec §5.11 founder-visibility switch)')
}
