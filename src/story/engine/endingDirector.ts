import type {
  EndingRequirement, StoryCartridge, StoryEnding, StoryEndingAnchor, StoryEndingCandidate,
  StoryEndingSnapshot, StoryFactValue, StorySave,
} from '../types'

function relationshipTotal(save: StorySave, characterId: string): number {
  return save.relationships
    .filter((event) => event.characterId === characterId)
    .reduce((total, event) => total + event.delta, 0)
}

export function endingRequirementMet(requirement: EndingRequirement, save: StorySave): boolean {
  if (requirement.type === 'fact') {
    if (!(requirement.id in save.facts)) return false
    return requirement.equals === undefined || save.facts[requirement.id] === requirement.equals
  }
  if (requirement.type === 'stat') {
    const value = save.stats[requirement.id]
    return Number.isFinite(value) && (requirement.min == null || value >= requirement.min) && (requirement.max == null || value <= requirement.max)
  }
  if (requirement.type === 'item') {
    const count = save.inventory.find((item) => item.id === requirement.id)?.count ?? 0
    return count >= (requirement.minCount ?? 1)
  }
  if (requirement.type === 'character') {
    const character = save.characters.find((entry) => entry.id === requirement.id)
    return Boolean(character && (!requirement.status || character.status === requirement.status))
  }
  if (requirement.type === 'relationship') {
    const total = relationshipTotal(save, requirement.characterId)
    return (requirement.minTotal == null || total >= requirement.minTotal) && (requirement.maxTotal == null || total <= requirement.maxTotal)
  }
  if (requirement.type === 'map') {
    const node = save.map.find((entry) => entry.id === requirement.id)
    return Boolean(node && (requirement.visited == null || Boolean(node.visited) === requirement.visited))
  }
  return save.scene >= requirement.min
}

export function availableEndingCapabilities(save: StorySave, cartridge: StoryCartridge): string[] {
  const director = cartridge.endingDirector
  if (!director) return []
  return director.capabilities
    .filter((capability) => capability.requires.every((requirement) => endingRequirementMet(requirement, save)))
    .map((capability) => capability.id)
}

export function canStartTrueEnding(save: StorySave, cartridge: StoryCartridge): boolean {
  const director = cartridge.endingDirector
  return Boolean(director
    && director.startRequirements.every((requirement) => endingRequirementMet(requirement, save))
    && availableEndingCapabilities(save, cartridge).length > 0)
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, stable(entry)]))
}

function hash(value: unknown): string {
  const source = JSON.stringify(stable(value))
  let output = 2166136261
  for (let index = 0; index < source.length; index += 1) {
    output ^= source.charCodeAt(index)
    output = Math.imul(output, 16777619)
  }
  return (output >>> 0).toString(36)
}

export function buildEndingSnapshot(save: StorySave, cartridge: StoryCartridge): StoryEndingSnapshot {
  const snapshotWithoutId = {
    scene: save.scene,
    location: save.location,
    time: save.time,
    objective: save.objective,
    facts: { ...save.facts },
    stats: { ...save.stats },
    inventory: save.inventory.map(({ id, label, count, lore }) => ({ id, label, count, lore })),
    characters: save.characters.map(({ id, name, status, detail, lore }) => ({ id, name, status, detail, lore })),
    partyMemberIds: [...save.partyMemberIds],
    relationships: save.relationships.map((event) => ({ ...event })),
    map: save.map.map(({ id, label, visited, facts }) => ({ id, label, visited, facts: facts ? [...facts] : undefined })),
    availableCapabilities: availableEndingCapabilities(save, cartridge),
    recentStory: save.blocks.filter((block) => block.kind !== 'image').slice(-32).map(({ kind, speaker, text }) => ({ kind, speaker, text })),
  }
  return { id: `ending-${hash(snapshotWithoutId)}`, ...snapshotWithoutId }
}

function requiredEndingCharacterIds(snapshot: StoryEndingSnapshot, cartridge: StoryCartridge): string[] {
  const known = new Set(snapshot.characters.map((character) => character.id))
  return [...new Set([...(cartridge.endingDirector?.requiredCharacterIds ?? []), ...snapshot.partyMemberIds])].filter((id) => known.has(id))
}

export function validateEndingCandidate(candidate: StoryEndingCandidate, snapshot: StoryEndingSnapshot, cartridge: StoryCartridge): string[] {
  const director = cartridge.endingDirector
  if (!director) return ['missing ending director']
  const errors: string[] = []
  const available = new Set(snapshot.availableCapabilities)
  const used = new Set(candidate.capabilitiesUsed ?? [])
  if (!candidate.title?.trim()) errors.push('missing title')
  if (!candidate.thesis?.trim()) errors.push('missing thesis')
  if (!used.size) errors.push('uses no ending capability')
  used.forEach((id) => { if (!available.has(id)) errors.push(`unavailable capability: ${id}`) })
  director.capabilities.filter((capability) => used.has(capability.id)).forEach((capability) => {
    capability.mandatoryCosts.forEach((cost) => {
      if (!candidate.irreversibleCosts?.includes(cost)) errors.push(`missing mandatory cost: ${cost}`)
    })
    capability.incompatibleWith?.forEach((id) => {
      if (used.has(id)) errors.push(`incompatible capabilities: ${capability.id} + ${id}`)
    })
  })
  if (!candidate.preserved?.length) errors.push('nothing preserved')
  if (!candidate.lost?.length) errors.push('nothing lost')
  if (!candidate.unresolved?.length) errors.push('nothing unresolved')
  if (!Array.isArray(candidate.finaleScenes) || candidate.finaleScenes.length < 4 || candidate.finaleScenes.length > 6) errors.push('finaleScenes must contain 4..6 scenes')
  const knownCharacters = new Set(snapshot.characters.map((character) => character.id))
  const epilogueIds = new Set((candidate.characterEpilogues ?? []).map((entry) => entry.characterId))
  requiredEndingCharacterIds(snapshot, cartridge).forEach((id) => { if (!epilogueIds.has(id)) errors.push(`missing character epilogue: ${id}`) })
  epilogueIds.forEach((id) => { if (!knownCharacters.has(id)) errors.push(`unknown character epilogue: ${id}`) })
  if ((candidate.regionalEpilogues?.length ?? 0) < director.minRegionalEpilogues) errors.push(`needs ${director.minRegionalEpilogues} regional epilogues`)
  if (!candidate.finalImagePrompt?.trim()) errors.push('missing final image prompt')
  return [...new Set(errors)]
}

function compatibleAnchor(snapshot: StoryEndingSnapshot, anchors: StoryEndingAnchor[]): StoryEndingAnchor | undefined {
  const available = new Set(snapshot.availableCapabilities)
  return [...anchors]
    .filter((anchor) => anchor.capabilityIds.length && anchor.capabilityIds.every((id) => available.has(id)))
    .sort((left, right) => right.capabilityIds.length - left.capabilityIds.length)[0]
}

export function fallbackEndingCandidate(snapshot: StoryEndingSnapshot, cartridge: StoryCartridge): StoryEndingCandidate {
  const director = cartridge.endingDirector
  if (!director) throw new Error('Missing ending director')
  const available = new Set(snapshot.availableCapabilities)
  const anchor = compatibleAnchor(snapshot, director.anchors) ?? [...director.anchors]
    .sort((left, right) => right.capabilityIds.filter((id) => available.has(id)).length - left.capabilityIds.filter((id) => available.has(id)).length)[0]
  if (!anchor) throw new Error('Ending director requires at least one anchor')
  const capabilityIds = anchor.capabilityIds.filter((id) => available.has(id))
  if (!capabilityIds.length && snapshot.availableCapabilities[0]) capabilityIds.push(snapshot.availableCapabilities[0])
  const mandatoryCosts = [...new Set(director.capabilities
    .filter((capability) => capabilityIds.includes(capability.id))
    .flatMap((capability) => capability.mandatoryCosts))]
  const requiredIds = requiredEndingCharacterIds(snapshot, cartridge)
  const locale = cartridge.locale
  const characterEpilogues = requiredIds.map((id) => {
    const character = snapshot.characters.find((entry) => entry.id === id)
    const name = character?.name ?? id
    return {
      characterId: id,
      text: locale === 'zh'
        ? `${name}带着与你共同经历的事实继续生活；这段关系没有被结局静默抹去。`
        : `${name} carries the facts you lived through together; the ending does not silently erase that bond.`,
    }
  })
  const regions = snapshot.map.filter((node) => node.visited).slice(0, Math.max(director.minRegionalEpilogues, 3))
  const regionalEpilogues = regions.map((node) => ({
    regionId: node.id,
    text: locale === 'zh' ? `${node.label}保留了玩家亲自确认的变化，也承担新秩序留下的问题。` : `${node.label} keeps the changes the player confirmed and the problems the new order leaves behind.`,
  }))
  while (regionalEpilogues.length < director.minRegionalEpilogues) regionalEpilogues.push({
    regionId: `unresolved-region-${regionalEpilogues.length + 1}`,
    text: locale === 'zh' ? '一处尚未完全恢复的地区继续等待新的见证。' : 'A region not fully restored continues to wait for new witnesses.',
  })
  return {
    anchorFamily: anchor.id,
    title: anchor.title,
    thesis: anchor.thesis,
    capabilitiesUsed: capabilityIds,
    irreversibleCosts: mandatoryCosts.length ? mandatoryCosts : [...anchor.irreversibleCosts],
    preserved: [...anchor.preserved],
    lost: [...anchor.lost],
    unresolved: [...anchor.unresolved],
    finaleScenes: anchor.finaleScenes.slice(0, 6),
    characterEpilogues,
    regionalEpilogues,
    finalImagePrompt: anchor.finalImagePrompt,
  }
}

export function finalizeEnding(candidate: StoryEndingCandidate, snapshot: StoryEndingSnapshot, generated: boolean): StoryEnding {
  return { ...candidate, id: snapshot.id, snapshotId: snapshot.id, generated }
}

export function normalizeFacts(candidate: unknown, fallback: Record<string, StoryFactValue> = {}): Record<string, StoryFactValue> {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return { ...fallback }
  const facts: Record<string, StoryFactValue> = { ...fallback }
  Object.entries(candidate as Record<string, unknown>).forEach(([id, value]) => {
    if (!/^[a-z0-9][a-z0-9._-]{1,79}$/i.test(id)) return
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') facts[id] = value
  })
  return facts
}
