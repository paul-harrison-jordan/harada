'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCellMetadata } from '@/lib/grid-utils'

export async function getOrCreateChart() {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Not authenticated')
  }

  // Try to get existing chart
  const { data: existingChart, error: fetchError } = await supabase
    .from('harada_charts')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (existingChart) {
    return existingChart
  }

  // Create new chart if none exists
  const { data: newChart, error: createError } = await supabase
    .from('harada_charts')
    .insert({
      user_id: user.id,
      title: 'My Harada Chart',
    })
    .select()
    .single()

  if (createError) {
    throw new Error(`Failed to create chart: ${createError.message}`)
  }

  return newChart
}

export async function getChartCells(chartId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('chart_cells')
    .select('*')
    .eq('chart_id', chartId)
    .order('row_index')
    .order('col_index')

  if (error) {
    throw new Error(`Failed to fetch cells: ${error.message}`)
  }

  return data || []
}

export async function updateCell(
  chartId: string,
  row: number,
  col: number,
  content: string
) {
  const supabase = await createClient()

  const metadata = getCellMetadata(row, col)

  // Check if cell exists
  const { data: existingCell } = await supabase
    .from('chart_cells')
    .select('id')
    .eq('chart_id', chartId)
    .eq('row_index', row)
    .eq('col_index', col)
    .single()

  if (existingCell) {
    // Update existing cell
    const { error } = await supabase
      .from('chart_cells')
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingCell.id)

    if (error) {
      throw new Error(`Failed to update cell: ${error.message}`)
    }
  } else {
    // Insert new cell
    const { error } = await supabase
      .from('chart_cells')
      .insert({
        chart_id: chartId,
        row_index: row,
        col_index: col,
        cell_type: metadata.type,
        content,
      })

    if (error) {
      throw new Error(`Failed to insert cell: ${error.message}`)
    }
  }

  revalidatePath('/dashboard')
}

export async function deleteCell(chartId: string, row: number, col: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('chart_cells')
    .delete()
    .eq('chart_id', chartId)
    .eq('row_index', row)
    .eq('col_index', col)

  if (error) {
    throw new Error(`Failed to delete cell: ${error.message}`)
  }

  revalidatePath('/dashboard')
}
