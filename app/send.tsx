import { NETWORKS } from '@/constants/networks';
import { useWallet } from '@/providers/wallet-provider';
import { walletService } from '@/services/wallet-service';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SendScreen() {
  const router = useRouter();
  const { selectedNetwork, getCurrentAccount, refreshBalances } = useWallet();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);

  const account = getCurrentAccount();
  const network = NETWORKS[selectedNetwork];

  if (!account) {
    return (
      <View style={styles.container}>
        <Text>Аккаунт не найден</Text>
      </View>
    );
  }

  const isEVMNetwork = network.isEVM;
  const balance = parseFloat(account.balance);

  const validateAddress = (address: string): boolean => {
    if (isEVMNetwork) {
      // Простая валидация EVM адреса
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
    return address.length > 20; // Упрощенная проверка
  };

  const handleSend = async () => {
    if (!recipient || !amount) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    if (!validateAddress(recipient)) {
      Alert.alert('Ошибка', 'Неверный адрес получателя');
      return;
    }

    const amountNum = Number(amount);
    if (isNaN(amountNum)) {
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
      const txHash = await walletService.sendEVMTransaction(
        selectedNetwork,
        recipient,
        amount
      );

      Alert.alert(
        'Успешно!',
        `Транзакция отправлена\n\nHash: ${txHash.slice(0, 16)}...`,
        [
          {
            text: 'OK',
            onPress: () => {
              refreshBalances();
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось отправить транзакцию');
    } finally {
      setIsSending(false);
    }
  };

  const setMaxAmount = () => {
    // Оставляем немного на газ для EVM сетей
    const maxAmount = isEVMNetwork ? Math.max(0, balance - 0.001) : balance;
    setAmount(maxAmount.toString());
  };

  if (isSending) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Отправка транзакции...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Назад</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Отправить {network.symbol}</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.networkBadge}>
            <Text style={styles.networkIcon}>{network?.icon}</Text>
            <Text style={styles.networkName}>{network.name}</Text>
          </View>

          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Доступно:</Text>
            <Text style={styles.balanceValue}>
              {balance.toFixed(6)} {network.symbol}
            </Text>
          </View>

          {/* Адрес получателя */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Адрес получателя</Text>
            <TextInput
              style={styles.input}
              value={recipient}
              onChangeText={setRecipient}
              placeholder={isEVMNetwork ? '0x...' : 'Введите адрес'}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Сумма */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Сумма</Text>
              <TouchableOpacity onPress={setMaxAmount}>
                <Text style={styles.maxButton}>MAX</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.amountInputContainer}>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(text) => setAmount(text.replace(",","."))}
                placeholder="0.0"
                keyboardType="decimal-pad"
              />
              <Text style={styles.amountSymbol}>{network.symbol}</Text>
            </View>
          </View>

          {/* Информация о комиссии */}
          {isEVMNetwork && (
            <View style={styles.feeInfo}>
              <Text style={styles.feeLabel}>Комиссия сети:</Text>
              <Text style={styles.feeValue}>~ 0.0001 {network.symbol}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!recipient || !amount) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!recipient || !amount}
          >
            <Text style={styles.sendButtonText}>Отправить</Text>
          </TouchableOpacity>

          {!isEVMNetwork && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Отправка для {network.name} находится в разработке
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 24,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 16,
  },
  networkIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  networkName: {
    fontSize: 16,
    fontWeight: '600',
  },
  balanceInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: 32,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  maxButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'monospace',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingRight: 16,
  },
  amountInput: {
    flex: 1,
    padding: 16,
    fontSize: 24,
    fontWeight: '600',
  },
  amountSymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  feeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  feeLabel: {
    fontSize: 14,
    color: '#666',
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 18,
    marginTop: 16,
    color: '#333',
  },
});
