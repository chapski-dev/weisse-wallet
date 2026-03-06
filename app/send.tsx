import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Text } from '@/components/ui/builders/Text';
import { NETWORKS } from '@/constants/networks';
import { useWallet } from '@/providers/wallet-provider';
import { walletService } from '@/services/wallet-service';
import { useAppTheme } from '@/theme/theme';

export default function SendScreen() {
  const router = useRouter();
  const { colors, insets } = useAppTheme();
  const { selectedNetwork, getCurrentAccount, refreshBalances } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);

  const account = getCurrentAccount();
  const network = NETWORKS[selectedNetwork];

  if (!account) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text variant="p3" colorName="label">Аккаунт не найден</Text>
      </View>
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
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <View style={[styles.loaderCircle, { backgroundColor: colors.primary_700_15 }]}>
          <Ionicons name="arrow-up" size={32} color={colors.primary} />
        </View>
        <Text variant="h4" center color="#fff" mt={20}>Отправка...</Text>
        <Text variant="p3" colorName="label" center mt={8}>Транзакция обрабатывается</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
            <Text variant="p2" color={colors.primary}>Назад</Text>
          </TouchableOpacity>
          <Text variant="h5" color="#fff">Отправить {network.symbol}</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Network badge */}
        <View style={styles.centerRow}>
          <View style={styles.networkBadge}>
            <Text fontSize={16} color="#4B8EF5">{network.icon}</Text>
            <Text variant="p3-semibold" color="#fff">{network.name}</Text>
          </View>
        </View>

        {/* Available balance */}
        <View style={[styles.centerRow, { marginBottom: 24 }]}>
          <Text variant="p3" color="#6B7280">Доступно: </Text>
          <Text variant="p3-semibold" color="#fff">{balance.toFixed(6)} {network.symbol}</Text>
        </View>

        <View style={styles.content}>
          {/* Recipient */}
          <View style={styles.inputGroup}>
            <Text variant="p4-semibold" color="#9CA3AF" mb={8}>Адрес получателя</Text>
            <View style={styles.inputField}>
              <TextInput
                style={styles.textInput}
                value={recipient}
                onChangeText={setRecipient}
                placeholder={isEVMNetwork ? '0x...' : 'Введите адрес'}
                placeholderTextColor="#4B5563"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Ionicons name="qr-code-outline" size={20} color="#6B7280" />
            </View>
          </View>

          {/* Amount */}
          <View style={styles.inputGroup}>
            <View style={styles.amtHeader}>
              <Text variant="p4-semibold" color="#9CA3AF">Сумма</Text>
              <TouchableOpacity
                style={styles.maxBtn}
                onPress={() => setAmount(String(isEVMNetwork ? Math.max(0, balance - 0.001) : balance))}
              >
                <Text fontSize={12} fontWeight="700" color={colors.primary}>MAX</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.amtField}>
              <TextInput
                style={styles.amtInput}
                value={amount}
                onChangeText={(t) => setAmount(t.replace(',', '.'))}
                placeholder="0.0"
                placeholderTextColor="#4B5563"
                keyboardType="decimal-pad"
              />
              <View style={styles.symBox}>
                <Text variant="p3-semibold" color="#6B7280">{network.symbol}</Text>
              </View>
            </View>
          </View>

          {/* Fee */}
          {isEVMNetwork && (
            <View style={styles.feeRow}>
              <Text variant="p3" color="#6B7280">Комиссия сети:</Text>
              <Text variant="p3-semibold" color="#9CA3AF">~ 0.0001 {network.symbol}</Text>
            </View>
          )}

          {/* Send button */}
          <TouchableOpacity
            style={[styles.sendBtn, canSend && styles.sendBtnActive]}
            onPress={handleSend}
            disabled={!canSend}
          >
            <Ionicons name="send" size={20} color={canSend ? '#fff' : '#6B7280'} />
            <Text variant="p1-semibold" color={canSend ? '#fff' : '#6B7280'}>Отправить</Text>
          </TouchableOpacity>

          {!isEVMNetwork && (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={16} color="#F59E0B" />
              <Text variant="p4" color="#D97706" style={{ flex: 1 }}>
                Отправка для {network.name} находится в разработке
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loaderCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 60 },
  centerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#161B22',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#30363D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginVertical: 12,
  },
  content: { paddingHorizontal: 20 },
  inputGroup: { marginBottom: 20 },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: '#161B22',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#30363D',
    paddingHorizontal: 16,
    gap: 12,
  },
  textInput: { flex: 1, color: '#fff', fontSize: 15 },
  amtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  maxBtn: { backgroundColor: '#1E3A5F', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  amtField: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    backgroundColor: '#161B22',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#30363D',
    overflow: 'hidden',
  },
  amtInput: { flex: 1, paddingHorizontal: 16, color: '#fff', fontSize: 28, fontWeight: '600' },
  symBox: { width: 64, height: '100%', justifyContent: 'center', alignItems: 'center' },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0D1117',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 24,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  sendBtnActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1C1405',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#78350F',
    padding: 12,
    marginTop: 16,
  },
});
