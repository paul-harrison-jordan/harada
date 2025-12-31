'use client'

import { useState, useEffect, useRef } from 'react'
import { ChartCell } from '@/lib/types'
import { getCellMetadata, getCellStyles } from '@/lib/grid-utils'

interface HaradaCellProps {
  row: number
  col: number
  cell?: ChartCell
  onUpdate: (row: number, col: number, content: string) => void
}

export default function HaradaCell({ row, col, cell, onUpdate }: HaradaCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(cell?.content || '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setContent(cell?.content || '')
  }, [cell?.content])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  const metadata = getCellMetadata(row, col)
  const cellStyles = getCellStyles(metadata)

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
      case 'action':
        return 'Enter an action...'
      default:
        return ''
    }
  }

  return (
    <div
      className={`${cellStyles} min-h-[80px] p-2 cursor-pointer`}
      onClick={() => !isEditing && setIsEditing(true)}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          className="w-full h-full min-h-[60px] bg-transparent border-none outline-none resize-none text-sm"
        />
      ) : (
        <div className="text-sm whitespace-pre-wrap break-words">
          {content || (
            <span className="text-gray-400 italic">{getPlaceholder()}</span>
          )}
        </div>
      )}

      {/* Cell type indicator */}
      <div className="absolute top-1 right-1 text-[10px] text-gray-400 uppercase">
        {metadata.type === 'goal' && '🎯'}
        {metadata.type === 'behavior' && '⭐'}
        {metadata.type === 'action' && '✓'}
      </div>
    </div>
  )
}
