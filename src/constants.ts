export const DURATION_MINUTES_DEFAULT = 60

export const BAND_THRESHOLDS = [
  { min: 90, label: 'Excellent' },
  { min: 75, label: 'Strong pass' },
  { min: 60, label: 'Pass' },
  { min: 40, label: 'Keep practising' },
  { min: 0,  label: 'More practice needed' },
]

export function getBand(pct: number): string {
  return BAND_THRESHOLDS.find(b => pct >= b.min)!.label
}

export const PART_META = [
  null,
  { label: 'Part 1', subtitle: 'Multiple choice · short texts',   instr: 'For each question, choose the correct answer.' },
  { label: 'Part 2', subtitle: 'Multiple matching',               instr: 'For each question, choose the correct answer.' },
  { label: 'Part 3', subtitle: 'Multiple choice · longer text',   instr: 'For each question, choose the correct answer.' },
  { label: 'Part 4', subtitle: 'Multiple-choice cloze',           instr: 'For each question, choose the correct answer.' },
  { label: 'Part 5', subtitle: 'Open cloze',                      instr: 'For each question, write the correct answer. Write one word for each gap.' },
  { label: 'Part 6', subtitle: 'Guided writing',                  instr: 'Write your email in the box. Write 25 words or more.' },
  { label: 'Part 7', subtitle: 'Story writing',                   instr: 'Look at the three pictures. Write the story shown in the pictures. Write 35 words or more.' },
] as const

export const PART_SCORE_RANGES = [
  null,
  { lo: 0,  hi: 5,  total: 6  },
  { lo: 6,  hi: 12, total: 7  },
  { lo: 13, hi: 17, total: 5  },
  { lo: 18, hi: 23, total: 6  },
  { lo: 24, hi: 29, total: 6  },
]

export const LS_KEY = 'a2key_v3'
export const BANK_CACHE = 'question-banks'

export const BASE = import.meta.env.BASE_URL
