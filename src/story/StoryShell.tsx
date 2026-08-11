import { useEffect, useMemo, useRef, useState } from 'react'
import alteruMark from './img/alteru.svg'
import { DEFAULT_CARTRIDGE_ID, listCartridges, resolveCartridge } from './cartridges'
import { Icon, type IconName } from './Icons'
import { detectLocale, detectTextLocale, rememberLocale, t } from './i18n'
import { ITEM_IMAGE_STYLE_VERSION, type DrawerId, type ImageBlockStatus, type InventoryItem, type Locale, type MapNode, type RelationshipEvent, type StatDefinition, type StoryBlock, type StoryCartridge, type StoryCharacter, type StoryMode, type StorySave } from './types'
import { useStoryEngine } from './useStoryEngine'
import { usePlayerProfile, type PlayerProfile } from './usePlayerProfile'
import { useAvatarImageReference } from './useAvatarImageReference'
import { useStoryAudio } from './audio/useStoryAudio'
import { cueForStoryBlocks } from './audio/cueDirector'
import { selectStageOverlay } from './engine/stageNarrative'

function useInitialCartridge() {
  return new URLSearchParams(window.location.search).get('cartridge')
}

function setCssTheme(cartridge: StoryCartridge): React.CSSProperties {
  return {
    '--st-outer': cartridge.theme.outer, '--st-surface': cartridge.theme.surface, '--st-paper': cartridge.theme.paper,
    '--st-ink': cartridge.theme.ink, '--st-muted': cartridge.theme.muted, '--st-accent': cartridge.theme.accent,
    '--st-danger': cartridge.theme.danger, '--st-gold': cartridge.theme.gold,
  } as React.CSSProperties
}

function Entry({ cartridge, onEnter, onSelect, mode, setMode, hasSave, remoteAvailable }: {
  cartridge: StoryCartridge; onEnter: () => void; onSelect: (id: string) => void; mode: StoryMode; setMode: (mode: StoryMode) => void; hasSave: boolean; remoteAvailable: boolean
}) {
  const cartridges = listCartridges(cartridge.locale)
  const showSourceControls = cartridges.length > 1 || new URLSearchParams(window.location.search).get('story_debug') === '1'
  return <main className={`st-entry st-entry--${cartridge.theme.material}`} style={setCssTheme(cartridge)}>
    <div className="st-entry__folio">{t(cartridge.locale, 'folio')}</div>
    <div className="st-entry__rule" />
    <p className="st-entry__kicker">{t(cartridge.locale, 'kicker')}</p>
    <h1>{cartridge.copy.title}</h1>
    <p className="st-entry__subtitle">{cartridge.copy.subtitle}</p>
    <figure className="st-entry__scene"><img src={cartridge.entryImage ?? cartridge.coverImage} alt="" draggable={false} /></figure>
    <p className="st-entry__promise">{cartridge.copy.promise}</p>
    <button className="st-primary" onPointerDown={onEnter}>{hasSave ? cartridge.copy.continue : cartridge.copy.enter}<Icon name="arrow" /></button>
    {cartridges.length > 1 && <div className="st-entry__cartridges" aria-label={t(cartridge.locale, 'chooseWorld')}>
      {cartridges.map((item) => <button key={item.id} className={item.id === cartridge.id ? 'is-active' : ''} onClick={() => onSelect(item.id)}><img src={item.coverImage} alt="" draggable={false} /><span><small>{t(cartridge.locale, 'cartridge')}</small>{item.copy.title}</span></button>)}
    </div>}
    {showSourceControls && <div className="st-entry__source">
      <button className={mode === 'aigram' ? 'is-active' : ''} onClick={() => setMode('aigram')} title={t(cartridge.locale, 'aigramReady')}>{t(cartridge.locale, 'aigram')}</button>
      <button className={mode === 'demo' ? 'is-active' : ''} onClick={() => setMode('demo')}>{t(cartridge.locale, 'demo')}</button>
      <button className={mode === 'remote' ? 'is-active' : ''} onClick={() => setMode('remote')} disabled={!remoteAvailable} title={t(cartridge.locale, remoteAvailable ? 'remoteReady' : 'remoteUnavailable')}>{t(cartridge.locale, 'remote')}</button>
    </div>}
    <div className="st-entry__brand"><img src={alteruMark} alt="" /> ALTERU</div>
  </main>
}

function statPresentation(stat: StatDefinition, value: number) {
  const span = Math.max(1, stat.max - stat.min)
  const ratio = Math.max(0, Math.min(1, (value - stat.min) / span))
  const warningAt = stat.warningAt ?? (stat.inverse ? stat.min + span * .25 : stat.min + span * .6)
  const dangerAt = stat.dangerAt ?? (stat.inverse ? stat.min + span * .1 : stat.min + span * .85)
  const danger = stat.inverse ? value <= dangerAt : value >= dangerAt
  const warning = stat.inverse ? value <= warningAt : value >= warningAt
  return {
    percent: Math.round(ratio * 100),
    thresholdPercent: Math.round(Math.max(0, Math.min(1, (warningAt - stat.min) / span)) * 100),
    tone: danger ? 'danger' : warning ? 'warning' : 'steady',
  }
}

function checkPassed(block: StoryBlock): boolean {
  const outcome = String(block.data?.outcome ?? '')
  if (outcome) return outcome === 'critical-success' || outcome === 'success' || outcome === 'costly-success'
  return Number(block.data?.total) >= Number(block.data?.dc)
}

function PlayerAvatar({ profile, locale, large = false }: { profile: PlayerProfile; locale: Locale; large?: boolean }) {
  const fallback = new URL('./alteru-default-avatar.jpg', document.baseURI).href
  return <span className={`st-player-avatar${large ? ' st-player-avatar--large' : ''}`} title={profile.name}>
    <img src={profile.avatarUrl} alt={large ? t(locale, 'playerAvatarAlt', { name: profile.name }) : ''} draggable={false} onError={(event) => { if (event.currentTarget.src !== fallback) event.currentTarget.src = fallback }} />
  </span>
}

type TextSize = 'small' | 'standard' | 'large'

const TEXT_SIZE_KEY = 'alteru_story_text_size'
const textSizes: TextSize[] = ['small', 'standard', 'large']

function readTextSize(): TextSize {
  const saved = alteruLocalStorage.getItem(TEXT_SIZE_KEY)
  return textSizes.includes(saved as TextSize) ? saved as TextSize : 'standard'
}

function TextSizeControl({ locale, value, onChange }: { locale: Locale; value: TextSize; onChange: (size: TextSize) => void }) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const labelKey = (size: TextSize) => `textSize${size[0].toUpperCase()}${size.slice(1)}` as 'textSizeSmall' | 'textSizeStandard' | 'textSizeLarge'
  const close = () => detailsRef.current?.removeAttribute('open')
  return <details className="st-text-size" ref={detailsRef} onKeyDown={(event) => { if (event.key === 'Escape') close() }}>
    <summary aria-label={`${t(locale, 'textSize')}: ${t(locale, labelKey(value))}`} title={t(locale, 'textSize')}><Icon name="type" /></summary>
    <div role="group" aria-label={t(locale, 'textSize')}>
      {textSizes.map((size) => <button type="button" className={`is-${size}`} aria-pressed={value === size} onClick={() => { onChange(size); close() }} key={size}><span aria-hidden="true">A</span><small>{t(locale, labelKey(size))}</small></button>)}
    </div>
  </details>
}

type UiVariant = 'living' | 'civic'
type TurnPhase = 'decision' | 'resolving' | 'result'

function cartridgeForUi(cartridge: StoryCartridge, uiVariant: UiVariant): StoryCartridge {
  if (uiVariant !== 'civic') return cartridge
  const mediaDirector = cartridge.mediaDirector ?? {
    imageProfile: 'fast-small' as const,
    imageTarget: { width: 640, height: 360 },
    videoEnabled: true,
    videoDuration: 5 as const,
    minVideoGapTurns: 6,
  }
  const portraitRule = 'Compose as a 4:5 portrait master frame for a full-bleed responsive interface. Keep the dominant action, faces and essential props inside the central 58% safe column, while extending environment and atmosphere to every edge. No text or UI.'
  return {
    ...cartridge,
    sceneImageDirection: `${cartridge.sceneImageDirection ?? `${cartridge.theme.material} story-world editorial illustration`}. ${portraitRule}`,
    mediaDirector: { ...mediaDirector, imageTarget: { width: 512, height: 640 } },
    opening: { ...cartridge.opening, imagePrompt: `${cartridge.opening.imagePrompt.replace(/\b(?:landscape\s*)?16:9\s*(?:widescreen|landscape)?\b/gi, '').trim()} ${portraitRule}` },
  }
}

function ConversationHeader({ cartridge, engine, audio, openWorld, openHistory, textSize, setTextSize, uiVariant }: {
  cartridge: StoryCartridge; engine: ReturnType<typeof useStoryEngine>; audio: ReturnType<typeof useStoryAudio>; openWorld: (active?: DrawerId, detail?: WorldDetail) => void; openHistory: () => void; textSize: TextSize; setTextSize: (size: TextSize) => void; uiVariant: UiVariant
}) {
  const audioActive = audio.supported && audio.active
  return <header className="st-chat-header">
    <div className="st-chat-header__top">
      <div className="st-chat-header__identity">
        <div><span>{cartridge.copy.title}</span><i className={engine.mode !== 'demo' ? 'is-live' : ''} /><img src={alteruMark} alt="" /></div>
        <small>{uiVariant === 'civic' ? engine.save.time : `${engine.save.location} · ${engine.save.time}`}</small>
      </div>
      <div className="st-chat-header__actions">
        <button type="button" className="st-history-button" onClick={openHistory} aria-label={t(cartridge.locale, 'storyboard')} title={t(cartridge.locale, 'storyboard')}><Icon name="image" /></button>
        <TextSizeControl locale={cartridge.locale} value={textSize} onChange={setTextSize} />
        <button
          type="button"
          className="st-audio-button"
          aria-label={t(cartridge.locale, audio.supported ? (audioActive ? 'audioMute' : 'audioEnable') : 'audioUnavailable')}
          title={t(cartridge.locale, audio.supported ? (audioActive ? 'audioMute' : 'audioEnable') : 'audioUnavailable')}
          aria-pressed={audioActive}
          onClick={audio.toggle}
          disabled={!audio.supported}
        ><Icon name={audioActive ? 'volume' : 'volumeOff'} /></button>
        <button className="st-world-button" onClick={() => openWorld()} aria-label={t(cartridge.locale, 'world')} title={t(cartridge.locale, 'world')}><Icon name="book" /></button>
      </div>
    </div>
    <div className="st-chat-stats" aria-label={t(cartridge.locale, 'stats')}>
      {cartridge.statDefinitions.map((stat) => {
        const value = engine.save.stats[stat.id] ?? stat.initial
        const presentation = statPresentation(stat, value)
        return <button type="button" className={`st-chat-stat st-chat-stat--${stat.display ?? 'number'} is-${presentation.tone}`} onClick={() => openWorld('party', { type: 'player', statId: stat.id })} aria-label={t(cartridge.locale, 'openStatDetails', { name: stat.label })} key={stat.id}>
          <div className="st-chat-stat__reading"><span>{stat.label}</span><strong>{value}{stat.display === 'number' && <small> / {stat.max}</small>}</strong></div>
          {stat.display === 'bar' && <div className="st-chat-stat__track" role="progressbar" aria-label={stat.label} aria-valuemin={stat.min} aria-valuemax={stat.max} aria-valuenow={value}><i style={{ width: `${presentation.percent}%` }} /><b style={{ left: `${presentation.thresholdPercent}%` }} aria-hidden="true" /></div>}
          <Icon name="arrow" className="st-chat-stat__open" />
        </button>
      })}
    </div>
  </header>
}

function InlineSceneImage({ block, cartridge, retry }: { block: StoryBlock; cartridge: StoryCartridge; retry: (id: string) => void }) {
  const status = String(block.data?.status ?? 'idle') as ImageBlockStatus
  const url = String(block.data?.url ?? '')
  return <figure className={`st-message-image st-message-image--${cartridge.theme.material} is-${status}`} data-block-id={block.id}>
    {url && status === 'ready'
      ? <img src={url} alt={t(cartridge.locale, 'imageAlt', { name: block.text })} draggable={false} />
      : <div className="st-message-image__placeholder" aria-label={t(cartridge.locale, status === 'failed' ? 'imageFailedAria' : 'imageGeneratingAria')}><img src={cartridge.coverImage} alt="" draggable={false} /><span aria-hidden="true" /></div>}
    <figcaption>
      <div><Icon name="image" /><span>{block.text}</span></div>
      <small>{t(cartridge.locale, status === 'idle' ? 'imageIdle' : status === 'queued' ? 'imageQueued' : status === 'generating' ? 'imageGenerating' : status === 'failed' ? 'imageFailed' : 'imageReady')}</small>
      {status === 'failed' && <button onClick={() => retry(block.id)}><Icon name="refresh" />{t(cartridge.locale, 'retry')}</button>}
    </figcaption>
  </figure>
}

function StoryBlockView({ block, cartridge, retryImage, player }: { block: StoryBlock; cartridge: StoryCartridge; retryImage: (id: string) => void; player: PlayerProfile }) {
  if (block.kind === 'image') return <InlineSceneImage block={block} cartridge={cartridge} retry={retryImage} />
  if (block.kind === 'dialogue') return <div className="st-message st-message--character" data-block-id={block.id}><div className="st-message__avatar">{block.speaker?.slice(0, 1)}</div><div className="st-message__body"><header><span>{block.speaker}</span><small>{block.tone}</small></header><p>{block.text}</p></div></div>
  if (block.kind === 'check') return <div className="st-result st-result--check" data-block-id={block.id}><div><span>{checkPassed(block) ? 'PASS' : 'MISS'}</span><p>{block.text}</p></div><section><b>{block.data?.roll}</b><i>+</i><b>{block.data?.modifier}</b><i>=</i><strong>{block.data?.total}</strong><small>DC {block.data?.dc}</small></section></div>
  if (block.kind === 'change') return <div className="st-result st-result--change" data-block-id={block.id}><i /><span>{block.text}</span></div>
  if (block.kind === 'summary') return <section className="st-result st-result--summary" data-block-id={block.id}><small>{t(cartridge.locale, 'summary')}</small><h2>{block.text}</h2><p>{t(cartridge.locale, 'notEnding')}</p></section>
  if (block.kind === 'event' && block.id.startsWith('action-')) return <div className="st-message st-message--player" data-block-id={block.id}><div className="st-message__body"><small>{t(cartridge.locale, 'yourAction')}</small><p>{block.text}</p></div><PlayerAvatar profile={player} locale={cartridge.locale} /></div>
  if (block.kind === 'event') return <div className={`st-system-line${block.data?.dangerPhase ? ' st-system-line--danger' : ''}`} data-block-id={block.id} data-danger-phase={block.data?.dangerPhase}><span>{block.text}</span></div>
  return <div className="st-narration" data-block-id={block.id}><p>{block.text}</p></div>
}

function ConversationFeed({ cartridge, engine, feedRef, endRef, onScroll, player }: {
  cartridge: StoryCartridge; engine: ReturnType<typeof useStoryEngine>;
  feedRef: React.RefObject<HTMLDivElement>; endRef: React.RefObject<HTMLDivElement>; onScroll: () => void; player: PlayerProfile
}) {
  return <div className="st-conversation" ref={feedRef} onScroll={onScroll}>
    <div className="st-conversation__day"><span>{engine.save.location}</span><small>{engine.save.objective}</small></div>
    {engine.save.blocks.map((block) => <StoryBlockView block={block} cartridge={cartridge} retryImage={engine.retryImage} player={player} key={block.id} />)}
    {engine.pendingAction && <div className="st-message st-message--player is-pending" data-pending-action><div className="st-message__body"><small>{t(cartridge.locale, 'yourAction')}</small><p>{engine.pendingAction}</p></div><PlayerAvatar profile={player} locale={cartridge.locale} /></div>}
    {engine.progress && <div className="st-typing"><span><i /><i /><i /></span><p>{engine.progress.label}</p></div>}
    {engine.error && <div className="st-inline-error" data-story-error><p>{engine.error}</p><div>{engine.canRetry && <button onClick={engine.retryAction}>{t(cartridge.locale, 'retryAction')}</button>}{engine.mode === 'remote' && <button onClick={engine.useAigramFallback}>{t(cartridge.locale, 'aigramFallback')}</button>}</div></div>}
    <div className={`st-conversation__end${engine.pendingAction || engine.error || engine.save.scene > 0 ? ' is-active' : ''}`} ref={endRef} />
  </div>
}

function sceneNumberFor(block: StoryBlock): number | null {
  const match = block.id.match(/^(?:image|action)-(\d+)$/)
  return match ? Number(match[1]) : null
}

function sceneBlocks(save: StorySave, scene: number): StoryBlock[] {
  if (scene === 0) {
    const imageIndex = save.blocks.findIndex((block) => block.id === 'image-0')
    return save.blocks.slice(0, imageIndex < 0 ? save.blocks.length : imageIndex + 1)
  }
  const start = save.blocks.findIndex((block) => block.id === `action-${scene}`)
  if (start < 0) return []
  const next = save.blocks.findIndex((block, index) => index > start && block.id === `action-${scene + 1}`)
  return save.blocks.slice(start, next < 0 ? save.blocks.length : next)
}

function sceneSummary(blocks: StoryBlock[], fallback: string): string {
  return blocks.find((block) => block.kind === 'narration' && block.text.trim())?.text
    ?? blocks.find((block) => block.kind === 'dialogue' && block.text.trim())?.text
    ?? blocks.find((block) => block.kind === 'summary' && block.text.trim())?.text
    ?? fallback
}

function captionUnitLength(value: string): number {
  return Array.from(value).reduce((total, character) => total + (/[^\u0000-\u00ff]/.test(character) ? 2 : 1), 0)
}

function splitCaptionPages(value: string, maxUnits = 62): string[] {
  const text = value.trim().replace(/\s+/g, ' ')
  if (!text) return []
  const sentences = text.match(/[^。！？!?；;，,：:、]+[。！？!?；;，,：:、]?/g) ?? [text]
  const pages: string[] = []
  let page = ''

  const pushLongSegment = (segment: string) => {
    let chunk = ''
    Array.from(segment).forEach((character) => {
      if (chunk && captionUnitLength(chunk + character) > maxUnits) {
        pages.push(chunk.trim())
        chunk = ''
      }
      chunk += character
    })
    if (chunk.trim()) page = chunk.trim()
  }

  sentences.forEach((sentence) => {
    const segment = sentence.trim()
    if (!segment) return
    const combined = page ? `${page}${segment}` : segment
    if (captionUnitLength(combined) <= maxUnits) {
      page = combined
      return
    }
    if (page) {
      pages.push(page)
      page = ''
    }
    if (captionUnitLength(segment) <= maxUnits) page = segment
    else pushLongSegment(segment)
  })
  if (page) pages.push(page)
  return pages
}

function CivicResultStory({ block, cartridge }: { block: StoryBlock; cartridge: StoryCartridge }) {
  const pages = useMemo(() => splitCaptionPages(block.text, 82), [block.id, block.text])
  const [page, setPage] = useState(0)
  useEffect(() => { setPage(0) }, [block.id])
  const current = pages[Math.min(page, Math.max(0, pages.length - 1))] ?? block.text
  return <section className={`ct-result-story ct-result-story--${block.kind}`} data-block-id={block.id}>
    <div>
      {block.kind === 'dialogue' && block.speaker && <small>{block.speaker}</small>}
      <p>{current}</p>
    </div>
    {pages.length > 1 && <button type="button" aria-label={t(cartridge.locale, 'nextCaptionPage')} onClick={() => setPage((currentPage) => (currentPage + 1) % pages.length)}><span>{page + 1}/{pages.length}</span><Icon name="arrow" /></button>}
  </section>
}

function compactBeat(blocks: StoryBlock[], overlayId: string | undefined, uiVariant: UiVariant): StoryBlock[] {
  if (uiVariant === 'civic') {
    const supportingStory = blocks.find((block) => (block.kind === 'narration' || block.kind === 'dialogue') && block.id !== overlayId)
    const seen = new Set<string>()
    const candidates = blocks.filter((block) => {
      if (!(block.kind === 'check' || block.kind === 'change' || block.kind === 'summary' || (block.kind === 'event' && !block.id.startsWith('action-')))) return false
      const key = `${block.kind}:${block.text.trim()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    const outcomes = [
      ...candidates.filter((block) => block.kind === 'check'),
      ...candidates.filter((block) => block.kind === 'change'),
      ...candidates.filter((block) => block.kind === 'summary'),
      ...candidates.filter((block) => block.kind === 'event'),
    ].slice(0, 2)
    return [supportingStory, ...outcomes].filter((block): block is StoryBlock => Boolean(block))
  }
  const narration = blocks.find((block) => block.kind === 'narration')
  const dialogue = blocks.filter((block) => block.kind === 'dialogue').slice(0, 2)
  const outcome = blocks.filter((block) => block.kind === 'check' || block.kind === 'change' || block.kind === 'summary' || (block.kind === 'event' && !block.id.startsWith('action-'))).slice(0, 3)
  return [narration, ...dialogue, ...outcome].filter((block): block is StoryBlock => Boolean(block))
}

function CinematicStage({ cartridge, engine, player, previewScene, onReturnLatest, uiVariant, turnPhase, lastAction }: {
  cartridge: StoryCartridge
  engine: ReturnType<typeof useStoryEngine>
  player: PlayerProfile
  previewScene: number | null
  onReturnLatest: () => void
  uiVariant: UiVariant
  turnPhase: TurnPhase
  lastAction: string
}) {
  const scene = previewScene ?? engine.save.scene
  const blocks = sceneBlocks(engine.save, scene)
  const image = engine.save.blocks.find((block) => block.id === `image-${scene}` && block.kind === 'image')
  const imageIndex = image ? engine.save.blocks.indexOf(image) : engine.save.blocks.length
  const previousReady = engine.save.blocks.slice(0, imageIndex).reverse().find((block) => block.kind === 'image' && block.data?.status === 'ready' && block.data?.url)
  const status = String(image?.data?.status ?? 'idle') as ImageBlockStatus
  const imageUrl = status === 'ready' ? String(image?.data?.url ?? '') : String(previousReady?.data?.url ?? '')
  const videoUrl = String(image?.data?.videoUrl ?? '')
  const videoStatus = String(image?.data?.videoStatus ?? 'idle')
  const isPreview = previewScene != null && previewScene !== engine.save.scene
  const selectedOverlayBlock = selectStageOverlay(blocks, turnPhase, isPreview)
  // The result owns the lower outcome tray. Keeping the persistent caption here
  // would show the same beat twice and visually compete with the resolved action.
  // The caption returns only after the player advances into the next decision.
  const overlayBlock = !isPreview && turnPhase === 'result' ? undefined : selectedOverlayBlock
  const actionBlock = blocks.find((block) => block.kind === 'event' && block.id.startsWith('action-'))
  const actionText = isPreview
    ? actionBlock?.text
    : turnPhase === 'decision' ? undefined : engine.pendingAction || lastAction || actionBlock?.text
  const compact = compactBeat(blocks, overlayBlock?.id, uiVariant).filter((block) => block.id !== overlayBlock?.id)
  const openingDecision = !isPreview && turnPhase === 'decision' && scene === 0
  const visibleCompact = !isPreview && (turnPhase === 'resolving' || (turnPhase === 'decision' && !openingDecision)) ? [] : compact
  const speakerInitial = overlayBlock?.kind === 'dialogue' && overlayBlock.speaker ? Array.from(overlayBlock.speaker)[0] : ''
  const captionPages = useMemo(
    () => splitCaptionPages(overlayBlock?.text ?? '', overlayBlock?.kind === 'dialogue' ? 44 : 54),
    [overlayBlock?.id, overlayBlock?.kind, overlayBlock?.text],
  )
  const [captionPage, setCaptionPage] = useState(0)
  const beatRef = useRef<HTMLElement>(null)
  const [civicBeatHeight, setCivicBeatHeight] = useState<number | null>(null)
  useEffect(() => { setCaptionPage(0) }, [overlayBlock?.id, scene])
  useEffect(() => {
    if (uiVariant !== 'civic' || turnPhase !== 'result' || isPreview) {
      setCivicBeatHeight(null)
      return
    }
    const node = beatRef.current
    if (!node) return
    const updateHeight = () => setCivicBeatHeight(Math.round(node.getBoundingClientRect().height))
    updateHeight()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(updateHeight)
    observer.observe(node)
    return () => observer.disconnect()
  }, [engine.error, isPreview, turnPhase, uiVariant, visibleCompact.length])
  const captionText = captionPages[Math.min(captionPage, Math.max(0, captionPages.length - 1))] ?? overlayBlock?.text ?? ''
  const civicResultStory = uiVariant === 'civic' && turnPhase === 'result' && !isPreview
    ? visibleCompact.find((block) => block.kind === 'narration' || block.kind === 'dialogue')
    : undefined
  const civicResultOutcomes = civicResultStory ? visibleCompact.filter((block) => block.id !== civicResultStory.id) : visibleCompact
  const compactCivicBeat = uiVariant === 'civic' && turnPhase === 'result' && !isPreview && !engine.error
    && visibleCompact.length === 1 && visibleCompact[0].kind === 'event' && captionUnitLength(visibleCompact[0].text) <= 82
  const emptyCivicBeat = uiVariant === 'civic' && turnPhase === 'result' && !isPreview && !engine.error && visibleCompact.length === 0
  const stageClass = `ct-stage is-${turnPhase}${openingDecision ? ' is-opening' : ''}${isPreview ? ' is-preview' : ''}${compactCivicBeat ? ' is-compact-beat' : ''}${emptyCivicBeat ? ' is-empty-beat' : ''}`
  const stageStyle = civicBeatHeight == null ? undefined : { '--ct-civic-local-tray': `${civicBeatHeight}px` } as React.CSSProperties
  return <section className={stageClass} style={stageStyle} aria-label={t(cartridge.locale, 'currentScene')}>
    <figure className={`ct-stage__media is-${status}${videoUrl ? ' has-video' : ''}`}>
      {videoUrl && videoStatus === 'ready'
        ? <video src={videoUrl} poster={String(image?.data?.url ?? '')} controls playsInline muted preload="metadata" />
        : <img src={imageUrl || cartridge.entryImage || cartridge.coverImage} alt={t(cartridge.locale, 'imageAlt', { name: image?.text ?? engine.save.location })} draggable={false} />}
      {status !== 'ready' && <div className="ct-stage__developing" aria-live="polite"><span /><div><small>{t(cartridge.locale, 'sceneNumber', { n: scene + 1 })}</small><strong>{t(cartridge.locale, status === 'failed' ? 'imageFailed' : 'imageGenerating')}</strong></div>{status === 'failed' && image && <button type="button" onClick={() => engine.retryImage(image.id)}>{t(cartridge.locale, 'retry')}</button>}</div>}
      {videoStatus === 'generating' && <div className="ct-stage__video-status"><Icon name="image" /><span>{t(cartridge.locale, 'videoGenerating')}</span></div>}
      {image?.data?.milestone && <span className="ct-stage__milestone">{t(cartridge.locale, 'milestone')}</span>}
      {uiVariant === 'civic' && actionText && <div className={`ct-stage__action${engine.pendingAction && !isPreview ? ' is-pending' : ''}`}><small>{t(cartridge.locale, 'yourAction')}</small><p>{actionText}</p></div>}
      {overlayBlock && <div className={`ct-stage__caption ct-stage__caption--${overlayBlock.kind}`}>
        {speakerInitial && <span className="ct-stage__speaker" aria-hidden="true">{speakerInitial}</span>}
        <div><small>{overlayBlock.speaker ?? t(cartridge.locale, turnPhase === 'decision' && !isPreview ? 'chooseNextAction' : 'now')}</small><p>{captionText}</p></div>
        {captionPages.length > 1 && <button type="button" className="ct-stage__caption-page" aria-label={t(cartridge.locale, 'nextCaptionPage')} onClick={() => setCaptionPage((current) => (current + 1) % captionPages.length)}><span>{captionPage + 1}/{captionPages.length}</span><Icon name="arrow" /></button>}
      </div>}
      <figcaption><span>{image?.text ?? engine.save.location}</span><small>{t(cartridge.locale, 'sceneNumber', { n: scene + 1 })}</small></figcaption>
    </figure>
    <article className="ct-stage__beat" ref={beatRef}>
      <header className={isPreview ? 'is-preview' : ''}><div><small>{isPreview ? t(cartridge.locale, 'reviewingScene') : t(cartridge.locale, 'now')}</small><strong>{image?.text ?? engine.save.location}</strong></div>{isPreview && <button type="button" onClick={onReturnLatest}>{t(cartridge.locale, 'returnLatest')}</button>}</header>
      <div className="ct-stage__blocks">
        {!isPreview && turnPhase === 'decision' && !openingDecision && <div className="ct-stage__decision-context"><small>{t(cartridge.locale, 'currentObjective')}</small><p>{engine.save.objective}</p></div>}
        {actionText && !isPreview && uiVariant !== 'civic' && turnPhase !== 'decision' && <div className={`st-message st-message--player${engine.pendingAction ? ' is-pending' : ''}`} data-pending-action><div className="st-message__body"><small>{t(cartridge.locale, 'yourAction')}</small><p>{actionText}</p></div><PlayerAvatar profile={player} locale={cartridge.locale} /></div>}
        {civicResultStory && <CivicResultStory block={civicResultStory} cartridge={cartridge} />}
        {civicResultOutcomes.map((block) => <StoryBlockView block={block} cartridge={cartridge} retryImage={engine.retryImage} player={player} key={block.id} />)}
        {engine.progress && !isPreview && <div className="st-typing"><span><i /><i /><i /></span><p>{engine.progress.label}</p></div>}
        {engine.error && !isPreview && <div className="st-inline-error" data-story-error><p>{engine.error}</p><div>{engine.canRetry && <button onClick={engine.retryAction}>{t(cartridge.locale, 'retryAction')}</button>}{engine.mode === 'remote' && <button onClick={engine.useAigramFallback}>{t(cartridge.locale, 'aigramFallback')}</button>}</div></div>}
      </div>
    </article>
  </section>
}

function Storyboard({ cartridge, save, close, select }: { cartridge: StoryCartridge; save: StorySave; close: () => void; select: (scene: number) => void }) {
  const scenes = save.blocks.filter((block) => block.kind === 'image').map((image) => ({ image, scene: sceneNumberFor(image) ?? 0 })).reverse()
  return <div className="ct-storyboard" role="dialog" aria-modal="true" aria-label={t(cartridge.locale, 'storyboard')}>
    <button className="ct-storyboard__scrim" onClick={close} aria-label={t(cartridge.locale, 'close')} />
    <section>
      <header><div><small>ALTERU · CUTS</small><h2>{t(cartridge.locale, 'storyboard')}</h2></div><button type="button" onClick={close} aria-label={t(cartridge.locale, 'close')}><Icon name="close" /></button></header>
      <div className="ct-storyboard__list">{scenes.map(({ image, scene }) => {
        const url = String(image.data?.url ?? '')
        return <button type="button" onClick={() => { select(scene); close() }} key={image.id}>
          <span className="ct-storyboard__thumb">{url ? <img src={url} alt="" draggable={false} /> : <img src={cartridge.entryImage || cartridge.coverImage} alt="" draggable={false} />}{image.data?.videoUrl && <i><Icon name="image" /></i>}</span>
          <span><small>{t(cartridge.locale, 'sceneNumber', { n: scene + 1 })} · {image.text}</small><strong>{sceneSummary(sceneBlocks(save, scene), save.objective)}</strong></span>
          <Icon name="arrow" />
        </button>
      })}</div>
    </section>
  </div>
}

function Composer({ cartridge, engine, onAct, uiVariant }: { cartridge: StoryCartridge; engine: ReturnType<typeof useStoryEngine>; onAct: (action: string) => void; uiVariant: UiVariant }) {
  const [custom, setCustom] = useState('')
  const repliesRef = useRef<HTMLDivElement>(null)
  useEffect(() => { repliesRef.current?.scrollTo({ left: 0, behavior: 'auto' }) }, [engine.save.scene])
  const submit = () => {
    const value = custom.trim()
    if (!value || engine.busy) return
    onAct(value); setCustom('')
  }
  const hasStoryChoices = engine.save.choices.length > 0
  const closedCheckpoint = engine.save.sessionEnded && !hasStoryChoices
  const choices = hasStoryChoices ? engine.save.choices : closedCheckpoint ? [{ id: `continue-${engine.save.scene}`, label: cartridge.copy.continue }] : []
  return <section className="st-composer" aria-label={t(cartridge.locale, 'reply')}>
    <div className="st-quick-replies" ref={repliesRef}>
      {choices.map((choice, index) => {
        const visualUnits = Array.from(choice.label).reduce((total, character) => total + (/[^\u0000-\u00ff]/.test(character) ? 2 : 1), 0)
        const adaptiveWidth = uiVariant === 'civic'
          ? `${Math.min(286, Math.max(168, Math.round(144 + visualUnits * 2.4)))}px`
          : `${Math.min(310, Math.max(148, Math.round(132 + visualUnits * 2.5)))}px`
        return <button key={choice.id} style={{ '--st-choice-width': adaptiveWidth } as React.CSSProperties} disabled={engine.busy} onClick={() => onAct(choice.label)}><small>{String(index + 1).padStart(2, '0')}</small><span>{choice.label}</span><Icon name="arrow" /></button>
      })}
    </div>
    <form onSubmit={(event) => { event.preventDefault(); submit() }}>
      <Icon name="pen" />
      <input aria-label={t(cartridge.locale, 'customAction')} value={custom} onChange={(event) => setCustom(event.target.value)} placeholder={cartridge.copy.customAction} disabled={engine.busy || closedCheckpoint} maxLength={240} />
      <button type="button" onPointerDown={submit} disabled={!custom.trim() || engine.busy || closedCheckpoint} aria-label={t(cartridge.locale, 'sendAction')}><Icon name="arrow" /></button>
    </form>
  </section>
}

function EndingExperience({ cartridge, engine }: { cartridge: StoryCartridge; engine: ReturnType<typeof useStoryEngine> }) {
  const finale = engine.save.finale
  if (finale.status === 'idle' || finale.epilogueActive) return null
  if (finale.status !== 'complete' || !finale.ending) return <div className="st-ending-gate" role="status" aria-live="polite">
    <section>
      <small>{finale.reason ?? t(cartridge.locale, 'finaleReady')}</small>
      <h2>{finale.status === 'generating' ? t(cartridge.locale, 'endingGenerating') : t(cartridge.locale, 'writeEnding')}</h2>
      {engine.progress && <div className="st-ending-gate__progress"><i style={{ width: `${engine.progress.percent ?? 36}%` }} /><span>{engine.progress.label}</span></div>}
      {finale.error && <p>{finale.error}</p>}
      {finale.status !== 'generating' && <button type="button" disabled={engine.busy} onClick={engine.generateEnding}>{t(cartridge.locale, 'writeEnding')}<Icon name="arrow" /></button>}
    </section>
  </div>
  const ending = finale.ending
  const characterNames = new Map(engine.save.characters.map((character) => [character.id, character.name]))
  const regionNames = new Map(engine.save.map.map((node) => [node.id, node.label]))
  return <div className="st-ending" role="dialog" aria-modal="true" aria-labelledby="st-ending-title">
    <article>
      <header><small>{t(cartridge.locale, ending.generated ? 'generatedEnding' : 'anchorEnding')}</small><h1 id="st-ending-title">{ending.title}</h1><p>{ending.thesis}</p></header>
      <ol className="st-ending__scenes">{ending.finaleScenes.map((scene, index) => <li key={`${index}-${scene}`}>{scene}</li>)}</ol>
      <div className="st-ending__ledger">
        <section><small>{t(cartridge.locale, 'endingPreserved')}</small>{ending.preserved.map((entry) => <p key={entry}>{entry}</p>)}</section>
        <section><small>{t(cartridge.locale, 'endingLost')}</small>{ending.lost.map((entry) => <p key={entry}>{entry}</p>)}</section>
        <section><small>{t(cartridge.locale, 'endingUnresolved')}</small>{ending.unresolved.map((entry) => <p key={entry}>{entry}</p>)}</section>
      </div>
      <section className="st-ending__epilogues"><h2>{t(cartridge.locale, 'characterEpilogues')}</h2>{ending.characterEpilogues.map((entry) => <div key={entry.characterId}><strong>{characterNames.get(entry.characterId) ?? entry.characterId}</strong><p>{entry.text}</p></div>)}</section>
      <section className="st-ending__epilogues"><h2>{t(cartridge.locale, 'regionalEpilogues')}</h2>{ending.regionalEpilogues.map((entry) => <div key={entry.regionId}><strong>{regionNames.get(entry.regionId) ?? entry.regionId}</strong><p>{entry.text}</p></div>)}</section>
      {!ending.generated && finale.error && <p className="st-ending__fallback">{t(cartridge.locale, 'endingFallbackNote')}</p>}
      <footer><button type="button" onClick={engine.continueEpilogue}>{t(cartridge.locale, 'continueEpilogue')}<Icon name="arrow" /></button></footer>
    </article>
  </div>
}

const drawerIcons: Record<DrawerId, IconName> = { party: 'people', map: 'map', inventory: 'bag', log: 'book' }

type WorldDetail =
  | { type: 'player'; statId?: string }
  | { type: 'character'; id: string }
  | { type: 'map'; id: string }
  | { type: 'inventory'; id: string }
  | { type: 'objective' }
  | { type: 'relationship'; id: string }
  | { type: 'system' }

function DetailSection({ label, children }: { label: string; children: React.ReactNode }) {
  return <section className="st-world-detail__section"><small>{label}</small>{children}</section>
}

function DetailMetrics({ rows }: { rows: Array<{ label: string; value: string | number }> }) {
  return <dl className="st-world-detail__metrics">{rows.map((row, index) => <div key={`${row.label}-${index}`}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>
}

function PlayerDetail({ player, save, cartridge, focusedStatId, openSection }: {
  player: PlayerProfile; save: ReturnType<typeof useStoryEngine>['save']; cartridge: StoryCartridge; focusedStatId?: string; openSection: (id: DrawerId) => void
}) {
  const itemCount = save.inventory.reduce((total, item) => total + item.count, 0)
  return <div className="st-world-detail st-player-detail">
    <div className="st-world-detail__hero"><PlayerAvatar profile={player} locale={cartridge.locale} large /><div><h3>{player.name}</h3><p>{t(cartridge.locale, 'protagonist')}</p></div></div>
    <DetailSection label={t(cartridge.locale, 'currentStatus')}>
      <div className="st-player-status-list">{cartridge.statDefinitions.map((stat) => {
        const value = save.stats[stat.id] ?? stat.initial
        const presentation = statPresentation(stat, value)
        return <section className={`st-player-status-card is-${presentation.tone}${focusedStatId === stat.id ? ' is-focused' : ''}`} key={stat.id}>
          <div><span>{stat.label}</span><strong>{value}<small> / {stat.max}</small></strong></div>
          <div className="st-player-status-card__track" role="progressbar" aria-label={stat.label} aria-valuemin={stat.min} aria-valuemax={stat.max} aria-valuenow={value}><i style={{ width: `${presentation.percent}%` }} /><b style={{ left: `${presentation.thresholdPercent}%` }} /></div>
          <small>{stat.min} — {stat.max}</small>
        </section>
      })}</div>
    </DetailSection>
    <DetailSection label={t(cartridge.locale, 'journeyOverview')}><DetailMetrics rows={[
      { label: t(cartridge.locale, 'here'), value: save.location },
      { label: t(cartridge.locale, 'system'), value: save.time },
      { label: t(cartridge.locale, 'storySegments'), value: save.scene + 1 },
      { label: t(cartridge.locale, 'companion'), value: save.partyMemberIds.length },
      { label: t(cartridge.locale, 'inventoryItems'), value: itemCount },
    ]} /></DetailSection>
    <DetailSection label={t(cartridge.locale, 'currentObjective')}><p>{save.objective}</p></DetailSection>
    <nav className="st-world-detail__links" aria-label={t(cartridge.locale, 'openWorldSection')}>
      {(['map', 'inventory', 'log'] as DrawerId[]).map((id) => <button type="button" onClick={() => openSection(id)} key={id}><Icon name={drawerIcons[id]} /><span>{cartridge.drawerLabels[id]}</span><Icon name="arrow" /></button>)}
    </nav>
  </div>
}

function characterStatusLabel(character: StoryCharacter, cartridge: StoryCartridge) {
  return t(cartridge.locale, character.status === 'companion' ? 'partyStatusCompanion' : character.status === 'departed' ? 'partyStatusDeparted' : 'partyStatusKnown')
}

function CharacterDetail({ character, relationships, cartridge }: { character: StoryCharacter; relationships: RelationshipEvent[]; cartridge: StoryCartridge }) {
  const history = relationships.filter((event) => event.characterId === character.id || (!event.characterId && event.actor === character.name))
  return <div className="st-world-detail">
    <div className="st-world-detail__hero"><div className="st-roster__initial">{character.name.slice(0, 1)}</div><div><h3>{character.name}</h3><p>{character.role}</p></div></div>
    <DetailSection label={t(cartridge.locale, 'currentStatus')}><DetailMetrics rows={[{ label: t(cartridge.locale, 'currentStatus'), value: characterStatusLabel(character, cartridge) }, { label: t(cartridge.locale, 'vitality'), value: character.vitality }, { label: t(cartridge.locale, 'stress'), value: character.stress }]} /></DetailSection>
    <DetailSection label={t(cartridge.locale, 'abilities')}><DetailMetrics rows={character.skills.map((skill) => ({ label: skill.label, value: `${skill.value >= 0 ? '+' : ''}${skill.value}` }))} /></DetailSection>
    <DetailSection label={t(cartridge.locale, 'itemDescription')}><p>{character.detail ?? t(cartridge.locale, 'noDetails')}</p></DetailSection>
    {character.lore && <DetailSection label={t(cartridge.locale, 'background')}><p>{character.lore}</p></DetailSection>}
    <DetailSection label={t(cartridge.locale, 'relationshipHistory')}>{history.length ? <ul>{history.map((event) => <li key={event.id}>{event.axis} · {t(cartridge.locale, event.delta > 0 ? 'warmer' : 'colder')}</li>)}</ul> : <p>{t(cartridge.locale, 'noRelationshipHistory')}</p>}</DetailSection>
  </div>
}

function MapDetail({ node, map, cartridge }: { node: MapNode; map: MapNode[]; cartridge: StoryCartridge }) {
  const connections = Array.from(new Set([node.connectedTo, ...map.filter((candidate) => candidate.connectedTo === node.label).map((candidate) => candidate.label)].filter((value): value is string => Boolean(value))))
  return <div className="st-world-detail">
    <div className="st-world-detail__hero"><div className="st-world-detail__glyph"><Icon name="map" /></div><div><h3>{node.label}</h3><p>{node.current ? t(cartridge.locale, 'here') : t(cartridge.locale, 'worldRecord')}</p></div></div>
    <DetailSection label={t(cartridge.locale, 'placeOverview')}><p>{node.detail ?? t(cartridge.locale, 'noDetails')}</p></DetailSection>
    <DetailSection label={t(cartridge.locale, 'connections')}>{connections.length ? <ul>{connections.map((label) => <li key={label}>{label}</li>)}</ul> : <p>{t(cartridge.locale, 'noKnownFacts')}</p>}</DetailSection>
    <DetailSection label={t(cartridge.locale, 'knownFacts')}>{node.facts?.length ? <ul>{node.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul> : <p>{t(cartridge.locale, 'noKnownFacts')}</p>}</DetailSection>
    {node.lore && <DetailSection label={t(cartridge.locale, 'background')}><p>{node.lore}</p></DetailSection>}
  </div>
}

function ItemDetail({ item, cartridge }: { item: InventoryItem; cartridge: StoryCartridge }) {
  const status = item.imageStatus ?? (item.imageUrl ? 'ready' : 'idle')
  const currentImageUrl = item.imageStyleVersion === ITEM_IMAGE_STYLE_VERSION ? item.imageUrl : undefined
  const rarity = item.rarity ?? 'common'
  const statusKey = `itemImage${status[0].toUpperCase()}${status.slice(1)}` as 'itemImageIdle' | 'itemImageQueued' | 'itemImageGenerating' | 'itemImageFailed' | 'itemImageReady'
  const metrics = [{ label: t(cartridge.locale, 'quantity'), value: `× ${item.count}` }, { label: t(cartridge.locale, 'rarity'), value: t(cartridge.locale, rarity === 'legendary' ? 'rarityLegendary' : rarity === 'rare' ? 'rarityRare' : 'rarityCommon') }, ...(item.metrics ?? [])]
  return <div className={`st-world-detail st-world-detail--item is-${rarity}`}>
    <figure className={`st-item-illustration is-${status}`}>
      {currentImageUrl ? <img src={currentImageUrl} alt={item.label} draggable={false} /> : <div><Icon name="bag" /><span>{item.label}</span></div>}
      <figcaption><small>{t(cartridge.locale, 'itemIllustration')}</small><p>{t(cartridge.locale, statusKey)}</p></figcaption>
    </figure>
    <DetailSection label={t(cartridge.locale, 'itemMetrics')}><DetailMetrics rows={metrics} /></DetailSection>
    <DetailSection label={t(cartridge.locale, 'itemDescription')}><p>{item.detail ?? t(cartridge.locale, 'noDetails')}</p></DetailSection>
    <DetailSection label={t(cartridge.locale, 'itemEffect')}><p>{item.effect ?? t(cartridge.locale, 'noDetails')}</p></DetailSection>
    <DetailSection label={t(cartridge.locale, 'itemLore')}><p>{item.lore ?? t(cartridge.locale, 'noDetails')}</p></DetailSection>
  </div>
}

function SystemDetail({ cartridge, engine, restart }: {
  cartridge: StoryCartridge; engine: ReturnType<typeof useStoryEngine>; restart: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  return <div className="st-world-detail">
    <DetailSection label={t(cartridge.locale, 'system')}><p>{t(cartridge.locale, 'segmentSaved', { n: engine.save.scene + 1 })}</p></DetailSection>
    <DetailMetrics rows={[{ label: t(cartridge.locale, 'here'), value: engine.save.location }, { label: t(cartridge.locale, 'system'), value: engine.save.time }]} />
    <section className="st-world-restart">
      <small>{t(cartridge.locale, 'startOver')}</small>
      <p>{t(cartridge.locale, 'startOverDescription')}</p>
      {engine.busy && <p className="st-world-restart__busy" role="status">{t(cartridge.locale, 'startOverBusy')}</p>}
      {!confirming
        ? <button className="st-world-restart__open" onClick={() => setConfirming(true)} disabled={engine.busy}>{t(cartridge.locale, 'startOver')}</button>
        : <div className="st-world-restart__confirm" role="alert">
          <p>{t(cartridge.locale, 'startOverWarning')}</p>
          <div><button onClick={() => setConfirming(false)}>{t(cartridge.locale, 'startOverCancel')}</button><button className="is-danger" onClick={restart}>{t(cartridge.locale, 'startOverConfirm')}</button></div>
        </div>}
    </section>
  </div>
}

function WorldDrawer({ active, setActive, detail, setDetail, cartridge, engine, close, player }: {
  active: DrawerId; setActive: (id: DrawerId) => void; detail: WorldDetail | null; setDetail: (detail: WorldDetail | null) => void; cartridge: StoryCartridge; engine: ReturnType<typeof useStoryEngine>; close: () => void; player: PlayerProfile
}) {
  const save = engine.save
  const character = detail?.type === 'character' ? save.characters.find((entry) => entry.id === detail.id) : undefined
  const roster = [...save.characters].sort((left, right) => {
    const rank = { companion: 0, known: 1, departed: 2 }
    return rank[left.status] - rank[right.status] || right.updatedAtScene - left.updatedAtScene || left.name.localeCompare(right.name)
  })
  const mapNode = detail?.type === 'map' ? save.map.find((entry) => entry.id === detail.id) : undefined
  const item = detail?.type === 'inventory' ? save.inventory.find((entry) => entry.id === detail.id) : undefined
  const relationship = detail?.type === 'relationship' ? save.relationships.find((entry) => entry.id === detail.id) : undefined
  const revealingItems = save.inventory.some((entry) => entry.imageStatus === 'queued' || entry.imageStatus === 'generating')
  const hasCurrentItemImage = save.inventory.some((entry) => entry.imageUrl && entry.imageStyleVersion === ITEM_IMAGE_STYLE_VERSION)
  const detailTitle = detail?.type === 'player' ? player.name : character?.name ?? mapNode?.label ?? item?.label ?? (detail?.type === 'objective' ? t(cartridge.locale, 'currentObjective') : detail?.type === 'system' ? t(cartridge.locale, 'system') : relationship?.actor)
  useEffect(() => {
    if (active === 'inventory') engine.prepareInventoryImages()
  }, [active, engine.prepareInventoryImages])
  return <div className="st-drawer" role="dialog" aria-modal="true" aria-label={t(cartridge.locale, 'worldData')}><button className="st-drawer__scrim" onClick={close} aria-label={t(cartridge.locale, 'closeWorldData')} /><section>
    <header className={detail ? 'is-detail' : ''}>{detail ? <button onClick={() => setDetail(null)} aria-label={t(cartridge.locale, 'back')} title={t(cartridge.locale, 'back')}><Icon name="back" /></button> : <span className="st-drawer__header-spacer" />}<div><small>{detail ? t(cartridge.locale, 'openDetails') : t(cartridge.locale, 'worldRecord')}</small><h2>{detailTitle ?? cartridge.copy.title}</h2></div><button onClick={close} aria-label={t(cartridge.locale, 'close')}><Icon name="close" /></button></header>
    {!detail && <nav className="st-drawer-tabs">{(Object.keys(cartridge.drawerLabels) as DrawerId[]).map((id) => <button className={active === id ? 'is-active' : ''} onClick={() => { setDetail(null); setActive(id) }} key={id}><Icon name={drawerIcons[id]} /><span>{cartridge.drawerLabels[id]}</span></button>)}</nav>}
    {!detail && active === 'party' && <div className="st-roster"><button className="st-entity-row st-roster__player" onClick={() => setDetail({ type: 'player' })}><PlayerAvatar profile={player} locale={cartridge.locale} large /><div><h3>{player.name}</h3><p>{t(cartridge.locale, 'protagonist')}</p></div><strong>{t(cartridge.locale, 'you')}</strong><Icon name="arrow" /></button>{roster.map((entry) => <button className={`st-entity-row is-${entry.status}`} onClick={() => setDetail({ type: 'character', id: entry.id })} key={entry.id}><div className="st-roster__initial">{entry.name.slice(0, 1)}</div><div><h3>{entry.name}</h3><p>{entry.role} · {characterStatusLabel(entry, cartridge)}</p><small>{t(cartridge.locale, 'vitality')} {entry.vitality} · {t(cartridge.locale, 'stress')} {entry.stress}</small></div><ul>{entry.skills.slice(0, 2).map((skill) => <li key={skill.id}>{skill.label}<b>{skill.value >= 0 ? '+' : ''}{skill.value}</b></li>)}</ul><Icon name="arrow" /></button>)}</div>}
    {!detail && active === 'map' && <div className="st-map">{save.map.map((node, index) => <button className={`st-entity-row${node.current ? ' is-current' : ''}`} data-connected={Boolean(node.connectedTo)} onClick={() => setDetail({ type: 'map', id: node.id })} key={node.id}><small>{String(index + 1).padStart(2, '0')}</small><span>{node.label}{node.connectedTo && <i>{node.connectedTo}</i>}</span>{node.current && <b>{t(cartridge.locale, 'here')}</b>}<Icon name="arrow" /></button>)}</div>}
    {!detail && active === 'inventory' && <div className="st-inventory">{revealingItems && !hasCurrentItemImage && <aside className="st-inventory-reveal" aria-live="polite"><Icon name="image" /><div><strong>{cartridge.copy.itemImagingTitle}</strong><p>{cartridge.copy.itemImagingBody}</p></div><i aria-hidden="true" /></aside>}{save.inventory.map((entry) => <button className={`st-entity-row${entry.rarity ? ` is-${entry.rarity}` : ''}`} onClick={() => setDetail({ type: 'inventory', id: entry.id })} key={entry.id}><div><span>{entry.label}</span>{entry.effect && <small>{entry.effect}</small>}</div><b>× {entry.count}</b><Icon name="arrow" /></button>)}</div>}
    {!detail && active === 'log' && <div className="st-log"><button className="st-entity-row" onClick={() => setDetail({ type: 'objective' })}><div><small>{t(cartridge.locale, 'currentObjective')}</small><p>{save.objective}</p></div><Icon name="arrow" /></button>{save.relationships.map((event) => <button className="st-entity-row" onClick={() => setDetail({ type: 'relationship', id: event.id })} key={event.id}><div><small>{event.actor}</small><p>{event.axis} · {t(cartridge.locale, event.delta > 0 ? 'warmer' : 'colder')}</p></div><Icon name="arrow" /></button>)}<button className="st-entity-row" onClick={() => setDetail({ type: 'system' })}><div><small>{t(cartridge.locale, 'system')}</small><p>{t(cartridge.locale, 'segmentSaved', { n: save.scene + 1 })}</p></div><Icon name="arrow" /></button></div>}
    {detail?.type === 'player' && <PlayerDetail player={player} save={save} cartridge={cartridge} focusedStatId={detail.statId} openSection={(id) => { setDetail(null); setActive(id) }} />}
    {character && <CharacterDetail character={character} relationships={save.relationships} cartridge={cartridge} />}
    {mapNode && <MapDetail node={mapNode} map={save.map} cartridge={cartridge} />}
    {item && <ItemDetail item={item} cartridge={cartridge} />}
    {detail?.type === 'objective' && <div className="st-world-detail"><DetailSection label={t(cartridge.locale, 'currentObjective')}><p>{save.objective}</p></DetailSection><DetailSection label={t(cartridge.locale, 'currentStatus')}><DetailMetrics rows={[{ label: t(cartridge.locale, 'here'), value: save.location }, { label: t(cartridge.locale, 'system'), value: save.time }]} /></DetailSection></div>}
    {relationship && <div className="st-world-detail"><DetailSection label={t(cartridge.locale, 'journalDetail')}><p>{relationship.actor} · {relationship.axis}</p></DetailSection><DetailMetrics rows={[{ label: t(cartridge.locale, 'currentStatus'), value: t(cartridge.locale, relationship.delta > 0 ? 'warmer' : 'colder') }, { label: t(cartridge.locale, 'yourAction'), value: relationship.source }]} /></div>}
    {detail?.type === 'system' && <SystemDetail cartridge={cartridge} engine={engine} restart={() => { close(); engine.restartWorld() }} />}
  </section></div>
}

function Game({ cartridge, mode, chatId, onSelect, onLocaleChange, uiVariant }: { cartridge: StoryCartridge; mode: StoryMode; chatId?: string; onSelect: (id: string) => void; onLocaleChange: (locale: Locale) => void; uiVariant: UiVariant }) {
  const player = usePlayerProfile()
  const imageWidth = cartridge.mediaDirector?.imageTarget.width ?? 640
  const imageHeight = cartridge.mediaDirector?.imageTarget.height ?? 360
  const imageIdentity = useAvatarImageReference(player.imageRefUrl, player.loaded, imageWidth, imageHeight)
  const engine = useStoryEngine(cartridge, mode, chatId, imageIdentity)
  const audio = useStoryAudio(cartridge, engine.save)
  const [worldOpen, setWorldOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [previewScene, setPreviewScene] = useState<number | null>(null)
  const [worldTab, setWorldTab] = useState<DrawerId>('party')
  const [worldDetail, setWorldDetail] = useState<WorldDetail | null>(null)
  const [hasUnread, setHasUnread] = useState(false)
  const [showResumeLatest, setShowResumeLatest] = useState(false)
  const [confirmResumeRestart, setConfirmResumeRestart] = useState(false)
  const [textSize, setTextSizeState] = useState<TextSize>(() => readTextSize())
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('decision')
  const [lastAction, setLastAction] = useState('')
  const submittedScene = useRef(engine.save.scene)
  const feedRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const follow = useRef(true)
  const responseAnchor = useRef<{ from: number } | null>(null)
  const wasEntered = useRef(engine.save.entered)
  const hydratedLocale = useRef(false)
  const restoredSaveChecked = useRef(false)
  const audioInitialized = useRef(false)
  const audioBlockCount = useRef(0)
  const readyAudioImages = useRef<Set<string>>(new Set())
  const lastAudioError = useRef('')
  const setTextSize = (size: TextSize) => { alteruLocalStorage.setItem(TEXT_SIZE_KEY, size); setTextSizeState(size) }
  const openWorld = (active: DrawerId = worldTab, detail: WorldDetail | null = null) => {
    setWorldTab(active)
    setWorldDetail(detail)
    setWorldOpen(true)
  }

  useEffect(() => {
    if (!engine.loaded || hydratedLocale.current) return
    hydratedLocale.current = true
    const explicit = new URLSearchParams(window.location.search).get('lang')
    if (explicit !== 'zh' && explicit !== 'en' && engine.save.locale !== cartridge.locale) onLocaleChange(engine.save.locale)
  }, [cartridge.locale, engine.loaded, engine.save.locale, onLocaleChange])

  useEffect(() => {
    if (!engine.loaded || restoredSaveChecked.current) return
    restoredSaveChecked.current = true
    setShowResumeLatest(engine.save.scene > 0)
  }, [engine.loaded, engine.save.scene])

  useEffect(() => {
    if (turnPhase === 'resolving' && engine.error) {
      setTurnPhase('result')
      return
    }
    if (turnPhase === 'resolving' && !engine.busy && engine.save.scene > submittedScene.current) {
      setTurnPhase('result')
      return
    }
    if (turnPhase === 'result' && engine.busy && !engine.error) {
      submittedScene.current = engine.save.scene
      setTurnPhase('resolving')
    }
  }, [engine.busy, engine.error, engine.save.scene, turnPhase])

  useEffect(() => {
    if (engine.save.scene === 0 && !engine.busy) {
      setTurnPhase('decision')
      setLastAction('')
    }
  }, [engine.busy, engine.save.scene])

  const scrollToLatest = (force = false) => {
    if (!force && !follow.current) { setHasUnread(true); return }
    requestAnimationFrame(() => {
      const node = feedRef.current
      node?.scrollTo({ top: node.scrollHeight, behavior: 'smooth' })
      setHasUnread(false)
    })
  }

  const scrollBlockToReadingStart = (element: HTMLElement | null, behavior: ScrollBehavior = 'smooth') => {
    const feed = feedRef.current
    if (!feed || !element) return
    const top = feed.scrollTop + element.getBoundingClientRect().top - feed.getBoundingClientRect().top - 10
    feed.scrollTo({ top: Math.max(0, top), behavior })
    setHasUnread(false)
  }

  useEffect(() => {
    if (!wasEntered.current && engine.save.entered) {
      requestAnimationFrame(() => feedRef.current?.scrollTo({ top: 0, behavior: 'auto' }))
      setHasUnread(false)
    }
    wasEntered.current = engine.save.entered
  }, [engine.save.entered])

  useEffect(() => {
    if (!engine.pendingAction) return
    requestAnimationFrame(() => scrollBlockToReadingStart(feedRef.current?.querySelector<HTMLElement>('[data-pending-action]') ?? null))
  }, [engine.pendingAction])

  useEffect(() => {
    if (!engine.error) return
    if (engine.error !== lastAudioError.current) audio.cue('error')
    lastAudioError.current = engine.error
    requestAnimationFrame(() => scrollBlockToReadingStart(feedRef.current?.querySelector<HTMLElement>('[data-story-error]') ?? null))
  }, [audio.cue, engine.error])

  useEffect(() => {
    if (!engine.loaded) return
    const readyImages = new Set(engine.save.blocks.filter((block) => block.kind === 'image' && block.data?.status === 'ready').map((block) => block.id))
    if (!audioInitialized.current) {
      audioInitialized.current = true
      audioBlockCount.current = engine.save.blocks.length
      readyAudioImages.current = readyImages
      return
    }
    const added = engine.save.blocks.slice(audioBlockCount.current)
    if (added.length) audio.cue(cueForStoryBlocks(added))
    readyImages.forEach((id) => { if (!readyAudioImages.current.has(id)) audio.cue('image') })
    audioBlockCount.current = engine.save.blocks.length
    readyAudioImages.current = readyImages
  }, [audio.cue, engine.loaded, engine.save.blocks])

  useEffect(() => {
    const anchor = responseAnchor.current
    if (!anchor || engine.save.blocks.length <= anchor.from) return
    const response = engine.save.blocks.slice(anchor.from).find((block) => block.kind !== 'image' && !(block.kind === 'event' && block.id.startsWith('action-')))
    if (!response) return
    responseAnchor.current = null
    requestAnimationFrame(() => {
      const escapedId = CSS.escape(response.id)
      scrollBlockToReadingStart(feedRef.current?.querySelector<HTMLElement>(`[data-block-id="${escapedId}"]`) ?? null)
    })
  }, [engine.save.blocks.length])

  const onScroll = () => {
    const node = feedRef.current
    if (!node) return
    follow.current = node.scrollHeight - node.scrollTop - node.clientHeight < 140
    if (follow.current) setHasUnread(false)
  }

  const act = (action: string) => {
    const nextLocale = detectTextLocale(action, cartridge.locale)
    if (nextLocale !== cartridge.locale) onLocaleChange(nextLocale)
    follow.current = true
    responseAnchor.current = { from: engine.save.blocks.length }
    submittedScene.current = engine.save.scene
    setLastAction(action)
    setTurnPhase('resolving')
    audio.cue('action')
    engine.act(action, nextLocale)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (showResumeLatest) return
      if (event.key === 'Escape') setWorldOpen(false)
      if (event.key.toLowerCase() === 'w' && !(event.target instanceof HTMLInputElement)) setWorldOpen(true)
      if (event.key.toLowerCase() === 'h' && !(event.target instanceof HTMLInputElement)) setHistoryOpen(true)
      const index = Number(event.key) - 1
      const canChoose = turnPhase === 'decision'
      if (canChoose && index >= 0 && index < engine.save.choices.length && !(event.target instanceof HTMLInputElement)) act(engine.save.choices[index].label)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [engine.save.choices, engine.busy, showResumeLatest, turnPhase])

  if (!engine.loaded) return <div className="st-loading" style={setCssTheme(cartridge)}><i /><span>{t(cartridge.locale, 'restoring')}</span></div>
  if (!engine.save.entered) return <Entry cartridge={cartridge} onEnter={() => { audio.cue('open'); engine.enter() }} onSelect={onSelect} mode={engine.mode} setMode={engine.setMode} hasSave={engine.save.scene > 0} remoteAvailable={Boolean(engine.save.remoteChatId)} />
  const stage = <CinematicStage cartridge={cartridge} engine={engine} player={player} previewScene={previewScene} onReturnLatest={() => setPreviewScene(null)} uiVariant={uiVariant} turnPhase={turnPhase} lastAction={lastAction} />
  const finaleBlocking = engine.save.finale.status !== 'idle' && !engine.save.finale.epilogueActive
  const controls = finaleBlocking ? null : previewScene != null
    ? <button type="button" className="ct-return-latest" onClick={() => setPreviewScene(null)}>{t(cartridge.locale, 'returnLatest')}<Icon name="arrow" /></button>
    : turnPhase === 'decision'
      ? <Composer cartridge={cartridge} engine={engine} onAct={act} uiVariant={uiVariant} />
      : turnPhase === 'result' && !engine.error
        ? <button type="button" className={`ct-turn-next ${uiVariant === 'civic' ? 'ct-civic-next' : 'ct-living-next'}`} onClick={() => { setTurnPhase('decision'); setLastAction('') }}><span><small>{t(cartridge.locale, 'resultReady')}</small><strong>{t(cartridge.locale, 'showNextChoices')}</strong></span><Icon name="arrow" /></button>
        : null
  const civicViewportState = previewScene != null ? 'is-preview' : `is-${turnPhase}${engine.error ? ' has-error' : ''}`
  return <main className={`st-shell st-shell--${cartridge.theme.material}`} data-text-size={textSize} style={setCssTheme(cartridge)}>
    <ConversationHeader cartridge={cartridge} engine={engine} audio={audio} openWorld={openWorld} openHistory={() => setHistoryOpen(true)} textSize={textSize} setTextSize={setTextSize} uiVariant={uiVariant} />
    {uiVariant === 'civic'
      ? <section className={`ct-civic-viewport ${civicViewportState}`} aria-label={t(cartridge.locale, 'currentScene')}>{stage}{controls}</section>
      : <>{stage}{controls}</>}
    <EndingExperience cartridge={cartridge} engine={engine} />
    {showResumeLatest && <div className="st-resume-dialog" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="st-resume-title">
      <small>{t(cartridge.locale, confirmResumeRestart ? 'startOver' : 'resumeLatestTitle')}</small><h2 id="st-resume-title">{cartridge.copy.title}</h2><p>{t(cartridge.locale, confirmResumeRestart ? 'startOverWarning' : 'resumeLatestDescription')}</p>
      {!confirmResumeRestart ? <><button type="button" className="st-resume-dialog__primary" autoFocus onClick={() => { setShowResumeLatest(false); setPreviewScene(null) }}>{t(cartridge.locale, 'resumeLatestAction')}<Icon name="arrow" /></button>
      <button type="button" className="st-resume-dialog__review" onClick={() => setConfirmResumeRestart(true)}>{t(cartridge.locale, 'resumeFromStart')}</button></> : <><button type="button" className="st-resume-dialog__danger" onClick={() => { setShowResumeLatest(false); setConfirmResumeRestart(false); engine.restartWorld() }}>{t(cartridge.locale, 'startOverConfirm')}</button>
      <button type="button" className="st-resume-dialog__review" autoFocus onClick={() => setConfirmResumeRestart(false)}>{t(cartridge.locale, 'startOverCancel')}</button></>}
    </section></div>}
    {worldOpen && <WorldDrawer active={worldTab} setActive={setWorldTab} detail={worldDetail} setDetail={setWorldDetail} cartridge={cartridge} engine={engine} close={() => setWorldOpen(false)} player={player} />}
    {historyOpen && <Storyboard cartridge={cartridge} save={engine.save} close={() => setHistoryOpen(false)} select={setPreviewScene} />}
  </main>
}

export default function StoryShell() {
  const initial = useInitialCartridge()
  const [cartridgeId, setCartridgeId] = useState(initial ?? DEFAULT_CARTRIDGE_ID)
  const [locale, setLocale] = useState<Locale>(() => detectLocale())
  const params = new URLSearchParams(window.location.search)
  const uiVariant = params.get('ui') === 'living' ? 'living' : 'civic'
  const cartridge = useMemo(() => cartridgeForUi(resolveCartridge(cartridgeId, locale), uiVariant), [cartridgeId, locale, uiVariant])
  const chatId = params.get('chat_id') || undefined
  const mode: StoryMode = chatId ? 'remote' : params.get('story_mode') === 'demo' ? 'demo' : 'aigram'
  useEffect(() => { document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en' }, [locale])
  useEffect(() => {
    document.documentElement.dataset.uiVariant = uiVariant
    return () => { delete document.documentElement.dataset.uiVariant }
  }, [uiVariant])
  const select = (id: string) => {
    const url = new URL(window.location.href); url.searchParams.set('cartridge', id); url.searchParams.delete('chat_id'); window.history.replaceState({}, '', url)
    setCartridgeId(id)
  }
  const changeLocale = (next: Locale) => { rememberLocale(next); setLocale(next) }
  return <Game key={cartridge.id} cartridge={cartridge} mode={mode} chatId={chatId} onSelect={select} onLocaleChange={changeLocale} uiVariant={uiVariant} />
}
