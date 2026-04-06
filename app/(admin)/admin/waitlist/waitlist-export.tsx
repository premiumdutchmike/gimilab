'use client'

interface Entry {
  name: string
  email: string
  roundsPerMonth: string | null
  city: string | null
  referralCode: string
  referredBy: string | null
  referredByName: string | null
  referralCount: number
  createdAt: string
}

export default function WaitlistExport({ entries }: { entries: Entry[] }) {
  function exportCSV() {
    const headers = ['Name', 'Email', 'Plays/mo', 'City', 'Referral Code', 'Referred By', 'Referred By Name', 'Referrals Made', 'Joined']
    const rows = entries.map(e => [
      e.name,
      e.email,
      e.roundsPerMonth ?? '',
      e.city ?? '',
      e.referralCode,
      e.referredBy ?? '',
      e.referredByName ?? '',
      String(e.referralCount),
      e.createdAt.split('T')[0],
    ])

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gimmelab-waitlist-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button onClick={exportCSV} style={{
      padding: '10px 20px',
      background: '#111',
      color: '#fff',
      fontSize: 12,
      fontWeight: 700,
      fontFamily: 'var(--font-inter), Inter, sans-serif',
      border: 'none',
      borderRadius: 2,
      cursor: 'pointer',
      letterSpacing: '0.04em',
    }}>
      Export CSV
    </button>
  )
}
