-- Masalar tablosuna isim ve mekan alanlarını ekle
ALTER TABLE tables ADD COLUMN IF NOT EXISTS masa_adi TEXT;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS venue TEXT NOT NULL DEFAULT 'restaurant';
