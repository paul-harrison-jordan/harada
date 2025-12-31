'use client'

import { useState, useCallback } from 'react'
import HaradaCell from './HaradaCell'
import { ChartCell } from '@/lib/types'
import { getCellMetadata } from '@/lib/grid-utils'

interface HaradaGridProps {
  cells: ChartCell[]
  onCellUpdate: (row: number, col: number, content: string) => Promise<void>
}

export default function HaradaGrid({ cells, onCellUpdate }: HaradaGridProps) {
  const [loading, setLoading] = useState(false)

  // Create a map for quick cell lookup
  const cellMap = new Map(
    cells.map(cell => [`${cell.row_index}-${cell.col_index}`, cell])
  )

  const handleCellUpdate = useCallback(async (row: number, col: number, content: string) => {
    setLoading(true)
    try {
      await onCellUpdate(row, col, content)
    } catch (error) {
      console.error('Failed to update cell:', error)
    } finally {
      setLoading(false)
    }
  }, [onCellUpdate])

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      {/* Grid Title */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800">Harada Method Chart</h1>
        <p className="text-gray-600 mt-2">
          Define your goal, key behaviors, and actionable steps
        </p>
      </div>

      {/* 9x9 Grid */}
      <div className="grid grid-cols-9 gap-0 border-2 border-gray-400 bg-white shadow-lg">
        {Array.from({ length: 9 }, (_, row) =>
          Array.from({ length: 9 }, (_, col) => {
            const cell = cellMap.get(`${row}-${col}`)
            const metadata = getCellMetadata(row, col)

            // For behavior mirrors, get the content from the original behavior cell
            let behaviorCell: ChartCell | undefined
            if (metadata.type === 'behavior_mirror' && metadata.mirrorsBehaviorAt) {
              const behaviorKey = `${metadata.mirrorsBehaviorAt.row}-${metadata.mirrorsBehaviorAt.col}`
              behaviorCell = cellMap.get(behaviorKey)
            }

            return (
              <HaradaCell
                key={`${row}-${col}`}
                row={row}
                col={col}
                cell={cell}
                behaviorCell={behaviorCell}
                onUpdate={handleCellUpdate}
              />
            )
          })
        )}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Saving...
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex justify-center gap-6 text-base font-medium">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-blue-100 border-2 border-blue-600"></div>
          <span className="text-gray-900">🎯 Main Goal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-green-100 border-2 border-green-600"></div>
          <span className="text-gray-900">⭐ Key Behaviors</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-white border-2 border-gray-400"></div>
          <span className="text-gray-900">✓ Actions</span>
        </div>
      </div>
    </div>
  )
}
