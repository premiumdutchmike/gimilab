import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { courses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { CourseCard } from '@/components/course-card'

export const metadata = { title: 'Golf Courses — OneGolf' }

export default async function CoursesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const activeCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.status, 'active'))

  return (
    <main className="min-h-screen px-4 py-12" style={{ background: '#090f1a' }}>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">Golf Courses</h1>

        {activeCourses.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center">
            <p className="text-white/40 text-sm">No courses available yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
