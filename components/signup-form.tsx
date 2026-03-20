'use client'

import { useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUpWithEmail, signInWithGoogle } from '@/actions/auth'

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type FormValues = z.infer<typeof schema>

export function SignupForm() {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') ?? 'core'
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
      formData.set('fullName', values.fullName)
      formData.set('plan', plan)
      const result = await signUpWithEmail(formData)
      if (result?.error) setServerError(result.error)
    })
  }

  function handleGoogle() {
    startTransition(async () => {
      const result = await signInWithGoogle(plan)
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
          <Label htmlFor="fullName" className="text-white/70 text-sm mb-1.5">Full name</Label>
          <Input
            id="fullName"
            placeholder="Mike Johnson"
            {...register('fullName')}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
          {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>}
        </div>

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
            placeholder="8+ characters"
            {...register('password')}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 mt-1"
        >
          {isPending ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>
    </div>
  )
}
