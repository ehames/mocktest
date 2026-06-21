# Part 7 Image Generation Script — Redesign

**Date:** 2026-06-21
**Status:** Approved

## Problem

The existing `scripts/generate-part7-images.cjs` has two issues:

1. **Prompt quality:** uses "minimal background detail" which produces panels with no situational context. The refined prompt adds explicit `setting` and `background` fields so illustrations clearly show where the scene takes place.
2. **No panel-to-panel context:** each panel is generated as an independent stateless call, so character appearance can drift between panels. The OpenAI Responses API multi-turn (`previous_response_id`) replicates the visual context chaining that ChatGPT applies naturally.

Additionally, the PNG → grayscale → potrace → SVG pipeline adds unnecessary complexity and loses pencil-sketch detail. WebP output from gpt-image-1 directly preserves quality.

---

## JSON Schema — `public/questions/schools/part7.json`

### Changes

| Before | After |
|---|---|
| `character` (single string) | `characters` (array of `{name, description}`) |
| `pics[].text` — full scene sentence | `pics[].text` — kept as keyword string (app display + alt text) |
| *(no per-panel generation fields)* | `pics[].setting`, `pics[].background`, `pics[].scene`, `pics[].emotion` |
| `pics[].image` — `.svg` path | `pics[].image` — `.webp` path |

The app reads only `intro`, `pics[].label`, `pics[].text`, `pics[].image`. All generation fields are silently ignored.

### Example entry

```json
{
  "intro": "Look at the three pictures. Write the story shown in the pictures.",
  "characters": [
    { "name": "Emma", "description": "a girl of about 12, long straight hair, striped t-shirt and jeans" },
    { "name": "Tom",  "description": "a boy of about 12, short curly hair, plain hoodie" }
  ],
  "pics": [
    {
      "label": "Picture 1",
      "text": "bike / house / sunny",
      "setting": "outside a house on a sunny residential street",
      "background": "house facade with front door, garden path, bright sun in the sky",
      "scene": "Emma stands with her bicycle in the foreground",
      "emotion": "happy and excited",
      "image": "images/part7/cafe-rain_p1.webp"
    },
    {
      "label": "Picture 2",
      "text": "rain / bus stop / friend",
      "setting": "a rainy street with a bus stop",
      "background": "bus stop shelter, street lamp, falling rain",
      "scene": "Emma and Tom stand together at the bus stop",
      "emotion": "Emma surprised, Tom smiling",
      "image": "images/part7/cafe-rain_p2.webp"
    },
    {
      "label": "Picture 3",
      "text": "cafe / cakes / happy",
      "setting": "inside a café",
      "background": "café counter, window, simple wall",
      "scene": "Emma and Tom sit at a small table with cups and a plate of cakes",
      "emotion": "both laughing and happy",
      "image": "images/part7/cafe-rain_p3.webp"
    }
  ],
  "minWords": 35
}
```

---

## Image Generation Prompt

The script assembles each panel prompt from hardcoded style constants and story-specific JSON fields:

```
B&W pencil sketch illustration, simple children's book line drawing style. Clean outline
only, no colour, no shading, no gradients. Pure white background. Square composition.
No text, no speech bubbles, no labels, no captions.

CHARACTERS IN THIS STORY:
- Emma: a girl of about 12, long straight hair, striped t-shirt and jeans.
- Tom: a boy of about 12, short curly hair, plain hoodie.

PANEL 1 OF 3 — Setting: outside a house on a sunny residential street. Background shows:
house facade with front door, garden path, bright sun in the sky. Emma stands with her
bicycle in the foreground and fills most of the frame. Background is simple but clearly
shows the location. The characters' faces clearly show happy and excited.
```

The character block is identical in every panel prompt — this is what anchors visual consistency when the Responses API multi-turn chain is unavailable (e.g. first panel).

---

## Script Architecture

**File:** `scripts/generate-part7-images.cjs`  
**Run:** `OPENAI_API_KEY=sk-... npm run generate:part7-images`

### Dependencies

| Package | Change | Purpose |
|---|---|---|
| `openai` | **add** | Responses API client |
| `sharp` | keep | PNG → WebP conversion |
| `potrace` | **remove** | No longer needed |

### Generation flow (per story)

1. Check if all 3 panel `.webp` files already exist → skip entire story if yes
2. Panel 1: `client.responses.create({ model: 'gpt-4o', tools: [{ type: 'image_generation' }], input: prompt1 })`
3. Panel 2: same, plus `previous_response_id: resp1.id`
4. Panel 3: same, plus `previous_response_id: resp2.id`
5. Each response yields a base64 PNG → `sharp().webp({ quality: 85 })` → save to `public/images/part7/`

### Idempotency

At the **story level**: either all three panels are generated in sequence (preserving the multi-turn chain) or all are skipped. Partial regeneration is not supported — if panel 1 were skipped but panels 2–3 were not, there would be no `previous_response_id` to carry context forward.

### Parallelism

Stories are processed **sequentially**. Panels within a story are also sequential (required by multi-turn). This keeps API usage predictable and avoids rate-limit errors.

---

## Migration

The two existing pilot stories (`cafe-rain`, `lost-dog`) are updated in `schools/part7.json` to:
- Use the new `characters[]` schema
- Add `setting`, `background`, `scene`, `emotion` per panel
- Point `image` paths to `.webp` instead of `.svg`

Running the script regenerates them as WebP. The old `.svg` files in `public/images/part7/` are deleted.

---

## Workflow — Adding New Stories

1. Append a new entry to `schools/part7.json` (intro, characters[], 3 pics with all fields, minWords). Choose a slug (e.g. `birthday-cake`) → image paths become `images/part7/birthday-cake_p{1,2,3}.webp`.
2. Run `OPENAI_API_KEY=sk-... npm run generate:part7-images` — skips existing stories, generates only the new one.
3. Commit the JSON entry + the 3 new WebP files.

---

## Out of Scope

- `public/questions/general/part7.json` — text-only bank, not processed by this script
- Parallel story generation (future optimisation if bank grows large)
- Automatic story definition generation from keywords via LLM
