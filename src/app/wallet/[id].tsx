import React, {useCallback, useEffect, useState} from 'react';
import {Text, View, ActivityIndicator, TouchableOpacity} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {useLocalSearchParams, useNavigation, useRouter} from 'expo-router';
import WalletForm from '../../components/WalletForm';
import {Wallet} from '../../types';
import {deleteWallet, getWallets} from '../../utils/storage';
import {COLORS} from '../../utils/constants';
import {showThemeAlert} from '../../components/ThemeAlert';

export default function EditWalletScreen() {
  const {id} = useLocalSearchParams<{id: string}>();
  const router = useRouter();
  const navigation = useNavigation();
  const [wallet, setWallet] = useState<Wallet | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const wallets = await getWallets();
      setWallet(wallets.find(w => w.id === id));
      setLoading(false);
    })();
  }, [id]);

  const handleDelete = useCallback(() => {
    if (!wallet) return;
    showThemeAlert('Delete Account', `Delete "${wallet.name}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const count = await deleteWallet(wallet.id);
          if (count > 0) {
            showThemeAlert(
              'Account in use',
              `"${wallet.name}" is referenced by ${count} transaction${count === 1 ? '' : 's'}. You can't delete an account that has records.`,
            );
            return;
          }
          if (count === -1) {
            showThemeAlert('Error', 'Could not delete the account. Try again.');
            return;
          }
          router.back();
        },
      },
    ]);
  }, [wallet, router]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleDelete} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <MaterialIcons name="more-vert" size={24} color={COLORS.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleDelete]);

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!wallet) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{color: COLORS.textMuted}}>Account not found</Text>
      </View>
    );
  }

  return <WalletForm editing={wallet} />;
}