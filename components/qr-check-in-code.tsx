'use client'
import { useState } from 'react'
import QRCode from 'react-qr-code'

interface QrCheckInCodeProps {
  code: string
  courseName: string
  date: string
  time: string
}

export function QrCheckInCode({ code, courseName, date, time }: QrCheckInCodeProps) {
  const [expanded, setExpanded] = useState(false)
  const shortCode = code.split('-')[0].toUpperCase()

  // The QR encodes the full UUID — partner's scanner reads it
  const qrValue = `gimmelab://checkin/${code}`

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: expanded ? '#BF7B2E' : 'rgba(191,123,46,0.1)',
          color: expanded ? '#fff' : '#BF7B2E',
          border: 'none',
          borderRadius: 6,
          padding: '8px 16px',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase' as const,
          cursor: 'pointer',
          transition: 'all 0.15s',
          width: '100%',
        }}
      >
        {expanded ? 'Hide Check-in Code' : 'Show Check-in Code'}
      </button>

      {expanded && (
        <div style={{
          marginTop: 12,
          background: '#fff',
          border: '1px solid #e8e8e8',
          borderRadius: 8,
          padding: 24,
          textAlign: 'center',
        }}>
          {/* QR Code */}
          <div style={{
            background: '#fff',
            padding: 16,
            borderRadius: 8,
            display: 'inline-block',
            marginBottom: 16,
          }}>
            <QRCode
              value={qrValue}
              size={200}
              level="M"
              bgColor="#ffffff"
              fgColor="#0C0C0B"
            />
          </div>

          {/* Course + time info */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0C0C0B' }}>
              {courseName}
            </div>
            <div style={{ fontSize: 12, color: '#847C72', marginTop: 2 }}>
              {date} · {time}
            </div>
          </div>

          {/* Fallback text code */}
          <div style={{
            background: '#f5f5f5',
            borderRadius: 4,
            padding: '8px 16px',
            display: 'inline-block',
          }}>
            <span style={{
              fontFamily: 'monospace',
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: '0.15em',
              color: '#0C0C0B',
            }}>
              {shortCode}
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#847C72', marginTop: 8 }}>
            Show this QR code at the pro shop. They'll scan it to check you in.
          </div>
        </div>
      )}
    </div>
  )
}
