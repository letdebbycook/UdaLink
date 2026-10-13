export interface ProfileData {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  theme: string;
  whatsapp: string | null;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  is_pro?: boolean;
}

export interface CategoryData {
  id: string;
  name: string;
  sort_order: number;
}

export interface ProductData {
  id: string;
  number: number;
  name: string;
  price: number | null;
  image_url: string | null;
  affiliate_url: string;
  marketplace: "shopee" | "tiktok" | "tokopedia" | "lazada" | "lainnya";
  category_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  clicks_count?: number;
}

export interface BannerData {
  id: string;
  image_url: string;
  title: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface PublicPageData {
  profile: ProfileData;
  categories: CategoryData[];
  products: ProductData[];
  banners: BannerData[];
  theme: string;
  show_branding: boolean;
}

// 1 Affiliator: "nando"
export const dummyProfile: ProfileData = {
  id: "usr_nando_001",
  username: "nando",
  display_name: "Nando Pratama",
  bio: "Sharing racun shopee, outfit harian & gadget produktif terfavorit ✨ Cek nomor di bio untuk link belanja!",
  avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  theme: "hijau",
  whatsapp: "6281234567890",
  instagram: "nandopratama",
  tiktok: "nandoreview",
  youtube: "https://youtube.com/@nandopratama",
  is_pro: true,
};

// 4 Kategori
export const dummyCategories: CategoryData[] = [
  { id: "cat_1", name: "Fashion Pria", sort_order: 1 },
  { id: "cat_2", name: "Gadget & Setup", sort_order: 2 },
  { id: "cat_3", name: "Perawatan Tubuh", sort_order: 3 },
  { id: "cat_4", name: "Peralatan Rumah", sort_order: 4 },
];

// 2 Banner
export const dummyBanners: BannerData[] = [
  {
    id: "ban_1",
    image_url: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80",
    title: "Promo Tanggal Kembar Diskon Hingga 70%",
    link_url: "https://shopee.co.id",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "ban_2",
    image_url: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800&auto=format&fit=crop&q=80",
    title: "Gratis Ongkir Se-Indonesia Tanpa Minimum Belanja",
    link_url: "https://tokopedia.com",
    sort_order: 2,
    is_active: true,
  },
];

// 12 Produk
export const dummyProducts: ProductData[] = [
  {
    id: "prod_1",
    number: 1,
    name: "Kemeja Linen Oversized Lengan Pendek Minimalis",
    price: 139000,
    image_url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=80",
    affiliate_url: "https://shopee.co.id/universal-link-1",
    marketplace: "shopee",
    category_id: "cat_1",
    is_active: true,
    is_featured: true,
    clicks_count: 142,
  },
  {
    id: "prod_2",
    number: 2,
    name: "Celana Corduroy Straight Ankle Cut Premium",
    price: 185000,
    image_url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&auto=format&fit=crop&q=80",
    affiliate_url: "https://tokopedia.com/universal-link-2",
    marketplace: "tokopedia",
    category_id: "cat_1",
    is_active: true,
    is_featured: true,
    clicks_count: 98,
  },
  {
    id: "prod_3",
    number: 3,
    name: "Mechanical Keyboard Wireless 75% Gasket Mount RGB",
    price: 499000,
    image_url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=80",
    affiliate_url: "https://shopee.co.id/universal-link-3",
    marketplace: "shopee",
    category_id: "cat_2",
    is_active: true,
    is_featured: true,
    clicks_count: 310,
  },
  {
    id: "prod_4",
    number: 4,
    name: "Mouse Ergonomis Nirkabel Dual Mode Silent Click",
    price: 145000,
    image_url: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop&q=80",
    affiliate_url: "https://shopee.co.id/universal-link-4",
    marketplace: "shopee",
    category_id: "cat_2",
    is_active: true,
    is_featured: false,
    clicks_count: 76,
  },
  {
    id: "prod_5",
    number: 5,
    name: "Desk Mat Kulit Sintetis Waterproof Ukuran 80x40cm",
    price: 65000,
    image_url: "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=500&auto=format&fit=crop&q=80",
    affiliate_url: "https://tiktok.com/@shop-link-5",
    marketplace: "tiktok",
    category_id: "cat_2",
    is_active: true,
    is_featured: false,
    clicks_count: 54,
  },
  {
    id: "prod_6",
    number: 6,
    name: "Serum Wajah Niacinamide 10% Mencerahkan Bekas Jerawat",
    price: 89000,
    image_url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=80",
    affiliate_url: "https://shopee.co.id/universal-link-6",
    marketplace: "shopee",
    category_id: "cat_3",
    is_active: true,
    is_featured: true,
    clicks_count: 220,
  },
  {
    id: "prod_7",
    number: 7,
    name: "Sunscreen Gel SPF 50 PA++++ Ringan Bebas Whitecast",
    price: 75000,
    image_url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80",
    affiliate_url: "https://tiktok.com/@shop-link-7",
    marketplace: "tiktok",
    category_id: "cat_3",
    is_active: true,
    is_featured: false,
    clicks_count: 115,
  },
  {
    id: "prod_8",
    number: 8,
    name: "Lampu Meja LED Aesthetic Dimmer Fleksibel USB",
    price: 110000,
    image_url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=80",
    affiliate_url: "https://shopee.co.id/universal-link-8",
    marketplace: "shopee",
    category_id: "cat_4",
    is_active: true,
    is_featured: false,
    clicks_count: 88,
  },
  {
    id: "prod_9",
    number: 9,
    name: "Diffuser Aromaterapi Ultrasonik Motif Kayu 500ml",
    price: 125000,
    image_url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&auto=format&fit=crop&q=80",
    affiliate_url: "https://lazada.co.id/universal-link-9",
    marketplace: "lazada",
    category_id: "cat_4",
    is_active: true,
    is_featured: false,
    clicks_count: 42,
  },
  {
    id: "prod_10",
    number: 10,
    name: "Tote Bag Kanvas Tebal dengan Resleting & Kantong Laptop",
    price: 95000,
    image_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80",
    affiliate_url: "https://shopee.co.id/universal-link-10",
    marketplace: "shopee",
    category_id: "cat_1",
    is_active: true,
    is_featured: false,
    clicks_count: 67,
  },
  {
    id: "prod_11",
    number: 11,
    name: "Stand Laptop Aluminium Kokoh Bisa Dilipat 6 Tingkat",
    price: 82000,
    image_url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=80",
    affiliate_url: "https://tokopedia.com/universal-link-11",
    marketplace: "tokopedia",
    category_id: "cat_2",
    is_active: true,
    is_featured: false,
    clicks_count: 153,
  },
  {
    id: "prod_12",
    number: 12,
    name: "Tumbler Stainless Steel Tahan Dingin Panas 24 Jam 750ml",
    price: 169000,
    image_url: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80",
    affiliate_url: "https://shopee.co.id/universal-link-12",
    marketplace: "shopee",
    category_id: "cat_4",
    is_active: true,
    is_featured: true,
    clicks_count: 180,
  },
];

export const dummyPublicPage: PublicPageData = {
  profile: dummyProfile,
  categories: dummyCategories,
  products: dummyProducts,
  banners: dummyBanners,
  theme: "hijau",
  show_branding: false,
};
