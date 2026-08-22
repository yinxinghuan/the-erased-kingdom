export type CartridgeId = string
export type DrawerId = 'party' | 'map' | 'inventory' | 'log'
export type StoryMode = 'demo' | 'aigram' | 'remote'
export type Locale = 'zh' | 'en'

export interface ThemeTokens {
  outer: string; surface: string; paper: string; ink: string; muted: string; accent: string; danger: string; gold: string
  material: 'harbor' | 'apartment' | 'wayfarer'
}

export interface StoryAudioTheme {
  material: 'harbor' | 'apartment' | 'wayfarer'
  bpm: number
  rootHz: number
  scale: number[]
  levels: { music: number; ambient: number; sfx: number; master: number }
  tension: Array<{ statId: string; direction: 'high' | 'low'; weight: number }>
  regions?: StoryAudioRegion[]
  motifs?: Partial<Record<StoryAudioMotif, number[]>>
  recorded?: StoryRecordedAudio
}

export interface StoryRecordedTrack { src: string; gain: number }
export interface StoryRecordedAudio {
  music?: StoryRecordedTrack
  ambience?: StoryRecordedTrack
  ambienceByLocationId?: Record<string, StoryRecordedTrack>
  cues?: Record<string, StoryRecordedTrack>
}

export type StoryAudioTexture = 'orchard' | 'oldwood' | 'market' | 'bastion' | 'coast' | 'margins' | 'capital' | 'ledger'
export type StoryAudioMotif = 'erase' | 'restore' | 'witness' | 'companion' | 'finale' | 'location'
export interface StoryAudioRegion {
  id: string
  match: string[]
  texture: StoryAudioTexture
  rootOffset?: number
  bpmOffset?: number
  scale?: number[]
  pattern: Array<number | null>
}

export interface StatDefinition {
  id: string
  label: string
  min: number
  max: number
  initial: number
  inverse?: boolean
  display?: 'bar' | 'number'
  warningAt?: number
  dangerAt?: number
  maxDelta?: number
  revealedByFact?: string
}
export interface SkillDefinition { id: string; label: string; value: number }
export type CharacterStatus = 'known' | 'companion' | 'departed'
export interface CharacterDefinition { id: string; name: string; role: string; vitality: number; stress: number; skills: SkillDefinition[]; detail?: string; lore?: string; initialStatus?: CharacterStatus; hiddenUntilIntroduced?: boolean }
export interface StoryCharacter extends CharacterDefinition {
  status: CharacterStatus
  origin: 'cartridge' | 'generated'
  lastKnownLocation?: string
  updatedAtScene: number
  joinedAtScene?: number
  leftAtScene?: number
}
export interface Choice { id: string; label: string }
export type ImageBlockStatus = 'idle' | 'queued' | 'generating' | 'ready' | 'failed'
export type VideoBlockStatus = 'idle' | 'queued' | 'generating' | 'ready' | 'failed'
export const ITEM_IMAGE_STYLE_VERSION = 2
export const SCENE_IMAGE_PROMPT_VERSION = 11
export const PLAYER_IMAGE_REFERENCE_VERSION = 2
export type SceneImageSubject = 'player' | 'environment' | 'others'
export type SceneImagePerspective = 'first-person' | 'observer'
export interface StoryBlock { id: string; kind: 'narration' | 'dialogue' | 'check' | 'change' | 'event' | 'summary' | 'image'; text: string; speaker?: string; tone?: string; data?: Record<string, string | number> }
export interface EntityMetric { id?: string; label: string; value: string }
export interface MapNode { id: string; label: string; connectedTo?: string; current?: boolean; visited?: boolean; detail?: string; lore?: string; facts?: string[] }
export interface InventoryItem {
  id: string
  label: string
  count: number
  rarity?: 'common' | 'rare' | 'legendary'
  detail?: string
  effect?: string
  lore?: string
  metrics?: EntityMetric[]
  imagePrompt?: string
  imageStatus?: ImageBlockStatus
  imageUrl?: string
  imageStyleVersion?: number
}
export interface RelationshipEvent { id: string; actor: string; characterId?: string; axis: string; delta: number; source: string }

export interface StoryDirector {
  mode: 'guided' | 'open-world'
  fixedWorldRules: string[]
  generationRules: string[]
  choiceIntents: [string, string, string]
  maxActiveThreads: number
  mainQuest?: string
  chapters?: StoryChapterGuide[]
  finaleRule?: string
}

export interface StoryChapterGuide {
  id: string
  title: string
  unlock: string
  emotionalPurpose: string
  beats: string[]
  completionFacts: string[]
}

export type StoryFactValue = string | number | boolean
export type EndingRequirement =
  | { type: 'fact'; id: string; equals?: StoryFactValue }
  | { type: 'stat'; id: string; min?: number; max?: number }
  | { type: 'item'; id: string; minCount?: number }
  | { type: 'character'; id: string; status?: CharacterStatus }
  | { type: 'relationship'; characterId: string; minTotal?: number; maxTotal?: number }
  | { type: 'map'; id: string; visited?: boolean }
  | { type: 'scene'; min: number }

export interface StoryEndingCapability {
  id: string
  label: string
  meaning: string
  requires: EndingRequirement[]
  mandatoryCosts: string[]
  incompatibleWith?: string[]
}

export interface StoryEndingAnchor {
  id: string
  title: string
  thesis: string
  capabilityIds: string[]
  irreversibleCosts: string[]
  preserved: string[]
  lost: string[]
  unresolved: string[]
  finaleScenes: string[]
  finalImagePrompt: string
}

export interface StoryEndingDirector {
  startRequirements: EndingRequirement[]
  capabilities: StoryEndingCapability[]
  anchors: StoryEndingAnchor[]
  requiredCharacterIds: string[]
  minRegionalEpilogues: number
  maxRepairAttempts: number
}

export interface StoryEndingSnapshot {
  id: string
  scene: number
  location: string
  time: string
  objective: string
  facts: Record<string, StoryFactValue>
  stats: Record<string, number>
  inventory: Array<{ id: string; label: string; count: number; lore?: string }>
  characters: Array<{ id: string; name: string; status: CharacterStatus; detail?: string; lore?: string }>
  partyMemberIds: string[]
  relationships: RelationshipEvent[]
  map: Array<{ id: string; label: string; visited?: boolean; facts?: string[] }>
  availableCapabilities: string[]
  recentStory: Array<{ kind: StoryBlock['kind']; speaker?: string; text: string }>
}

export interface StoryEndingCandidate {
  anchorFamily: string
  title: string
  thesis: string
  capabilitiesUsed: string[]
  irreversibleCosts: string[]
  preserved: string[]
  lost: string[]
  unresolved: string[]
  finaleScenes: string[]
  characterEpilogues: Array<{ characterId: string; text: string }>
  regionalEpilogues: Array<{ regionId: string; text: string }>
  finalImagePrompt: string
  videoCandidate?: string
}

export interface StoryEnding extends StoryEndingCandidate {
  id: string
  snapshotId: string
  generated: boolean
}

export interface StoryFinaleState {
  status: 'idle' | 'ready' | 'generating' | 'complete' | 'failed'
  reason?: string
  snapshot?: StoryEndingSnapshot
  ending?: StoryEnding
  error?: string
  epilogueActive?: boolean
}

export type DangerPhase = 'calm' | 'warning' | 'confrontation'
export type DangerOutcome = 'none' | 'critical-success' | 'success' | 'costly-success' | 'failure' | 'critical-failure'

export interface DangerCost {
  statId: string
  operation: 'add' | 'remove'
  amount: number
}

export interface StoryDangerDirector {
  minSafeTurns: number
  maxSafeTurns: number
  cooldownTurns: number
  escalationStats: string[]
  threatPalette: string[]
  methods: [string, string, string]
  legacyMethods?: [string, string, string][]
  physicalCombat: 'none' | 'rare' | 'occasional'
  resolution: {
    skill: string
    modifier: number
    dcBySeverity: [number, number, number, number, number]
    criticalDcBonus?: number
    fallbackCosts: [DangerCost, ...DangerCost[]]
  }
}

export interface StoryDangerState {
  phase: DangerPhase
  safeTurns: number
  cycle: number
  cooldownTurns: number
  severity: number
  currentThreat?: string
  lastOutcome: DangerOutcome
  lastResolvedScene?: number
}

export type DomainRequirement =
  | { type: 'map'; nodeId: string; reason: string }
  | { type: 'fact'; id: string; equals?: StoryFactValue; notEquals?: StoryFactValue; min?: number; max?: number; reason: string }
  | { type: 'item'; id: string; minCount: number; reason: string }
  | { type: 'character'; id: string; status: CharacterStatus; reason: string }
  | { type: 'danger'; phases: DangerPhase[]; reason: string }

export type DomainEffect =
  | { type: 'stat'; id: string; delta: number }
  | { type: 'fact'; id: string; value: StoryFactValue }
  | { type: 'fact-add'; id: string; delta: number }
  | { type: 'inventory'; action: 'add' | 'remove'; itemId: string; count: number; item?: InventoryItem }
  | { type: 'party'; change: 'add' | 'remove'; characterId: string }
  | { type: 'map'; nodeId: string }
  | { type: 'danger'; outcome: Exclude<DangerOutcome, 'none'> }
  | { type: 'objective'; value: string }
  | { type: 'clock'; value: string }
  | { type: 'session'; ended: boolean; reason?: string }

export interface DomainActionRule {
  id: string
  intent: string
  match: string[]
  requirements: DomainRequirement[]
  effects: DomainEffect[]
  successText: string
  successChoices: [string, string, string]
  rejectionChoices?: [string, string, string]
}

export interface DomainDerivedItemMetric {
  itemId: string
  metricId: string
  label: string
  factId: string
  maximum: number
  mode: 'remaining-from-used'
}

export type DomainDerivedFact =
  | { factId: string; mode: 'owned-item-count'; itemIds: string[] }
  | { factId: string; mode: 'owned-item-threshold'; itemIds: string[]; threshold: number }

export interface StoryDomainRules {
  rules: DomainActionRule[]
  derivedItemMetrics?: DomainDerivedItemMetric[]
  derivedFacts?: DomainDerivedFact[]
}

export interface DomainActionResolution {
  status: 'accepted' | 'rejected'
  ruleId: string
  intent: string
  effects: DomainEffect[]
  reasons: string[]
  successText: string
  successChoices: [string, string, string]
}

export interface DangerCheck {
  skill: string
  dc: number
  roll: number
  modifier: number
  total: number
  outcome: Exclude<DangerOutcome, 'none'>
}

export interface DangerDirective {
  phase: 'warning' | 'confrontation' | 'resolution'
  severity: number
  threat: string
  methods: [string, string, string]
  physicalCombat: StoryDangerDirector['physicalCombat']
  check?: DangerCheck
}

export type SceneImageTrigger =
  | 'new-location'
  | 'rare-item'
  | 'party-change'
  | 'chapter-checkpoint'
  | 'relationship-change'
  | 'objective-change'
  | 'skill-outcome'

export interface StoryImageDirector {
  maxQuietTurns: number
  softCooldownTurns: number
  guaranteedTriggers: SceneImageTrigger[]
  softTriggers: SceneImageTrigger[]
  perspective?: {
    ordinary: 'observer' | 'balanced' | 'first-person-preferred'
    importantDialogue: SceneImagePerspective
    newLocation: SceneImagePerspective
  }
}

export interface StoryMediaDirector {
  imageProfile: 'fast-small' | 'standard'
  imageTarget: { width: number; height: number }
  videoEnabled: boolean
  videoDuration: 5 | 10
  minVideoGapTurns: number
}

export interface StoryCartridge {
  schemaVersion: 1
  id: CartridgeId
  locale: Locale
  coverImage: string
  entryImage?: string
  copy: {
    title: string; subtitle: string; promise: string; enter: string; continue: string; customAction: string
    itemImagingTitle: string; itemImagingBody: string
  }
  theme: ThemeTokens
  audioTheme: StoryAudioTheme
  itemImageDirection?: string
  sceneImageDirection?: string
  sceneImageAvoid?: string
  transitionAnchor?: string
  playerImageAliases?: string[]
  playerImageRole?: string
  playerImageExclusions?: string[]
  imageDirector?: StoryImageDirector
  mediaDirector?: StoryMediaDirector
  director?: StoryDirector
  dangerDirector?: StoryDangerDirector
  domainRules?: StoryDomainRules
  endingDirector?: StoryEndingDirector
  initialFacts?: Record<string, StoryFactValue>
  statDefinitions: [StatDefinition, StatDefinition, StatDefinition]
  drawerLabels: Record<DrawerId, string>
  opening: { location: string; time: string; objective: string; imagePrompt: string; entryImagePrompt?: string; blocks: StoryBlock[]; choices: Choice[]; entryAction?: string }
  characters: CharacterDefinition[]
  initialPartyMemberIds?: string[]
  initialMap: MapNode[]
  initialInventory: InventoryItem[]
  demoTurns: DemoTurn[]
}

export interface DemoTurn { match: string[]; content: string; imagePrompt?: string; imageSubject?: SceneImageSubject }

export interface StorySave {
  version: 8
  cartridgeId: CartridgeId
  locale: Locale
  remoteChatId?: string
  entered: boolean
  scene: number
  location: string
  time: string
  objective: string
  decisionContext: string
  stats: Record<string, number>
  blocks: StoryBlock[]
  choices: Choice[]
  map: MapNode[]
  inventory: InventoryItem[]
  characters: StoryCharacter[]
  partyMemberIds: string[]
  relationships: RelationshipEvent[]
  facts: Record<string, StoryFactValue>
  danger: StoryDangerState
  sessionEnded: boolean
  finale: StoryFinaleState
  lastActionId?: string
  _lastActive?: number
}

export interface StoryArchive {
  version: 1
  worlds: Record<CartridgeId, StorySave>
  _lastActive?: number
}

export type ParsedCommand =
  | { type: 'choices'; choices: string[] }
  | { type: 'widget'; id: string; operation: 'value' | 'count' | 'add' | 'remove'; value: string | number }
  | { type: 'skill_check'; skill: string; dc: number; roll: number; modifier: number; total: number; result: string }
  | { type: 'state'; value: string }
  | { type: 'clock'; value: string }
  | { type: 'map_update'; location: string; connectedTo?: string; detail?: string; lore?: string; facts?: string[] }
  | { type: 'inventory'; action: 'add' | 'remove'; itemId?: string; item: string; count: number; rarity?: 'common' | 'rare' | 'legendary'; detail?: string; effect?: string; lore?: string; metrics?: EntityMetric[]; imagePrompt?: string }
  | { type: 'reputation'; npc: string; action: string }
  | { type: 'character_update'; characterId?: string; character: string; role?: string; detail?: string; lore?: string; vitality?: number; stress?: number; skills?: SkillDefinition[] }
  | { type: 'party_change'; characterId?: string; character: string; change: 'add' | 'remove'; role?: string; detail?: string; lore?: string; vitality?: number; stress?: number; skills?: SkillDefinition[] }
  | { type: 'encounter'; phase: 'warning' | 'confrontation' | 'resolution'; kind?: string; severity?: number; outcome?: DangerOutcome }
  | { type: 'fact'; id: string; value: StoryFactValue }
  | { type: 'true_ending'; reason: string }
  | { type: 'session_end'; reason: string }

export interface ParsedScene { blocks: StoryBlock[]; commands: ParsedCommand[]; raw: string }

export interface AdapterContext {
  cartridge: StoryCartridge
  save: StorySave
  actionId: string
  locale: Locale
  dangerDirective?: DangerDirective
  domainResolution?: DomainActionResolution
}

export interface AdapterProgress {
  label: string
  percent?: number
}

export interface AdapterResult {
  content: string
  imagePrompt?: string
  imageSubject?: SceneImageSubject
}

export interface StoryAdapter {
  id: StoryMode
  send: (action: string, context: AdapterContext, onProgress?: (progress: AdapterProgress) => void) => Promise<AdapterResult>
}
