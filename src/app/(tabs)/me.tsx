import React, {useCallback, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Linking,
  Modal,
  FlatList,
} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {useRouter, useFocusEffect} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {File, Paths} from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {COLORS, CURRENCIES, CurrencyOption} from '../../utils/constants';
import {
  getAllData,
  restoreAllData,
  BackupData,
  getUsername,
  setUsername as saveUsername,
  clearAllData,
  getCurrency,
  setCurrency as saveCurrency,
} from '../../utils/storage';
import {setActiveCurrency} from '../../utils/helpers';
import {showThemeAlert} from '../../components/ThemeAlert';

const SettingsScreen: React.FC = () => {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [username, setUsername] = useState('user');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('user');
  const [currencyCode, setCurrencyCode] = useState('NPR');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const loadData = useCallback(async () => {
    const [name, currency] = await Promise.all([getUsername(), getCurrency()]);
    setUsername(name);
    setNameInput(name);
    setCurrencyCode(currency);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    const ok = await saveUsername(trimmed);
    if (!ok) {
      showThemeAlert('Error', 'Could not save the name. Try again.');
      return;
    }
    setUsername(trimmed);
    setEditingName(false);
  };

  const handleExport = async () => {
    try {
      setBusy('Exporting...');
      const data = await getAllData();
      const file = new File(Paths.cache, 'suma-backup.json');
      if (file.exists) file.delete();
      file.create();
      file.write(JSON.stringify(data, null, 2));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Share SUMA backup',
        });
      } else {
        showThemeAlert('Export', 'Sharing is not available on this device.');
      }
    } catch {
      showThemeAlert('Export failed', 'Could not create the backup file.');
    } finally {
      setBusy(null);
    }
  };

  const doImport = async (data: BackupData) => {
    setBusy('Importing...');
    const ok = await restoreAllData(data);
    setBusy(null);
    if (ok) {
      loadData();
      showThemeAlert(
        'Backup restored',
        `Imported ${data.transactions?.length ?? 0} transactions, ${data.categories?.length ?? 0} categories, and ${data.wallets?.length ?? 0} wallets.`,
      );
    } else {
      showThemeAlert('Import failed', 'The selected file is not a valid backup.');
    }
  };

  const handleImport = async () => {
    try {
      const res = await File.pickFileAsync();
      if (res.canceled || !res.result) return;
      const file = res.result;
      const text = await file.text();
      let parsed: BackupData;
      try {
        parsed = JSON.parse(text);
      } catch {
        showThemeAlert('Import failed', 'The selected file is not valid JSON.');
        return;
      }
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        !Array.isArray(parsed.transactions) ||
        !Array.isArray(parsed.categories) ||
        !Array.isArray(parsed.wallets)
      ) {
        showThemeAlert('Import failed', 'The selected file is not a SUMA backup.');
        return;
      }
      showThemeAlert(
        'Restore backup?',
        'This will replace all current data on this device with the file contents. Continue?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Restore',
            style: 'destructive',
            onPress: () => doImport(parsed),
          },
        ],
      );
    } catch {
      showThemeAlert('Import failed', 'Could not read the selected file.');
    }
  };

  const handleClearAll = () => {
    showThemeAlert(
      'Clear all data?',
      'This will permanently delete all transactions, wallets, and categories. This cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear everything',
          style: 'destructive',
          onPress: async () => {
            setBusy('Clearing...');
            const ok = await clearAllData();
            setBusy(null);
            if (!ok) {
              showThemeAlert('Error', 'Could not clear the data. Try again.');
              return;
            }
            loadData();
            showThemeAlert('Done', 'All data has been cleared.');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.heading}>Settings</Text>
          <Text style={styles.subheading}>Profile & data</Text>
        </View>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={40} color={COLORS.white} />
          </View>
          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                onSubmitEditing={handleSaveName}
                returnKeyType="done"
                placeholder="Your name"
                placeholderTextColor={COLORS.textMuted}
              />
              <TouchableOpacity
                style={styles.nameSaveBtn}
                onPress={handleSaveName}>
                <MaterialIcons name="check" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.nameRow}
              onPress={() => setEditingName(true)}>
              <Text style={styles.title}>{username}</Text>
            </TouchableOpacity>
          )}
        </View>

        {busy ? (
          <View style={styles.busyRow}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.busyText}>{busy}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.6}
            onPress={() => {
              setEditingName(true);
              scrollRef.current?.scrollTo({y: 0, animated: true});
            }}>
            <View style={[styles.rowIcon, {backgroundColor: COLORS.primary + '12'}]}>
              <MaterialIcons name="person" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowName}>Username</Text>
              <Text style={styles.rowValue}>{username}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.6}
            onPress={() => setShowCurrencyPicker(true)}>
            <View style={[styles.rowIcon, {backgroundColor: COLORS.primary + '12'}]}>
              <MaterialIcons name="attach-money" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowName}>Currency</Text>
              <Text style={styles.rowValue}>
                {CURRENCIES.find(c => c.code === currencyCode)?.name ?? currencyCode}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Manage</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.6}
            onPress={() => router.push('/category')}>
            <View style={[styles.rowIcon, {backgroundColor: COLORS.primary + '12'}]}>
              <MaterialIcons name="category" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowName}>Categories</Text>
              <Text style={styles.rowDesc}>Manage your categories</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.6}
            onPress={() => router.push('/budget')}>
            <View style={[styles.rowIcon, {backgroundColor: COLORS.primary + '12'}]}>
              <MaterialIcons name="pie-chart" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowName}>Budgets</Text>
              <Text style={styles.rowDesc}>Set monthly and category limits</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.6}
            onPress={() => router.push('/wallet')}>
            <View style={[styles.rowIcon, {backgroundColor: COLORS.primary + '12'}]}>
              <MaterialIcons name="account-balance-wallet" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowName}>Wallets</Text>
              <Text style={styles.rowDesc}>Manage accounts and balances</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Data</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.row, busy ? styles.rowDisabled : null]}
            activeOpacity={0.6}
            disabled={!!busy}
            onPress={handleExport}>
            <View style={[styles.rowIcon, {backgroundColor: COLORS.primary + '12'}]}>
              <MaterialIcons name="file-upload" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowName}>Export data</Text>
              <Text style={styles.rowDesc}>Save everything to a JSON backup file</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={[styles.row, busy ? styles.rowDisabled : null]}
            activeOpacity={0.6}
            disabled={!!busy}
            onPress={handleImport}>
            <View style={[styles.rowIcon, {backgroundColor: COLORS.primary + '12'}]}>
              <MaterialIcons name="file-download" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowName}>Import data</Text>
              <Text style={styles.rowDesc}>Restore from a JSON backup file</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={[styles.row, busy ? styles.rowDisabled : null]}
            activeOpacity={0.6}
            disabled={!!busy}
            onPress={handleClearAll}>
            <View style={[styles.rowIcon, {backgroundColor: '#FFEBEE'}]}>
              <MaterialIcons name="delete-forever" size={22} color={COLORS.danger} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowName, {color: COLORS.danger}]}>Clear all data</Text>
              <Text style={styles.rowDesc}>Permanently delete all records</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <View style={[styles.rowIcon, {backgroundColor: COLORS.primary + '12'}]}>
              <MaterialIcons name="info-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowName}>SUMA</Text>
              <Text style={styles.rowDesc}>Personal finance tracker</Text>
            </View>
            <Text style={styles.versionText}>v1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.6}
            onPress={() => Linking.openURL('https://github.com/thesandeepstudio/suma/issues')}>
            <View style={[styles.rowIcon, {backgroundColor: COLORS.primary + '12'}]}>
              <MaterialIcons name="bug-report" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowName}>Report a bug</Text>
              <Text style={styles.rowDesc}>Open GitHub issues</Text>
            </View>
            <MaterialIcons name="open-in-new" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>Made with care for your finances</Text>
      </ScrollView>

      <Modal
        visible={showCurrencyPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCurrencyPicker(false)}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowCurrencyPicker(false)}>
          <View style={styles.sheet}>
            <TouchableOpacity activeOpacity={1} style={{width: '100%'}}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Select Currency</Text>
                <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
                  <MaterialIcons name="close" size={24} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={CURRENCIES}
                keyExtractor={item => item.code}
                showsVerticalScrollIndicator={false}
                renderItem={({item}: {item: CurrencyOption}) => {
                  const selected = item.code === currencyCode;
                  return (
                    <TouchableOpacity
                      style={styles.currencyRow}
                      activeOpacity={0.6}
                      onPress={async () => {
                        setCurrencyCode(item.code);
                        setActiveCurrency(item.code);
                        await saveCurrency(item.code);
                        setShowCurrencyPicker(false);
                      }}>
                      <View style={styles.currencySymbolBox}>
                        <Text style={styles.currencySymbol}>{item.symbol}</Text>
                      </View>
                      <View style={styles.currencyInfo}>
                        <Text style={styles.currencyCode}>{item.code}</Text>
                        <Text style={styles.currencyName}>{item.name}</Text>
                      </View>
                      {selected && (
                        <MaterialIcons
                          name="check"
                          size={22}
                          color={COLORS.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingVertical: 2,
    minWidth: 120,
    textAlign: 'center',
  },
  nameSaveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 20,
    marginLeft: 28,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    marginLeft: 12,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  rowDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  rowValue: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  versionText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    gap: 8,
  },
  busyText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 32,
    marginBottom: 40,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: '70%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  currencySymbolBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  currencyName: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
});

export default SettingsScreen;
