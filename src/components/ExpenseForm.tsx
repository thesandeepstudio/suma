import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Keyboard,
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
import {getCategories, getWallets, addExpense, updateExpense, getCategoryOrder, setCategoryOrder} from '@/utils/storage';
import {generateId, formatCurrency} from '@/utils/helpers';
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
}> = ({label, wallets, selectedId, onSelect, sign}) => {
  const [open, setOpen] = useState(false);
  const selected = wallets.find(w => w.id === selectedId);

  return (
    <>
      <TouchableOpacity
        style={styles.walletChip}
        activeOpacity={0.7}
        onPress={() => setOpen(true)}>
        <MaterialIcons
          name={selected?.icon || 'account-balance-wallet'}
          size={16}
          color={COLORS.primary}
        />
        <Text style={styles.walletChipName} numberOfLines={1}>
          {selected ? selected.name : 'Select wallet...'}
        </Text>
        <MaterialIcons name="expand-more" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {label === 'From' ? 'From Wallet' : label === 'To' ? 'To Wallet' : 'Wallet'}
            </Text>
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
  onSelect: (name: string) => void;
  onAdd: () => void;
}> = ({categories, onSelect, onAdd}) => {
  const [orderMap, setOrderMap] = useState<Record<string, string[]>>({});

  useEffect(() => {
    getCategoryOrder().then(saved => {
      if (saved) setOrderMap(saved);
    });
  }, []);

  const leaves = categories.filter(c => !categories.some(x => x.parentId === c.id));

  const groupKey = '__mains';
  const remembered = (orderMap[groupKey] || []).filter(id => leaves.some(c => c.id === id));
  const displayItems = [
    ...remembered.map(id => leaves.find(c => c.id === id)).filter((c): c is Category => Boolean(c)),
    ...leaves.filter(c => !remembered.includes(c.id)),
  ];
  const highlighted = displayItems.length > 0 ? displayItems[0] : null;

  const moveToFront = (id: string) => {
    const cur = orderMap[groupKey] || [];
    const nextMap = {...orderMap, [groupKey]: [id, ...cur.filter(x => x !== id)]};
    setOrderMap(nextMap);
    setCategoryOrder(nextMap);
  };

  return (
    <View style={styles.categoryGrid}>
      {displayItems.map(category => {
        const active = highlighted?.id === category.id;
        return (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              active && {borderColor: category.color, backgroundColor: category.color + '12'},
            ]}
            activeOpacity={0.7}
            onPress={() => {
              onSelect(category.name);
              moveToFront(category.id);
            }}>
            <View style={[styles.categoryChipIcon, active && {backgroundColor: category.color + '1F'}]}>
              <MaterialIcons
                name={category.icon as any}
                size={22}
                color={active ? category.color : COLORS.textMuted}
              />
            </View>
            <Text style={[styles.categoryChipName, active && {color: category.color}]} numberOfLines={1}>
              {category.name}
            </Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        style={[styles.categoryChip, styles.categoryChipAdd]}
        activeOpacity={0.7}
        onPress={onAdd}>
        <View style={[styles.categoryChipIcon, styles.categoryChipAddIcon]}>
          <MaterialIcons name="add" size={22} color={COLORS.textMuted} />
        </View>
        <Text style={styles.categoryChipName}>New</Text>
      </TouchableOpacity>
    </View>
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
  const [note, setNote] = useState(editing?.note || '');

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
    const parsedAmount = Math.abs(parseFloat(resolveAmount(amount)));
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
      note: note.trim() || undefined,
    };

    if (editing) {
      await updateExpense(expense);
    } else {
      await addExpense(expense);
    }
    router.back();
  }, [amount, date, selectedCategory, editing, router, type, wallets.length, selectedWallet, transferFrom, transferTo, note]);

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
            onFocus={() => {
              Keyboard.dismiss();
              setShowKeypad(true);
            }}
          />
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.categorySection}>
        {type !== 'transfer' && (
          <>
            <Text style={styles.categorySectionLabel}>Category</Text>
            <CategoryPickerField
              categories={categories}
              onSelect={setSelectedCategory}
              onAdd={() => router.push('/category')}
            />
          </>
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

      <View style={styles.keypad}>
        <View style={styles.keypadWalletRow}>
            {type === 'transfer' ? (
              <>
                <WalletPickerField
                  label="From"
                  wallets={wallets}
                  selectedId={transferFrom}
                  onSelect={setTransferFrom}
                  sign="-"
                />
                <WalletPickerField
                  label="To"
                  wallets={wallets}
                  selectedId={transferTo}
                  onSelect={setTransferTo}
                  sign="+"
                />
              </>
            ) : (
              <WalletPickerField
                label={type === 'income' ? 'To' : 'From'}
                wallets={wallets}
                selectedId={selectedWallet}
                onSelect={setSelectedWallet}
                sign={type === 'income' ? '+' : '-'}
              />
            )}
            <View style={styles.keypadWalletSpacer} />
            <View style={styles.keypadNoteInline}>
              <TextInput
                style={styles.keypadNoteInlineInput}
                value={note}
                onChangeText={setNote}
                placeholder="Note"
                placeholderTextColor={COLORS.textMuted}
                onFocus={() => setShowKeypad(false)}
                onBlur={() => setShowKeypad(true)}
              />
              <MaterialIcons
                name="edit"
                size={16}
                color={note ? COLORS.primary : COLORS.textMuted}
              />
            </View>
          </View>
          {showKeypad && (
            <>
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
            </>
          )}
        </View>
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
    marginTop: 12,
    marginBottom: 4,
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
  keypadWalletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    alignSelf: 'stretch',
    gap: 8,
    paddingHorizontal: 4,
  },
  keypadWalletSpacer: {
    flex: 1,
  },
  keypadNoteInline: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    maxWidth: '45%',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.border,
  },
  keypadNoteInlineInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    padding: 0,
    textAlign: 'left',
  },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    maxWidth: '80%',
  },
  walletChipName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    flexShrink: 1,
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
  categorySection: {
    paddingTop: 4,
    overflow: 'hidden',
  },
  categorySectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 12,
    marginBottom: 2,
    paddingHorizontal: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  categoryChip: {
    flexBasis: '22%',
    flexGrow: 1,
    maxWidth: '25%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  categoryChipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F1F4',
  },
  categoryChipName: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textLight,
    textAlign: 'center',
    maxWidth: 68,
  },
  categoryChipAdd: {
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  categoryChipAddIcon: {
    backgroundColor: '#F1F1F4',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
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
  walletEmptyHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 4,
    paddingHorizontal: 8,
  },
});

export default ExpenseForm;
