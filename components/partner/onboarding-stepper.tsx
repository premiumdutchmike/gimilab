'use client'

const STEPS = [
  { n: 1, label: 'Course Profile' },
  { n: 2, label: 'Rate Setup' },
  { n: 3, label: 'Payout' },
  { n: 4, label: 'Add Slots' },
  { n: 5, label: 'Go Live' },
]

export function OnboardingStepper({ currentStep }: { currentStep: number }) {
  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #D8D1C6', padding: '0 24px' }}>
      <div style={{
        maxWidth: 680,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'flex-start',
        padding: '16px 0',
      }}>
        {STEPS.map((step, i) => {
          const completed = step.n < currentStep
          const active = step.n === currentStep
          return (
            <div
              key={step.n}
              style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? '1' : '0' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: completed || active ? '#BF7B2E' : 'transparent',
                  border: completed || active ? 'none' : '2px solid #D8D1C6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: completed || active ? '#fff' : '#847C72',
                  transition: 'all 0.25s',
                }}>
                  {completed ? '✓' : step.n}
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase' as const,
                  color: completed ? '#BF7B2E' : active ? '#0C0C0B' : '#847C72',
                  whiteSpace: 'nowrap',
                }}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1,
                  height: 2,
                  margin: '0 8px 22px',
                  background: completed ? '#BF7B2E' : '#E5DDD3',
                  transition: 'background 0.25s',
                }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
