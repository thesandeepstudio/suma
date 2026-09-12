import { Category } from "../types";
import appData from "../../data/app-data.json";

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: "NPR", symbol: "Rs", name: "Nepalese Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "CN¥", name: "Chinese Yuan" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "AED", symbol: "AED", name: "UAE Dirham" },
  { code: "SAR", symbol: "SAR", name: "Saudi Riyal" },
  { code: "QAR", symbol: "QAR", name: "Qatari Riyal" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble" },
];

export const STORAGE_KEYS = {
  EXPENSES: "@suma_expenses",
  CATEGORIES: "@suma_categories",
  WALLETS: "@suma_wallets",
  BUDGET: "@suma_budget",
  SEED_VERSION: "@suma_seed_version",
  USERNAME: "@suma_username",
  CURRENCY: "@suma_currency",
  CATEGORY_ORDER: "@suma_category_order",
  WALLET_ORDER: "@suma_wallet_order",
  DELETED_SEED_IDS: "@suma_deleted_seed_ids",
  ONBOARDING_DONE: "@suma_onboarding_done",
};

export const DEFAULT_CATEGORIES: Category[] = appData.categories as Category[];

export const COLORS = {
  primary: "#000000",
  secondary: "#000000",
  background: "#FFFFFF",
  card: "#FAFAFA",
  text: "#000000",
  textLight: "#555555",
  textMuted: "#9E9E9E",
  border: "#E0E0E0",
  success: "#6B7280",
  danger: "#111111",
  warning: "#9E9E9E",
  white: "#FFFFFF",
  shadow: "#000000",
  backdrop: "rgba(0,0,0,0.4)",
  surface: "#F1F1F4",
  surfaceStrong: "#EDEDED",
  iconMuted: "#E5E5E5",
  dangerTint: "#FFEBEE",
  onDarkText: "rgba(255,255,255,0.85)",
  onDarkTextDim: "rgba(255,255,255,0.7)",
  onDarkTextFaint: "rgba(255,255,255,0.6)",
  onDarkChip: "rgba(255,255,255,0.1)",
  onDarkChipStrong: "rgba(255,255,255,0.2)",
  chartIncome: "#A0A0A0",
  grid: "#ECECEC",
};

export const DONUT_COLORS: string[] = [
  "#111111",
  "#4A4A4A",
  "#757575",
  "#B0B0B0",
  "#D9D9D9",
];
