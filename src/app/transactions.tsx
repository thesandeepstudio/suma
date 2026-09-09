import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ExpenseCard from "../components/ExpenseCard";
import { Expense, Category } from "../types";
import { COLORS } from "../utils/constants";
import {
  getRelativeDate,
  getCategoryLabel,
  formatCurrency,
  groupExpensesByDay,
} from "../utils/helpers";
import { getExpenses, getCategories } from "../utils/storage";

const TransactionsScreen: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [exp, cats] = await Promise.all([getExpenses(), getCategories()]);
    setExpenses(exp);
    setCategories(cats);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const getCategoryDetails = useCallback(
    (name: string) =>
      categories.find((c) => c.name === name) || {
        name,
        icon: "help-outline",
        color: COLORS.textMuted,
      },
    [categories],
  );

  const getDateLabel = useCallback((dateStr: string) => {
    const relative = getRelativeDate(dateStr);
    if (relative === "Today") return "Today";
    if (relative === "Yesterday") return "Yesterday";
    const d = new Date(dateStr);
    return `${d.toLocaleDateString("en-US", { month: "short" })} ${d.getDate()}`;
  }, []);

  const grouped = groupExpensesByDay(expenses, getDateLabel);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {grouped.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No transactions yet.</Text>
          </View>
        ) : (
          grouped.map((group) => (
            <View key={group.label}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayLabel}>{group.label}</Text>
                <View style={styles.dayTotals}>
                  {group.expense > 0 ? (
                    <View style={styles.dayStat}>
                      <MaterialIcons name="arrow-downward" size={16} color={COLORS.danger} />
                      <Text style={[styles.dayAmount, styles.expenseAmount]}>
                        {formatCurrency(group.expense)}
                      </Text>
                    </View>
                  ) : null}
                  {group.income > 0 ? (
                    <View style={styles.dayStat}>
                      <MaterialIcons name="arrow-upward" size={16} color={COLORS.success} />
                      <Text style={[styles.dayAmount, styles.incomeAmount]}>
                        {formatCurrency(group.income)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
              {group.items.map((expense) => {
                const cat = getCategoryDetails(expense.category);
                return (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    categoryColor={cat.color}
                    categoryIcon={cat.icon}
                    categoryLabel={getCategoryLabel(expense.category, categories)}
                    onPress={() => {}}
                  />
                );
              })}
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 6,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textLight,
    textTransform: "uppercase",
  },
  dayTotals: {
    flexDirection: "row",
    alignItems: "center",
  },
  dayStat: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
  },
  dayAmount: {
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 4,
  },
  expenseAmount: {
    color: COLORS.danger,
  },
  incomeAmount: {
    color: COLORS.success,
  },
  emptyBox: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 15, color: COLORS.textMuted },
});

export default TransactionsScreen;