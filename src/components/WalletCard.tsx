import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../utils/constants";
import { formatCurrency } from "../utils/helpers";

interface Props {
  name: string;
  balance: number;
  icon?: string;
  onPress: () => void;
}

const WalletCard: React.FC<Props> = ({ name, balance, icon, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <View style={styles.iconBox}>
          <MaterialIcons
            name={(icon || "account-balance-wallet") as any}
            size={26}
            color={COLORS.primary}
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.balance}>{formatCurrency(balance)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  info: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  right: {
    alignItems: "flex-end",
  },
  balance: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
});

export default WalletCard;
