import AsyncStorage from '@react-native-async-storage/async-storage';
import {Expense, Category, Wallet, Budget} from '../types';
import {STORAGE_KEYS, DEFAULT_CATEGORIES} from './constants';
import appData from '../../data/app-data.json';

const SEED_VERSION = appData.seedVersion;

const DEFAULT_BUDGET: Budget = {monthlyCap: null, categoryCaps: {}};

const isSpendingExpense = (e: Expense): boolean =>
  (e.type ?? 'expense') === 'expense' &&
  e.category !== 'Borrow' &&
  e.category !== 'Credit';

export const getUsername = async (): Promise<string> => {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEYS.USERNAME)) || 'user';
  } catch {
    return 'user';
  }
};

export const setUsername = async (name: string): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USERNAME, name);
    return true;
  } catch {
    return false;
  }
};

export const getCurrency = async (): Promise<string> => {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEYS.CURRENCY)) || 'NPR';
  } catch {
    return 'NPR';
  }
};

export const setCurrency = async (currency: string): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENCY, currency);
    return true;
  } catch {
    return false;
  }
};

export const getCategoryOrder = async (): Promise<Record<string, string[]>> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORY_ORDER);
    return json ? JSON.parse(json) : {};
  } catch {
    return {};
  }
};

export const setCategoryOrder = async (
  order: Record<string, string[]>,
): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORY_ORDER, JSON.stringify(order));
    return true;
  } catch {
    return false;
  }
};

export const getWalletOrder = async (): Promise<string[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.WALLET_ORDER);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
};

export const setWalletOrder = async (order: string[]): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.WALLET_ORDER, JSON.stringify(order));
    return true;
  } catch {
    return false;
  }
};

export const getBudget = async (): Promise<Budget> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.BUDGET);
    if (!json) return DEFAULT_BUDGET;
    const parsed = JSON.parse(json);
    return {
      monthlyCap: typeof parsed.monthlyCap === 'number' ? parsed.monthlyCap : null,
      categoryCaps:
        parsed.categoryCaps && typeof parsed.categoryCaps === 'object'
          ? parsed.categoryCaps
          : {},
    };
  } catch {
    return DEFAULT_BUDGET;
  }
};

export const setBudget = async (budget: Budget): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(budget));
    return true;
  } catch {
    return false;
  }
};

export const getExpenses = async (): Promise<Expense[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.EXPENSES);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
};

export const getTransactionCount = async (): Promise<number> => {
  const expenses = await getExpenses();
  return expenses.length;
};

export const clearAllData = async (): Promise<boolean> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.EXPENSES,
      STORAGE_KEYS.CATEGORIES,
      STORAGE_KEYS.WALLETS,
      STORAGE_KEYS.BUDGET,
      STORAGE_KEYS.SEED_VERSION,
      STORAGE_KEYS.USERNAME,
      STORAGE_KEYS.CURRENCY,
      STORAGE_KEYS.CATEGORY_ORDER,
      STORAGE_KEYS.WALLET_ORDER,
      STORAGE_KEYS.DELETED_SEED_IDS,
    ]);
    return true;
  } catch {
    return false;
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
  const categories = await getCategories();
  const cleaned = categories.map(c => {
    const {parentId: _drop, ...rest} = c as Category & {parentId?: string};
    return rest;
  });
  const deletedIds = await getDeletedSeedIds();
  const merged = DEFAULT_CATEGORIES.filter(d => !deletedIds.includes(d.id)).map(
    d => {
      const existing = cleaned.find(c => c.id === d.id);
      return existing ? {...existing} : {...d};
    },
  );
  const custom = cleaned.filter(c => !DEFAULT_CATEGORIES.some(d => d.id === c.id));
  await saveCategories([...merged, ...custom]);
};

const getDeletedSeedIds = async (): Promise<string[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.DELETED_SEED_IDS);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
};

const markDeletedSeedId = async (id: string): Promise<void> => {
  try {
    const ids = await getDeletedSeedIds();
    if (ids.includes(id)) return;
    await AsyncStorage.setItem(
      STORAGE_KEYS.DELETED_SEED_IDS,
      JSON.stringify([...ids, id]),
    );
  } catch {
    // Non-critical bookkeeping; ignore write failures
  }
};

export const getDebt = async (): Promise<number> => {
  const expenses = await getExpenses();
  const borrowed = expenses
    .filter(e => e.type === 'income' && e.category === 'Credit')
    .reduce((sum, e) => sum + e.amount, 0);
  const repaid = expenses
    .filter(e => (e.type ?? 'expense') === 'expense' && e.category === 'Credit')
    .reduce((sum, e) => sum + e.amount, 0);
  return Math.max(0, borrowed - repaid);
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

export const saveExpenses = async (expenses: Expense[]): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    return true;
  } catch {
    return false;
  }
};

export const addExpense = async (expense: Expense): Promise<boolean> => {
  try {
    const expenses = await getExpenses();
    expenses.unshift(expense);
    await saveExpenses(expenses);
    await applyRecordEffect(expense, 1);
    return true;
  } catch {
    return false;
  }
};

export const updateExpense = async (updated: Expense): Promise<boolean> => {
  try {
    const expenses = await getExpenses();
    const idx = expenses.findIndex(e => e.id === updated.id);
    if (idx === -1) return false;
    const previous = expenses[idx];
    expenses[idx] = updated;
    await saveExpenses(expenses);
    await applyRecordEffect(previous, -1);
    await applyRecordEffect(updated, 1);
    return true;
  } catch {
    return false;
  }
};

export const deleteExpense = async (id: string): Promise<boolean> => {
  try {
    const expenses = await getExpenses();
    const target = expenses.find(e => e.id === id);
    await saveExpenses(expenses.filter(e => e.id !== id));
    if (target) {
      await applyRecordEffect(target, -1);
    }
    return true;
  } catch {
    return false;
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
  const amount = Math.abs(expense.amount) * direction;
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

export const saveCategories = async (categories: Category[]): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    return true;
  } catch {
    return false;
  }
};

export const addCategory = async (category: Category): Promise<boolean> => {
  try {
    const categories = await getCategories();
    categories.push(category);
    return await saveCategories(categories);
  } catch {
    return false;
  }
};

export const updateCategory = async (updated: Category): Promise<boolean> => {
  try {
    const categories = await getCategories();
    const idx = categories.findIndex(c => c.id === updated.id);
    if (idx === -1) return false;
    const oldName = categories[idx].name;
    if (oldName !== updated.name) {
      const expenses = await getExpenses();
      const migrated = expenses.map(e =>
        e.category === oldName ? {...e, category: updated.name} : e,
      );
      if (migrated.length !== expenses.length) {
        await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(migrated));
      }
      const budget = await getBudget();
      if (budget.categoryCaps[oldName] != null) {
        const categoryCaps = {...budget.categoryCaps};
        delete categoryCaps[oldName];
        categoryCaps[updated.name] = budget.categoryCaps[oldName];
        await setBudget({...budget, categoryCaps});
      }
    }
    categories[idx] = updated;
    return await saveCategories(categories);
  } catch {
    return false;
  }
};

export const deleteCategory = async (id: string): Promise<number> => {
  try {
    const categories = await getCategories();
    const cat = categories.find(c => c.id === id);
    if (!cat) return 0;
    const expenses = await getExpenses();
    const count = expenses.filter(e => e.category === cat.name).length;
    if (count > 0) return count;
    const budget = await getBudget();
    if (budget.categoryCaps[cat.name] != null) {
      const categoryCaps = {...budget.categoryCaps};
      delete categoryCaps[cat.name];
      await setBudget({...budget, categoryCaps});
    }
    if (DEFAULT_CATEGORIES.some(d => d.id === cat.id)) {
      await markDeletedSeedId(cat.id);
    }
    await saveCategories(categories.filter(c => c.id !== id));
    return 0;
  } catch {
    return -1;
  }
};

export const getWallets = async (): Promise<Wallet[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.WALLETS);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
};

export const addWallet = async (wallet: Wallet): Promise<boolean> => {
  try {
    const wallets = await getWallets();
    wallets.unshift(wallet);
    await AsyncStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
    return true;
  } catch {
    return false;
  }
};

export const updateWallet = async (updated: Wallet): Promise<boolean> => {
  try {
    const wallets = await getWallets();
    const idx = wallets.findIndex(w => w.id === updated.id);
    if (idx === -1) return false;
    wallets[idx] = updated;
    await AsyncStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
    return true;
  } catch {
    return false;
  }
};

export const deleteWallet = async (id: string): Promise<number> => {
  try {
    const wallets = await getWallets();
    if (!wallets.some(w => w.id === id)) return 0;
    const expenses = await getExpenses();
    const count = expenses.filter(e => e.walletId === id || e.toWalletId === id)
      .length;
    if (count > 0) return count;
    await AsyncStorage.setItem(
      STORAGE_KEYS.WALLETS,
      JSON.stringify(wallets.filter(w => w.id !== id)),
    );
    return 0;
  } catch {
    return -1;
  }
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
  budget?: Budget;
  deletedSeedIds?: string[];
}

export const getAllData = async (): Promise<BackupData> => {
  const [transactions, categories, wallets, budget, deletedSeedIds] =
    await Promise.all([
      getExpenses(),
      getCategories(),
      getWallets(),
      getBudget(),
      getDeletedSeedIds(),
    ]);
  return {
    seedVersion: SEED_VERSION,
    transactions,
    categories,
    wallets,
    budget,
    deletedSeedIds,
  };
};

export const restoreAllData = async (data: BackupData): Promise<boolean> => {
  try {
    if (
      !data ||
      !Array.isArray(data.transactions) ||
      !Array.isArray(data.categories) ||
      !Array.isArray(data.wallets)
    ) {
      return false;
    }
    const budget = data.budget ?? DEFAULT_BUDGET;
    const deletedSeedIds = data.deletedSeedIds ?? [];
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.EXPENSES, JSON.stringify(data.transactions)],
      [STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories)],
      [STORAGE_KEYS.WALLETS, JSON.stringify(data.wallets)],
      [STORAGE_KEYS.BUDGET, JSON.stringify(budget)],
      [STORAGE_KEYS.DELETED_SEED_IDS, JSON.stringify(deletedSeedIds)],
      [STORAGE_KEYS.SEED_VERSION, SEED_VERSION],
    ]);
    await ensureSeedRecords();
    return true;
  } catch {
    return false;
  }
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
        isSpendingExpense(e) &&
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
        isSpendingExpense(e) &&
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
    if (isSpendingExpense(e)) point.expense += e.amount;
    else if (e.type === 'income' && e.category !== 'Credit')
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
    if (isSpendingExpense(e)) expense += e.amount;
    else if (e.type === 'income' && e.category !== 'Credit') income += e.amount;
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
