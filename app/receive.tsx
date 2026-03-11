import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Alert, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Box } from '@/components/ui/builders/Box';
import { Text } from '@/components/ui/builders/Text';
import { ScreenHeader } from '@/components/ui/layouts/ScreenHeader';
import { Button } from '@/components/ui/shared/Button';
import { NETWORKS } from '@/constants/networks';
import { useWallet } from '@/providers/wallet-provider';
import { useAppTheme } from '@/theme/theme';

export default function ReceiveScreen() {
  const { colors } = useAppTheme();
  const { selectedNetwork, getCurrentAccount } = useWallet();

  const account = getCurrentAccount();
  const network = NETWORKS[selectedNetwork];

  if (!account) {
    return (
      <Box flex alignItems="center" justifyContent="center" backgroundColor={colors.background}>
        <Text variant="p3" colorName="label">Аккаунт не найден</Text>
      </Box>
    );
  }

  const copyAddress = async () => {
    await Clipboard.setStringAsync(account.address);
    Alert.alert('Скопировано', 'Адрес скопирован в буфер обмена');
  };

  const shareAddress = async () => {
    try {
      await Share.share({ message: `Мой ${network.name} адрес: ${account.address}` });
    } catch {}
  };

  return (
    <Box backgroundColor={colors.background}>
      <ScreenHeader title={`Получить ${network.symbol}`} />
      {/* QR container */}
      <Box alignItems="center" my={24}>
        <Box
          w={240} h={240} borderRadius={20}
          alignItems="center" justifyContent="center"
          backgroundColor="#fff"
          p={20}
          style={{ shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 10 }}
        >
          <QRCode
            value={account.address}
            size={200}
            backgroundColor="#ffffff"
            color="#161B22"
          />
        </Box>
      </Box>

      {/* Address + actions */}
      <Box px={20}>
        <Text variant="p4-semibold" color="#6B7280" mb={8}>Ваш адрес:</Text>

        <Box
          row alignItems="center" justifyContent="space-between"
          h={60} px={16} gap={12} mb={16}
          backgroundColor="#161B22" borderRadius={14}
          borderWidth={1} borderColor="#30363D"
          onPress={copyAddress}
        >
          <Text variant="p4" color="#9CA3AF" flex={1} children={account.address} />
          <Ionicons name="copy-outline" size={18} color={colors.primary} />
        </Box>

        {/* Action buttons */}
        <Box row gap={12} mb={20}>
          <Button
            onPress={copyAddress}
            icon={<Ionicons name="copy-outline" size={18} color="#fff" />}
            wrapperStyle={{ flex: 1 }}
            buttonStyle={{ height: 52, borderRadius: 14 }}
          >
            Копировать
          </Button>
          <Button
            type="outline"
            backgroundColor="grey_200"
            textColor="label"
            onPress={shareAddress}
            icon={<Ionicons name="share-outline" size={18} color="#9CA3AF" />}
            wrapperStyle={{ flex: 1 }}
            buttonStyle={{ height: 52, borderRadius: 14 }}
          >
            Поделиться
          </Button>
        </Box>

        {/* Warning */}
        <Box
          row alignItems="flex-start" gap={8}
          backgroundColor="#1C1405" borderRadius={12}
          borderWidth={1} borderColor="#78350F"
          p={12}
        >
          <Ionicons name="warning" size={16} color="#F59E0B" />
          <Text variant="p4" color="#D97706" flex={1}>
            Отправляйте только {network.symbol} в сети {network.name}. Отправка других токенов может привести к потере средств.
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
