#!/usr/bin/env node
// Generates Part 7 panel illustrations using the OpenAI Responses API.
// Sequential multi-turn generation (previous_response_id) maintains character
// appearance across panels of the same story.
//
// Usage:
//   OPENAI_API_KEY=sk-... npm run generate:part7-images
//   node scripts/generate-part7-images.cjs --dry-run   (prints prompts, no API calls)
//
// Idempotent at story level: skips stories where all panel .webp files exist.
// To regenerate: delete the panel files, then re-run.

'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { OpenAI } = require('openai');

const BANK_PATH = 'public/questions/schools/part7.json';
const OUT_DIR = 'public/images/part7';
const DRY_RUN = process.argv.includes('--dry-run');

const STYLE_PREFIX =
  "B&W pencil sketch illustration, simple children's book line drawing style. " +
  'Clean outline only, no colour, no shading, no gradients. Pure white background. ' +
  'Square composition. No text, no speech bubbles, no labels, no captions.';

function buildPanelPrompt(characters, pic, panelNum, totalPanels) {
  const charList = characters.map(c => `- ${c.name}: ${c.description}.`).join('\n');
  return [
    STYLE_PREFIX,
    `CHARACTERS IN THIS STORY:\n${charList}`,
    `PANEL ${panelNum} OF ${totalPanels} — Setting: ${pic.setting}. ` +
      `Background shows: ${pic.background}. ` +
      `${pic.scene} and fills most of the frame. ` +
      `Background is simple but clearly shows the location. ` +
      `The characters' faces clearly show ${pic.emotion}.`,
  ].join('\n\n');
}

async function main() {
  if (!DRY_RUN && !process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }

  const bank = JSON.parse(fs.readFileSync(BANK_PATH, 'utf8'));
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const client = DRY_RUN ? null : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let generated = 0;
  let skipped = 0;

  for (const prompt of bank.prompts) {
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

    let previousResponseId = null;

    for (let i = 0; i < prompt.pics.length; i++) {
      const pic = prompt.pics[i];
      const destPath = panelPaths[i];
      const panelPrompt = buildPanelPrompt(prompt.characters, pic, i + 1, prompt.pics.length);

      console.log(`\n  panel ${i + 1}: ${pic.text}`);

      if (DRY_RUN) {
        console.log('\n--- PROMPT ---');
        console.log(panelPrompt);
        console.log('--- END ---\n');
        continue;
      }

      const params = {
        model: 'gpt-4o',
        tools: [{ type: 'image_generation', quality: 'low', size: '1024x1024' }],
        input: panelPrompt,
      };
      if (previousResponseId) params.previous_response_id = previousResponseId;

      const response = await client.responses.create(params);
      previousResponseId = response.id;

      const imageCall = response.output.find(o => o.type === 'image_generation_call');
      if (!imageCall) throw new Error(`No image_generation_call in response for panel ${i + 1}`);

      const pngBuffer = Buffer.from(imageCall.result, 'base64');
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
