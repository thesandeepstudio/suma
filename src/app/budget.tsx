import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {useFocusEffect} from 'expo-router';
import {Category} from '../types';
import {COLORS} from '../utils/constants';
import {getCategories, getCategoryTotals, getBudget, setBudget} from '../utils/storage';
import {formatCurrency} from '../utils/helpers';
import {showThemeAlert} from '../components/ThemeAlert';
import BudgetBar from '../components/BudgetBar';

const BudgetScreen: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [spent, setSpent] = useState<Record<string, number>>({});
  const [monthlyCap, setMonthlyCap] = useState('');
  const [caps, setCaps] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const [cats, totals, budget] = await Promise.all([
      getCategories(),
      getCategoryTotals(),
      getBudget(),
    ]);
    setCategories(cats);
    setSpent(totals);
    setMonthlyCap(budget.monthlyCap != null ? String(budget.monthlyCap) : '');
    const next: Record<string, string> = {};
    cats.forEach(cat => {
      const v = budget.categoryCaps[cat.name];
      next[cat.name] = v != null ? String(v) : '';
    });
    setCaps(next);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const monthlySpent = Object.values(spent).reduce((s, v) => s + v, 0);
  const monthlyCapNum = parseFloat(monthlyCap);
  const hasMonthlyCap = !isNaN(monthlyCapNum) && monthlyCapNum > 0;

  const handleSave = async () => {
    const categoryCaps: Record<string, number> = {};
    categories.forEach(cat => {
      const v = parseFloat(caps[cat.name] ?? '');
      if (!isNaN(v) && v > 0) categoryCaps[cat.name] = v;
    });
    const ok = await setBudget({
      monthlyCap: hasMonthlyCap ? monthlyCapNum : null,
      categoryCaps,
    });
    if (!ok) {
      showThemeAlert('Error', 'Could not save the budget. Try again.');
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text style={styles.hint}>
          Set a monthly spending cap and optional per-category limits. Leave empty
          to disable.
        </Text>

        <Text style={styles.sectionLabel}>Monthly Spending Cap</Text>
        <View style={styles.capCard}>
          <View style={styles.capInputRow}>
            <Text style={styles.capSymbol}>{formatCurrency(0).split(' ')[0]}</Text>
            <TextInput
              style={styles.capInput}
              value={monthlyCap}
              onChangeText={setMonthlyCap}
              placeholder="No cap"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="decimal-pad"
            />
            <Text style={styles.capSpent}>{formatCurrency(monthlySpent)} spent</Text>
          </View>
          {hasMonthlyCap && (
            <View style={styles.capBarWrap}>
              <BudgetBar spent={monthlySpent} cap={monthlyCapNum} />
            </View>
          )}
        </View>

        <Text style={styles.sectionLabel}>Per-Category Limits</Text>
        {categories.map(cat => {
          const catSpent = spent[cat.name] ?? 0;
          const capVal = parseFloat(caps[cat.name] ?? '');
          const hasCap = !isNaN(capVal) && capVal > 0;
          return (
            <View key={cat.id} style={styles.categoryCard}>
              <View style={styles.categoryRow}>
                <View style={styles.categoryIcon}>
                  <MaterialIcons name={cat.icon} size={18} color={COLORS.text} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <Text style={styles.categorySpent}>
                    {formatCurrency(catSpent)} spent
                  </Text>
                </View>
                <View style={styles.categoryInputWrap}>
                  <TextInput
                    style={styles.categoryInput}
                    value={caps[cat.name] ?? ''}
                    onChangeText={text =>
                      setCaps(c => ({...c, [cat.name]: text}))
                    }
                    placeholder="—"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              {hasCap && (
                <View style={styles.barWrap}>
                  <BudgetBar spent={catSpent} cap={capVal} />
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          {saved ? (
            <MaterialIcons name="check" size={20} color={COLORS.white} />
          ) : null}
          <Text style={styles.saveBtnText}>{saved ? 'Saved' : 'Save Budget'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  hint: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textLight,
    marginTop: 18,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  capCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
  },
  capInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  capSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 6,
  },
  capInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    padding: 0,
  },
  capSpent: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  capBarWrap: {
    marginTop: 12,
  },
  categoryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.text + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 10,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  categorySpent: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  categoryInputWrap: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 70,
    alignItems: 'flex-end',
    backgroundColor: COLORS.background,
  },
  categoryInput: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    padding: 0,
    minWidth: 44,
    textAlign: 'right',
  },
  barWrap: {
    marginTop: 10,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 24,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 4,
  },
});

export default BudgetScreen;