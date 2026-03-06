import { NETWORKS } from '@/constants/networks';
import { WalletAccount } from '@/types/wallet';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AccountCardProps {
  account: WalletAccount;
  onSend?: () => void;
  onReceive?: () => void;
}

export function AccountCard({ account, onSend, onReceive }: AccountCardProps) {
  const network = NETWORKS[account.network];

  const copyAddress = async () => {
    await Clipboard.setStringAsync(account.address);
    Alert.alert('Скопировано', 'Адрес скопирован в буфер обмена');
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.networkBadge}>
          <Text style={styles.networkIcon}>{network?.icon}</Text>
          <Text style={styles.networkName}>{network.name}</Text>
        </View>
      </View>

      <View style={styles.balanceContainer}>
        <Text style={styles.balance}>
          {parseFloat(account.balance).toFixed(6)}
        </Text>
        <Text style={styles.symbol}>{network.symbol}</Text>
      </View>

      <TouchableOpacity style={styles.addressContainer} onPress={copyAddress}>
        <Text style={styles.address}>{truncateAddress(account.address)}</Text>
        <Text style={styles.copyIcon}>📋</Text>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={onSend}>
          <Text style={styles.actionIcon}>↑</Text>
          <Text style={styles.actionText}>Отправить</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.receiveButton]} onPress={onReceive}>
          <Text style={styles.actionIcon}>↓</Text>
          <Text style={styles.actionText}>Получить</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface AccountListItemProps {
  account: WalletAccount;
  onPress: () => void;
}

export function AccountListItem({ account, onPress }: AccountListItemProps) {
  const network = NETWORKS[account.network];

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress}>
      <View style={styles.listItemLeft}>
        <Text style={styles.listIcon}>{network?.icon}</Text>
        <View>
          <Text style={styles.listName}>{network.name}</Text>
          <Text style={styles.listAddress}>{truncateAddress(account.address)}</Text>
        </View>
      </View>
      <View style={styles.listItemRight}>
        <Text style={styles.listBalance}>
          {parseFloat(account.balance).toFixed(4)}
        </Text>
        <Text style={styles.listSymbol}>{network.symbol}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 20,
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  networkIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  networkName: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  balance: {
    color: 'white',
    fontSize: 36,
    fontWeight: '700',
  },
  symbol: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    marginLeft: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  address: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  copyIcon: {
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  receiveButton: {
    backgroundColor: '#34C759',
    marginRight: 0,
    marginLeft: 8,
  },
  actionIcon: {
    fontSize: 18,
    color: 'white',
    marginRight: 6,
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // List item styles
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  listAddress: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  listItemRight: {
    alignItems: 'flex-end',
  },
  listBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  listSymbol: {
    fontSize: 12,
    color: '#666',
  },
});
