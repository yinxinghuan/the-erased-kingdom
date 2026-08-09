import assert from 'node:assert/strict'
import { theErasedKingdom } from '../src/story/cartridges/theErasedKingdom'
import { parseStoryProtocol } from '../src/story/engine/protocol'
import { applyParsedScene, createInitialSave } from '../src/story/engine/reducer'

const initial = createInitialSave(theErasedKingdom)
const acquired = applyParsedScene(initial, parseStoryProtocol(`你从断桥下收起一枚铜制路签。
[inventory: action="add" item_id="qa-road-token" item="铜制路签" count="1" rarity="uncommon" detail="断桥巡路人的旧凭证" effect="证明一次公开通行" lore="从苹果谷旧桥下取得" metrics="通行证明: 1"]`, 'zh'), theErasedKingdom, '收起路签')
assert.equal(acquired.inventory.find((item) => item.id === 'qa-road-token')?.count, 1)
assert.equal(acquired.blocks.some((block) => block.kind === 'change' && block.text.includes('铜制路签')), true)

const seenOnly = applyParsedScene(initial, parseStoryProtocol('你看见石台上有一枚铜制路签，但没有拿走。\n[choices: "查看刻痕"|"询问玛拉"|"离开石台"]', 'zh'), theErasedKingdom, '观察石台')
assert.equal(seenOnly.inventory.some((item) => item.label === '铜制路签'), false)

const removed = applyParsedScene(acquired, parseStoryProtocol('你把铜制路签交给守桥人。\n[inventory: action="remove" item_id="qa-road-token" item="铜制路签" count="1"]', 'zh'), theErasedKingdom, '交还路签')
assert.equal(removed.inventory.some((item) => item.id === 'qa-road-token'), false)

const party = applyParsedScene(initial, parseStoryProtocol(`[party_change: character_id="qa-witness" character="见证人" change="add" role="守路人" detail="愿意陪同核验道路" lore="来自古林" vitality="68" stress="24" skills="寻路: 3"]
[choices: "一起上路"|"先核对证言"|"请他等候"]`, 'zh'), theErasedKingdom, '邀请同行')
assert.deepEqual(party.partyMemberIds, ['qa-witness'])
assert.equal(party.characters.find((character) => character.id === 'qa-witness')?.name, '见证人')

const later = applyParsedScene(party, parseStoryProtocol('你们抵达下一处路标。\n[choices: "检查路标"|"继续同行"|"返回古林"]', 'zh'), theErasedKingdom, '继续同行')
assert.deepEqual(later.partyMemberIds, ['qa-witness'])

console.log(JSON.stringify({ ok: true, inventory: acquired.inventory.length, party: later.partyMemberIds }))
