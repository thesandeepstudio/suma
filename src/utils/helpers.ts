import {CURRENCIES, CurrencyOption} from './constants';
import {RepeatFreq} from '../types';

let activeCurrency: CurrencyOption = CURRENCIES[0];

export const setActiveCurrency = (code: string): void => {
  activeCurrency = CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
};

export const getActiveCurrency = (): CurrencyOption => activeCurrency;

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const advanceByFreq = (iso: string, freq: RepeatFreq): string => {
  const d = new Date(iso);
  switch (freq) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d.toISOString();
};

export const formatCurrency = (amount: number): string => {
  return `${activeCurrency.symbol} ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
};

export const getCategoryLabel = (name: string): string => name;

export interface DayGroup<T> {
  label: string;
  expense: number;
  income: number;
  items: T[];
}

export const groupExpensesByDay = <T extends {date: string; amount: number; category: string; type?: string}>(
  expenses: T[],
  getDateLabel: (dateStr: string) => string,
): DayGroup<T>[] => {
  const sorted = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const map = new Map<string, DayGroup<T>>();
  for (const e of sorted) {
    const date = new Date(e.date);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    let group = map.get(key);
    if (!group) {
      group = {label: getDateLabel(e.date), expense: 0, income: 0, items: []};
      map.set(key, group);
    }
    const type = e.type ?? 'expense';
    if (type === 'expense' && e.category !== 'Borrow' && e.category !== 'Credit') {
      group.expense += e.amount;
    } else if (type === 'income' && e.category !== 'Credit') {
      group.income += e.amount;
    }
    group.items.push(e);
  }
  return [...map.values()];
};

export const getRelativeDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((startOfToday - startOfDate) / (1000 * 60 * 60 * 24));

  if (days <= 0) {
    return 'Today';
  }
  if (days === 1) {
    return 'Yesterday';
  }
  if (days < 7) {
    return `${days} days ago`;
  }
  return formatDate(dateStr);
};
