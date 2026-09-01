-- Masa Garson Sorumlulukları ve Çağrı Tablosu
CREATE TABLE IF NOT EXISTS table_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  waiter_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(table_id, waiter_name)
);

CREATE TABLE IF NOT EXISTS waiter_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  call_type TEXT NOT NULL DEFAULT 'garson' CHECK (call_type IN ('garson', 'hesap', 'yardim')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT now()
);
