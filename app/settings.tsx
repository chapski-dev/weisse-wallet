import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui/builders/Text';
import { NetworkModeToggle } from '@/components/ui/network-mode-toggle';
import { SeedPhraseDisplay } from '@/components/wallet/seed-phrase-display';
import { useWallet } from '@/providers/wallet-provider';
import { useAppTheme } from '@/theme/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, insets } = useAppTheme();
  const { wallet, deleteWallet, revealMnemonic } = useWallet();
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [mnemonic, setMnemonic] = useState<string | null>(null);

  const handleRevealSeedPhrase = async () => {
    const showSeed = async () => {
      const phrase = await revealMnemonic();
      if (phrase) { setMnemonic(phrase); setShowSeedPhrase(true); }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Вы собираетесь показать seed фразу. Убедитесь, что никто не видит ваш экран.')) await showSeed();
    } else {
      Alert.alert('Внимание!', 'Вы собираетесь показать seed фразу. Убедитесь, что никто не видит ваш экран.', [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Показать', onPress: showSeed },
      ]);
    }
  };

  const performDelete = async () => {
    await deleteWallet();
    router.replace('/(tabs)/wallet');
  };

  const handleDeleteWallet = () => {
    const warn2 = () => {
      if (Platform.OS === 'web') {
        if (window.confirm('Последнее предупреждение\n\nВы точно хотите удалить кошелек?')) performDelete();
      } else {
        Alert.alert('Последнее предупреждение', 'Вы точно хотите удалить кошелек? Без seed фразы восстановление невозможно!', [
          { text: 'Нет, оставить', style: 'cancel' },
          { text: 'Да, удалить', style: 'destructive', onPress: performDelete },
        ]);
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('⚠️ Удалить кошелек?\n\nЭто действие необратимо!')) warn2();
    } else {
      Alert.alert('⚠️ Удалить кошелек?', 'Это действие необратимо! Убедитесь, что у вас есть резервная копия seed фразы.', [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить', style: 'destructive', onPress: warn2 },
      ]);
    }
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text variant="p2" color={colors.primary}>Назад</Text>
        </TouchableOpacity>
        <Text variant="h5" color="#fff">Настройки</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        {/* Wallet info */}
        <Text variant="p4-semibold" color="#6B7280" style={styles.sectionLabel}>КОШЕЛЁК</Text>
        <View style={[styles.card, { borderColor: colors.border }]}>
          <View style={styles.row}>
            <Text variant="p3" color="#9CA3AF">Название</Text>
            <Text variant="p3-semibold" color="#fff">{wallet?.name ?? '—'}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text variant="p3" color="#9CA3AF">Создан</Text>
            <Text variant="p3-semibold" color="#fff">
              {wallet?.createdAt ? new Date(wallet.createdAt).toLocaleDateString('ru-RU') : '—'}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text variant="p3" color="#9CA3AF">Сетей</Text>
            <Text variant="p3-semibold" color="#fff">{wallet?.accounts.length ?? 0}</Text>
          </View>
        </View>

        {/* Network mode */}
        <Text variant="p4-semibold" color="#6B7280" style={styles.sectionLabel}>СЕТЬ</Text>
        <NetworkModeToggle />

        {/* Security */}
        <Text variant="p4-semibold" color="#6B7280" style={styles.sectionLabel}>БЕЗОПАСНОСТЬ</Text>
        <View style={[styles.card, { borderColor: colors.border }]}>
          {!showSeedPhrase ? (
            <TouchableOpacity style={styles.row} onPress={handleRevealSeedPhrase}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary_700_15 }]}>
                <Ionicons name="key-outline" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="p3-semibold" color="#fff">Показать seed фразу</Text>
                <Text variant="p4" color="#6B7280" mt={2}>Получить доступ к резервной фразе</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#6B7280" />
            </TouchableOpacity>
          ) : (
            <View>
              <SeedPhraseDisplay mnemonic={mnemonic ?? ''} />
              <TouchableOpacity
                style={[styles.hideSeedBtn, { borderTopColor: colors.border }]}
                onPress={() => { setShowSeedPhrase(false); setMnemonic(null); }}
              >
                <Ionicons name="eye-off-outline" size={16} color="#6B7280" />
                <Text variant="p4-semibold" color="#6B7280">Скрыть seed фразу</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* About */}
        <Text variant="p4-semibold" color="#6B7280" style={styles.sectionLabel}>О ПРИЛОЖЕНИИ</Text>
        <View style={[styles.card, { borderColor: colors.border }]}>
          <View style={styles.row}>
            <Text variant="p3" color="#9CA3AF">Версия</Text>
            <Text variant="p3-semibold" color="#fff">1.0.0</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text variant="p3" color="#9CA3AF">Приложение</Text>
            <Text variant="p3-semibold" color="#fff">Weiss Wallet</Text>
          </View>
        </View>

        {/* Danger zone */}
        <Text variant="p4-semibold" color="#EF4444" style={styles.sectionLabel}>ОПАСНАЯ ЗОНА</Text>
        <TouchableOpacity
          style={[styles.card, styles.dangerCard, { borderColor: '#7F1D1D' }]}
          onPress={handleDeleteWallet}
        >
          <View style={[styles.iconBox, { backgroundColor: '#450A0A' }]}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="p3-semibold" color="#EF4444">Удалить кошелек</Text>
            <Text variant="p4" color="#7F1D1D" mt={2}>Необратимое действие</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#7F1D1D" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 60 },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  sectionLabel: { marginBottom: 8, marginTop: 8, letterSpacing: 0.5 },
  card: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hideSeedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dangerCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
});
