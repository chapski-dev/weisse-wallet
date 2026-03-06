import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import { useAppTheme } from '@/theme/theme';

import { Box } from '../builders/Box';
import { Text } from '../builders/Text';

interface CheckboxProps {
  checked?: boolean;
  children?: React.ReactNode;
  onPress?: () => void;
  wrapperStyle?: StyleProp<ViewStyle>;
}

const Checkbox = ({ checked, children, onPress, wrapperStyle }: CheckboxProps) => {
  const { colors } = useAppTheme();

  const _handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress && onPress();
  };

  return (
    <Box onPress={_handlePress} row gap={12} style={[{ width: '100%' }, wrapperStyle]}>
      {checked ? (
        <Ionicons name="checkbox" size={24} color={colors.primary} />
      ) : (
        <Ionicons name="square-outline" size={24} color={colors.grey_400} />
      )}
      <Text style={{ flexShrink: 1 }}>{children}</Text>
    </Box>
  );
};

export default Checkbox;
