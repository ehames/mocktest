import type { Part5Set } from '../../types'
import RationaleToggle from '../ui/RationaleToggle'

interface Props {
  set: Part5Set
  textAnswers: Record<number, string>
  review: boolean
  onsetText: (gapIndex: number, value: string) => void
}

export default function OpenCloze({ set, textAnswers, review, onsetText }: Props) {
  return (
    <>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, marginBottom: 20 }}>
        <div style={{ font: "700 18px 'Libre Franklin'", color: 'var(--navy)', marginBottom: 11 }}>{set.title}</div>
        {set.paragraphs.map((p, i) => (
          <p key={i} className="serif" style={{ fontSize: 16, lineHeight: 1.62, color: 'var(--passage-ink)', margin: '0 0 12px' }}>{p}</p>
        ))}
      </div>

      {set.gaps.map((g, i) => {
        const val = textAnswers[i] || ''
        const ok = g.accept.includes(val.trim().toLowerCase())
        const borderColor = review ? (ok ? 'var(--green)' : 'var(--red)') : 'var(--input-border)'
        const bgColor = review ? (ok ? 'var(--green-bg)' : 'var(--red-bg)') : 'var(--surface)'

        return (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flexShrink: 0, width: 30, height: 30, borderRadius: '50%', background: 'var(--navy)', color: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 13px 'Libre Franklin'" }}>
                {i + 1}
              </div>
              <input
                value={val}
                onChange={e => onsetText(i, e.target.value)}
                readOnly={review}
                placeholder="one word"
                aria-label={`Gap ${i + 1}`}
                style={{ flex: 1, padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${borderColor}`, background: bgColor, font: "500 16px 'Libre Franklin'", color: 'var(--ink)', minWidth: 0 }}
              />
              {review && (
                <span style={{ flexShrink: 0, font: "700 14px 'Libre Franklin'", color: ok ? 'var(--green)' : 'var(--red)' }}>
                  {ok ? '✓' : `✗ ${g.accept[0]}`}
                </span>
              )}
            </div>
            {review && g.rationale && (
              <div style={{ paddingLeft: 42 }}>
                <RationaleToggle rationale={g.rationale} />
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
