import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputFocusEventData,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/theme/theme';

import { Text } from '../builders/Text';

export interface InputProps extends TextInputProps {
  prompting?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: boolean;
  errorText?: string;
  wrapperStyle?: StyleProp<ViewStyle>;
  type?: 'default' | 'password';
  disabled?: boolean;
  icon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(({
  prompting,
  value,
  onChangeText,
  error,
  errorText,
  wrapperStyle,
  onFocus,
  onBlur,
  type,
  disabled,
  icon,
  ...props
}, ref) => {
  const localRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { colors } = useAppTheme();

  const _onFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    if (!disabled) {
      setIsFocused(true);
      onFocus?.(e);
    }
  };
  const _onBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    if (!disabled) {
      setIsFocused(false);
      onBlur?.(e);
    }
  };
  const togglePasswordVisibility = () => {
    if (!disabled) setIsPasswordVisible(v => !v);
  };

  return (
    <View style={[styles.container, wrapperStyle]}>
      <View style={[
        styles.inputWrapper,
        { backgroundColor: colors.background, borderColor: colors.border },
        error && { borderColor: colors.error_500 },
        isFocused && { borderColor: colors.primary },
        disabled && { borderColor: colors.grey_50 },
      ]}>
        {icon && <View style={styles.leftIcon}>{icon}</View>}

        <TextInput
          ref={ref || localRef}
          value={value}
          onChangeText={onChangeText}
          onFocus={_onFocus}
          onBlur={_onBlur}
          editable={!disabled}
          textContentType={type === 'password' ? 'password' : undefined}
          secureTextEntry={type === 'password' && !isPasswordVisible}
          placeholderTextColor={colors.border}
          cursorColor={colors.black}
          style={[styles.input, { color: disabled ? colors.grey_600 : colors.grey_800 }]}
          {...props}
        />

        {type === 'password' && (
          <TouchableOpacity onPress={togglePasswordVisibility} disabled={disabled}>
            <View style={styles.rightIcon}>
              <Ionicons
                name={isPasswordVisible ? 'eye' : 'eye-off'}
                size={24}
                color={colors.grey_400}
              />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {error && errorText && (
        <Text colorName="error_500" variant="p4" style={styles.errorText}>
          {errorText}
        </Text>
      )}
      {prompting && (
        <Text style={[styles.prompting, { color: colors.grey_600 }]}>
          {prompting}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  errorText: {
    marginTop: 4,
  },
  input: {
    flex: 1,
    fontSize: 18,
    minHeight: 56,
  },
  inputWrapper: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    paddingHorizontal: 16,
    width: '100%',
  },
  leftIcon: {
    marginRight: 9,
  },
  prompting: {
    fontSize: 13,
    marginTop: 4,
  },
  rightIcon: {
    marginLeft: 9,
  },
});
