export type CellType = 'goal' | 'behavior' | 'behavior_mirror' | 'action'

export interface HaradaChart {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ChartCell {
  id: string
  chart_id: string
  row_index: number
  col_index: number
  cell_type: CellType
  content: string
  created_at: string
  updated_at: string
}

export interface GridPosition {
  row: number
  col: number
}

export interface CellMetadata {
  type: CellType
  belongsToSection?: number // 0-8 for sections, undefined for center cells
  mirrorsBehaviorAt?: { row: number, col: number } // For behavior_mirror cells
}

export type CycleStatus = 'planned' | 'in_progress' | 'completed'

export interface WeeklyCycle {
  id: string
  chart_id: string
  week_start_date: string
  week_end_date: string
  status: CycleStatus
  start_journal: string
  end_review: string
  created_at: string
  updated_at: string
}

export type CompletionStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'partial'

export interface WeeklyAction {
  id: string
  cycle_id: string
  cell_id: string
  is_selected: boolean
  completion_status: CompletionStatus
  reflection_notes: string
  score: number | null
  completed_date: string | null
  created_at: string
  updated_at: string
}

export interface WeeklyActionWithCell extends WeeklyAction {
  cell: ChartCell
}
