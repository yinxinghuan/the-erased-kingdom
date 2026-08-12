import assert from 'node:assert/strict'
import { theErasedKingdom } from '../src/story/cartridges/theErasedKingdom'
import { resolveDomainAction } from '../src/story/engine/domainRules'
import { parseStoryProtocol } from '../src/story/engine/protocol'
import { applyParsedScene, createInitialSave } from '../src/story/engine/reducer'
import type { StorySave } from '../src/story/types'

function play(save: StorySave, action: string) {
  const domain = resolveDomainAction(save, theErasedKingdom, action)
  const hostile = `模型试图同时发放互斥结果。
[widget: supplies, add: 12]
[widget: recognition, add: 40]
[fact: id="first-rescue" value="bridge"]
[fact: id="apple-anchor" value="bell-tower"]
[party_change: character_id="veyr-regent" character="维尔" change="add"]
[choices: "错误一"|"错误二"|"错误三"]`
  return {
    domain,
    next: applyParsedScene(save, parseStoryProtocol(hostile, 'zh'), theErasedKingdom, action, undefined, undefined, undefined, domain),
  }
}

function itemCount(save: StorySave, id: string) {
  return save.inventory.find((item) => item.id === id)?.count ?? 0
}

let save = createInitialSave(theErasedKingdom)
assert.deepEqual(save.characters.map((character) => character.id), ['mara-cartographer'])
assert.equal(save.facts['first-rescue'], 'unset')
assert.equal(save.facts['apple-anchor'], 'unset')

let turn = play(save, '抢救书记桌上的登记页')
assert.equal(turn.domain?.status, 'accepted')
assert.equal(turn.next.facts['first-rescue'], 'registry-page')
assert.equal(turn.next.facts['apple-page-saved'], true)
assert.equal(itemCount(turn.next, 'apple-registry-fragment'), 1)
assert.equal(turn.next.characters.some((character) => character.id === 'veyr-regent'), false)
save = turn.next

turn = play(save, '拉住正在褪色的玛拉')
assert.equal(turn.domain?.status, 'rejected')
assert.equal(turn.next.stats.recognition, 48)
assert.equal(turn.next.facts['first-rescue'], 'registry-page')
save = turn.next

turn = play(save, '写回桥梁，保住离村道路')
assert.equal(turn.domain?.status, 'accepted')
assert.equal(turn.next.facts['apple-anchor'], 'bridge')
assert.equal(turn.next.stats.supplies, 6)
assert.equal(turn.next.stats.recognition, 48)
save = turn.next

turn = play(save, '写回面包房，保住补给和村民')
assert.equal(turn.domain?.status, 'rejected')
assert.equal(turn.next.facts['apple-anchor'], 'bridge')
assert.equal(turn.next.stats.supplies, 6)
assert.equal(turn.next.stats.recognition, 48)

assert.equal(resolveDomainAction(turn.next, theErasedKingdom, '询问玛拉为什么坚持画地图'), undefined)
console.log(JSON.stringify({ ok: true, firstRescue: turn.next.facts['first-rescue'], anchor: turn.next.facts['apple-anchor'], supplies: turn.next.stats.supplies }))
