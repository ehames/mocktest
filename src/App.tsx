import { useReducer, useEffect, useCallback, useRef } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { reducer, initialState } from './reducer'
import { useTimer } from './hooks/useTimer'
import { loadBanks } from './loadBanks'
import { LS_KEY, DURATION_MINUTES_DEFAULT, BASE } from './constants'
import type { AppState, Action } from './types'
import IntroScreen from './components/IntroScreen'
import TestScreen from './components/TestScreen'
import ResultsScreen from './components/ResultsScreen'

function readLS(): Partial<AppState> | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeLS(state: AppState) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { loadError, ...rest } = state
    localStorage.setItem(LS_KEY, JSON.stringify(rest))
  } catch {}
}

export default function App() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

  const [state, dispatch] = useReducer(reducer, initialState, () => {
    const saved = readLS()
    if (saved) return { ...initialState, ...saved }
    return { ...initialState, secondsLeft: DURATION_MINUTES_DEFAULT * 60 }
  })

  useEffect(() => { writeLS(state) }, [state])

  useEffect(() => {
    if (needRefresh && state.step === 0) updateServiceWorker(true)
  }, [needRefresh, state.step, updateServiceWorker])

  useEffect(() => {
    if (state.step !== 0) return
    const parts = ['part1.json','part2.json','part3.json','part4.json','part5.json','part6.json','part7.json']
    parts.forEach(p => fetch(`${BASE}questions/schools/${p}`).catch(() => {}))
  }, [state.step])

  const handleTick = useCallback(() => {
    if (state.secondsLeft <= 1 && state.started && !state.submitted) {
      dispatch({ type: 'SUBMIT' })
    } else {
      dispatch({ type: 'TICK' })
    }
  }, [state.secondsLeft, state.started, state.submitted])

  useTimer(state.started && !state.submitted, handleTick)

  const lastPart7Ref = useRef(state.activeTest?.part7 ?? null)

  const handleStart = useCallback(async () => {
    try {
      const test = await loadBanks(lastPart7Ref.current)
      lastPart7Ref.current = test.part7
      dispatch({ type: 'SET_TEST', test, secondsLeft: DURATION_MINUTES_DEFAULT * 60 })
      dispatch({ type: 'START' })
    } catch (e) {
      dispatch({ type: 'LOAD_ERROR', message: e instanceof Error ? e.message : 'Failed to load questions' })
    }
  }, [])

  const d = (a: Action) => dispatch(a)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'stretch', background: 'var(--outer-bg)' }}>
      <main style={{ width: '100%', maxWidth: 440, height: '100vh', background: 'var(--page-bg)', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: 'var(--shadow-column)', overflow: 'hidden' }}>
        {state.step === 0 && (
          <IntroScreen
            name={state.name}
            loadError={state.loadError}
            onName={name => d({ type: 'SET_NAME', name })}
            onStart={handleStart}
          />
        )}
        {state.step >= 1 && state.step <= 7 && state.activeTest && (
          <TestScreen
            step={state.step as 1|2|3|4|5|6|7}
            state={state}
            dispatch={d}
          />
        )}
        {state.step === 8 && state.activeTest && (
          <ResultsScreen
            state={state}
            dispatch={d}
          />
        )}
      </main>
    </div>
  )
}
