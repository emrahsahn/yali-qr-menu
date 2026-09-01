# 🔧 YALI Projesi — Düzeltme Raporu

**Tarih:** 24 Ağustos 2026
**Kapsam:** ESLint temizliği + mock (Supabase'siz) modda çalışan özellikleri bozan fonksiyonel hatalar
**İstek dışı bırakılanlar:** Supabase bağlantısı henüz kurulmadığı için RLS politikaları, API yetkilendirmesi, gerçek kimlik doğrulama ve Supabase sorgu yollarındaki sorunlar bilinçli olarak **dokunulmadan** bırakılmıştır (bkz. Bölüm 5).

---

## 1. Özet

| Kontrol | Önce | Sonra |
|---|---|---|
| ESLint | ❌ 80 hata / 73 uyarı | ✅ **0 hata / 0 uyarı** |
| TypeScript (`tsc --noEmit`) | ✅ Temiz | ✅ Temiz |
| Üretim build'i (`next build`) | Denenmemişti | ✅ Başarılı (24 route) |

---

## 2. Yapılandırma Değişiklikleri

### `eslint.config.mjs`
- `.agents/**` ve `supabase/**` dizinleri lint taramasının dışına çıkarıldı
  - *Neden:* `.agents` altındaki skill script'leri (`.cjs` dosyaları) uygulama kodu değil; 14 adet `require()` hatası bunlardan geliyordu.
- `@typescript-eslint/no-unused-vars` kuralına `argsIgnorePattern`/`varsIgnorePattern: "^_"` eklendi — bilinçli olarak kullanılmayan parametreler için standart `_` öneki istisnası.

### `app/globals.css`
- Eksik animasyon tanımları eklendi (Tailwind v4 `@theme` formatında):
  - `animate-shake` → login sayfasındaki hata kutusu (`login/page.tsx:74`) ve PIN kilidi (`waiter-pin-lock-modal.tsx:79`) tarafından kullanılıyordu ama keyframe CSS'te **hiç yoktu** — animasyonlar sessizce çalışmıyordu.
  - `@keyframes shimmer` → sepet çubuğu parlaması (`cart-bar.tsx:34`, `animate-[shimmer_2s_infinite]`) için gerekliydi.

---

## 3. Dosya Bazında Yapılan Düzeltmeler

### Context'ler (`lib/context/`)

#### `language-context.tsx` — yeniden yazıldı
| Önce | Sonra |
|---|---|
| Dil hidrasyonu `useEffect` içinde senkron `setState` ile yapılıyordu (`set-state-in-effect` hatası) | `useSyncExternalStore` + storage event aboneliği — React'in tarayıcı depolaması için resmi deseni; SSR uyumsuzluğu da imkânsız hale geldi |
| 6 adet `any` tipi (çeviri sözlüğü erişimi) | Tip güvenli `resolveTranslation()` yardımcısı (`Record<string, unknown>` üzerinden dot-key çözümleme) |

> Bonus: Artık dil değişikliği hem `storage` event'i hem özel `yali_lang_change` event'i ile yayınlanıyor — aynı sekmedeki tüm provider'lar senkron kalıyor.

#### `table-context.tsx` (müşteri menü provider'ı)
1. **Dil yönetimi**: Yukarıdakiyle aynı `useSyncExternalStore` desenine geçirildi — iki provider artık birbirinden bağımsız davranmıyor.
2. **`let savedCart` → `const`** (3 yerde, `prefer-const`).
3. **Realtime abonelik effect'i**: `[session?.id, ...]` bağımlılığı yerine kararlı `sessionId` değişkeni çekildi (`exhaustive-deps` uyarısı); her session nesnesi güncellendiğinde kanal yeniden abone olmasın diye.
4. **`callWaiter()` düzeltildi (Faz 3.2)**:
   - *Önce:* Sadece `WAITER_CALLED` mesajı yayınlanıyordu; hiçbir kod `yali_call_*` anahtarını yazmıyordu → personel paneli çağrıyı **asla** görmüyordu.
   - *Sonra:* Çağrı `WaiterCall` nesnesi olarak `localStorage`'a yazılıyor (`yali_call_<id>`) **ve** personel kanalına bildiriliyor.
5. Kullanılmayan `payload` parametresi kaldırıldı.

#### `staff-context.tsx` (personel provider'ı)
1. `(window as any).webkitAudioContext` → tipli alternatif (`no-explicit-any`).
2. **Mount hidrasyonu** (personel listesi + aktif oturum): mikro görev'e ertelendi — ilk paint SSR ile birebir eşleşir, effect gövdesinde senkron setState kalmadı.
3. **7 adet boş `catch (e)` → `catch`** (kullanılmayan değişken uyarıları).
4. Kullanılmayan `isMockMode` import'u silindi.
5. **Garson çağırma dinleyicisi eklendi (Faz 3.2):** Broadcast handler'a `WAITER_CALLED` dalı eklendi → sesli uyarı (`playAlertSound`) + liste yenileme. `loadOrders()` içinde bekleyen çağrılar okunurken eksik `table_name` masa listesinden zenginleştiriliyor.
6. İlk yükleme effect'leri (`loadTablesAndAssignments`, `loadOrders`) mikro görev'e ertelendi.

#### `auth-context.tsx`
1. localStorage oturum hidrasyonu mikro görev'e ertelendi (`set-state-in-effect`).
2. `catch (e)` → `catch`.
3. `passwordHash` destructuring'i yerine açık `toPublicUser()` yardımcısı — şifre alanının kullanıcıya sızmaması garantilendi.
4. **`window.location.href = "/login"` → `router.replace("/login")`** — Next.js client navigasyonu (tam sayfa yenilenmesi yerine).
5. `login()` imzası `Promise<boolean>` → `Promise<User | null>` (bkz. login sayfası).

### Sayfalar (`app/`)

#### `app/(auth)/login/page.tsx`
- **Yönlendirme mantığı düzeltildi:** Yönlendirme artık girilen kullanıcı adına göre değil, dönen `user.role` / `user.venue` değerine göre yapılıyor (`admin → /admin`, `staff → /panel/<venue>`). Kullanıcı adı büyük/küçük harf ya da farklı bir isimle yazılsa bile doğru panele gider.
- `catch (err)` → `catch`.

#### `app/(dashboard)/admin/page.tsx`
- Kullanılmayan import'lar silindi (`AuditLogViewer`, `StaffManagementTab`, `KeyRound`) ve kullanılmayan `useAuth()` destructuring'i kaldırıldı.
- Log/personel sayacı yüklemesi mikro görev'e ertelendi.

#### `app/(dashboard)/admin/[venue]/staff/page.tsx` & `logs/page.tsx`
- VENUE_DETAILS'daki `icon: any` → `LucideIcon` tipi.

#### `app/(dashboard)/panel/cafe|club|seafood/page.tsx`
- Kullanılmayan `const { user } = useAuth()` blokları kaldırıldı (kimlik koruması dashboard layout'unda zaten var).

#### `app/(dashboard)/panel/restaurant/menu/page.tsx`
- 7 kullanılmayan import silindi (`Link`, `Leaf`, `Flame`, `Coffee`, `Snowflake`, `Star`, `ArrowLeft`).
- **Render saflığı hatası:** `broadcastMenuChange` içinde render/effect zamanında `Date.now()` çağrılıyordu → alıcılar timestamp'i kullanmadığı için alan tamamen kaldırıldı.
- Veri çekme effect'i mikro görev'e ertelendi.
- `handleDuplicateProduct`: kullanılmayan `id`/`created_at` destructuring'i yerine doğrudan override ile aynı sonuç.
- JSX'te kaçış karakterleri (`&quot;Yeni Ürün Ekle&quot;`).
- `oz.soguk` erişimi `Boolean(oz.soğuk ?? oz.soguk)` ile tiplendi (ürün kartındaki "Soğuk" rozeti).

#### `app/(dashboard)/panel/restaurant/page.tsx`
- Kullanılmayan `UserCheck`, `CheckCircle2` importları ve `isLocked` değişkeni kaldırıldı.

#### `app/(dashboard)/panel/restaurant/qr/page.tsx`
- `baseUrl` state+effect yerine `useSyncExternalStore(subscribeToNothing, ...)` — sunucuda fallback, istemcide gerçek origin.
- `fetchTables` → `useCallback` + ertelenmiş effect.

#### `app/(public)/dev-portal/page.tsx`
- `origin` için aynı `useSyncExternalStore` deseni; `useCallback` + ertelenmiş fetch; kullanılmayan `t` ve `qrUrl` kaldırıldı.

#### `app/(public)/cafe/page.tsx` / `club/page.tsx`
- Kullanılmayan `Map` importu silindi; club metnindeki kesme işaretleri `&apos;` ile escape edildi.

#### `app/(public)/restaurant/table/[tableId]/page-client.tsx`
- **Aktif kategori artık türetilmiş durum:** `selectedCategoryId ?? categories[0]?.id` — "ilk kategoriyi seç" effect'i tamamen kaldırıldı (kategoriler geç yüklense bile otomatik seçim çalışır).
- Mock modu açıklama metnindeki tırnaklar escape edildi.

### Bileşenler (`components/`)

#### `components/dashboard/admin-charts.tsx`
- **Fonksiyonel hata (Faz 3.1):** Personel grafiği yanlış localStorage anahtarını okuyordu (`yali_waiters` — hiçbir kod bu anahtara yazmıyor). Artık StaffContext'in yazdığı `yali_staff_list_v2` okunuyor (eski anahtar fallback olarak korundu) ve parse edilen verinin şekli doğrulanıyor.
- **Fonksiyonel hata (Faz 3.6):** Saatlik ciro grafiğinde kayıt atama hatası vardı — `Math.abs(logHour - targetHour) < 2` komşu kovalara çift sayım yapıyor, 23:00–01:00 arası kayıtları ise hiç yakalamıyordu. Yeni mantık her kaydı 24 saatlik dairesel uzaklığa göre **en yakın tek kovaya** atıyor.
- Effect erteleme + tip güvenli JSON parse.

#### `components/dashboard/audit-log-viewer.tsx`
- **Fonksiyonel hata (Faz 3.5):** Personel filtre dropdown'ı sabit `DEFAULT_WAITERS` listesini gösteriyordu; eklenen/silinen personel filtrede görünmüyordu. Artık canlı `useStaff()` listesi kullanılıyor (bileşen yalnızca `StaffProvider` içinde kullanıldığı için güvenli).
- Log yükleme effect'i ertelendi; broadcast temizliği güçlendirildi.

#### `components/dashboard/order-edit-modal.tsx`
- **Fonksiyonel hata (Faz 3.3):** "Yeni Ürün Ekle" sekmesi doğrudan `mockProducts` üzerinden filtreliyordu — Supabase modunda garson gerçek DB ürünlerini siparişe ekleyemezdi. Artık modal açıldığında `/api/products` + `/api/categories`'ten canlı menü yükleniyor (mock modda route'lar zaten mock veri döndürüyor, davranış değişmedi).
- Sipariş resetleme effect'i → render-sırasında-ayar deseni (`lastSyncedKey` state'i), `exhaustive-deps` uyarısı da ortadan kalktı.

#### `components/dashboard/product-management-modal.tsx`
- Form doldurma effect'i (17 senkron `setState`) → render-sırasında-ayar deseni (`formSyncKey`). Yan etki: menü arka planda yeniden yüklenirken kullanıcının yarım kalmış form girdileri artık sıfırlanmıyor.
- Kullanılmayan `ImageIcon`, `X` importları ve gereksiz `useEffect` importu silindi.

#### `components/dashboard/waiter-order-modal.tsx`
- 6 kullanılmayan ikon importu silindi.
- `tablesList` state'i → türetilmiş değer (`allTables` boşsa mock fallback) — ayrı senkronizasyon effect'i kaldırıldı.
- Modal-açılış reset bloğu → render-sırasında-ayar deseni (`openSyncKey`).

#### `components/menu/category-nav.tsx`
- Kullanılmayan `HelpCircle`, `DialogHeader` importları ve `t` destructuring'i kaldırıldı.

#### `components/menu/product-detail-dialog.tsx`
- Kullanılmayan `Info` importu; dialog açılış reset'i → render-adjust deseni.

#### `components/ui/status-banner.tsx`
- `session.status` değişince `dismissed` sıfırlama effect'i → render-adjust deseni (`prevStatus` state).

#### `components/ui/yali-preloader.tsx` — **(Faz 3.4)**
- **Animasyonun kendiliğinden baştan başlama hatası:** Effect bağımlılıklarında parent'tan gelen inline arrow `onComplete` vardı; üst bileşenin her render'ı preloader'ı yeniden tetikliyordu. `onComplete` artık ref üzerinden okunuyor, bağımlılık listesi kararlı.
- `runSequence` kapı-açma timeout'u artık ref'te tutulup tekrar oynatmadan önce temizleniyor; "Menüyü İncele" fade-out timeout'u da cleanup ediliyor (bileşen unmount olursa timer sızmıyor).
- Zaten izlenmişse kapanma dalı mikro görev'e ertelendi.

#### Diğer küçük bileşen düzeltmeleri
- `cart-drawer.tsx`: kullanılmayan `Separator`, `removeFromCart`.
- `category-management-modal.tsx`: kullanılmayan `Check`.
- `dashboard-header.tsx`: kullanılmayan `lang`.
- `order-card.tsx`: kullanılmayan `Utensils`; not metnindeki tırnaklar `&quot;` ile escape edildi.
- `venue-sub-nav.tsx`: `icon: any` → `LucideIcon`; kullanılmayan `ClipboardList`.
- `site-footer.tsx`: yıl değeri için `suppressHydrationWarning` (yılbaşı gece yarısı hydration uyarısı riski).
- `audit-logger.ts`: 2 boş `catch (e)`.
- `mock-data.ts`: `let mockTables` → `const`.
- `lib/types/database.ts`: `Product.ozellikler` index signature `any` → `unknown`.

### API Route'ları (`app/api/`)
Tüm dosyalarda aynı desen düzeltildi (davranış korunarak):
- `catch (error: any) { return NextResponse.json({ error: error.message }) }` → `catch (error) { const message = error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu"; ... }` (`unknown` tip güvenliği)
- Hata durumunda hatanın kullanılmadığı GET handler'ları → parametresiz `catch {}`
- `categories/route.ts`: kullanılmayan `request` parametresi kaldırıldı (GET)
- `session/route.ts`: kullanılmayan `mockCategories`/`mockProducts` importları silindi
- `cart/route.ts`: PUT/DELETE'te artık kullanılmayan `props.params` parametreleri ve ölü `tableId` değişkenleri kaldırıldı

### Yeni Dosyalar (Faz 3.10)
| Dosya | Amaç |
|---|---|
| `app/error.tsx` | Beklenmeyen çalışma anı hataları için marka uyumlu hata ekranı + "Tekrar Dene" |
| `app/not-found.tsx` | 404 sayfası ("Ana Sayfaya Dön" linki) |
| `app/(public)/restaurant/table/[tableId]/loading.tsx` | QR ile masa sayfası açılırken anlık yükleme göstergesi |

---

## 4. Doğrulama Sonuçları

```
npm run lint                    → 0 hata, 0 uyarı ✅
npx tsc --noEmit                → temiz ✅
npm run build (Next.js 16.3)    → başarılı, 24 route üretildi ✅
```

Build çıktısındaki route'lar: `/`, `/cafe`, `/club`, `/seafood`, `/restaurant`, `/restaurant/table/[tableId]`, `/dev-portal`, `/login`, `/admin*`, `/panel/*`, `/api/*` — tamamı beklendiği gibi statik/dinamik sınıflandırmalarıyla üretildi.

## 5. Bilinçli Olarak Dokunulmayan Konular (Supabase sonrası)

Kullanıcı talebiyle Supabase bağlantısı kurulana kadar ertelendi:

1. **Kimlik doğrulama sahte** — şifreler kaynak kodda (`auth-context.tsx` MOCK_USERS); panel koruması sadece tarayıcı tarafında. → Supabase Auth'a geçilmeli.
2. **API route'larında yetki kontrolü yok** — anonim POST/PUT/DELETE mümkün.
3. **RLS politikaları kırık** — `002_rls_policies.sql` hiçbir yerde gönderilmeyen `x-table-token` header'ına bakıyor; `007` migration menüyü `FOR ALL USING (true)` ile herkese açmış; `006` tablolarında RLS hiç yok.
4. **UUID ihlali** — API'lerde `"p_"+random` / `"tbl_"+random` id'ler UUID kolonlara yazılıyor; hatalar sessizce mock fallback ile maskeleniyor (`success: true` dönülüyor). Tüm API route'larındaki "sessiz mock fallback" davranışı kaldırılmalı.
5. **Sepet NULL karşılaştırması** — `cart/route.ts` içindeki `.eq('not_text', notText || null)` PostgREST'te çalışmaz; `.is('not_text', null)` gerekir → tekrarlı satır oluşur.
6. **Cart PUT/DELETE ownership kontrolü yok (IDOR)** — token sadece "var mı" diye bakılıyor, doğrulanmıyor.
7. **`masa_no UNIQUE` kısıtı** çok-mekân mimarisiyle çelişiyor (001 migration).
8. **Görseller base64 olarak DB'ye yazılıyor** — Supabase Storage'a taşınmalı.
9. **Audit log'lar cihaz-local** — merkezi tabloya yazılmalı.
10. **Diğer düşük öncelik:** `next.config.ts` images wildcard `**` daraltılmalı; `/dev-portal` production'da kapatılmalı; PIN'lerin kilit ekranında düz gösterimi; kullanılmayan `framer-motion`/`tw-animate-css` bağımlılıkları; `SUPABASE_SERVICE_ROLE_KEY` env'i kodda henüz kullanılmıyor.

## 6. Manuel Smoke Test Kontrol Listesi

```bash
npm run dev
```

- [ ] `/` landing açılıyor, footer'da yıl görünüyor
- [ ] `/login` → hatalı giriş: hata kutusunda **sarsılma animasyonu** oynuyor (önceki: animasyon yok)
- [ ] `admin / admin123` → `/admin` grafik ekranı; sol menüden personel ekleyip grafikte **göründüğünü** doğrula (önceki: hep default kadro)
- [ ] Admin → Personel & PIN'den yeni personel ekle → `/admin/restaurant/logs` filtre dropdown'ında yeni personel görünüyor (önceki: sabit liste)
- [ ] `/dev-portal` → "Dış 1" masasına giriş
- [ ] Menüde ürün detayı aç → sepete ekle → sepet çubuğunda **shimmer parlaması**
- [ ] Sepet onayı → garson PIN'iyle `/panel/restaurant` giriş → sipariş onayla
- [ ] Müşteri menüsünde "Garson Çağır" → garson panelinde **kırmızı çağrı kartı + alarm sesi** beliriyor; "Yanıtla/Kapat" ile temizleniyor (önceki: hiç görünmüyordu)
- [ ] Sipariş düzenle (kalem simgesi) → "Yeni Ürün Ekle" sekmesi gerçek menüyü listeliyor
- [ ] QR sayfasından masa oluşturma (`/panel/restaurant/qr`) çalışıyor
- [ ] Preloader'ı "Açılışı Tekrar Gör" ile oynat; animasyon sırasında başka sekmeye geçip dönünce **baştan başmıyor** (önceki: her etkileşimde resetleniyordu)

---

# 🖼️ Ek Bölüm — Restaurant Tarafına Marka Logosu (24 Ağustos 2026)

**Talep:** Müşteri preloader'ındaki logo (`public/logo.png`) restaurant tarafının tamamında kullanılsın — admin panelinin restaurant bölümünde ve görevli tarafının restaurant girişinde görünsün.
**Kararlar:** Koyu tema için **açık rozet kapsayıcı** (preloader'daki krem zemin + altın çerçeve); sidebar'da yalnızca Restaurant nav ikonu değişti (üst marka ve diğer mekanlar aynen korundu).

## Yeni Bileşen

### `components/ui/yali-logo.tsx`
- `<YaliLogo size="sm|md|lg" shadow? className? />`
- `next/image` + `/logo.png`, `unoptimized` — preloader ile birebir aynı render yaklaşımı
- Kapsayıcı: `#FDFCFA` (paper) zemin + `%30-40` opak altın çerçeve → **açık/koyu temada net görünür**
- Boyutlar: `sm` 28px (nav/breadcrumb), `md` 48px (sayfa başlığı), `lg` 64px (PIN ekranı, admin kartı)

## Uygulanan Noktalar (8)

| # | Dosya | Değişiklik |
|---|---|---|
| 1 | `components/dashboard/waiter-pin-lock-modal.tsx` | PIN giriş ekranındaki `Lock` ikon kutusu → `YaliLogo lg`. Köşe rozeti korundu: normalde `KeyRound`, giriş başarılıysa yeşil `CheckCircle2` |
| 2 | `app/(dashboard)/panel/restaurant/page.tsx` | "RESTAURANT GÖREVLİ PANELİ" başlığındaki `Utensils` → `YaliLogo md` |
| 3 | `app/(dashboard)/panel/restaurant/menu/page.tsx` | "RESTAURANT MENÜ & ÜRÜN YÖNETİMİ" başlığı → `YaliLogo md` |
| 4 | `app/(dashboard)/panel/restaurant/qr/page.tsx` | "MASA & QR YÖNETİMİ" başlığındaki `QrCode` → `YaliLogo md` (kullanılmayan `QrCode` importu da temizlendi) |
| 5 | `app/(dashboard)/admin/[venue]/staff/page.tsx` | Breadcrumb'da venue ikonu: `restaurant` için `YaliLogo sm`, diğer mekanlarda mevcut ikon |
| 6 | `app/(dashboard)/admin/[venue]/logs/page.tsx` | Aynı koşullu breadcrumb değişikliği |
| 7 | `app/(dashboard)/admin/page.tsx` | `/admin` ana sayfadaki "Yalı Restaurant" mekan kartı: renkli ikon kutusu yerine `YaliLogo lg` (`isLogo` bayrağı; diğer 3 mekan kartı etkilenmedi) |
| 8 | `components/dashboard/dashboard-sidebar.tsx` | Sol menüde "Restaurant" nav öğesinin `Utensils` ikonu → `YaliLogo sm` (üst "YALI Yönetim" markası ve diğer mekan ikonları aynen) |

## Dokunulmayanlar
- Cafe / Club / Seafood tüm ekranlarda mevcut lucide ikonlarıyla kaldı
- Login sayfası, müşteri tarafı, site header/footer, sidebar üst markası değişmedi

## Doğrulama
```
npm run lint     → 0 hata / 0 uyarı ✅
npx tsc --noEmit → temiz ✅
npm run build    → başarılı, 24 route ✅
```

## Görsel Kontrol Listesi
- [ ] `/panel/restaurant` PIN kilit ekranında logo görünüyor (yanlış PIN'de sarsılma, doğru PIN'de köşede yeşil onay)
- [ ] Görevli paneli, Menü ve QR sayfalarının başlıklarında logo var
- [ ] `/admin` → "Yalı Restaurant" kartında logo; diğer 3 mekan kartında renkli ikonlar duruyor
- [ ] `/admin/restaurant/staff` ve `/admin/restaurant/logs` breadcrumb'ında logo; `/admin/cafe/...` vb. eski ikonla
- [ ] Sol menüde Restaurant satırında logo; üst marka ve Cafe/Club/Seafood satırları eski haliyle
- [ ] **Koyu temaya geçiş** (üst bardaki tema düğmesi) → logonun krem rozet içinde net görünüdüğü doğrulanır

---

# 📱 Ek Bölüm — PWA + Offline Menü (24 Ağustos 2026)

**Talep:** Müşteri menüsüne PWA desteği ve çevrimdışı menü görüntüleme eklendi.

## Mimari Kararlar
- **Service worker kapsamı /restaurant/ ile sınırlandırıldı** (public/restaurant/sw.js): yönetim paneli, admin, API yönetim uçları ve diğer mekan sayfaları SW kapsamı dışında — admin'in menü düzenlemeleri sonrası bayat veri görmesi imkânsız.
- **Sipariş/sepet istekleri (/api/table/*) asla önbelleklenmez** — siparişler her zaman canlı akar; offline sipariş kuyruklama gibi riskli bir davranış yok.
- **Menü verileri** (/api/products, /api/categories) **stale-while-revalidate**: çevrimdışında önbellekten anında görünür, çevrimiçinde arka planda tazelenir.
- **Görseller + statik varlıklar** cache-first (unsplash ürün fotoğrafları dahil — opaque response'lar da önbelleklenir).
- **Sayfa gezinmeleri** network-first → önbellek → precache'li offline.html yedek sayfası.
- **Sürümleme:** sw.js başındaki VERSION sabiti artırıldığında eski tüm önbellekler activate adımında silinir (bayat menü riskine karşı).

## Yeni Dosyalar
| Dosya | Amaç |
|---|---|
| public/manifest.json | Uygulama kimliği: start_url=/restaurant, scope=/restaurant/, standalone, altın tema rengi, 4 ikon |
| public/icons/icon-{192,512}.png | logo.png'den üretilen krem zeminli ikonlar (any) |
| public/icons/icon-maskable-{192,512}.png | Android maskelenmiş ikon için güvenli alanlı versiyonlar |
| public/restaurant/sw.js | Service worker (yukarıdaki stratejiler) |
| public/restaurant/offline.html | Çevrimdışı yedek sayfa (marka renkleri + "Tekrar Dene") |
| components/pwa/register-sw.tsx | SW kaydı (load sonrası, tek seferlik) |
| components/pwa/install-prompt.tsx | "Ana Ekrana Ekle" teşvik banner'ı + çevrimdışı göstergesi |

## Değişen Dosyalar
- pp/layout.tsx → metadata'ya manifest, ikonlar ve ppleWebApp eklendi; viewport'a 	hemeColor: #B98A4A
- pp/(public)/restaurant/table/[tableId]/page-client.tsx → <RegisterServiceWorker /> + <InstallPrompt /> mount edildi
- eslint.config.mjs → public/** lint dışına alındı (SW global'leri self/caches lint üretmesin)

## Install Prompt Davranışı
- Android/Chrome: eforeinstallprompt yakalanır → "Ana Ekrana Ekle" düğmesi
- iOS Safari: 4 sn sonra "Paylaş → Ana Ekrana Ekle" talimat şeridi (iOS'ta yerel prompt yok)
- Uygulama zaten kuruluysa (standalone mod) gösterilmez
- Kapatılırsa 14 gün boyunca tekrar çıkmaz (yali_pwa_dismissed_at)
- Çevrimdışı olunca sepette altın renkli "Çevrimdışı — menü önbellekten gösteriliyor" baloncuğu

## Doğrulama
`
npm run lint     → 0/0 ✅
npx tsc --noEmit → temiz ✅
npm run build    → başarılı, manifest link'i HTML çıktısında doğrulandı ✅
`

## Manuel Test (telefon/emülatör gerekir)
- [ ] 
pm run dev → QR menüyü aç → DevTools > Application > Manifest: hata yok, ikonlar görünüyor
- [ ] Application > Service Workers: sw.js activated (scope /restaurant/)
- [ ] Menüyü bir kez gez → DevTools > Network > Offline → sayfayı yenile → **menü açılmaya devam ediyor** + altın "Çevrimdışı" baloncuğu
- [ ] Çevrimdışıyken sipariş vermeye çalışmak başarısız olmalı (beklenen davranış)
- [ ] Android Chrome'da banner → "Ana Ekrana Ekle" → ana ekranda Yalı ikonu, tam ekran açılış
- [ ] Menü yönetiminden ürün düzenle → admin sayfaları anında güncel (SW kapsamı dışı olduğu için)
