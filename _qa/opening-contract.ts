import assert from 'node:assert/strict'
import { theErasedKingdom, theErasedKingdomEn } from '../src/story/cartridges/theErasedKingdom'

for (const cartridge of [theErasedKingdom, theErasedKingdomEn]) {
  const beats = cartridge.opening.blocks
  assert.equal(beats.length, 6)
  assert.match(beats[0]?.text ?? '', /边境信使|border courier/i)
  assert.match(beats[1]?.text ?? '', /路牌|road sign/i)
  assert.match(beats[2]?.text ?? '', /哪有村庄|What village/i)
  assert.match(beats[3]?.text ?? '', /制图学徒|cartography apprentice/i)
  assert.equal(beats[4]?.kind, 'dialogue')
  assert.match(beats[4]?.text ?? '', /我叫玛拉|I.m Mara/i)
  assert.match(beats[5]?.text ?? '', /只能先保住一处|save one thing first/i)
  assert.equal(cartridge.opening.choices.length, 0)
  assert.ok(cartridge.opening.entryAction)
}

console.log(JSON.stringify({ ok: true, openingBeats: 6, entryAction: true, choicesBeforeEntryAction: 0 }))
