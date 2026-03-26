'use client'

import { useRouter } from 'next/navigation'
import QueueCard from './queue-card'

type QueueEmail = {
  id: string
  touchNumber: number
  subject: string
  body: string
  courseName: string
  prospectId: string
  scheduledSendAt: Date
}

export default function QueueList({ emails }: { emails: QueueEmail[] }) {
  const router = useRouter()
  return (
    <>
      {emails.map(email => (
        <QueueCard key={email.id} email={email} onDone={() => router.refresh()} />
      ))}
    </>
  )
}
