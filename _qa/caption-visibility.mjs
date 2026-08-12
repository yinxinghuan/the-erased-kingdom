import { chromium } from '/Users/yin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
import { mkdir } from 'node:fs/promises'

const base = process.env.QA_BASE
if (!base) throw new Error('QA_BASE is required')
const evidence = new URL('./ui/caption-visibility/', import.meta.url).pathname
await mkdir(evidence, { recursive: true })
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
const page = await context.newPage()
const transparentGif = 'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
let storyTurn = 0

await page.route('https://images.aiwaves.tech/alteru/guest-shell.js', (route) => route.fulfill({ contentType: 'application/javascript', body: '' }))
await page.route('**/alteru-media/api/v1/images/generations', async (route) => {
  const body = route.request().postDataJSON()
  await route.fulfill({ contentType: 'application/json', body: JSON.stringify({
    task_id: `qa-${body.request_id}`, request_id: body.request_id, type: 'image', status: 'succeeded',
    created_at: Date.now(), updated_at: Date.now(),
    media: { type: 'image', url: `data:image/gif;base64,${transparentGif}`, width: 512, height: 640, format: 'png' },
  }) })
})
await page.route('**/aigram/api/game-chat', async (route) => {
  storyTurn += 1
  const content = storyTurn === 1
    ? `image_prompt:"SUBJECT A beneath suspended rain, no text"
image_subject:"player"
请做出选择
[choices: "沿路前进"|"检查悬雨"|"返回屋檐"]`
    : `左边的路正在变化，右边传来同伴的呼喊。
image_prompt:"two diverging roads beneath suspended rain, no text"
image_subject:"environment"
[choices: "走向左路"|"回应呼喊"|"检查脚下"]`
  await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ choices: [{ message: { content } }] }) })
})
await page.addInitScript(() => {
  localStorage.clear()
  localStorage.setItem('game_locale', 'zh')
})
await page.goto(`${base}/?ui=civic&lang=zh`, { waitUntil: 'networkidle' })
await page.addStyleTag({ content: '#alteru-guest-banner{display:none!important}' })
await page.locator('.st-entry .st-primary').click()
await page.locator('.st-composer input').fill('观察天空颜色')
await page.locator('.st-composer input').press('Enter')
await page.getByRole('button', { name: /查看下一步选择/ }).waitFor({ timeout: 10_000 })
await page.getByRole('button', { name: /查看下一步选择/ }).click()
await page.getByRole('button', { name: /沿路前进/ }).waitFor()

if (await page.locator('.ct-stage__caption').count()) throw new Error(`protocol residue or generic choice prompt still created a caption card: ${await page.locator('.ct-stage__caption').allTextContents()}`)
if (await page.getByText(/image_subject|image_prompt|请做出选择/).count()) throw new Error('internal or redundant copy remained visible')
await page.screenshot({ path: `${evidence}01-caption-absent-platform-layout-390x844.png`, fullPage: true })
await page.setViewportSize({ width: 320, height: 568 })
if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) throw new Error('caption-absent state overflows at 320x568')
await page.screenshot({ path: `${evidence}01-caption-absent-platform-layout-320x568.png`, fullPage: true })
await page.setViewportSize({ width: 390, height: 844 })

await page.locator('.st-composer input').fill('描述远处声音')
await page.locator('.st-composer input').press('Enter')
await page.getByRole('button', { name: /查看下一步选择/ }).waitFor({ timeout: 10_000 })
await page.getByRole('button', { name: /查看下一步选择/ }).click()
const caption = page.locator('.ct-stage__caption')
await caption.waitFor()
if (!await caption.getByText('此刻', { exact: true }).isVisible()) throw new Error('meaningful narration did not use the neutral current-moment label')
if (!await caption.getByText('左边的路正在变化，右边传来同伴的呼喊。', { exact: true }).isVisible()) throw new Error('meaningful decision context was not retained')
if (await page.getByText(/接下来，你要怎么做|请做出选择/).count()) throw new Error('choice invitation was repeated above the actual choices')
await page.screenshot({ path: `${evidence}02-context-caption-platform-layout-390x844.png`, fullPage: true })
await page.setViewportSize({ width: 320, height: 568 })
if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) throw new Error('meaningful-caption state overflows at 320x568')
await page.screenshot({ path: `${evidence}02-context-caption-platform-layout-320x568.png`, fullPage: true })
if (storyTurn !== 2) throw new Error(`expected two remote turns, received ${storyTurn}`)

console.log(JSON.stringify({ ok: true, viewports: ['390x844', '320x568'], emptyWhenRedundant: true, meaningfulContextKept: true }))
await browser.close()
