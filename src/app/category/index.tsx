import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {useFocusEffect} from 'expo-router';
import {Category, IconName} from '@/types';
import {COLORS} from '@/utils/constants';
import {getCategories, addCategory, updateCategory, deleteCategory} from '@/utils/storage';
import {generateId} from '@/utils/helpers';
import {showThemeAlert} from '@/components/ThemeAlert';

const PRESET_ICONS: IconName[] = [
  'restaurant',
  'local-cafe',
  'local-drink',
  'fastfood',
  'shopping-bag',
  'shopping-cart',
  'directions-car',
  'directions-bus',
  'movie',
  'sports-esports',
  'receipt',
  'fitness-center',
  'school',
  'local-hospital',
  'home',
  'more-horiz',
];

const PRESET_COLORS = [
  '#111111',
  '#3F3F46',
  '#5F5F5F',
  '#7F7F7F',
  '#8E8E8E',
  '#6B4F3A',
  '#3F84C5',
  '#8C2F2F',
  '#2E7D32',
  '#B8860B',
];

type FormMode = 'add-main' | 'add-sub' | 'edit';

interface FormState {
  mode: FormMode;
  name: string;
  icon: IconName;
  color: string;
  parentId?: string;
  editingId?: string;
}

const emptyForm = (): FormState => ({
  mode: 'add-main',
  name: '',
  icon: 'more-horiz',
  color: PRESET_COLORS[0],
});

const CategoryScreen: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  const load = useCallback(async () => {
    setCategories(await getCategories());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const mains = categories.filter(c => !c.parentId);

  const startAddMain = () => {
    setForm({...emptyForm(), mode: 'add-main'});
    setFormOpen(true);
  };

  const startAddSub = (parent: Category) => {
    setForm({...emptyForm(), mode: 'add-sub', parentId: parent.id, color: parent.color});
    setFormOpen(true);
  };

  const startEdit = (cat: Category) => {
    setForm({
      mode: 'edit',
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      editingId: cat.id,
      parentId: cat.parentId,
    });
    setFormOpen(true);
  };

  const handleRowPress = (cat: Category) => {
    showThemeAlert(cat.name, undefined, [
      ...(cat.parentId
        ? []
        : [{text: 'Add Subcategory', onPress: () => startAddSub(cat)}]),
      {text: 'Rename', onPress: () => startEdit(cat)},
      {
        text: 'Delete',
        style: 'destructive' as const,
        onPress: () => {
          showThemeAlert(
            'Delete Category',
            cat.parentId
              ? `Delete "${cat.name}"?`
              : `Delete "${cat.name}" and all its subcategories?`,
            [
              {text: 'Cancel', style: 'cancel' as const},
              {
                text: 'Delete',
                style: 'destructive' as const,
                onPress: async () => {
                  await deleteCategory(cat.id);
                  await load();
                },
              },
            ],
          );
        },
      },
      {text: 'Cancel', style: 'cancel' as const},
    ]);
  };

  const handleSave = async () => {
    const name = form.name.trim();
    if (!name) {
      showThemeAlert('Error', 'Category name is required');
      return;
    }
    const duplicate = categories.some(
      c => c.id !== form.editingId && c.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      showThemeAlert('Error', `A category named "${name}" already exists`);
      return;
    }

    if (form.mode === 'edit' && form.editingId) {
      await updateCategory({
        id: form.editingId,
        name,
        icon: form.icon,
        color: form.color,
        parentId: form.parentId,
      });
    } else {
      await addCategory({
        id: generateId(),
        name,
        icon: form.icon,
        color: form.color,
        parentId: form.mode === 'add-sub' ? form.parentId : undefined,
      });
    }
    setFormOpen(false);
    await load();
  };

  const renderSubs = (parentId: string) =>
    categories
      .filter(c => c.parentId === parentId)
      .map(sub => (
        <TouchableOpacity
          key={sub.id}
          style={styles.subRow}
          activeOpacity={0.6}
          onPress={() => handleRowPress(sub)}>
          <View style={[styles.subIcon, {backgroundColor: sub.color + '18'}]}>
            <MaterialIcons name={sub.icon} size={16} color={sub.color} />
          </View>
          <Text style={styles.subName} numberOfLines={1}>
            {sub.name}
          </Text>
          <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      ));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {mains.length === 0 ? (
        <View style={styles.emptyBox}>
          <MaterialIcons name="category" size={40} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No categories yet.</Text>
          <Text style={styles.emptyHint}>Add a main category to get started.</Text>
        </View>
      ) : (
        mains.map(main => (
          <View key={main.id} style={styles.card}>
            <TouchableOpacity style={styles.mainRow} activeOpacity={0.6} onPress={() => handleRowPress(main)}>
              <View style={[styles.mainIcon, {backgroundColor: main.color + '18'}]}>
                <MaterialIcons name={main.icon} size={22} color={main.color} />
              </View>
              <View style={styles.mainText}>
                <Text style={styles.mainName} numberOfLines={1}>
                  {main.name}
                </Text>
                <Text style={styles.mainMeta}>
                  {categories.filter(c => c.parentId === main.id).length} subcategories
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
            {renderSubs(main.id)}
          </View>
        ))
      )}

      <TouchableOpacity style={styles.addBtn} onPress={startAddMain}>
        <MaterialIcons name="add" size={20} color={COLORS.white} />
        <Text style={styles.addBtnText}>Add Main Category</Text>
      </TouchableOpacity>

      <Modal
        visible={formOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFormOpen(false)}>
        <TouchableOpacity style={styles.formBackdrop} activeOpacity={1} onPress={() => setFormOpen(false)}>
          <View style={styles.formSheet}>
            <Text style={styles.formTitle}>
              {form.mode === 'edit'
                ? 'Rename Category'
                : form.mode === 'add-sub'
                  ? 'Add Subcategory'
                  : 'Add Main Category'}
            </Text>

            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={name => setForm(f => ({...f, name}))}
              placeholder="Category name"
              placeholderTextColor={COLORS.textMuted}
              autoFocus
            />

            <Text style={styles.fieldLabel}>Icon</Text>
            <View style={styles.iconGrid}>
              {PRESET_ICONS.map(icon => {
                const active = form.icon === icon;
                return (
                  <TouchableOpacity
                    key={icon}
                    style={[styles.iconOption, active && {borderColor: form.color, backgroundColor: form.color + '10'}]}
                    onPress={() => setForm(f => ({...f, icon}))}>
                    <MaterialIcons name={icon} size={20} color={active ? form.color : COLORS.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Color</Text>
            <View style={styles.colorRow}>
              {PRESET_COLORS.map(color => {
                const active = form.color === color;
                return (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorOption, {backgroundColor: color}, active && styles.colorActive]}
                    onPress={() => setForm(f => ({...f, color}))}>
                    {active && <MaterialIcons name="check" size={14} color={COLORS.white} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <MaterialIcons name="check" size={20} color={COLORS.white} />
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    marginBottom: 12,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  mainIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainText: {
    flex: 1,
    marginLeft: 12,
  },
  mainName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  mainMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  subIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 10,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textLight,
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  addBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 14,
    marginTop: 8,
  },
  addBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  formBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  formSheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '85%',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.card,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 18,
    marginBottom: 10,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: COLORS.card,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorActive: {
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  saveBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 20,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default CategoryScreen;