import React, {useEffect, useState} from 'react';
import {Text, View, ActivityIndicator} from 'react-native';
import {useLocalSearchParams} from 'expo-router';
import ExpenseForm from '../../components/ExpenseForm';
import {Expense} from '../../types';
import {getExpenses} from '../../utils/storage';
import {COLORS} from '../../utils/constants';

export default function EditExpenseScreen() {
  const {id} = useLocalSearchParams<{id: string}>();
  const [expense, setExpense] = useState<Expense | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const expenses = await getExpenses();
      setExpense(expenses.find(e => e.id === id));
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{color: COLORS.textMuted}}>Record not found</Text>
      </View>
    );
  }

  return <ExpenseForm editing={expense} />;
}
