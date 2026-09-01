-- Örnek Masalar (Statik Token'lar ile test edebilmek için)
INSERT INTO tables (id, masa_no, qr_token, aktif) VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 1, 'token_masa_1', true),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 2, 'token_masa_2', true),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 3, 'token_masa_3', true),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 4, 'token_masa_4', true),
  ('e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', 5, 'token_masa_5', true)
ON CONFLICT (masa_no) DO NOTHING;

-- Örnek Kategoriler
INSERT INTO categories (id, ad_tr, ad_en, sira) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Ana Yemekler', 'Main Dishes', 1),
  ('22222222-2222-2222-2222-222222222222', 'Başlangıçlar & Mezeler', 'Starters & Appetizers', 2),
  ('33333333-3333-3333-3333-333333333333', 'Tatlılar', 'Desserts', 3),
  ('44444444-4444-4444-4444-444444444444', 'Sıcak İçecekler', 'Hot Drinks', 4),
  ('55555555-5555-5555-5555-555555555555', 'Soğuk İçecekler', 'Cold Drinks', 5)
ON CONFLICT (id) DO NOTHING;

-- Örnek Ürünler
INSERT INTO products (kategori_id, ad_tr, ad_en, aciklama_tr, aciklama_en, fiyat, gorsel_url, ozellikler, aktif) VALUES
  -- Ana Yemekler
  ('11111111-1111-1111-1111-111111111111', 'Yalı Kebap', 'Yalı Kebab', 'Özel marine edilmiş kuzu eti, közlenmiş patlıcan beğendi ve tırnak pide eşliğinde.', 'Specially marinated lamb meat served with roasted eggplant puree and traditional pita bread.', 480.00, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=60', '{"alerjenler": ["Gluten", "Laktoz"], "hazirlama_suresi": "20 dk"}', true),
  ('11111111-1111-1111-1111-111111111111', 'Izgara Antrikot', 'Grilled Ribeye Steak', 'Kömür ateşinde ızgara edilmiş dana antrikot, fırın patates ve taze kekik sosu ile.', 'Charcoal-grilled beef ribeye served with baked potatoes and fresh thyme sauce.', 590.00, 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=600&auto=format&fit=crop&q=60', '{"alerjenler": [], "hazirlama_suresi": "25 dk"}', true),
  ('11111111-1111-1111-1111-111111111111', 'Kremalı Mantarlı Tavuk', 'Creamy Mushroom Chicken', 'Tavuk göğsü dilimleri, istiridye mantarı, taze krema sosu ve yasemin pirinç pilavı.', 'Chicken breast slices, oyster mushrooms, fresh cream sauce, and jasmine rice.', 340.00, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop&q=60', '{"alerjenler": ["Laktoz"], "hazirlama_suresi": "15 dk"}', true),
  ('11111111-1111-1111-1111-111111111111', 'Fırın Somon Izgara', 'Baked Salmon Grill', 'Fırınlanmış taze somon fileto, roka salatası ve limonlu zeytinyağı sosu eşliğinde.', 'Baked fresh salmon fillet served with arugula salad and lemon olive oil dressing.', 490.00, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&auto=format&fit=crop&q=60', '{"alerjenler": ["Balık"], "hazirlama_suresi": "18 dk"}', true),

  -- Başlangıçlar
  ('22222222-2222-2222-2222-222222222222', 'Humus', 'Hummus', 'Nohut, tahin, limon, sarımsak ve sızma zeytinyağı, sıcak tereyağı sosu ile.', 'Chickpeas, tahini, lemon, garlic, and extra virgin olive oil, served with hot melted butter.', 180.00, 'https://images.unsplash.com/photo-1628294895520-73f248f57245?w=600&auto=format&fit=crop&q=60', '{"alerjenler": ["Susam"], "vejetaryen": true}', true),
  ('22222222-2222-2222-2222-222222222222', 'Çıtır Kalamar Tava', 'Crispy Fried Calamari', 'Halka kalamar dilimleri, tarator sos eşliğinde çıtır kızartılmış.', 'Crispy fried ring calamari slices served with tartar sauce.', 290.00, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&auto=format&fit=crop&q=60', '{"alerjenler": ["Gluten", "Deniz Ürünü"]}', true),
  ('22222222-2222-2222-2222-222222222222', 'Zeytinyağlı Enginar', 'Artichoke in Olive Oil', 'Taze bezelye, havuç, patates dolgulu zeytinyağlı enginar kalbi.', 'Artichoke hearts cooked in olive oil, stuffed with fresh peas, carrots, and potatoes.', 190.00, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=60', '{"vejetaryen": true}', true),

  -- Tatlılar
  ('33333333-3333-3333-3333-333333333333', 'Fıstıklı Baklava', 'Pistachio Baklava', 'Gaziantep fıstıklı çıtır baklava dilimleri, Maraş dondurması ile.', 'Crispy Gaziantep pistachio baklava slices, served with traditional Maraş ice cream.', 220.00, 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&auto=format&fit=crop&q=60', '{"alerjenler": ["Gluten", "Kuruyemiş", "Laktoz"]}', true),
  ('33333333-3333-3333-3333-333333333333', 'Sıcak Çikolatalı Sufle', 'Hot Chocolate Souffle', 'İçi akışkan çikolatalı sufle puding, vanilyalı dondurma ile.', 'Warm souffle with a liquid chocolate center, served with vanilla ice cream.', 180.00, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=60', '{"alerjenler": ["Gluten", "Laktoz", "Yumurta"]}', true),
  ('33333333-3333-3333-3333-333333333333', 'San Sebastian Cheesecake', 'San Sebastian Cheesecake', 'Fırınlanmış yanık cheesecake, eritilmiş Belçika çikolatası sosu ile.', 'Baked burnt cheesecake served with melted Belgian chocolate sauce.', 210.00, 'https://images.unsplash.com/photo-1524351199679-46cddf530c04?w=600&auto=format&fit=crop&q=60', '{"alerjenler": ["Laktoz", "Yumurta"]}', true),

  -- Sıcak İçecekler
  ('44444444-4444-4444-4444-444444444444', 'Türk Kahvesi', 'Turkish Coffee', 'Geleneksel Türk kahvesi, çifte kavrulmuş lokum ve su ile.', 'Traditional Turkish coffee served with double-roasted Turkish delight and water.', 75.00, 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=600&auto=format&fit=crop&q=60', '{"kafein": true}', true),
  ('44444444-4444-4444-4444-444444444444', 'Demleme Türk Çayı', 'Brewed Turkish Tea', 'Rize çay yapraklarından demlenmiş taze sıcak çay.', 'Freshly brewed hot black tea from Rize tea leaves.', 40.00, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=60', '{"kafein": true}', true),
  ('44444444-4444-4444-4444-444444444444', 'Caffe Latte', 'Caffe Latte', 'Espresso, buharla ısıtılmış sıcak süt ve süt köpüğü.', 'Espresso, steamed hot milk and milk foam.', 95.00, 'https://images.unsplash.com/photo-1570968915860-54d5c301fc9f?w=600&auto=format&fit=crop&q=60', '{"alerjenler": ["Laktoz"], "kafein": true}', true),

  -- Soğuk İçecekler
  ('55555555-5555-5555-5555-555555555555', 'Ev Yapımı Nane Limonata', 'Homemade Mint Lemonade', 'Taze sıkılmış limon suyu, taze nane yaprakları ve şeker şurubu.', 'Freshly squeezed lemon juice, fresh mint leaves, and simple syrup.', 85.00, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=60', '{"soğuk": true}', true),
  ('55555555-5555-5555-5555-555555555555', 'Çilekli Milkshake', 'Strawberry Milkshake', 'Çilekli dondurma, soğuk süt ve krem şanti ile hazırlanmış milkshake.', 'Strawberry ice cream, cold milk, and whipped cream milkshake.', 110.00, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=60', '{"alerjenler": ["Laktoz"]}', true),
  ('55555555-5555-5555-5555-555555555555', 'Coca Cola / Fanta / Sprite', 'Soft Drinks', 'Cam şişede soğuk gazlı içecek seçenekleri.', 'Assorted bottled cold soft drinks.', 70.00, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=60', '{"soğuk": true}', true);
