# Part 7 Illustrated Prompts

**Date:** 2026-06-20  
**Status:** Approved

## Problem

The current Part 7 "picture" format renders three small text cards with slash-separated keywords (e.g. `bike / house / sunny`). This is abstract and disengaging for the teen audience the app targets. The real Cambridge A2 Key test shows three hand-drawn cartoon panels; students write a story from those visuals.

## Goal

Replace the text-keyword cards with flat-cartoon illustrations displayed as a horizontally swipeable strip, starting with a 2-prompt pilot and growing the bank over time.

---

## Image Assets

**Format:** WebP, 512×512px square  
**Location:** `public/images/part7/`  
**Naming:** `{prompt-slug}_p{1|2|3}.webp`

**Pilot images (6 total):**
```
public/images/part7/
  cafe-rain_p1.webp    ← "bike / house / sunny"
  cafe-rain_p2.webp    ← "rain / bus stop / friend"
  cafe-rain_p3.webp    ← "cafe / cakes / happy"
  lost-dog_p1.webp     ← "park / dog / lost"
  lost-dog_p2.webp     ← "street / poster / worried"
  lost-dog_p3.webp     ← "garden / dog / relieved"
```

**AI generation prompt template:**
```
Flat cartoon illustration. Clean vector style, bold outlines, bright saturated colors,
simple expressive characters, no text or UI elements. Square format.
Scene: [one-sentence description derived from pic keywords].
```

---

## Data Schema

### `part7.json`

The existing 80+ text-only prompts are replaced. The file starts with 2 pilot prompts and grows as art is generated. The old file is archived as `part7-text-archive.json` (not loaded by the app).

```json
{
  "prompts": [
    {
      "intro": "Look at the three pictures. Write the story shown in the pictures.",
      "pics": [
        { "label": "Picture 1", "text": "bike / house / sunny",    "image": "images/part7/cafe-rain_p1.webp" },
        { "label": "Picture 2", "text": "rain / bus stop / friend", "image": "images/part7/cafe-rain_p2.webp" },
        { "label": "Picture 3", "text": "cafe / cakes / happy",    "image": "images/part7/cafe-rain_p3.webp" }
      ],
      "minWords": 35
    },
    {
      "intro": "Look at the three pictures. Write the story shown in the pictures.",
      "pics": [
        { "label": "Picture 1", "text": "park / dog / lost",       "image": "images/part7/lost-dog_p1.webp" },
        { "label": "Picture 2", "text": "street / poster / worried","image": "images/part7/lost-dog_p2.webp" },
        { "label": "Picture 3", "text": "garden / dog / relieved", "image": "images/part7/lost-dog_p3.webp" }
      ],
      "minWords": 35
    }
  ]
}
```

### TypeScript — `types.ts`

`Part7Pic` gains a required `image` field:

```ts
// before
interface Part7Pic { label: string; text: string }

// after
interface Part7Pic { label: string; text: string; image: string }
```

`image` is a root-relative path (e.g. `"images/part7/cafe-rain_p1.webp"`). In the component, `<img src={pic.image}>` resolves correctly from both `localhost:5173/` (dev) and `github.io/mocktest/` (production) because the SPA always loads from its base path. The Workbox runtime caching regex `/\/images\/part7\//` matches the full production URL correctly.

`image` is required — no text-only fallback path since the bank is fully illustrated.

The `text` field is kept as the `alt` attribute on the `<img>` element for accessibility and screen-reader support.

---

## Component UI

`Part7Writing` in `WritingPart.tsx` replaces the current 3-card keyword row with a horizontally scrollable image strip.

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │              │  │              │  │            │ │
│  │   [image]    │  │   [image]    │  │  [image]   │ │
│  │              │  │              │  │            │ │
│  │ Picture 1 ▌  │  │ Picture 2 ▌  │  │ Picture 3 ▌│ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────┘
                                              ← swipe
```

- **Card width:** ~260px; ~1.5 cards visible at once on a 390px phone — partial card signals swipability
- **Image:** fills card with `object-fit: cover`; `alt` = `pic.text`
- **Label pill:** "Picture N" overlay at bottom-left, small semi-transparent dark background, white text — consistent with existing badge style
- **Scroll behavior:** `overflow-x: auto`, `scroll-snap-type: x mandatory`, each card is a snap point; `-webkit-overflow-scrolling: touch` for momentum on iOS

---

## PWA Caching

**Strategy:** Workbox `CacheFirst` runtime caching for `images/part7/`. Images are **not** added to the precache manifest — first-time access fetches from network and caches; subsequent access (online or offline) is served from cache.

Addition to `vite.config.ts`:

```ts
runtimeCaching: [
  {
    urlPattern: /\/images\/part7\//,
    handler: 'CacheFirst',
    options: {
      cacheName: 'part7-images',
      expiration: { maxEntries: 500 },
    },
  },
]
```

`maxEntries: 500` provides headroom for ~166 illustrated prompts (3 images each). No time-based expiration — images are static and only change when the filename changes.

---

## Developer Workflow (adding new prompts)

1. Write 3 scene descriptions from the existing `text` keywords
2. Generate 3 WebP images using the AI prompt template above
3. Drop images into `public/images/part7/`
4. Append prompt entry to `part7.json`
5. Push to `main` → CI builds → images included in `dist/` → runtime caching picks them up on next user visit

---

## localStorage Migration

`LS_KEY` in `constants.ts` is bumped from `a2key_v1` to `a2key_v2`. This clears any saved `activeTest` that contains old text-only `Part7Prompt` objects (which lack the `image` field), preventing broken image renders for returning users. Students lose any in-progress test session on first load after the upgrade — acceptable given the schema change.

---

## Out of Scope

- Loading skeleton / placeholder while image fetches (first-time online load is fast at ~30–60 KB per image; add if real-world testing shows it's needed)
- Explicit "Download for offline" button (future enhancement if students report offline-before-first-use issues)
- Illustrated prompts for Parts 1–6
