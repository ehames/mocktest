import type { Part4Set, ClozeQuestion } from '../../types'

interface Props {
  set: Part4Set
  answers: Record<number, number>
  review: boolean
  onChoose: (qIndex: number, option: number) => void
  baseIndex: number
}

function renderParagraph(
  text: string,
  questions: ClozeQuestion[],
  baseIndex: number,
  answers: Record<number, number>,
  review: boolean,
  onChoose: (qIndex: number, option: number) => void
): React.ReactNode[] {
  const parts = text.split(/((?:\(\d+\)) ___)/)
  return parts.map((part, idx) => {
    const match = part.match(/^\((\d+)\) ___$/)
    if (match) {
      const gapNum = parseInt(match[1])
      const qi = gapNum - 1
      const q = questions[qi]
      if (!q) return <span key={idx}>{part}</span>
      const qIndex = baseIndex + qi
      const sel = answers[qIndex]

      if (review) {
        const isCorrect = sel === q.answer
        const userText = sel !== undefined ? q.opts[sel] : '—'
        const correctText = q.opts[q.answer]
        return (
          <span
            key={idx}
            style={{
              display: 'inline-block',
              margin: '0 3px',
              padding: '2px 7px',
              border: `1.5px solid ${isCorrect ? 'var(--green)' : 'var(--red)'}`,
              borderRadius: 6,
              background: isCorrect ? 'var(--green-bg)' : 'var(--red-bg)',
              fontSize: 14,
              verticalAlign: 'baseline',
            }}
          >
            <span style={{ color: isCorrect ? 'var(--green)' : 'var(--red)', fontFamily: "'Libre Franklin', sans-serif" }}>
              {userText}
            </span>
            {!isCorrect && (
              <span style={{ color: 'var(--green)', marginLeft: 4, fontFamily: "'Libre Franklin', sans-serif" }}>
                → {correctText}
              </span>
            )}
          </span>
        )
      }

      return (
        <select
          key={idx}
          id={`q-${qIndex}`}
          value={sel !== undefined ? String(sel) : ''}
          onChange={e => onChoose(qIndex, parseInt(e.target.value))}
          aria-label={`Gap ${gapNum}`}
          className="gap-inline"
        >
          <option value="">{gapNum}</option>
          {q.opts.map((opt, oi) => (
            <option key={oi} value={String(oi)}>
              {opt}
            </option>
          ))}
        </select>
      )
    }
    return <span key={idx}>{part}</span>
  })
}

export default function ClozeMC({ set, answers, review, onChoose, baseIndex }: Props) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
      <div style={{ font: "700 18px 'Libre Franklin'", color: 'var(--navy)', marginBottom: 11 }}>{set.title}</div>
      {set.paragraphs.map((p, i) => (
        <p key={i} className="serif" style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--passage-ink)', margin: '0 0 14px' }}>
          {renderParagraph(p, set.questions, baseIndex, answers, review, onChoose)}
        </p>
      ))}
    </div>
  )
}
