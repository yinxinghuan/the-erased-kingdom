import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { chromium } from '/Users/yin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const baseUrl = process.env.QA_BASE_URL ?? 'http://127.0.0.1:4182/'
const outputDir = process.env.QA_OUT_DIR ?? new URL('./ui/opening-lived-sequence/', import.meta.url).pathname
await fs.mkdir(outputDir, { recursive: true })
const browser = await chromium.launch({ headless: true })

async function verify(width, height) {
  const page = await browser.newPage({ viewport: { width, height }, locale: 'zh-CN' })
  await page.route('**/note/telegram/user/get/info/**', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { name: '无名信使', head_url: '' } }) }))
  await page.route('**/alteru-media/api/v1/images/generations', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ task_id: 'qa-opening', request_id: 'qa-opening', type: 'image', status: 'queued', created_at: 0, updated_at: 0 }) }))
  await page.goto(`${baseUrl}?story_mode=demo&ui=civic`, { waitUntil: 'networkidle' })
  await page.addStyleTag({ content: '#alteru-guest-banner,#alteru-guest-login{display:none!important}' })
  await page.locator('.st-primary').click()
  await page.waitForSelector('.ct-stage__caption')

  const expected = [/边境信使/, /路牌/, /哪有村庄/, /制图学徒/, /我叫玛拉/, /只能先保住一处/]
  for (let index = 0; index < expected.length; index += 1) {
    const text = (await page.locator('.ct-stage__caption p').textContent()) ?? ''
    assert.match(text, expected[index], `opening page ${index + 1} must preserve its authored beat`)
    if ([0, 3, 4].includes(index)) await page.screenshot({ path: `${outputDir}opening-${index === 0 ? 'courier' : index === 3 ? 'apprentice' : 'mara-intro'}-platform-layout-${width}x${height}.png`, fullPage: true })
    if (index < expected.length - 1) {
      assert.equal(await page.locator('.st-composer').count(), 0, `choices must remain hidden on opening page ${index + 1}`)
      await page.locator('.ct-stage__caption-page').click()
    }
  }
  await page.waitForSelector('.st-composer')
  assert.equal(await page.locator('.st-quick-replies button').count(), 3)
  assert.equal(await page.locator('.ct-stage__caption-page').count(), 0)
  const size = await page.evaluate(() => ({ width: document.body.scrollWidth, height: document.body.scrollHeight }))
  assert.deepEqual(size, { width, height })
  await page.screenshot({ path: `${outputDir}opening-final-platform-layout-${width}x${height}.png`, fullPage: true })
  await page.close()
}

await verify(320, 568)
await verify(390, 844)
await browser.close()
console.log(JSON.stringify({ ok: true, pages: 6, choicesAfterFinalPage: 3, viewports: ['320x568', '390x844'] }))
