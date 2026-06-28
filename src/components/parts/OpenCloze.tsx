import type { Part5Set, OpenClozeGap } from '../../types'

interface Props {
  set: Part5Set
  textAnswers: Record<number, string>
  review: boolean
  onsetText: (gapIndex: number, value: string) => void
}

function renderParagraph(
  text: string,
  gaps: OpenClozeGap[],
  textAnswers: Record<number, string>,
  review: boolean,
  onsetText: (gapIndex: number, value: string) => void
): React.ReactNode[] {
  const parts = text.split(/((?:\(\d+\)) ___)/)
  return parts.map((part, idx) => {
    const match = part.match(/^\((\d+)\) ___$/)
    if (match) {
      const gapNum = parseInt(match[1])
      const gi = gapNum - 1
      const g = gaps[gi]
      if (!g) return <span key={idx}>{part}</span>
      const val = textAnswers[gi] ?? ''
      const ok = g.accept.includes(val.trim().toLowerCase())

      if (review) {
        return (
          <span key={idx} style={{ display: 'inline-block', margin: '0 3px', padding: '2px 8px', border: `1.5px solid ${ok ? 'var(--green)' : 'var(--red)'}`, borderRadius: 6, background: ok ? 'var(--green-bg)' : 'var(--red-bg)', fontSize: 14, verticalAlign: 'baseline', fontFamily: "'Libre Franklin', sans-serif" }}>
            <span style={{ color: ok ? 'var(--green)' : 'var(--red)' }}>{val || '—'}</span>
            {!ok && <span style={{ color: 'var(--green)', marginLeft: 4 }}>→ {g.accept[0]}</span>}
          </span>
        )
      }

      return (
        <input
          key={idx}
          id={`q-${gi + 24}`}
          type="text"
          value={val}
          onChange={e => onsetText(gi, e.target.value)}
          placeholder={String(gapNum)}
          aria-label={`Gap ${gapNum}`}
          spellCheck={false}
          className="gap-inline"
          style={{ width: 90 }}
        />
      )
    }
    return <span key={idx}>{part}</span>
  })
}

export default function OpenCloze({ set, textAnswers, review, onsetText }: Props) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
      <div style={{ font: "700 18px 'Libre Franklin'", color: 'var(--navy)', marginBottom: 11 }}>{set.title}</div>
      {set.paragraphs.map((p, i) => (
        <p key={i} className="serif" style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--passage-ink)', margin: '0 0 14px' }}>
          {renderParagraph(p, set.gaps, textAnswers, review, onsetText)}
        </p>
      ))}
    </div>
  )
}
