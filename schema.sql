-- ==============================================================================
-- YALI RESTAURANT & QR MENU — TAM VERİTABANI ŞEMASI (SUPABASE POSTGRESQL)
-- ==============================================================================
-- Bu dosya tüm tabloları, güvenlik (RLS) politikalarını ve örnek başlangıç verilerini içerir.
-- Supabase SQL Editor'de (supabase.com/dashboard) doğrudan çalıştırabilirsiniz.
-- ==============================================================================

-- 1. TABLOLAR (TABLES)
-- ------------------------------------------------------------------------------

-- Masalar Tablosu
CREATE TABLE IF NOT EXISTS tables (
  id TEXT PRIMARY KEY,
  masa_no INT NOT NULL UNIQUE,
  masa_adi TEXT,
  venue TEXT DEFAULT 'restaurant',
  qr_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Kategoriler Tablosu
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  ad_tr TEXT NOT NULL,
  ad_en TEXT NOT NULL,
  sira INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ürünler Tablosu
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  kategori_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
  ad_tr TEXT NOT NULL,
  ad_en TEXT NOT NULL,
  aciklama_tr TEXT,
  aciklama_en TEXT,
  fiyat DECIMAL(10,2) NOT NULL,
  porsiyonlar JSONB DEFAULT '[]',
  gorsel_url TEXT,
  ozellikler JSONB DEFAULT '{}',
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sipariş Oturumları Tablosu
CREATE TABLE IF NOT EXISTS order_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id TEXT,
  tur_no INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'confirmed', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sepet ve Sipariş Kalemleri Tablosu
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES order_sessions(id) ON DELETE CASCADE,
  product_id TEXT,
  adet INT NOT NULL DEFAULT 1 CHECK (adet > 0),
  not_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- 2. GÜVENLİK İZİNLERİ (ROW LEVEL SECURITY - RLS)
-- ------------------------------------------------------------------------------
-- TÜM veri erişimi uygulama sunucusu tarafından service_role key ile yapılır
-- (service_role RLS'i atlar). anon/authenticated rollerine HİÇBİR politika
-- tanımlanmaz → anon key ile doğrudan yapılacak tüm okuma/yazma denemeleri
-- boş sonuç döner. Uygulama asla anon key ile sorgu yapmamalıdır.

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Eski şema sürümünden kalma izin verici ("USING (true)") politikaları kaldır.
-- Bu dosyayı mevcut bir veritabanında yeniden çalıştırırsanız bu satırlar
-- herkese açık erişimi kapatır.
DROP POLICY IF EXISTS "Kategoriler Herkese Açık" ON categories;
DROP POLICY IF EXISTS "Ürünler Herkese Açık" ON products;
DROP POLICY IF EXISTS "Masalar Yönetilebilir" ON tables;
DROP POLICY IF EXISTS "Oturumlar Yönetilebilir" ON order_sessions;
DROP POLICY IF EXISTS "Sepet Yönetilebilir" ON cart_items;


-- 3. ÖRNEK BAŞLANGIÇ VERİLERİ (SEED DATA)
-- ------------------------------------------------------------------------------

-- Örnek Masalar (qr_token'lar tahmin edilemez rastgele üretilir)
INSERT INTO tables (id, masa_no, masa_adi, venue, qr_token, aktif) VALUES
  ('tbl-1', 1, 'Masa 1', 'restaurant', encode(gen_random_bytes(16), 'hex'), true),
  ('tbl-2', 2, 'Masa 2', 'restaurant', encode(gen_random_bytes(16), 'hex'), true),
  ('tbl-3', 3, 'Masa 3', 'restaurant', encode(gen_random_bytes(16), 'hex'), true),
  ('tbl-4', 4, 'Masa 4', 'restaurant', encode(gen_random_bytes(16), 'hex'), true),
  ('tbl-5', 5, 'Masa 5', 'restaurant', encode(gen_random_bytes(16), 'hex'), true)
ON CONFLICT (masa_no) DO NOTHING;

-- ZAYIF TOKEN ROTASYONU (tahmin edilebilir 'token_masa_N' formatını kullanan
-- eski masalar için). ÇALIŞTIRMADAN ÖNCE: eski token'ı içeren basılı QR
-- kodları geçersiz olur, panelden QR'ları yeniden yazdırmanız gerekir.
-- UPDATE tables SET qr_token = encode(gen_random_bytes(16), 'hex')
--   WHERE qr_token LIKE 'token_masa_%';

-- Örnek Kategoriler
INSERT INTO categories (id, ad_tr, ad_en, sira) VALUES
  ('cat-1', 'Ana Yemekler', 'Main Dishes', 1),
  ('cat-2', 'Başlangıçlar & Mezeler', 'Starters & Appetizers', 2),
  ('cat-3', 'Tatlılar', 'Desserts', 3),
  ('cat-4', 'Sıcak İçecekler', 'Hot Drinks', 4),
  ('cat-5', 'Soğuk İçecekler', 'Cold Drinks', 5)
ON CONFLICT (id) DO NOTHING;

-- Örnek Ürünler
INSERT INTO products (id, kategori_id, ad_tr, ad_en, aciklama_tr, aciklama_en, fiyat, gorsel_url, ozellikler, aktif) VALUES
  -- Ana Yemekler
  ('prod-1', 'cat-1', 'Yalı Kebap', 'Yalı Kebab', 'Özel marine edilmiş kuzu eti, közlenmiş patlıcan beğendi ve tırnak pide eşliğinde.', 'Specially marinated lamb meat served with roasted eggplant puree and traditional pita bread.', 480.00, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=60', '{"alerjenler": ["Gluten", "Laktoz"], "hazirlama_suresi": "20 dk"}', true),
  ('prod-2', 'cat-1', 'Izgara Antrikot', 'Grilled Ribeye Steak', 'Kömür ateşinde ızgara edilmiş dana antrikot, fırın patates ve taze kekik sosu ile.', 'Charcoal-grilled beef ribeye served with baked potatoes and fresh thyme sauce.', 590.00, 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=600&auto=format&fit=crop&q=60', '{"alerjenler": [], "hazirlama_suresi": "25 dk"}', true),
  ('prod-3', 'cat-1', 'Kremalı Mantarlı Tavuk', 'Creamy Mushroom Chicken', 'Tavuk göğsü dilimleri, istiridye mantarı, taze krema sosu ve yasemin pirinç pilavı.', 'Chicken breast slices, oyster mushrooms, fresh cream sauce, and jasmine rice.', 340.00, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop&q=60', '{"alerjenler": ["Laktoz"], "hazirlama_suresi": "15 dk"}', true),
  ('prod-4', 'cat-1', 'Fırın Somon Izgara', 'Baked Salmon Grill', 'Fırınlanmış taze somon fileto, roka salatası ve limonlu zeytinyağı sosu eşliğinde.', 'Baked fresh salmon fillet served with arugula salad and lemon olive oil dressing.', 490.00, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&auto=format&fit=crop&q=60', '{"alerjenler": ["Balık"], "hazirlama_suresi": "18 dk"}', true),

  -- Başlangıçlar
  ('prod-5', 'cat-2', 'Humus', 'Hummus', 'Nohut, tahin, limon, sarımsak ve sızma zeytinyağı, sıcak tereyağı sosu ile.', 'Chickpeas, tahini, lemon, garlic, and extra virgin olive oil, served with hot melted butter.', 180.00, 'https://images.unsplash.com/photo-1628294895520-73f248f57245?w=600&auto=format&fit=crop&q=60', '{"alerjenler": ["Susam"], "vejetaryen": true}', true),
  ('prod-6', 'cat-2', 'Çıtır Kalamar Tava', 'Crispy Fried Calamari', 'Halka kalamar dilimleri, tarator sos eşliğinde çıtır kızartılmış.', 'Crispy fried ring calamari slices served with tartar sauce.', 290.00, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&auto=format&fit=crop&q=60', '{"alerjenler": ["Gluten", "Deniz Ürünü"]}', true),

  -- Tatlılar
  ('prod-7', 'cat-3', 'Fıstıklı Baklava', 'Pistachio Baklava', 'Gaziantep fıstıklı çıtır baklava dilimleri, Maraş dondurması ile.', 'Crispy Gaziantep pistachio baklava slices, served with traditional Maraş ice cream.', 220.00, 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&auto=format&fit=crop&q=60', '{"alerjenler": ["Gluten", "Kuruyemiş", "Laktoz"]}', true),
  ('prod-8', 'cat-3', 'San Sebastian Cheesecake', 'San Sebastian Cheesecake', 'Fırınlanmış yanık cheesecake, eritilmiş Belçika çikolatası sosu ile.', 'Baked burnt cheesecake served with melted Belgian chocolate sauce.', 210.00, 'https://images.unsplash.com/photo-1524351199679-46cddf530c04?w=600&auto=format&fit=crop&q=60', '{"alerjenler": ["Laktoz", "Yumurta"]}', true),

  -- Sıcak İçecekler
  ('prod-9', 'cat-4', 'Türk Kahvesi', 'Turkish Coffee', 'Geleneksel Türk kahvesi, çifte kavrulmuş lokum ve su ile.', 'Traditional Turkish coffee served with double-roasted Turkish delight and water.', 75.00, 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=600&auto=format&fit=crop&q=60', '{"kafein": true}', true),
  ('prod-10', 'cat-4', 'Demleme Türk Çayı', 'Brewed Turkish Tea', 'Rize çay yapraklarından demlenmiş taze sıcak çay.', 'Freshly brewed hot black tea from Rize tea leaves.', 40.00, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=60', '{"kafein": true}', true),

  -- Soğuk İçecekler
  ('prod-11', 'cat-5', 'Ev Yapımı Nane Limonata', 'Homemade Mint Lemonade', 'Taze sıkılmış limon suyu, taze nane yaprakları ve şeker şurubu.', 'Freshly squeezed lemon juice, fresh mint leaves, and simple syrup.', 85.00, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=60', '{"soğuk": true}', true),
  ('prod-12', 'cat-5', 'Çilekli Milkshake', 'Strawberry Milkshake', 'Çilekli dondurma, soğuk süt ve krem şanti ile hazırlanmış milkshake.', 'Strawberry ice cream, cold milk, and whipped cream milkshake.', 110.00, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=60', '{"alerjenler": ["Laktoz"]}', true)
ON CONFLICT (id) DO NOTHING;
