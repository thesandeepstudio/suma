import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SectionList,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ExpenseCard from "../components/ExpenseCard";
import { Expense, Category, Wallet, TransactionType } from "../types";
import { COLORS } from "../utils/constants";
import {
  getRelativeDate,
  getCategoryLabel,
  formatCurrency,
  groupExpensesByDay,
} from "../utils/helpers";
import { getExpenses, getCategories, getWallets } from "../utils/storage";

interface DaySection {
  title: string;
  expense: number;
  income: number;
  data: Expense[];
}

type TypeFilter = "all" | TransactionType;

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "expense", label: "Expenses" },
  { key: "income", label: "Income" },
  { key: "transfer", label: "Transfers" },
];

interface FilterChipProps {
  active: boolean;
  label: string;
  onPress: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ active, label, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.chip, active && styles.chipActive]}
    activeOpacity={0.7}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const TransactionsScreen: React.FC = () => {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<TypeFilter>("all");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterWallet, setFilterWallet] = useState<string | null>(null);
  const [sortNewest, setSortNewest] = useState(true);

  const loadData = useCallback(async () => {
    const [exp, cats, wallets] = await Promise.all([
      getExpenses(),
      getCategories(),
      getWallets(),
    ]);
    setExpenses(exp);
    setCategories(cats);
    setWallets(wallets);
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

  const filtered = useMemo(() => {
    let list = expenses.slice();
    if (filterType !== "all") {
      list = list.filter((e) => (e.type ?? "expense") === filterType);
    }
    if (filterCategory) {
      list = list.filter((e) => e.category === filterCategory);
    }
    if (filterWallet) {
      list = list.filter(
        (e) => e.walletId === filterWallet || e.toWalletId === filterWallet,
      );
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.note ?? "").toLowerCase().includes(q),
      );
    }
    list.sort((a, b) =>
      sortNewest
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    return list;
  }, [expenses, filterType, filterCategory, filterWallet, query, sortNewest]);

  const sections: DaySection[] = useMemo(() => {
    return groupExpensesByDay(filtered, getDateLabel).map((g) => ({
      title: g.label,
      expense: g.expense,
      income: g.income,
      data: g.items,
    }));
  }, [filtered, getDateLabel]);

  const hasFilters =
    query.trim().length > 0 ||
    filterType !== "all" ||
    filterCategory !== null ||
    filterWallet !== null;

  const resetFilters = () => {
    setQuery("");
    setFilterType("all");
    setFilterCategory(null);
    setFilterWallet(null);
  };

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

  const listHeader = useMemo(
    () => (
      <View style={styles.headerBlock}>
        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search title, category, note..."
            placeholderTextColor={COLORS.textMuted}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <MaterialIcons name="close" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.controlsRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContent}
          >
            {TYPE_FILTERS.map((t) => (
              <FilterChip
                key={t.key}
                active={filterType === t.key}
                label={t.label}
                onPress={() => setFilterType(t.key)}
              />
            ))}
            {categories.map((c) => (
              <FilterChip
                key={c.id}
                active={filterCategory === c.name}
                label={c.name}
                onPress={() =>
                  setFilterCategory(filterCategory === c.name ? null : c.name)
                }
              />
            ))}
            {wallets.map((w) => (
              <FilterChip
                key={w.id}
                active={filterWallet === w.id}
                label={w.name}
                onPress={() =>
                  setFilterWallet(filterWallet === w.id ? null : w.id)
                }
              />
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.sortBtn}
            onPress={() => setSortNewest((s) => !s)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={sortNewest ? "arrow-downward" : "arrow-upward"}
              size={15}
              color={COLORS.text}
            />
            <Text style={styles.sortBtnText}>
              {sortNewest ? "Newest" : "Oldest"}
            </Text>
          </TouchableOpacity>
        </View>
        {hasFilters && (
          <TouchableOpacity style={styles.resetRow} onPress={resetFilters}>
            <Text style={styles.resetText}>
              {filterWallet ? `Wallet: ${wallets.find((w) => w.id === filterWallet)?.name ?? "Wallet"}  ·  ` : ""}
              {filterCategory ? `Category: ${filterCategory}  ·  ` : ""}
              Showing {filtered.length} of {expenses.length} — clear filters
            </Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    [query, filterType, filterCategory, filterWallet, sortNewest, categories, wallets, filtered.length, expenses.length, hasFilters],
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
        ListHeaderComponent={listHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              {hasFilters
                ? "No transactions match your search."
                : "No transactions yet."}
            </Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 40 }} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerBlock: {
    backgroundColor: COLORS.background,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
    paddingVertical: 0,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  chipsContent: {
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 6,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textLight,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 16,
    marginLeft: 2,
  },
  sortBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
    marginLeft: 4,
  },
  resetRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  resetText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
  },
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