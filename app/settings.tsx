import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet } from 'react-native';

import { Box } from '@/components/ui/builders/Box';
import { Text } from '@/components/ui/builders/Text';
import { ScreenHeader } from '@/components/ui/layouts/ScreenHeader';
import { SectionListItemWithArrow } from '@/components/ui/shared/SectionListItemWithArrow';
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
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
    >
      <ScreenHeader title="Настройки" />

      <Box px={20} pt={16}>
        {/* ─── Wallet info ─── */}
        <Text variant="p4-semibold" color="#6B7280" style={styles.sectionLabel}>КОШЕЛЁК</Text>
        <Box backgroundColor="#161B22" borderRadius={16} borderWidth={1} borderColor={colors.border} mb={20} overflow="hidden">
          <Box row justifyContent="space-between" alignItems="center" px={16} py={14}>
            <Text variant="p3" color="#9CA3AF">Название</Text>
            <Text variant="p3-semibold" color="#fff">{wallet?.name ?? '—'}</Text>
          </Box>
          <Box h={StyleSheet.hairlineWidth} mx={16} backgroundColor={colors.border} />
          <Box row justifyContent="space-between" alignItems="center" px={16} py={14}>
            <Text variant="p3" color="#9CA3AF">Создан</Text>
            <Text variant="p3-semibold" color="#fff">
              {wallet?.createdAt ? new Date(wallet.createdAt).toLocaleDateString('ru-RU') : '—'}
            </Text>
          </Box>
          <Box h={StyleSheet.hairlineWidth} mx={16} backgroundColor={colors.border} />
          <Box row justifyContent="space-between" alignItems="center" px={16} py={14}>
            <Text variant="p3" color="#9CA3AF">Сетей</Text>
            <Text variant="p3-semibold" color="#fff">{wallet?.accounts.length ?? 0}</Text>
          </Box>
        </Box>

        {/* ─── Network mode ─── */}
        <Text variant="p4-semibold" color="#6B7280" style={styles.sectionLabel}>СЕТЬ</Text>
        <NetworkModeToggle />

        {/* ─── Security ─── */}
        <Text variant="p4-semibold" color="#6B7280" style={styles.sectionLabel}>БЕЗОПАСНОСТЬ</Text>
        <Box backgroundColor="#161B22" borderRadius={16} borderWidth={1} borderColor={colors.border} mb={20} overflow="hidden">
          {!showSeedPhrase ? (
            <SectionListItemWithArrow
              onPress={handleRevealSeedPhrase}
              borderBottom={false}
              icon={
                <Box w={36} h={36} borderRadius={10} alignItems="center" justifyContent="center" backgroundColor={colors.primary_700_15}>
                  <Ionicons name="key-outline" size={18} color={colors.primary} />
                </Box>
              }
            >
              <Box gap={2}>
                <Text variant="p3-semibold" color="#fff">Показать seed фразу</Text>
                <Text variant="p4" color="#6B7280">Получить доступ к резервной фразе</Text>
              </Box>
            </SectionListItemWithArrow>
          ) : (
            <Box>
              <SeedPhraseDisplay mnemonic={mnemonic ?? ''} />
              <Box
                row alignItems="center" justifyContent="center" gap={6}
                py={12} borderTopWidth={StyleSheet.hairlineWidth} borderColor={colors.border}
                onPress={() => { setShowSeedPhrase(false); setMnemonic(null); }}
              >
                <Ionicons name="eye-off-outline" size={16} color="#6B7280" />
                <Text variant="p4-semibold" color="#6B7280">Скрыть seed фразу</Text>
              </Box>
            </Box>
          )}
        </Box>

        {/* ─── About ─── */}
        <Text variant="p4-semibold" color="#6B7280" style={styles.sectionLabel}>О ПРИЛОЖЕНИИ</Text>
        <Box backgroundColor="#161B22" borderRadius={16} borderWidth={1} borderColor={colors.border} mb={20} overflow="hidden">
          <Box row justifyContent="space-between" alignItems="center" px={16} py={14}>
            <Text variant="p3" color="#9CA3AF">Версия</Text>
            <Text variant="p3-semibold" color="#fff">1.0.0</Text>
          </Box>
          <Box h={StyleSheet.hairlineWidth} mx={16} backgroundColor={colors.border} />
          <Box row justifyContent="space-between" alignItems="center" px={16} py={14}>
            <Text variant="p3" color="#9CA3AF">Приложение</Text>
            <Text variant="p3-semibold" color="#fff">Weiss Wallet</Text>
          </Box>
        </Box>

        {/* ─── Danger zone ─── */}
        <Text variant="p4-semibold" color="#EF4444" style={styles.sectionLabel}>ОПАСНАЯ ЗОНА</Text>
        <Box backgroundColor="#161B22" borderRadius={16} borderWidth={1} borderColor="#7F1D1D" mb={20} overflow="hidden">
          <SectionListItemWithArrow
            onPress={handleDeleteWallet}
            borderBottom={false}
            icon={
              <Box w={36} h={36} borderRadius={10} alignItems="center" justifyContent="center" backgroundColor="#450A0A">
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </Box>
            }
          >
            <Box gap={2}>
              <Text variant="p3-semibold" color="#EF4444">Удалить кошелек</Text>
              <Text variant="p4" color="#7F1D1D">Необратимое действие</Text>
            </Box>
          </SectionListItemWithArrow>
        </Box>
      </Box>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { marginBottom: 8, marginTop: 8, letterSpacing: 0.5 },
});
