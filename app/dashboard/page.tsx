import { redirect } from 'next/navigation'
import { getUser, signOut } from '@/app/actions/auth'
import { getOrCreateChart, getChartCells, updateCell } from '@/app/actions/chart'
import HaradaGrid from '@/components/HaradaGrid'

export default async function DashboardPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const chart = await getOrCreateChart()
  const cells = await getChartCells(chart.id)

  async function handleCellUpdate(row: number, col: number, content: string) {
    'use server'
    await updateCell(chart.id, row, col, content)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome, {user.user_metadata?.full_name || user.email}
            </h1>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <HaradaGrid cells={cells} onCellUpdate={handleCellUpdate} />
      </main>

      {/* Instructions */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            How to Use Your Harada Chart
          </h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <strong>1. Set Your Main Goal (🎯)</strong>
              <p className="ml-4">
                Click the center cell to define your primary goal for the year.
              </p>
            </div>
            <div>
              <strong>2. Define Key Behaviors (⭐)</strong>
              <p className="ml-4">
                The 8 cells surrounding your goal represent the essential behaviors
                you need to adopt to achieve your goal.
              </p>
            </div>
            <div>
              <strong>3. Plan Specific Actions (✓)</strong>
              <p className="ml-4">
                Each behavior is surrounded by 8 action cells. Fill these with
                concrete, actionable steps you'll take to develop each behavior.
              </p>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm">
                <strong>💡 Tip:</strong> Click any cell to edit it. Press Enter to save,
                or Escape to cancel. Your changes are automatically saved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
