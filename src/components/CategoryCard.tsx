import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {COLORS} from '../utils/constants';
import {getActiveCurrency} from '../utils/helpers';

interface Props {
  name: string;
  icon: string;
  color: string;
  amount?: number;
  onPress?: () => void;
}

const CategoryCard: React.FC<Props> = ({name, icon, color, amount, onPress}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconBox, {backgroundColor: color + '20'}]}>
        <MaterialIcons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      {amount !== undefined && (
        <Text style={[styles.amount, {color}]}>{`${getActiveCurrency().symbol} ${amount.toFixed(0)}`}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 80,
    paddingVertical: 12,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  amount: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
});

export default CategoryCard;
