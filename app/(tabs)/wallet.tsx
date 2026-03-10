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

export default function WalletScreen() {
  const router = useRouter();
  const { colors, insets } = useAppTheme();
  const {
    isLoading,
    wallet,
    networkMode,
    getCurrentAccount,
    getAccountsForCurrentMode,
    refreshBalances,
  } = useWallet();

  const [switcherVisible, setSwitcherVisible] = useState(false);

  const isTestnet = networkMode === 'testnet';
  const currentAccount = getCurrentAccount();
  const accounts = getAccountsForCurrentMode();

  return (
    <>
      <WalletSwitcherModal visible={switcherVisible} onClose={() => setSwitcherVisible(false)} />
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
