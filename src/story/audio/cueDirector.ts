import type { StoryBlock } from '../types'
import type { StoryAudioCue } from './StorySynth'

function textData(blocks: StoryBlock[], key: string): string {
  return blocks.map((block) => String(block.data?.[key] ?? '')).filter(Boolean).join('|')
}

function allText(blocks: StoryBlock[]): string {
  return blocks.map((block) => block.text).join('\n')
}

function checkPassed(block: StoryBlock): boolean {
  const outcome = String(block.data?.outcome ?? '')
  return outcome === 'success' || outcome === 'critical-success' || outcome === 'costly-success'
}

/** Chooses one semantic cue for a completed turn so stacked reducer effects do not become audio clutter. */
export function cueForStoryBlocks(blocks: StoryBlock[]): StoryAudioCue {
  const facts = textData(blocks, 'factIds')
  const stat = textData(blocks, 'stat')
  const danger = textData(blocks, 'dangerPhase')
  const party = textData(blocks, 'partyChange')
  const prose = allText(blocks)
  const check = blocks.find((block) => block.kind === 'check')

  if (blocks.some((block) => block.data?.trueEnding === 'ready') || /true-ending-started/.test(facts)) return 'finale'
  if (/-witness-page/.test(facts)) return 'witness'
  if (danger === 'warning' || danger === 'confrontation') return 'danger'
  if (party) return 'companion'
  if (blocks.some((block) => block.kind === 'change' && (block.data?.rarity === 'rare' || block.data?.rarity === 'legendary'))) return 'treasure'
  if (check && !checkPassed(check)) return 'failure'
  if (stat.includes('recognition') && blocks.some((block) => Number(block.data?.delta ?? 0) < 0)) return 'erasure'
  if (/seal|王印|写回|write back|restor|恢复|anchor|锚定/i.test(`${facts}\n${prose}`)) return 'seal'
  if (blocks.some((block) => block.kind === 'event' && /^effect-/.test(block.id) && !block.data?.factIds && !block.data?.characterId && !block.data?.dangerPhase)) return 'location'
  if (check) return checkPassed(check) ? 'success' : 'failure'
  if (blocks.some((block) => block.kind === 'summary')) return 'summary'
  if (blocks.some((block) => block.kind === 'event' && !block.id.startsWith('action-'))) return 'discovery'
  if (blocks.some((block) => block.kind === 'change')) return 'change'
  return 'change'
}
