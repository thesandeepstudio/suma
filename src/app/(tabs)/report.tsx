import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from 'expo-router';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Path,
  Circle,
  Line,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import {getTrend, getMonthSummary, TrendPoint, TrendRange} from '../../utils/storage';
import {formatCurrency} from '../../utils/helpers';
import {COLORS} from '../../utils/constants';

const LINE_SPENDING = COLORS.danger;
const LINE_INCOME = COLORS.chartIncome;
const GRID_COLOR = COLORS.grid;
const CHART_HEIGHT = 190;
const PAD_TOP = 16;
const PAD_BOTTOM = 10;
const PAD_X = 20;
const PLOT_H = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

const RANGES: {key: TrendRange; label: string}[] = [
  {key: '1d', label: '1D'},
  {key: '1w', label: '1W'},
  {key: '1m', label: '1M'},
  {key: '1y', label: '1Y'},
];

const RANGE_SUBTITLE: Record<TrendRange, string> = {
  '1d': 'Today by hour',
  '1w': 'Last 7 days',
  '1m': 'Last 30 days',
  '1y': 'Last 12 months',
};

interface Pt {
  x: number;
  y: number;
}

const smoothPath = (pts: Pt[]): string => {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
};

const RangeButton: React.FC<{
  item: {key: TrendRange; label: string};
  active: boolean;
  onPress: () => void;
}> = ({item, active, onPress}) => {
  const scale = useSharedValue(active ? 1 : 0.85);

  useEffect(() => {
    scale.value = withSpring(active ? 1 : 0.85, {
      damping: 20,
      stiffness: 280,
      mass: 0.5,
    });
  }, [active, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.rangeBtn, active && styles.rangeBtnActive]}
        onPress={onPress}>
        <Text style={[styles.rangeText, active && styles.rangeTextActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ReportScreen: React.FC = () => {
  const [points, setPoints] = useState<TrendPoint[]>([]);
  const [range, setRange] = useState<TrendRange>('1w');
  const [monthSummary, setMonthSummary] = useState({income: 0, expense: 0});
  const [loading, setLoading] = useState(true);
  const [chartWidth, setChartWidth] = useState(0);
  const chartOpacity = useSharedValue(1);

  const loadData = useCallback(async () => {
    const [trend, summary] = await Promise.all([getTrend(range), getMonthSummary()]);
    setPoints(trend);
    setMonthSummary(summary);
    setLoading(false);
  }, [range]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  useEffect(() => {
    if (loading) return;
    chartOpacity.value = 0;
    chartOpacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
  }, [points, loading, chartOpacity]);

  const chartAnimatedStyle = useAnimatedStyle(() => ({
    opacity: chartOpacity.value,
    transform: [{translateY: 14 - 14 * chartOpacity.value}],
  }));

  const handleSelectRange = (key: TrendRange) => {
    setRange(key);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const maxScale =
    Math.max(1, ...points.flatMap(p => [p.expense, p.income])) * 1.12;

  const yFor = (value: number) =>
    PAD_TOP + PLOT_H * (1 - Math.max(0, value) / maxScale);

  const toPts = (key: 'expense' | 'income'): Pt[] =>
    points.map((p, i) => ({
      x:
        PAD_X +
        (chartWidth - PAD_X * 2) * (points.length <= 1 ? 0.5 : i / (points.length - 1)),
      y: yFor(p[key]),
    }));

  const spendingPts = toPts('expense');
  const incomePts = toPts('income');
  const spendingLine = smoothPath(spendingPts);
  const spendingArea =
    spendingPts.length > 0
      ? `${spendingLine} L ${spendingPts[spendingPts.length - 1].x.toFixed(2)} ${
          PAD_TOP + PLOT_H
        } L ${spendingPts[0].x.toFixed(2)} ${PAD_TOP + PLOT_H} Z`
      : '';
  const incomeLine = smoothPath(incomePts);
  const baselineY = PAD_TOP + PLOT_H;

  const labelIndices: number[] = [];
  if (points.length <= 7) {
    points.forEach((_, i) => labelIndices.push(i));
  } else {
    const count = Math.min(points.length, 7);
    const step = (points.length - 1) / (count - 1);
    for (let k = 0; k < count; k++) {
      labelIndices.push(Math.round(k * step));
    }
    if (!labelIndices.includes(points.length - 1)) labelIndices.push(points.length - 1);
  }

  const totalIncome = points.reduce((sum, p) => sum + p.income, 0);
  const totalExpense = points.reduce((sum, p) => sum + p.expense, 0);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.heading}>Report</Text>
          <Text style={styles.subheading}>Income vs Expenses</Text>
        </View>

        {(monthSummary.income > 0 || monthSummary.expense > 0) && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryLabel}>Income (This Month)</Text>
              <Text style={[styles.summaryValue, {color: LINE_INCOME}]}>
                {formatCurrency(monthSummary.income)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryLabel}>Spending (This Month)</Text>
              <Text style={[styles.summaryValue, {color: LINE_SPENDING}]}>
                {formatCurrency(monthSummary.expense)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle}>Income vs Expenses</Text>
              <Text style={styles.cardSub}>{RANGE_SUBTITLE[range]}</Text>
            </View>
            <View style={styles.rangeRow}>
              {RANGES.map(r => (
                <RangeButton
                  key={r.key}
                  item={r}
                  active={range === r.key}
                  onPress={() => handleSelectRange(r.key)}
                />
              ))}
            </View>
          </View>

          <Animated.View style={chartAnimatedStyle}>
          <View
            style={styles.chartArea}
            onLayout={e => setChartWidth(e.nativeEvent.layout.width)}>
            {chartWidth > 0 && (
              <Svg width={chartWidth} height={CHART_HEIGHT}>
                <Defs>
                  <LinearGradient id="spendingGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={LINE_SPENDING} stopOpacity="0.14" />
                    <Stop offset="1" stopColor={LINE_SPENDING} stopOpacity="0" />
                  </LinearGradient>
                </Defs>

                {[0, 0.33, 0.66, 1].map(t => {
                  const y = PAD_TOP + PLOT_H * t;
                  return (
                    <Line
                      key={t}
                      x1={0}
                      x2={chartWidth}
                      y1={y}
                      y2={y}
                      stroke={GRID_COLOR}
                      strokeWidth={1}
                    />
                  );
                })}

                {spendingArea ? <Path d={spendingArea} fill="url(#spendingGrad)" /> : null}
                <Path
                  d={spendingLine}
                  stroke={LINE_SPENDING}
                  strokeWidth={2.5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d={incomeLine}
                  stroke={LINE_INCOME}
                  strokeWidth={1.5}
                  fill="none"
                  strokeDasharray="6 5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {spendingPts.map((pt, i) =>
                  points[i].expense > 0 ? (
                    <Circle
                      key={`s-${i}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={4}
                      fill={COLORS.white}
                      stroke={LINE_SPENDING}
                      strokeWidth={2}
                    />
                  ) : null,
                )}
                {incomePts.map((pt, i) =>
                  points[i].income > 0 ? (
                    <Circle
                      key={`i-${i}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={3.5}
                      fill={COLORS.white}
                      stroke={LINE_INCOME}
                      strokeWidth={2}
                    />
                  ) : null,
                )}

                <Line
                  x1={PAD_X}
                  x2={chartWidth - PAD_X}
                  y1={baselineY}
                  y2={baselineY}
                  stroke={GRID_COLOR}
                  strokeWidth={1.5}
                />
              </Svg>
            )}
            <View style={styles.labelsWrap}>
              {labelIndices.map(i => {
                const fraction = points.length <= 1 ? 0.5 : i / (points.length - 1);
                const left = PAD_X + (chartWidth - PAD_X * 2) * fraction;
                return (
                  <Text
                    key={points[i].key}
                    style={[styles.monthLabel, {left: left - 22}]}
                    numberOfLines={1}>
                    {points[i].label}
                  </Text>
                );
              })}
            </View>
          </View>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: LINE_SPENDING}]} />
              <Text style={styles.legendText}>Spending</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: LINE_INCOME}]} />
              <Text style={styles.legendText}>Income</Text>
            </View>
          </View>

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Total Income</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalIncome)}</Text>
            </View>
            <View style={{alignItems: 'flex-end'}}>
              <Text style={styles.totalLabel}>Total Spending</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalExpense)}</Text>
            </View>
          </View>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  subheading: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    marginBottom: 32,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleWrap: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  cardSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  rangeRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 3,
  },
  rangeBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  rangeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  rangeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  rangeTextActive: {
    color: COLORS.white,
  },
  chartArea: {
    marginTop: 20,
    marginBottom: 8,
  },
  labelsWrap: {
    position: 'relative',
    height: 16,
    marginTop: 8,
  },
  monthLabel: {
    position: 'absolute',
    top: 0,
    width: 44,
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '600',
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 18,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 16,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
});

export default ReportScreen;