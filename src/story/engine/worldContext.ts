import type { AdapterContext, StoryBlock, StoryCharacter, StoryDirector } from '../types'

const maxRecentBlocks = 20
const maxRecentKnownCharacters = 30

function visibleHistory(blocks: StoryBlock[]) {
  return blocks
    .filter((block) => block.kind !== 'image')
    .slice(-maxRecentBlocks)
    .map((block) => ({ kind: block.kind, speaker: block.speaker, tone: block.tone, text: block.text }))
}

function characterSnapshot(character: StoryCharacter) {
  return {
    id: character.id,
    name: character.name,
    role: character.role,
    status: character.status,
    vitality: character.vitality,
    stress: character.stress,
    skills: character.skills,
    detail: character.detail,
    lore: character.lore,
    lastKnownLocation: character.lastKnownLocation,
    joinedAtScene: character.joinedAtScene,
    leftAtScene: character.leftAtScene,
  }
}

export function buildWorldContext(context: AdapterContext) {
  const { cartridge, save } = context
  const activeParty = save.partyMemberIds
    .map((id) => save.characters.find((character) => character.id === id))
    .filter((character): character is StoryCharacter => Boolean(character))
  const activeIds = new Set(activeParty.map((character) => character.id))
  const recentKnown = save.characters
    .filter((character) => !activeIds.has(character.id))
    .sort((left, right) => right.updatedAtScene - left.updatedAtScene)
    .slice(0, maxRecentKnownCharacters)
  return {
    game: {
      title: cartridge.copy.title,
      premise: cartridge.copy.promise,
      language: context.locale === 'zh' ? 'Simplified Chinese' : 'English',
      director: cartridge.director,
      dangerDirector: cartridge.dangerDirector,
    },
    current: {
      scene: save.scene,
      location: save.location,
      time: save.time,
      objective: save.objective,
      stats: cartridge.statDefinitions.map((definition) => ({
        id: definition.id,
        label: definition.label,
        value: save.stats[definition.id] ?? definition.initial,
        min: definition.min,
        max: definition.max,
      })),
      activeParty: activeParty.map(characterSnapshot),
      knownCharacters: [...activeParty, ...recentKnown].map(characterSnapshot),
      map: save.map,
      inventory: save.inventory,
      relationships: save.relationships.slice(-30),
      facts: save.facts,
      danger: save.danger,
      dangerDirective: context.dangerDirective,
      finale: { status: save.finale.status, reason: save.finale.reason },
      recentStory: visibleHistory(save.blocks),
    },
  }
}

export const partyContinuityContract = `PARTY CONTINUITY IS AUTHORITATIVE:
- current.activeParty is the complete group currently traveling or acting with the player. Keep every listed member present across travel, time changes, new encounters, and scene changes.
- Meeting or joining a new group never replaces current.activeParty. Merge new companions into it unless visible prose explicitly establishes a separation and the same response emits one party_change remove command per departing member.
- Never silently omit, forget, rename, kill, dismiss, or relocate an active companion. If a companion is temporarily off-screen, state why and keep them in activeParty.
- Emit character_update when a named NPC becomes a recurring known person. Reuse the exact character_id from knownCharacters on later turns.
- Prose is not a save operation. Joining and leaving become true only through party_change; character facts become durable only through character_update.`

export function storyDirectorContract(director?: StoryDirector): string {
  if (!director?.mainQuest && !director?.chapters?.length) return ''
  const chapters = director.chapters?.map((chapter, index) => `${index + 1}. ${chapter.title} [${chapter.id}]
   Unlock: ${chapter.unlock}
   Emotional purpose: ${chapter.emotionalPurpose}
   Required beats: ${chapter.beats.join(' -> ')}
   Completion facts: ${chapter.completionFacts.join(', ')}`).join('\n') ?? ''
  return `MAIN QUEST CONTRACT IS AUTHORITATIVE:
- Core quest: ${director.mainQuest ?? 'Advance the saved main quest without restarting it.'}
- Use current.facts, current.objective and visited map nodes to locate the earliest unfinished relevant chapter. Free exploration and side quests may interrupt, but never erase, restart or silently skip its required beats.
- A chapter completion fact may be emitted only after its visible required beats and a consequential player decision have occurred. Never grant witness pages, reconciliation, Ledger access or finale prerequisites as atmospheric rewards.
${chapters}${director.finaleRule ? `\n- Finale rule: ${director.finaleRule}` : ''}`
}
