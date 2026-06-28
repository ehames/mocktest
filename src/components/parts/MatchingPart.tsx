import type { Part2Set } from '../../types'
import OptionRow from '../ui/OptionRow'
import RationaleToggle from '../ui/RationaleToggle'
import SplitPanel from '../ui/SplitPanel'

interface Props {
  set: Part2Set
  answers: Record<number, number>
  review: boolean
  onChoose: (qIndex: number, option: number) => void
  baseIndex: number
  isDesktop: boolean
}

export default function MatchingPart({ set, answers, review, onChoose, baseIndex, isDesktop }: Props) {
  const personCards = (
    <>
      {set.people.map((p, pi) => (
        <div key={pi} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '15px 16px', marginBottom: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--navy)', color: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "800 14px 'Libre Franklin'" }}>{p.letter}</div>
            <div style={{ font: "700 16px 'Libre Franklin'", color: 'var(--navy)' }}>{p.name}</div>
          </div>
          <div className="serif" style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--passage-ink)' }}>{p.text}</div>
        </div>
      ))}
    </>
  )

  const questionCards = (
    <>
      {set.questions.map((q, qi) => {
        const qIndex = baseIndex + qi
        const sel = answers[qIndex]
        return (
          <div key={qi} id={`q-${qIndex}`} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 15px', marginBottom: 11 }}>
            <div style={{ font: "600 15px/1.4 'Libre Franklin'", color: 'var(--ink)', marginBottom: 11 }}>{qi + 1}. {q.prompt}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {([0, 1, 2] as const).map(oi => {
                const isSel = sel === oi
                const isCorrect = oi === q.answer
                let optState: 'idle' | 'selected' | 'correct' | 'wrong' = 'idle'
                if (review) { if (isCorrect) optState = 'correct'; else if (isSel) optState = 'wrong' }
                else if (isSel) optState = 'selected'
                return (
                  <OptionRow
                    key={oi}
                    letter={(['A', 'B', 'C'] as const)[oi]}
                    variant="letter"
                    optionState={optState}
                    onClick={review ? undefined : () => onChoose(qIndex, oi)}
                    showMark={review && (isCorrect || isSel)}
                    ariaLabel={`${(['A', 'B', 'C'] as const)[oi]}: ${set.people[oi].name}`}
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
    return <SplitPanel left={personCards} right={questionCards} />
  }

  return (
    <>
      {personCards}
      <div style={{ height: 8 }} />
      {questionCards}
    </>
  )
}
