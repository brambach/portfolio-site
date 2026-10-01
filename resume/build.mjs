// Prints resume/Bryce_Rambach_Resume.html to resume/Bryce_Rambach_Resume.pdf.
// Run from the project root: node resume/build.mjs
import { chromium } from 'playwright'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const dir = path.dirname(fileURLToPath(import.meta.url))
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(pathToFileURL(path.join(dir, 'Bryce_Rambach_Resume.html')).href)
await page.evaluate(() => document.fonts.ready)
await page.pdf({
  path: path.join(dir, 'Bryce_Rambach_Resume.pdf'),
  preferCSSPageSize: true,
  printBackground: true,
})
await browser.close()
