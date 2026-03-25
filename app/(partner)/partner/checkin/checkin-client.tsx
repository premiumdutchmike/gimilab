'use client'

import { useState, useTransition, useRef, useEffect, useCallback } from 'react'
import { checkInBooking } from '@/actions/partner'

type CheckedInBooking = {
  memberName: string
  courseName: string
  date: string
  time: string
  players: number
}

export default function CheckInClient() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState<CheckedInBooking | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  // Default to manual on desktop, scan on mobile — but both tabs always available
  const [mode, setMode] = useState<'scan' | 'manual'>('manual')
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrRef = useRef<any>(null)
  const processingRef = useRef(false)

  function reset() {
    setCode('')
    setResult(null)
    setError('')
    processingRef.current = false
    if (mode === 'manual') {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const doCheckIn = useCallback((checkInCode: string) => {
    if (processingRef.current) return
    processingRef.current = true
    setError('')
    setResult(null)
    startTransition(async () => {
      const res = await checkInBooking(checkInCode)
      if (res.error) {
        setError(res.error)
        processingRef.current = false
      } else if (res.booking) {
        setResult(res.booking)
        // Stop scanner on success
        if (html5QrRef.current) {
          try { await html5QrRef.current.stop() } catch {}
        }
      }
    })
  }, [startTransition])

  // Camera scanner setup
  useEffect(() => {
    if (mode !== 'scan' || result) return

    let scanner: any = null

    async function initScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (!scannerRef.current) return

        scanner = new Html5Qrcode('qr-scanner-region')
        html5QrRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText: string) => {
            // Parse gimmelab://checkin/UUID format
            const match = decodedText.match(/gimmelab:\/\/checkin\/(.+)/)
            const qrCode = match ? match[1] : decodedText
            doCheckIn(qrCode)
          },
          () => {} // ignore scan failures (no QR in frame)
        )
        setCameraReady(true)
        setCameraError('')
      } catch (err: any) {
        console.error('Camera init failed:', err)
        setCameraError(
          err?.message?.includes('Permission')
            ? 'Camera permission denied. Allow camera access or use manual entry.'
            : 'Camera not available. Use manual entry instead.'
        )
        setCameraReady(false)
      }
    }

    initScanner()

    return () => {
      if (scanner) {
        scanner.stop().catch(() => {})
        scanner.clear().catch(() => {})
      }
      html5QrRef.current = null
    }
  }, [mode, result, doCheckIn])

  function handleManualSubmit() {
    if (!code.trim()) return
    doCheckIn(code)
  }

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: '0 24px' }}>
      <div style={{
        background: '#0f1923', border: '1px solid #1a2433',
        borderRadius: 6, overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1a2433' }}>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: '#38bdf8', marginBottom: 6,
          }}>
            Pro Shop
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            Member Check-in
          </div>
        </div>

        {/* Mode toggle */}
        {!result && (
          <div style={{
            display: 'flex', borderBottom: '1px solid #1a2433',
          }}>
            <button
              onClick={() => setMode('scan')}
              style={{
                flex: 1, padding: '12px', border: 'none', cursor: 'pointer',
                background: mode === 'scan' ? 'rgba(56,189,248,0.08)' : 'transparent',
                borderBottom: mode === 'scan' ? '2px solid #38bdf8' : '2px solid transparent',
                color: mode === 'scan' ? '#38bdf8' : 'rgba(255,255,255,0.4)',
                fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Scan QR
            </button>
            <button
              onClick={() => setMode('manual')}
              style={{
                flex: 1, padding: '12px', border: 'none', cursor: 'pointer',
                background: mode === 'manual' ? 'rgba(56,189,248,0.08)' : 'transparent',
                borderBottom: mode === 'manual' ? '2px solid #38bdf8' : '2px solid transparent',
                color: mode === 'manual' ? '#38bdf8' : 'rgba(255,255,255,0.4)',
                fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Enter Code
            </button>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {result ? (
            /* ── Success ── */
            <div>
              <div style={{
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: 4, padding: '24px', textAlign: 'center',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'rgba(34,197,94,0.15)', border: '2px solid #22c55e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', fontSize: 24,
                }}>
                  ✓
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: '#22c55e', marginBottom: 12,
                }}>
                  Checked in
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
                  {result.memberName}
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                  {result.courseName}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                  {result.date} at {result.time} · {result.players} player{result.players !== 1 ? 's' : ''}
                </div>
              </div>
              <button
                onClick={reset}
                style={{
                  width: '100%', marginTop: 14, padding: '14px',
                  background: '#38bdf8', border: 'none',
                  borderRadius: 4, fontSize: 12, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: '#0a0f1a', cursor: 'pointer',
                }}
              >
                Next Check-in
              </button>
            </div>
          ) : mode === 'scan' ? (
            /* ── Camera Scanner ── */
            <div>
              <div
                ref={scannerRef}
                id="qr-scanner-region"
                style={{
                  width: '100%',
                  minHeight: 300,
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#0a0f1a',
                  border: '1px solid #1a2433',
                }}
              />
              {cameraError && (
                <div style={{
                  marginTop: 12, padding: '12px 16px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 4, fontSize: 12, color: '#ef4444',
                }}>
                  {cameraError}
                </div>
              )}
              {!cameraReady && !cameraError && (
                <div style={{
                  marginTop: 12, fontSize: 12,
                  color: 'rgba(255,255,255,0.4)', textAlign: 'center',
                }}>
                  Starting camera…
                </div>
              )}
              {cameraReady && (
                <div style={{
                  marginTop: 12, fontSize: 11,
                  color: 'rgba(255,255,255,0.3)', textAlign: 'center',
                }}>
                  Point camera at the member's QR code. Check-in is automatic.
                </div>
              )}
              {error && (
                <div style={{
                  marginTop: 10, fontSize: 12, color: '#ef4444', fontWeight: 600,
                  textAlign: 'center',
                }}>
                  {error}
                </div>
              )}
              {isPending && (
                <div style={{
                  marginTop: 10, fontSize: 12, color: '#38bdf8',
                  fontWeight: 600, textAlign: 'center',
                }}>
                  Checking in…
                </div>
              )}
            </div>
          ) : (
            /* ── Manual Entry ── */
            <div>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.4)', marginBottom: 8,
              }}>
                Enter Check-in Code
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                  placeholder="e.g. A3F1B2C4"
                  maxLength={8}
                  autoFocus
                  style={{
                    flex: 1, background: '#0a0f1a',
                    border: `1px solid ${error ? '#ef4444' : '#1a2433'}`,
                    borderRadius: 4, padding: '12px 14px',
                    fontSize: 18, fontWeight: 700, fontFamily: 'monospace',
                    color: '#fff', letterSpacing: '0.1em', outline: 'none',
                  }}
                />
                <button
                  onClick={handleManualSubmit}
                  disabled={isPending || !code.trim()}
                  style={{
                    padding: '12px 20px',
                    background: '#38bdf8', color: '#0a0f1a',
                    border: 'none', borderRadius: 4,
                    fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', cursor: 'pointer',
                    opacity: isPending || !code.trim() ? 0.5 : 1,
                  }}
                >
                  {isPending ? '…' : 'Check in'}
                </button>
              </div>
              {error && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
                  {error}
                </div>
              )}
              <div style={{ marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                Enter the 8-character code from the member's app or email.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
