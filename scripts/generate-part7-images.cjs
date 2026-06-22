#!/usr/bin/env node
// Generates Part 7 panel illustrations using the OpenAI Responses API (gpt-4o + image_generation tool).
// Character consistency across panels is maintained through rich per-panel text prompts
// (named characters with physical descriptions + setting/scene/emotion fields).
//
// Usage:
//   OPENAI_API_KEY=sk-... npm run generate:part7-images
//   OPENAI_API_KEY=sk-... npm run generate:part7-images -- --dry-run   (print prompts only)
//   OPENAI_API_KEY=sk-... npm run generate:part7-images -- --story 0   (one story by index)
//
// Idempotent at panel level: skips panels whose .webp files already exist.
// To regenerate: delete the relevant .webp file(s), then re-run.

'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const BANK_PATH = 'public/questions/schools/part7.json';
const OUT_DIR = 'public/images/part7';
const DRY_RUN = process.argv.includes('--dry-run');
const STORY_ARG = process.argv.indexOf('--story');
const STORY_FILTER = STORY_ARG !== -1 ? parseInt(process.argv[STORY_ARG + 1], 10) : null;

const STYLE_PREFIX =
  "B&W pencil sketch illustration, simple children's book line drawing style. " +
  'Clean outline only, no colour, no shading, no gradients. Pure white background. ' +
  'Square composition. No speech bubbles, no labels, no captions.';

function buildPanelPrompt(characters, storyPrompt, pic, panelNum, totalPanels) {
  const charList = characters.map(c => `- ${c.name}: ${c.description}.`).join('\n');
  const absentBlock = (pic.absent && pic.absent.length > 0)
    ? `\nCHARACTERS NOT IN THIS PANEL (do NOT draw them): ${pic.absent.join(', ')}.`
    : '';
  return [
    STYLE_PREFIX,
    `STORY CONTEXT: ${storyPrompt.storyArc}`,
    `CHARACTERS IN THIS STORY:\n${charList}${absentBlock}`,
    `PANEL ${panelNum} OF ${totalPanels} — Setting: ${pic.setting}. ` +
      `Background shows: ${pic.background}. ` +
      `${pic.scene}, filling most of the frame. ` +
      `Background is simple but clearly shows the location. ` +
      `The characters' faces clearly show ${pic.emotion}.`,
  ].join('\n\n');
}

async function generateB64(prompt) {
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      input: prompt,
      tools: [{ type: 'image_generation', quality: 'high', size: '1024x1024' }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${body}`);
  }
  const data = await res.json();
  const imageCall = data.output.find(o => o.type === 'image_generation_call');
  if (!imageCall) throw new Error('No image_generation_call in response');
  return imageCall.result;
}

async function main() {
  if (!DRY_RUN && !process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }

  const bank = JSON.parse(fs.readFileSync(BANK_PATH, 'utf8'));
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let generated = 0;
  let skipped = 0;

  const prompts = STORY_FILTER !== null ? [bank.prompts[STORY_FILTER]] : bank.prompts;

  for (const prompt of prompts) {
    const panelPaths = prompt.pics.map(pic =>
      path.join(OUT_DIR, path.basename(pic.image))
    );
    const allExist = panelPaths.every(p => fs.existsSync(p));
    const slug = path.basename(panelPaths[0]).replace(/_p\d+\.webp$/, '');

    if (allExist) {
      console.log(`skip  ${slug} (all panels present)`);
      skipped++;
      continue;
    }

    console.log(`\nstory: ${slug}`);
    console.log(`chars: ${prompt.characters.map(c => c.name).join(', ')}`);

    for (let i = 0; i < prompt.pics.length; i++) {
      const pic = prompt.pics[i];
      const destPath = panelPaths[i];

      if (fs.existsSync(destPath)) {
        console.log(`  skip  ${path.basename(destPath)} (already exists)`);
        skipped++;
        continue;
      }

      const panelPrompt = buildPanelPrompt(prompt.characters, prompt, pic, i + 1, prompt.pics.length);

      console.log(`\n  panel ${i + 1}: ${pic.text}`);

      if (DRY_RUN) {
        console.log('\n--- PROMPT ---');
        console.log(panelPrompt);
        console.log('--- END ---\n');
        continue;
      }

      const b64 = await generateB64(panelPrompt);
      const pngBuffer = Buffer.from(b64, 'base64');
      const webpBuffer = await sharp(pngBuffer).webp({ quality: 85 }).toBuffer();
      fs.writeFileSync(destPath, webpBuffer);
      console.log(`  saved ${path.basename(destPath)}`);
      generated++;
    }
  }

  if (!DRY_RUN) {
    console.log(`\nDone: ${generated} generated, ${skipped} skipped.`);
  }
}

main().catch(err => { console.error(err.message); process.exit(1); });
