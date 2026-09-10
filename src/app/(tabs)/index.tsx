import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import BalanceCard from "../../components/BalanceCard";
import ExpenseCard from "../../components/ExpenseCard";
import { Expense, Category } from "../../types";
import { COLORS } from "../../utils/constants";
import { getRelativeDate, formatCurrency, getCategoryLabel, groupExpensesByDay } from "../../utils/helpers";
import {
  getExpenses,
  getCategories,
  getMonthlyTotal,
  getLastMonthTotal,
  getWalletTotal,
  getUsername,
} from "../../utils/storage";

const DashboardScreen: React.FC = () => {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [walletTotal, setWalletTotal] = useState(0);
  const [lastMonthTotal, setLastMonthTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const [username, setUsername] = useState('user');

  const loadData = useCallback(async () => {
    const [exp, cats, total, wallet, lastTotal, name] = await Promise.all([
      getExpenses(),
      getCategories(),
      getMonthlyTotal(),
      getWalletTotal(),
      getLastMonthTotal(),
      getUsername(),
    ]);
    const dayKey = (dateStr: string) => {
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    };
    const todayKey = dayKey(new Date().toISOString());
    const todays = exp.filter((e) => dayKey(e.date) === todayKey);
    setTodayCount(todays.length);
    setExpenses(exp);
    setCategories(cats);
    setMonthlyTotal(total);
    setWalletTotal(wallet);
    setLastMonthTotal(lastTotal);
    setUsername(name);
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

  const getDateLabel = useCallback((dateStr: string) => {
    const relative = getRelativeDate(dateStr);
    if (relative === "Today") return "Today";
    if (relative === "Yesterday") return "Yesterday";
    const d = new Date(dateStr);
    return `${d.toLocaleDateString("en-US", { month: "short" })} ${d.getDate()}`;
  }, []);

  const dayGroups = useMemo(() => {
    const sorted = [...expenses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    return groupExpensesByDay(sorted.slice(0, 5), getDateLabel);
  }, [expenses, getDateLabel]);

  const getCategoryDetails = useCallback(
    (name: string) => {
      return (
        categories.find((c) => c.name === name) || {
          name,
          icon: "help-outline",
          color: COLORS.textMuted,
        }
      );
    },
    [categories],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.heading}>Hello!</Text>
          <Text style={styles.subheading}>{username}</Text>
        </View>

        <BalanceCard
          monthlyTotal={monthlyTotal}
          recentCount={todayCount}
          walletTotal={walletTotal}
          lastMonthTotal={lastMonthTotal}
        />

        <Text style={styles.sectionHeader}>Recent Transactions</Text>
        {expenses.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialIcons
              name="receipt-long"
              size={40}
              color={COLORS.textMuted}
            />
            <Text style={styles.emptyText}>
              No records yet. Add your first one!
            </Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push("/expense")}
            >
              <MaterialIcons name="add" size={20} color={COLORS.white} />
              <Text style={styles.addBtnText}>Record</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {dayGroups.map((group) => (
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
                      onPress={() => router.push(`/expense/detail/${expense.id}`)}
                    />
                  );
                })}
              </View>
            ))}
            <TouchableOpacity
              style={styles.viewAll}
              onPress={() => router.push("/transactions")}
            >
              <Text style={styles.viewAllText}>View All Transactions</Text>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: 16,
    paddingLeft: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
  },
  subheading: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 16,
    marginLeft: 16,
    marginBottom: 6,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 5,
    marginHorizontal: 16,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
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
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 4,
  },
  expenseAmount: {
    color: COLORS.danger,
  },
  incomeAmount: {
    color: COLORS.success,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 30,
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: COLORS.card,
  },
  emptyText: {
    color: COLORS.textLight,
    marginTop: 12,
    fontSize: 14,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  addBtnText: {
    color: COLORS.white,
    fontWeight: "600",
    marginLeft: 6,
  },
  viewAll: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  viewAllText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 14,
  },
});

export default DashboardScreen;