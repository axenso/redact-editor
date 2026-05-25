import type { Reference } from '../types/reference'

export const REFERENCE_TOKEN_LIMIT = 6000

export function estimateReferenceTokens(refs: Reference[]): number {
  return refs.reduce(
    (sum, ref) => sum + Math.ceil(ref.content.length / 4),
    0,
  )
}

export function buildPrompt(
  userQuery: string,
  activeRefs: Reference[],
): {
  systemPrompt: string
  userMessage: string
} {
  const refsBlock = activeRefs
    .map(
      (ref) =>
        `<reference id="${ref.id}" type="${ref.type}">\n${ref.content}\n</reference>`,
    )
    .join('\n\n')

  const systemPrompt = `Sei un assistente di scrittura integrato in un editor di testo.
Quando esegui il tuo compito, rispetta SEMPRE le indicazioni contenute nei tag <reference>.
Le referenze definiscono stile, tono, vocabolario e vincoli da applicare all'output.
Se più referenze sono in conflitto, dai priorità a quelle di tipo "instruction", poi "style".`

  const userMessage =
    activeRefs.length > 0
      ? `<references>\n${refsBlock}\n</references>\n\n<task>\n${userQuery}\n</task>`
      : userQuery

  return { systemPrompt, userMessage }
}
