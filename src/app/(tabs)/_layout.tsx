import React, {useEffect} from 'react';
import {Tabs, useRouter} from 'expo-router';
import {MaterialIcons} from '@expo/vector-icons';
import {TouchableOpacity, View, TouchableOpacityProps, ColorValue} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {COLORS} from '../../utils/constants';
import {IconName} from '../../types';

interface AnimatedTabIconProps {
  name: IconName;
  color: ColorValue;
  focused: boolean;
}

const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({
  name,
  color,
  focused,
}) => {
  const scale = useSharedValue(focused ? 1 : 0.85);
  const translateY = useSharedValue(focused ? 0 : 4);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.85, {
      damping: 15,
      stiffness: 200,
      mass: 0.5,
    });
    translateY.value = withSpring(focused ? 0 : 4, {
      damping: 17,
      stiffness: 220,
      mass: 0.5,
    });
  }, [focused, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}, {translateY: translateY.value}],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <MaterialIcons name={name} size={25} color={color} />
    </Animated.View>
  );
};

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
        },
        headerStyle: {backgroundColor: COLORS.background},
        headerShadowVisible: false,
        headerTintColor: COLORS.text,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({color, focused}) => (
            <AnimatedTabIcon name="dashboard" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          headerShown: false,
          tabBarIcon: ({color, focused}) => (
            <AnimatedTabIcon name="assessment" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarIcon: () => (
            <MaterialIcons name="add" size={30} color={COLORS.white} />
          ),
          tabBarButton: props => {
            const {
              style,
              onPress: _onPress,
              accessibilityState,
              children: _children,
              ...rest
            } = props as unknown as TouchableOpacityProps;
            return (
              <TouchableOpacity
                {...rest}
                activeOpacity={0.8}
                accessibilityState={accessibilityState}
                onPress={() => router.push('/expense')}
                style={[
                  {flex: 1, justifyContent: 'center', alignItems: 'center', top: -14},
                  style,
                ]}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: COLORS.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: COLORS.primary,
                    shadowOffset: {width: 0, height: 4},
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 8,
                  }}>
                  <MaterialIcons name="add" size={30} color={COLORS.white} />
                </View>
              </TouchableOpacity>
            );
          },
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({color, focused}) => (
            <AnimatedTabIcon
              name="account-balance-wallet"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Me',
          tabBarIcon: ({color, focused}) => (
            <AnimatedTabIcon name="person" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}