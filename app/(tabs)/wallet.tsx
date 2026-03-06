import { AccountCard, AccountListItem } from '@/components/wallet/account-card';
import { NetworkSelector } from '@/components/wallet/network-selector';
import { useWallet } from '@/providers/wallet-provider';
import { Button } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function WalletScreen() {
  const router = useRouter();
  const {
    isLoading,
    isInitialized,
    wallet,
    selectedNetwork,
    networkMode,
    setSelectedNetwork,
    getCurrentAccount,
    getAccountsForCurrentMode,
    refreshBalances,
  } = useWallet();
  const isTestnet = networkMode === 'testnet';

  const currentAccount = getCurrentAccount();

  // Если кошелек не создан - показываем онбординг
  if (!isInitialized) {
    return (
      <View style={styles.onboardingContainer}>
        <Text style={styles.onboardingTitle}>🔐</Text>
        <Text style={styles.onboardingHeading}>Weiss Wallet</Text>
        <Text style={styles.onboardingText}>
          Мультисетевой криптокошелек с одной seed фразой для всех сетей
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/create-wallet')}
        >
          <Text style={styles.primaryButtonText}>Создать новый кошелек</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/import-wallet')}
        >
          <Text style={styles.secondaryButtonText}>У меня есть seed фраза</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refreshBalances} tintColor={"green"} />
      }
    >
      <Button children="Refresh" onPressOut={refreshBalances} />
      <View style={styles.header}>
        <View>
          <Text style={styles.walletName}>{wallet?.name}</Text>
          {isTestnet && (
            <View style={styles.testnetBadge}>
              <Text style={styles.testnetBadgeText}>🧪 Testnet</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Селектор сети */}
      <NetworkSelector
        selectedNetwork={selectedNetwork}
        onSelectNetwork={setSelectedNetwork}
      />

      {/* Карточка текущего аккаунта */}
      {currentAccount && (
        <AccountCard
          account={currentAccount}
          onSend={() => router.push('/send')}
          onReceive={() => router.push('/receive')}
        />
      )}

      {/* Список аккаунтов текущего режима */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {isTestnet ? '🧪 Testnet сети' : 'Все сети'}
        </Text>
        {getAccountsForCurrentMode().map((account) => (
          <AccountListItem
            key={account.network}
            account={account}
            onPress={() => setSelectedNetwork(account.network)}
          />
        ))}
      </View>
    </ScrollView>
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
  walletName: {
    fontSize: 24,
    fontWeight: '700',
  },
  testnetBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  testnetBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  settingsIcon: {
    fontSize: 24,
  },
  section: {
    marginTop: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
    marginBottom: 12,
    color: '#333',
  },
  // Onboarding styles
  onboardingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  onboardingTitle: {
    fontSize: 80,
    marginBottom: 20,
  },
  onboardingHeading: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1A1A2E',
  },
  onboardingText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
