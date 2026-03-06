import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Alert } from 'react-native';

import { Box } from '@/components/ui/builders/Box';
import { Text } from '@/components/ui/builders/Text';
import { Button } from '@/components/ui/shared/Button';
import { NETWORKS } from '@/constants/networks';
import { useAppTheme } from '@/theme/theme';
import { WalletAccount } from '@/types/wallet';

// ─── Account Card ─────────────────────────────────────────────────────────────

interface AccountCardProps {
  account: WalletAccount;
  onSend?: () => void;
  onReceive?: () => void;
}

export function AccountCard({ account, onSend, onReceive }: AccountCardProps) {
  const { colors } = useAppTheme();
  const network = NETWORKS[account.network];

  const copyAddress = async () => {
    await Clipboard.setStringAsync(account.address);
    Alert.alert('Скопировано', 'Адрес скопирован в буфер обмена');
  };

  const truncateAddress = (address: string) =>
    address.length <= 16 ? address : `${address.slice(0, 8)}...${address.slice(-6)}`;

  return (
    <>
      <Box
        mx={20}
        mb={16}
        p={24}
        gap={8}
        borderRadius={24}
        backgroundColor="#1E3A5F"
        style={{ shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 32, elevation: 10 }}
      >
        {/* Card top row */}
        <Box row justifyContent="space-between" alignItems="center">
          <Box row alignItems="center" gap={8}>
            <Box w={8} h={8} borderRadius={4} backgroundColor={colors.primary} />
            <Text variant="p2" color="#9CA3AF">{network.name}</Text>
          </Box>
          <Text variant="h1" color="#4B8EF5">{network.icon}</Text>
        </Box>

        {/* Balance */}
        <Text variant="h1" color="#fff" mt={8}>
          {parseFloat(account.balance).toFixed(6)} {network.symbol}
        </Text>
        <Text variant="p4" color="#6B7280" mb={8}>≈ $—</Text>

        {/* Address */}
        <Box row alignItems="center" gap={8} pb={16} onPress={copyAddress}>
          <Text variant="p4" color="#6B7280">{truncateAddress(account.address)}</Text>
          <Ionicons name="copy-outline" size={14} color="#6B7280" />
        </Box>
      </Box>
      {/* Action buttons */}
      <Box row gap={12} mt={8} mx={20}>
        <Button
          onPress={onSend}
          icon={<Ionicons name="arrow-up" size={18} color="#fff" />}
          wrapperStyle={{ flex: 1 }}
          buttonStyle={{ height: 52, borderRadius: 14 }}
        >
          Отправить
        </Button>
        <Button
          type="outline"
          backgroundColor="grey_200"
          textColor="label"
          onPress={onReceive}
          icon={<Ionicons name="arrow-down" size={18} color="#9CA3AF" />}
          wrapperStyle={{ flex: 1 }}
          buttonStyle={{ height: 52, borderRadius: 14 }}
        >
          Получить
        </Button>
      </Box>
    </>
  );
}

// ─── Account List Item ────────────────────────────────────────────────────────

interface AccountListItemProps {
  account: WalletAccount;
  onPress: () => void;
}

export function AccountListItem({ account, onPress }: AccountListItemProps) {
  const { colors } = useAppTheme();
  const network = NETWORKS[account.network];

  return (
    <Box
      row
      alignItems="center"
      justifyContent="space-between"
      px={20}
      py={10}
      minHeight={60}
      onPress={onPress}
    >
      <Box row alignItems="center" gap={12}>
        <Box
          w={38}
          h={38}
          borderRadius={19}
          alignItems="center"
          justifyContent="center"
          backgroundColor={colors.grey_200}
        >
          <Text fontSize={20}>{network.icon}</Text>
        </Box>
        <Box gap={2}>
          <Text variant="p3-semibold" color="#fff">{network.name}</Text>
          <Text variant="p4" color="#6B7280">
            {network.symbol} · {network.isTestnet ? 'Testnet' : 'Mainnet'}
          </Text>
        </Box>
      </Box>
      <Text variant="p3-semibold" color="#fff">
        {parseFloat(account.balance).toFixed(4)} {network.symbol}
      </Text>
    </Box>
  );
}
