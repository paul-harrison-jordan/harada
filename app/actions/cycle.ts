'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Get the Monday of the current week
 */
function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(d.setDate(diff))
}

/**
 * Get the Sunday of the current week
 */
function getSunday(date: Date): Date {
  const monday = getMonday(date)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return sunday
}

/**
 * Get or create the current week's cycle (with pre-selected actions for demo)
 */
export async function getCurrentCycle(chartId: string) {
  const supabase = await createClient()

  const monday = getMonday(new Date())
  const sunday = getSunday(new Date())

  // Try to find existing cycle for this week that is not completed
  const { data: existingCycle } = await supabase
    .from('weekly_cycles')
    .select('*')
    .eq('chart_id', chartId)
    .eq('week_start_date', monday.toISOString().split('T')[0])
    .neq('status', 'completed')
    .single()

  if (existingCycle) {
    return existingCycle
  }

  // Create new cycle if none exists or if the existing one is completed
  const { data: newCycle, error } = await supabase
    .from('weekly_cycles')
    .insert({
      chart_id: chartId,
      week_start_date: monday.toISOString().split('T')[0],
      week_end_date: sunday.toISOString().split('T')[0],
      status: 'planned',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create cycle: ${error.message}`)
  }

  // Pre-select 5 random actions for demo purposes
  try {
    await selectRandomActions(newCycle.id, chartId)
  } catch (err) {
    // Don't fail cycle creation if action selection fails
    console.error('Failed to pre-select actions:', err)
  }

  return newCycle
}

/**
 * Helper function to select 5 random actions for a cycle
 */
async function selectRandomActions(cycleId: string, chartId: string) {
  const supabase = await createClient()

  // Get all action cells from the chart
  const { data: actionCells, error: fetchError } = await supabase
    .from('chart_cells')
    .select('id, content, row_index, col_index')
    .eq('chart_id', chartId)
    .eq('cell_type', 'action')
    .not('content', 'is', null)
    .neq('content', '')

  if (fetchError) {
    throw new Error(`Failed to fetch action cells: ${fetchError.message}`)
  }

  if (!actionCells || actionCells.length === 0) {
    // No actions to select, that's okay for a new chart
    return
  }

  // Randomly select 5 actions (or fewer if less than 5 exist)
  const shuffled = [...actionCells].sort(() => Math.random() - 0.5)
  const selectedActions = shuffled.slice(0, Math.min(5, actionCells.length))

  // Insert selected actions into weekly_actions table
  const weeklyActionsToInsert = selectedActions.map(action => ({
    cycle_id: cycleId,
    cell_id: action.id,
    is_selected: true,
    completion_status: 'not_started',
  }))

  const { error: insertError } = await supabase
    .from('weekly_actions')
    .insert(weeklyActionsToInsert)

  if (insertError) {
    throw new Error(`Failed to create weekly actions: ${insertError.message}`)
  }
}

/**
 * Start a cycle (set status to in_progress and save start journal)
 * Note: Actions are pre-selected when cycle is created
 */
export async function startCycle(cycleId: string, chartId: string, startJournal: string) {
  const supabase = await createClient()

  // Check if actions exist for this cycle
  const { data: existingActions } = await supabase
    .from('weekly_actions')
    .select('id')
    .eq('cycle_id', cycleId)
    .limit(1)

  // If no actions exist, select them now (fallback for older cycles)
  if (!existingActions || existingActions.length === 0) {
    try {
      await selectRandomActions(cycleId, chartId)
    } catch (err) {
      throw new Error('No actions found in your chart. Please add some actions first.')
    }
  }

  // Update cycle status
  const { error: updateError } = await supabase
    .from('weekly_cycles')
    .update({
      status: 'in_progress',
      start_journal: startJournal,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cycleId)

  if (updateError) {
    throw new Error(`Failed to start cycle: ${updateError.message}`)
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
}

/**
 * Complete a cycle (set status to completed and save end review)
 */
export async function completeCycle(cycleId: string, endReview: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('weekly_cycles')
    .update({
      status: 'completed',
      end_review: endReview,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cycleId)

  if (error) {
    throw new Error(`Failed to complete cycle: ${error.message}`)
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
}

/**
 * Get all completed cycles for a chart
 */
export async function getCompletedCycles(chartId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('weekly_cycles')
    .select('*')
    .eq('chart_id', chartId)
    .eq('status', 'completed')
    .order('week_start_date', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch completed cycles: ${error.message}`)
  }

  return data || []
}

/**
 * Get weekly actions for a specific cycle with cell details
 */
export async function getWeeklyActions(cycleId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('weekly_actions')
    .select(`
      *,
      cell:chart_cells(*)
    `)
    .eq('cycle_id', cycleId)
    .order('created_at')

  if (error) {
    throw new Error(`Failed to fetch weekly actions: ${error.message}`)
  }

  return data || []
}

/**
 * Add or update note for a weekly action
 */
export async function updateActionNote(actionId: string, note: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('weekly_actions')
    .update({
      reflection_notes: note,
      updated_at: new Date().toISOString(),
    })
    .eq('id', actionId)

  if (error) {
    throw new Error(`Failed to update action note: ${error.message}`)
  }

  revalidatePath('/')
}

/**
 * Update completion status for a weekly action
 */
export async function updateActionStatus(
  actionId: string,
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'partial'
) {
  const supabase = await createClient()

  const updates: any = {
    completion_status: status,
    updated_at: new Date().toISOString(),
  }

  // Set completed_date if marking as completed
  if (status === 'completed') {
    updates.completed_date = new Date().toISOString().split('T')[0]
  }

  const { error } = await supabase
    .from('weekly_actions')
    .update(updates)
    .eq('id', actionId)

  if (error) {
    throw new Error(`Failed to update action status: ${error.message}`)
  }

  revalidatePath('/')
}

/**
 * Update score for a weekly action (0-5)
 */
export async function updateActionScore(actionId: string, score: number) {
  const supabase = await createClient()

  if (score < 0 || score > 5) {
    throw new Error('Score must be between 0 and 5')
  }

  const { error } = await supabase
    .from('weekly_actions')
    .update({
      score,
      updated_at: new Date().toISOString(),
    })
    .eq('id', actionId)

  if (error) {
    throw new Error(`Failed to update action score: ${error.message}`)
  }

  revalidatePath('/')
}
