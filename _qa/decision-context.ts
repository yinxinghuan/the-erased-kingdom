import assert from 'node:assert/strict'
import { theErasedKingdom } from '../src/story/cartridges/theErasedKingdom'
import { parseStoryProtocol } from '../src/story/engine/protocol'
import { selectStageOverlay } from '../src/story/engine/stageNarrative'

const openingDecision = selectStageOverlay(theErasedKingdom.opening.blocks, 'decision')
assert.equal(openingDecision?.id, 'ek5')
assert(openingDecision?.text.includes('玛拉的指尖'))
assert(openingDecision?.text.includes('只能先保住一处'))

const rescueMara = theErasedKingdom.demoTurns.find((turn) => turn.match.includes('拉住'))
assert(rescueMara)
const rescueScene = parseStoryProtocol(rescueMara.content, 'zh')
const rescueResult = selectStageOverlay(rescueScene.blocks, 'result')
const rescueDecision = selectStageOverlay(rescueScene.blocks, 'decision')
assert(rescueResult?.text.includes('抓住玛拉'))
assert(rescueDecision?.text.includes('桥、面包房与山坡钟楼'))
assert.notEqual(rescueResult?.id, rescueDecision?.id)

const orenTurn = theErasedKingdom.demoTurns.find((turn) => turn.match.includes('奥伦'))
assert(orenTurn)
const orenScene = parseStoryProtocol(orenTurn.content, 'zh')
const orenResult = selectStageOverlay(orenScene.blocks, 'result')
const orenDecision = selectStageOverlay(orenScene.blocks, 'decision')
assert(orenResult?.text.includes('奥伦没有拔剑'))
assert(orenDecision?.text.includes('玛拉把王国地图铺在已恢复的地面上'))
assert(orenDecision?.text.includes('古林'))
assert.notEqual(orenResult?.id, orenDecision?.id)

console.log(JSON.stringify({
  ok: true,
  opening: openingDecision?.text,
  rescueResult: rescueResult?.text,
  rescueDecision: rescueDecision?.text,
  orenDecision: orenDecision?.text,
}))
