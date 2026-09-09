import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {useEffect} from 'react';
import {COLORS} from '../utils/constants';
import {seedInitialData} from '../utils/storage';
import {ThemeAlert} from '../components/ThemeAlert';

export default function RootLayout() {
  useEffect(() => {
    seedInitialData();
  }, []);

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
      </Stack>
    </>
  );
}
