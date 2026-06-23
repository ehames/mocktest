import type { ActiveTest, Part1Bank, Part2Bank, Part3Bank, Part4Bank, Part5Bank, Part6Bank, Part7Bank, Part7Prompt } from './types'
import { BASE } from './constants'
import { prefetchImages, schedulePrefetch } from './prefetch'

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickExcluding(arr: Part7Prompt[], exclude: Part7Prompt | null): Part7Prompt {
  const candidates = exclude ? arr.filter(p => p.intro !== exclude.intro) : arr
  return pick(candidates.length > 0 ? candidates : arr)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}questions/schools/${path}`)
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`)
  return res.json() as Promise<T>
}

export async function loadBanks(prevPart7: Part7Prompt | null = null): Promise<ActiveTest> {
  const [b1, b2, b3, b4, b5, b6, b7] = await Promise.all([
    fetchJSON<Part1Bank>('part1.json'),
    fetchJSON<Part2Bank>('part2.json'),
    fetchJSON<Part3Bank>('part3.json'),
    fetchJSON<Part4Bank>('part4.json'),
    fetchJSON<Part5Bank>('part5.json'),
    fetchJSON<Part6Bank>('part6.json'),
    fetchJSON<Part7Bank>('part7.json'),
  ])

  const selectedPart7 = pickExcluding(b7.prompts, prevPart7)

  // Always prefetch the 3 selected images — test must work offline from the start
  prefetchImages(selectedPart7.pics.map(p => p.image))

  // Background-warm the remaining prompts' images unless Data Saver is on
  const saveData = (navigator as any).connection?.saveData ?? false
  if (!saveData) {
    const remaining = b7.prompts
      .filter(p => p !== selectedPart7)
      .flatMap(p => p.pics.map(pc => pc.image))
    schedulePrefetch(remaining, 2000)
  }

  return {
    part1: shuffle(b1.items).slice(0, 6),
    part2: pick(b2.sets),
    part3: pick(b3.sets),
    part4: pick(b4.sets),
    part5: pick(b5.sets),
    part6: pick(b6.prompts),
    part7: selectedPart7,
  }
}
