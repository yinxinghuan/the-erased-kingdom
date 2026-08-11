import { useCallback, useEffect, useRef, useState } from 'react'
import type { StoryCartridge, StorySave } from '../types'
import { StorySynth, type StoryAudioCue, type StoryAudioState } from './StorySynth'

const AUDIO_MUTED_KEY = 'alteru_story_audio_muted'

function readMuted(): boolean {
  try { return alteruLocalStorage.getItem(AUDIO_MUTED_KEY) === '1' } catch { return false }
}

function calculateTension(cartridge: StoryCartridge, save: StorySave): number {
  let value = 0
  let weights = 0
  cartridge.audioTheme.tension.forEach((source) => {
    const definition = cartridge.statDefinitions.find((stat) => stat.id === source.statId)
    if (!definition) return
    const span = Math.max(1, definition.max - definition.min)
    const normalized = Math.max(0, Math.min(1, ((save.stats[source.statId] ?? definition.initial) - definition.min) / span))
    value += (source.direction === 'low' ? 1 - normalized : normalized) * source.weight
    weights += source.weight
  })
  return weights > 0 ? value / weights : .25
}

function calculateAudioState(cartridge: StoryCartridge, save: StorySave): StoryAudioState {
  const witnessCount = Object.entries(save.facts).filter(([id, value]) => id.endsWith('-witness-page') && value === true).length
  return {
    location: save.location,
    scene: save.scene,
    dangerPhase: save.danger.phase,
    witnessCount,
    finaleActive: save.finale.status !== 'idle',
    tension: calculateTension(cartridge, save),
  }
}

export function useStoryAudio(cartridge: StoryCartridge, save: StorySave) {
  const synthRef = useRef<StorySynth | null>(null)
  if (!synthRef.current) synthRef.current = new StorySynth()
  const [muted, setMutedState] = useState(readMuted)
  const [ready, setReady] = useState(false)
  const statSignature = cartridge.audioTheme.tension.map((source) => `${source.statId}:${save.stats[source.statId] ?? 0}`).join('|')
  const witnessSignature = Object.entries(save.facts).filter(([id]) => id.endsWith('-witness-page')).map(([id, value]) => `${id}:${String(value)}`).join('|')
  const soundscapeSignature = `${save.location}|${save.danger.phase}|${save.finale.status}|${witnessSignature}|${statSignature}`

  useEffect(() => {
    synthRef.current?.configure(cartridge.audioTheme, calculateAudioState(cartridge, save))
  }, [cartridge, soundscapeSignature])

  useEffect(() => {
    synthRef.current?.setMuted(muted)
    try { alteruLocalStorage.setItem(AUDIO_MUTED_KEY, muted ? '1' : '0') } catch { /* private storage can reject writes */ }
  }, [muted])

  useEffect(() => {
    const onVisibility = () => { void synthRef.current?.setPageVisible(!document.hidden) }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    const synth = synthRef.current
    synth?.setStateListener(setReady)
    return () => synth?.setStateListener(null)
  }, [])

  useEffect(() => () => synthRef.current?.dispose(), [])

  const unlock = useCallback(async () => {
    const running = await synthRef.current?.unlock() ?? false
    setReady(running)
    return running
  }, [])
  const cue = useCallback((name: StoryAudioCue) => {
    if (muted) return
    void (async () => {
      if (await unlock()) synthRef.current?.cue(name)
    })()
  }, [muted, unlock])
  const toggle = useCallback(() => {
    if (muted || !ready) {
      setMutedState(false)
      synthRef.current?.setMuted(false)
      void unlock().then((running) => { if (running) synthRef.current?.cue('open') })
      return
    }
    synthRef.current?.setMuted(true)
    setMutedState(true)
  }, [muted, ready, unlock])

  return { muted, ready, active: !muted && ready, supported: synthRef.current.supported, unlock, cue, toggle }
}
