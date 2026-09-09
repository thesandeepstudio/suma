import AsyncStorage from '@react-native-async-storage/async-storage';
import {Expense, Category, Wallet} from '../types';
import {STORAGE_KEYS, DEFAULT_CATEGORIES} from './constants';
import appData from '../../data/app-data.json';

const SEED_VERSION = appData.seedVersion;

export const getExpenses = async (): Promise<Expense[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.EXPENSES);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
};

export const seedInitialData = async (): Promise<void> => {
  try {
    const version = await AsyncStorage.getItem(STORAGE_KEYS.SEED_VERSION);
    if (version !== SEED_VERSION) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.EXPENSES,
        JSON.stringify(appData.transactions),
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.CATEGORIES,
        JSON.stringify(appData.categories),
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.WALLETS,
        JSON.stringify(appData.wallets),
      );
      await AsyncStorage.setItem(STORAGE_KEYS.SEED_VERSION, SEED_VERSION);
    }
    await ensureSeedRecords();
  } catch {
    // Silent failure for the initial seed
  }
};

const ensureSeedRecords = async (): Promise<void> => {
  const categories = await getCategories();  const merged = DEFAULT_CATEGORIES.map(d => {
    const existing = categories.find(c => c.name === d.name);
    return {...d, id: existing?.id ?? d.id};
  });
  const custom = categories.filter(c => !DEFAULT_CATEGORIES.some(d => d.name === c.name));
  await saveCategories([...merged, ...custom]);
};

export const getDebt = async (): Promise<number> => {
  return 6000;
};

export const getReceivable = async (): Promise<number> => {
  const expenses = await getExpenses();
  const lent = expenses
    .filter(e => (e.type ?? 'expense') === 'expense' && e.category === 'Borrow')
    .reduce((sum, e) => sum + e.amount, 0);
  const returned = expenses
    .filter(e => e.type === 'income' && e.category === 'Borrow')
    .reduce((sum, e) => sum + e.amount, 0);
  return Math.max(0, lent - returned);
};

export const saveExpenses = async (expenses: Expense[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
};

export const addExpense = async (expense: Expense): Promise<void> => {
  const expenses = await getExpenses();
  expenses.unshift(expense);
  await saveExpenses(expenses);
  await applyRecordEffect(expense, 1);
};

export const updateExpense = async (updated: Expense): Promise<void> => {
  const expenses = await getExpenses();
  const idx = expenses.findIndex(e => e.id === updated.id);
  if (idx === -1) return;
  const previous = expenses[idx];
  expenses[idx] = updated;
  await saveExpenses(expenses);
  await applyRecordEffect(previous, -1);
  await applyRecordEffect(updated, 1);
};

export const deleteExpense = async (id: string): Promise<void> => {
  const expenses = await getExpenses();
  const target = expenses.find(e => e.id === id);
  await saveExpenses(expenses.filter(e => e.id !== id));
  if (target) {
    await applyRecordEffect(target, -1);
  }
};

const applyWalletBalance = async (walletId: string | undefined, delta: number): Promise<void> => {
  if (!walletId) return;
  const wallets = await getWallets();
  const idx = wallets.findIndex(w => w.id === walletId);
  if (idx === -1) return;
  wallets[idx] = {...wallets[idx], currentBalance: wallets[idx].currentBalance + delta};
  await AsyncStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
};

const applyRecordEffect = async (expense: Expense, direction: 1 | -1): Promise<void> => {
  const type = expense.type ?? 'expense';
  if (type === 'expense' && expense.category === 'Borrow') return;
  const amount = expense.amount * direction;
  if (type === 'income') {
    await applyWalletBalance(expense.walletId, amount);
  } else if (type === 'transfer') {
    await applyWalletBalance(expense.walletId, -amount);
    await applyWalletBalance(expense.toWalletId, amount);
  } else {
    await applyWalletBalance(expense.walletId, -amount);
  }
};

export const getCategories = async (): Promise<Category[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (json) {
      return JSON.parse(json);
    }
    await AsyncStorage.setItem(
      STORAGE_KEYS.CATEGORIES,
      JSON.stringify(DEFAULT_CATEGORIES),
    );
    return DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
};

export const saveCategories = async (categories: Category[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
};

export const addCategory = async (category: Category): Promise<void> => {
  const categories = await getCategories();
  categories.push(category);
  await saveCategories(categories);
};

export const updateCategory = async (updated: Category): Promise<void> => {
  const categories = await getCategories();
  const idx = categories.findIndex(c => c.id === updated.id);
  if (idx !== -1) {
    categories[idx] = updated;
    await saveCategories(categories);
  }
};

export const deleteCategory = async (id: string): Promise<void> => {
  const categories = await getCategories();
  await saveCategories(categories.filter(c => c.id !== id && c.parentId !== id));
};

export const getWallets = async (): Promise<Wallet[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.WALLETS);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
};

export const addWallet = async (wallet: Wallet): Promise<void> => {
  const wallets = await getWallets();
  wallets.unshift(wallet);
  await AsyncStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
};

export const updateWallet = async (updated: Wallet): Promise<void> => {
  const wallets = await getWallets();
  const idx = wallets.findIndex(w => w.id === updated.id);
  if (idx !== -1) {
    wallets[idx] = updated;
    await AsyncStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
  }
};

export const deleteWallet = async (id: string): Promise<void> => {
  const wallets = await getWallets();
  await AsyncStorage.setItem(
    STORAGE_KEYS.WALLETS,
    JSON.stringify(wallets.filter(w => w.id !== id)),
  );
};

export const getWalletTotal = async (): Promise<number> => {
  const wallets = await getWallets();
  return wallets.reduce((sum, w) => sum + w.currentBalance, 0);
};

export interface BackupData {
  seedVersion?: string;
  transactions: Expense[];
  categories: Category[];
  wallets: Wallet[];
}

export const getAllData = async (): Promise<BackupData> => {
  const [transactions, categories, wallets] = await Promise.all([
    getExpenses(),
    getCategories(),
    getWallets(),
  ]);
  return {seedVersion: SEED_VERSION, transactions, categories, wallets};
};

export const restoreAllData = async (data: BackupData): Promise<boolean> => {
  if (
    !data ||
    !Array.isArray(data.transactions) ||
    !Array.isArray(data.categories) ||
    !Array.isArray(data.wallets)
  ) {
    return false;
  }
  await AsyncStorage.multiSet([
    [STORAGE_KEYS.EXPENSES, JSON.stringify(data.transactions)],
    [STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories)],
    [STORAGE_KEYS.WALLETS, JSON.stringify(data.wallets)],
    [STORAGE_KEYS.SEED_VERSION, SEED_VERSION],
  ]);
  await ensureSeedRecords();
  return true;
};

export const getMonthlyTotal = async (): Promise<number> => {
  const expenses = await getExpenses();
  const now = new Date();
  return sumForMonth(expenses, now.getFullYear(), now.getMonth());
};

export const getLastMonthTotal = async (): Promise<number> => {
  const expenses = await getExpenses();
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return sumForMonth(expenses, last.getFullYear(), last.getMonth());
};

const sumForMonth = (
  expenses: Expense[],
  year: number,
  month: number,
): number =>
  expenses
    .filter(e => {
      const d = new Date(e.date);
      return (
        (e.type ?? 'expense') === 'expense' &&
        e.category !== 'Borrow' &&
        e.category !== 'Credit' &&
        d.getMonth() === month &&
        d.getFullYear() === year
      );
    })
    .reduce((sum, e) => sum + e.amount, 0);

export const getCategoryTotals = async (): Promise<Record<string, number>> => {
  const expenses = await getExpenses();
  const now = new Date();
  const totals: Record<string, number> = {};
  expenses
    .filter(e => {
      const d = new Date(e.date);
      return (
        (e.type ?? 'expense') === 'expense' &&
        e.category !== 'Borrow' &&
        e.category !== 'Credit' &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    })
    .forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
  return totals;
};

export interface MonthPoint {
  key: string;
  label: string;
  expense: number;
  income: number;
}

export const getMonthlyTrend = async (months = 6): Promise<MonthPoint[]> => {
  const expenses = await getExpenses();
  const now = new Date();
  const points: MonthPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    points.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString('en-US', {month: 'short'}),
      expense: 0,
      income: 0,
    });
  }
  for (const e of expenses) {
    const d = new Date(e.date);
    const point = points.find(p => p.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (!point) continue;
    const type = e.type ?? 'expense';
    if (type === 'expense' && e.category !== 'Borrow' && e.category !== 'Credit')
      point.expense += e.amount;
    else if (type === 'income' && e.category !== 'Credit')
      point.income += e.amount;
  }
  return points;
};

export type TrendRange = '1d' | '1w' | '1m' | '1y';

export interface TrendPoint {
  key: string;
  label: string;
  expense: number;
  income: number;
}

const trendMetrics = (bucketExpenses: Expense[]): {expense: number; income: number} => {
  let expense = 0;
  let income = 0;
  for (const e of bucketExpenses) {
    const t = e.type ?? 'expense';
    if (t === 'income' && e.category !== 'Credit') income += e.amount;
    else if (t === 'expense' && e.category !== 'Borrow' && e.category !== 'Credit')
      expense += e.amount;
  }
  return {expense, income};
};

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export const getMonthSummary = async (): Promise<{income: number; expense: number}> => {
  const expenses = await getExpenses();
  const now = new Date();
  const bucket = expenses.filter(e => {
    const ed = new Date(e.date);
    return ed.getFullYear() === now.getFullYear() && ed.getMonth() === now.getMonth();
  });
  return trendMetrics(bucket);
};

export const getTrend = async (range: TrendRange): Promise<TrendPoint[]> => {
  const expenses = await getExpenses();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayMs = 24 * 60 * 60 * 1000;
  const points: TrendPoint[] = [];

  if (range === '1d') {
    for (let h = 0; h < 24; h++) {
      const bucket = expenses.filter(e => {
        const ed = new Date(e.date);
        return dayKey(ed) === dayKey(today) && ed.getHours() === h;
      });
      const {expense, income} = trendMetrics(bucket);
      points.push({
        key: `1d-${h}`,
        label: h % 6 === 0
          ? new Date(today.getTime() + h * 60 * 60 * 1000).toLocaleTimeString('en-US', {hour: 'numeric'})
          : '',
        expense,
        income,
      });
    }
  } else if (range === '1w') {
    for (let i = 0; i < 7; i++) {
      const day = new Date(today.getTime() - (6 - i) * dayMs);
      const bucket = expenses.filter(e => dayKey(new Date(e.date)) === dayKey(day));
      const {expense, income} = trendMetrics(bucket);
      points.push({
        key: `1w-${dayKey(day)}`,
        label: day.toLocaleDateString('en-US', {weekday: 'short'}),
        expense,
        income,
      });
    }
  } else if (range === '1m') {
    for (let i = 0; i < 30; i++) {
      const day = new Date(today.getTime() - (29 - i) * dayMs);
      const bucket = expenses.filter(e => dayKey(new Date(e.date)) === dayKey(day));
      const {expense, income} = trendMetrics(bucket);
      points.push({
        key: `1m-${dayKey(day)}`,
        label: String(day.getDate()),
        expense,
        income,
      });
    }
  } else {
    for (let i = 0; i < 12; i++) {
      const m = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const bucket = expenses.filter(e => {
        const ed = new Date(e.date);
        return ed.getFullYear() === m.getFullYear() && ed.getMonth() === m.getMonth();
      });
      const {expense, income} = trendMetrics(bucket);
      points.push({
        key: `1y-${m.getFullYear()}-${m.getMonth()}`,
        label: m.toLocaleDateString('en-US', {month: 'short'}),
        expense,
        income,
      });
    }
  }
  return points;
};
