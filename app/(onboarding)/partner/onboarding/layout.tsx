import { OnboardingNav } from '@/components/partner/onboarding-nav'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F4EEE3', display: 'flex', flexDirection: 'column' }}>
      <OnboardingNav />
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  )
}
