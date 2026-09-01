-- Categories RLS Policies for Staff/Admin Management
CREATE POLICY "Herkes kategori oluşturabilir ve güncelleyebilir" ON categories
  FOR ALL USING (true) WITH CHECK (true);

-- Products RLS Policies for Staff/Admin Management
CREATE POLICY "Herkes ürün ekleyebilir ve güncelleyebilir" ON products
  FOR ALL USING (true) WITH CHECK (true);
