// ── Question bank types ────────────────────────────────────────────────────

export interface Part1Item {
  tag: string
  text: string
  prompt: string
  opts: [string, string, string]
  answer: 0 | 1 | 2
  rationale?: string
}

export interface Part1Bank {
  items: Part1Item[]
}

export interface Part2Person {
  letter: 'A' | 'B' | 'C'
  name: string
  text: string
}

export interface Part2Question {
  prompt: string
  answer: 0 | 1 | 2
  rationale?: string
}

export interface Part2Set {
  people: [Part2Person, Part2Person, Part2Person]
  questions: Part2Question[]
}

export interface Part2Bank {
  sets: Part2Set[]
}

export interface PassageQuestion {
  prompt: string
  opts: [string, string, string]
  answer: 0 | 1 | 2
  rationale?: string
}

export interface Part3Set {
  title: string
  paragraphs: string[]
  questions: PassageQuestion[]
}

export interface Part3Bank {
  sets: Part3Set[]
}

export interface ClozeQuestion {
  opts: [string, string, string]
  answer: 0 | 1 | 2
  rationale?: string
}

export interface Part4Set {
  title: string
  paragraphs: string[]
  questions: ClozeQuestion[]
}

export interface Part4Bank {
  sets: Part4Set[]
}

export interface OpenClozeGap {
  accept: string[]
  rationale?: string
}

export interface Part5Set {
  title: string
  paragraphs: string[]
  gaps: OpenClozeGap[]
}

export interface Part5Bank {
  sets: Part5Set[]
}

export interface Part6Prompt {
  intro: string
  bullets: [string, string, string]
  minWords: number
  sampleResponse?: string
}

export interface Part6Bank {
  prompts: Part6Prompt[]
}

export interface PicCard {
  label: string
  text: string
  image: string
  setting?: string
  background?: string
  scene?: string
  emotion?: string
}

export interface Character {
  name: string
  description: string
}

export interface Part7Prompt {
  intro: string
  characters: Character[]
  pics: [PicCard, PicCard, PicCard]
  minWords: number
}

export interface Part7Bank {
  prompts: Part7Prompt[]
}

// ── Active test (assembled from banks) ────────────────────────────────────

export interface ActiveTest {
  part1: Part1Item[]        // 6 items picked from bank
  part2: Part2Set
  part3: Part3Set
  part4: Part4Set
  part5: Part5Set
  part6: Part6Prompt
  part7: Part7Prompt
}

// ── App state ─────────────────────────────────────────────────────────────

export type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export interface AppState {
  step: Step
  started: boolean
  submitted: boolean
  review: boolean
  secondsLeft: number
  answers: Record<number, number>   // Parts 1–4: qIndex → optionIndex
  text: Record<number, string>      // Part 5: gapIndex → typed word
  writing: { 6: string; 7: string }
  name: string
  activeTest: ActiveTest | null
  loadError: string | null
}

// ── Reducer actions ───────────────────────────────────────────────────────

export type Action =
  | { type: 'SET_NAME'; name: string }
  | { type: 'SET_TEST'; test: ActiveTest; secondsLeft: number }
  | { type: 'LOAD_ERROR'; message: string }
  | { type: 'START' }
  | { type: 'CHOOSE'; qIndex: number; option: number }
  | { type: 'SET_TEXT'; gapIndex: number; value: string }
  | { type: 'SET_WRITING'; part: 6 | 7; value: string }
  | { type: 'SUBMIT' }
  | { type: 'RESTART' }
  | { type: 'ENTER_REVIEW' }
  | { type: 'NAV_STEP'; step: Step }
  | { type: 'TICK' }
