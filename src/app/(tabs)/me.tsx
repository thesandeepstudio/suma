import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Linking,
} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {useRouter, useFocusEffect} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {File, Paths} from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import {COLORS} from '../../utils/constants';
import {
  getAllData,
  restoreAllData,
  BackupData,
  getUsername,
  setUsername as saveUsername,
  clearAllData,
} from '../../utils/storage';
import {showThemeAlert} from '../../components/ThemeAlert';

const SettingsScreen: React.FC = () => {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [username, setUsername] = useState('user');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('user');

  const loadData = useCallback(async () => {
    const name = await getUsername();
    setUsername(name);
    setNameInput(name);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    await saveUsername(trimmed);
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
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = new File(result.assets[0].uri);
      const text = await file.text();
      let parsed: BackupData;
      try {
        parsed = JSON.parse(text);
      } catch {
        showThemeAlert('Import failed', 'The selected file is not valid JSON.');
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
            await clearAllData();
            setBusy(null);
            loadData();
            showThemeAlert('Done', 'All data has been cleared.');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
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
              <MaterialIcons name="edit" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
          <Text style={styles.subtitle}>Settings</Text>
        </View>

        {busy ? (
          <View style={styles.busyRow}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.busyText}>{busy}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <View style={[styles.rowIcon, {backgroundColor: COLORS.primary + '12'}]}>
              <MaterialIcons name="person" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowName}>Username</Text>
              <Text style={styles.rowValue}>{username}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={[styles.rowIcon, {backgroundColor: COLORS.primary + '12'}]}>
              <MaterialIcons name="attach-money" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowName}>Currency</Text>
              <Text style={styles.rowValue}>NPR (Nepalese Rupee)</Text>
            </View>
          </View>
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
              <Text style={styles.rowDesc}>Manage main and subcategories</Text>
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
            onPress={() => Linking.openURL('https://github.com/anomalyco/opencode/issues')}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
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
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
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
});

export default SettingsScreen;
