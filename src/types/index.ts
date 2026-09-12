export type IconName =
  keyof typeof import("@expo/vector-icons").MaterialIcons.glyphMap;

export type TransactionType = 'expense' | 'income' | 'transfer';

export type RepeatFreq = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RepeatRule {
  freq: RepeatFreq;
  endsOn?: string;
}

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
  repeat?: RepeatRule;
  nextDue?: string;
  repeatPaused?: boolean;
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
