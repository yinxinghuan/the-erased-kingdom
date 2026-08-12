import type { DemoTurn, StoryAdapter } from '../types'
import { t } from '../i18n'
import { domainDemoContent } from '../engine/domainRules'

export function selectDemoTurn(action: string, demoTurns: DemoTurn[], minIndex: number): DemoTurn | undefined {
  const normalized = action.toLowerCase()
  return demoTurns
    .map((turn, index) => {
      if (index < minIndex) return null
      const matches = turn.match.filter((keyword) => normalized.includes(keyword.toLowerCase()))
      if (!matches.length) return null
      return { turn, index, score: matches.length * 1000 + Math.max(...matches.map((keyword) => keyword.length)) }
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate))
    .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.turn
}

export const mockAdapter: StoryAdapter = {
  id: 'demo',
  async send(action, context, onProgress) {
    onProgress?.({ label: t(context.locale, 'worldResponding'), percent: 24 })
    await new Promise((resolve) => window.setTimeout(resolve, 360))
    const unused = selectDemoTurn(action, context.cartridge.demoTurns, context.save.scene)
    const turn = unused ?? context.cartridge.demoTurns[context.save.scene]
    onProgress?.({ label: t(context.locale, 'checkingState'), percent: 68 })
    await new Promise((resolve) => window.setTimeout(resolve, 440))
    if (context.domainResolution) return { content: domainDemoContent(context.domainResolution) }
    // Scripted demo turns are scene-indexed, so they can describe a different
    // free-form action. Governed actions must use their own adjudicated beat.
    if (context.domainResolution) return { content: domainDemoContent(context.domainResolution) }
    if (turn) return { content: turn.content, imagePrompt: turn.imagePrompt, imageSubject: turn.imageSubject }
    throw new Error(t(context.locale, 'demoComplete'))
  },
}
