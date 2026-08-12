import type { StoryBlock } from '../types'
import { isProtocolResidueText } from './protocol'

export type StageNarrativePhase = 'decision' | 'resolving' | 'result'

function isAuthoredEvent(block: StoryBlock): boolean {
  return block.kind === 'event'
    && !/^(?:action|effect|facts|image)-/.test(block.id)
    && !block.data
}

export function isRedundantChoicePrompt(value: string): boolean {
  const text = value.trim().replace(/[。.!！?？：:，,\s]+/g, '')
  return /^(?:请)?(?:做出|作出|进行)?(?:你的|一个)?选择$/.test(text)
    || /^(?:接下来)?你(?:想|要|会)?怎么做$/.test(text)
    || /^(?:请选择|选择)(?:你的)?(?:下一步)?(?:行动|做法)?$/.test(text)
    || /^(?:please)?(?:make|choose)(?:your|a|an)?(?:next)?(?:choice|action)$/.test(text.toLowerCase())
    || /^(?:please)?choosewhattodonext$/.test(text.toLowerCase())
    || /^what(?:will|do|would)you(?:do|choose)next$/.test(text.toLowerCase())
}

export function isMeaningfulStageBlock(block: StoryBlock): boolean {
  return !isProtocolResidueText(block.text) && !isRedundantChoicePrompt(block.text)
}

export function stageNarrativeBlocks(blocks: StoryBlock[]): StoryBlock[] {
  return blocks.filter((block) => (block.kind === 'narration' || block.kind === 'dialogue' || isAuthoredEvent(block)) && isMeaningfulStageBlock(block))
}

export function selectStageOverlay(blocks: StoryBlock[], phase: StageNarrativePhase, preview = false): StoryBlock | undefined {
  const story = stageNarrativeBlocks(blocks)
  if (!story.length) return undefined
  if (preview || phase !== 'decision') return story[0]
  const authoredOverlay = story.find((block) => block.data?.stageOverlay === 'true')
  if (authoredOverlay) return authoredOverlay
  return story.at(-1)
}
