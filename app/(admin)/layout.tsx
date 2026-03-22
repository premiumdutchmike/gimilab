import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminNav from '@/components/admin-nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') {
    redirect('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
      <AdminNav />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  )
}
