import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  RefreshControl,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
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

interface DaySection {
  title: string;
  expense: number;
  income: number;
  data: Expense[];
}

const TransactionsScreen: React.FC = () => {
  const router = useRouter();
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

  const sections: DaySection[] = useMemo(() => {
    return groupExpensesByDay(expenses, getDateLabel).map((g) => ({
      title: g.label,
      expense: g.expense,
      income: g.income,
      data: g.items,
    }));
  }, [expenses, getDateLabel]);

  const renderHeader = useCallback(
    ({ section }: { section: DaySection }) => (
      <View style={styles.dayHeader}>
        <Text style={styles.dayLabel}>{section.title}</Text>
        <View style={styles.dayTotals}>
          {section.expense > 0 ? (
            <View style={styles.dayStat}>
              <MaterialIcons name="arrow-downward" size={16} color={COLORS.danger} />
              <Text style={[styles.dayAmount, styles.expenseAmount]}>
                {formatCurrency(section.expense)}
              </Text>
            </View>
          ) : null}
          {section.income > 0 ? (
            <View style={styles.dayStat}>
              <MaterialIcons name="arrow-upward" size={16} color={COLORS.success} />
              <Text style={[styles.dayAmount, styles.incomeAmount]}>
                {formatCurrency(section.income)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    ),
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: Expense }) => {
      const cat = getCategoryDetails(item.category);
      return (
        <ExpenseCard
          expense={item}
          categoryIcon={cat.icon}
          categoryLabel={getCategoryLabel(item.category)}
          onPress={() => router.push(`/expense/detail/${item.id}`)}
        />
      );
    },
    [getCategoryDetails, router],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderHeader}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No transactions yet.</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 40 }} />}
      />
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