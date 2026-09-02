export interface Table {
  id: string;
  masa_no: number;
  masa_adi?: string;
  venue: string;
  qr_token: string;
  aktif: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  ad_tr: string;
  ad_en: string;
  sira: number;
  created_at: string;
}

export interface ProductPortion {
  id: string;
  ad_tr: string;
  ad_en?: string;
  fiyat: number;
}

export interface Product {
  id: string;
  kategori_id: string;
  ad_tr: string;
  ad_en: string;
  aciklama_tr: string;
  aciklama_en: string;
  fiyat: number;
  porsiyonlar?: ProductPortion[];
  gorsel_url: string;
  ozellikler: {
    alerjenler?: string[];
    hazirlama_suresi?: string;
    vejetaryen?: boolean;
    vegan?: boolean;
    acili?: boolean;
    kafein?: boolean;
    soğuk?: boolean;
    sef_onerisi?: boolean;
    kalori?: string;
    [key: string]: unknown;
  };
  aktif: boolean;
  created_at: string;
}

export interface OrderSession {
  id: string;
  table_id: string;
  table_name?: string;
  table_no?: number;
  tur_no: number;
  status: 'draft' | 'pending_approval' | 'confirmed' | 'closed';
  created_at: string;
  assigned_waiters?: string[]; // Array of waiter names (e.g. ['Hüseyin', 'Ahmet'])
  cart_items?: CartItem[];
}

export interface CartItem {
  id: string;
  session_id: string;
  product_id: string;
  adet: number;
  not_text: string | null;
  created_at: string;
  product?: Product;
}

export interface WaiterCall {
  id: string;
  table_id: string;
  table_name: string;
  call_type: 'garson' | 'hesap' | 'yardim';
  created_at: string;
  status: 'pending' | 'resolved';
}

