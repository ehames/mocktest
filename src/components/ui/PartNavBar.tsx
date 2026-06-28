import type { Action, Step } from '../../types'

interface Props {
  step: Step
  answers: Record<number, number>
  text: Record<number, string>
  writing: { 6: string; 7: string }
  review: boolean
  canBack: boolean
  nextLabel: string
  confirmingSubmit: boolean
  onBack: () => void
  onNext: () => void
  dispatch: (a: Action) => void
}

interface ChipData {
  display: number
  scrollId: string
  answered: boolean
}

function getChips(step: number, answers: Record<number, number>, text: Record<number, string>): ChipData[] | null {
  if (step === 1) return Array.from({ length: 6 }, (_, i) => ({ display: i + 1, scrollId: `q-${i}`, answered: answers[i] !== undefined }))
  if (step === 2) return Array.from({ length: 7 }, (_, i) => ({ display: i + 1, scrollId: `q-${i + 6}`, answered: answers[i + 6] !== undefined }))
  if (step === 3) return Array.from({ length: 5 }, (_, i) => ({ display: i + 1, scrollId: `q-${i + 13}`, answered: answers[i + 13] !== undefined }))
  if (step === 4) return Array.from({ length: 6 }, (_, i) => ({ display: i + 1, scrollId: `q-${i + 18}`, answered: answers[i + 18] !== undefined }))
  if (step === 5) return Array.from({ length: 6 }, (_, i) => ({ display: i + 1, scrollId: `q-${i + 24}`, answered: (text[i] ?? '').trim().length > 0 }))
  return null
}

function getCompletion(
  s: number,
  answers: Record<number, number>,
  text: Record<number, string>,
  writing: { 6: string; 7: string },
): { done: number; total: number } {
  if (s === 1) return { done: [0,1,2,3,4,5].filter(i => answers[i] !== undefined).length, total: 6 }
  if (s === 2) return { done: [6,7,8,9,10,11,12].filter(i => answers[i] !== undefined).length, total: 7 }
  if (s === 3) return { done: [13,14,15,16,17].filter(i => answers[i] !== undefined).length, total: 5 }
  if (s === 4) return { done: [18,19,20,21,22,23].filter(i => answers[i] !== undefined).length, total: 6 }
  if (s === 5) return { done: [0,1,2,3,4,5].filter(i => (text[i] ?? '').trim().length > 0).length, total: 6 }
  if (s === 6) return { done: writing[6].trim().length > 0 ? 1 : 0, total: 1 }
  if (s === 7) return { done: writing[7].trim().length > 0 ? 1 : 0, total: 1 }
  return { done: 0, total: 0 }
}

export default function PartNavBar({ step, answers, text, writing, review, canBack, nextLabel, confirmingSubmit, onBack, onNext, dispatch }: Props) {
  function handlePartClick(s: number) {
    if (s !== step) {
      dispatch({ type: 'NAV_STEP', step: s as Step })
    }
  }

  function handleChipClick(e: React.MouseEvent, scrollId: string) {
    e.stopPropagation()
    document.getElementById(scrollId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const reviewPrefix = review ? 'Reviewing · ' : ''
  const partLabel = `${reviewPrefix}Part ${step} of 7`

  return (
    <div
      aria-label={partLabel}
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'stretch',
        flexShrink: 0,
        minHeight: 56,
      }}
    >
      {/* Part tabs */}
      <div className="scrollbar-hidden" style={{ display: 'flex', flex: 1, overflowX: 'auto' }}>
        {([1, 2, 3, 4, 5, 6, 7] as const).map(s => {
          const isActive = s === step
          const { done, total } = getCompletion(s, answers, text, writing)
          const chips = isActive ? getChips(s, answers, text) : null

          return (
            <div
              key={s}
              onClick={() => handlePartClick(s)}
              style={{
                borderRight: '1px solid var(--border)',
                padding: chips ? '8px 10px' : '8px 14px',
                cursor: isActive ? 'default' : 'pointer',
                background: isActive ? 'var(--instr-bg)' : 'var(--surface)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 4,
                flex: 1,
                minWidth: 0,
                transition: 'background 0.12s ease',
              }}
            >
              <div
                style={{
                  font: `${isActive ? '800' : '600'} 11px 'Libre Franklin'`,
                  color: isActive ? 'var(--navy)' : 'var(--muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                Part {s}
              </div>

              {chips ? (
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', maxWidth: 220 }}>
                  {chips.map(chip => (
                    <button
                      key={chip.display}
                      onClick={e => handleChipClick(e, chip.scrollId)}
                      title={`Question ${chip.display}`}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        border: `1.5px solid ${chip.answered ? 'var(--navy)' : 'var(--option-border)'}`,
                        background: chip.answered ? 'var(--navy)' : 'var(--surface)',
                        color: chip.answered ? 'var(--surface)' : 'var(--muted)',
                        font: "700 9px 'Libre Franklin'",
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                        flexShrink: 0,
                      }}
                    >
                      {chip.display}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ font: "500 11px 'Libre Franklin'", color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                  {done} of {total}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Navigation buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          borderLeft: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        {canBack && (
          <button
            onClick={onBack}
            className="btn-ghost"
            aria-label="Back"
            style={{
              background: 'var(--surface)',
              color: 'var(--navy)',
              border: '1.5px solid var(--input-border)',
              borderRadius: 10,
              padding: '10px 16px',
              font: "700 14px 'Libre Franklin'",
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
        )}
        <button
          onClick={onNext}
          aria-label={confirmingSubmit ? 'Confirm submission' : undefined}
          className={confirmingSubmit ? 'btn-danger' : 'btn-primary'}
          style={{
            background: confirmingSubmit ? 'var(--red)' : 'var(--navy)',
            color: 'var(--surface)',
            border: 'none',
            borderRadius: 10,
            padding: '10px 18px',
            font: "700 14px 'Libre Franklin'",
            cursor: 'pointer',
          }}
        >
          {nextLabel} →
        </button>
      </div>
    </div>
  )
}
