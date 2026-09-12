import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {COLORS} from '../utils/constants';
import {formatCurrency} from '../utils/helpers';

interface Props {
  spent: number;
  cap: number;
}

const BudgetBar: React.FC<Props> = ({spent, cap}) => {
  const over = cap > 0 && spent > cap;
  const pct = cap > 0 ? Math.min(100, (spent / cap) * 100) : 0;

  return (
    <View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            over && styles.fillOver,
            {width: `${pct}%` as `${number}%`},
          ]}
        />
      </View>
      <View style={styles.row}>
        <Text style={[styles.budgetText, over && styles.textOver]}>
          {formatCurrency(spent)} of {formatCurrency(cap)}
        </Text>
        {over ? (
          <View style={styles.overWrap}>
            <MaterialIcons name="warning" size={14} color={COLORS.danger} />
            <Text style={styles.overLabel}>Over budget</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  fillOver: {
    backgroundColor: COLORS.danger,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  budgetText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  textOver: {
    color: COLORS.danger,
    fontWeight: '700',
  },
  overWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overLabel: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: '700',
    marginLeft: 2,
  },
});

export default BudgetBar;