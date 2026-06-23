import { useState } from 'react'
import type { AppState, Action, Step } from '../types'
import { PART_META } from '../constants'
import TimerPill from './ui/TimerPill'
import ProgressBar from './ui/ProgressBar'
import ShortMC from './parts/ShortMC'
import MatchingPart from './parts/MatchingPart'
import PassageMC from './parts/PassageMC'
import ClozeMC from './parts/ClozeMC'
import OpenCloze from './parts/OpenCloze'
import { Part6Writing, Part7Writing } from './parts/WritingPart'

interface Props {
  step: 1|2|3|4|5|6|7
  state: AppState
  dispatch: (a: Action) => void
}

export default function TestScreen({ step, state, dispatch }: Props) {
  const [confirmingSubmit, setConfirmingSubmit] = useState(false)

  const { activeTest, answers, text, writing, review } = state
  if (!activeTest) return null

  const meta = PART_META[step]!

  const canBack = review ? true : step > 1
  const isSubmitStep = !review && step === 7
  const nextLabel = review
    ? (step < 7 ? 'Next' : 'Results')
    : (step < 7 ? 'Next' : confirmingSubmit ? 'Confirm →' : 'Submit')
  const partOf = review ? `Reviewing · Part ${step} of 7` : `Part ${step} of 7`

  function handleBack() {
    setConfirmingSubmit(false)
    if (review) {
      if (step > 1) dispatch({ type: 'NAV_STEP', step: (step - 1) as Step })
      else dispatch({ type: 'NAV_STEP', step: 8 })
    } else if (step > 1) {
      dispatch({ type: 'NAV_STEP', step: (step - 1) as Step })
    }
  }

  function handleNext() {
    if (review) {
      if (step < 7) dispatch({ type: 'NAV_STEP', step: (step + 1) as Step })
      else dispatch({ type: 'NAV_STEP', step: 8 })
    } else if (step < 7) {
      dispatch({ type: 'NAV_STEP', step: (step + 1) as Step })
    } else if (!confirmingSubmit) {
      setConfirmingSubmit(true)
    } else {
      setConfirmingSubmit(false)
      dispatch({ type: 'SUBMIT' })
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Header */}
      <div style={{ background: 'var(--navy)', color: 'var(--surface)', padding: '16px 18px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ font: "800 19px 'Libre Franklin'", lineHeight: 1.1 }}>{meta.label}</div>
            <div style={{ font: "500 12px 'Libre Franklin'", color: 'var(--header-muted)', marginTop: 3, letterSpacing: '.02em' }}>{meta.subtitle}</div>
          </div>
          <TimerPill secondsLeft={state.secondsLeft} />
        </div>
        <ProgressBar step={step} />
      </div>

      {/* Scrollable body */}
      <div className="scrollbar-hidden" style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '20px 18px 28px' }}>
        <div style={{ background: 'var(--instr-bg)', borderRadius: 10, padding: '11px 14px', marginBottom: 20, font: "500 13px/1.45 'Libre Franklin'", color: 'var(--instr-ink)' }}>
          {meta.instr}
        </div>

        {step === 1 && (
          <ShortMC
            items={activeTest.part1}
            answers={answers}
            review={review}
            onChoose={(qi, opt) => dispatch({ type: 'CHOOSE', qIndex: qi, option: opt })}
          />
        )}

        {step === 2 && (
          <MatchingPart
            set={activeTest.part2}
            answers={answers}
            review={review}
            onChoose={(qi, opt) => dispatch({ type: 'CHOOSE', qIndex: qi, option: opt })}
            baseIndex={6}
          />
        )}

        {step === 3 && (
          <PassageMC
            set={activeTest.part3}
            answers={answers}
            review={review}
            onChoose={(qi, opt) => dispatch({ type: 'CHOOSE', qIndex: qi, option: opt })}
            baseIndex={13}
          />
        )}

        {step === 4 && (
          <ClozeMC
            set={activeTest.part4}
            answers={answers}
            review={review}
            onChoose={(qi, opt) => dispatch({ type: 'CHOOSE', qIndex: qi, option: opt })}
            baseIndex={18}
          />
        )}

        {step === 5 && (
          <OpenCloze
            set={activeTest.part5}
            textAnswers={text}
            review={review}
            onsetText={(gi, val) => dispatch({ type: 'SET_TEXT', gapIndex: gi, value: val })}
          />
        )}

        {step === 6 && (
          <Part6Writing
            prompt={activeTest.part6}
            value={writing[6]}
            review={review}
            onChange={v => dispatch({ type: 'SET_WRITING', part: 6, value: v })}
          />
        )}

        {step === 7 && (
          <Part7Writing
            prompt={activeTest.part7}
            value={writing[7]}
            review={review}
            onChange={v => dispatch({ type: 'SET_WRITING', part: 7, value: v })}
          />
        )}
      </div>

      {/* Footer */}
      <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {canBack && (
          <button
            onClick={handleBack}
            className="btn-ghost"
            style={{ background: 'var(--surface)', color: 'var(--navy)', border: '1.5px solid var(--input-border)', borderRadius: 11, padding: '14px 18px', font: "600 14px 'Libre Franklin'", cursor: 'pointer' }}
          >
            Back
          </button>
        )}
        <div style={{ flex: 1, textAlign: 'center', font: "600 13px 'Libre Franklin'", color: 'var(--muted)' }}>{partOf}</div>
        <button
          onClick={handleNext}
          aria-label={isSubmitStep && confirmingSubmit ? 'Confirm submission' : undefined}
          className={isSubmitStep && confirmingSubmit ? 'btn-danger' : 'btn-primary'}
          style={{ background: isSubmitStep && confirmingSubmit ? 'var(--red)' : 'var(--navy)', color: 'var(--surface)', border: 'none', borderRadius: 11, padding: '14px 22px', font: "700 14px 'Libre Franklin'", cursor: 'pointer' }}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  )
}
