import { NETWORKS } from '@/constants/networks';
import { useWallet } from '@/providers/wallet-provider';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ReceiveScreen() {
  const router = useRouter();
  const { selectedNetwork, getCurrentAccount } = useWallet();

  const account = getCurrentAccount();
  const network = NETWORKS[selectedNetwork];

  if (!account) {
    return (
      <View style={styles.container}>
        <Text>Аккаунт не найден</Text>
      </View>
    );
  }

  const copyAddress = async () => {
    await Clipboard.setStringAsync(account.address);
    Alert.alert('Скопировано', 'Адрес скопирован в буфер обмена');
  };

  const shareAddress = async () => {
    try {
      await Share.share({
        message: `Мой ${network.name} адрес: ${account.address}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Получить {network.symbol}</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.networkBadge}>
          <Text style={styles.networkIcon}>{network?.icon}</Text>
          <Text style={styles.networkName}>{network.name}</Text>
        </View>

        {/* Здесь можно добавить QR код */}
        <View style={styles.qrPlaceholder}>
          <Text style={styles.qrText}>📱</Text>
          <Text style={styles.qrLabel}>QR код</Text>
        </View>

        <Text style={styles.addressLabel}>Ваш адрес:</Text>
        <View style={styles.addressBox}>
          <Text style={styles.address} selectable>
            {account.address}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={copyAddress}>
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionText}>Копировать</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={shareAddress}
          >
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionText}>Поделиться</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            ⚠️ Отправляйте на этот адрес только {network.symbol} в сети{' '}
            {network.name}. Отправка других токенов может привести к потере
            средств.
          </Text>
        </View>
      </View>
    </View>
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
    alignItems: 'center',
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  networkIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  networkName: {
    fontSize: 16,
    fontWeight: '600',
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  qrText: {
    fontSize: 60,
  },
  qrLabel: {
    marginTop: 8,
    color: '#666',
  },
  addressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  addressBox: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  address: {
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 24,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 8,
  },
  shareButton: {
    backgroundColor: '#34C759',
    marginRight: 0,
    marginLeft: 8,
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    width: '100%',
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});
