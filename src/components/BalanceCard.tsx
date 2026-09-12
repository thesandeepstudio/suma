import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {COLORS} from '../utils/constants';
import {formatCurrency} from '../utils/helpers';
import BudgetBar from './BudgetBar';

interface Props {
  monthlyTotal: number;
  recentCount: number;
  walletTotal: number;
  lastMonthTotal: number;
  monthlyCap?: number | null;
}

const BalanceCard: React.FC<Props> = ({
  monthlyTotal,
  recentCount,
  walletTotal,
  lastMonthTotal,
  monthlyCap,
}) => {
  const day = new Date().getDate();
  const pctChange =
    lastMonthTotal > 0 ? ((monthlyTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
  const roundedPct = Math.round(pctChange);
  const trendIcon =
    roundedPct > 1 ? 'trending-up' : roundedPct < -1 ? 'trending-down' : 'trending-flat';
  const trendLabel =
    roundedPct > 1
      ? `↑ ${roundedPct}% vs last month`
      : roundedPct < -1
        ? `↓ ${Math.abs(roundedPct)}% vs last month`
        : '~ same as last month';
  const hasCap = typeof monthlyCap === 'number' && monthlyCap > 0;
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>This Month&apos;s Spending</Text>
        <View style={styles.trend}>
          <MaterialIcons name={trendIcon} size={22} color={COLORS.white} />
          <Text style={styles.trendText}>{trendLabel}</Text>
        </View>
      </View>
      <Text style={styles.amount}>{formatCurrency(monthlyTotal)}</Text>
      {hasCap ? (
        <View style={styles.budgetWrap}>
          <BudgetBar spent={monthlyTotal} cap={monthlyCap!} />
        </View>
      ) : null}
      <Text style={styles.subtext}>{recentCount} transactions today</Text>
      <View style={styles.row}>
        <View style={styles.statBox}>
          <View style={styles.statHeader}>
            <MaterialIcons name="account-balance-wallet" size={16} color="#E5E5E5" />
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <Text style={styles.statValue}>
            {formatCurrency(walletTotal)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statBox}>
          <View style={styles.statHeader}>
            <MaterialIcons name="compare-arrows" size={16} color="#9E9E9E" />
            <Text style={styles.statLabel}>Daily Avg</Text>
          </View>
          <Text style={styles.statValue}>
            {formatCurrency(monthlyTotal / (day || 1))}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  amount: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 8,
  },
  subtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 4,
  },
  budgetWrap: {
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  statBox: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginLeft: 6,
  },
  statValue: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
});

export default BalanceCard;
