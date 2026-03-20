'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

interface PricingTierRowProps {
  id: string
  name: string
  monthlyPriceCents: number
  monthlyCredits: number
  rolloverMax: number
  isPopular?: boolean
}

export function PricingTierRow({
  id,
  name,
  monthlyPriceCents,
  monthlyCredits,
  rolloverMax,
  isPopular,
}: PricingTierRowProps) {
  const router = useRouter()
  const price = (monthlyPriceCents / 100).toFixed(2)

  return (
    <button
      onClick={() => router.push(`/signup?plan=${id}`)}
      className={`w-full flex items-center justify-between rounded-xl border p-5 text-left transition-colors hover:border-green-400/60 hover:bg-white/5 ${
        isPopular
          ? 'border-green-400 bg-green-400/5'
          : 'border-white/10 bg-white/[0.02]'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="h-2 w-2 rounded-full bg-green-400" />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{name}</span>
            {isPopular && (
              <Badge className="bg-green-400 text-black text-[10px] font-bold px-2 py-0.5">
                POPULAR
              </Badge>
            )}
          </div>
          <p className="text-sm text-white/50 mt-0.5">
            {monthlyCredits} credits · up to {rolloverMax} rollover
          </p>
        </div>
      </div>
      <div className="text-right">
        <span className="text-xl font-bold text-white">${price}</span>
        <span className="text-white/40 text-sm">/mo</span>
      </div>
    </button>
  )
}
