'use client'

import { useState } from 'react'
import { updateActionNote, updateActionStatus, updateActionScore } from '@/app/actions/cycle'

interface WeeklyAction {
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

interface WeeklyActionsProps {
  actions: WeeklyAction[]
}

export default function WeeklyActions({ actions }: WeeklyActionsProps) {
  const [expandedAction, setExpandedAction] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteContent, setNoteContent] = useState<{ [key: string]: string }>({})

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-400'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-400'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-400'
      case 'skipped':
        return 'bg-gray-100 text-gray-800 border-gray-400'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'Not Started'
      case 'in_progress':
        return 'In Progress'
      case 'completed':
        return 'Completed'
      case 'partial':
        return 'Partial'
      case 'skipped':
        return 'Skipped'
      default:
        return status
    }
  }

  const handleStatusChange = async (actionId: string, newStatus: string) => {
    try {
      await updateActionStatus(actionId, newStatus as any)
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleScoreChange = async (actionId: string, score: number) => {
    try {
      await updateActionScore(actionId, score)
    } catch (error) {
      console.error('Failed to update score:', error)
    }
  }

  const handleNoteSave = async (actionId: string) => {
    try {
      const note = noteContent[actionId] || ''
      await updateActionNote(actionId, note)
      setEditingNote(null)
    } catch (error) {
      console.error('Failed to save note:', error)
    }
  }

  const startEditingNote = (actionId: string, currentNote: string) => {
    setNoteContent({ ...noteContent, [actionId]: currentNote })
    setEditingNote(actionId)
  }

  if (actions.length === 0) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center">
        <p className="text-lg text-gray-800 font-medium">
          No actions selected for this week yet.
        </p>
        <p className="text-gray-600 mt-2">
          Actions will be randomly selected when you start the week.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        Your Weekly Focus Actions
      </h3>
      <p className="text-gray-700 mb-6">
        These 5 actions were randomly selected from your chart. Track your progress throughout the week!
      </p>

      {actions.map((action, index) => (
        <div
          key={action.id}
          className="bg-white border-2 border-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          {/* Action Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-bold text-blue-600">
                  {index + 1}
                </span>
                <h4 className="text-lg font-bold text-gray-900">
                  {action.cell.content}
                </h4>
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-semibold text-gray-700">Status:</label>
                <select
                  value={action.completion_status}
                  onChange={(e) => handleStatusChange(action.id, e.target.value)}
                  className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${getStatusColor(action.completion_status)}`}
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="partial">Partial</option>
                  <option value="completed">Completed</option>
                  <option value="skipped">Skipped</option>
                </select>
              </div>

              {/* Score */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-gray-700">Self-Rating:</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleScoreChange(action.id, star)}
                      className={`text-2xl transition-colors ${
                        action.score && star <= action.score
                          ? 'text-yellow-500'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {action.score && (
                  <span className="text-sm text-gray-600 ml-2">
                    {action.score}/5
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setExpandedAction(expandedAction === action.id ? null : action.id)}
              className="text-gray-600 hover:text-gray-900 font-bold text-xl"
            >
              {expandedAction === action.id ? '▼' : '▶'}
            </button>
          </div>

          {/* Expanded Notes Section */}
          {expandedAction === action.id && (
            <div className="mt-4 pt-4 border-t-2 border-gray-200">
              <div className="mb-3">
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Notes & Reflections
                </label>

                {editingNote === action.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={noteContent[action.id] || ''}
                      onChange={(e) => setNoteContent({ ...noteContent, [action.id]: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      rows={4}
                      placeholder="Add notes about what you did, challenges you faced, or insights you gained..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleNoteSave(action.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                      >
                        Save Note
                      </button>
                      <button
                        onClick={() => setEditingNote(null)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {action.reflection_notes ? (
                      <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 mb-2">
                        <p className="text-gray-800 whitespace-pre-wrap">
                          {action.reflection_notes}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-2">
                        <p className="text-gray-500 italic">
                          No notes yet. Click "Add Note" to track your progress.
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => startEditingNote(action.id, action.reflection_notes)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm"
                    >
                      {action.reflection_notes ? 'Edit Note' : 'Add Note'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
