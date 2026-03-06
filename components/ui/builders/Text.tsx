import React, { FC, useMemo } from 'react';
import {
  StyleSheet,
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle
} from 'react-native';

import { useAppTheme } from '@/theme/theme';
import { removeUndefinedOnes } from '@/utils';

type TextType = keyof typeof styles;
type Spacing = number;

export type colorKeys = keyof ReturnType<typeof useAppTheme>['colors'];

type ThemeProps = {
  lightColorName?: colorKeys;
  darkColorName?: colorKeys;
  colorName?: colorKeys;
};

type TextProps = RNTextProps &
  ThemeProps & {
    variant?: TextType;
    color?: string;
    fontWeight?: TextStyle['fontWeight'];
    fontSize?: number;
    center?: boolean;
    left?: boolean;
    right?: boolean;
    uppercase?: boolean;
    lowercase?: boolean;
    capitalize?: boolean;
    m?: Spacing;
    mx?: Spacing;
    my?: Spacing;
    mt?: Spacing;
    mr?: Spacing;
    mb?: Spacing;
    ml?: Spacing;
    p?: Spacing;
    px?: Spacing;
    py?: Spacing;
    pt?: Spacing;
    pr?: Spacing;
    pb?: Spacing;
    pl?: Spacing;
    flex?: number
    flexShrink?: number
  };

const Text: FC<TextProps> = ({
  variant,
  style,
  color,
  colorName,
  fontWeight,
  fontSize,
  left,
  right,
  center,
  uppercase,
  lowercase,
  capitalize,
  m,
  mx,
  my,
  mt,
  mr,
  mb,
  ml,
  p,
  px,
  py,
  pt,
  pr,
  pb,
  pl,
  flex,
  disabled,
  ...rest
}) => {
  const theme = useAppTheme();
  const key = disabled ? 'grey_400' : colorName || 'text';

  const computedStyle = useMemo(() => {
    const textAlign = left ? 'left' : right ? 'right' : center ? 'center' : undefined;
    const textTransform = uppercase
      ? 'uppercase'
      : lowercase
        ? 'lowercase'
        : capitalize
          ? 'capitalize'
          : undefined;

    return [
      styles[variant ? variant : 'p1'],
      {
        color: theme.colors[key],
        ...removeUndefinedOnes({
          color,
          flex: flex,
          fontSize,
          fontWeight,
          margin: m,
          marginBottom: mb,
          marginHorizontal: mx,
          marginLeft: ml,
          marginRight: mr,
          marginTop: mt,
          marginVertical: my,
          padding: p,
          paddingBottom: pb,
          paddingHorizontal: px,
          paddingLeft: pl,
          paddingRight: pr,
          paddingTop: pt,
          paddingVertical: py,
          textAlign,
          textTransform,
        })
      },
      style
    ].flat();
  }, [
    capitalize,
    center,
    color,
    fontSize,
    fontWeight,
    key,
    left,
    lowercase,
    m,
    mb,
    ml,
    mr,
    mt,
    mx,
    my,
    p,
    pb,
    pl,
    pr,
    pt,
    px,
    flex,
    py,
    right,
    style,
    theme.colors,
    variant,
    uppercase
  ]);

  return <RNText {...rest} style={computedStyle} />;
};

const styles = StyleSheet.create({
  caption: { fontSize: 12, fontWeight: '400', letterSpacing: -0.12, lineHeight: 16 },
  'caption-medium': { fontSize: 12, fontWeight: '500', letterSpacing: -0.12, lineHeight: 16 },
  h1: { fontSize: 32, fontWeight: '700', letterSpacing: -0.32, lineHeight: 40 },
  h2: { fontSize: 28, fontWeight: '700', letterSpacing: -0.28, lineHeight: 34 },
  h3: { fontSize: 24, fontWeight: '700', letterSpacing: -0.24, lineHeight: 30 },
  h4: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2, lineHeight: 26 },
  h5: { fontSize: 17, fontWeight: '700', letterSpacing: -0.17, lineHeight: 22 },
  label: { fontSize: 10, fontWeight: '500', letterSpacing: -0.1, lineHeight: 12 },
  p1: { fontSize: 17, fontWeight: '400', letterSpacing: -0.17, lineHeight: 22 },
  'p1-semibold': { fontSize: 17, fontWeight: '600', letterSpacing: -0.17, lineHeight: 22 },
  p2: { fontSize: 16, fontWeight: '400', letterSpacing: -0.16, lineHeight: 21 },
  'p2-semibold': { fontSize: 16, fontWeight: '600', letterSpacing: -0.16, lineHeight: 21 },
  p3: { fontSize: 15, fontWeight: '400', letterSpacing: -0.15, lineHeight: 20 },
  'p3-semibold': { fontSize: 15, fontWeight: '600', letterSpacing: -0.15, lineHeight: 20 },
  p4: { fontSize: 13, fontWeight: '400', letterSpacing: -0.13, lineHeight: 16 },
  'p4-semibold': { fontSize: 13, fontWeight: '600', letterSpacing: -0.13, lineHeight: 16 }
});

export { Text };
