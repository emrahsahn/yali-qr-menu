-- Kategoriler
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_tr TEXT NOT NULL,
  ad_en TEXT NOT NULL,
  sira INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ürünler
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kategori_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  ad_tr TEXT NOT NULL,
  ad_en TEXT NOT NULL,
  aciklama_tr TEXT,
  aciklama_en TEXT,
  fiyat DECIMAL(10,2) NOT NULL,
  gorsel_url TEXT,
  ozellikler JSONB DEFAULT '{}',
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Masalar
CREATE TABLE tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  masa_no INT NOT NULL UNIQUE,
  qr_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sipariş Oturumları
CREATE TABLE order_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  tur_no INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_approval', 'confirmed', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sepet Öğeleri
CREATE TABLE cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES order_sessions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  adet INT NOT NULL DEFAULT 1 CHECK (adet > 0),
  not_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
