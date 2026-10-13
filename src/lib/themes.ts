export interface ThemeDefinition {
  id: string;
  name: string;
  isPremium: boolean;
  bg: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  button: string;
  buttonText: string;
  buttonHover: string;
  badgeBg: string;
  badgeText: string;
  chipActiveBg: string;
  chipActiveText: string;
}

export const THEMES: Record<string, ThemeDefinition> = {
  // 3 TEMA DASAR
  hijau: {
    id: "hijau",
    name: "Hijau",
    isPremium: false,
    bg: "#F0FDF4",
    card: "#FFFFFF",
    cardBorder: "#DCFCE7",
    text: "#0F172A",
    textSecondary: "#64748B",
    button: "#16A34A",
    buttonText: "#FFFFFF",
    buttonHover: "#15803D",
    badgeBg: "#DCFCE7",
    badgeText: "#15803D",
    chipActiveBg: "#16A34A",
    chipActiveText: "#FFFFFF",
  },
  putih: {
    id: "putih",
    name: "Putih Klasik",
    isPremium: false,
    bg: "#F8FAFC",
    card: "#FFFFFF",
    cardBorder: "#E2E8F0",
    text: "#0F172A",
    textSecondary: "#64748B",
    button: "#0F172A",
    buttonText: "#FFFFFF",
    buttonHover: "#334155",
    badgeBg: "#F1F5F9",
    badgeText: "#334155",
    chipActiveBg: "#0F172A",
    chipActiveText: "#FFFFFF",
  },
  gelap: {
    id: "gelap",
    name: "Gelap",
    isPremium: false,
    bg: "#0F172A",
    card: "#1E293B",
    cardBorder: "#334155",
    text: "#F8FAFC",
    textSecondary: "#94A3B8",
    button: "#16A34A",
    buttonText: "#FFFFFF",
    buttonHover: "#15803D",
    badgeBg: "#334155",
    badgeText: "#86EFAC",
    chipActiveBg: "#16A34A",
    chipActiveText: "#FFFFFF",
  },

  // 5 TEMA PREMIUM
  pink: {
    id: "pink",
    name: "Pink Pastel",
    isPremium: true,
    bg: "#FDF2F8",
    card: "#FFFFFF",
    cardBorder: "#FCE7F3",
    text: "#831843",
    textSecondary: "#9D174D",
    button: "#DB2777",
    buttonText: "#FFFFFF",
    buttonHover: "#BE185D",
    badgeBg: "#FCE7F3",
    badgeText: "#BE185D",
    chipActiveBg: "#DB2777",
    chipActiveText: "#FFFFFF",
  },
  biru: {
    id: "biru",
    name: "Biru Laut",
    isPremium: true,
    bg: "#F0F9FF",
    card: "#FFFFFF",
    cardBorder: "#E0F2FE",
    text: "#0C4A6E",
    textSecondary: "#0369A1",
    button: "#0284C7",
    buttonText: "#FFFFFF",
    buttonHover: "#0369A1",
    badgeBg: "#E0F2FE",
    badgeText: "#0369A1",
    chipActiveBg: "#0284C7",
    chipActiveText: "#FFFFFF",
  },
  oranye: {
    id: "oranye",
    name: "Oranye Hangat",
    isPremium: true,
    bg: "#FFF7ED",
    card: "#FFFFFF",
    cardBorder: "#FFEDD5",
    text: "#7C2D12",
    textSecondary: "#C2410C",
    button: "#EA580C",
    buttonText: "#FFFFFF",
    buttonHover: "#C2410C",
    badgeBg: "#FFEDD5",
    badgeText: "#C2410C",
    chipActiveBg: "#EA580C",
    chipActiveText: "#FFFFFF",
  },
  ungu: {
    id: "ungu",
    name: "Ungu Malam",
    isPremium: true,
    bg: "#2E1065",
    card: "#3B0764",
    cardBorder: "#581C87",
    text: "#FAF5FF",
    textSecondary: "#D8B4FE",
    button: "#9333EA",
    buttonText: "#FFFFFF",
    buttonHover: "#7E22CE",
    badgeBg: "#581C87",
    badgeText: "#E9D5FF",
    chipActiveBg: "#9333EA",
    chipActiveText: "#FFFFFF",
  },
  krem: {
    id: "krem",
    name: "Krem Minimalis",
    isPremium: true,
    bg: "#FFFBEB",
    card: "#FFFFFF",
    cardBorder: "#FEF3C7",
    text: "#78350F",
    textSecondary: "#92400E",
    button: "#D97706",
    buttonText: "#FFFFFF",
    buttonHover: "#B45309",
    badgeBg: "#FEF3C7",
    badgeText: "#B45309",
    chipActiveBg: "#D97706",
    chipActiveText: "#FFFFFF",
  },
};

export const DEFAULT_THEME = THEMES.hijau;

export function getTheme(themeId?: string): ThemeDefinition {
  if (!themeId) return DEFAULT_THEME;
  return THEMES[themeId] || DEFAULT_THEME;
}
