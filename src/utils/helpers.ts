export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const formatCurrency = (amount: number): string => {
  return `NPR ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
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

export const getCategoryLabel = (
  name: string,
  categories: {id: string; name: string; parentId?: string}[],
): string => {
  const cat = categories.find(c => c.name === name);
  if (cat?.parentId) {
    const parent = categories.find(c => c.id === cat.parentId);
    if (parent && parent.name !== name) {
      return `${parent.name} / ${name}`;
    }
  }
  return name;
};

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
