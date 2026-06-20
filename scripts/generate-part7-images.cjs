#!/usr/bin/env node
// Generates missing Part 7 illustrations using DALL-E 3.
// Usage: OPENAI_API_KEY=sk-... npm run generate:part7-images
// Idempotent — skips images that already exist in public/images/part7/.
// To add new prompts: append to part7.json then re-run this script.

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const BANK_PATH = 'public/questions/schools/part7.json'
const OUT_DIR = 'public/images/part7'
const SIZE = 512
const QUALITY = 80

const buildPrompt = (scene) =>
  `Flat cartoon illustration. Clean vector style, bold outlines, bright saturated colors, ` +
  `simple expressive characters, no text or UI elements. Square format. Scene: ${scene}.`

async function generateImageB64(scene) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: buildPrompt(scene),
      n: 1,
      size: '1024x1024',
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenAI API error ${res.status}: ${body}`)
  }
  const data = await res.json()
  return data.data[0].b64_json
}

async function saveAsWebP(b64, destPath) {
  const buffer = Buffer.from(b64, 'base64')
  await sharp(buffer).resize(SIZE, SIZE).webp({ quality: QUALITY }).toFile(destPath)
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is required')
    process.exit(1)
  }

  const bank = JSON.parse(fs.readFileSync(BANK_PATH, 'utf8'))
  fs.mkdirSync(OUT_DIR, { recursive: true })

  let generated = 0
  let skipped = 0

  for (const prompt of bank.prompts) {
    for (const pic of prompt.pics) {
      const destPath = path.join(OUT_DIR, path.basename(pic.image))
      if (fs.existsSync(destPath)) {
        console.log(`  skip  ${path.basename(destPath)}`)
        skipped++
        continue
      }
      console.log(`  gen   ${path.basename(destPath)} — "${pic.text}"`)
      const b64 = await generateImageB64(pic.text)
      await saveAsWebP(b64, destPath)
      console.log(`  saved ${path.basename(destPath)}`)
      generated++
    }
  }

  console.log(`\nDone: ${generated} generated, ${skipped} skipped.`)
}

main().catch(err => { console.error(err.message); process.exit(1) })
