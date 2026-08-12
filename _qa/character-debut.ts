import assert from 'node:assert/strict'
import { theErasedKingdom } from '../src/story/cartridges/theErasedKingdom'
import { parseStoryProtocol } from '../src/story/engine/protocol'
import { applyParsedScene, createInitialSave, normalizeCharacterState } from '../src/story/engine/reducer'
import type { StoryCharacter } from '../src/story/types'

const initial = createInitialSave(theErasedKingdom)
assert.deepEqual(initial.characters.map((character) => character.id), ['mara-cartographer'])

const definition = theErasedKingdom.characters.find((character) => character.id === 'oren-knight')
assert(definition?.hiddenUntilIntroduced)
const legacy: StoryCharacter = { ...definition, status: 'known', origin: 'cartridge', updatedAtScene: 0 }
const repaired = normalizeCharacterState({ ...initial, characters: [...initial.characters, legacy] }, theErasedKingdom)
assert.equal(repaired.characters.some((character) => character.id === 'oren-knight'), false)

const introduced = applyParsedScene(initial, parseStoryProtocol(`远处一名披旧白披风的骑士先命士兵救人，随后摘下头盔，自称皇家骑士奥伦；他正在追查王印，也明确要求你交出它。
[character_update: character_id="oren-knight" character="奥伦" role="皇家骑士" detail="旧白披风，先命令士兵救人" lore="循王印痕迹赶来"]
[choices: "请奥伦核验玛拉的证物"|"拒绝交出王印"|"带村民沿桥撤离"]`, 'zh'), theErasedKingdom, '面对远处骑士')
assert.equal(introduced.characters.find((character) => character.id === 'oren-knight')?.origin, 'cartridge')
assert.equal(introduced.characters.some((character) => character.id === 'sera-peddler'), false)
assert.equal(introduced.characters.some((character) => character.id === 'eli-courier'), false)
assert.equal(introduced.characters.some((character) => character.id === 'veyr-regent'), false)

console.log(JSON.stringify({ ok: true, openingRoster: initial.characters.map((character) => character.id), introduced: 'oren-knight' }))
