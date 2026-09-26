import { Category, Product, Table } from "@/lib/types/database"

const INITIAL_CATEGORIES: Category[] = [
  { id: '11111111-1111-1111-1111-111111111111', ad_tr: 'Ana Yemekler', ad_en: 'Main Dishes', sira: 1, created_at: '' },
  { id: '22222222-2222-2222-2222-222222222222', ad_tr: 'Başlangıçlar & Mezeler', ad_en: 'Starters & Appetizers', sira: 2, created_at: '' },
  { id: '33333333-3333-3333-3333-333333333333', ad_tr: 'Tatlılar', ad_en: 'Desserts', sira: 3, created_at: '' },
  { id: '44444444-4444-4444-4444-444444444444', ad_tr: 'Sıcak İçecekler', ad_en: 'Hot Drinks', sira: 4, created_at: '' },
  { id: '55555555-5555-5555-5555-555555555555', ad_tr: 'Soğuk İçecekler', ad_en: 'Cold Drinks', sira: 5, created_at: '' }
];

const INITIAL_PRODUCTS: Product[] = [
  // Ana Yemekler
  {
    id: 'p1',
    kategori_id: '11111111-1111-1111-1111-111111111111',
    ad_tr: 'Yalı Kebap',
    ad_en: 'Yalı Kebab',
    aciklama_tr: 'Özel marine edilmiş kuzu eti, közlenmiş patlıcan beğendi ve tırnak pide eşliğinde.',
    aciklama_en: 'Specially marinated lamb meat served with roasted eggplant puree and traditional pita bread.',
    fiyat: 480.00,
    gorsel_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=60',
    ozellikler: { alerjenler: ['Gluten', 'Laktoz'], hazirlama_suresi: '20 dk', sef_onerisi: true },
    aktif: true,
    created_at: ''
  },
  {
    id: 'p2',
    kategori_id: '11111111-1111-1111-1111-111111111111',
    ad_tr: 'Izgara Antrikot',
    ad_en: 'Grilled Ribeye Steak',
    aciklama_tr: 'Kömür ateşinde ızgara edilmiş dana antrikot, fırın patates ve taze kekik sosu ile.',
    aciklama_en: 'Charcoal-grilled beef ribeye served with baked potatoes and fresh thyme sauce.',
    fiyat: 590.00,
    gorsel_url: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=600&auto=format&fit=crop&q=60',
    ozellikler: { alerjenler: [], hazirlama_suresi: '25 dk', sef_onerisi: true },
    aktif: true,
    created_at: ''
  },
  {
    id: 'p3',
    kategori_id: '11111111-1111-1111-1111-111111111111',
    ad_tr: 'Kremalı Mantarlı Tavuk',
    ad_en: 'Creamy Mushroom Chicken',
    aciklama_tr: 'Tavuk göğsü dilimleri, istiridye mantarı, taze krema sosu ve yasemin pirinç pilavı.',
    aciklama_en: 'Chicken breast slices, oyster mushrooms, fresh cream sauce, and jasmine rice.',
    fiyat: 340.00,
    gorsel_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop&q=60',
    ozellikler: { alerjenler: ['Laktoz'], hazirlama_suresi: '15 dk' },
    aktif: true,
    created_at: ''
  },
  {
    id: 'p4',
    kategori_id: '11111111-1111-1111-1111-111111111111',
    ad_tr: 'Fırın Somon Izgara',
    ad_en: 'Baked Salmon Grill',
    aciklama_tr: 'Fırınlanmış taze somon fileto, roka salatası ve limonlu zeytinyağı sosu eşliğinde.',
    aciklama_en: 'Baked fresh salmon fillet served with arugula salad and lemon olive oil dressing.',
    fiyat: 490.00,
    gorsel_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&auto=format&fit=crop&q=60',
    ozellikler: { alerjenler: ['Balık'], hazirlama_suresi: '18 dk', sef_onerisi: true },
    aktif: true,
    created_at: ''
  },
  
  // Başlangıçlar
  {
    id: 'p5',
    kategori_id: '22222222-2222-2222-2222-222222222222',
    ad_tr: 'Humus',
    ad_en: 'Hummus',
    aciklama_tr: 'Nohut, tahin, limon, sarımsak ve sızma zeytinyağı, sıcak tereyağı sosu ile.',
    aciklama_en: 'Chickpeas, tahini, lemon, garlic, and extra virgin olive oil, served with hot melted butter.',
    fiyat: 180.00,
    gorsel_url: 'https://images.unsplash.com/photo-1628294895520-73f248f57245?w=600&auto=format&fit=crop&q=60',
    ozellikler: { alerjenler: ['Susam'], vejetaryen: true, hazirlama_suresi: '10 dk' },
    aktif: true,
    created_at: ''
  },
  {
    id: 'p6',
    kategori_id: '22222222-2222-2222-2222-222222222222',
    ad_tr: 'Çıtır Kalamar Tava',
    ad_en: 'Crispy Fried Calamari',
    aciklama_tr: 'Halka kalamar dilimleri, tarator sos eşliğinde çıtır kızartılmış.',
    aciklama_en: 'Crispy fried ring calamari slices served with tartar sauce.',
    fiyat: 290.00,
    gorsel_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&auto=format&fit=crop&q=60',
    ozellikler: { alerjenler: ['Gluten', 'Deniz Ürünü'], hazirlama_suresi: '12 dk' },
    aktif: true,
    created_at: ''
  },
  
  // Tatlılar
  {
    id: 'p7',
    kategori_id: '33333333-3333-3333-3333-333333333333',
    ad_tr: 'Fıstıklı Baklava',
    ad_en: 'Pistachio Baklava',
    aciklama_tr: 'Gaziantep fıstıklı çıtır baklava dilimleri, Maraş dondurması ile.',
    aciklama_en: 'Crispy Gaziantep pistachio baklava slices, served with traditional Maraş ice cream.',
    fiyat: 220.00,
    gorsel_url: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&auto=format&fit=crop&q=60',
    ozellikler: { alerjenler: ['Gluten', 'Kuruyemiş / Fıstık', 'Laktoz'], hazirlama_suresi: '5 dk', sef_onerisi: true },
    aktif: true,
    created_at: ''
  },
  {
    id: 'p8',
    kategori_id: '33333333-3333-3333-3333-333333333333',
    ad_tr: 'San Sebastian Cheesecake',
    ad_en: 'San Sebastian Cheesecake',
    aciklama_tr: 'Fırınlanmış yanık cheesecake, eritilmiş Belçika çikolatası sosu ile.',
    aciklama_en: 'Baked burnt cheesecake served with melted Belgian chocolate sauce.',
    fiyat: 210.00,
    gorsel_url: 'https://images.unsplash.com/photo-1524351199679-46cddf530c04?w=600&auto=format&fit=crop&q=60',
    ozellikler: { alerjenler: ['Laktoz', 'Yumurta'], hazirlama_suresi: '5 dk' },
    aktif: true,
    created_at: ''
  },
  
  // Sıcak İçecekler
  {
    id: 'p9',
    kategori_id: '44444444-4444-4444-4444-444444444444',
    ad_tr: 'Türk Kahvesi',
    ad_en: 'Turkish Coffee',
    aciklama_tr: 'Geleneksel Türk kahvesi, çifte kavrulmuş lokum ve su ile.',
    aciklama_en: 'Traditional Turkish coffee served with double-roasted Turkish delight and water.',
    fiyat: 75.00,
    gorsel_url: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=600&auto=format&fit=crop&q=60',
    ozellikler: { kafein: true, hazirlama_suresi: '7 dk' },
    aktif: true,
    created_at: ''
  },
  {
    id: 'p10',
    kategori_id: '44444444-4444-4444-4444-444444444444',
    ad_tr: 'Demleme Türk Çayı',
    ad_en: 'Brewed Turkish Tea',
    aciklama_tr: 'Rize çay yapraklarından demlenmiş taze sıcak çay.',
    aciklama_en: 'Freshly brewed hot black tea from Rize tea leaves.',
    fiyat: 40.00,
    gorsel_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=60',
    ozellikler: { kafein: true, hazirlama_suresi: '3 dk' },
    aktif: true,
    created_at: ''
  },

  // Soğuk İçecekler
  {
    id: 'p11',
    kategori_id: '55555555-5555-5555-5555-555555555555',
    ad_tr: 'Ev Yapımı Nane Limonata',
    ad_en: 'Homemade Mint Lemonade',
    aciklama_tr: 'Taze sıkılmış limon suyu, taze nane yaprakları ve şeker şurubu.',
    aciklama_en: 'Freshly squeezed lemon juice, fresh mint leaves, and simple syrup.',
    fiyat: 85.00,
    gorsel_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=60',
    ozellikler: { soğuk: true, vejetaryen: true, vegan: true, hazirlama_suresi: '5 dk' },
    aktif: true,
    created_at: ''
  },
  {
    id: 'p12',
    kategori_id: '55555555-5555-5555-5555-555555555555',
    ad_tr: 'Çilekli Milkshake',
    ad_en: 'Strawberry Milkshake',
    aciklama_tr: 'Çilekli dondurma, soğuk süt ve krem şanti ile hazırlanmış milkshake.',
    aciklama_en: 'Strawberry ice cream, cold milk, and whipped cream milkshake.',
    fiyat: 110.00,
    gorsel_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=60',
    ozellikler: { alerjenler: ['Laktoz'], soğuk: true, hazirlama_suresi: '6 dk' },
    aktif: true,
    created_at: ''
  }
];

const INITIAL_TABLES: Table[] = [
  { id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', masa_no: 1, masa_adi: 'Dış 1', venue: 'restaurant', qr_token: 'token_masa_1', aktif: true, created_at: new Date().toISOString() },
  { id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', masa_no: 2, masa_adi: 'Dış 2', venue: 'restaurant', qr_token: 'token_masa_2', aktif: true, created_at: new Date().toISOString() },
  { id: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', masa_no: 3, masa_adi: 'İç 3', venue: 'restaurant', qr_token: 'token_masa_3', aktif: true, created_at: new Date().toISOString() },
  { id: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', masa_no: 4, masa_adi: 'İç 4', venue: 'restaurant', qr_token: 'token_masa_4', aktif: true, created_at: new Date().toISOString() },
  { id: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', masa_no: 5, masa_adi: 'VIP 5', venue: 'restaurant', qr_token: 'token_masa_5', aktif: true, created_at: new Date().toISOString() },
];

// Global persistent state across hot-reloads and module evaluations in Node.js server
declare global {
  var __yaliMockCategories: Category[] | undefined;
  var __yaliMockProducts: Product[] | undefined;
  var __yaliMockTables: Table[] | undefined;
}

if (!globalThis.__yaliMockCategories) {
  globalThis.__yaliMockCategories = [...INITIAL_CATEGORIES];
}
if (!globalThis.__yaliMockProducts) {
  globalThis.__yaliMockProducts = [...INITIAL_PRODUCTS];
}
if (!globalThis.__yaliMockTables) {
  globalThis.__yaliMockTables = [...INITIAL_TABLES];
}

export const mockCategories: Category[] = globalThis.__yaliMockCategories;
export const mockProducts: Product[] = globalThis.__yaliMockProducts;
export const mockTables: Table[] = globalThis.__yaliMockTables;
