import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  LayoutChangeEvent,
} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {useFocusEffect, useRouter} from 'expo-router';
import {Category, Expense, IconName, TransactionType, Wallet} from '@/types';
import {COLORS} from '@/utils/constants';
import {getCategories, getWallets, addExpense, updateExpense} from '@/utils/storage';
import {generateId, formatCurrency, getCategoryLabel} from '@/utils/helpers';
import {showThemeAlert} from '@/components/ThemeAlert';
import CustomCalendar from '@/components/CustomCalendar';

const TYPES: {key: TransactionType; label: string; icon: IconName}[] = [
  {key: 'expense', label: 'Expenses', icon: 'remove-circle-outline'},
  {key: 'income', label: 'Income', icon: 'add-circle-outline'},
  {key: 'transfer', label: 'Transfer', icon: 'swap-horiz'},
];

const SEGMENT_SPRING = {damping: 24, stiffness: 260, mass: 0.7};

let _exprI = 0;
const exprNumber = (expr: string): number => {
  let buf = '';
  while (_exprI < expr.length && /[0-9.]/.test(expr[_exprI])) {
    buf += expr[_exprI];
    _exprI++;
  }
  if (!buf) throw new Error('expected number');
  return parseFloat(buf);
};

const exprFactor = (expr: string): number => {
  let n = exprNumber(expr);
  while (_exprI < expr.length && (expr[_exprI] === '*' || expr[_exprI] === '/')) {
    const op = expr[_exprI];
    _exprI++;
    const rhs = exprNumber(expr);
    if (op === '/') {
      if (rhs === 0) throw new Error('division by zero');
      n /= rhs;
    } else {
      n *= rhs;
    }
  }
  return n;
};

const exprTerm = (expr: string): number => {
  let n = exprFactor(expr);
  while (_exprI < expr.length && (expr[_exprI] === '+' || expr[_exprI] === '-')) {
    const op = expr[_exprI];
    _exprI++;
    const rhs = exprFactor(expr);
    if (op === '+') n += rhs;
    else n -= rhs;
  }
  return n;
};

const evaluateExpression = (expr: string): number => {
  _exprI = 0;
  const result = exprTerm(expr);
  if (_exprI < expr.length) throw new Error('trailing characters');
  return result;
};

const resolveAmount = (value: string): string => {
  const normalized = value.trim().replace(/×/g, '*').replace(/÷/g, '/');
  if (!normalized) return '';
  if (!/[+\-*/]/.test(normalized)) return normalized;
  try {
    const n = evaluateExpression(normalized);
    return Number.isFinite(n) ? String(Math.round(n * 100) / 100) : normalized;
  } catch {
    return normalized;
  }
};

const AnimatedMaterialIcon = Animated.createAnimatedComponent(MaterialIcons);

interface Props {
  editing?: Expense;
}

interface SegmentOptionProps {
  item: (typeof TYPES)[number];
  active: boolean;
  onPress: (key: TransactionType) => void;
  onLayout: (key: TransactionType, evt: LayoutChangeEvent) => void;
}

const SegmentOptionMemo: React.FC<SegmentOptionProps> = React.memo(
  ({item, active, onPress, onLayout}) => {
    const progress = useSharedValue(active ? 1 : 0);

    useEffect(() => {
      progress.value = withTiming(active ? 1 : 0, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
      });
    }, [active, progress]);

    const iconStyle = useAnimatedStyle(() => ({
      color: interpolateColor(
        progress.value,
        [0, 1],
        [COLORS.textMuted, COLORS.white],
      ),
    }));

    const labelStyle = useAnimatedStyle(() => ({
      color: interpolateColor(
        progress.value,
        [0, 1],
        [COLORS.textMuted, COLORS.white],
      ),
    }));

    return (
      <TouchableOpacity
        style={styles.segmentBtn}
        activeOpacity={0.7}
        onPress={() => onPress(item.key)}
        onLayout={evt => onLayout(item.key, evt)}>
        <AnimatedMaterialIcon name={item.icon} size={18} style={iconStyle} />
        <Animated.Text style={[styles.segmentText, labelStyle]}>
          {item.label}
        </Animated.Text>
      </TouchableOpacity>
    );
  },
);

SegmentOptionMemo.displayName = 'SegmentOption';

const WalletPickerField: React.FC<{
  label: string;
  wallets: Wallet[];
  selectedId: string;
  onSelect: (id: string) => void;
  sign: '+' | '-' | undefined;
  divider?: boolean;
}> = ({label, wallets, selectedId, onSelect, sign, divider = true}) => {
  const [open, setOpen] = useState(false);
  const selected = wallets.find(w => w.id === selectedId);

  return (
    <>
      <TouchableOpacity
        style={[styles.listRow, divider && styles.listRowDivider]}
        activeOpacity={0.6}
        onPress={() => setOpen(true)}>
        <View style={styles.listRowIcon}>
          <MaterialIcons
            name={selected?.icon || 'account-balance-wallet'}
            size={20}
            color={COLORS.primary}
          />
        </View>
        <View style={styles.listRowText}>
          <Text style={styles.listRowLabel}>{label}</Text>
          <Text style={styles.listRowValue} numberOfLines={1}>
            {selected ? selected.name : 'Select a wallet...'}
          </Text>
        </View>
        {selected && (
          <View style={styles.listRowRight}>
            {sign && (
              <Text style={[styles.signBadge, sign === '+' ? styles.signPlus : styles.signMinus]}>
                {sign}
              </Text>
            )}
            <Text style={styles.listRowMeta}>{formatCurrency(selected.currentBalance)}</Text>
          </View>
        )}
        <MaterialIcons name="chevron-right" size={22} color={COLORS.textMuted} />
      </TouchableOpacity>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{label}</Text>
            {wallets.map(w => {
              const isSelected = w.id === selectedId;
              return (
                <TouchableOpacity
                  key={w.id}
                  style={[styles.modalRow, isSelected && styles.modalRowActive]}
                  onPress={() => {
                    onSelect(w.id);
                    setOpen(false);
                  }}>
                  <View style={[styles.modalIconWrap, isSelected && styles.modalIconWrapActive]}>
                    <MaterialIcons
                      name={w.icon || 'account-balance-wallet'}
                      size={22}
                      color={isSelected ? COLORS.white : COLORS.primary}
                    />
                  </View>
                  <View style={styles.modalRowText}>
                    <Text style={[styles.modalRowName, isSelected && styles.modalRowTextActive]} numberOfLines={1}>
                      {w.name}
                    </Text>
                    <Text style={[styles.modalRowBalance, isSelected && styles.modalRowTextActive]}>
                      {formatCurrency(w.currentBalance)}
                    </Text>
                  </View>
                  {sign && (
                    <Text style={[styles.signBadge, sign === '+' ? styles.signPlus : styles.signMinus]}>
                      {sign}
                    </Text>
                  )}
                  {isSelected && <MaterialIcons name="check" size={20} color={COLORS.white} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

WalletPickerField.displayName = 'WalletPickerField';

const CategoryPickerField: React.FC<{
  categories: Category[];
  selected: string;
  onSelect: (name: string) => void;
  divider?: boolean;
}> = ({categories, selected, onSelect, divider = true}) => {
  const [open, setOpen] = useState(false);
  const [parentId, setParentId] = useState<string | undefined>(undefined);

  const selectedCat = categories.find(c => c.name === selected);
  const mains = categories.filter(c => !c.parentId);
  const subs = parentId ? categories.filter(c => c.parentId === parentId) : [];
  const parentName =
    parentId ? categories.find(c => c.id === parentId)?.name : undefined;

  const openModal = () => {
    setParentId(selectedCat?.parentId || undefined);
    setOpen(true);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.listRow, divider && styles.listRowDivider]}
        activeOpacity={0.6}
        onPress={openModal}>
        <View style={styles.listRowIcon}>
          <MaterialIcons
            name={(selectedCat?.icon as IconName) || 'category'}
            size={20}
            color={selectedCat?.color || COLORS.textMuted}
          />
        </View>
        <View style={styles.listRowText}>
          <Text style={styles.listRowLabel}>Category</Text>
          <Text style={[styles.listRowValue, {color: selectedCat?.color || COLORS.text}]} numberOfLines={1}>
            {selectedCat ? getCategoryLabel(selectedCat.name, categories) : 'Select a category...'}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={COLORS.textMuted} />
      </TouchableOpacity>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              {parentId && (
                <TouchableOpacity
                  style={styles.modalBackBtn}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                  onPress={() => setParentId(undefined)}>
                  <MaterialIcons name="arrow-back" size={18} color={COLORS.text} />
                  <Text style={styles.modalBackText}>Categories</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.modalTitle}>
                {parentName || 'Category'}
              </Text>
            </View>
            <View style={styles.modalGrid}>
              {parentId && (
                <TouchableOpacity
                  style={[styles.categoryItem, styles.categoryMainSelect]}
                  onPress={() => {
                    if (parentName) {
                      onSelect(parentName);
                      setOpen(false);
                    }
                  }}>
                  <MaterialIcons name="category" size={18} color={COLORS.textMuted} />
                  <Text style={styles.categoryText}>Use &ldquo;{parentName}&rdquo; category</Text>
                </TouchableOpacity>
              )}
              {(parentId ? subs : mains).map(category => {
                const isSelected = category.name === selected;
                const hasSubs = categories.some(c => c.parentId === category.id);
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      parentId && styles.categoryItemChild,
                      isSelected && {borderColor: category.color, backgroundColor: category.color + '10'},
                    ]}
                    onPress={() => {
                      if (!parentId && hasSubs) {
                        setParentId(category.id);
                      } else {
                        onSelect(category.name);
                        setOpen(false);
                      }
                    }}>
                    <MaterialIcons
                      name={category.icon as any}
                      size={20}
                      color={isSelected ? category.color : COLORS.textMuted}
                    />
                    <Text
                      style={[styles.categoryText, isSelected && {color: category.color}]}
                      numberOfLines={1}>
                      {category.name}
                    </Text>
                    {!parentId && hasSubs && (
                      <MaterialIcons name="chevron-right" size={16} color={COLORS.textMuted} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

CategoryPickerField.displayName = 'CategoryPickerField';

const ExpenseForm: React.FC<Props> = ({editing}) => {
  const router = useRouter();
  const [type, setType] = useState<TransactionType>(editing?.type || 'expense');

  const typeRef = useRef<TransactionType>(editing?.type || 'expense');
  const [segments, setSegments] = useState<
    Partial<Record<TransactionType, {x: number; w: number}>>
  >({});
  const capsuleX = useSharedValue(0);
  const capsuleW = useSharedValue(0);

  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [date, setDate] = useState(editing?.date || new Date().toISOString());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);
  const [showKeypad, setShowKeypad] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(editing?.category || '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string>(editing?.walletId || '');
  const [transferFrom, setTransferFrom] = useState<string>(editing?.walletId || '');
  const [transferTo, setTransferTo] = useState<string>(editing?.toWalletId || '');

  useFocusEffect(
    useCallback(() => {
      getCategories().then(cats => {
        setCategories(cats);
        if (!selectedCategory && cats.length > 0) {
          setSelectedCategory(editing?.category || cats[0].name);
        }
      });
      getWallets().then(wall => {
        setWallets(wall);
        if (!editing?.walletId && !editing?.toWalletId) {
          if (wall.length > 0) {
            if (!selectedWallet) setSelectedWallet(wall[0].id);
            if (!transferFrom) setTransferFrom(wall[0].id);
            if (!transferTo && wall.length > 1) setTransferTo(wall[1].id);
          }
        }
      });
    }, [selectedCategory, selectedWallet, transferFrom, transferTo, editing]),
  );

  const handleSegmentLayout = (key: TransactionType, evt: LayoutChangeEvent) => {
    const {x, width} = evt.nativeEvent.layout;
    setSegments(prev => {
      const cur = prev[key];
      if (cur && cur.x === x && cur.w === width) return prev;
      return {...prev, [key]: {x, w: width}};
    });
    if (capsuleW.value === 0 && key === typeRef.current) {
      capsuleX.value = x;
      capsuleW.value = width;
    }
  };

  const handleSelectType = (key: TransactionType) => {
    typeRef.current = key;
    const seg = segments[key];
    if (seg) {
      capsuleX.value = withSpring(seg.x, SEGMENT_SPRING);
      capsuleW.value = withSpring(seg.w, SEGMENT_SPRING);
    }
    setType(key);
  };

  const capsuleStyle = useAnimatedStyle(() => ({
    width: capsuleW.value,
    transform: [{translateX: capsuleX.value}],
  }));

  const handleSave = useCallback(async () => {
    const parsedAmount = parseFloat(resolveAmount(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showThemeAlert('Error', 'Please enter a valid amount');
      return;
    }
    if (type !== 'transfer' && !selectedCategory) {
      showThemeAlert('Error', 'Please select a category');
      return;
    }
    if (wallets.length === 0) {
      showThemeAlert('Error', 'Please create a wallet first');
      return;
    }
    if (type === 'transfer') {
      if (!transferFrom || !transferTo) {
        showThemeAlert('Error', 'Please select both wallets');
        return;
      }
      if (transferFrom === transferTo) {
        showThemeAlert('Error', 'Transfer wallets must be different');
        return;
      }
    } else if (!selectedWallet) {
      showThemeAlert('Error', 'Please select a wallet');
      return;
    }

    const expense = {
      id: editing?.id || generateId(),
      title: type === 'transfer' ? 'Transfer' : selectedCategory,
      amount: parsedAmount,
      category: selectedCategory,
      date,
      type,
      walletId: type === 'transfer' ? transferFrom : selectedWallet,
      toWalletId: type === 'transfer' ? transferTo : undefined,
    };

    if (editing) {
      await updateExpense(expense);
    } else {
      await addExpense(expense);
    }
    router.back();
  }, [amount, date, selectedCategory, editing, router, type, wallets.length, selectedWallet, transferFrom, transferTo]);

  const amountColor = type === 'income' ? COLORS.success : COLORS.text;
  const amountHint =
    type === 'income'
      ? 'How much did you receive?'
      : type === 'transfer'
        ? 'How much are you transferring?'
        : 'How much did you spend?';

  const handleKeypadKey = (key: string) => {
    setAmount(prev => {
      const last = prev[prev.length - 1];
      if (/[+\-×÷*\/]/.test(key)) {
        if (!prev) return prev;
        if (/[+\-×÷*\/]/.test(last)) return prev.slice(0, -1) + key;
        return prev + key;
      }
      if (key === '.') {
        if (!prev) return '0.';
        const segment = prev.split(/[+\-×÷*\/]/).pop() || '';
        if (segment.includes('.')) return prev;
        return prev + '.';
      }
      return prev + key;
    });
  };

  const handleKeypadBack = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  const handleKeypadDone = () => {
    setAmount(resolveAmount(amount));
    setShowKeypad(false);
    handleSave();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.typeRow}>
        <Animated.View style={[styles.segmentCapsule, capsuleStyle]} />
        {TYPES.map(t => (
          <SegmentOptionMemo
            key={t.key}
            item={t}
            active={type === t.key}
            onPress={handleSelectType}
            onLayout={handleSegmentLayout}
          />
        ))}
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroCaption}>{amountHint}</Text>
        <View style={styles.heroRow}>
          <Text style={[styles.heroCurrency, {color: amountColor}]}>NPR</Text>
          <TextInput
            style={[styles.heroInput, {color: amountColor}]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={COLORS.textMuted}
            showSoftInputOnFocus={false}
            onFocus={() => setShowKeypad(true)}
          />
        </View>
      </View>

      <View style={styles.listCard}>
        <WalletPickerField
          label={type === 'income' ? 'To Wallet' : 'From Wallet'}
          wallets={wallets}
          selectedId={type === 'transfer' ? transferFrom : selectedWallet}
          onSelect={type === 'transfer' ? setTransferFrom : setSelectedWallet}
          sign={type === 'income' ? '+' : '-'}
        />
        {type === 'transfer' && (
          <WalletPickerField
            label="To Wallet"
            wallets={wallets}
            selectedId={transferTo}
            onSelect={setTransferTo}
            sign="+"
          />
        )}
        {type !== 'transfer' && (
          <CategoryPickerField
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        )}
        {wallets.length === 0 && (
          <Text style={styles.walletEmptyHint}>
            No wallets yet. Create one in the Wallet tab first.
          </Text>
        )}
<Modal
          visible={showPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowPicker(false)}>
            <View style={styles.modalSheet}>
              <CustomCalendar
                key={pickerKey}
                value={new Date(date)}
                maximumDate={new Date()}
                onSelect={selectedDate => {
                  setDate(selectedDate.toISOString());
                  setShowPicker(false);
                }}
                onClose={() => setShowPicker(false)}
              />
            </View>
          </TouchableOpacity>
        </Modal>
</View>
      </ScrollView>

      {showKeypad && (
        <View style={styles.keypad}>
          <View style={styles.keypadRow}>
            {['1', '2', '3'].map(key => (
              <TouchableOpacity key={key} style={styles.keypadKey} onPress={() => handleKeypadKey(key)}>
                <Text style={styles.keypadKeyText}>{key}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.keypadKeySpan}
              onPress={handleKeypadBack}
              onLongPress={() => setAmount('')}>
              <MaterialIcons name="backspace" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.keypadRow}>
            {['4', '5', '6', '+', '×'].map(key => (
              <TouchableOpacity key={key} style={styles.keypadKey} onPress={() => handleKeypadKey(key)}>
                <Text style={[styles.keypadKeyText, /[+\-×÷]/.test(key) && styles.keypadKeyOpText]}>
                  {key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.keypadRow}>
            {['7', '8', '9', '-', '÷'].map(key => (
              <TouchableOpacity key={key} style={styles.keypadKey} onPress={() => handleKeypadKey(key)}>
                <Text style={[styles.keypadKeyText, /[+\-×÷]/.test(key) && styles.keypadKeyOpText]}>
                  {key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.keypadRow}>
            {['.', '0'].map(key => (
              <TouchableOpacity key={key} style={styles.keypadKey} onPress={() => handleKeypadKey(key)}>
                <Text style={styles.keypadKeyText}>{key}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.keypadKey}
              onPress={() => {
                setDate(new Date().toISOString());
                setPickerKey(k => k + 1);
                setShowPicker(true);
              }}>
              <Text style={styles.keypadTodayText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.keypadKeySpan, styles.keypadTick]} onPress={handleKeypadDone}>
              <MaterialIcons name="check" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 40,
  },
  typeRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 18,
    padding: 4,
    backgroundColor: '#F1F1F4',
  },
  segmentCapsule: {
    position: 'absolute',
    top: 4,
    left: 0,
    bottom: 4,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  heroCaption: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  heroCurrency: {
    fontSize: 20,
    fontWeight: '700',
    marginRight: 8,
  },
  heroInput: {
    fontSize: 46,
    fontWeight: '800',
    minWidth: 120,
    textAlign: 'center',
    paddingVertical: 0,
  },
  keypad: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 24,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  keypadKey: {
    width: 60,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadKeySpan: {
    width: 128,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadKeyText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  keypadKeyOpText: {
    color: COLORS.primary,
  },
  keypadTodayText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  keypadTick: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  listCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  listRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F1F4',
    marginRight: 12,
  },
  listRowText: {
    flex: 1,
  },
  listRowLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  listRowValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 1,
  },
  listRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  listRowMeta: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  signBadge: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  signPlus: {
    color: COLORS.success,
  },
  signMinus: {
    color: COLORS.danger,
  },
  datePickBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    paddingVertical: 2,
    paddingRight: 8,
  },
  modalBackText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 4,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 4,
  },
  modalRowActive: {
    backgroundColor: COLORS.primary,
  },
  modalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F1F4',
  },
  modalIconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modalRowText: {
    flex: 1,
    marginLeft: 12,
  },
  modalRowName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalRowBalance: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  modalRowTextActive: {
    color: COLORS.white,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
    backgroundColor: COLORS.background,
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 6,
  },
  categoryItemChild: {
    backgroundColor: '#F6F6F7',
  },
  categoryMainSelect: {
    width: '100%',
    marginHorizontal: 0,
    marginBottom: 8,
    backgroundColor: COLORS.card,
  },
  walletEmptyHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  saveBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 24,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ExpenseForm;
