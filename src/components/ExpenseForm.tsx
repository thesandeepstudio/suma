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
import {generateId, formatCurrency, getRelativeDate, getCategoryLabel} from '@/utils/helpers';
import {showThemeAlert} from '@/components/ThemeAlert';

const TYPES: {key: TransactionType; label: string; icon: IconName}[] = [
  {key: 'expense', label: 'Expenses', icon: 'remove-circle-outline'},
  {key: 'income', label: 'Income', icon: 'add-circle-outline'},
  {key: 'transfer', label: 'Transfer', icon: 'swap-horiz'},
];

const SEGMENT_SPRING = {damping: 24, stiffness: 260, mass: 0.7};

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
    const parsedAmount = parseFloat(amount);
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

  const isToday = new Date(date).toDateString() === new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = new Date(date).toDateString() === yesterday.toDateString();
  const amountColor = type === 'income' ? COLORS.success : COLORS.text;
  const amountHint =
    type === 'income'
      ? 'How much did you receive?'
      : type === 'transfer'
        ? 'How much are you transferring?'
        : 'How much did you spend?';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
            keyboardType="decimal-pad"
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
        <View style={styles.listRow}>
          <View style={styles.listRowIcon}>
            <MaterialIcons name="calendar-today" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.listRowText}>
            <Text style={styles.listRowLabel}>Date</Text>
            <Text style={styles.listRowValue}>{getRelativeDate(date)}</Text>
          </View>
          <View style={styles.dateChips}>
            <TouchableOpacity
              style={[styles.dateBtn, isToday && styles.dateBtnActive]}
              onPress={() => setDate(new Date().toISOString())}>
              <Text style={[styles.dateBtnText, isToday && styles.dateBtnTextActive]}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateBtn, isYesterday && styles.dateBtnActive]}
              onPress={() => setDate(yesterday.toISOString())}>
              <Text style={[styles.dateBtnText, isYesterday && styles.dateBtnTextActive]}>
                Yesterday
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <MaterialIcons name="check" size={24} color={COLORS.white} />
        <Text style={styles.saveBtnText}>{editing ? 'Update Record' : 'Save Record'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
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
  dateChips: {
    flexDirection: 'row',
  },
  dateBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dateBtnText: {
    color: COLORS.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  dateBtnTextActive: {
    color: COLORS.white,
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
