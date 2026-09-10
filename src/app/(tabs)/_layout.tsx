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
  const scale = useSharedValue(focused ? 1 : 0.9);
  const translateY = useSharedValue(focused ? 0 : 2);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.9, {
      damping: 20,
      stiffness: 250,
      mass: 0.5,
    });
    translateY.value = withSpring(focused ? 0 : 2, {
      damping: 20,
      stiffness: 250,
      mass: 0.5,
    });
  }, [focused, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}, {translateY: translateY.value}],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <MaterialIcons name={name} size={23} color={color} />
    </Animated.View>
  );
};

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: 'transparent',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          marginHorizontal: 0,
          marginBottom: 0,
          height: 64,
          paddingHorizontal: 5,
          paddingTop: 10,
          paddingBottom: 10,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 8},
          shadowOpacity: 0.2,
          shadowRadius: 20,
          elevation: 12,
          position: 'absolute',
        },
        tabBarActiveTintColor: '#111111',
        tabBarInactiveTintColor: '#999999',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.3,
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
            <AnimatedTabIcon name="timeline" color={color} focused={focused} />
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
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: '#111111',
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: {width: 0, height: 4},
                    shadowOpacity: 0.25,
                    shadowRadius: 10,
                    elevation: 10,
                  }}>
                  <MaterialIcons name="add" size={28} color="#FFFFFF" />
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
              name="wallet"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Settings',
          tabBarIcon: ({color, focused}) => (
            <AnimatedTabIcon name="settings" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}