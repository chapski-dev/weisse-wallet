import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput } from 'react-native';

import { Box } from '@/components/ui/builders/Box';
import { Text } from '@/components/ui/builders/Text';
import { ScreenHeader } from '@/components/ui/layouts/ScreenHeader';
import { Button } from '@/components/ui/shared/Button';
import { Input } from '@/components/ui/shared/Input';
import { NETWORKS } from '@/constants/networks';
import { useWallet } from '@/providers/wallet-provider';
import { walletService } from '@/services/wallet-service';
import { useAppTheme } from '@/theme/theme';

export default function SendScreen() {
  const router = useRouter();
  const { colors, insets } = useAppTheme();
  const { selectedNetwork, setSelectedNetwork, getCurrentAccount, refreshBalances } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);

  const account = getCurrentAccount();
  const network = NETWORKS[selectedNetwork];

  if (!account) {
    return (
      <Box flex alignItems="center" justifyContent="center" backgroundColor={colors.background}>
        <Text variant="p3" colorName="label">Аккаунт не найден</Text>
      </Box>
    );
  }

  const isEVMNetwork = network.isEVM;
  const balance = parseFloat(account.balance);
  const canSend = !!recipient && !!amount;

  const validateAddress = (address: string) => {
    if (isEVMNetwork) return /^0x[a-fA-F0-9]{40}$/.test(address);
    return address.length > 20;
  };

  const handleSend = () => {
    if (!validateAddress(recipient)) {
      Alert.alert('Ошибка', 'Неверный адрес получателя');
      return;
    }
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Ошибка', 'Введите корректную сумму');
      return;
    }
    if (amountNum > balance) {
      Alert.alert('Ошибка', 'Недостаточно средств');
      return;
    }
    Alert.alert(
      'Подтверждение',
      `Отправить ${amount} ${network.symbol} на адрес ${recipient.slice(0, 8)}...${recipient.slice(-6)}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Отправить', onPress: executeSend },
      ]
    );
  };

  const executeSend = async () => {
    if (!isEVMNetwork) {
      Alert.alert('Ошибка', 'Отправка пока поддерживается только для EVM сетей');
      return;
    }
    setIsSending(true);
    try {
      const txHash = await walletService.sendEVMTransaction(selectedNetwork, recipient, amount);
      Alert.alert('Успешно!', `Транзакция отправлена\nHash: ${txHash.slice(0, 16)}...`, [
        { text: 'OK', onPress: () => { refreshBalances(); router.back(); } },
      ]);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось отправить');
    } finally {
      setIsSending(false);
    }
  };

  if (isSending) {
    return (
      <Box flex alignItems="center" justifyContent="center" backgroundColor={colors.background}>
        <Box
          w={80} h={80} borderRadius={40}
          alignItems="center" justifyContent="center"
          backgroundColor={colors.primary_700_15}
        >
          <Ionicons name="arrow-up" size={32} color={colors.primary} />
        </Box>
        <Text variant="h4" center color="#fff" mt={20}>Отправка...</Text>
        <Text variant="p3" colorName="label" center mt={8}>Транзакция обрабатывается</Text>
      </Box>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <ScreenHeader title={`Отправить ${network.symbol}`} />

        {/* Available balance */}
        <Box row justifyContent="center" alignItems="center" my={24}>
          <Text variant="p3" color="#6B7280">Доступно: </Text>
          <Text variant="p3-semibold" color="#fff">{balance.toFixed(6)} {network.symbol}</Text>
        </Box>

        <Box px={20}>
          {/* Recipient */}
          <Box mb={20}>
            <Text variant="p4-semibold" color="#9CA3AF" mb={8}>Адрес получателя</Text>
            <Input
              value={recipient}
              onChangeText={setRecipient}
              placeholder={isEVMNetwork ? '0x...' : 'Введите адрес'}
              autoCapitalize="none"
              autoCorrect={false}
              icon={<Ionicons name="qr-code-outline" size={20} color="#6B7280" />}
            />
          </Box>

          {/* Amount */}
          <Box mb={20}>
            <Box row justifyContent="space-between" alignItems="center" mb={8}>
              <Text variant="p4-semibold" color="#9CA3AF">Сумма</Text>
              <Box
                px={10} py={4} borderRadius={6} backgroundColor="#1E3A5F"
                onPress={() => setAmount(String(isEVMNetwork ? Math.max(0, balance - 0.001) : balance))}
              >
                <Text fontSize={12} fontWeight="700" color={colors.primary}>MAX</Text>
              </Box>
            </Box>
            <Box
              row alignItems="center" h={64}
              backgroundColor="#161B22" borderRadius={14}
              borderWidth={1} borderColor="#30363D" overflow="hidden"
            >
              <TextInput
                style={styles.amtInput}
                value={amount}
                onChangeText={(t) => setAmount(t.replace(',', '.'))}
                placeholder="0.0"
                placeholderTextColor="#4B5563"
                keyboardType="decimal-pad"
              />
              <Box w={64} h="full" justifyContent="center" alignItems="center">
                <Text variant="p3-semibold" color="#6B7280">{network.symbol}</Text>
              </Box>
            </Box>
          </Box>

          {/* Fee */}
          {isEVMNetwork && (
            <Box
              row justifyContent="space-between" alignItems="center"
              backgroundColor="#0D1117" borderRadius={12}
              px={16} h={48} mb={24}
            >
              <Text variant="p3" color="#6B7280">Комиссия сети:</Text>
              <Text variant="p3-semibold" color="#9CA3AF">~ 0.0001 {network.symbol}</Text>
            </Box>
          )}

          {/* Send button */}
          <Button
            onPress={handleSend}
            disabled={!canSend}
            icon={<Ionicons name="send" size={20} color={canSend ? '#fff' : undefined} />}
            buttonStyle={{ height: 56, borderRadius: 16 }}
          >
            Отправить
          </Button>

          {/* Non-EVM warning */}
          {!isEVMNetwork && (
            <Box
              row alignItems="center" gap={8}
              backgroundColor="#1C1405" borderRadius={12}
              borderWidth={1} borderColor="#78350F"
              p={12} mt={16}
            >
              <Ionicons name="warning" size={16} color="#F59E0B" />
              <Text variant="p4" color="#D97706" flex={1}>
                Отправка для {network.name} находится в разработке
              </Text>
            </Box>
          )}
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  amtInput: { flex: 1, paddingHorizontal: 16, color: '#fff', fontSize: 28, fontWeight: '600' },
});
