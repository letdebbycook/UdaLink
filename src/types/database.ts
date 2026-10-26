export type UserRole = "user" | "admin";

export type MarketplaceType = "shopee" | "tiktok" | "tokopedia" | "lazada" | "lainnya";

export type PaymentStatus = "pending" | "approved" | "rejected";

export interface Profile {
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
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  user_id: string;
  role: UserRole;
  pro_until: string | null;
  is_suspended: boolean;
  payment_code: number;
  last_product_number: number;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  number: number;
  name: string;
  price: number | null;
  image_url: string | null;
  affiliate_url: string;
  marketplace: MarketplaceType;
  category_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: string;
  user_id: string;
  image_url: string;
  title: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Click {
  id: string;
  product_id: string;
  owner_id: string;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  duration_days: number;
  sender_name: string;
  sender_bank: string;
  proof_path: string;
  status: PaymentStatus;
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface PaymentMethodItem {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_active: boolean;
}

export interface AppSettings {
  id: number;
  pro_price: number;
  pro_duration_days: number;
  free_product_limit: number;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  admin_whatsapp: string;
  payment_methods?: PaymentMethodItem[];
  updated_at: string;
  created_at: string;
}

export interface PublicPageResponse {
  profile: {
    id: string;
    username: string;
    display_name: string;
    bio: string | null;
    avatar_url: string | null;
    whatsapp: string | null;
    instagram: string | null;
    tiktok: string | null;
    youtube: string | null;
  };
  effective_theme: string;
  show_branding: boolean;
  is_pro: boolean;
  categories: Array<{
    id: string;
    name: string;
    sort_order: number;
  }>;
  banners: Array<{
    id: string;
    image_url: string;
    title: string | null;
    link_url: string | null;
    sort_order: number;
  }>;
  featured_products: Array<{
    id: string;
    number: number;
    name: string;
    price: number | null;
    image_url: string | null;
    marketplace: MarketplaceType;
    category_id: string | null;
  }>;
  products: Array<{
    id: string;
    number: number;
    name: string;
    price: number | null;
    image_url: string | null;
    marketplace: MarketplaceType;
    category_id: string | null;
    is_featured: boolean;
  }>;
}

export interface MyStatsResponse {
  days: number;
  is_pro: boolean;
  total_clicks: number;
  products_stats: Array<{
    product_id: string;
    number: number;
    name: string;
    marketplace: MarketplaceType;
    price: number | null;
    image_url: string | null;
    click_count: number;
  }>;
}

export interface MyPlanResponse {
  role: UserRole;
  is_pro: boolean;
  pro_until: string | null;
  is_suspended: boolean;
  payment_code: number;
  product_count: number;
  free_product_limit: number;
  pro_price: number;
  pro_duration_days: number;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  admin_whatsapp: string;
  payment_methods?: PaymentMethodItem[];
}

export interface AdminPaymentItem {
  id: string;
  user_id: string;
  amount: number;
  duration_days: number;
  sender_name: string;
  sender_bank: string;
  proof_path: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  user: {
    username: string;
    display_name: string;
  };
}

