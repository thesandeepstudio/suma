import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import WalletCard from "../../components/WalletCard";
import { Wallet } from "../../types";
import { COLORS } from "../../utils/constants";
import { getWallets, getWalletTotal, getDebt } from "../../utils/storage";
import { formatCurrency } from "../../utils/helpers";

const WalletScreen: React.FC = () => {
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [debt, setDebt] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [list, total, debtValue] = await Promise.all([
      getWallets(),
      getWalletTotal(),
      getDebt(),
    ]);
    setWallets(list);
    setTotalBalance(total);
    setDebt(debtValue);
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

  const renderWallet = ({ item }: { item: Wallet }) => {
    return (
      <WalletCard
        name={item.name}
        balance={item.currentBalance}
        icon={item.icon}
        onPress={() => router.push(`/wallet/${item.id}`)}
      />
    );
  };

  return (
    <View style={styles.container}>
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
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Assets</Text>
          <Text style={styles.totalAmount}>
            {formatCurrency(totalBalance)}
          </Text>
          <Text style={styles.totalSub}>
            {wallets.length} account{wallets.length !== 1 ? "s" : ""}
          </Text>
          <View style={styles.totalStats}>
            <View style={styles.totalStat}>
              <Text style={styles.totalStatLabel}>Net Balance</Text>
              <Text style={styles.totalStatValue}>
                {formatCurrency(totalBalance - debt)}
              </Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalStat}>
              <Text style={styles.totalStatLabel}>Debt</Text>
              <Text style={styles.totalStatValue}>
                {formatCurrency(debt)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>My Accounts</Text>
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={() => router.push("/wallet")}
          >
            <MaterialIcons name="add" size={18} color={COLORS.white} />
            <Text style={styles.manageText}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {wallets.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialIcons
              name="account-balance-wallet"
              size={44}
              color={COLORS.textMuted}
            />
            <Text style={styles.emptyTitle}>No accounts yet</Text>
            <Text style={styles.emptyText}>
              Add eSewa, Khalti, bank or cash accounts to track your balances.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push("/wallet")}
            >
              <MaterialIcons name="add" size={20} color={COLORS.white} />
              <Text style={styles.emptyBtnText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {wallets.map((wallet) => (
              <View key={wallet.id}>{renderWallet({ item: wallet })}</View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  totalCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  totalLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  totalStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 16,
    marginTop: 18,
  },
  totalStat: {
    flex: 1,
    alignItems: "center",
  },
  totalDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 12,
  },
  totalStatLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  totalStatValue: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  totalAmount: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: "bold",
    marginTop: 6,
  },
  totalSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginTop: 4,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },
  manageBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  manageText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 40,
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 12,
  },
  emptyText: {
    color: COLORS.textMuted,
    marginTop: 6,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  emptyBtnText: {
    color: COLORS.white,
    fontWeight: "600",
    marginLeft: 6,
  },
});

export default WalletScreen;
