import { Category } from "../types";
import appData from "../../data/app-data.json";

export const STORAGE_KEYS = {
  EXPENSES: "@suma_expenses",
  CATEGORIES: "@suma_categories",
  WALLETS: "@suma_wallets",
  BUDGET: "@suma_budget",
  SEED_VERSION: "@suma_seed_version",
  USERNAME: "@suma_username",
  CURRENCY: "@suma_currency",
  CATEGORY_ORDER: "@suma_category_order",
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
};
