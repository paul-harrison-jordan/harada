-- Create weekly_cycles table to track each week
CREATE TABLE weekly_cycles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chart_id UUID REFERENCES harada_charts(id) ON DELETE CASCADE NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed')) DEFAULT 'planned',
  start_journal TEXT DEFAULT '', -- Written at start of week
  end_review TEXT DEFAULT '', -- Written at end of week (Sunday)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(chart_id, week_start_date)
);

-- Create weekly_actions table to track selected actions for each week
CREATE TABLE weekly_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID REFERENCES weekly_cycles(id) ON DELETE CASCADE NOT NULL,
  cell_id UUID REFERENCES chart_cells(id) ON DELETE CASCADE NOT NULL,
  is_selected BOOLEAN DEFAULT true, -- Whether this action was selected/randomized for this week
  completion_status TEXT CHECK (completion_status IN ('not_started', 'in_progress', 'completed', 'skipped', 'partial')) DEFAULT 'not_started',
  reflection_notes TEXT DEFAULT '', -- What you did or didn't do
  score INTEGER CHECK (score >= 0 AND score <= 5), -- Self-rating 0-5
  completed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(cycle_id, cell_id)
);

-- Enable Row Level Security
ALTER TABLE weekly_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_actions ENABLE ROW LEVEL SECURITY;

-- Policies for weekly_cycles
CREATE POLICY "Users can view their own weekly cycles"
  ON weekly_cycles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM harada_charts
    WHERE harada_charts.id = weekly_cycles.chart_id
    AND harada_charts.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own weekly cycles"
  ON weekly_cycles FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM harada_charts
    WHERE harada_charts.id = weekly_cycles.chart_id
    AND harada_charts.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own weekly cycles"
  ON weekly_cycles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM harada_charts
    WHERE harada_charts.id = weekly_cycles.chart_id
    AND harada_charts.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own weekly cycles"
  ON weekly_cycles FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM harada_charts
    WHERE harada_charts.id = weekly_cycles.chart_id
    AND harada_charts.user_id = auth.uid()
  ));

-- Policies for weekly_actions
CREATE POLICY "Users can view their own weekly actions"
  ON weekly_actions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM weekly_cycles
    JOIN harada_charts ON harada_charts.id = weekly_cycles.chart_id
    WHERE weekly_cycles.id = weekly_actions.cycle_id
    AND harada_charts.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own weekly actions"
  ON weekly_actions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM weekly_cycles
    JOIN harada_charts ON harada_charts.id = weekly_cycles.chart_id
    WHERE weekly_cycles.id = weekly_actions.cycle_id
    AND harada_charts.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own weekly actions"
  ON weekly_actions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM weekly_cycles
    JOIN harada_charts ON harada_charts.id = weekly_cycles.chart_id
    WHERE weekly_cycles.id = weekly_actions.cycle_id
    AND harada_charts.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own weekly actions"
  ON weekly_actions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM weekly_cycles
    JOIN harada_charts ON harada_charts.id = weekly_cycles.chart_id
    WHERE weekly_cycles.id = weekly_actions.cycle_id
    AND harada_charts.user_id = auth.uid()
  ));

-- Create indexes for better query performance
CREATE INDEX idx_weekly_cycles_chart_id ON weekly_cycles(chart_id);
CREATE INDEX idx_weekly_cycles_dates ON weekly_cycles(week_start_date, week_end_date);
CREATE INDEX idx_weekly_cycles_status ON weekly_cycles(status);
CREATE INDEX idx_weekly_actions_cycle_id ON weekly_actions(cycle_id);
CREATE INDEX idx_weekly_actions_cell_id ON weekly_actions(cell_id);

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_weekly_cycles_updated_at BEFORE UPDATE ON weekly_cycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_actions_updated_at BEFORE UPDATE ON weekly_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper function to get all action cells for a chart
CREATE OR REPLACE FUNCTION get_action_cells(chart_uuid UUID)
RETURNS TABLE (
  id UUID,
  content TEXT,
  row_index INTEGER,
  col_index INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    chart_cells.id,
    chart_cells.content,
    chart_cells.row_index,
    chart_cells.col_index
  FROM chart_cells
  WHERE chart_cells.chart_id = chart_uuid
  AND chart_cells.cell_type = 'action'
  AND chart_cells.content != ''
  AND chart_cells.content IS NOT NULL
  ORDER BY RANDOM();
END;
$$ LANGUAGE plpgsql;

-- Helper function to create a new weekly cycle with randomized actions
CREATE OR REPLACE FUNCTION create_weekly_cycle_with_actions(
  chart_uuid UUID,
  start_date DATE,
  end_date DATE,
  num_actions INTEGER DEFAULT 5
)
RETURNS UUID AS $$
DECLARE
  new_cycle_id UUID;
  action_record RECORD;
  count INTEGER := 0;
BEGIN
  -- Create the weekly cycle
  INSERT INTO weekly_cycles (chart_id, week_start_date, week_end_date, status)
  VALUES (chart_uuid, start_date, end_date, 'planned')
  RETURNING id INTO new_cycle_id;

  -- Select random actions and insert them
  FOR action_record IN
    SELECT id FROM get_action_cells(chart_uuid) LIMIT num_actions
  LOOP
    INSERT INTO weekly_actions (cycle_id, cell_id, is_selected)
    VALUES (new_cycle_id, action_record.id, true);
    count := count + 1;
  END LOOP;

  RETURN new_cycle_id;
END;
$$ LANGUAGE plpgsql;
