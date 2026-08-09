import assert from 'node:assert/strict'
import { theErasedKingdom } from '../src/story/cartridges/theErasedKingdom'
import { parseStoryProtocol } from '../src/story/engine/protocol'
import { applyParsedScene, createInitialSave } from '../src/story/engine/reducer'

const scene = parseStoryProtocol(`The village road is fading.
[fact: id="apple-vale-witness-page" value="true"]
[fact: id="oldwood-witness-page" value="true"]
[fact: id="bell-market-witness-page" value="true"]
[fact: id="red-bastion-witness-page" value="true"]
[choices: "Protect the witness"|"Inspect the road"|"Spend the seal"]`, 'en')

const facts = scene.commands.filter((command) => command.type === 'fact')
const choices = scene.commands.find((command) => command.type === 'choices')
assert.equal(scene.blocks.length, 1)
assert.equal(facts.length, 4)
assert.equal(facts[0].type === 'fact' && facts[0].value, true)
assert.equal(facts[3].type === 'fact' && facts[3].value, true)
assert.deepEqual(choices?.type === 'choices' ? choices.choices : [], ['Protect the witness', 'Inspect the road', 'Spend the seal'])

const applied = applyParsedScene(createInitialSave(theErasedKingdom), scene, theErasedKingdom, '验证四张见证页')
const factNotices = applied.blocks.filter((block) => typeof block.data?.factIds === 'string')
assert.equal(factNotices.length, 1)
assert.equal(factNotices[0].text, '世界记录已更新 · 4 项事实')
assert.equal(applied.facts['witness-pages'], 4)
assert.equal(applied.facts['witness-four'], true)

const stableItem = parseStoryProtocol('[inventory: action="add" item_id="oldwood-two-way-mile-nail" item="Two-way Mile Nail" count="1"]', 'en')
const inventoryCommand = stableItem.commands.find((command) => command.type === 'inventory')
assert.equal(inventoryCommand?.type === 'inventory' ? inventoryCommand.itemId : undefined, 'oldwood-two-way-mile-nail')

console.log(JSON.stringify({ ok: true, facts: facts.length, factNotices: factNotices.length, choices: choices?.type === 'choices' ? choices.choices.length : 0 }))
