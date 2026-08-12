import assert from 'node:assert/strict'
import { selectStageOverlay, stageNarrativeBlocks } from '../src/story/engine/stageNarrative'
import type { StoryBlock } from '../src/story/types'

const blocks: StoryBlock[] = [
  { id: 'story', kind: 'narration', text: '雨停在半空，斑马线的白线正朝两条路分开。' },
  { id: 'leak', kind: 'narration', text: 'image_subject:"player"' },
  { id: 'prompt', kind: 'narration', text: '请做出选择' },
]

assert.deepEqual(stageNarrativeBlocks(blocks).map((block) => block.id), ['story'])
assert.equal(selectStageOverlay(blocks, 'decision')?.id, 'story')
assert.equal(selectStageOverlay([{ id: 'prompt', kind: 'narration', text: '接下来，你要怎么做？' }], 'decision'), undefined)
assert.equal(selectStageOverlay([{ id: 'prompt', kind: 'narration', text: 'What will you do next?' }], 'decision'), undefined)
assert.equal(selectStageOverlay([{ id: 'prompt', kind: 'narration', text: 'Please choose an action.' }], 'decision'), undefined)
assert.equal(selectStageOverlay([{ id: 'context', kind: 'narration', text: '左边的路正在变化，右边传来同伴的呼喊。' }], 'decision')?.id, 'context')

console.log(JSON.stringify({ ok: true, protocolLeakHidden: true, redundantPromptHidden: true, contextKept: true }))
