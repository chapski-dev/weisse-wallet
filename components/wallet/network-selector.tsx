import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui/builders/Text';
import { TokenIcon } from '@/components/wallet/token-icon';
import { getNetworksByMode } from '@/constants/networks';
import { useWallet } from '@/providers/wallet-provider';
import { useAppTheme } from '@/theme/theme';
import { Network, NetworkMode } from '@/types/wallet';
import { Box } from '../ui';

// ─── Horizontal chip selector ─────────────────────────────────────────────────

interface NetworkSelectorProps {
  selectedNetwork: Network;
  onSelectNetwork: (network: Network) => void;
}

export function NetworkSelector({ selectedNetwork, onSelectNetwork }: NetworkSelectorProps) {
  const { colors } = useAppTheme();
  const { networkMode } = useWallet();
  const networks = getNetworksByMode(networkMode);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {networks.map((network) => {
        const isSelected = selectedNetwork === network.id;
        return (
          <Box
            row
            gap={8}
            px={14}
            py={8}
            borderRadius={8}
            backgroundColor={colors.border}
            key={network.id}
            onPress={() => onSelectNetwork(network.id)}
          >
            <TokenIcon symbol={network.symbol} networkId={network.id} size={18} />
            <Text variant="p4-semibold" color={isSelected ? '#fff' : colors.label}>
              {network.name}
            </Text>
          </Box>
        );
      })}
    </ScrollView>
  );
}

// ─── Vertical list (settings / modal) ────────────────────────────────────────

interface NetworkListProps {
  selectedNetwork: Network;
  onSelectNetwork: (network: Network) => void;
  mode?: NetworkMode;
}

export function NetworkList({ selectedNetwork, onSelectNetwork, mode = 'mainnet' }: NetworkListProps) {
  const { colors } = useAppTheme();
  const networks = getNetworksByMode(mode);

  return (
    <View>
      {networks.map((network) => {
        const isSelected = selectedNetwork === network.id;
        return (
          <TouchableOpacity
            key={network.id}
            style={[
              styles.listItem,
              {
                backgroundColor: isSelected ? colors.primary_700_15 : 'transparent',
                borderColor: isSelected ? colors.primary : 'transparent',
                borderWidth: 1,
              },
            ]}
            onPress={() => onSelectNetwork(network.id)}
          >
            <View style={styles.listLeft}>
              <TokenIcon symbol={network.symbol} networkId={network.id} size={38} />
              <View style={{ gap: 2 }}>
                <Text variant="p3-semibold">{network.name}</Text>
                <Text variant="p4" colorName="label">{network.symbol}</Text>
              </View>
            </View>
            {isSelected && (
              <Text variant="p2-semibold" color={colors.primary}>✓</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  content: { paddingHorizontal: 20, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  listLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
