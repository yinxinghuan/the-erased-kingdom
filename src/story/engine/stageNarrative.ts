import type { StoryBlock } from '../types'

export type StageNarrativePhase = 'decision' | 'resolving' | 'result'

function isAuthoredEvent(block: StoryBlock): boolean {
  return block.kind === 'event'
    && !/^(?:action|effect|facts|image)-/.test(block.id)
    && !block.data
}

export function stageNarrativeBlocks(blocks: StoryBlock[]): StoryBlock[] {
  return blocks.filter((block) => block.kind === 'narration' || block.kind === 'dialogue' || isAuthoredEvent(block))
}

export function selectStageOverlay(blocks: StoryBlock[], phase: StageNarrativePhase, preview = false): StoryBlock | undefined {
  const story = stageNarrativeBlocks(blocks)
  if (!story.length) return undefined
  if (preview || phase !== 'decision') return story[0]
  const authoredOverlay = story.find((block) => block.data?.stageOverlay === 'true')
  if (authoredOverlay) return authoredOverlay
  return story.at(-1)
}
