import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Share, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui/builders/Text';
import { NETWORKS } from '@/constants/networks';
import { useWallet } from '@/providers/wallet-provider';
import { useAppTheme } from '@/theme/theme';

export default function ReceiveScreen() {
  const router = useRouter();
  const { colors, insets } = useAppTheme();
  const { selectedNetwork, getCurrentAccount } = useWallet();

  const account = getCurrentAccount();
  const network = NETWORKS[selectedNetwork];

  if (!account) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text variant="p3" colorName="label">Аккаунт не найден</Text>
      </View>
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
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text variant="p2" color={colors.primary}>Назад</Text>
        </TouchableOpacity>
        <Text variant="h5" color="#fff">Получить {network.symbol}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Network badge */}
      <View style={styles.centerRow}>
        <View style={styles.networkBadge}>
          <Text fontSize={16} color="#4B8EF5">{network.icon}</Text>
          <Text variant="p3-semibold" color="#fff">{network.name}</Text>
        </View>
      </View>

      {/* QR container */}
      <View style={styles.qrWrap}>
        <View style={styles.qrBox}>
          <Ionicons name="qr-code" size={140} color="#161B22" />
          <Text variant="p4" color="#6B7280" mt={8}>QR код</Text>
        </View>
      </View>

      {/* Address */}
      <View style={styles.content}>
        <Text variant="p4-semibold" color="#6B7280" mb={8}>Ваш адрес:</Text>
        <TouchableOpacity style={styles.addressBox} onPress={copyAddress} activeOpacity={0.7}>
          <Text variant="p4" color="#9CA3AF" style={styles.addressText} numberOfLines={1}>
            {account.address}
          </Text>
          <Ionicons name="copy-outline" size={18} color={colors.primary} />
        </TouchableOpacity>

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={copyAddress}>
            <Ionicons name="copy-outline" size={18} color="#fff" />
            <Text variant="p3-semibold" color="#fff">Копировать</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#161B22', borderWidth: 1, borderColor: '#30363D' }]}
            onPress={shareAddress}
          >
            <Ionicons name="share-outline" size={18} color="#9CA3AF" />
            <Text variant="p3-semibold" color="#9CA3AF">Поделиться</Text>
          </TouchableOpacity>
        </View>

        {/* Warning */}
        <View style={styles.warningBox}>
          <Ionicons name="warning" size={16} color="#F59E0B" />
          <Text variant="p4" color="#D97706" style={{ flex: 1, lineHeight: 18 }}>
            Отправляйте только {network.symbol} в сети {network.name}. Отправка других токенов может привести к потере средств.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 60 },
  centerRow: { flexDirection: 'row', justifyContent: 'center' },
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
  qrWrap: { alignItems: 'center', marginBottom: 24 },
  qrBox: {
    width: 200,
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  content: { paddingHorizontal: 20 },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    backgroundColor: '#161B22',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#30363D',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  addressText: { flex: 1 },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#1C1405',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#78350F',
    padding: 12,
  },
});
