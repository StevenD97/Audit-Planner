import { nullProvider } from './nullProvider'
import type { AiProvider } from './provider'

export type { AiProvider } from './provider'
export { nullProvider } from './nullProvider'

/**
 * Returns the active AI provider. Always `nullProvider` today — there is
 * no settings-driven switching wired up yet (see
 * docs/AUDIT_INTELLIGENCE_PLATFORM_STRATEGY.md §3.5 for the planned
 * app_settings-backed provider selection). Callers should go through this
 * function rather than importing `nullProvider` directly, so that future
 * providers can be introduced without changing call sites.
 */
export function getActiveProvider(): AiProvider {
  return nullProvider
}
