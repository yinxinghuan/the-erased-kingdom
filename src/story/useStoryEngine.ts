import { useCallback, useEffect, useRef, useState } from 'react'
import { useGenImage } from '../shared/runtime/useGenImage'
import { useGenVideo } from '../shared/runtime/useGenVideo'
import { useGameSave } from '../shared/save/useGameSave'
import { aigramAdapter } from './adapters/aigram'
import { mockAdapter } from './adapters/mock'
import { remoteAdapter } from './adapters/remote'
import { resolveCartridge } from './cartridges'
import { applyParsedScene, createImageBlock, createInitialSave, createRecoveryChoices, enterStory, localizeKnownState, normalizeCharacterState, updateImageBlock, updateInventoryItemImage } from './engine/reducer'
import { isProtocolResidueText, parseStoryProtocol } from './engine/protocol'
import { shouldRepairDirectPlayerAction, shouldUsePlayerImageReference, upgradePendingSceneImagePrompts } from './engine/imageDirector'
import { buildPlayerIdentityPrompt } from './engine/imageIdentity'
import { buildDangerDirective, normalizeDangerState } from './engine/dangerDirector'
import { domainOwnsDanger, resolveDomainAction, syncDomainDerivedState } from './engine/domainRules'
import { recordAuthorityShadowSample } from './engine/authorityShadow'
import { buildEndingSnapshot, normalizeFacts } from './engine/endingDirector'
import { generateStoryEnding } from './engine/endingAdapter'
import { t } from './i18n'
import { ITEM_IMAGE_STYLE_VERSION, PLAYER_IMAGE_REFERENCE_VERSION, SCENE_IMAGE_PROMPT_VERSION, type AdapterProgress, type InventoryItem, type Locale, type StoryArchive, type StoryCartridge, type StoryMediaDirector, type StoryMode, type StorySave } from './types'

const DEFAULT_MEDIA_DIRECTOR: StoryMediaDirector = {
  imageProfile: 'fast-small',
  imageTarget: { width: 640, height: 360 },
  videoEnabled: true,
  videoDuration: 5,
  minVideoGapTurns: 6,
}

type LegacyStorySave = Omit<StorySave, 'version' | 'locale' | 'characters' | 'partyMemberIds' | 'danger' | 'facts' | 'finale' | 'decisionContext'> & {
  version?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  decisionContext?: string
  locale?: Locale
  characters?: StorySave['characters']
  partyMemberIds?: StorySave['partyMemberIds']
  danger?: Partial<StorySave['danger']>
  facts?: StorySave['facts']
  finale?: StorySave['finale']
  imageUrl?: string
  imageStatus?: 'idle' | 'queued' | 'generating' | 'ready' | 'failed'
  imagePrompt?: string
}

type PersistedStoryData = StoryArchive | LegacyStorySave

function isArchive(candidate: PersistedStoryData | null | undefined): candidate is StoryArchive {
  return Boolean(candidate && 'worlds' in candidate && candidate.worlds && typeof candidate.worlds === 'object')
}

function readLegacyLocal(cartridgeId: string): LegacyStorySave | null {
  try {
    const raw = alteruLocalStorage.getItem(`stateful-story-${cartridgeId}-save`)
    return raw ? JSON.parse(raw) as LegacyStorySave : null
  } catch { return null }
}

function repairMockLoop(candidate: LegacyStorySave, cartridge: StoryCartridge): LegacyStorySave {
  const fallbackIndexes = new Set<number>()
  candidate.blocks.forEach((block, index) => {
    if (block.kind === 'narration' && /世界没有关闭，只是把新的线索推到下一页|world does not close; it carries a new clue onto the next page/i.test(block.text)) fallbackIndexes.add(index)
  })
  if (fallbackIndexes.size === 0) return candidate
  const blocks = candidate.blocks.filter((block, index) => !fallbackIndexes.has(index) && !(block.kind === 'event' && block.id.startsWith('action-') && fallbackIndexes.has(index + 1)))
  return {
    ...candidate,
    blocks,
    scene: Math.max(0, candidate.scene - fallbackIndexes.size),
    choices: [{ id: `recovered-${candidate.scene}`, label: cartridge.copy.continue }],
    sessionEnded: false,
    lastActionId: undefined,
  }
}

function recoverPersistedChoices(candidate: LegacyStorySave, cartridge: StoryCartridge): LegacyStorySave {
  const existing = candidate.choices ?? []
  const isGenericFallback = existing.length === 1 && existing[0].label === cartridge.copy.continue
  if (existing.length > 1 || (existing.length === 1 && !isGenericFallback)) return candidate
  let lastActionIndex = -1
  candidate.blocks.forEach((block, index) => { if (block.kind === 'event' && block.id.startsWith('action-')) lastActionIndex = index })
  const tail = candidate.blocks.slice(lastActionIndex + 1).filter((block) => block.kind !== 'image').map((block) => block.text).join('\n')
  const parsed = parseStoryProtocol(tail, candidate.locale ?? cartridge.locale)
  const recovered = parsed.commands.find((command) => command.type === 'choices')
  if (!recovered || recovered.type !== 'choices' || recovered.choices.length < 2) return candidate
  const labels = new Set(recovered.choices)
  const optionLine = /^\s*(?:(?:选项|选择|行动)\s*[一二三四五\dA-Ea-e]+\s*[：:.、)]|(?:\d{1,2}|[A-Ea-e]|[一二三四五])\s*[.、:：)]|[①②③④⑤]|[-*•])\s*(.+?)\s*$/
  const blocks = candidate.blocks.filter((block, index) => {
    if (index <= lastActionIndex || block.kind !== 'narration') return true
    const label = block.text.match(optionLine)?.[1]?.replace(/[。.;；]+$/, '').trim()
    return !label || !labels.has(label)
  })
  return {
    ...candidate,
    blocks,
    choices: recovered.choices.map((label, index) => ({ id: `recovered-choice-${candidate.scene}-${index}`, label })),
  }
}

function normalizeSave(candidate: LegacyStorySave | null | undefined, cartridge: StoryCartridge, incomingChatId?: string): StorySave {
  if (!candidate || candidate.cartridgeId !== cartridge.id || !Array.isArray(candidate.blocks)) return createInitialSave(cartridge, incomingChatId)
  if (incomingChatId && candidate.remoteChatId && candidate.remoteChatId !== incomingChatId) return createInitialSave(cartridge, incomingChatId)
  const repaired = recoverPersistedChoices(repairMockLoop(candidate, cartridge), cartridge)
  let blocks = repaired.blocks.filter((block) => !isProtocolResidueText(block.text))
  if (!blocks.some((block) => block.kind === 'image')) {
    const legacyPrompt = repaired.imagePrompt?.trim() ?? ''
    const canRestoreImage = repaired.scene === 0 || Boolean(legacyPrompt || repaired.imageUrl)
    if (canRestoreImage) {
      const prompt = legacyPrompt || (repaired.scene === 0 ? cartridge.opening.imagePrompt : '')
      const status = repaired.imageUrl
        ? 'ready'
        : repaired.imageStatus === 'generating'
          ? 'queued'
          : repaired.imageStatus || (repaired.entered && prompt ? 'queued' : 'idle')
      blocks = [...blocks, createImageBlock(`image-${repaired.scene}`, repaired.location, prompt, status, repaired.imageUrl)]
    }
  }
  if (repaired.scene === 0) {
    blocks = blocks.map((block) => {
      if (block.id !== 'image-0' || block.kind !== 'image' || Number(block.data?.promptVersion ?? 0) >= SCENE_IMAGE_PROMPT_VERSION) return block
      return {
        ...block,
        text: cartridge.opening.location,
        data: {
          ...block.data, prompt: cartridge.opening.imagePrompt, status: repaired.entered ? 'queued' : 'idle', url: '',
          source: 'opening', reason: 'opening-crisis', promptVersion: String(SCENE_IMAGE_PROMPT_VERSION), playerVisible: 'true',
        },
      }
    })
  }
  const initialItems = new Map(cartridge.initialInventory.map((item) => [item.id, item]))
  const inventory = (repaired.inventory ?? cartridge.initialInventory).map((item) => {
    const definition = initialItems.get(item.id)
    return {
      ...definition, ...item,
      detail: item.detail ?? definition?.detail, effect: item.effect ?? definition?.effect, lore: item.lore ?? definition?.lore,
      metrics: item.metrics ?? definition?.metrics, imagePrompt: item.imagePrompt ?? definition?.imagePrompt,
      imageStatus: item.imageStatus === 'generating' ? 'queued' : item.imageStatus ?? (item.imageUrl ? 'ready' : 'idle'),
    }
  })
  const initialPlaces = new Map(cartridge.initialMap.map((node) => [node.id, node]))
  const map = (repaired.map ?? cartridge.initialMap).map((node) => {
    const definition = initialPlaces.get(node.id)
    return {
      ...definition, ...node,
      visited: node.visited ?? Boolean(node.current || node.id.startsWith('map-')),
      detail: node.detail ?? definition?.detail, lore: node.lore ?? definition?.lore, facts: node.facts ?? definition?.facts,
    }
  })
  const characterState = normalizeCharacterState(repaired, cartridge)
  const normalized = {
    ...repaired, ...characterState, version: 8, locale: repaired.locale ?? cartridge.locale,
    decisionContext: repaired.decisionContext ?? repaired.objective ?? cartridge.opening.objective,
    remoteChatId: incomingChatId || repaired.remoteChatId, blocks, inventory, map,
    facts: normalizeFacts(repaired.facts, cartridge.initialFacts),
    finale: repaired.finale?.ending
      ? { ...repaired.finale, status: 'complete' as const }
      : repaired.finale?.status && repaired.finale.status !== 'idle'
        ? { ...repaired.finale, status: 'ready' as const, error: undefined }
        : { status: 'idle' as const },
    danger: normalizeDangerState(repaired.danger),
  } as StorySave
  if (!normalized.sessionEnded && normalized.choices.length === 0) normalized.choices = createRecoveryChoices(normalized, cartridge)
  return upgradePendingSceneImagePrompts(syncDomainDerivedState(normalized, cartridge), cartridge)
}

function inventoryImagePrompt(item: InventoryItem, cartridge: StoryCartridge): string {
  const direction = cartridge.itemImageDirection ?? 'elegant in-world artifact study with tactile natural materials and restrained directional light'
  const content = item.imagePrompt ?? `A single inventory object from ${cartridge.copy.title}: ${item.label}. ${item.detail ?? ''} ${item.effect ?? ''} ${item.lore ?? ''}`
  return `Create an inventory artifact plate for ${cartridge.copy.title}. Content brief: ${content}. Art direction: ${direction}. Follow only this text-defined medium, line treatment, palette, surface texture, lighting contrast, and degree of realism. Do not borrow any location, landmark, character, composition, or prop from the game's cover or opening scene. One object or one tightly grouped item set only, centered still life, square composition, no people, no hands, no text, no letters, no labels, no logo, no UI.`
}

export function useStoryEngine(cartridge: StoryCartridge, initialMode: StoryMode, incomingChatId?: string, imageIdentity: { ready: boolean; refUrl?: string } = { ready: true }) {
  const cloud = useGameSave<PersistedStoryData>('the-erased-kingdom')
  const [save, setSave] = useState<StorySave>(() => createInitialSave(cartridge, incomingChatId))
  const [mode, setMode] = useState<StoryMode>(initialMode)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<AdapterProgress | null>(null)
  const [error, setError] = useState('')
  const [pendingAction, setPendingAction] = useState('')
  const [failedAction, setFailedAction] = useState<{ action: string; locale: Locale } | null>(null)
  const seeded = useRef(false)
  const imageAttempt = useRef('')
  const openingIdentityRepair = useRef('')
  const imageBusy = useRef(false)
  const videoBusy = useRef(false)
  const videoAttempt = useRef('')
  const lastImageCallAt = useRef(0)
  const [imageWorkerTick, setImageWorkerTick] = useState(0)
  const saveRef = useRef(save)
  const archiveRef = useRef<StoryArchive>({ version: 1, worlds: {} })
  const { generate } = useGenImage()
  const { generate: generateVideo } = useGenVideo()
  const mediaDirector = cartridge.mediaDirector ?? DEFAULT_MEDIA_DIRECTOR
  const persist = cloud.persist

  useEffect(() => { recordAuthorityShadowSample(save, cartridge) }, [cartridge, save])

  useEffect(() => {
    if (!cloud.loaded || seeded.current) return
    seeded.current = true
    const stored = cloud.savedData
    const archive: StoryArchive = isArchive(stored)
      ? { ...stored, worlds: { ...stored.worlds } }
      : { version: 1, worlds: stored?.cartridgeId ? { [stored.cartridgeId]: stored as StorySave } : {} }
    const legacyLocal = archive.worlds[cartridge.id] ? null : readLegacyLocal(cartridge.id)
    const next = normalizeSave(archive.worlds[cartridge.id] as LegacyStorySave | undefined || legacyLocal, cartridge, incomingChatId)
    const nextArchive: StoryArchive = { ...archive, version: 1, worlds: { ...archive.worlds, [cartridge.id]: next } }
    archiveRef.current = nextArchive
    saveRef.current = next
    setSave(next)
    if (next.remoteChatId) {
      setMode('remote')
      const url = new URL(window.location.href)
      if (url.searchParams.get('chat_id') !== next.remoteChatId) {
        url.searchParams.set('chat_id', next.remoteChatId)
        window.history.replaceState({}, '', url)
      }
    }
    if (stored || legacyLocal || incomingChatId) persist(nextArchive)
  }, [cartridge, cloud.loaded, cloud.savedData, incomingChatId, persist])

  const commit = useCallback((recipe: StorySave | ((current: StorySave) => StorySave)) => {
    setSave((current) => {
      const next = typeof recipe === 'function' ? recipe(current) : recipe
      saveRef.current = next
      const archive = archiveRef.current
      const nextArchive: StoryArchive = { ...archive, version: 1, worlds: { ...archive.worlds, [cartridge.id]: next } }
      archiveRef.current = nextArchive
      persist(nextArchive)
      return next
    })
  }, [cartridge.id, persist])

  const pendingSceneImage = save.blocks.find((block) => block.kind === 'image' && block.data?.status === 'queued')
  const queuedSceneImage = imageIdentity.ready ? pendingSceneImage : undefined
  const queuedItemImage = save.inventory.find((item) => item.imageStatus === 'queued')
  const queuedImageKey = queuedSceneImage ? `scene:${queuedSceneImage.id}` : queuedItemImage ? `item:${queuedItemImage.id}` : ''

  useEffect(() => {
    if (!save.entered || !imageIdentity.refUrl) return
    const repairIds = save.blocks.flatMap((block, index) => {
      if (block.kind !== 'image' || (block.id !== 'image-0' && block.id !== 'image-1')) return []
      if (block.data?.status !== 'ready' || Number(block.data?.identityRefVersion ?? 0) >= PLAYER_IMAGE_REFERENCE_VERSION) return []
      const prompt = String(block.data?.prompt ?? '')
      const previousAction = [...save.blocks.slice(0, index)].reverse().find((candidate) => candidate.kind === 'event' && candidate.id.startsWith('action-'))?.text ?? ''
      const directPlayerShot = block.data?.playerVisible === 'true'
        || (block.id === 'image-1' && shouldRepairDirectPlayerAction(prompt, previousAction, cartridge.playerImageAliases))
      return directPlayerShot ? [block.id] : []
    })
    if (!repairIds.length) return
    const repairKey = repairIds.join('|')
    if (openingIdentityRepair.current === repairKey) return
    openingIdentityRepair.current = repairKey
    imageAttempt.current = ''
    commit((current) => ({
      ...current,
      blocks: current.blocks.map((block) => repairIds.includes(block.id) && block.kind === 'image'
        ? { ...block, data: { ...block.data, status: 'queued', url: '', playerVisible: 'true' } }
        : block),
    }))
  }, [cartridge.playerImageAliases, commit, imageIdentity.refUrl, save.blocks, save.entered])

  useEffect(() => {
    if (!save.entered || !queuedImageKey || imageBusy.current || imageAttempt.current === queuedImageKey) return
    const isScene = Boolean(queuedSceneImage)
    const prompt = queuedSceneImage ? String(queuedSceneImage.data?.prompt ?? '') : queuedItemImage ? inventoryImagePrompt(queuedItemImage, cartridge) : ''
    if (!prompt) return
    imageBusy.current = true
    imageAttempt.current = queuedImageKey
    const entityId = queuedSceneImage?.id ?? queuedItemImage!.id
    commit((current) => isScene
      ? updateImageBlock(current, entityId, { status: 'generating' })
      : updateInventoryItemImage(current, entityId, { status: 'generating' }))
    ;(async () => {
      try {
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            const gap = Math.max(0, 3000 - (Date.now() - lastImageCallAt.current))
            if (gap) await new Promise((resolve) => window.setTimeout(resolve, gap))
            const visibility = queuedSceneImage?.data?.playerVisible
            const usePlayerReference = Boolean(isScene && imageIdentity.refUrl && (
              visibility === 'true' || (visibility !== 'false' && shouldUsePlayerImageReference(prompt, cartridge.playerImageAliases))
            ))
            const identityPrompt = usePlayerReference
              ? buildPlayerIdentityPrompt(prompt, cartridge)
              : prompt
            lastImageCallAt.current = Date.now()
            const url = await generate(usePlayerReference
              ? { prompt: identityPrompt, ref_url: imageIdentity.refUrl, requestedSize: mediaDirector.imageTarget, profile: mediaDirector.imageProfile }
              : { prompt: identityPrompt, requestedSize: mediaDirector.imageTarget, profile: mediaDirector.imageProfile })
            if (imageAttempt.current === queuedImageKey) commit((current) => isScene
              ? updateImageBlock(current, entityId, { status: 'ready', url, identityRefVersion: usePlayerReference ? PLAYER_IMAGE_REFERENCE_VERSION : 0 })
              : updateInventoryItemImage(current, entityId, { status: 'ready', url, styleVersion: ITEM_IMAGE_STYLE_VERSION }))
            return
          } catch (cause) {
            const retryable = typeof cause === 'object' && cause !== null && 'retryable' in cause
              ? Boolean((cause as { retryable?: boolean }).retryable)
              : true
            const retryAfterMs = typeof cause === 'object' && cause !== null && 'retryAfterSeconds' in cause
              ? Math.max(0, Number((cause as { retryAfterSeconds?: number }).retryAfterSeconds ?? 0) * 1000)
              : 0
            console.warn('[scene-image] generation attempt failed', {
              entityId,
              attempt: attempt + 1,
              code: typeof cause === 'object' && cause !== null && 'code' in cause ? String((cause as { code?: string }).code ?? '') : '',
              retryable,
              retryAfterMs,
            })
            if (!retryable || attempt >= 2) break
            await new Promise((resolve) => window.setTimeout(
              resolve,
              Math.max(attempt === 0 ? 3000 : 8000, retryAfterMs),
            ))
          }
        }
        if (imageAttempt.current === queuedImageKey) commit((current) => isScene
          ? updateImageBlock(current, entityId, { status: 'failed' })
          : updateInventoryItemImage(current, entityId, { status: 'failed' }))
      } finally {
        imageBusy.current = false
        setImageWorkerTick((tick) => tick + 1)
      }
    })()
  }, [cartridge, commit, generate, imageIdentity.ready, imageIdentity.refUrl, imageWorkerTick, mediaDirector.imageProfile, mediaDirector.imageTarget, queuedImageKey, queuedItemImage, queuedSceneImage, save.entered])

  const milestoneImage = save.blocks.find((block) => block.kind === 'image'
    && block.data?.milestone
    && block.data?.status === 'ready'
    && !block.data?.videoUrl
    && (block.data?.videoStatus === 'queued' || block.data?.videoStatus === 'generating'))
  const milestoneKey = milestoneImage ? `video:${milestoneImage.id}` : ''

  useEffect(() => {
    if (!save.entered || !mediaDirector.videoEnabled || !milestoneImage || !milestoneKey || videoBusy.current || videoAttempt.current === milestoneKey) return
    const index = save.blocks.findIndex((block) => block.id === milestoneImage.id)
    const firstFrame = save.blocks.slice(0, index).reverse().find((block) => block.kind === 'image' && block.data?.status === 'ready' && block.data?.url)
    if (!firstFrame) {
      videoAttempt.current = milestoneKey
      commit((current) => updateImageBlock(current, milestoneImage.id, { videoStatus: 'idle' }))
      return
    }
    const sceneNumber = Number(milestoneImage.id.match(/(\d+)$/)?.[1] ?? 0)
    const previousVideoScene = save.blocks.reduce((latest, block) => {
      if (block.kind !== 'image' || block.data?.videoStatus !== 'ready') return latest
      return Math.max(latest, Number(block.id.match(/(\d+)$/)?.[1] ?? 0))
    }, -999)
    if (sceneNumber - previousVideoScene < mediaDirector.minVideoGapTurns) {
      videoAttempt.current = milestoneKey
      commit((current) => updateImageBlock(current, milestoneImage.id, { videoStatus: 'idle' }))
      return
    }
    const firstFrameUrl = String(firstFrame.data?.url ?? '')
    const lastFrameUrl = String(milestoneImage.data?.url ?? '')
    const prompt = `Create one continuous cinematic transition into this major story milestone. Preserve character identity, wardrobe, location continuity and art direction from both frames. End exactly on the supplied last frame. Current milestone: ${String(milestoneImage.data?.milestone ?? '')}. Scene brief: ${String(milestoneImage.data?.prompt ?? '')}. One camera move, no montage, no new person, no identity swap, no readable text, no logo.`
    videoBusy.current = true
    videoAttempt.current = milestoneKey
    commit((current) => updateImageBlock(current, milestoneImage.id, { videoStatus: 'generating' }))
    void generateVideo({ firstFrameUrl, lastFrameUrl, prompt, duration: mediaDirector.videoDuration })
      .then((result) => commit((current) => updateImageBlock(current, milestoneImage.id, { videoStatus: 'ready', videoUrl: result.url, videoTaskId: result.taskId })))
      .catch(() => commit((current) => updateImageBlock(current, milestoneImage.id, { videoStatus: 'failed' })))
      .finally(() => { videoBusy.current = false })
  }, [commit, generateVideo, mediaDirector.minVideoGapTurns, mediaDirector.videoDuration, mediaDirector.videoEnabled, milestoneImage, milestoneKey, save.blocks, save.entered])

  const enter = useCallback(() => commit((current) => enterStory(current, cartridge)), [cartridge, commit])

  const act = useCallback(async (action: string, actionLocale: Locale = cartridge.locale) => {
    const finale = saveRef.current.finale
    if (!action.trim() || busy || (finale.status !== 'idle' && !finale.epilogueActive)) return
    const normalizedAction = action.trim()
    const activeCartridge = resolveCartridge(cartridge.id, actionLocale)
    setBusy(true); setError(''); setFailedAction(null); setPendingAction(normalizedAction); setProgress({ label: t(actionLocale, 'actionWritten'), percent: 8 })
    try {
      const adapter = mode === 'remote' ? remoteAdapter : mode === 'aigram' ? aigramAdapter : mockAdapter
      const base = localizeKnownState(saveRef.current, cartridge, activeCartridge)
      const domainResolution = resolveDomainAction(base, activeCartridge, normalizedAction)
      const dangerDirective = domainResolution?.status === 'rejected' || domainOwnsDanger(domainResolution) ? undefined : buildDangerDirective(base, activeCartridge, normalizedAction)
      const result = domainResolution
        ? { content: '' }
        : await adapter.send(normalizedAction, { cartridge: activeCartridge, save: base, actionId: normalizedAction, locale: actionLocale, dangerDirective }, setProgress)
      const parsed = parseStoryProtocol(result.content, actionLocale)
      commit((current) => applyParsedScene(localizeKnownState(current, cartridge, activeCartridge), parsed, activeCartridge, normalizedAction, result.imagePrompt, result.imageSubject, dangerDirective, domainResolution))
      setPendingAction('')
      setProgress(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      setFailedAction({ action: normalizedAction, locale: actionLocale })
      setPendingAction('')
      setProgress(null)
    } finally { setBusy(false) }
  }, [busy, cartridge, commit, mode])

  const generateEnding = useCallback(async () => {
    if (busy || !cartridge.endingDirector || !['ready', 'failed'].includes(saveRef.current.finale.status)) return
    const before = saveRef.current
    const snapshot = buildEndingSnapshot(before, cartridge)
    setBusy(true)
    setError('')
    setProgress({ label: cartridge.locale === 'zh' ? '正在回望你的选择' : 'Revisiting your choices', percent: 12 })
    commit((current) => ({ ...current, finale: { status: 'generating', reason: current.finale.reason, snapshot } }))
    try {
      const result = await generateStoryEnding(cartridge, before, setProgress)
      commit((current) => ({
        ...current,
        finale: {
          status: 'complete', reason: current.finale.reason, snapshot: result.snapshot, ending: result.ending,
          error: result.usedFallback && result.errors.length ? result.errors.join('; ') : undefined,
        },
      }))
      setProgress(null)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause)
      commit((current) => ({ ...current, finale: { ...current.finale, status: 'failed', error: message } }))
      setError(message)
      setProgress(null)
    } finally {
      setBusy(false)
    }
  }, [busy, cartridge, commit])

  const retryAction = useCallback(() => { if (failedAction) void act(failedAction.action, failedAction.locale) }, [act, failedAction])
  const continueEpilogue = useCallback(() => {
    if (busy || saveRef.current.finale.status !== 'complete') return
    commit((current) => ({
      ...current,
      sessionEnded: false,
      choices: current.choices.length > 0 ? current.choices : createRecoveryChoices(current, cartridge),
      finale: { ...current.finale, epilogueActive: true },
    }))
  }, [busy, cartridge, commit])
  const useAigramFallback = useCallback(() => { setMode('aigram'); setError('') }, [])
  const retryImage = useCallback((blockId: string) => { imageAttempt.current = ''; commit((current) => updateImageBlock(current, blockId, { status: 'queued' })) }, [commit])
  const prepareInventoryImages = useCallback(() => {
    imageAttempt.current = ''
    commit((current) => {
      const needsPreparation = current.inventory.some((item) => !item.imageUrl || item.imageStyleVersion !== ITEM_IMAGE_STYLE_VERSION || item.imageStatus === 'failed')
      if (!needsPreparation) return current
      return {
        ...current,
        inventory: current.inventory.map((item) => {
          const needsImage = !item.imageUrl || item.imageStyleVersion !== ITEM_IMAGE_STYLE_VERSION || item.imageStatus === 'failed'
          return needsImage ? { ...item, imageStyleVersion: undefined, imageStatus: 'queued' as const } : item
        }),
      }
    })
  }, [commit])
  const restartWorld = useCallback(() => {
    if (busy) return
    imageAttempt.current = `restart:${Date.now()}`
    setError(''); setFailedAction(null); setPendingAction(''); setProgress(null)
    const fresh = createInitialSave(cartridge)
    const archive = archiveRef.current
    const nextArchive: StoryArchive = { ...archive, version: 1, worlds: { ...archive.worlds, [cartridge.id]: fresh } }
    archiveRef.current = nextArchive
    saveRef.current = fresh
    setSave(fresh)
    persist(nextArchive)
    const url = new URL(window.location.href)
    url.searchParams.delete('chat_id')
    window.history.replaceState({}, '', url)
    setMode(url.searchParams.get('story_mode') === 'demo' ? 'demo' : 'aigram')
  }, [busy, cartridge, persist])
  return { save, mode, setMode, busy, progress, error, pendingAction, canRetry: Boolean(failedAction), enter, act, generateEnding, continueEpilogue, retryAction, useAigramFallback, retryImage, prepareInventoryImages, restartWorld, loaded: cloud.loaded && seeded.current, clear: cloud.clear }
}
