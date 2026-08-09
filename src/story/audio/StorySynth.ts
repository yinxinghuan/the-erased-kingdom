import type { DangerPhase, StoryAudioMotif, StoryAudioRegion, StoryAudioTexture, StoryAudioTheme } from '../types'

export type StoryAudioCue =
  | 'open' | 'action' | 'success' | 'failure' | 'change' | 'discovery' | 'treasure' | 'image' | 'summary' | 'error'
  | 'location' | 'seal' | 'erasure' | 'witness' | 'companion' | 'danger' | 'finale'

export interface StoryAudioState {
  location: string
  scene: number
  dangerPhase: DangerPhase
  witnessCount: number
  finaleActive: boolean
  tension: number
}

type AudioContextConstructor = typeof AudioContext
type StoppableNode = AudioBufferSourceNode | OscillatorNode
const MAX_TRANSIENT_VOICES = 8

const TEXTURE: Record<StoryAudioTexture, {
  smooth: number; filter: BiquadFilterType; filterHz: number; q: number; noise: number; drone: number; droneRatio: number
  oscillator: OscillatorType; noteLength: number
}> = {
  orchard: { smooth: .982, filter: 'lowpass', filterHz: 920, q: .22, noise: .32, drone: .012, droneRatio: .5, oscillator: 'sine', noteLength: .68 },
  oldwood: { smooth: .968, filter: 'lowpass', filterHz: 540, q: .5, noise: .42, drone: .028, droneRatio: .5, oscillator: 'triangle', noteLength: .34 },
  market: { smooth: .952, filter: 'bandpass', filterHz: 1180, q: 1.1, noise: .22, drone: .014, droneRatio: .5, oscillator: 'triangle', noteLength: .26 },
  bastion: { smooth: .976, filter: 'lowpass', filterHz: 390, q: .72, noise: .35, drone: .038, droneRatio: .5, oscillator: 'triangle', noteLength: .24 },
  coast: { smooth: .991, filter: 'bandpass', filterHz: 610, q: .46, noise: .56, drone: .018, droneRatio: .5, oscillator: 'sine', noteLength: .86 },
  margins: { smooth: .994, filter: 'lowpass', filterHz: 330, q: .25, noise: .18, drone: .012, droneRatio: .25, oscillator: 'sine', noteLength: 1.08 },
  capital: { smooth: .96, filter: 'bandpass', filterHz: 860, q: 1.5, noise: .2, drone: .022, droneRatio: .5, oscillator: 'triangle', noteLength: .28 },
  ledger: { smooth: .946, filter: 'bandpass', filterHz: 1320, q: 1.9, noise: .16, drone: .026, droneRatio: .5, oscillator: 'triangle', noteLength: .2 },
}

function contextConstructor(): AudioContextConstructor | undefined {
  return window.AudioContext ?? (window as Window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext
}

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function frequency(root: number, semitones: number): number {
  return root * 2 ** (semitones / 12)
}

export function resolveStoryAudioRegion(theme: StoryAudioTheme, location: string): StoryAudioRegion | null {
  const normalized = location.toLocaleLowerCase()
  return theme.regions?.find((region) => region.match.some((token) => normalized.includes(token.toLocaleLowerCase()))) ?? theme.regions?.[0] ?? null
}

export class StorySynth {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private music: GainNode | null = null
  private ambient: GainNode | null = null
  private sfx: GainNode | null = null
  private theme: StoryAudioTheme | null = null
  private story: StoryAudioState = { location: '', scene: 0, dangerPhase: 'calm', witnessCount: 0, finaleActive: false, tension: .25 }
  private region: StoryAudioRegion | null = null
  private muted = false
  private unlocked = false
  private musicTimer: number | null = null
  private transitionTimer: number | null = null
  private musicStep = 0
  private ambientNodes: StoppableNode[] = []
  private activeVoices = 0
  private stateListener: ((running: boolean) => void) | null = null
  private cueTimes = new Map<StoryAudioCue, number>()

  get supported(): boolean {
    return Boolean(contextConstructor())
  }

  get running(): boolean {
    return Boolean(this.unlocked && this.context?.state === 'running')
  }

  setStateListener(listener: ((running: boolean) => void) | null): void {
    this.stateListener = listener
    listener?.(this.running)
  }

  configure(theme: StoryAudioTheme, state: StoryAudioState): void {
    const nextRegion = resolveStoryAudioRegion(theme, state.location)
    const soundscapeChanged = this.theme?.material !== theme.material || this.region?.id !== nextRegion?.id
    this.theme = theme
    this.story = { ...state, tension: clampUnit(state.tension) }
    this.region = nextRegion
    if (soundscapeChanged && this.unlocked) this.transitionSoundscape()
    else this.applyLevels(.16)
  }

  async unlock(): Promise<boolean> {
    if (!this.supported || !this.theme) return false
    if (!this.context) this.createGraph()
    const context = this.context
    if (!context) return false
    try {
      const state = String(context.state)
      if (state !== 'running' && state !== 'closed') await context.resume()
      if (context.state !== 'running') return false
      this.primeOutput()
      this.unlocked = true
      this.stateListener?.(true)
      if (!this.ambientNodes.length) this.startAmbient()
      if (this.musicTimer === null) this.startMusic()
      this.applyLevels(.08)
      return true
    } catch {
      return false
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    this.applyLevels(.12)
  }

  async setPageVisible(visible: boolean): Promise<void> {
    if (!this.context || !this.unlocked) return
    try {
      if (!visible && this.context.state === 'running') await this.context.suspend()
      const state = String(this.context.state)
      if (visible && !this.muted && state !== 'running' && state !== 'closed') await this.context.resume()
    } catch {
      // Sound is optional and must never interrupt the story.
    }
  }

  cue(cue: StoryAudioCue): void {
    const context = this.context
    const theme = this.theme
    if (!context || !theme || this.muted || context.state !== 'running' || this.onCooldown(cue)) return
    const root = this.effectiveRoot()
    const softer = theme.material === 'apartment'
    const woody = theme.material === 'wayfarer'

    if (cue === 'open') {
      this.playMotif('restore', root * 2, .24, 'sine', .19, .085, 3)
    } else if (cue === 'action') {
      this.noise(.06, softer ? 950 : woody ? 690 : 1450, softer ? .11 : woody ? .1 : .17)
      this.tone('sfx', woody ? 246 : 460, woody ? 196 : 390, .09, 'triangle', .16)
    } else if (cue === 'success') {
      this.playIntervals([0, 4, 7], root * 2.5, .18, 'sine', .17, .075)
    } else if (cue === 'failure' || cue === 'error') {
      this.tone('sfx', root * 1.7, root * (cue === 'error' ? .82 : 1.02), cue === 'error' ? .16 : .28, 'triangle', cue === 'error' ? .13 : .2)
      if (cue === 'failure') this.noise(.09, 190, .12, .16)
    } else if (cue === 'location') {
      this.playMotif('location', root * 2, .34, this.texture().oscillator, .14, .13, 2)
    } else if (cue === 'seal') {
      this.noise(.09, 520, .2)
      this.playMotif('restore', root * 1.35, .52, 'triangle', .18, .12, 3)
    } else if (cue === 'erasure') {
      this.noise(.28, 240, .12)
      this.playMotif('erase', root * 1.4, .3, 'triangle', .15, .095, 3)
    } else if (cue === 'witness') {
      this.playMotif('witness', root * 2, .52, 'sine', .16, .105, 4)
      this.noise(.055, 1180, .07, .08)
    } else if (cue === 'companion') {
      this.playMotif('companion', root * 1.7, .4, 'sine', .15, .1, 3)
      this.tone('sfx', root * 1.7, root * 1.7, .48, 'triangle', .07, .08)
    } else if (cue === 'danger') {
      this.tone('sfx', 82, 73.42, .14, 'triangle', .22)
      this.tone('sfx', 82, 73.42, .14, 'triangle', .2, .18)
      if (this.story.dangerPhase === 'confrontation') this.tone('sfx', root, frequency(root, 1), .2, 'triangle', .12, .34)
    } else if (cue === 'finale') {
      this.playMotif('finale', root, 1.1, 'sine', .15, .13, 4)
      this.tone('sfx', frequency(root, 7), frequency(root, this.story.witnessCount >= 6 ? 12 : 8), 1.24, 'triangle', .08, .16)
    } else if (cue === 'change') {
      this.tone('sfx', root * 2.1, root * 2.22, .12, 'sine', .11)
    } else if (cue === 'discovery') {
      this.playIntervals([0, 7, 12], root * 1.8, .4, 'sine', .14, .11)
    } else if (cue === 'treasure') {
      this.playIntervals([0, 2, 5, 7], root * 2, .38, 'triangle', .12, .075)
    } else if (cue === 'image') {
      this.tone('sfx', 760, 910, .18, 'sine', .1)
      this.tone('sfx', 1060, 1120, .26, 'sine', .07, .08)
    } else if (cue === 'summary') {
      this.playIntervals([0, theme.scale[2] ?? 4, theme.scale[4] ?? 9], root * 1.7, .68, 'sine', .11, .1)
    }
  }

  dispose(): void {
    this.stopMusic()
    this.stopAmbient()
    if (this.transitionTimer !== null) window.clearTimeout(this.transitionTimer)
    const context = this.context
    this.context = null
    this.master = null
    this.music = null
    this.ambient = null
    this.sfx = null
    this.unlocked = false
    if (context) void context.close().catch(() => undefined)
  }

  private createGraph(): void {
    const Constructor = contextConstructor()
    if (!Constructor || !this.theme) return
    const context = new Constructor()
    context.onstatechange = () => this.stateListener?.(this.running)
    const master = context.createGain()
    const music = context.createGain()
    const ambient = context.createGain()
    const sfx = context.createGain()
    const limiter = context.createDynamicsCompressor()
    limiter.threshold.value = -12
    limiter.knee.value = 8
    limiter.ratio.value = 12
    limiter.attack.value = .003
    limiter.release.value = .18
    music.connect(master)
    ambient.connect(master)
    sfx.connect(master)
    master.connect(limiter)
    limiter.connect(context.destination)
    this.context = context
    this.master = master
    this.music = music
    this.ambient = ambient
    this.sfx = sfx
    this.applyLevels(0)
  }

  private primeOutput(): void {
    const context = this.context
    const output = this.master
    if (!context || !output) return
    const buffer = context.createBuffer(1, 1, context.sampleRate)
    const source = context.createBufferSource()
    source.buffer = buffer
    source.connect(output)
    source.onended = () => source.disconnect()
    source.start()
  }

  private applyLevels(seconds: number): void {
    if (!this.context || !this.theme || !this.master || !this.music || !this.ambient || !this.sfx) return
    const now = this.context.currentTime
    const ramp = (param: AudioParam, value: number) => {
      param.cancelScheduledValues(now)
      param.setValueAtTime(Math.max(.0001, param.value), now)
      param.linearRampToValueAtTime(value, now + seconds)
    }
    ramp(this.master.gain, this.muted ? 0 : this.theme.levels.master)
    ramp(this.music.gain, this.theme.levels.music)
    ramp(this.ambient.gain, this.theme.levels.ambient)
    ramp(this.sfx.gain, this.theme.levels.sfx)
  }

  private transitionSoundscape(): void {
    const context = this.context
    if (!context || !this.theme || !this.music || !this.ambient) return
    if (this.transitionTimer !== null) window.clearTimeout(this.transitionTimer)
    const now = context.currentTime
    ;[this.music.gain, this.ambient.gain].forEach((gain) => {
      gain.cancelScheduledValues(now)
      gain.setValueAtTime(Math.max(.0001, gain.value), now)
      gain.linearRampToValueAtTime(.0001, now + .12)
    })
    this.transitionTimer = window.setTimeout(() => {
      this.stopMusic()
      this.stopAmbient()
      this.startAmbient()
      this.startMusic()
      this.applyLevels(.18)
      this.transitionTimer = null
    }, 130)
  }

  private startAmbient(): void {
    const context = this.context
    const output = this.ambient
    if (!context || !output || !this.theme || this.ambientNodes.length) return
    const texture = this.texture()
    const duration = 4
    const buffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate)
    const samples = buffer.getChannelData(0)
    let smooth = 0
    for (let index = 0; index < samples.length; index += 1) {
      const white = Math.random() * 2 - 1
      smooth = smooth * texture.smooth + white * (1 - texture.smooth)
      const coastSwell = this.region?.texture === 'coast' ? .62 + Math.sin(index / context.sampleRate * Math.PI) * .38 : 1
      samples[index] = smooth * coastSwell
    }
    const noise = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const gain = context.createGain()
    noise.buffer = buffer
    noise.loop = true
    filter.type = texture.filter
    filter.frequency.value = texture.filterHz
    filter.Q.value = texture.q
    gain.gain.value = texture.noise
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(output)
    noise.start()

    const drone = context.createOscillator()
    const droneGain = context.createGain()
    drone.type = 'sine'
    drone.frequency.value = Math.max(32, this.effectiveRoot() * texture.droneRatio)
    droneGain.gain.value = texture.drone
    drone.connect(droneGain)
    droneGain.connect(output)
    drone.start()
    this.ambientNodes = [noise, drone]
  }

  private stopAmbient(): void {
    this.ambientNodes.forEach((node) => {
      try { node.stop() } catch { /* already stopped */ }
      node.disconnect()
    })
    this.ambientNodes = []
  }

  private startMusic(): void {
    if (this.musicTimer !== null || !this.theme) return
    this.musicStep = 0
    const tick = () => {
      if (!this.theme || !this.context) return
      this.playMusicStep()
      const bpm = Math.max(38, this.theme.bpm + (this.region?.bpmOffset ?? 0))
      this.musicTimer = window.setTimeout(tick, 60000 / bpm)
    }
    tick()
  }

  private stopMusic(): void {
    if (this.musicTimer !== null) window.clearTimeout(this.musicTimer)
    this.musicTimer = null
    this.musicStep = 0
  }

  private playMusicStep(): void {
    const theme = this.theme
    if (!theme || this.muted || !this.context || this.context.state !== 'running') {
      this.musicStep = (this.musicStep + 1) % 32
      return
    }
    const texture = this.texture()
    const pattern = this.region?.pattern ?? [0, null, 7, null, 5, null, 9, null]
    const scale = this.region?.scale ?? theme.scale
    const step = this.musicStep % pattern.length
    const interval = pattern[step]
    const bpm = Math.max(38, theme.bpm + (this.region?.bpmOffset ?? 0))
    const beat = 60 / bpm
    const root = this.effectiveRoot()
    if (interval != null) {
      const sparseByErasure = this.region?.texture === 'margins' && this.story.tension > .5 && step % 2 === 1
      if (!sparseByErasure) this.tone('music', frequency(root * 2, interval), frequency(root * 2, interval), beat * texture.noteLength, texture.oscillator, .038 + this.story.witnessCount * .0015)
    }
    if (step === 0) {
      const fifth = this.story.tension > .72 ? 6 : 7
      this.tone('music', root * .5, root * .5, beat * Math.max(3.4, pattern.length - .6), 'sine', .038)
      this.tone('music', frequency(root, fifth), frequency(root, fifth), beat * 3.2, texture.oscillator, .021)
    }
    const pulseEvery = this.story.dangerPhase === 'confrontation' || this.story.tension > .7 ? 2 : 4
    if ((this.region?.texture === 'bastion' || this.region?.texture === 'ledger') && step % pulseEvery === 1) {
      const pulse = scale[(step + 1) % scale.length] ?? 1
      this.tone('music', frequency(root, pulse), frequency(root, pulse), .12, 'triangle', .04)
    }
    if (this.story.finaleActive && step === pattern.length - 1) {
      this.tone('music', frequency(root * 2, 7), frequency(root * 2, this.story.witnessCount >= 6 ? 12 : 8), beat * 1.4, 'sine', .034)
    }
    this.musicStep = (this.musicStep + 1) % 32
  }

  private effectiveRoot(): number {
    return frequency(this.theme?.rootHz ?? 146.83, this.region?.rootOffset ?? 0)
  }

  private texture() {
    return TEXTURE[this.region?.texture ?? 'orchard']
  }

  private playMotif(name: StoryAudioMotif, root: number, duration: number, type: OscillatorType, level: number, spacing: number, limit: number): void {
    const fallback: Record<StoryAudioMotif, number[]> = {
      erase: [12, 6, 0], restore: [0, 7, 12], witness: [0, 5, 7, 12], companion: [0, 3, 7], finale: [0, 5, 7, 12, 14], location: [0, 7],
    }
    this.playIntervals((this.theme?.motifs?.[name] ?? fallback[name]).slice(0, limit), root, duration, type, level, spacing)
  }

  private playIntervals(intervals: number[], root: number, duration: number, type: OscillatorType, level: number, spacing: number): void {
    intervals.forEach((interval, index) => this.tone('sfx', frequency(root, interval), frequency(root, interval), duration, type, Math.max(.035, level - index * .018), index * spacing))
  }

  private onCooldown(cue: StoryAudioCue): boolean {
    const now = performance.now()
    const cooldown = cue === 'action' ? 70 : cue === 'image' ? 220 : cue === 'danger' || cue === 'erasure' ? 520 : 150
    const previous = this.cueTimes.get(cue) ?? -Infinity
    if (now - previous < cooldown) return true
    this.cueTimes.set(cue, now)
    return false
  }

  private tone(bus: 'music' | 'sfx', from: number, to: number, duration: number, type: OscillatorType, level: number, delay = 0): void {
    const context = this.context
    const output = bus === 'music' ? this.music : this.sfx
    if (!context || !output || this.activeVoices >= MAX_TRANSIENT_VOICES) return
    const start = context.currentTime + delay
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(Math.max(20, from), start)
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + duration)
    gain.gain.setValueAtTime(.0001, start)
    gain.gain.exponentialRampToValueAtTime(Math.max(.0001, level), start + Math.min(.08, duration * .2))
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration)
    oscillator.connect(gain)
    gain.connect(output)
    this.activeVoices += 1
    oscillator.onended = () => {
      oscillator.disconnect()
      gain.disconnect()
      this.activeVoices = Math.max(0, this.activeVoices - 1)
    }
    oscillator.start(start)
    oscillator.stop(start + duration + .02)
  }

  private noise(duration: number, centerFrequency: number, level: number, delay = 0): void {
    const context = this.context
    const output = this.sfx
    if (!context || !output || this.activeVoices >= MAX_TRANSIENT_VOICES) return
    const buffer = context.createBuffer(1, Math.max(1, Math.floor(context.sampleRate * duration)), context.sampleRate)
    const samples = buffer.getChannelData(0)
    for (let index = 0; index < samples.length; index += 1) samples[index] = (Math.random() * 2 - 1) * (1 - index / samples.length)
    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const gain = context.createGain()
    const start = context.currentTime + delay
    source.buffer = buffer
    filter.type = 'bandpass'
    filter.frequency.value = centerFrequency
    filter.Q.value = .8
    gain.gain.setValueAtTime(.0001, start)
    gain.gain.exponentialRampToValueAtTime(Math.max(.0001, level), start + Math.min(.04, duration * .3))
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(output)
    this.activeVoices += 1
    source.onended = () => {
      source.disconnect()
      filter.disconnect()
      gain.disconnect()
      this.activeVoices = Math.max(0, this.activeVoices - 1)
    }
    source.start(start)
    source.stop(start + duration + .02)
  }
}
