# A2 Key Mock Test

Cambridge A2 Key Reading & Writing practice test. Mobile-first web app deployed to GitHub Pages.

## Stack

- **Vite + React 18 + TypeScript** — `npm run dev` to start, `npm run build` to build
- **Tailwind CSS v4** via `@tailwindcss/vite` — utility classes + CSS variables in `src/index.css`
- **vite-plugin-pwa** — offline support, service worker auto-updates
- **GitHub Pages** — deployed via `.github/workflows/deploy.yml` on push to `main`; base path `/a2-mocktest/`

## Architecture

```
src/
  App.tsx          # Root: useReducer + localStorage sync + bank loading
  reducer.ts       # Pure reducer for all state transitions
  types.ts         # All TypeScript types (AppState, bank schemas, Action union)
  constants.ts     # Non-question constants: part metadata, band thresholds, LS_KEY
  loadBanks.ts     # Fetches all 7 JSON banks in parallel, assembles ActiveTest
  scoring.ts       # computeResults(), wc() — pure functions, no side effects
  hooks/
    useTimer.ts    # setInterval countdown; stable via ref
  components/
    IntroScreen    # Name input, info card, "Start test" button
    TestScreen     # Shared chrome (header/body/footer); delegates to part components
    ResultsScreen  # Score ring, per-part bars, writing review, actions
    parts/
      ShortMC      # Part 1 — 6 independent short-text MC items
      MatchingPart # Part 2 — 3 person cards + 7 matching questions
      PassageMC    # Part 3 — passage + 5 MC questions
      ClozeMC      # Part 4 — MC-cloze passage + 6 inline chip questions
      OpenCloze    # Part 5 — open-cloze passage + 6 text inputs
      WritingPart  # Parts 6 & 7 — guided writing / story writing
    ui/
      OptionRow    # A/B/C button in 3 variants: row | inline | letter
      TimerPill    # MM:SS display; turns red at ≤ 5:00
      ProgressBar  # Step/7 progress under header
```

## State shape

```ts
{
  step: 0–8,        // 0=intro, 1–7=parts, 8=results
  started,          // timer runs only when true
  submitted,        // locks inputs
  review,           // read-only marking mode
  secondsLeft,      // countdown in seconds
  answers,          // Record<qIndex, optionIndex> for Parts 1–4
  text,             // Record<gapIndex, string> for Part 5
  writing,          // { 6: string, 7: string }
  name,
  activeTest,       // assembled from banks on "Start test"
  loadError,        // shown on intro if bank fetch fails
}
```

State is persisted to `localStorage` key `a2key_v1` on every dispatch. Restored on mount — students can reload mid-test and resume with timer intact.

## Question banks

`public/questions/` — one JSON file per part, fetched in parallel on "Start test":

| File | Contents | Selection |
|---|---|---|
| `part1.json` | `{ items: Part1Item[] }` | Shuffle, take 6 |
| `part2.json` | `{ sets: Part2Set[] }` | Pick 1 random set |
| `part3.json` | `{ sets: Part3Set[] }` | Pick 1 random set |
| `part4.json` | `{ sets: Part4Set[] }` | Pick 1 random set |
| `part5.json` | `{ sets: Part5Set[] }` | Pick 1 random set |
| `part6.json` | `{ prompts: Part6Prompt[] }` | Pick 1 random prompt |
| `part7.json` | `{ prompts: Part7Prompt[] }` | Pick 1 random prompt, never the same as the previous run |

To add questions: append to the relevant JSON array and deploy. No code changes needed.

Part 1 items are self-contained (each has its own answer key inline). Parts 2–5 sets include answer keys / accepted words inline. See `src/types.ts` for the full schema.

## Question indexing (scoring)

| Part | qIndex range | Notes |
|---|---|---|
| Part 1 | 0–5 | 6 items picked from bank |
| Part 2 | 6–12 | 7 matching questions |
| Part 3 | 13–17 | 5 passage questions |
| Part 4 | 18–23 | 6 MC-cloze questions |
| Part 5 | gapIndex 0–5 | stored in `text`, not `answers` |

## Design tokens

Defined as CSS variables in `src/index.css`:

| Token | Value | Use |
|---|---|---|
| `--navy` | `#0B2447` | Headers, primary buttons, badges |
| `--ink` | `#16263D` | Body text |
| `--muted` | `#5B6B7F` | Secondary labels |
| `--page-bg` | `#EEF1F5` | Phone screen background |
| `--accent` | `#5B9BD5` | Progress bar, score ring, bars |
| `--green` / `--green-bg` | `#2E7D32` / `#EAF6EE` | Correct answers in review |
| `--red` / `--red-bg` | `#C62828` / `#FCEDED` | Wrong answers in review |
| `--outer-bg` | `#15263b` | Letterbox behind phone column |

Fonts: `Libre Franklin` (UI), `Source Serif 4` (passages and writing). Both loaded from Google Fonts in `index.html`.

## Image generation (Part 7)

Part 7 images live in `public/images/part7/` as 512×512 WebP files. Generated offline via:

```bash
npm run generate:part7-images -- [options]
```

| Flag | Values | Default |
|---|---|---|
| `--engine` | `openai` \| `imagen` | `openai` |
| `--quality` | `low` \| `med` \| `high` | `high` |
| `--story N` | 0-based index | all stories |
| `--panel N` | 1-indexed panel | all panels |
| `--dry-run` | — | off |

**OpenAI** (`OPENAI_API_KEY`): uses `gpt-5.5` + `image_generation` tool; panels chained via `previous_response_id` for character consistency. Writes `{slug}_meta.json` sidecars to store response IDs.

**Imagen** (`GOOGLE_API_KEY`): uses Gemini `generateContent` API; panels generated independently. Quality map: `low` → `gemini-2.5-flash-image`, `med` → `nano-banana-pro-preview`, `high` → `gemini-3-pro-image`.

Prompt building and helpers live in `scripts/part7-helpers.cjs`. Tests: `npm run test:script`.

## Browser testing (Playwright)

Playwright + Chromium are included as devDependencies for verifying UI flows.

```bash
npm run test:install   # download Chromium (first time / fresh clone)
```

Then drive the app via Node scripts using `const { chromium } = require('playwright')`.
The dev server must be running (`npm run dev`) before launching Playwright scripts.

## Deploy

Push to `main` → GitHub Actions builds and deploys to `gh-pages` branch automatically.
Live URL: `https://ehames.github.io/a2-mocktest/`

To deploy manually: `npm run build` then push `dist/` to `gh-pages`.
