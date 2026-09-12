import React, {useRef, useState} from 'react';
import {useRouter} from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {COLORS} from '../utils/constants';
import {setOnboardingDone, addWallet} from '../utils/storage';
import {generateId} from '../utils/helpers';

interface Slide {
  key: string;
  icon: string;
  title: string;
  body: string;
  points: string[];
}

const SLIDES: Slide[] = [
  {
    key: 'welcome',
    icon: 'auto-graph',
    title: 'Welcome to SUMA',
    body: 'Your offline-first expense tracker. Fast entry, budgets, wallets and recurring bills — all without an account.',
    points: [
      '3-second entry with a custom keypad',
      'Budgets, wallets & recurring bills',
      'Your data stays on your device',
    ],
  },
  {
    key: 'wallet',
    icon: 'account-balance-wallet',
    title: 'Create a wallet\n(optional)',
    body: 'Walks you through a quick optional wallet so your balances have a home. Skip it if you prefer — you can add wallets anytime from the Wallets tab.',
    points: ['Skip this screen to explore first'],
  },
  {
    key: 'ready',
    icon: 'rocket-launch',
    title: "You're all set.",
    body: 'Tap the record button to add your first expense, then browse the Report and Wallets tabs at your leisure.',
    points: [],
  },
];

const {width: W} = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [walletName, setWalletName] = useState('');
  const [balance, setBalance] = useState('');

  const scrollRef = useRef<ScrollView>(null);

  const goto = (next: number) => {
    setStep(next);
    scrollRef.current?.scrollTo({x: next * W, animated: true});
  };

  const createWallet = async () => {
    const name = walletName.trim();
    if (!name) return;
    const parsed = parseFloat(balance) || 0;
    await addWallet({
      id: generateId(),
      name,
      initialBalance: parsed,
      currentBalance: parsed,
      createdAt: new Date().toISOString(),
    });
    goto(2);
  };

  const finish = async () => {
    await setOnboardingDone(true);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}>
          {SLIDES.map((s, i) => (
            <View key={s.key} style={[styles.slide, {width: W}]}>
              <View style={styles.iconWrap}>
                <MaterialIcons name={s.icon as any} size={44} color={COLORS.primary} />
              </View>
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.bodyText}>{s.body}</Text>
              {s.points.length > 0 && (
                <View style={styles.points}>
                  {s.points.map((p) => (
                    <View key={p} style={styles.pointRow}>
                      <MaterialIcons name="check" size={16} color={COLORS.primary} />
                      <Text style={styles.pointText}>{p}</Text>
                    </View>
                  ))}
                </View>
              )}
              {i === 1 && (
                <View style={styles.walletForm}>
                  <TextInput
                    style={styles.input}
                    placeholder="Wallet name (e.g. Cash)"
                    placeholderTextColor={COLORS.textMuted}
                    value={walletName}
                    onChangeText={setWalletName}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Starting balance"
                    placeholderTextColor={COLORS.textMuted}
                    value={balance}
                    onChangeText={setBalance}
                    keyboardType="numeric"
                  />
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View key={s.key} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        {step === 1 ? (
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() => goto(2)}
              activeOpacity={0.7}>
              <Text style={styles.ghostText}>Skip wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, styles.flexBtn]}
              onPress={createWallet}
              activeOpacity={0.8}>
              <Text style={styles.primaryText}>Create wallet</Text>
              <MaterialIcons name="arrow-forward" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        ) : step === 2 ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={finish}
            activeOpacity={0.8}>
            <Text style={styles.primaryText}>Start tracking</Text>
            <MaterialIcons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => goto(1)}
            activeOpacity={0.8}>
            <Text style={styles.primaryText}>Get started</Text>
            <MaterialIcons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  slide: {
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  points: {
    width: '100%',
    gap: 12,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  pointText: {
    fontSize: 14,
    color: COLORS.text,
  },
  walletForm: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 16,
    gap: 20,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 18,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
  },
  primaryText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  flexBtn: {
    flex: 1,
  },
  ghostBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  ghostText: {
    color: COLORS.textLight,
    fontSize: 14,
    fontWeight: '600',
  },
});
