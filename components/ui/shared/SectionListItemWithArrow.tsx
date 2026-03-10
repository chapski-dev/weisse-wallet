import { Ionicons } from '@expo/vector-icons';
import React, { PropsWithChildren } from 'react';
import { FlexAlignType } from 'react-native';

import { useAppTheme } from '@/theme/theme';

import { Box } from '../builders/Box';
import { Text } from '../builders/Text';

type SectionListItemWithArrowProps = PropsWithChildren & {
  title?: string;
  onPress?: () => void;
  disabled?: boolean;
  /** default true */
  borderBottom?: boolean;
  icon?: React.ReactNode;
  alignItems?: FlexAlignType;
  /** Дополнительная информация рядом с кареткой */
  rightText?: string;
};

export const SectionListItemWithArrow = ({
  title,
  onPress,
  disabled,
  children,
  icon,
  borderBottom = true,
  alignItems,
  rightText,
}: SectionListItemWithArrowProps) => {
  const { colors } = useAppTheme();

  return (
    <Box w="full">
      <Box
        w="full"
        minHeight={56}
        p={16}
        row
        alignItems={alignItems}
        justifyContent="space-between"
        onPress={onPress}
        disabled={disabled}>
        {icon && (
          <Box mr={12}>
            {icon}
          </Box>
        )}

        <Box
          flex={1}
          row
          alignItems="center"
          justifyContent="space-between"
          borderBottomWidth={borderBottom ? 1 : 0}
          borderColor={colors.grey_100}
          pb={borderBottom ? 16 : 0}
          mb={borderBottom ? -16 : 0}>
          <Box row alignItems={alignItems}>
            {children || (
              <Text
                color={disabled ? colors.grey_100 : undefined}
                variant="p2-semibold"
                children={title}
              />
            )}
          </Box>

          {onPress && (
            <Box row alignItems="center" gap={8}>
              {rightText && (
                <Text
                  color={disabled ? colors.grey_100 : colors.grey_400}
                  variant="p2"
                  children={rightText}
                />
              )}
              <Ionicons
                name="chevron-forward"
                size={20}
                color={disabled ? colors.grey_100 : colors.grey_400}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};
