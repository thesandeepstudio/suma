export type IconName =
  keyof typeof import("@expo/vector-icons").MaterialIcons.glyphMap;

export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  note?: string;
  type?: TransactionType;
  walletId?: string;
  toWalletId?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: IconName;
}

export interface Budget {
  monthlyCap: number | null;
  categoryCaps: Record<string, number>;
}

export interface Wallet {
  id: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  createdAt: string;
  icon?: IconName;
}
