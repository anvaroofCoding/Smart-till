# Smart Till — Texnik topshiriq (TZ)

## Dastur sozlamalari — Ko'rinish tizimi

### Maqsad
Foydalanuvchi interfeysini tez, aniq va moslashtirilgan holda boshqarish. Barcha o'zgarishlar darhol butun ilovaga (sidebar, header, forma, jadval, dialog) ta'sir qilishi kerak.

### Qo'llab-quvvatlanadigan sozlamalar

| Sozlama | Qiymatlar | Ta'sir doirasi |
|---------|-----------|----------------|
| Rang rejimi | Light / Dark | Butun ilova |
| Shadcn style | Vega, Nova, Maia, Lyra, Mira, Luma, Sera, Rhea | Soyalar va uslub |
| Base color | Neutral, Stone, Zinc, Mauve, Olive, Mist, Taupe | Fon, sidebar, kartalar |
| Theme (accent) | Amber, Blue, Cyan, ... | Primary, ring, sidebar-primary |
| Shriftlar | Inter, Geist, Roboto, ... | Sarlavha va matn |
| **Ikonka kutubxonasi** | **Lucide, Tabler, Hugeicons, Phosphor, Remix** | **Butun ilova ikonkalari** |
| Radius | Yo'q, Kichik, O'rta, Katta | Tugmalar, inputlar, kartalar |
| Bildirishnomalar | Yoq/O'chir | Header bell tugmasi |

---

## Ikonka kutubxonasi — talablar

### Umumiy qoidalar
1. Foydalanuvchi **Dastur sozlamalari** sahifasidan kutubxonani tanlaganda, o'zgarish **darhol** qo'llaniladi (sahifani yangilash shart emas).
2. Tanlov `localStorage` (`smart-till-appearance`) da saqlanadi va qayta ochilganda tiklanadi.
3. Barcha ilova ikonkalari `AppIcon` komponenti orqali chiqariladi — to'g'ridan-to'g'ri `lucide-react` import qilish **taqiqlanadi** (faqat `icon-libraries.ts` ichida).
4. Yangi ikonka qo'shilganda barcha 5 kutubxonaga semantik mapping qo'shilishi shart.

### Qo'llab-quvvatlanadigan kutubxonalar
| ID | Paket | Holat |
|----|-------|-------|
| `lucide` | `lucide-react` | ✅ To'liq |
| `tabler` | `@tabler/icons-react` | ✅ To'liq |
| `hugeicons` | `@hugeicons/react` + `@hugeicons/core-free-icons` | ✅ To'liq |
| `phosphor` | `@phosphor-icons/react` | ✅ To'liq |
| `remix` | `@remixicon/react` | ✅ To'liq |

### Ta'sir qiladigan joylar
- Sidebar menyu ikonkalari
- Header (bell, sidebar trigger)
- Breadcrumb, dropdown, select, checkbox, dialog, sheet
- Login va foydalanuvchi formasi
- Foydalanuvchilar sahifasi (qidiruv, tahrirlash, o'chirish)
- Dastur sozlamalari sahifasi

### Semantik ikonka nomlari (`AppIconName`)
Har bir ikonka kutubxonaga alohida map qilinadi. Misol: `bell`, `settings`, `package`, `users`, `truck`, `warehouse`, `hand-coins`, `chevron-right`, `loader`, `x`, va boshqalar.

Yangi sahifa yoki komponent qo'shilganda:
1. `icon.types.ts` ga `AppIconName` qo'shish
2. `icon-libraries.ts` da 5 ta kutubxona uchun mapping yozish
3. Komponentda `<AppIcon name="..." />` ishlatish

### Tezlik va aniqlik
- Kutubxonalar tree-shaking bilan import qilinadi (faqat ishlatiladigan ikonlar)
- Kutubxona almashtirish O(1) registry lookup — qayta yuklash yo'q
- `AppearanceProvider` konteksti orqali re-render — barcha `AppIcon` avtomatik yangilanadi

---

## Dastur sozlamalari sahifasi — UI talablari
- Sahifa **100% kenglik**da
- Barcha dashboard sahifalari devoridan **10px** bir xil masofa (`config/layout.ts`)
- Barcha sozlamalar **shadcn/ui** komponentlari orqali: `Card`, `Field`, `Select`, `Switch`, `Button`
- Selectlar `SettingsSelect` wrapperi orqali shadcn `Select` ishlatadi
- O'zgarishlar sidebar ranglariga ham ta'sir qiladi (`--sidebar-*` CSS tokenlari)

---

## Kelajakdagi kengaytirish
- Yangi modul qo'shilganda ikonka ro'yxatini yangilash
- Foydalanuvchi darajasida sozlamani serverda saqlash (ixtiyoriy)
- Icon kutubxonasi uchun lazy-load (bundle hajmini kamaytirish) — hozircha barcha kutubxonalar static import
