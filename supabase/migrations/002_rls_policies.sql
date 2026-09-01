-- Tüm tablolarda RLS aktif
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- categories & products: herkes okuyabilir (menü herkese açık)
CREATE POLICY "Herkes kategori okuyabilir" ON categories FOR SELECT USING (true);
CREATE POLICY "Herkes ürün okuyabilir" ON products FOR SELECT USING (aktif = true);

-- tables: sadece kendi token'ıyla eşleşen masayı görebilir
CREATE POLICY "Token ile masa erişimi" ON tables FOR SELECT
  USING (qr_token = current_setting('request.headers', true)::json->>'x-table-token');

-- order_sessions: kendi masasının oturumlarını görebilir/oluşturabilir/güncelleyebilir
CREATE POLICY "Masa oturumlarını oku" ON order_sessions FOR SELECT
  USING (table_id IN (
    SELECT id FROM tables WHERE qr_token = current_setting('request.headers', true)::json->>'x-table-token'
  ));

CREATE POLICY "Masa oturumu oluştur" ON order_sessions FOR INSERT
  WITH CHECK (table_id IN (
    SELECT id FROM tables WHERE qr_token = current_setting('request.headers', true)::json->>'x-table-token'
  ));

CREATE POLICY "Masa oturumu güncelle" ON order_sessions FOR UPDATE
  USING (table_id IN (
    SELECT id FROM tables WHERE qr_token = current_setting('request.headers', true)::json->>'x-table-token'
  ));

-- cart_items: kendi oturumundaki sepet öğelerini yönetebilir
CREATE POLICY "Sepet öğelerini oku" ON cart_items FOR SELECT
  USING (session_id IN (
    SELECT os.id FROM order_sessions os
    JOIN tables t ON t.id = os.table_id
    WHERE t.qr_token = current_setting('request.headers', true)::json->>'x-table-token'
  ));

CREATE POLICY "Sepete ekle" ON cart_items FOR INSERT
  WITH CHECK (session_id IN (
    SELECT os.id FROM order_sessions os
    JOIN tables t ON t.id = os.table_id
    WHERE t.qr_token = current_setting('request.headers', true)::json->>'x-table-token'
    AND os.status = 'draft'
  ));

CREATE POLICY "Sepeti güncelle" ON cart_items FOR UPDATE
  USING (session_id IN (
    SELECT os.id FROM order_sessions os
    JOIN tables t ON t.id = os.table_id
    WHERE t.qr_token = current_setting('request.headers', true)::json->>'x-table-token'
    AND os.status = 'draft'
  ));

CREATE POLICY "Sepetten sil" ON cart_items FOR DELETE
  USING (session_id IN (
    SELECT os.id FROM order_sessions os
    JOIN tables t ON t.id = os.table_id
    WHERE t.qr_token = current_setting('request.headers', true)::json->>'x-table-token'
    AND os.status = 'draft'
  ));
