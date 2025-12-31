import { CellMetadata, CellType } from './types'

/**
 * Determines the cell type and metadata based on position in 9x9 grid
 *
 * Grid layout:
 * - Center 3x3 (rows 3-5, cols 3-5): Main goal at (4,4), 8 behaviors around it
 * - 8 surrounding 3x3 sections: Each behavior has 8 actions around it
 */
export function getCellMetadata(row: number, col: number): CellMetadata {
  // Center cell (4, 4) is the main goal
  if (row === 4 && col === 4) {
    return { type: 'goal' }
  }

  // Center 3x3 section (rows 3-5, cols 3-5) contains behaviors
  const isInCenter = row >= 3 && row <= 5 && col >= 3 && col <= 5
  if (isInCenter) {
    return { type: 'behavior' }
  }

  // Determine which section this cell belongs to
  const sectionRow = Math.floor(row / 3) // 0, 1, or 2
  const sectionCol = Math.floor(col / 3) // 0, 1, or 2

  // Map section position to behavior index (0-7, skipping center)
  // Layout:
  //   0  1  2
  //   3  X  4
  //   5  6  7
  let sectionIndex: number
  if (sectionRow === 0) {
    sectionIndex = sectionCol // 0, 1, 2
  } else if (sectionRow === 1) {
    sectionIndex = sectionCol === 0 ? 3 : 4 // 3, skip center, 4
  } else {
    sectionIndex = 5 + sectionCol // 5, 6, 7
  }

  return {
    type: 'action',
    belongsToSection: sectionIndex
  }
}

/**
 * Gets the behavior position for a given section index
 */
export function getBehaviorPosition(sectionIndex: number): { row: number, col: number } {
  const positions = [
    { row: 3, col: 3 }, // top-left
    { row: 3, col: 4 }, // top-center
    { row: 3, col: 5 }, // top-right
    { row: 4, col: 3 }, // middle-left
    { row: 4, col: 5 }, // middle-right
    { row: 5, col: 3 }, // bottom-left
    { row: 5, col: 4 }, // bottom-center
    { row: 5, col: 5 }, // bottom-right
  ]
  return positions[sectionIndex]
}

/**
 * Gets styling classes based on cell type
 */
export function getCellStyles(metadata: CellMetadata): string {
  const baseClasses = 'relative border transition-colors'

  switch (metadata.type) {
    case 'goal':
      return `${baseClasses} bg-blue-50 border-blue-400 font-bold`
    case 'behavior':
      return `${baseClasses} bg-green-50 border-green-300 font-semibold`
    case 'action':
      return `${baseClasses} bg-gray-50 border-gray-200 hover:bg-gray-100`
    default:
      return baseClasses
  }
}
