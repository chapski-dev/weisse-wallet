import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import { Box } from '@/components/ui/builders/Box';
import { Text } from '@/components/ui/builders/Text';
import { AccountCard, AccountListItem } from '@/components/wallet/account-card';
import { WalletSwitcherModal } from '@/components/wallet/wallet-switcher-modal';
import { useWallet } from '@/providers/wallet-provider';
import { useAppTheme } from '@/theme/theme';

// ─── Onboarding ───────────────────────────────────────────────────────────────

function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();

  return (
    <Box flex alignItems="center" justifyContent="center" px={32} backgroundColor={colors.background}>
      <Box
        w={200} h={200} borderRadius={100}
        backgroundColor={colors.primary_700_15}
        style={{ position: 'absolute', top: '20%', left: '10%' }}
      />
      <Box
        w={300} h={300} borderRadius={150}
        backgroundColor="#8B5CF615"
        style={{ position: 'absolute', top: '35%', left: '20%' }}
      />

      <Box
        w={100} h={100} borderRadius={50}
        alignItems="center" justifyContent="center"
        mb={24} backgroundColor={colors.primary}
        style={{ shadowColor: '#3B82F6', shadowOpacity: 0.25, shadowRadius: 32, elevation: 10 }}
      >
        <Text style={styles.logoText}>W</Text>
      </Box>

      <Text variant="h1" center style={{ marginBottom: 12 }}>Weiss Wallet</Text>
      <Text variant="p2" center colorName="label" style={{ lineHeight: 24, textAlign: 'center', marginBottom: 32 }}>
        {'Мультисетевой криптокошелек\nс одной seed фразой для всех сетей'}
      </Text>

      <Box row gap={12} mb={48}>
        {[
          { icon: '⟠', label: 'EVM сети' },
          { icon: '◎', label: 'Solana' },
          { icon: '₿', label: 'Bitcoin' },
        ].map((f) => (
          <Box key={f.label} flex alignItems="center" py={12} px={8} borderRadius={12} gap={6} backgroundColor={colors.grey_200}>
            <Text style={styles.featIcon}>{f.icon}</Text>
            <Text variant="p4" colorName="label">{f.label}</Text>
          </Box>
        ))}
      </Box>

      <TouchableOpacity
        style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/create-wallet')}
      >
        <Text variant="p1-semibold" color="#fff">Создать новый кошелек</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btnSecondary, { backgroundColor: colors.grey_100, borderColor: colors.border }]}
        onPress={() => router.push('/import-wallet')}
      >
        <Text variant="p1-semibold" colorName="label">У меня есть seed фраза</Text>
      </TouchableOpacity>
    </Box>
  );
}

// ─── Main Wallet ───────────────────────────────────────────────────────────────

export default function WalletScreen() {
  const router = useRouter();
  const { colors, insets } = useAppTheme();
  const {
    isLoading,
    isInitialized,
    wallet,
    networkMode,
    getCurrentAccount,
    getAccountsForCurrentMode,
    refreshBalances,
  } = useWallet();

  const [switcherVisible, setSwitcherVisible] = useState(false);

  if (!isInitialized) return <OnboardingScreen />;

  const isTestnet = networkMode === 'testnet';
  const currentAccount = getCurrentAccount();
  const accounts = getAccountsForCurrentMode();

  return (
    <>
    <WalletSwitcherModal visible={switcherVisible} onClose={() => setSwitcherVisible(false)} />
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refreshBalances}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <Box row justifyContent="space-between" alignItems="flex-start" px={20} pb={8} pt={insets.top + 8}>
        <Box gap={6}>
          <TouchableOpacity
            style={[styles.walletNameBadge, { backgroundColor: '#1A2F4A', borderColor: '#3B82F650' }]}
            onPress={() => setSwitcherVisible(true)}
          >
            <Text variant="h5" color="#fff">{wallet?.name ?? 'Мой кошелек'}</Text>
            <Ionicons name="chevron-expand" size={16} color="#6B7280" />
          </TouchableOpacity>
          {isTestnet && (
            <Box px={8} py={3} borderRadius={6} alignSelf="flex-start" backgroundColor={colors.warning_500}>
              <Text variant="p4-semibold" color="#fff">Testnet</Text>
            </Box>
          )}
        </Box>
        <Box row gap={8}>
          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: colors.grey_200 }]}
            onPress={() => router.push('/wc-connect')}
          >
            <Ionicons name="link" size={20} color={colors.label} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: colors.grey_200 }]}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings" size={20} color={colors.label} />
          </TouchableOpacity>
        </Box>
      </Box>

      {/* Account card */}
      {currentAccount && (
        <AccountCard
          accounts={accounts}
          selectedAccount={currentAccount}
          onSend={() => router.push('/send')}
          onReceive={() => router.push('/receive')}
        />
      )}

      {/* Section header */}
      <Box row justifyContent="space-between" alignItems="center" px={20} py={12} mt={8}>
        <Text variant="p2-semibold" color="#fff">{isTestnet ? 'Testnet сети' : 'Все сети'}</Text>
        <Text variant="p3" colorName="label">{accounts.length} сетей</Text>
      </Box>

      {/* Network list */}
      {accounts.map((account) => (
        <AccountListItem
          key={account.network}
          account={account}
          onPress={() => router.push({ pathname: '/token-detail', params: { network: account.network } })}
        />
      ))}
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  logoText: { fontSize: 42, fontWeight: '700', color: '#fff' },
  featIcon: { fontSize: 18, color: '#F9FAFB' },
  btnPrimary: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  btnSecondary: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  walletNameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
