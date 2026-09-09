import React, {useEffect, useState} from 'react';
import {Modal, View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {COLORS} from '../utils/constants';

interface ThemeAlertOption {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface ThemeAlertConfig {
  title?: string;
  message?: string;
  options?: ThemeAlertOption[];
}

let listener: ((config: ThemeAlertConfig | null) => void) | null = null;

export const showThemeAlert = (
  title?: string,
  message?: string,
  options?: ThemeAlertOption[],
) => {
  listener?.({title, message, options});
};

const dismiss = () => {
  listener?.(null);
};

export const ThemeAlert: React.FC = () => {
  const [config, setConfig] = useState<ThemeAlertConfig | null>(null);

  useEffect(() => {
    listener = setConfig;
    return () => {
      listener = null;
    };
  }, []);

  const close = (option?: ThemeAlertOption) => {
    if (option?.onPress) {
      dismiss();
      setTimeout(option.onPress, 0);
    } else {
      dismiss();
    }
  };

  const onBackdrop = () => {
    const cancel = config?.options?.find(o => o.style === 'cancel');
    close(cancel);
  };

  return (
    <Modal
      visible={config !== null}
      transparent
      animationType="fade"
      onRequestClose={onBackdrop}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onBackdrop}>
        <View style={styles.sheet}>
          {config?.title ? <Text style={styles.title}>{config.title}</Text> : null}
          {config?.message ? <Text style={styles.message}>{config.message}</Text> : null}
          {config?.options?.map(option => {
            const isDestructive = option.style === 'destructive';
            const isCancel = option.style === 'cancel';
            return (
              <TouchableOpacity
                key={option.text}
                style={[
                  styles.button,
                  isDestructive ? styles.buttonDestructive : isCancel ? styles.buttonCancel : styles.buttonDefault,
                ]}
                activeOpacity={0.7}
                onPress={() => close(option)}>
                <Text
                  style={[
                    styles.buttonText,
                    isDestructive
                      ? styles.buttonTextDestructive
                      : isCancel
                        ? styles.buttonTextCancel
                        : styles.buttonTextDefault,
                  ]}>
                  {option.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 40,
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 6,
  },
  button: {
    marginTop: 14,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDefault: {
    backgroundColor: COLORS.primary,
  },
  buttonCancel: {
    backgroundColor: '#F1F1F4',
  },
  buttonDestructive: {
    backgroundColor: '#EDEDED',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  buttonTextDefault: {
    color: COLORS.white,
  },
  buttonTextCancel: {
    color: COLORS.text,
  },
  buttonTextDestructive: {
    color: COLORS.danger,
  },
});