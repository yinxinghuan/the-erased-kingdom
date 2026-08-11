import { SCENE_IMAGE_PROMPT_VERSION, type ParsedScene, type SceneImageSubject, type SceneImageTrigger, type StoryCartridge, type StorySave } from '../types'

export interface SceneImageDecision {
  prompt?: string
  source?: 'ai' | 'director'
  reason?: 'ai-proposal' | SceneImageTrigger | 'cadence'
  playerVisible?: boolean
}

function lastScheduledScene(save: StorySave): number {
  return save.blocks.reduce((latest, block) => {
    if (block.kind !== 'image') return latest
    const match = block.id.match(/^image-(\d+)$/)
    return match ? Math.max(latest, Number(match[1])) : latest
  }, 0)
}

function firstTrigger(triggers: SceneImageTrigger[], allowed: SceneImageTrigger[]): SceneImageTrigger | undefined {
  return triggers.find((trigger) => allowed.includes(trigger))
}

function detectTriggers(previous: StorySave, parsed: ParsedScene): SceneImageTrigger[] {
  const triggers: SceneImageTrigger[] = []
  for (const command of parsed.commands) {
    if (command.type === 'map_update') {
      const known = previous.map.find((node) => node.label === command.location || node.id === command.location)
      if (!known?.visited) triggers.push('new-location')
    }
    if (command.type === 'inventory' && command.action === 'add' && (command.rarity === 'rare' || command.rarity === 'legendary')) triggers.push('rare-item')
    if (command.type === 'party_change') triggers.push('party-change')
    if (command.type === 'session_end') triggers.push('chapter-checkpoint')
    if (command.type === 'reputation') triggers.push('relationship-change')
    if (command.type === 'state' && command.value && command.value !== previous.objective) triggers.push('objective-change')
    if (command.type === 'skill_check') triggers.push('skill-outcome')
  }
  return [...new Set(triggers)]
}

function focusFor(reason: SceneImageTrigger | 'cadence', parsed: ParsedScene, next: StorySave): string {
  if (reason === 'new-location') return `the first arrival at ${next.location}`
  if (reason === 'rare-item') {
    const item = parsed.commands.find((command) => command.type === 'inventory' && command.action === 'add' && (command.rarity === 'rare' || command.rarity === 'legendary'))
    return item?.type === 'inventory' ? `the discovery of ${item.item}` : 'an important discovery'
  }
  if (reason === 'party-change') {
    const party = parsed.commands.find((command) => command.type === 'party_change')
    return party?.type === 'party_change' ? `${party.character} ${party.change === 'add' ? 'joining' : 'leaving'} the group` : 'a change in the group'
  }
  if (reason === 'chapter-checkpoint') return 'the visible situation at this chapter checkpoint'
  if (reason === 'relationship-change') {
    const relationship = parsed.commands.find((command) => command.type === 'reputation')
    return relationship?.type === 'reputation' ? `a relationship turning point involving ${relationship.npc}` : 'a relationship turning point'
  }
  if (reason === 'objective-change') return `the newly established objective: ${next.objective}`
  if (reason === 'skill-outcome') return 'the visible consequence of the latest attempt'
  return 'the most visually distinctive visible consequence of the latest turn'
}

function visibleBeat(parsed: ParsedScene): string {
  return parsed.blocks
    .filter((block) => block.kind !== 'change' && block.kind !== 'image' && block.text.trim())
    .slice(-4)
    .map((block) => block.speaker ? `${block.speaker}: ${block.text}` : block.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .slice(0, 760)
}

function words(value: string): string[] {
  return value.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? []
}

const CJK_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/

function withoutRendererTextRisk(value: string): string {
  return value
    .replace(/["“”][^"“”]{1,100}["“”]/g, 'an unreadable blank surface')
    .replace(/\s+/g, ' ')
    .trim()
}

function rendererSafeProposal(value: string | undefined): string {
  const proposal = value?.replace(/\b16:9\s*(?:widescreen|landscape)?\b/gi, '').trim() ?? ''
  if (!proposal || CJK_RE.test(proposal)) return ''
  return withoutRendererTextRisk(proposal).slice(0, 620)
}

function regexEscape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function mentionsPlayer(value: string, cartridge: StoryCartridge): boolean {
  if (/\b(player protagonist|protagonist|player character|returning player|the player|traveler|wayfarer|adventurer|you)\b|玩家|主角|旅人|旅行者|冒险者|你/i.test(value)) return true
  return (cartridge.playerImageAliases ?? []).some((alias) => {
    const trimmed = alias.trim()
    if (!trimmed) return false
    return new RegExp(`(^|[^\\p{L}\\p{N}])${regexEscape(trimmed)}([^\\p{L}\\p{N}]|$)`, 'iu').test(value)
  })
}

function pairs(value: string): Set<string> {
  const tokens = words(value)
  return new Set(tokens.slice(0, -1).map((token, index) => `${token} ${tokens[index + 1]}`))
}

function carriesOpeningResidue(cartridge: StoryCartridge, next: StorySave, parsed: ParsedScene, proposal: string): boolean {
  if (next.location === cartridge.opening.location) return false
  const directionPairs = pairs(cartridge.sceneImageDirection ?? '')
  const openingReference = `${cartridge.opening.imagePrompt} ${cartridge.sceneImageAvoid ?? ''}`
  const openingPairs = pairs(openingReference)
  const proposalPairs = pairs(proposal)
  const beatPairs = pairs(visibleBeat(parsed))
  let residuePairs = 0
  for (const phrase of proposalPairs) {
    if (openingPairs.has(phrase) && !directionPairs.has(phrase) && !beatPairs.has(phrase)) residuePairs += 1
  }
  const directionWords = new Set(words(cartridge.sceneImageDirection ?? ''))
  const openingWords = new Set(words(openingReference).filter((token) => !directionWords.has(token)))
  const beatWords = new Set(words(visibleBeat(parsed)))
  const proposalWords = new Set(words(proposal))
  let residueWords = 0
  for (const token of proposalWords) {
    if (openingWords.has(token) && !beatWords.has(token)) residueWords += 1
  }
  return residuePairs >= 1 || residueWords >= 2
}

function latestLocation(next: StorySave, parsed: ParsedScene): string {
  const update = [...parsed.commands].reverse().find((command) => command.type === 'map_update')
  return update?.type === 'map_update' ? update.location : next.location
}

function actionDelegatesVisualAgency(action: string): boolean {
  return /^(?:先)?(?:请|让|叫|要求|命令|询问|问|听|观察|看着|查看|跟随|等待|交给|委托)|^(?:ask|tell|let|have|order|request|question|listen|watch|observe|follow|wait|leave\b.*\bto)\b/i.test(action.trim())
}

function playerIsVisible(cartridge: StoryCartridge, parsed: ParsedScene, proposal?: string, subject?: SceneImageSubject, action = ''): boolean {
  const shot = proposal?.trim() || visibleBeat(parsed)
  if (/\b(no people|nobody|unoccupied|environment-only|object-only)\b|无人|空镜|纯环境|物品特写/i.test(shot)) return false
  if (subject === 'player') return true
  if (subject === 'environment') return false
  if (subject === 'others') {
    // Models sometimes label a direct player action as `others` merely because
    // a named companion is also visible. A concrete player-selected action plus
    // an explicit player/courier actor in the English shot is stronger evidence.
    // Delegated/listening/watching actions still respect `others`, preventing a
    // companion-led scene from inheriting the player face.
    return Boolean(action.trim() && !actionDelegatesVisualAgency(action) && mentionsPlayer(shot, cartridge))
  }
  if (mentionsPlayer(shot, cartridge)) return true
  return false
}

function buildScenePrompt(
  cartridge: StoryCartridge,
  next: StorySave,
  parsed: ParsedScene,
  reason: SceneImageTrigger | 'cadence',
  aiProposal?: string,
  playerVisible = false,
): string {
  const rawBeat = visibleBeat(parsed) || next.objective
  const proposal = rendererSafeProposal(aiProposal)
  const acceptedProposal = proposal && !carriesOpeningResidue(cartridge, next, parsed, proposal) ? proposal : ''
  const beat = CJK_RE.test(rawBeat)
    ? acceptedProposal
      ? 'The English primary shot brief above is the complete visual event. Source-language prose is intentionally omitted from the renderer.'
      : 'Depict only the current visible consequence indicated by the shot focus. Source-language prose is intentionally omitted from the renderer.'
    : withoutRendererTextRisk(rawBeat).slice(0, 760)
  const direction = cartridge.sceneImageDirection ?? `${cartridge.theme.material} story-world editorial illustration`
  const target = cartridge.mediaDirector?.imageTarget ?? { width: 640, height: 360 }
  const frameInstruction = target.height > target.width
    ? 'Create one fresh 4:5 portrait cinematic illustration in the established story world. It must survive a full-bleed responsive crop: keep the dominant action, identity-defining head or body cues, and essential props inside the central 58% safe column, and extend the environment naturally to every edge.'
    : 'Create one fresh 16:9 widescreen cinematic illustration in the established story world. Compose for a horizontal frame with useful negative space near the lower edge for a short interface subtitle.'
  return [
    frameInstruction,
    acceptedProposal ? `Primary shot brief: ${acceptedProposal}.` : `Primary shot focus: ${focusFor(reason, parsed, next)}.`,
    `Latest visible story beat, which overrides older continuity hints: ${beat}.`,
    `Current location hint: ${CJK_RE.test(latestLocation(next, parsed)) ? (next.map.find((node) => node.current)?.id ?? 'current established location').replace(/-/g, ' ') : latestLocation(next, parsed)}. Use it only when consistent with the latest visible beat; never drag an earlier location into a newer scene.`,
    `Mandatory art direction: ${direction}.`,
    playerVisible ? `The player protagonist is the dominant visual actor in this frame and must be the same referenced subject performing the dominant player action. ${cartridge.playerImageRole ? `Their narrative role and required story props: ${cartridge.playerImageRole}.` : ''} Do not assign that action to a substitute character, duplicate protagonist, generic courier or look-alike. Keep the protagonist's identity-defining face, mask, covering, costume, silhouette or body form clearly readable as it actually appears in the supplied reference; do not reveal or invent a face that the reference hides or lacks.` : '',
    'Compose one readable moment with one dominant action and at most two focal subjects. Choose a camera position, scale, lighting pattern and silhouette that differ from earlier images.',
    'Ignore all cover art and opening-scene imagery. Derive the depicted location, action, subjects, props and weather only from the primary shot brief and latest visible story beat.',
    'Show only people, objects, places and consequences established in the latest visible story. No montage, split screen or flash-forward.',
    'ABSOLUTELY NO VISIBLE WRITING OR LANGUAGE OF ANY KIND. Every sign, book, ledger, map, letter, notice, label, seal and paper surface must be blank or carry only non-linguistic abstract marks. No Chinese, Hanzi, CJK glyphs, Latin letters, words, numbers, calligraphy, pseudo-text, logo, border, poster layout or UI.',
  ].filter(Boolean).join(' ')
}

export function shouldUsePlayerImageReference(prompt: string, aliases: string[] = []): boolean {
  const explicitlyEmpty = /\b(no people|nobody|unoccupied|environment-only|object-only)\b|无人|空镜|纯环境|物品特写/i.test(prompt)
  const aliasVisible = aliases.some((alias) => alias.trim() && new RegExp(`(^|[^\\p{L}\\p{N}])${regexEscape(alias.trim())}([^\\p{L}\\p{N}]|$)`, 'iu').test(prompt))
  const playerVisible = /\b(player protagonist|protagonist|player character|returning player|the player|traveler|wayfarer|adventurer|you)\b|玩家|主角|旅人|旅行者|冒险者/i.test(prompt) || aliasVisible
  return playerVisible && !explicitlyEmpty
}

/**
 * Repairs older AI shot metadata only when the player chose a direct physical
 * action. Listening, watching and delegated actions remain NPC-led even if the
 * word "courier" appears in continuity notes.
 */
export function shouldRepairDirectPlayerAction(prompt: string, action: string, aliases: string[] = []): boolean {
  return Boolean(action.trim() && !actionDelegatesVisualAgency(action) && shouldUsePlayerImageReference(prompt, aliases))
}

export function upgradePendingSceneImagePrompts(save: StorySave, cartridge: StoryCartridge): StorySave {
  let changed = false
  const blocks = save.blocks.map((block, index) => {
    if (block.kind !== 'image' || block.id === 'image-0' || block.data?.status === 'ready') return block
    if (Number(block.data?.promptVersion ?? 0) >= SCENE_IMAGE_PROMPT_VERSION) return block
    let previousImage = -1
    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
      if (save.blocks[cursor]?.kind === 'image') { previousImage = cursor; break }
    }
    const parsed: ParsedScene = {
      blocks: save.blocks.slice(previousImage + 1, index).filter((candidate) => candidate.kind !== 'image'),
      commands: [],
      raw: '',
    }
    const historical = { ...save, location: block.text || save.location }
    const visible = playerIsVisible(cartridge, parsed)
    changed = true
    return {
      ...block,
      data: {
        ...block.data,
        prompt: buildScenePrompt(cartridge, historical, parsed, 'cadence', undefined, visible),
        promptVersion: SCENE_IMAGE_PROMPT_VERSION,
        playerVisible: visible ? 'true' : 'false',
        status: block.data?.status === 'generating' ? 'queued' : block.data?.status ?? 'queued',
      },
    }
  })
  return changed ? { ...save, blocks } : save
}

export function chooseSceneImage(
  previous: StorySave,
  next: StorySave,
  parsed: ParsedScene,
  cartridge: StoryCartridge,
  aiPrompt?: string,
  imageSubject?: SceneImageSubject,
  action = '',
): SceneImageDecision {
  const proposal = aiPrompt?.trim()
  if (proposal) {
    const visible = playerIsVisible(cartridge, parsed, proposal, imageSubject, action)
    return {
      prompt: buildScenePrompt(cartridge, next, parsed, 'cadence', proposal, visible),
      source: 'ai',
      reason: 'ai-proposal',
      playerVisible: visible,
    }
  }

  const director = cartridge.imageDirector
  const visible = playerIsVisible(cartridge, parsed, undefined, imageSubject, action)
  const triggers = detectTriggers(previous, parsed)
  const guaranteed = director ? firstTrigger(triggers, director.guaranteedTriggers) : undefined
  if (guaranteed) return { prompt: buildScenePrompt(cartridge, next, parsed, guaranteed, undefined, visible), source: 'director', reason: guaranteed, playerVisible: visible }

  const turnsSinceImage = next.scene - lastScheduledScene(previous)
  const soft = director ? firstTrigger(triggers, director.softTriggers) : undefined
  if (soft && turnsSinceImage >= director!.softCooldownTurns) {
    return { prompt: buildScenePrompt(cartridge, next, parsed, soft, undefined, visible), source: 'director', reason: soft, playerVisible: visible }
  }
  if (!director || turnsSinceImage >= 1) {
    return { prompt: buildScenePrompt(cartridge, next, parsed, 'cadence', undefined, visible), source: 'director', reason: 'cadence', playerVisible: visible }
  }
  return { prompt: buildScenePrompt(cartridge, next, parsed, 'cadence', undefined, visible), source: 'director', reason: 'cadence', playerVisible: visible }
}
