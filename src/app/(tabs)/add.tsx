import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {MaterialIcons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {COLORS} from '../../utils/constants';

const ACTIONS = [
  {
    key: 'expense',
    label: 'New transaction',
    desc: 'Add expense, income or transfer',
    icon: 'add-circle-outline',
    route: '/expense',
  },
  {
    key: 'transfer',
    label: 'Transfer between wallets',
    desc: 'Move money between accounts',
    icon: 'swap-horiz',
    route: '/expense',
  },
  {
    key: 'wallet',
    label: 'New wallet',
    desc: 'Create an account',
    icon: 'account-balance-wallet',
    route: '/wallet',
  },
  {
    key: 'category',
    label: 'Manage categories',
    desc: 'Add or edit categories',
    icon: 'category',
    route: '/category',
  },
];

export default function AddTab() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>Quick Add</Text>
        <Text style={styles.subheading}>Fast entry, choose an action</Text>
      </View>
      <View style={styles.card}>
        {ACTIONS.map((action, i) => (
          <React.Fragment key={action.key}>
            {i > 0 ? <View style={styles.divider} /> : null}
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.6}
              onPress={() => router.push(action.route as never)}>
              <View style={[styles.rowIcon, {backgroundColor: COLORS.primary + '12'}]}>
                <MaterialIcons
                  name={action.icon as keyof typeof MaterialIcons.glyphMap}
                  size={22}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{action.label}</Text>
                <Text style={styles.rowDesc}>{action.desc}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  subheading: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginLeft: 68,
  },
});