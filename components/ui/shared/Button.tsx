import { merge } from 'lodash';
import React, { FC, ReactNode, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableHighlight,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';

import { AppLightTheme, useAppTheme } from '@/theme/theme';

import { Box } from '../builders/Box';

type ButtonType = keyof typeof typeStyle;

type ThemeColors = keyof typeof AppLightTheme.colors;

interface PropsType extends ViewProps {
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  wrapperStyle?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  buttonDisabledStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  type?: ButtonType;
  backgroundColor?: ThemeColors;
  textColor?: ThemeColors;
  borderColor?: ThemeColors;
  icon?: ReactNode;
  width?: 'full' | 'auto'
}

const commonStytle = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 16,
    width: '100%',
  },
  wrapper: {
    alignItems: 'center',
    width: '100%',
  },
});

const clearStyle = StyleSheet.create({});

const filledStyle = StyleSheet.create({});

const outlineStyle = StyleSheet.create({
  button: {
    borderWidth: 1,
  },
});

const typeStyle = {
  clear: merge({}, commonStytle, clearStyle),
  filled: merge({}, commonStytle, filledStyle),
  outline: merge({}, commonStytle, outlineStyle),
};

export const Button: FC<PropsType> = ({
  disabled,
  loading,
  onPress,
  wrapperStyle,
  buttonStyle,
  buttonDisabledStyle,
  textStyle,
  children,
  type = 'filled',
  backgroundColor,
  width = 'full',
  textColor,
  borderColor,
  icon,
}) => {
  const { colors } = useAppTheme();
  const scaleValue = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleValue, { speed: 30, toValue: 0.98, useNativeDriver: true }),
      Animated.timing(overlayOpacity, {
        duration: 20,
        toValue: 0.25,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }),
      Animated.timing(overlayOpacity, {
        duration: 20,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const styles = useMemo(() => typeStyle[type], [type]);

  const _bgColor = useMemo(() => {
    switch (true) {
      case type === 'filled' && disabled:
        return colors.grey_100;
      case !!backgroundColor:
        return colors[backgroundColor];
      case type === 'filled':
        return colors.primary;
      default:
        return colors.background;
    }
  }, [backgroundColor, colors, disabled, type]);

  const _textColor = useMemo(() => {
    switch (true) {
      case type === 'filled' && disabled:
        return colors.grey_600;
      case disabled:
        return colors.grey_400;
      case !!textColor:
        return colors[textColor];
      case type === 'filled':
        return colors.white;
      default:
        return colors.text;
    }
  }, [colors, disabled, textColor, type]);

  const _borderColor = useMemo(() => {
    switch (true) {
      case type === 'outline' && disabled:
        return colors.grey_100;
      case type === 'outline' && !borderColor:
        return colors.border;
      case !!borderColor:
        return colors[borderColor];
      default:
        return colors.border;
    }
  }, [borderColor, colors, disabled, type]);

  const buttonStyles = useMemo(
    () => [
      styles.button,
      buttonStyle,
      { backgroundColor: _bgColor },
      { borderColor: _borderColor },
      disabled ? buttonDisabledStyle : undefined,
    ],
    [
      _bgColor,
      _borderColor,
      buttonDisabledStyle,
      buttonStyle,
      disabled,
      styles.button,
    ],
  );
  const buttonWidth = useMemo(() => {
    switch (width) {
      case 'full':
        return '100%'
      case 'auto':
        return 'auto'
      default:
        return '100%'
    }
  }, [width])

  const buttonContent = useMemo(() => (
    loading ? <ActivityIndicator color={colors.text} /> :
      <Box alignItems="center" row gap={6}>
        <Text
          style={[{
            color: _textColor,
            fontSize: 16,
            fontWeight: '600'
          }, textStyle]}
          children={children}
        />
        {icon}
      </Box>
  ), [_textColor, children, colors.text, icon, loading, textStyle,])

  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      <Animated.View style={{ transform: [{ scale: scaleValue }], width: buttonWidth }}>
        {type === 'filled' ? (
          <Pressable
            style={buttonStyles}
            disabled={disabled || loading}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}>
            {buttonContent}
            <Animated.View
              style={{
                backgroundColor: colors.black,
                bottom: 0,
                left: 0,
                right: 0,
                top: 0,
                opacity: overlayOpacity,
                position: 'absolute',
              }}
            />
          </Pressable>
        ) : (
          <TouchableHighlight
            activeOpacity={1}
            underlayColor={colors.grey_50}
            style={buttonStyles}
            disabled={disabled || loading}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}>
            {buttonContent}
          </TouchableHighlight>
        )}
      </Animated.View>
    </View>
  );
};
