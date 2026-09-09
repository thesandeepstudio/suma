import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Wallet, IconName } from "@/types";
import { COLORS } from "@/utils/constants";
import { addWallet, updateWallet } from "@/utils/storage";
import { generateId } from "@/utils/helpers";
import { showThemeAlert } from "@/components/ThemeAlert";

const ACCOUNT_ICONS: IconName[] = [
  "account-balance-wallet",
  "account-balance",
  "savings",
  "credit-card",
  "payments",
  "attach-money",
  "currency-rupee",
  "storefront",
  "phone-android",
  "qr-code",
  "handshake",
];

interface Props {
  editing?: Wallet;
}

const WalletForm: React.FC<Props> = ({ editing }) => {
  const router = useRouter();
  const [name, setName] = useState(editing?.name || "");
  const [balance, setBalance] = useState(
    editing ? String(editing.currentBalance) : "",
  );
  const [icon, setIcon] = useState<IconName>(
    editing?.icon || "account-balance-wallet",
  );

  const handleSave = async () => {
    if (!name.trim()) {
      showThemeAlert("Error", "Please enter an account name");
      return;
    }
    const parsedBalance = parseFloat(balance);
    if (isNaN(parsedBalance) || parsedBalance < 0) {
      showThemeAlert("Error", "Please enter a valid balance");
      return;
    }

    if (editing) {
      const updated: Wallet = {
        ...editing,
        name: name.trim(),
        currentBalance: parsedBalance,
        icon,
      };
      await updateWallet(updated);
    } else {
      const wallet: Wallet = {
        id: generateId(),
        name: name.trim(),
        initialBalance: parsedBalance,
        currentBalance: parsedBalance,
        createdAt: new Date().toISOString(),
        icon,
      };
      await addWallet(wallet);
    }
    router.back();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.label}>Account Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. My Account"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.label}>
          {editing ? "Current Balance" : "Initial Balance"}
        </Text>
        <View style={styles.amountWrap}>
          <Text style={styles.currencySymbol}>NPR</Text>
          <TextInput
            style={styles.amountInput}
            value={balance}
            onChangeText={setBalance}
            placeholder="0.00"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Account Icon</Text>
        <View style={styles.iconGrid}>
          {ACCOUNT_ICONS.map(ic => {
            const isSelected = icon === ic;
            return (
              <TouchableOpacity
                key={ic}
                style={[
                  styles.iconItem,
                  isSelected && styles.iconItemSelected,
                ]}
                onPress={() => setIcon(ic)}>
                <MaterialIcons
                  name={ic}
                  size={26}
                  color={isSelected ? COLORS.primary : COLORS.textMuted}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <MaterialIcons name="check" size={24} color={COLORS.white} />
        <Text style={styles.saveBtnText}>
          {editing ? "Update Account" : "Create Account"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textLight,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
    paddingHorizontal: 14,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  iconItem: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
  },
  iconItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "10",
  },
  saveBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default WalletForm;
