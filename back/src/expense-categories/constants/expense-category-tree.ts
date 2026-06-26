export const EXPENSE_CATEGORY_TREE = [
  {
    name: "Bo'sh ofis",
    children: [
      "Kommunal to'lovlar",
      'Internet va aloqa',
      'Ofis jihozlari',
      "Ta'mirlash",
      'Boshqa',
    ],
  },
  {
    name: 'Hodimlar uchun',
    children: [
      'Tushlik (filialda)',
      "Yo'lkira (uyidan qatnash yoki mijoz uyiga borib kelish)",
      'Avans (shu oy oyligidan)',
      'Avans (1 oy oldingi oyligidan)',
      'Oylik (shu oy oyligi)',
      'Oylik (oldingi oy oyligi)',
    ],
  },
  {
    name: 'Ijaralar',
    children: [
      'Oylik ijara',
      'Depozit',
      'Kommunal xizmatlar',
      'Boshqa',
    ],
  },
  {
    name: "Do'kon",
    children: [
      'Mahsulot xaridlari',
      'Uskuna va anjomlar',
      "Ta'mirlash",
      'Boshqa',
    ],
  },
  {
    name: 'Yetkazib berish',
    children: [
      'Transport xizmati',
      "Yoqilg'i",
      'Kuryer',
      'Boshqa',
    ],
  },
  {
    name: 'Reklama (marketing)',
    children: [
      'Ijtimoiy tarmoq',
      'Banner va reklama',
      'Aksiya va chegirma',
      'Boshqa',
    ],
  },
] as const;
