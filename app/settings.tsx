import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { NetworkModeToggle } from '@/components/settings/widgets/network-mode-toggle';
import { RemoveWalletWidget } from '@/components/settings/widgets/remove-wallet-widget';
import { SeedPhraseWidget } from '@/components/settings/widgets/seed-phrase-widget';
import { Box } from '@/components/ui/builders/Box';
import { Text } from '@/components/ui/builders/Text';
import { ScreenHeader } from '@/components/ui/layouts/ScreenHeader';
import { useWallet } from '@/providers/wallet-provider';
import { useAppTheme } from '@/theme/theme';

export default function SettingsScreen() {
  const { colors, insets } = useAppTheme();
  const { wallet } = useWallet();

  return (
    <>
      <ScreenHeader title="Настройки" />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
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
          <SeedPhraseWidget />

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

          <RemoveWalletWidget />

        </Box>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { marginBottom: 8, marginTop: 8, letterSpacing: 0.5 },
});