import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

import { Box } from '@/components/ui/builders/Box';
import { Text } from '@/components/ui/builders/Text';
import { NETWORK_CFG, NFTItem, NFTNetwork, setNFTCache } from '@/constants/nfts';
import { useWallet } from '@/providers/wallet-provider';
import { fetchNFTs } from '@/services/nft-service';
import { useAppTheme } from '@/theme/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type NFTFilter = 'all' | NFTNetwork;
type SortOption = 'default' | 'name_asc' | 'name_desc';

// ─── Network config ───────────────────────────────────────────────────────────

const NETWORK_FILTERS: { id: NFTFilter; label: string }[] = [
  { id: 'all',      label: 'Все'     },
  { id: 'ethereum', label: '⟠ ETH'  },
  { id: 'solana',   label: '◎ SOL'  },
  { id: 'polygon',  label: '🟣 POL' },
];

// ─── Sort config ──────────────────────────────────────────────────────────────

const SORT_OPTIONS: { id: SortOption; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { id: 'default',   label: 'По умолчанию', icon: 'swap-vertical-outline' },
  { id: 'name_asc',  label: 'Название А–Я', icon: 'arrow-up-outline'      },
  { id: 'name_desc', label: 'Название Я–А', icon: 'arrow-down-outline'    },
];

// ─── NFT Card ─────────────────────────────────────────────────────────────────

function NFTCard({ item, onPress }: { item: NFTItem; onPress: () => void }) {
  const net = NETWORK_CFG[item.network];

  return (
    <Box flex backgroundColor="#111827" borderRadius={16} borderWidth={1} borderColor="#1F2937" overflow="hidden" onPress={onPress}>
      {/* Image area */}
      <Box
        h={156}
        alignItems="center"
        justifyContent="center"
        style={{ backgroundColor: item.bgColor }}
      >
        <Text style={styles.emoji}>{item.emoji}</Text>
      </Box>

      {/* Info */}
      <Box p={12} gap={4}>
        <Text variant="p3-semibold" color="#fff" numberOfLines={1}>{item.name}</Text>
        <Text variant="caption" color="#6B7280" numberOfLines={1}>{item.collection}</Text>

        {/* Network badge */}
        <Box
          alignSelf="flex-start"
          borderWidth={1}
          borderRadius={6}
          px={8}
          py={3}
          mt={2}
          backgroundColor={net.bg}
          borderColor={net.border}
        >
          <Text style={[styles.badgeText, { color: net.text }]}>
            {net.symbol} {net.name}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <Box alignItems="center" justifyContent="center" gap={12} mt={60}>
      <Box w={72} h={72} borderRadius={36} alignItems="center" justifyContent="center" backgroundColor="#161B22">
        <Ionicons name={hasQuery ? 'search-outline' : 'image-outline'} size={32} color="#374151" />
      </Box>
      <Text variant="p2-semibold" color="#9CA3AF">
        {hasQuery ? 'Ничего не найдено' : 'NFT не найдены'}
      </Text>
      <Text variant="p4" color="#6B7280" center>
        {hasQuery
          ? 'Попробуйте изменить запрос'
          : 'NFT из ваших кошельков\nпоявятся здесь автоматически'}
      </Text>
    </Box>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NFTScreen() {
  const router = useRouter();
  const { colors, insets } = useAppTheme();
  const { isInitialized, wallet, networkMode, getActiveNetwork, selectedNetwork } = useWallet();

  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NFTFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [showSort, setShowSort] = useState(false);

  const searchHeight = useRef(new Animated.Value(0)).current;

  const loadNFTs = useCallback(async (isRefresh = false) => {
    if (!wallet) return;

    const activeNetwork = getActiveNetwork(selectedNetwork);

    const account = wallet.accounts.find((a) => a.network === activeNetwork);
    if (!account) return;

    if (isRefresh) setRefreshing(true);
    try {
      const items = await fetchNFTs(activeNetwork, account.address);
      setNfts(items);
      setNFTCache(items);
    } catch {
      setNfts([]);
      setNFTCache([]);
    } finally {
      if (isRefresh) setRefreshing(false);
    }
  }, [wallet, networkMode, selectedNetwork]);

  useEffect(() => {
    loadNFTs(false);
  }, [wallet, networkMode, selectedNetwork]);

  const toggleSearch = () => {
    const opening = !showSearch;
    setShowSearch(opening);
    if (!opening) setSearchQuery('');
    Animated.timing(searchHeight, {
      toValue: opening ? 52 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const filtered = useMemo(() => {
    let result = activeFilter === 'all'
      ? nfts
      : nfts.filter((nft) => nft.network === activeFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (nft) => nft.name.toLowerCase().includes(q) || nft.collection.toLowerCase().includes(q),
      );
    }

    if (sortBy === 'name_asc')  result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'name_desc') result = [...result].sort((a, b) => b.name.localeCompare(a.name));

    return result;
  }, [activeFilter, searchQuery, sortBy, nfts]);

  return (
    <Box backgroundColor={colors.background}>
      {/* Header */}
      <Box row justifyContent="space-between" alignItems="center" px={20} pt={insets.top + 12} pb={4}>
        <Text variant="h4" color="#fff">NFT</Text>
        <Box row gap={8}>
          {/* Search toggle */}
          <TouchableOpacity
            style={[styles.iconBtn, showSearch && styles.iconBtnActive]}
            activeOpacity={0.7}
            onPress={toggleSearch}
          >
            <Ionicons name="search-outline" size={18} color={showSearch ? '#3B82F6' : '#9CA3AF'} />
          </TouchableOpacity>

          {/* Sort button + dropdown */}
          <Box style={{ zIndex: 10 }}>
            <TouchableOpacity
              style={[styles.iconBtn, (showSort || sortBy !== 'default') && styles.iconBtnActive]}
              activeOpacity={0.7}
              onPress={() => setShowSort((v) => !v)}
            >
              <Ionicons
                name="options-outline"
                size={18}
                color={(showSort || sortBy !== 'default') ? '#3B82F6' : '#9CA3AF'}
              />
            </TouchableOpacity>

            {showSort && (
              <Box style={styles.sortDropdown} backgroundColor="#1F2937" borderRadius={12} borderWidth={1} borderColor="#374151" overflow="hidden">
                {SORT_OPTIONS.map((opt) => {
                  const isActive = sortBy === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      activeOpacity={0.7}
                      onPress={() => { setSortBy(opt.id); setShowSort(false); }}
                    >
                      <Box row alignItems="center" gap={10} px={14} py={12} backgroundColor={isActive ? '#3B82F615' : 'transparent'}>
                        <Ionicons name={opt.icon} size={15} color={isActive ? '#3B82F6' : '#9CA3AF'} />
                        <Text variant="p4" color={isActive ? '#3B82F6' : '#fff'}>{opt.label}</Text>
                      </Box>
                    </TouchableOpacity>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Search bar */}
      <Animated.View style={{ height: searchHeight, overflow: 'hidden', paddingHorizontal: 20 }}>
        <Box row alignItems="center" gap={10} px={14} h={44} borderRadius={12} backgroundColor="#161B22" borderWidth={1} borderColor="#374151" mb={8}>
          <Ionicons name="search-outline" size={16} color="#6B7280" />
          <TextInput
            placeholder="Поиск по названию или коллекции..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            autoFocus={showSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={16} color="#6B7280" />
            </TouchableOpacity>
          )}
        </Box>
      </Animated.View>

      {/* Summary */}
      <Box row alignItems="center" gap={8} px={20} py={12}>
        <Text variant="p1-semibold" color="#fff">{filtered.length}</Text>
        <Text variant="p2" color="#6B7280">
          {activeFilter === 'all'
            ? 'NFT в коллекции'
            : `NFT в ${NETWORK_CFG[activeFilter as Exclude<NFTNetwork, 'all'>].name}`}
        </Text>
      </Box>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 16 }}
      >
        {NETWORK_FILTERS.map((f) => {
          const isActive = f.id === activeFilter;
          const net = f.id !== 'all' ? NETWORK_CFG[f.id] : null;

          return (
            <TouchableOpacity key={f.id} onPress={() => { setActiveFilter(f.id); setShowSort(false); }} activeOpacity={0.8}>
              <Box
                h={36} px={16} borderRadius={18}
                alignItems="center" justifyContent="center"
                backgroundColor={isActive ? '#3B82F6' : (net ? net.bg : '#1F2937')}
                borderWidth={isActive ? 0 : 1}
                borderColor={isActive ? 'transparent' : (net ? net.border : '#30363D')}
              >
                <Text
                  variant="p4-semibold"
                  color={isActive ? '#fff' : (net ? net.text : '#9CA3AF')}
                >
                  {f.label}
                </Text>
              </Box>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* NFT grid */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 150 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <NFTCard item={item} onPress={() => router.push(`/nft-detail?id=${item.id}`)} />
        )}
        ListEmptyComponent={<EmptyState hasQuery={searchQuery.trim().length > 0} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadNFTs(true)}
            tintColor="#6B7280"
          />
        }
        onScrollBeginDrag={() => setShowSort(false)}
      />
    </Box>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: '#3B82F615',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  sortDropdown: {
    position: 'absolute',
    top: 48,
    right: 0,
    width: 190,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  grid: {
    paddingHorizontal: 20,
    gap: 12,
  },
  row: {
    gap: 12,
  },
  emoji: {
    fontSize: 56,
    lineHeight: 72,
    textAlign: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
});
