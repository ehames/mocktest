import { useState, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'

interface Props {
  left: ReactNode
  right: ReactNode
  defaultRatio?: number
}

export default function SplitPanel({ left, right, defaultRatio = 0.45 }: Props) {
  const [ratio, setRatio] = useState(defaultRatio)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const applyRatio = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setRatio(Math.min(0.8, Math.max(0.2, (clientX - rect.left) / rect.width)))
  }, [])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      applyRatio(ev.clientX)
    }
    const onMouseUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [applyRatio])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    dragging.current = true

    const onTouchMove = (ev: TouchEvent) => {
      if (!dragging.current || !ev.touches[0]) return
      applyRatio(ev.touches[0].clientX)
    }
    const onTouchEnd = () => {
      dragging.current = false
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }

    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
  }, [applyRatio])

  return (
    <div ref={containerRef} style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left panel */}
      <div
        className="scrollbar-hidden"
        style={{ width: `${ratio * 100}%`, height: '100%', overflowY: 'auto', padding: '20px 20px 28px 24px', flexShrink: 0 }}
      >
        {left}
      </div>

      {/* Draggable divider — 12px wide for touch; visual line stays 2px via inner div */}
      <div
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        style={{
          width: 12,
          flexShrink: 0,
          cursor: 'col-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        <div style={{ position: 'absolute', inset: '0 5px', background: 'var(--border)' }} />
        <div style={{
          position: 'relative',
          zIndex: 1,
          width: 24,
          height: 24,
          borderRadius: 4,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          font: "600 12px 'Libre Franklin'",
          color: 'var(--muted)',
          pointerEvents: 'none',
        }}>
          ↔
        </div>
      </div>

      {/* Right panel */}
      <div
        className="scrollbar-hidden"
        style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '20px 24px 28px 20px', minWidth: 0 }}
      >
        {right}
      </div>
    </div>
  )
}
