import assert from 'node:assert/strict'
import { theErasedKingdom, theErasedKingdomEn } from '../src/story/cartridges/theErasedKingdom'
import { selectDemoTurn } from '../src/story/adapters/mock'
import { parseStoryProtocol } from '../src/story/engine/protocol'
import { applyParsedScene, createInitialSave } from '../src/story/engine/reducer'
import type { StoryCartridge } from '../src/story/types'

const routeZh = [
  '拉住正在褪色的玛拉',
  '写回面包房，保住补给和村民',
  '检查它是否只追逐文字',
  '让奥伦亲自检查量尺',
  '前往古林寻找被删旧路',
  '让玛拉用量尺找出循环接缝',
  '帮托玛补好磨穿的左靴并听他讲路',
  '用量尺和树影定位真正的交点',
  '用溪水、量尺和树影找出折叠接缝',
  '当面展示两村正在交换的盐和药',
  '建立两村共同维护的多路图',
  '前往钟市追查被删摊主',
  '检查只记债务的铜钟',
  '把摊主名字写入社区共同保管册',
  '前往红堡调查两段战争历史',
  '要求奥伦亲自走过两段历史',
  '公开纵火证据并保留救援者姓名',
  '去灯塔海岸寻找不存在的岛',
  '沿船身磨痕反推旧航线',
  '让渡船与乘客共同维护记忆航线',
  '回苹果谷参加归名之夜',
  '帮助归来者自己决定留下或返回',
  '带伙伴穿过潮门进入页边',
  '要求伊莱解释为什么替你决定人生',
  '收下证据，不替伊莱解除责任',
  '立刻沿潮门赶回苹果谷',
  '先保住具体的人和他们的新家庭',
  '带六张见证页前往白石王都',
  '在登记大厅公开提交六页证词',
  '承认维尔的恐惧，再质问他为何替所有人选择',
  '用六页见证约束总册，并恢复自己的名字',
]

const routeEn = [
  'Hold on to the fading Mara',
  'Restore the bakery and save supplies',
  'Check whether it can only follow writing',
  'Let Oren examine the ruler',
  'Enter Oldwood and find the erased road',
  'Let Mara measure the seam in the loop',
  "Help mend Toma's worn boot and hear the road's history",
  'Use the ruler and tree shadows to locate the true junction',
  'Use the stream, ruler and shadows to expose the fold',
  'Show them the salt and medicine changing hands',
  'Create a multi-route atlas maintained by both villages',
  'Go to Bell Market after the erased vendors',
  'Inspect the brass bell that remembers only debt',
  'Enter the vendor in a community custody register',
  'Travel to Red Bastion and investigate two war histories',
  'Make Oren walk through both histories himself',
  "Publish the arson evidence while preserving rescuers' names",
  'Go to Lantern Coast after the island that does not exist',
  'Reconstruct the old route from wear on the hull',
  'Let ferry crews and passengers maintain a memory route',
  'Return to Apple Vale for the Night of Returned Names',
  'Help returnees choose for themselves whether to stay or go back',
  'Lead the companions through the tide gate into the Margins',
  'Demand why Eli chose your life without consent',
  'Take the evidence without releasing Eli from responsibility',
  'Return to Apple Vale immediately through the tide gate',
  'Save the people and their new families first',
  'Carry all six witness pages to Whitestone Capital',
  'Submit all six testimonies publicly in the registration hall',
  "Acknowledge Veyr's fear and ask why he chose for everyone",
  'Bind the Ledger with six witness pages and restore your own name',
]

function run(cartridge: StoryCartridge, actions: string[]) {
  let save = createInitialSave(cartridge)
  actions.forEach((action) => {
    const demo = selectDemoTurn(action, cartridge.demoTurns, save.scene)
    assert(demo, `No deterministic campaign turn matched scene ${save.scene}: ${action}`)
    save = applyParsedScene(save, parseStoryProtocol(demo.content, cartridge.locale), cartridge, action, demo.imagePrompt, demo.imageSubject)
  })
  return save
}

for (const [cartridge, route] of [[theErasedKingdom, routeZh], [theErasedKingdomEn, routeEn]] as const) {
  const save = run(cartridge, route)
  assert.equal(save.facts['witness-pages'], 6)
  assert.equal(save.facts['witness-four'], true)
  assert.equal(save.facts['witness-all-six'], true)
  assert.equal(save.facts['ledger-access'], true)
  assert.equal(save.facts['veyr-dialogue-completed'], true)
  assert.equal(save.facts['true-ending-started'], true)
  assert.equal(save.finale.status, 'ready')
  assert.equal(save.choices.length, 0)
  assert.deepEqual(save.partyMemberIds.sort(), ['mara-cartographer', 'oren-knight', 'sera-peddler'])
  assert(save.inventory.some((item) => item.id === 'oldwood-two-way-mile-nail'))
  assert(save.inventory.some((item) => item.id === 'provenance-thread'))
  assert(save.inventory.some((item) => item.id === 'island-bell-shard'))
  assert(save.inventory.some((item) => item.id === 'last-letter'))
}

console.log(JSON.stringify({ ok: true, turns: routeZh.length, chapters: 8, endings: theErasedKingdom.endingDirector?.anchors.length }))
