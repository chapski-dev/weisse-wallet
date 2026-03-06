import { getNetworksByMode } from '@/constants/networks';
import { useWallet } from '@/providers/wallet-provider';
import { Network } from '@/types/wallet';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NetworkSelectorProps {
  selectedNetwork: Network;
  onSelectNetwork: (network: Network) => void;
}

export function NetworkSelector({ selectedNetwork, onSelectNetwork }: NetworkSelectorProps) {
  const { networkMode } = useWallet();
  const networks = getNetworksByMode(networkMode);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {networks.map((network) => (
        <TouchableOpacity
          key={network.id}
          style={[
            styles.networkItem,
            selectedNetwork === network.id && styles.networkItemSelected,
          ]}
          onPress={() => onSelectNetwork(network.id)}
        >
          <Text style={styles.networkIcon}>{network.icon}</Text>
          <Text
            style={[
              styles.networkName,
              selectedNetwork === network.id && styles.networkNameSelected,
            ]}
          >
            {network.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

interface NetworkListProps {
  selectedNetwork: Network;
  onSelectNetwork: (network: Network) => void;
}

export function NetworkList({ selectedNetwork, onSelectNetwork }: NetworkListProps) {
  const { networkMode } = useWallet();
  const networks = getNetworksByMode(networkMode);

  return (
    <View style={styles.listContainer}>
      {networks.map((network) => (
        <TouchableOpacity
          key={network.id}
          style={[
            styles.listItem,
            selectedNetwork === network.id && styles.listItemSelected,
          ]}
          onPress={() => onSelectNetwork(network.id)}
        >
          <View style={styles.listItemLeft}>
            <Text style={styles.listIcon}>{network?.icon}</Text>
            <View>
              <Text style={styles.listName}>{network.name}</Text>
              <Text style={styles.listSymbol}>{network.symbol}</Text>
            </View>
          </View>
          {selectedNetwork === network.id && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  networkItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    minWidth: 80,
  },
  networkItemSelected: {
    backgroundColor: '#007AFF',
  },
  networkIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  networkName: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  networkNameSelected: {
    color: 'white',
  },
  // List styles
  listContainer: {
    padding: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 8,
  },
  listItemSelected: {
    backgroundColor: '#E8F4FF',
    borderWidth: 2,
    borderColor: '#007AFF',
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
  listSymbol: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '600',
  },
});
