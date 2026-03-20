'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setMessage(error.message)
      } else {
        router.push('/dashboard')
      }
    })
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: '#090f1a' }}>
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-6">Set new password</h1>
        {message && <p className="text-red-400 text-sm mb-4">{message}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <Label htmlFor="password" className="text-white/70 text-sm mb-1.5">New password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="8+ characters"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
          <Button type="submit" disabled={isPending} className="bg-green-400 text-black font-semibold hover:bg-green-300">
            {isPending ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </div>
    </main>
  )
}
