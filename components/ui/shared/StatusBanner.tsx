import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { useAppTheme } from '@/theme/theme';

import { Text } from '../builders/Text';

type Status = 'error' | 'warning' | 'success';

interface StatusBannerProps {
  status: Status;
  title: string;
  description: string;
}

export const StatusBanner = ({ status, title, description }: StatusBannerProps) => {
  const { colors } = useAppTheme();

  const statusConfig = {
    error: { bgColor: colors.error_500_15, iconColor: colors.error_500 },
    success: { bgColor: colors.green_500_15, iconColor: colors.green },
    warning: { bgColor: colors.grey_50, iconColor: colors.grey_500 },
  };

  const { bgColor, iconColor } = statusConfig[status];

  return (
    <View style={{
      backgroundColor: bgColor,
      borderRadius: 8,
      flexDirection: 'row',
      gap: 16,
      padding: 16,
    }}>
      <View style={{ gap: 4, flex: 1 }}>
        <Text fontWeight="600" fontSize={15}>{title}</Text>
        <Text fontSize={13}>{description}</Text>
      </View>
      <Ionicons name="warning-outline" size={24} color={iconColor} />
    </View>
  );
};
