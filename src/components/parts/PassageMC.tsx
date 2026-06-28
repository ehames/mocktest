import type { Part3Set } from '../../types'
import OptionRow from '../ui/OptionRow'
import RationaleToggle from '../ui/RationaleToggle'
import SplitPanel from '../ui/SplitPanel'

interface Props {
  set: Part3Set
  answers: Record<number, number>
  review: boolean
  onChoose: (qIndex: number, option: number) => void
  baseIndex: number
  isDesktop: boolean
}

export default function PassageMC({ set, answers, review, onChoose, baseIndex, isDesktop }: Props) {
  const passage = (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, marginBottom: 20 }}>
      <div style={{ font: "700 18px 'Libre Franklin'", color: 'var(--navy)', marginBottom: 11 }}>{set.title}</div>
      {set.paragraphs.map((p, i) => (
        <p key={i} className="serif" style={{ fontSize: 16, lineHeight: 1.62, color: 'var(--passage-ink)', margin: '0 0 12px' }}>{p}</p>
      ))}
    </div>
  )

  const questions = (
    <>
      {set.questions.map((q, qi) => {
        const qIndex = baseIndex + qi
        const sel = answers[qIndex]
        return (
          <div key={qi} id={`q-${qIndex}`} style={{ marginBottom: 22 }}>
            <div style={{ font: "600 16px/1.4 'Libre Franklin'", color: 'var(--ink)', marginBottom: 12 }}>{qi + 1}. {q.prompt}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {q.opts.map((opt, oi) => {
                const isSel = sel === oi
                const isCorrect = oi === q.answer
                let optState: 'idle' | 'selected' | 'correct' | 'wrong' = 'idle'
                if (review) { if (isCorrect) optState = 'correct'; else if (isSel) optState = 'wrong' }
                else if (isSel) optState = 'selected'
                return (
                  <OptionRow
                    key={oi}
                    letter={(['A', 'B', 'C'] as const)[oi]}
                    label={opt}
                    variant="row"
                    optionState={optState}
                    onClick={review ? undefined : () => onChoose(qIndex, oi)}
                    showMark={review && (isCorrect || isSel)}
                  />
                )
              })}
            </div>
            {review && q.rationale && (
              <RationaleToggle rationale={q.rationale} />
            )}
          </div>
        )
      })}
    </>
  )

  if (isDesktop) {
    return <SplitPanel left={passage} right={questions} />
  }

  return (
    <>
      {passage}
      {questions}
    </>
  )
}
