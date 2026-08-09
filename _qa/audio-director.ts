import { cueForStoryBlocks } from '../src/story/audio/cueDirector'
import { resolveStoryAudioRegion } from '../src/story/audio/StorySynth'
import { theErasedKingdom } from '../src/story/cartridges/theErasedKingdom'
import type { StoryAudioCue } from '../src/story/audio/StorySynth'
import type { StoryBlock } from '../src/story/types'

function block(kind: StoryBlock['kind'], text: string, data: StoryBlock['data'] = {}, id = 'effect-1-0'): StoryBlock {
  return { id, kind, text, data }
}

function expectCue(expected: StoryAudioCue, blocks: StoryBlock[]): void {
  const actual = cueForStoryBlocks(blocks)
  if (actual !== expected) throw new Error(`expected ${expected}, received ${actual}: ${JSON.stringify(blocks)}`)
}

expectCue('witness', [block('event', '世界记录已更新', { factIds: 'oldwood-witness-page' }, 'facts-3')])
expectCue('danger', [block('event', '危险正在逼近', { dangerPhase: 'warning', severity: 2 }, 'danger-4')])
expectCue('companion', [block('event', '玛拉加入队伍', { partyChange: 'add', characterId: 'mara' })])
expectCue('erasure', [block('change', '被记得 -8', { stat: 'recognition', delta: -8 })])
expectCue('seal', [block('narration', '你把空白王印压在断路上，开始写回它。')])
expectCue('location', [block('event', '抵达：古林')])
expectCue('failure', [block('check', '旷野应对 · 失败', { outcome: 'failure' })])
expectCue('success', [block('check', '旷野应对 · 成功', { outcome: 'success' })])
expectCue('finale', [block('summary', '大修订即将开始', { trueEnding: 'ready' })])

const regions = theErasedKingdom.audioTheme.regions ?? []
if (regions.length !== 8 || new Set(regions.map((region) => region.id)).size !== 8) throw new Error('the campaign must define eight distinct soundscapes')
if (regions.some((region) => region.pattern.length !== 8)) throw new Error('every soundscape must define an eight-step pattern with intentional rests')
if (resolveStoryAudioRegion(theErasedKingdom.audioTheme, '灯塔海岸 · 旧渡船')?.id !== 'lantern-coast') throw new Error('Chinese coast location did not resolve')
if (resolveStoryAudioRegion(theErasedKingdom.audioTheme, 'Margin Settlement')?.id !== 'margins') throw new Error('English Margins location did not resolve')
if (resolveStoryAudioRegion(theErasedKingdom.audioTheme, 'Ledger Tower · Crown Chamber')?.id !== 'ledger') throw new Error('Ledger Tower must win over the generic region fallback')

console.log(JSON.stringify({ ok: true, cues: 9, soundscapes: regions.length }))
