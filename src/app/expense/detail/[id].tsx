import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet, ActivityIndicator, TouchableOpacity} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {useLocalSearchParams, useNavigation, useRouter} from 'expo-router';
import {Expense, Category, Wallet} from '@/types';
import {COLORS} from '@/utils/constants';
import {getExpenses, getCategories, getWallets, deleteExpense} from '@/utils/storage';
import {formatCurrency, formatDate, getCategoryLabel} from '@/utils/helpers';
import {showThemeAlert} from '@/components/ThemeAlert';

const typeMeta = {
  expense: {label: 'Expense', icon: 'remove-circle-outline' as const, color: COLORS.danger},
  income: {label: 'Income', icon: 'add-circle-outline' as const, color: COLORS.success},
  transfer: {label: 'Transfer', icon: 'swap-horiz' as const, color: COLORS.warning},
};

export default function TransactionDetailScreen() {
  const {id} = useLocalSearchParams<{id: string}>();
  const router = useRouter();
  const navigation = useNavigation();
  const [expense, setExpense] = useState<Expense | undefined>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [expenses, cats, wall] = await Promise.all([
        getExpenses(),
        getCategories(),
        getWallets(),
      ]);
      setExpense(expenses.find(e => e.id === id));
      setCategories(cats);
      setWallets(wall);
      setLoading(false);
    })();
  }, [id]);

  const handleDelete = useCallback(() => {
    if (!expense) return;
    showThemeAlert('Delete Record', `Delete "${expense.title}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const ok = await deleteExpense(expense.id);
          if (!ok) {
            showThemeAlert('Error', 'Could not delete the record. Try again.');
            return;
          }
          router.back();
        },
      },
    ]);
  }, [expense, router]);

  const showMenu = useCallback(() => {
    if (!expense) return;
    showThemeAlert(expense.title, undefined, [
      {text: 'Edit', onPress: () => router.push(`/expense/${expense.id}`)},
      {text: 'Delete', style: 'destructive', onPress: handleDelete},
      {text: 'Cancel', style: 'cancel'},
    ]);
  }, [expense, router, handleDelete]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={showMenu} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <MaterialIcons name="more-vert" size={24} color={COLORS.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, showMenu]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Record not found</Text>
      </View>
    );
  }

  const type = expense.type ?? 'expense';
  const meta = typeMeta[type];
  const category = categories.find(c => c.name === expense.category);
  const fromWallet = wallets.find(w => w.id === expense.walletId);
  const toWallet = wallets.find(w => w.id === expense.toWalletId);
  const sign = type === 'income' ? '+' : type === 'expense' ? '-' : '';

  const renderRow = (icon: React.ComponentProps<typeof MaterialIcons>['name'], label: string, value: string, valueColor?: string) => (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <MaterialIcons name={icon} size={18} color={COLORS.primary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, {color: valueColor || COLORS.text}]}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={[styles.typeBadge, {backgroundColor: meta.color + '15'}]}>
          <MaterialIcons name={meta.icon} size={16} color={meta.color} />
          <Text style={[styles.typeBadgeText, {color: meta.color}]}>{meta.label}</Text>
        </View>
        <Text style={styles.title}>{expense.title}</Text>
        <Text style={[styles.amount, {color: meta.color}]}>
          {sign}
          {formatCurrency(expense.amount)}
        </Text>
        <Text style={styles.dateText}>{formatDate(expense.date)}</Text>
      </View>

      <View style={styles.card}>
        <View style={[styles.row, styles.rowDivider]}>
          <View style={styles.rowIcon}>
            <MaterialIcons
              name={category?.icon || 'help-outline'}
              size={18}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.rowLabel}>Category</Text>
          <Text style={[styles.rowValue, {color: COLORS.text}]}>
            {getCategoryLabel(expense.category) || '—'}
          </Text>
        </View>
        {fromWallet && (
          <View style={[styles.row, styles.rowDivider]}>
            <View style={styles.rowIcon}>
              <MaterialIcons name={fromWallet.icon || 'account-balance-wallet'} size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.rowLabel}>{type === 'transfer' ? 'From' : 'Account'}</Text>
            <Text style={styles.rowValue}>{fromWallet.name}</Text>
          </View>
        )}
        {toWallet && (
          <View style={[styles.row, styles.rowDivider]}>
            <View style={styles.rowIcon}>
              <MaterialIcons name={toWallet.icon || 'account-balance-wallet'} size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.rowLabel}>To</Text>
            <Text style={styles.rowValue}>{toWallet.name}</Text>
          </View>
        )}
        {renderRow('calendar-today', 'Date', formatDate(expense.date))}
        {expense.note ? renderRow('notes', 'Note', expense.note) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  muted: {
    color: COLORS.textMuted,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
  },
  amount: {
    fontSize: 38,
    fontWeight: '800',
    marginTop: 6,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F1F4',
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textLight,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    maxWidth: '55%',
    textAlign: 'right',
  },
});