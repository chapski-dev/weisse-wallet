import { useWallet } from '@/providers/wallet-provider';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function NetworkModeToggle() {
  const { networkMode, toggleNetworkMode } = useWallet();

  const isTestnet = networkMode === 'testnet';

  return (
    <Pressable onPress={toggleNetworkMode} style={styles.container}>
      <View style={[styles.toggle, isTestnet && styles.toggleTestnet]}>
        <View style={[styles.indicator, isTestnet && styles.indicatorTestnet]} />
      </View>
      <Text style={[styles.label, isTestnet && styles.labelTestnet]}>
        {isTestnet ? 'Testnet' : 'Mainnet'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#34C759',
    padding: 2,
    justifyContent: 'center',
  },
  toggleTestnet: {
    backgroundColor: '#FF9500',
  },
  indicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  indicatorTestnet: {
    alignSelf: 'flex-end',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  labelTestnet: {
    color: '#FF9500',
  },
});
