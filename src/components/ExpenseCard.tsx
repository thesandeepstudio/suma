import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {Expense} from '../types';
import {COLORS} from '../utils/constants';
import {formatCurrency, getRelativeDate} from '../utils/helpers';

interface Props {
  expense: Expense;
  categoryColor: string;
  categoryIcon: string;
  onPress: () => void;
  categoryLabel?: string;
}

const ExpenseCard: React.FC<Props> = ({
  expense,
  categoryColor,
  categoryIcon,
  onPress,
  categoryLabel,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconBox, {backgroundColor: categoryColor + '20'}]}>
        <MaterialIcons name={categoryIcon as any} size={24} color={categoryColor} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {expense.title}
        </Text>
        <Text style={styles.subtitle}>
          {categoryLabel || expense.category} • {getRelativeDate(expense.date)}
        </Text>
        {expense.note ? (
          <Text style={styles.note} numberOfLines={1}>
            {expense.note}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>
        <Text
          style={[
            styles.amount,
            expense.type === 'income'
              ? styles.incomeAmount
              : expense.type === 'transfer'
              ? styles.transferAmount
              : null,
          ]}>
          {expense.type === 'income' ? '+' : '-'}
          {formatCurrency(expense.amount)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  note: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.danger,
  },
  incomeAmount: {
    color: COLORS.success,
  },
  transferAmount: {
    color: COLORS.warning,
  },
});

export default ExpenseCard;
