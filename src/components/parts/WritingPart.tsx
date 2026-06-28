import { useState } from 'react'
import type { Part6Prompt, Part7Prompt, PicCard as PicCardType } from '../../types'
import { wc } from '../../scoring'
import SplitPanel from '../ui/SplitPanel'

interface Part6Props {
  prompt: Part6Prompt
  value: string
  review: boolean
  onChange: (v: string) => void
  isDesktop?: boolean
}

interface Part7Props {
  prompt: Part7Prompt
  value: string
  review: boolean
  onChange: (v: string) => void
  isDesktop?: boolean
}

function WordCountIndicator({ count, min }: { count: number; min: number }) {
  const hasStarted = count > 0
  const met = count >= min
  const remaining = Math.max(0, min - count)
  const unmetLabel = remaining === 1 ? '1 more word needed' : `${remaining} more words needed`
  const statusColor = !hasStarted ? 'var(--muted)' : met ? 'var(--green)' : 'var(--red)'
  const statusText = !hasStarted ? `min ${min} words` : met ? `Minimum ${min} ✓` : unmetLabel
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
      <span style={{ font: "600 13px 'Libre Franklin'", color: 'var(--muted)' }}>{count} words</span>
      <span style={{ font: "700 13px 'Libre Franklin'", color: statusColor }}>
        {statusText}
      </span>
    </div>
  )
}

function PicCard({ pic, eager }: { pic: PicCardType; eager?: boolean }) {
  const [failed, setFailed] = useState(false)
  return (
    <div style={{
      flex: '0 0 260px',
      scrollSnapAlign: 'start',
      borderRadius: 10,
      overflow: 'hidden',
      position: 'relative',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
    }}>
      {failed ? (
        <div style={{
          width: '100%',
          aspectRatio: '1 / 1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          font: "400 13px/1.5 'Libre Franklin'",
          color: 'var(--ink)',
          textAlign: 'center',
        }}>
          {pic.text}
        </div>
      ) : (
        <img
          src={pic.image}
          alt={pic.text}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          onError={() => setFailed(true)}
          style={{ display: 'block', width: '100%', aspectRatio: '1 / 1', objectFit: 'contain' }}
        />
      )}
      <div style={{
        position: 'absolute',
        bottom: 8,
        left: 8,
        background: 'rgba(0,0,0,0.55)',
        color: '#fff',
        borderRadius: 6,
        padding: '3px 8px',
        font: "700 11px 'Libre Franklin'",
        letterSpacing: '0.05em',
      }}>
        {pic.label}
      </div>
    </div>
  )
}

function SampleAnswer({ text }: { text: string }) {
  return (
    <div style={{ marginTop: 14, background: 'var(--green-bg)', border: '1px solid var(--green)', borderRadius: 12, padding: 16 }}>
      <div style={{ font: "700 12px 'Libre Franklin'", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--green)', marginBottom: 8 }}>
        Sample answer
      </div>
      <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 14, lineHeight: 1.55, color: 'var(--passage-ink)', whiteSpace: 'pre-wrap' }}>
        {text}
      </div>
    </div>
  )
}

const textareaStyle = (review: boolean): React.CSSProperties => ({
  width: '100%',
  minHeight: 210,
  padding: 15,
  borderRadius: 12,
  border: '1.5px solid var(--input-border)',
  fontFamily: "'Source Serif 4', Georgia, serif",
  fontSize: 16,
  lineHeight: 1.6,
  color: 'var(--passage-ink)',
  resize: 'vertical',
  background: review ? 'var(--instr-bg)' : 'var(--surface)',
})

export function Part6Writing({ prompt, value, review, onChange, isDesktop }: Part6Props) {
  const count = wc(value)

  const promptCard = (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
      <div style={{ font: "500 15px/1.5 'Libre Franklin'", color: 'var(--ink)', marginBottom: 13 }}>{prompt.intro}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {prompt.bullets.map((b, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', font: "400 15px/1.45 'Libre Franklin'", color: 'var(--instr-ink)' }}>
            <span style={{ color: 'var(--navy)', fontWeight: 800, flexShrink: 0 }}>•</span>
            <span>{b}</span>
          </div>
        ))}
      </div>
    </div>
  )

  if (isDesktop) {
    const desktopRightPanel = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          readOnly={review}
          placeholder="Write your answer here..."
          aria-label="Part 6 writing answer"
          spellCheck={false}
          style={{ ...textareaStyle(review), minHeight: 260, resize: 'vertical' }}
        />
        <WordCountIndicator count={count} min={prompt.minWords} />
        {review && prompt.sampleResponse && <SampleAnswer text={prompt.sampleResponse} />}
      </div>
    )
    return <SplitPanel left={promptCard} right={desktopRightPanel} defaultRatio={0.4} />
  }

  return (
    <>
      <div style={{ marginBottom: 16 }}>{promptCard}</div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        readOnly={review}
        placeholder="Write your answer here..."
        aria-label="Part 6 writing answer"
        style={{ ...textareaStyle(review), minHeight: 210 }}
      />
      <WordCountIndicator count={count} min={prompt.minWords} />
      {review && prompt.sampleResponse && <SampleAnswer text={prompt.sampleResponse} />}
    </>
  )
}

export function Part7Writing({ prompt, value, review, onChange, isDesktop }: Part7Props) {
  const count = wc(value)

  if (isDesktop) {
    return (
      <>
        <div style={{ font: "500 15px/1.5 'Libre Franklin'", color: 'var(--ink)', marginBottom: 14 }}>
          {prompt.intro}
        </div>
        <div
          data-testid="part7-image-strip"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}
        >
          {prompt.pics.map((pic, i) => (
            <PicCard key={i} pic={pic} eager={i === 0} />
          ))}
        </div>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          readOnly={review}
          placeholder="Write your answer here..."
          aria-label="Part 7 writing answer"
          spellCheck={false}
          style={{ ...textareaStyle(review), minHeight: 200 }}
        />
        <WordCountIndicator count={count} min={prompt.minWords} />
        {review && prompt.sampleResponse && <SampleAnswer text={prompt.sampleResponse} />}
      </>
    )
  }

  const mobileImageStrip = (
    <div
      data-testid="part7-image-strip"
      style={{
        display: 'flex',
        gap: 10,
        overflowX: 'auto',
        scrollSnapType: 'x mandatory',
        paddingBottom: 4,
      }}
    >
      {prompt.pics.map((pic, i) => (
        <PicCard key={i} pic={pic} eager={i === 0} />
      ))}
    </div>
  )

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <div style={{ font: "500 15px/1.5 'Libre Franklin'", color: 'var(--ink)', marginBottom: 13 }}>{prompt.intro}</div>
        {mobileImageStrip}
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        readOnly={review}
        placeholder="Write your answer here..."
        aria-label="Part 7 writing answer"
        style={{ ...textareaStyle(review), minHeight: 210 }}
      />
      <WordCountIndicator count={count} min={prompt.minWords} />
      {review && prompt.sampleResponse && <SampleAnswer text={prompt.sampleResponse} />}
    </>
  )
}
