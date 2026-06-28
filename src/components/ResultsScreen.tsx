import { useState } from 'react'
import type { AppState, Action } from '../types'
import { computeResults } from '../scoring'
import { openPdf } from '../pdfExport'

const TEACHER_CODE = '1235'

interface Props {
  state: AppState
  dispatch: (a: Action) => void
}

export default function ResultsScreen({ state, dispatch }: Props) {
  const [showPin, setShowPin] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)

  const { activeTest, answers, text } = state
  if (!activeTest) return null

  function handleRestartClick() {
    setShowPin(true)
    setPin('')
    setPinError(false)
  }

  function handlePinConfirm() {
    if (pin === TEACHER_CODE) {
      dispatch({ type: 'RESTART' })
    } else {
      setPinError(true)
      setPin('')
    }
  }

  const r = computeResults(activeTest, answers, text)
  const ringDeg = r.pct * 3.6

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Header */}
      <div style={{ background: 'var(--navy)', color: 'var(--surface)', padding: '22px 18px', flexShrink: 0 }}>
        <div style={{ font: "600 12px 'Libre Franklin'", letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--header-muted)' }}>A2 Key · Reading & Writing</div>
        <div style={{ font: "800 25px 'Libre Franklin'", marginTop: 4 }}>Your results</div>
      </div>

      {/* Scrollable body */}
      <div className="scrollbar-hidden" style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '22px 18px 26px' }}>

        {/* Score ring */}
        <div role="group" aria-label="Score summary" className="animate-pop" style={{ display: 'flex', alignItems: 'center', gap: 18, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 18 }}>
          <div style={{ flexShrink: 0, width: 128, height: 128, borderRadius: '50%', background: `conic-gradient(var(--accent) ${ringDeg}deg, var(--border) 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ font: "800 27px 'Libre Franklin'", color: 'var(--navy)', lineHeight: 1 }}>{r.score}</div>
              <div style={{ font: "600 11px 'Libre Franklin'", color: 'var(--muted)', marginTop: 2 }}>/ {r.total}</div>
            </div>
          </div>
          <div>
            <div style={{ font: "800 23px 'Libre Franklin'", color: 'var(--navy)' }}>{r.pct}%</div>
            <div style={{ font: "700 14px 'Libre Franklin'", color: 'var(--accent)', marginTop: 2 }}>{r.band}</div>
            <div style={{ font: "400 13px/1.4 'Libre Franklin'", color: 'var(--muted)', marginTop: 6 }}>Reading & cloze (Parts 1–5)</div>
          </div>
        </div>

        {/* Per-part breakdown */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '4px 18px', marginBottom: 20 }}>
          {r.perPart.map((pp, i) => (
            <div key={i} style={{ padding: '13px 0', borderBottom: i < r.perPart.length - 1 ? '1px solid var(--page-bg)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, font: "600 14px 'Libre Franklin'", color: 'var(--ink)' }}>
                <span>{pp.label}</span>
                <span>{pp.score} / {pp.total}</span>
              </div>
              <div style={{ height: 6, background: 'var(--page-bg)', borderRadius: 999, overflow: 'hidden' }}>
                <div className="bar-animated" style={{ '--bar-delay': `${i * 0.08}s`, height: '100%', width: '100%', background: 'var(--accent)', borderRadius: 999, transformOrigin: 'left', transform: `scaleX(${Math.round(pp.score / pp.total * 100) / 100})` } as React.CSSProperties} />
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
          <button
            onClick={() => dispatch({ type: 'ENTER_REVIEW' })}
            className="btn-ghost"
            style={{ flex: 1, background: 'var(--surface)', color: 'var(--navy)', border: '1.5px solid var(--input-border)', borderRadius: 12, padding: 15, font: "700 14px 'Libre Franklin'", cursor: 'pointer' }}
          >
            Review answers
          </button>
          <button
            onClick={() => { openPdf(state) }}
            className="btn-ghost"
            style={{ flex: 1, background: 'var(--surface)', color: 'var(--navy)', border: '1.5px solid var(--input-border)', borderRadius: 12, padding: 15, font: "700 14px 'Libre Franklin'", cursor: 'pointer' }}
          >
            Download PDF
          </button>
        </div>

        {/* Restart (teacher-only, PIN-protected) */}
        <div style={{ marginTop: 16 }}>
          <button
            onClick={handleRestartClick}
            style={{ width: '100%', background: 'transparent', color: 'var(--muted)', border: '1.5px dashed var(--border)', borderRadius: 12, padding: '11px 15px', font: "600 13px 'Libre Franklin'", cursor: 'pointer' }}
          >
            Restart exam
          </button>
        </div>

        {/* PIN modal */}
        {showPin && (
          <div
            onClick={() => setShowPin(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, width: 320, maxWidth: 'calc(100vw - 40px)', boxShadow: '0 8px 40px rgba(0,0,0,0.25)' }}
            >
              <div style={{ font: "800 17px 'Libre Franklin'", color: 'var(--navy)', marginBottom: 6 }}>Restart exam</div>
              <div style={{ font: "400 13px 'Libre Franklin'", color: 'var(--muted)', marginBottom: 18 }}>Enter the teacher code to start a new test.</div>
              <input
                type="password"
                value={pin}
                onChange={e => { setPin(e.target.value); setPinError(false) }}
                onKeyDown={e => { if (e.key === 'Enter') handlePinConfirm() }}
                placeholder="Teacher's code"
                maxLength={6}
                autoFocus
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: `1.5px solid ${pinError ? 'var(--red)' : 'var(--input-border)'}`,
                  font: "400 18px 'Libre Franklin'",
                  color: 'var(--ink)',
                  background: 'var(--page-bg)',
                  marginBottom: 6,
                  outline: 'none',
                  letterSpacing: '0.25em',
                  boxSizing: 'border-box',
                }}
              />
              {pinError && (
                <div style={{ font: "600 12px 'Libre Franklin'", color: 'var(--red)', marginBottom: 12 }}>
                  Incorrect code — try again
                </div>
              )}
              {!pinError && <div style={{ height: 12 }} />}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handlePinConfirm}
                  className="btn-primary"
                  style={{ flex: 1, background: 'var(--navy)', color: 'var(--surface)', border: 'none', borderRadius: 10, padding: '13px 0', font: "700 14px 'Libre Franklin'", cursor: 'pointer' }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowPin(false)}
                  className="btn-ghost"
                  style={{ flex: 1, background: 'var(--surface)', color: 'var(--navy)', border: '1.5px solid var(--input-border)', borderRadius: 10, padding: '13px 0', font: "600 14px 'Libre Franklin'", cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
