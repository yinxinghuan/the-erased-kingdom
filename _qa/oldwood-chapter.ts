import assert from 'node:assert/strict'
import { theErasedKingdom } from '../src/story/cartridges/theErasedKingdom'
import { selectDemoTurn } from '../src/story/adapters/mock'
import { parseStoryProtocol } from '../src/story/engine/protocol'
import { applyParsedScene, createInitialSave } from '../src/story/engine/reducer'

let save = createInitialSave(theErasedKingdom)

function act(action: string) {
  const turn = selectDemoTurn(action, theErasedKingdom.demoTurns, save.scene)
  assert(turn, `No deterministic demo turn matched: ${action}`)
  save = applyParsedScene(
    save,
    parseStoryProtocol(turn.content, 'zh'),
    theErasedKingdom,
    action,
    turn.imagePrompt,
    turn.imageSubject,
  )
}

act('拉住正在褪色的玛拉')
assert(save.partyMemberIds.includes('mara-cartographer'))

act('让奥伦亲自检查量尺')
assert.equal(save.sessionEnded, true)
assert(save.partyMemberIds.includes('mara-cartographer'))

act('前往古林寻找被删旧路')
act('让玛拉用量尺找出循环接缝')
act('帮托玛补好磨穿的左靴并听他讲路')
act('让玛拉与托玛在两岸同时叫出目的地')
act('让玛拉和托玛从两端钉住同一地点')
act('请托玛作证，并把消息送给奥伦')
act('建立两村共同维护的多路图')

assert(save.partyMemberIds.includes('mara-cartographer'), 'Mara must remain in the party across the regional transition')
assert.equal(save.partyMemberIds.length, 1, 'A local NPC must not silently replace or join the active party')
assert.equal(save.characters.find((character) => character.id === 'toma-roadkeeper')?.name, '托玛')
assert.equal(save.characters.find((character) => character.id === 'toma-roadkeeper')?.status, 'known')

const mileNails = save.inventory.filter((item) => item.id === 'oldwood-two-way-mile-nail')
assert.equal(mileNails.length, 1)
assert.equal(mileNails[0].count, 1)
assert.equal(mileNails[0].rarity, 'rare')
assert.equal(mileNails[0].metrics?.length, 2)
assert(mileNails[0].effect?.includes('不能制造新路'))
assert(mileNails[0].lore?.includes('托玛'))

assert.equal(save.facts['oldwood-entered'], true)
assert.equal(save.facts['oldwood-route-proof'], 'measured-seam')
assert.equal(save.facts['oldwood-danger-method'], 'companions')
assert.equal(save.facts['oldwood-resolution'], 'common-atlas')
assert.equal(save.facts['oldwood-witness-page'], true)
assert.equal(save.facts['witness-pages'], 1)
assert.equal(save.facts['common-atlas-seed'], true)
assert.equal(save.map.find((node) => node.label === '古林')?.visited, true)
assert.equal(save.map.find((node) => node.label === '古林众路图')?.current, true)
assert.equal(save.sessionEnded, true)
assert.equal(save.finale.status, 'idle')
assert.equal(save.choices.length, 3)
assert(!save.choices.some((choice) => /继续/.test(choice.label)))

console.log(JSON.stringify({
  ok: true,
  scenes: save.scene,
  party: save.partyMemberIds,
  inventory: mileNails.map((item) => item.id),
  resolution: save.facts['oldwood-resolution'],
  witnessPages: save.facts['witness-pages'],
  choices: save.choices.length,
}))
