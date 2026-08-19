import assert from 'node:assert/strict'
import { theErasedKingdom } from '../src/story/cartridges/theErasedKingdom'
import { createAuthorityShadowSample } from '../src/story/engine/authorityShadow'
import { createInitialSave } from '../src/story/engine/reducer'
const save = createInitialSave(theErasedKingdom); const visible = JSON.stringify(save.choices); const sample = createAuthorityShadowSample(save, theErasedKingdom)
assert.equal(JSON.stringify(save.choices), visible); assert.equal(sample.choices.length, save.choices.length); assert.equal(sample.emptyTray, false); assert.ok(sample.choices.every((choice) => ['accepted', 'rejected', 'open'].includes(choice.status))); assert.equal(createAuthorityShadowSample({ ...save, entered: true, choices: [], sessionEnded: false }, theErasedKingdom).emptyTray, true)
console.log('the-erased-kingdom authority shadow is observational: ok')
