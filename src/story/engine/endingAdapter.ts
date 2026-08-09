import type { AdapterProgress, StoryCartridge, StoryEnding, StoryEndingCandidate, StoryEndingSnapshot, StorySave } from '../types'
import { buildEndingSnapshot, fallbackEndingCandidate, finalizeEnding, validateEndingCandidate } from './endingDirector'

const endpoint = 'https://chat.aiwaves.tech/aigram/api/game-chat'

function textArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((entry) => String(entry).trim()).filter(Boolean) : []
}

function epilogues(value: unknown, idKey: 'characterId' | 'regionId'): Array<Record<typeof idKey | 'text', string>> {
  if (!Array.isArray(value)) return []
  return value.map((entry) => {
    const source = entry && typeof entry === 'object' ? entry as Record<string, unknown> : {}
    return { [idKey]: String(source[idKey] ?? '').trim(), text: String(source.text ?? '').trim() } as Record<typeof idKey | 'text', string>
  }).filter((entry) => entry[idKey] && entry.text)
}

function candidateFromUnknown(value: unknown): StoryEndingCandidate {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  return {
    anchorFamily: String(source.anchorFamily ?? 'emergent-hybrid').trim(),
    title: String(source.title ?? '').trim(),
    thesis: String(source.thesis ?? '').trim(),
    capabilitiesUsed: textArray(source.capabilitiesUsed),
    irreversibleCosts: textArray(source.irreversibleCosts),
    preserved: textArray(source.preserved),
    lost: textArray(source.lost),
    unresolved: textArray(source.unresolved),
    finaleScenes: textArray(source.finaleScenes),
    characterEpilogues: epilogues(source.characterEpilogues, 'characterId') as StoryEndingCandidate['characterEpilogues'],
    regionalEpilogues: epilogues(source.regionalEpilogues, 'regionId') as StoryEndingCandidate['regionalEpilogues'],
    finalImagePrompt: String(source.finalImagePrompt ?? '').trim(),
    videoCandidate: source.videoCandidate ? String(source.videoCandidate).trim() : undefined,
  }
}

function parseCandidate(content: string): StoryEndingCandidate {
  const clean = content.replace(/^```(?:json)?\s*|\s*```$/gi, '').trim()
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('Ending response did not contain JSON')
  return candidateFromUnknown(JSON.parse(clean.slice(start, end + 1)))
}

function endingSystemPrompt(cartridge: StoryCartridge, snapshot: StoryEndingSnapshot, repairErrors: string[]): string {
  const director = cartridge.endingDirector!
  const available = director.capabilities.filter((capability) => snapshot.availableCapabilities.includes(capability.id))
  const language = cartridge.locale === 'zh' ? 'Use Simplified Chinese for all visible text.' : 'Use English for all visible text.'
  return `You are the finale writer for a persistent role-playing game. Produce one emotionally specific ending from the authoritative snapshot. ${language}

The snapshot is immutable. Never resurrect, remove, rename, relocate, reconcile, or transfer ownership unless a saved fact or an available capability supports it. Multiplayer anchors may enrich regional epilogues only. Do not invent a new ledger, seal, ruler, god, reality mechanism, secret bloodline, or cost-free perfect solution.

Use one or more AVAILABLE_CAPABILITIES. Include every mandatory cost of each capability used. Give the player one core thing preserved, one irreversible loss, one private farewell or reunion, every required character epilogue, at least ${director.minRegionalEpilogues} regional epilogues, and one unresolved future argument. The emotional result must come from named saved people, objects, promises, and places—not abstract policy exposition.

Return raw JSON only, with exactly these keys:
{
  "anchorFamily": "closest anchor id or emergent-hybrid",
  "title": "short memorable ending title",
  "thesis": "one sentence stating what the player chose and paid",
  "capabilitiesUsed": ["available capability id"],
  "irreversibleCosts": ["mandatory cost id plus any supported cost"],
  "preserved": ["saved fact/person/place/item id or concise grounded statement"],
  "lost": ["saved or unresolved id or concise grounded statement"],
  "unresolved": ["future conflict"],
  "finaleScenes": ["4 to 6 ordered concise scenes"],
  "characterEpilogues": [{"characterId":"exact saved id","text":"specific epilogue"}],
  "regionalEpilogues": [{"regionId":"exact saved map id","text":"specific epilogue"}],
  "finalImagePrompt": "English cinematic 4:5 portrait scene, one event, no text, no UI",
  "videoCandidate": "optional English 5 second continuous milestone scene"
}

AVAILABLE_CAPABILITIES_JSON:
${JSON.stringify(available)}

QUALITY_ANCHORS_JSON:
${JSON.stringify(director.anchors.map(({ id, title, thesis, capabilityIds }) => ({ id, title, thesis, capabilityIds })))}

AUTHORITATIVE_ENDING_SNAPSHOT_JSON:
${JSON.stringify(snapshot)}
${repairErrors.length ? `\nREPAIR THE FOLLOWING VALIDATION ERRORS WITHOUT CHANGING THE SNAPSHOT:\n${repairErrors.map((error) => `- ${error}`).join('\n')}` : ''}`
}

async function requestCandidate(cartridge: StoryCartridge, snapshot: StoryEndingSnapshot, repairErrors: string[]): Promise<StoryEndingCandidate> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 60000)
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ messages: [
        { role: 'system', content: endingSystemPrompt(cartridge, snapshot, repairErrors) },
        { role: 'user', content: 'Write the ending now. Return raw JSON only.' },
      ] }),
    })
    if (!response.ok) throw new Error(`Ending HTTP ${response.status}`)
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
    return parseCandidate(String(payload.choices?.[0]?.message?.content ?? ''))
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function generateStoryEnding(
  cartridge: StoryCartridge,
  save: StorySave,
  onProgress?: (progress: AdapterProgress) => void,
): Promise<{ ending: StoryEnding; snapshot: StoryEndingSnapshot; usedFallback: boolean; errors: string[] }> {
  const director = cartridge.endingDirector
  if (!director) throw new Error('This story has no ending director')
  const snapshot = buildEndingSnapshot(save, cartridge)
  let errors: string[] = []
  for (let attempt = 0; attempt <= director.maxRepairAttempts; attempt += 1) {
    try {
      onProgress?.({ label: attempt === 0 ? (cartridge.locale === 'zh' ? '正在回望你的选择' : 'Revisiting your choices') : (cartridge.locale === 'zh' ? '正在校对人物与代价' : 'Checking people and costs'), percent: attempt === 0 ? 28 : 62 })
      const candidate = await requestCandidate(cartridge, snapshot, errors)
      errors = validateEndingCandidate(candidate, snapshot, cartridge)
      if (!errors.length) return { ending: finalizeEnding(candidate, snapshot, true), snapshot, usedFallback: false, errors: [] }
    } catch (cause) {
      errors = [cause instanceof Error ? cause.message : String(cause)]
    }
  }
  onProgress?.({ label: cartridge.locale === 'zh' ? '正在用可靠的终局框架完成故事' : 'Completing the story from its reliable ending frame', percent: 82 })
  const fallback = fallbackEndingCandidate(snapshot, cartridge)
  return { ending: finalizeEnding(fallback, snapshot, false), snapshot, usedFallback: true, errors }
}
