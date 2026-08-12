import fs from 'node:fs/promises'
import { chromium } from '/Users/yin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const evidenceDir = new URL('./ui/domain-rules/', import.meta.url)
await fs.mkdir(evidenceDir, { recursive: true })
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
const page = await context.newPage()
const transparentGif = 'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
await page.route('https://images.aiwaves.tech/alteru/guest-shell.js', (route) => route.fulfill({ contentType: 'application/javascript', body: '' }))
await page.route('https://game.aiwaves.tech/alteru-media/api/v1/images/generations', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ request_id: 'qa', task_id: 'qa-image', type: 'image', status: 'succeeded', media: { type: 'image', url: `data:image/gif;base64,${transparentGif}`, width: 512, height: 640, format: 'png' } }) }))
await page.route('https://chat.aiwaves.tech/aigram/api/gen-image', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ url: `data:image/gif;base64,${transparentGif}` }) }))
await page.addInitScript(() => { localStorage.clear(); sessionStorage.clear() })
await page.goto('http://127.0.0.1:4176/?story_mode=demo&ui=civic&lang=zh', { waitUntil: 'domcontentloaded' })
await page.addStyleTag({ content: '#alteru-guest-banner{display:none!important}' })
await page.getByRole('button', { name: /走进正在消失的苹果谷/ }).click()
await page.locator('.st-composer input').waitFor()

async function advance() {
  const next = page.getByRole('button', { name: /查看下一步选择/ })
  await next.click()
  await next.waitFor({ state: 'hidden' })
  await page.locator('.st-composer input').waitFor()
}

async function act(text) {
  const input = page.locator('.st-composer input')
  await input.fill(text)
  await input.press('Enter')
  await page.getByRole('button', { name: /查看下一步选择/ }).waitFor({ timeout: 10_000 })
}

await page.getByRole('button', { name: /抢救书记桌上的登记页/ }).click()
await page.getByRole('button', { name: /查看下一步选择/ }).waitFor({ timeout: 10_000 })
let body = await page.locator('body').innerText()
if (!body.includes('它进入信使包')) throw new Error('Registry fragment did not visibly enter inventory')
await page.screenshot({ path: new URL('01-registry-committed-platform-layout-390x844.png', evidenceDir).pathname, fullPage: true })

await advance()
await page.getByRole('button', { name: /写回桥梁，保住离村道路/ }).click()
await page.getByRole('button', { name: /查看下一步选择/ }).waitFor({ timeout: 10_000 })
body = await page.locator('body').innerText()
if (!body.includes('补给 -1')) throw new Error('Bridge anchor did not render the exact supplies cost')
await page.screenshot({ path: new URL('02-bridge-anchor-platform-layout-390x844.png', evidenceDir).pathname, fullPage: true })

await advance()
await act('写回面包房，保住补给和村民')
body = await page.locator('body').innerText()
if (!body.includes('已经选择过第一处写回地标')) throw new Error('Second Apple Vale anchor was not rejected')
await page.screenshot({ path: new URL('03-second-anchor-rejected-platform-layout-390x844.png', evidenceDir).pathname, fullPage: true })

console.log(JSON.stringify({ ok: true, viewport: '390x844', steps: ['one opening rescue committed', 'bridge anchor cost exactly once', 'second anchor rejected'] }))
await browser.close()
