'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInWithEmail, signInWithGoogle } from '@/actions/auth'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password required'),
})
type FormValues = z.infer<typeof schema>

export function LoginForm() {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  function onSubmit(values: FormValues) {
    setServerError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('email', values.email)
      formData.set('password', values.password)
      const result = await signInWithEmail(formData)
      if (result?.error) setServerError(result.error)
    })
  }

  function handleGoogle() {
    startTransition(async () => {
      const result = await signInWithGoogle('core')
      if (result?.error) setServerError(result.error)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {serverError && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {serverError}
        </div>
      )}

      <Button
        type="button"
        onClick={handleGoogle}
        disabled={isPending}
        className="w-full bg-green-400 hover:bg-green-300 text-black font-semibold"
      >
        Continue with Google
      </Button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-white/30 text-xs">or</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <div>
          <Label htmlFor="email" className="text-white/70 text-sm mb-1.5">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="mike@example.com"
            {...register('email')}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <Label htmlFor="password" className="text-white/70 text-sm mb-1.5">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Your password"
            {...register('password')}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="text-xs text-white/40 hover:text-white/60"
            onClick={async () => {
              const email = (document.getElementById('email') as HTMLInputElement)?.value
              if (!email) return
              const { createBrowserClient } = await import('@supabase/ssr')
              const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
              )
              await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
              })
              alert('Password reset email sent.')
            }}
          >
            Forgot password?
          </button>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
        >
          {isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}
