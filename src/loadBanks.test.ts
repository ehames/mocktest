// @vitest-environment jsdom
import { vi, test, expect, describe, beforeEach, afterEach } from 'vitest'
import { loadBanks } from './loadBanks'
import { prefetchImages, schedulePrefetch } from './prefetch'

vi.mock('./prefetch', () => ({
  prefetchImages: vi.fn(),
  schedulePrefetch: vi.fn(),
}))

// ── Minimal bank fixtures ────────────────────────────────────────────────────

const PIC = (story: string, n: number) => ({
  label: `Picture ${n}`,
  text: `${story} scene ${n}`,
  image: `images/part7/${story}_p${n}.webp`,
})
const PROMPT = (story: string) => ({
  intro: 'Write a story.',
  storyArc: 'arc',
  characters: [{ name: 'Tom', description: 'a boy' }],
  pics: [PIC(story, 1), PIC(story, 2), PIC(story, 3)],
  minWords: 35,
})
const STORIES = ['cafe-rain', 'lost-dog', 'swim-lesson', 'birthday-gift']

const BANKS: Record<string, unknown> = {
  'part1.json': { items: Array.from({ length: 6 }, () => ({ tag: 'A', text: 't', prompt: 'p', opts: ['a','b','c'], answer: 0 })) },
  'part2.json': { sets: [{ people: [{ letter:'A', name:'N', text:'t' }, { letter:'B', name:'N', text:'t' }, { letter:'C', name:'N', text:'t' }], questions: [{ prompt:'q', answer:0 }] }] },
  'part3.json': { sets: [{ title:'T', paragraphs:['p'], questions:[{ prompt:'q', opts:['a','b','c'], answer:0 }] }] },
  'part4.json': { sets: [{ title:'T', paragraphs:['p'], questions:[{ opts:['a','b','c'], answer:0 }] }] },
  'part5.json': { sets: [{ title:'T', paragraphs:['p'], gaps:[{ accept:['the'] }] }] },
  'part6.json': { prompts:[{ intro:'i', bullets:['a','b','c'], minWords:25 }] },
  'part7.json': { prompts: STORIES.map(PROMPT) },
}

function makeFetch() {
  return vi.fn((url: string) => {
    const key = Object.keys(BANKS).find(k => url.includes(k))
    if (!key) return Promise.reject(new Error(`unexpected url: ${url}`))
    return Promise.resolve({ ok: true, json: () => Promise.resolve(BANKS[key]) })
  })
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('loadBanks prefetch integration', () => {
  beforeEach(() => {
    vi.mocked(prefetchImages).mockClear()
    vi.mocked(schedulePrefetch).mockClear()
    vi.stubGlobal('fetch', makeFetch())
    Object.defineProperty(navigator, 'connection', {
      value: { saveData: false },
      configurable: true,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('prefetches the 3 selected Part 7 images immediately', async () => {
    await loadBanks()

    expect(vi.mocked(prefetchImages)).toHaveBeenCalledOnce()
    const [paths] = vi.mocked(prefetchImages).mock.calls[0]
    expect(paths).toHaveLength(3)
    expect(paths.every((p: string) => /images\/part7\/.+\.webp/.test(p))).toBe(true)
  })

  test('schedules background prefetch for the remaining 9 images when saveData is off', async () => {
    await loadBanks()

    expect(vi.mocked(schedulePrefetch)).toHaveBeenCalledOnce()
    const [paths, delay] = vi.mocked(schedulePrefetch).mock.calls[0]
    expect(paths).toHaveLength(9)
    expect(delay).toBe(2000)
    expect(paths.every((p: string) => /images\/part7\/.+\.webp/.test(p))).toBe(true)
  })

  test('selected images are not in the background batch', async () => {
    await loadBanks()

    const [selectedPaths] = vi.mocked(prefetchImages).mock.calls[0]
    const [remainingPaths] = vi.mocked(schedulePrefetch).mock.calls[0]
    const overlap = (selectedPaths as string[]).filter((p: string) => (remainingPaths as string[]).includes(p))
    expect(overlap).toHaveLength(0)
  })

  test('skips background prefetch when saveData is on', async () => {
    Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true })

    await loadBanks()

    expect(vi.mocked(schedulePrefetch)).not.toHaveBeenCalled()
  })

  test('still prefetches selected images when saveData is on', async () => {
    Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true })

    await loadBanks()

    expect(vi.mocked(prefetchImages)).toHaveBeenCalledOnce()
    const [paths] = vi.mocked(prefetchImages).mock.calls[0]
    expect(paths).toHaveLength(3)
  })
})
