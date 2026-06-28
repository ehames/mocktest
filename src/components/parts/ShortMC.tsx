import type { Part1Item } from '../../types'
import OptionRow from '../ui/OptionRow'
import RationaleToggle from '../ui/RationaleToggle'

interface Props {
  items: Part1Item[]
  answers: Record<number, number>
  review: boolean
  onChoose: (qIndex: number, option: number) => void
}

export default function ShortMC({ items, answers, review, onChoose }: Props) {
  return (
    <>
      {items.map((item, i) => {
        const sel = answers[i]
        return (
          <div key={i} id={`q-${i}`} style={{ marginBottom: 26 }} className="animate-pop">
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'inline-block', background: 'var(--navy)', color: 'var(--surface)', font: "700 10px 'Libre Franklin'", letterSpacing: '.12em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 5, marginBottom: 8 }}>{item.tag}</div>
              <div className="serif" style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--passage-ink)' }}>{item.text}</div>
            </div>
            <div style={{ font: "600 16px/1.4 'Libre Franklin'", color: 'var(--ink)', margin: '15px 0 12px' }}>{i + 1}. {item.prompt}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {item.opts.map((opt, oi) => {
                const isSel = sel === oi
                const isCorrect = oi === item.answer
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
                    onClick={review ? undefined : () => onChoose(i, oi)}
                    showMark={review && (isCorrect || isSel)}
                  />
                )
              })}
            </div>
            {review && item.rationale && (
              <RationaleToggle rationale={item.rationale} />
            )}
          </div>
        )
      })}
    </>
  )
}
