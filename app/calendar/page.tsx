import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser, signOut } from '@/app/actions/auth'
import { getOrCreateChart } from '@/app/actions/chart'
import { getCompletedCycles, getWeeklyActions } from '@/app/actions/cycle'
import { WeeklyCycle } from '@/lib/types'

interface WeeklyActionWithCell {
  id: string
  completion_status: string
  reflection_notes: string
  score: number | null
  cell: {
    content: string
    row_index: number
    col_index: number
  }
}

interface CycleWithActions extends WeeklyCycle {
  actions: WeeklyActionWithCell[]
}

export default async function CalendarPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const chart = await getOrCreateChart()
  const completedCycles = await getCompletedCycles(chart.id)

  // Fetch weekly actions for each completed cycle
  const cyclesWithActions: CycleWithActions[] = await Promise.all(
    completedCycles.map(async (cycle) => ({
      ...cycle,
      actions: await getWeeklyActions(cycle.id) as WeeklyActionWithCell[],
    }))
  )

  const formatDate = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Weekly Calendar</h1>
          </div>
          <div className="flex gap-4">
            <Link
              href="/"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition-colors font-medium"
            >
              View Chart
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
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Completed Weekly Cycles</h2>
          <p className="text-gray-700 text-lg">
            Review your past weeks and track your progress over time.
          </p>
        </div>

        {cyclesWithActions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg border-2 border-gray-300 p-12 text-center">
            <p className="text-xl text-gray-600 mb-4">No completed cycles yet</p>
            <p className="text-gray-500 mb-6">
              Complete your first weekly cycle to see it here!
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Go to Current Week
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {cyclesWithActions.map((cycle) => (
              <div
                key={cycle.id}
                className="bg-white rounded-lg shadow-lg border-2 border-gray-300 p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      {formatDateRange(cycle.week_start_date, cycle.week_end_date)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Completed on {formatDate(cycle.updated_at)}
                    </p>
                  </div>
                  <span className="px-4 py-2 rounded-full font-bold text-sm bg-green-100 text-green-800 border-2 border-green-400">
                    Completed
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Start Journal */}
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                    <h4 className="font-bold text-gray-900 mb-2 text-base flex items-center gap-2">
                      <span>📝</span> Week Started With:
                    </h4>
                    <p className="text-gray-800 whitespace-pre-wrap">{cycle.start_journal}</p>
                  </div>

                  {/* Weekly Actions */}
                  {cycle.actions && cycle.actions.length > 0 && (
                    <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-3 text-base flex items-center gap-2">
                        <span>🎯</span> Weekly Actions:
                      </h4>
                      <div className="space-y-2">
                        {cycle.actions.map((action, index) => (
                          <div key={action.id} className="bg-white border border-gray-300 rounded p-3">
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-blue-600 text-sm">{index + 1}.</span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-semibold text-gray-900">
                                    {action.cell.content}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                                      action.completion_status === 'completed'
                                        ? 'bg-green-100 text-green-800 border-green-400'
                                        : action.completion_status === 'in_progress'
                                        ? 'bg-blue-100 text-blue-800 border-blue-400'
                                        : action.completion_status === 'partial'
                                        ? 'bg-yellow-100 text-yellow-800 border-yellow-400'
                                        : 'bg-gray-100 text-gray-800 border-gray-400'
                                    }`}>
                                      {action.completion_status === 'not_started' ? 'Not Started' :
                                       action.completion_status === 'in_progress' ? 'In Progress' :
                                       action.completion_status === 'completed' ? 'Completed' :
                                       action.completion_status === 'partial' ? 'Partial' : 'Skipped'}
                                    </span>
                                    {action.score && (
                                      <span className="text-yellow-500 text-sm font-bold">
                                        {'★'.repeat(action.score)} ({action.score}/5)
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {action.reflection_notes && (
                                  <p className="text-gray-700 text-sm mt-2 pl-2 border-l-2 border-gray-300">
                                    {action.reflection_notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* End Review */}
                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                    <h4 className="font-bold text-gray-900 mb-2 text-base flex items-center gap-2">
                      <span>✅</span> Week Completed With:
                    </h4>
                    <p className="text-gray-800 whitespace-pre-wrap">{cycle.end_review}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
