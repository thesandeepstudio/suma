import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {File, Paths} from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import {COLORS} from '../../utils/constants';
import {getAllData, restoreAllData, BackupData} from '../../utils/storage';
import {showThemeAlert} from '../../components/ThemeAlert';

const MeScreen: React.FC = () => {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setBusy('Exporting…');
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
    setBusy('Importing…');
    const ok = await restoreAllData(data);
    setBusy(null);
    if (ok) {
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={40} color={COLORS.white} />
          </View>
          <Text style={styles.title}>user</Text>
          <Text style={styles.subtitle}>Settings</Text>
        </View>

        {busy ? (
          <View style={styles.busyRow}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.busyText}>{busy}</Text>
          </View>
        ) : null}

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
        </View>

        <Text style={styles.sectionTitle}>Backup</Text>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
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
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
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
});

export default MeScreen;