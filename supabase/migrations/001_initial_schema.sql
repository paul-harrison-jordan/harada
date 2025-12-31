-- Create harada_charts table
CREATE TABLE harada_charts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'My Harada Chart',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create chart_cells table to store all cells in the 9x9 grid
CREATE TABLE chart_cells (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chart_id UUID REFERENCES harada_charts(id) ON DELETE CASCADE NOT NULL,
  row_index INTEGER NOT NULL CHECK (row_index >= 0 AND row_index < 9),
  col_index INTEGER NOT NULL CHECK (col_index >= 0 AND col_index < 9),
  cell_type TEXT NOT NULL CHECK (cell_type IN ('goal', 'behavior', 'action')),
  content TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(chart_id, row_index, col_index)
);

-- Enable Row Level Security
ALTER TABLE harada_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_cells ENABLE ROW LEVEL SECURITY;

-- Create policies for harada_charts
CREATE POLICY "Users can view their own charts"
  ON harada_charts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own charts"
  ON harada_charts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own charts"
  ON harada_charts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own charts"
  ON harada_charts FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for chart_cells
CREATE POLICY "Users can view cells of their own charts"
  ON chart_cells FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM harada_charts
    WHERE harada_charts.id = chart_cells.chart_id
    AND harada_charts.user_id = auth.uid()
  ));

CREATE POLICY "Users can create cells in their own charts"
  ON chart_cells FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM harada_charts
    WHERE harada_charts.id = chart_cells.chart_id
    AND harada_charts.user_id = auth.uid()
  ));

CREATE POLICY "Users can update cells in their own charts"
  ON chart_cells FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM harada_charts
    WHERE harada_charts.id = chart_cells.chart_id
    AND harada_charts.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete cells in their own charts"
  ON chart_cells FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM harada_charts
    WHERE harada_charts.id = chart_cells.chart_id
    AND harada_charts.user_id = auth.uid()
  ));

-- Create indexes for better query performance
CREATE INDEX idx_chart_cells_chart_id ON chart_cells(chart_id);
CREATE INDEX idx_harada_charts_user_id ON harada_charts(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_harada_charts_updated_at BEFORE UPDATE ON harada_charts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chart_cells_updated_at BEFORE UPDATE ON chart_cells
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
