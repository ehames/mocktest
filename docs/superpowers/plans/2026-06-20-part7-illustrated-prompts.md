# Part 7 Illustrated Prompts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Part 7's text-keyword picture cards with a horizontally swipeable strip of flat-cartoon WebP illustrations, starting with a 2-prompt pilot.

**Architecture:** `PicCard` gains a required `image` field; the active JSON bank (`schools/part7.json`) is replaced with 2 illustrated prompts; `Part7Writing` renders a scroll-snap image strip instead of keyword cards; Workbox CacheFirst handles image caching at runtime so images are not bloating the precache manifest.

**Tech Stack:** React 18 + TypeScript, Vite + vite-plugin-pwa (Workbox), WebP images (512×512), OpenAI DALL-E 3, sharp (image conversion)

## Global Constraints

- Images stored at `public/images/part7/{slug}_p{1|2|3}.webp`; served at `images/part7/...` (root-relative)
- WebP format, 512×512px, flat cartoon style
- `image` field on `PicCard` is required — no text-only fallback
- `text` field kept as `alt` on `<img>` for accessibility
- `LS_KEY` must be bumped to `'a2key_v2'` to clear stale localStorage sessions
- App base path is `/mocktest/`; Workbox runtime caching pattern must match full URL
- Image generation script requires Node 18+ (`fetch` built-in) and `OPENAI_API_KEY` env var
- Generation script is idempotent: skips `public/images/part7/` files that already exist

---

### Task 1: Update `PicCard` type and `LS_KEY`

**Files:**
- Modify: `src/types.ts:96-99`
- Modify: `src/constants.ts:35`

**Interfaces:**
- Produces: `PicCard { label: string; text: string; image: string }` — consumed by Tasks 3, 4, and 5

- [ ] **Step 1: Add `image` to `PicCard` in `src/types.ts`**

Replace lines 96–99:

```ts
export interface PicCard {
  label: string
  text: string
  image: string
}
```

- [ ] **Step 2: Bump `LS_KEY` in `src/constants.ts`**

Replace line 35:

```ts
export const LS_KEY = 'a2key_v2'
```

- [ ] **Step 3: Verify TypeScript compiles with no errors**

```bash
npm run build
```

Expected: build succeeds. The only TypeScript impact is that `PicCard` now requires `image`; the existing component reads `pic.label` and `pic.text` only, so no error there. The JSON bank is validated at runtime, not compile time.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/constants.ts
git commit -m "feat: add image field to PicCard, bump LS_KEY to v2"
```

---

### Task 2: Replace `schools/part7.json` with illustrated pilot bank

**Files:**
- Rename: `public/questions/schools/part7.json` → `public/questions/schools/part7-text-archive.json`
- Create: `public/questions/schools/part7.json`

**Interfaces:**
- Produces: `Part7Bank` with 2 `Part7Prompt` entries each having `PicCard.image` set — consumed by Task 4 at runtime

- [ ] **Step 1: Archive the existing bank**

```bash
mv public/questions/schools/part7.json public/questions/schools/part7-text-archive.json
```

- [ ] **Step 2: Write the new `public/questions/schools/part7.json`**

```json
{
  "prompts": [
    {
      "intro": "Look at the three pictures. Write the story shown in the pictures.",
      "pics": [
        { "label": "Picture 1", "text": "a boy leaves home on his bicycle on a sunny morning",           "image": "images/part7/cafe-rain_p1.webp" },
        { "label": "Picture 2", "text": "it starts raining and the boy shelters at a bus stop with a friend", "image": "images/part7/cafe-rain_p2.webp" },
        { "label": "Picture 3", "text": "the two friends sit together in a café eating cakes and laughing", "image": "images/part7/cafe-rain_p3.webp" }
      ],
      "minWords": 35
    },
    {
      "intro": "Look at the three pictures. Write the story shown in the pictures.",
      "pics": [
        { "label": "Picture 1", "text": "a boy finds a lost dog wandering alone in a park",     "image": "images/part7/lost-dog_p1.webp" },
        { "label": "Picture 2", "text": "the boy notices a lost dog poster on the street",       "image": "images/part7/lost-dog_p2.webp" },
        { "label": "Picture 3", "text": "the boy returns the dog to its happy owner in a garden","image": "images/part7/lost-dog_p3.webp" }
      ],
      "minWords": 35
    }
  ]
}
```

- [ ] **Step 3: Verify build still passes**

```bash
npm run build
```

Expected: success. The JSON is fetched at runtime; no build-time validation.

- [ ] **Step 4: Commit**

```bash
git add public/questions/schools/part7.json public/questions/schools/part7-text-archive.json
git commit -m "feat: replace part7 bank with 2 illustrated pilot prompts, archive text-only bank"
```

---

### Task 3: Add Workbox runtime caching for part7 images

**Files:**
- Modify: `vite.config.ts:15` (inside the existing `runtimeCaching` array)

**Interfaces:**
- Consumes: nothing from other tasks
- Produces: Workbox `CacheFirst` rule matching `*/images/part7/*`

- [ ] **Step 1: Add the `CacheFirst` rule to `vite.config.ts`**

In `vite.config.ts`, inside the `runtimeCaching` array (after the existing `question-banks` entry), add:

```ts
{
  urlPattern: /\/images\/part7\//,
  handler: 'CacheFirst',
  options: {
    cacheName: 'part7-images',
    expiration: { maxEntries: 500 },
  },
},
```

The full `runtimeCaching` array becomes:

```ts
runtimeCaching: [
  {
    urlPattern: /\/mocktest\/questions\/.+\.json$/,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'question-banks',
      networkTimeoutSeconds: 4,
      expiration: { maxAgeSeconds: 60 * 60 * 24 * 7 },
    },
  },
  {
    urlPattern: /\/images\/part7\//,
    handler: 'CacheFirst',
    options: {
      cacheName: 'part7-images',
      expiration: { maxEntries: 500 },
    },
  },
  {
    urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
    handler: 'CacheFirst',
    options: {
      cacheName: 'google-fonts',
      expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
    },
  },
],
```

Note: WebP files are not in `globPatterns` (`**/*.{js,css,html,ico,png,svg}`) so they won't be precached — runtime caching is the only caching layer for images, which is intentional.

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: success. The generated `sw.js` will include the new `CacheFirst` rule.

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "feat: add CacheFirst runtime caching for part7 images"
```

---

### Task 4: Image generation script

**Files:**
- Create: `scripts/generate-part7-images.js`
- Modify: `package.json` (add `generate:part7-images` npm script)

**Interfaces:**
- Consumes: `public/questions/schools/part7.json` — reads `pic.image` filenames and `pic.text` for prompts
- Produces: `public/images/part7/*.webp` — consumed by Task 5 (Playwright verification)

- [ ] **Step 1: Install `sharp` as a dev dependency**

```bash
npm install --save-dev sharp
```

Expected: `sharp` appears in `package.json` devDependencies. `sharp` provides native WebP encoding; it downloads a pre-built binary so no compiler needed.

- [ ] **Step 2: Create `scripts/generate-part7-images.js`**

```js
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

async function generateImageUrl(scene) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: buildPrompt(scene),
      n: 1,
      size: '1024x1024',
      response_format: 'url',
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenAI API error ${res.status}: ${body}`)
  }
  const data = await res.json()
  return data.data[0].url
}

async function saveAsWebP(url, destPath) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Image download failed: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
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
      const url = await generateImageUrl(pic.text)
      await saveAsWebP(url, destPath)
      console.log(`  saved ${path.basename(destPath)}`)
      generated++
    }
  }

  console.log(`\nDone: ${generated} generated, ${skipped} skipped.`)
}

main().catch(err => { console.error(err.message); process.exit(1) })
```

- [ ] **Step 3: Add npm script to `package.json`**

In the `"scripts"` section of `package.json`, add:

```json
"generate:part7-images": "node scripts/generate-part7-images.js"
```

- [ ] **Step 4: Run the script to generate the 6 pilot images**

```bash
OPENAI_API_KEY=sk-... npm run generate:part7-images
```

Expected output:
```
  gen   cafe-rain_p1.webp — "a boy leaves home on his bicycle on a sunny morning"
  saved cafe-rain_p1.webp
  gen   cafe-rain_p2.webp — "it starts raining and the boy shelters at a bus stop with a friend"
  saved cafe-rain_p2.webp
  gen   cafe-rain_p3.webp — "the two friends sit together in a café eating cakes and laughing"
  saved cafe-rain_p3.webp
  gen   lost-dog_p1.webp — "a boy finds a lost dog wandering alone in a park"
  saved lost-dog_p1.webp
  gen   lost-dog_p2.webp — "the boy notices a lost dog poster on the street"
  saved lost-dog_p2.webp
  gen   lost-dog_p3.webp — "the boy returns the dog to its happy owner in a garden"
  saved lost-dog_p3.webp

Done: 6 generated, 0 skipped.
```

Verify files exist and are valid WebP:
```bash
ls -lh public/images/part7/
file public/images/part7/*.webp
```

Expected: 6 files, each reported as `Web/P image data`.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-part7-images.js package.json package-lock.json public/images/part7/
git commit -m "feat: add DALL-E 3 image generation script, generate 6 pilot Part 7 images"
```

---

### Task 5: Update `Part7Writing` component to horizontal image strip

**Files:**
- Modify: `src/components/parts/WritingPart.tsx:77-103`

**Interfaces:**
- Consumes: `PicCard { label: string; text: string; image: string }` from Task 1
- Consumes: `Part7Prompt.pics` with `image` fields from Task 2
- Consumes: `public/images/part7/*.webp` generated by Task 4

- [ ] **Step 1: Replace `Part7Writing` in `src/components/parts/WritingPart.tsx`**

Replace lines 77–103 (the entire `Part7Writing` function) with:

```tsx
export function Part7Writing({ prompt, value, review, onChange }: Part7Props) {
  const count = wc(value)
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <div style={{ font: "500 15px/1.5 'Libre Franklin'", color: 'var(--ink)', marginBottom: 13 }}>{prompt.intro}</div>
        <div
          data-testid="part7-image-strip"
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 4,
          }}
        >
          {prompt.pics.map((pic, i) => (
            <div
              key={i}
              style={{
                flex: '0 0 260px',
                borderRadius: 12,
                overflow: 'hidden',
                position: 'relative',
                scrollSnapAlign: 'start',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              }}
            >
              <img
                src={pic.image}
                alt={pic.text}
                style={{ display: 'block', width: '100%', aspectRatio: '1 / 1', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                background: 'rgba(0,0,0,0.55)',
                color: '#fff',
                borderRadius: 6,
                padding: '3px 8px',
                font: "700 11px 'Libre Franklin'",
                letterSpacing: '0.05em',
              }}>
                {pic.label}
              </div>
            </div>
          ))}
        </div>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        readOnly={review}
        placeholder="Write your answer here..."
        aria-label="Part 7 writing answer"
        style={textareaStyle(review)}
      />
      <WordCountIndicator count={count} min={prompt.minWords} />
    </>
  )
}
```

- [ ] **Step 2: Verify TypeScript and build**

```bash
npm run build
```

Expected: success, no type errors.

- [ ] **Step 3: Verify in browser with Playwright**

Make sure the dev server is running (`npm run dev`), then run this Node script:

```js
// verify-part7.js  (run with: node verify-part7.js)
const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  await page.goto('http://localhost:5173/mocktest/')

  // Inject a pre-assembled AppState directly into localStorage so we land
  // on Part 7 without clicking through all previous parts.
  const state = {
    step: 7,
    started: true,
    submitted: false,
    review: false,
    secondsLeft: 3540,
    answers: {},
    text: {},
    writing: { 6: '', 7: '' },
    name: 'Tester',
    activeTest: {
      part1: [],
      part2: { people: [], questions: [] },
      part3: { title: '', paragraphs: [], questions: [] },
      part4: { title: '', paragraphs: [], questions: [] },
      part5: { title: '', paragraphs: [], gaps: [] },
      part6: { intro: '', bullets: ['', '', ''], minWords: 25 },
      part7: {
        intro: 'Look at the three pictures. Write the story shown in the pictures.',
        pics: [
          { label: 'Picture 1', text: 'a boy leaves home on his bicycle on a sunny morning',             image: 'images/part7/cafe-rain_p1.webp' },
          { label: 'Picture 2', text: 'it starts raining and the boy shelters at a bus stop with a friend', image: 'images/part7/cafe-rain_p2.webp' },
          { label: 'Picture 3', text: 'the two friends sit together in a café eating cakes and laughing',  image: 'images/part7/cafe-rain_p3.webp' },
        ],
        minWords: 35,
      },
    },
    loadError: null,
  }

  await page.evaluate((s) => localStorage.setItem('a2key_v2', JSON.stringify(s)), state)
  await page.reload()

  // Verify the image strip is present
  const strip = await page.waitForSelector('[data-testid="part7-image-strip"]', { timeout: 5000 })
  console.assert(strip !== null, 'Image strip not found')

  // Verify 3 images are rendered
  const imgs = await page.$$('[data-testid="part7-image-strip"] img')
  console.assert(imgs.length === 3, `Expected 3 images, got ${imgs.length}`)

  // Verify first image src points to the correct file
  const src = await imgs[0].getAttribute('src')
  console.assert(src === 'images/part7/cafe-rain_p1.webp', `Unexpected src: ${src}`)

  // Verify alt text is set
  const alt = await imgs[0].getAttribute('alt')
  console.assert(alt === 'a boy leaves home on his bicycle on a sunny morning', `Unexpected alt: ${alt}`)

  // Verify "Picture 1" label overlay is visible
  const labels = await page.$$eval(
    '[data-testid="part7-image-strip"] div[style*="position: absolute"]',
    els => els.map(el => el.textContent)
  )
  console.assert(labels.includes('Picture 1'), `Labels: ${JSON.stringify(labels)}`)

  console.log('✓ All Part 7 image strip checks passed')
  await browser.close()
})()
```

Run it:
```bash
node verify-part7.js
```

Expected:
```
✓ All Part 7 image strip checks passed
```

Visually confirm in the opened browser window:
- 3 cartoon image cards visible, ~1.5 cards wide on screen
- "Picture 1 / 2 / 3" pill label overlaid at bottom-left of each card
- Horizontal swipe scrolls to Picture 2 and 3 with snap
- Textarea and word count appear below the strip

- [ ] **Step 4: Commit**

```bash
git add src/components/parts/WritingPart.tsx
git commit -m "feat: Part 7 horizontal illustrated image strip with scroll-snap"
```
