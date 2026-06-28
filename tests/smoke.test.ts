import { test, expect } from 'playwright/test'

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 900 })
  page.on('dialog', dialog => dialog.accept())
  await page.goto('/')
  await page.evaluate(() => localStorage.removeItem('a2key_v3'))
  await page.reload()
})

test('intro screen loads', async ({ page }) => {
  await expect(page.getByText('Reading and Writing')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start test' })).toBeVisible()
})

test('start test lands on Part 1', async ({ page }) => {
  await page.getByRole('button', { name: 'Start test' }).click()
  await expect(page.getByText('Part 1 of 7')).toBeVisible({ timeout: 10_000 })
})

test('navigate forward through all 7 parts', async ({ page }) => {
  await page.getByRole('button', { name: 'Start test' }).click()
  await expect(page.getByText('Part 1 of 7')).toBeVisible({ timeout: 10_000 })

  for (let part = 1; part < 7; part++) {
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await expect(page.getByText(`Part ${part + 1} of 7`)).toBeVisible()
  }
})

test('navigate back from Part 3 to Part 2', async ({ page }) => {
  await page.getByRole('button', { name: 'Start test' }).click()
  await expect(page.getByText('Part 1 of 7')).toBeVisible({ timeout: 10_000 })

  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByText('Part 2 of 7')).toBeVisible()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByText('Part 3 of 7')).toBeVisible()

  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(page.getByText('Part 2 of 7')).toBeVisible()
})

test('submit test and see results screen', async ({ page }) => {
  await page.getByRole('button', { name: 'Start test' }).click()
  await expect(page.getByText('Part 1 of 7')).toBeVisible({ timeout: 10_000 })

  for (let part = 1; part < 7; part++) {
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await expect(page.getByText(`Part ${part + 1} of 7`)).toBeVisible()
  }

  // Two-click submit confirmation
  await page.getByRole('button', { name: 'Submit' }).click()
  await page.getByRole('button', { name: 'Confirm submission' }).click()

  await expect(page.getByText('Your results')).toBeVisible()
})

test('results screen shows action buttons', async ({ page }) => {
  await page.getByRole('button', { name: 'Start test' }).click()
  await expect(page.getByText('Part 1 of 7')).toBeVisible({ timeout: 10_000 })
  for (let part = 1; part < 7; part++) {
    await page.getByRole('button', { name: 'Next', exact: true }).click()
  }
  await page.getByRole('button', { name: 'Submit' }).click()
  await page.getByRole('button', { name: 'Confirm submission' }).click()
  await expect(page.getByText('Your results')).toBeVisible()

  await expect(page.getByRole('button', { name: 'Review answers' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible()
})

test('review mode navigates all 7 parts and returns to results', async ({ page }) => {
  await page.getByRole('button', { name: 'Start test' }).click()
  await expect(page.getByText('Part 1 of 7')).toBeVisible({ timeout: 10_000 })
  for (let part = 1; part < 7; part++) {
    await page.getByRole('button', { name: 'Next', exact: true }).click()
  }
  await page.getByRole('button', { name: 'Submit' }).click()
  await page.getByRole('button', { name: 'Confirm submission' }).click()
  await expect(page.getByText('Your results')).toBeVisible()

  await page.getByRole('button', { name: 'Review answers' }).click()
  await expect(page.getByText('Reviewing · Part 1 of 7')).toBeVisible()

  for (let part = 1; part < 7; part++) {
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await expect(page.getByText(`Reviewing · Part ${part + 1} of 7`)).toBeVisible()
  }

  await page.getByRole('button', { name: 'Results' }).click()
  await expect(page.getByText('Your results')).toBeVisible()
})


test('timer is visible during test', async ({ page }) => {
  await page.getByRole('button', { name: 'Start test' }).click()
  await expect(page.getByText('Part 1 of 7')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('timer')).toBeVisible()
})

test('no Back button on Part 1', async ({ page }) => {
  await page.getByRole('button', { name: 'Start test' }).click()
  await expect(page.getByText('Part 1 of 7')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('button', { name: 'Back', exact: true })).not.toBeVisible()
})

test('selecting an answer updates localStorage', async ({ page }) => {
  await page.getByRole('button', { name: 'Start test' }).click()
  await expect(page.getByText('Part 1 of 7')).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: /^A/ }).first().click()
  const stored = await page.evaluate(() => localStorage.getItem('a2key_v3'))
  const state = JSON.parse(stored!)
  expect(Object.keys(state.answers).length).toBeGreaterThan(0)
})

test('mid-test reload restores current part', async ({ page }) => {
  await page.getByRole('button', { name: 'Start test' }).click()
  await expect(page.getByText('Part 1 of 7')).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByText('Part 2 of 7')).toBeVisible()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByText('Part 3 of 7')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Part 3 of 7')).toBeVisible()
})

test('typing in a Part 5 gap updates localStorage', async ({ page }) => {
  await page.getByRole('button', { name: 'Start test' }).click()
  await expect(page.getByText('Part 1 of 7')).toBeVisible({ timeout: 10_000 })
  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: 'Next', exact: true }).click()
  }
  await expect(page.getByText('Part 5 of 7')).toBeVisible()
  await page.getByRole('textbox').first().fill('the')
  const stored = await page.evaluate(() => localStorage.getItem('a2key_v3'))
  const state = JSON.parse(stored!)
  expect(state.text[0]).toBe('the')
})

test('results screen shows a score', async ({ page }) => {
  await page.getByRole('button', { name: 'Start test' }).click()
  await expect(page.getByText('Part 1 of 7')).toBeVisible({ timeout: 10_000 })
  for (let part = 1; part < 7; part++) {
    await page.getByRole('button', { name: 'Next', exact: true }).click()
  }
  await page.getByRole('button', { name: 'Submit' }).click()
  await page.getByRole('button', { name: 'Confirm submission' }).click()
  await expect(page.getByText('Your results')).toBeVisible()
  await expect(page.locator('text=/\\d+%/')).toBeVisible()
})

// ── Part 7 image strip ──────────────────────────────────────────────────────

async function goToPart7(page: import('playwright/test').Page) {
  await page.getByRole('button', { name: 'Start test' }).click()
  await expect(page.getByText('Part 1 of 7')).toBeVisible({ timeout: 10_000 })
  for (let i = 0; i < 6; i++) {
    await page.getByRole('button', { name: 'Next', exact: true }).click()
  }
  await expect(page.getByText('Part 7 of 7')).toBeVisible()
}

test('Part 7 shows image strip with 3 panels', async ({ page }) => {
  await goToPart7(page)
  const strip = page.getByTestId('part7-image-strip')
  await expect(strip).toBeVisible()
  await expect(strip.locator('img')).toHaveCount(3)
})

test('Part 7 images load successfully (no fallback text)', async ({ page }) => {
  await goToPart7(page)
  const strip = page.getByTestId('part7-image-strip')

  // Wait for all 3 images to finish loading
  await strip.locator('img').nth(0).waitFor()
  await strip.locator('img').nth(1).waitFor()
  await strip.locator('img').nth(2).waitFor()

  // Each img should have loaded (naturalWidth > 0 means the file was fetched)
  const naturalWidths = await strip.locator('img').evaluateAll(
    imgs => imgs.map(img => (img as HTMLImageElement).naturalWidth)
  )
  for (const w of naturalWidths) {
    expect(w).toBeGreaterThan(0)
  }
})

test('Part 7 panel labels are visible', async ({ page }) => {
  await goToPart7(page)
  const strip = page.getByTestId('part7-image-strip')
  await expect(strip.getByText('Picture 1')).toBeVisible()
  await expect(strip.getByText('Picture 2')).toBeVisible()
  await expect(strip.getByText('Picture 3')).toBeVisible()
})
