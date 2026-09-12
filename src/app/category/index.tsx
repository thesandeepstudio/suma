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

type FormMode = 'add' | 'edit';

interface FormState {
  mode: FormMode;
  name: string;
  icon: IconName;
  editingId?: string;
}

const emptyForm = (): FormState => ({
  mode: 'add',
  name: '',
  icon: 'more-horiz',
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

  const startAdd = () => {
    setForm({...emptyForm(), mode: 'add'});
    setFormOpen(true);
  };

  const startEdit = (cat: Category) => {
    setForm({
      mode: 'edit',
      name: cat.name,
      icon: cat.icon,
      editingId: cat.id,
    });
    setFormOpen(true);
  };

  const handleRowPress = (cat: Category) => {
    showThemeAlert(cat.name, undefined, [
      {text: 'Rename', onPress: () => startEdit(cat)},
      {
        text: 'Delete',
        style: 'destructive' as const,
        onPress: () => {
          showThemeAlert(
            'Delete Category',
            `Delete "${cat.name}"?`,
            [
              {text: 'Cancel', style: 'cancel' as const},
              {
                text: 'Delete',
                style: 'destructive' as const,
                onPress: async () => {
                  const count = await deleteCategory(cat.id);
                  if (count > 0) {
                    showThemeAlert(
                      'Category in use',
                      `"${cat.name}" is used by ${count} transaction${count === 1 ? '' : 's'}. Rename it instead of deleting.`,
                    );
                  } else if (count === -1) {
                    showThemeAlert('Error', 'Could not delete the category. Try again.');
                  }
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

    let ok: boolean;
    if (form.mode === 'edit' && form.editingId) {
      ok = await updateCategory({
        id: form.editingId,
        name,
        icon: form.icon,
      });
    } else {
      ok = await addCategory({
        id: generateId(),
        name,
        icon: form.icon,
      });
    }
    if (!ok) {
      showThemeAlert('Error', 'Could not save the category. Try again.');
      return;
    }
    setFormOpen(false);
    await load();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {categories.length === 0 && (
        <View style={styles.emptyBox}>
          <MaterialIcons name="category" size={40} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No categories yet.</Text>
          <Text style={styles.emptyHint}>Tap the + chip to add a category.</Text>
        </View>
      )}
      <View style={styles.grid}>
        <TouchableOpacity
          style={[styles.chip, styles.chipAdd]}
          activeOpacity={0.7}
          onPress={startAdd}>
          <View style={[styles.chipIcon, styles.chipAddIcon]}>
            <MaterialIcons name="add" size={22} color={COLORS.textMuted} />
          </View>
          <Text style={styles.chipName}>New</Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={styles.chip}
            activeOpacity={0.7}
            onPress={() => handleRowPress(cat)}>
            <View style={styles.chipIcon}>
              <MaterialIcons name={cat.icon} size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.chipName} numberOfLines={1}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal
        visible={formOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFormOpen(false)}>
        <TouchableOpacity style={styles.formBackdrop} activeOpacity={1} onPress={() => setFormOpen(false)}>
          <View style={styles.formSheet}>
            <Text style={styles.formTitle}>
              {form.mode === 'edit' ? 'Rename Category' : 'Add Category'}
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
                    style={[styles.iconOption, active && {borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10'}]}
                    onPress={() => setForm(f => ({...f, icon}))}>
                    <MaterialIcons name={icon} size={20} color={active ? COLORS.primary : COLORS.textMuted} />
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
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    width: '23%',
    flexGrow: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  chipIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.text + '12',
  },
  chipName: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textLight,
    textAlign: 'center',
    maxWidth: 68,
  },
  chipAdd: {
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  chipAddIcon: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 24,
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
  formBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.backdrop,
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