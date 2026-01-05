import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser, signOut } from '@/app/actions/auth'
import { getOrCreateChart } from '@/app/actions/chart'
import { getCurrentCycle, startCycle, completeCycle, getWeeklyActions } from '@/app/actions/cycle'
import WeeklyActions from '@/components/WeeklyActions'

export default async function Home() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const chart = await getOrCreateChart()
  const currentCycle = await getCurrentCycle(chart.id)

  // Get weekly actions for all cycle states (for demo purposes)
  const weeklyActions = await getWeeklyActions(currentCycle.id)

  async function handleStartCycle(formData: FormData) {
    'use server'
    const startJournal = formData.get('start_journal') as string
    await startCycle(currentCycle.id, chart.id, startJournal)
  }

  async function handleCompleteCycle(formData: FormData) {
    'use server'
    const endReview = formData.get('end_review') as string
    await completeCycle(currentCycle.id, endReview)
  }

  const weekStart = new Date(currentCycle.week_start_date)
  const weekEnd = new Date(currentCycle.week_end_date)
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {user.user_metadata?.full_name || user.email}
            </h1>
          </div>
          <div className="flex gap-4">
            <Link
              href="/calendar"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              View Calendar
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Current Cycle Card */}
        <div className="bg-white rounded-lg shadow-lg border-2 border-gray-300 p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Current Week
              </h2>
              <p className="text-xl text-gray-700">
                {formatDate(weekStart)} - {formatDate(weekEnd)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-600 uppercase">Status:</span>
              <span className={`px-4 py-2 rounded-full font-bold text-sm ${
                currentCycle.status === 'planned'
                  ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'
                  : currentCycle.status === 'in_progress'
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-400'
                  : 'bg-green-100 text-green-800 border-2 border-green-400'
              }`}>
                {currentCycle.status === 'planned' ? 'Not Started' :
                 currentCycle.status === 'in_progress' ? 'In Progress' : 'Completed'}
              </span>
            </div>
          </div>

          {/* Planned State */}
          {currentCycle.status === 'planned' && (
            <div className="space-y-6">
              {/* Preview of Selected Actions */}
              {weeklyActions.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Your Actions for This Week
                  </h3>
                  <p className="text-gray-700 mb-4">
                    These 5 actions were randomly selected from your chart. Review them before starting your week.
                  </p>
                  <div className="space-y-2">
                    {weeklyActions.map((action, index) => (
                      <div
                        key={action.id}
                        className="bg-white border-2 border-gray-300 rounded-lg p-4 flex items-center gap-3"
                      >
                        <span className="text-2xl font-bold text-blue-600">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-gray-900 flex-1">
                          {action.cell.content}
                        </span>
                        <span className="px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-700 border-2 border-gray-300">
                          Ready
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form action={handleStartCycle} className="space-y-4 mt-6 pt-6 border-t-2 border-gray-300">
                <div>
                  <label htmlFor="start_journal" className="block text-lg font-semibold text-gray-900 mb-2">
                    Start of Week Reflection
                  </label>
                  <textarea
                    id="start_journal"
                    name="start_journal"
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-base"
                    placeholder="What are your intentions for this week? What do you want to focus on?"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg"
                >
                  Start This Week
                </button>
              </form>
            </div>
          )}

          {/* In Progress State */}
          {currentCycle.status === 'in_progress' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">Week Started With:</h3>
                <p className="text-gray-800 whitespace-pre-wrap">{currentCycle.start_journal}</p>
              </div>

              {/* Weekly Actions */}
              <WeeklyActions actions={weeklyActions} />

              <form action={handleCompleteCycle} className="space-y-4 mt-8 pt-8 border-t-2 border-gray-300">
                <div>
                  <label htmlFor="end_review" className="block text-lg font-semibold text-gray-900 mb-2">
                    End of Week Review
                  </label>
                  <textarea
                    id="end_review"
                    name="end_review"
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 text-base"
                    placeholder="How did the week go? What did you accomplish? What did you learn?"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg"
                >
                  Complete This Week
                </button>
              </form>
            </div>
          )}

          {/* Completed State - Should not show since getCurrentCycle filters these out */}
          {currentCycle.status === 'completed' && (
            <div className="bg-red-50 border-2 border-red-400 rounded-lg p-6 text-center">
              <p className="text-red-800 font-semibold">
                This cycle was already completed. Please refresh the page to see your new week.
              </p>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/dashboard"
            className="bg-white hover:bg-gray-50 rounded-lg shadow-lg border-2 border-gray-300 p-6 transition-colors"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">📊 View Your Chart</h3>
            <p className="text-gray-700">
              Edit your Harada Method chart and plan your goals, behaviors, and actions.
            </p>
          </Link>
          <Link
            href="/calendar"
            className="bg-white hover:bg-gray-50 rounded-lg shadow-lg border-2 border-gray-300 p-6 transition-colors"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">📅 View Past Weeks</h3>
            <p className="text-gray-700">
              Review your completed weekly cycles and track your progress over time.
            </p>
          </Link>
        </div>
      </main>
    </div>
  )
}
