'use client'

import { useState, useEffect, useRef } from 'react'
import { ChartCell } from '@/lib/types'
import { getCellMetadata, getCellStyles } from '@/lib/grid-utils'

interface HaradaCellProps {
  row: number
  col: number
  cell?: ChartCell
  behaviorCell?: ChartCell // For behavior_mirror cells
  onUpdate: (row: number, col: number, content: string) => void
}

export default function HaradaCell({ row, col, cell, behaviorCell, onUpdate }: HaradaCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(cell?.content || '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const metadata = getCellMetadata(row, col)
  const cellStyles = getCellStyles(metadata)

  // For behavior mirrors, display is read-only and shows behavior content
  const isBehaviorMirror = metadata.type === 'behavior_mirror'
  const displayContent = isBehaviorMirror ? (behaviorCell?.content || '') : content

  useEffect(() => {
    setContent(cell?.content || '')
  }, [cell?.content])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  const handleBlur = () => {
    setIsEditing(false)
    if (content !== (cell?.content || '')) {
      onUpdate(row, col, content)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleBlur()
    }
    if (e.key === 'Escape') {
      setContent(cell?.content || '')
      setIsEditing(false)
    }
  }

  const getPlaceholder = () => {
    switch (metadata.type) {
      case 'goal':
        return 'Enter your main goal...'
      case 'behavior':
        return 'Enter a key behavior...'
      case 'behavior_mirror':
        return 'Define the behavior above...'
      case 'action':
        return 'Enter an action...'
      default:
        return ''
    }
  }

  return (
    <div
      className={`${cellStyles} min-h-[80px] p-2 ${!isBehaviorMirror ? 'cursor-pointer' : 'cursor-default'}`}
      onClick={() => !isEditing && !isBehaviorMirror && setIsEditing(true)}
    >
      {isEditing && !isBehaviorMirror ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          className="w-full h-full min-h-[60px] bg-transparent border-none outline-none resize-none text-sm text-gray-900 placeholder:text-gray-500"
        />
      ) : (
        <div className="text-sm whitespace-pre-wrap break-words text-gray-900">
          {displayContent || (
            <span className="text-gray-500 italic">{getPlaceholder()}</span>
          )}
        </div>
      )}

      {/* Cell type indicator */}
      <div className="absolute top-1 right-1 text-xs text-gray-600">
        {metadata.type === 'goal' && '🎯'}
        {metadata.type === 'behavior' && '⭐'}
        {metadata.type === 'behavior_mirror' && '⭐'}
        {metadata.type === 'action' && '✓'}
      </div>
    </div>
  )
}
