import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {useEffect, useState} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {COLORS} from '../utils/constants';
import {seedInitialData, getCurrency} from '../utils/storage';
import {setActiveCurrency} from '../utils/helpers';
import {ThemeAlert} from '../components/ThemeAlert';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await seedInitialData();
      const currency = await getCurrency();
      setActiveCurrency(currency);
      if (mounted) setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <ThemeAlert />
      <Stack
        screenOptions={{
          headerStyle: {backgroundColor: COLORS.background},
          headerShadowVisible: false,
          headerTintColor: COLORS.text,
        }}>
        <Stack.Screen name="(tabs)" options={{headerShown: false}} />
        <Stack.Screen
          name="expense/index"
          options={{
            title: 'Record',
            presentation: 'modal',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="expense/detail/[id]"
          options={{
            title: 'Transaction',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="expense/[id]"
          options={{
            title: 'Edit Record',
            presentation: 'modal',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="wallet/index"
          options={{
            title: 'Create Account',
            presentation: 'modal',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="wallet/[id]"
          options={{
            title: 'Edit Account',
            presentation: 'modal',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="transactions"
          options={{
            title: 'Transactions',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="category/index"
          options={{
            title: 'Categories',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="budget"
          options={{
            title: 'Budgets',
            presentation: 'modal',
            headerBackTitle: 'Back',
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
