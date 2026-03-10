import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, TouchableOpacity } from 'react-native';

import { Box } from '@/components/ui/builders/Box';
import { Text } from '@/components/ui/builders/Text';
import { NETWORKS, getNetworksByMode } from '@/constants/networks';
import { useWallet } from '@/providers/wallet-provider';
import { getTransactionHistory, supportsTransactionHistory } from '@/services/transaction-service';
import { useAppTheme } from '@/theme/theme';
import { Network, Transaction } from '@/types/wallet';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatValue(value: string, decimals = 5): string {
  const n = parseFloat(value);
  if (isNaN(n) || n === 0) return '0';
  if (n < 0.000001) return '< 0.000001';
  return n.toFixed(decimals).replace(/\.?0+$/, '');
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function shortenAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function getDateLabel(timestamp: number): string {
  const now = new Date();
  const d = new Date(timestamp);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86_400_000;
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (day === today) return 'Сегодня';
  if (day === yesterday) return 'Вчера';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const NET_PILL: Partial<Record<Network, { bg: string; color: string }>> = {
  [Network.ETHEREUM]:         { bg: '#1E3A5F', color: '#3B82F6' },
  [Network.ETHEREUM_SEPOLIA]: { bg: '#1E3A5F', color: '#3B82F6' },
  [Network.SOLANA]:           { bg: '#0A1A0A', color: '#10B981' },
  [Network.SOLANA_DEVNET]:    { bg: '#0A1A0A', color: '#10B981' },
  [Network.POLYGON]:          { bg: '#1A0A2A', color: '#A855F7' },
  [Network.POLYGON_AMOY]:     { bg: '#1A0A2A', color: '#A855F7' },
  [Network.BSC]:              { bg: '#1A1500', color: '#F59E0B' },
  [Network.BSC_TESTNET]:      { bg: '#1A1500', color: '#F59E0B' },
};

function getNetPill(n: Network) {
  return NET_PILL[n] ?? { bg: '#1F2937', color: '#9CA3AF' };
}

function getTxIconCfg(tx: Transaction): { icon: string; iconColor: string; bg: string } {
  if (tx.status === 'failed')  return { icon: 'close-circle', iconColor: '#EF4444', bg: '#1A0505' };
  if (tx.status === 'pending') return { icon: 'time',         iconColor: '#F59E0B', bg: '#1C1405' };
  if (tx.type === 'incoming')  return { icon: 'arrow-down',   iconColor: '#10B981', bg: '#052E16' };
  return                               { icon: 'arrow-up',    iconColor: '#EF4444', bg: '#1A0A0A' };
}

const STATUS_CFG: Record<Transaction['status'], { bg: string; color: string; label: string }> = {
  confirmed: { bg: '#052E16', color: '#10B981', label: 'Подтверждено' },
  pending:   { bg: '#1C1405', color: '#F59E0B', label: 'В ожидании'   },
  failed:    { bg: '#1A0505', color: '#EF4444', label: 'Ошибка'        },
};

// ─── TX Row ───────────────────────────────────────────────────────────────────

function TxRow({ tx, isLast }: { tx: Transaction; isLast: boolean }) {
  const net = NETWORKS[tx.network];
  const netPill = getNetPill(tx.network);
  const iconCfg = getTxIconCfg(tx);
  const statusCfg = STATUS_CFG[tx.status];

  const amountColor = tx.status === 'failed' ? '#6B7280' : tx.type === 'incoming' ? '#10B981' : '#EF4444';
  const titleColor  = tx.status === 'failed' ? '#9CA3AF' : '#F9FAFB';
  const prefix = tx.type === 'incoming' ? '+' : '-';
  const title  = tx.type === 'incoming' ? `Получение ${net?.symbol ?? ''}` : `Отправка ${net?.symbol ?? ''}`;
  const addr   = tx.type === 'incoming' ? tx.from : tx.to;

  const handlePress = () => {
    console.log("press")
    router.push({
      pathname: '/transaction-detail',
      params: {
        hash:      tx.hash,
        from:      tx.from,
        to:        tx.to,
        value:     tx.value,
        network:   tx.network,
        timestamp: String(tx.timestamp),
        status:    tx.status,
        type:      tx.type,
        fee:       tx.fee ?? '',
      },
    });
  };

  return (
    <Box onPress={handlePress}>
      <Box row alignItems="center" gap={12} px={20} py={12}>
        {/* Icon */}
        <Box w={44} h={44} borderRadius={12} alignItems="center" justifyContent="center" backgroundColor={iconCfg.bg}>
          <Ionicons name={iconCfg.icon as any} size={20} color={iconCfg.iconColor} />
        </Box>

        {/* Info */}
        <Box flex gap={5}>
          {/* Row 1 */}
          <Box row justifyContent="space-between" alignItems="center">
            <Text variant="p4-semibold" color={titleColor}>{title}</Text>
            <Text variant="p4-semibold" color={amountColor}>
              {prefix}{formatValue(tx.value)} {net?.symbol ?? ''}
            </Text>
          </Box>

          {/* Row 2 */}
          <Box row justifyContent="space-between" alignItems="center">
            <Box row alignItems="center" gap={6}>
              <Text variant="caption" color="#6B7280">{shortenAddress(addr)}</Text>
              <Box px={6} py={2} borderRadius={4} backgroundColor={netPill.bg}>
                <Text variant="label" fontWeight="600" color={netPill.color}>
                  {net?.icon} {net?.symbol}
                </Text>
              </Box>
            </Box>

            <Box row alignItems="center" gap={6}>
              <Box row alignItems="center" gap={4} px={6} py={2} borderRadius={4} backgroundColor={statusCfg.bg}>
                <Box w={6} h={6} borderRadius={3} backgroundColor={statusCfg.color} />
                <Text variant="label" fontWeight="600" color={statusCfg.color}>{statusCfg.label}</Text>
              </Box>
              <Text variant="label" color="#4B5563">{formatTime(tx.timestamp)}</Text>
            </Box>
          </Box>
        </Box>
      </Box>

      {!isLast && <Box h={StyleSheet.hairlineWidth} ml={76} mr={20} backgroundColor="#1F2937" />}
    </Box>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ txs }: { txs: Transaction[] }) {
  const received = txs.filter((t) => t.type === 'incoming' && t.status !== 'failed');
  const sent     = txs.filter((t) => t.type === 'outgoing' && t.status !== 'failed');

  // Group amounts by symbol
  const sumBy = (list: Transaction[]) =>
    list.reduce<Record<string, number>>((acc, tx) => {
      const sym = NETWORKS[tx.network]?.symbol ?? '?';
      acc[sym] = (acc[sym] ?? 0) + parseFloat(tx.value || '0');
      return acc;
    }, {});

  const recvStr = Object.entries(sumBy(received)).map(([s, v]) => `+${formatValue(String(v))} ${s}`).join('\n') || '—';
  const sentStr = Object.entries(sumBy(sent)).map(([s, v]) => `-${formatValue(String(v))} ${s}`).join('\n') || '—';

  return (
    <Box row mx={20} mb={16} h={80} borderRadius={16} borderWidth={1} borderColor="#1F2937" backgroundColor="#111827" px={4}>
      <Box flex alignItems="center" justifyContent="center" gap={3}>
        <Text variant="p2-semibold" color="#fff">{txs.length}</Text>
        <Text variant="caption" color="#6B7280">Всего</Text>
      </Box>
      <Box w={1} h={40} alignSelf="center" backgroundColor="#1F2937" />
      <Box flex alignItems="center" justifyContent="center" gap={3}>
        <Text variant="p4-semibold" fontWeight="700" center color="#10B981">{recvStr}</Text>
        <Text variant="caption" color="#6B7280">Получено</Text>
      </Box>
      <Box w={1} h={40} alignSelf="center" backgroundColor="#1F2937" />
      <Box flex alignItems="center" justifyContent="center" gap={3}>
        <Text variant="p4-semibold" fontWeight="700" center color="#EF4444">{sentStr}</Text>
        <Text variant="caption" color="#6B7280">Отправлено</Text>
      </Box>
    </Box>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type TxFilter = 'all' | 'incoming' | 'outgoing';
interface TxSection { title: string; data: Transaction[] }

const FILTER_TABS: { id: TxFilter; label: string }[] = [
  { id: 'all',      label: 'Все'       },
  { id: 'incoming', label: 'Входящие'  },
  { id: 'outgoing', label: 'Исходящие' },
];

function groupByDate(txs: Transaction[]): TxSection[] {
  const map = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const label = getDateLabel(tx.timestamp);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(tx);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const { colors, insets } = useAppTheme();
  const { wallet, networkMode, getAccountsForCurrentMode, isInitialized } = useWallet();

  const accounts = getAccountsForCurrentMode();
  const supportedNetworks = useMemo(
    () => getNetworksByMode(networkMode).filter(
      (n) => supportsTransactionHistory(n.id) && accounts.some((a) => a.network === n.id)
    ),
    [accounts, networkMode]
  );

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [txFilter, setTxFilter] = useState<TxFilter>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!supportedNetworks.length) return;
    setIsLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled(
        supportedNetworks.map((net) => {
          const account = accounts.find((a) => a.network === net.id);
          if (!account) return Promise.resolve<Transaction[]>([]);
          return getTransactionHistory(net.id, account.address);
        })
      );
      const merged = results.flatMap((r) => r.status === 'fulfilled' ? r.value : []);
      merged.sort((a, b) => b.timestamp - a.timestamp);
      setAllTransactions(merged);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [supportedNetworks, accounts]);

  useEffect(() => {
    if (isInitialized) loadAll();
  }, [isInitialized, wallet?.id]);

  const filtered = useMemo(() => {
    if (txFilter === 'all') return allTransactions;
    return allTransactions.filter((tx) => tx.type === txFilter);
  }, [allTransactions, txFilter]);

  const sections = useMemo(() => groupByDate(filtered), [filtered]);

  if (!isInitialized) {
    return (
      <Box flex alignItems="center" justifyContent="center" backgroundColor={colors.background}>
        <Ionicons name="time-outline" size={48} color="#374151" />
        <Text variant="p2" colorName="label" center mt={12}>Сначала создайте кошелек</Text>
      </Box>
    );
  }

  return (
    <Box flex backgroundColor={colors.background}>
      {/* Header */}
      <Box row justifyContent="space-between" alignItems="center" px={20} pt={insets.top + 12} pb={4}>
        <Text variant="h4" color="#fff">История</Text>
        <Box w={36} h={36} borderRadius={10} backgroundColor="#1F2937" alignItems="center" justifyContent="center" onPress={loadAll} activeOpacity={0.7}>
          <Ionicons name="options-outline" size={16} color="#9CA3AF" />
        </Box>
      </Box>

      {/* Type filter tabs */}
      <Box row px={20} gap={8} mt={8} mb={12}>
        {FILTER_TABS.map((tab) => {
          const isActive = tab.id === txFilter;
          return (
            <TouchableOpacity key={tab.id} onPress={() => setTxFilter(tab.id)} activeOpacity={0.8}>
              <Box
                h={36} px={18} borderRadius={20}
                alignItems="center" justifyContent="center"
                backgroundColor={isActive ? '#3B82F6' : '#161B22'}
                borderWidth={isActive ? 0 : 1}
                borderColor={isActive ? 'transparent' : '#30363D'}
              >
                <Text variant="p4-semibold" color={isActive ? '#fff' : '#9CA3AF'}>{tab.label}</Text>
              </Box>
            </TouchableOpacity>
          );
        })}
      </Box>

      {/* Summary */}
      {filtered.length > 0 && !isLoading && <SummaryCard txs={filtered} />}

      {/* Content */}
      {isLoading ? (
        <Box flex alignItems="center" justifyContent="center" gap={12}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text variant="p3" color="#6B7280">Загрузка транзакций...</Text>
        </Box>
      ) : error ? (
        <Box flex alignItems="center" justifyContent="center" gap={12} px={32}>
          <Ionicons name="cloud-offline-outline" size={48} color="#374151" />
          <Text variant="p3" color="#6B7280" center>{error}</Text>
          <TouchableOpacity onPress={loadAll} activeOpacity={0.8}>
            <Box px={20} py={10} borderRadius={12} backgroundColor="#1F2937">
              <Text variant="p3-semibold" color="#fff">Повторить</Text>
            </Box>
          </TouchableOpacity>
        </Box>
      ) : sections.length === 0 ? (
        <Box flex alignItems="center" justifyContent="center" gap={12}>
          <Box w={72} h={72} borderRadius={36} alignItems="center" justifyContent="center" backgroundColor="#161B22">
            <Ionicons name="receipt-outline" size={32} color="#374151" />
          </Box>
          <Text variant="p2-semibold" color="#9CA3AF">Нет транзакций</Text>
          <Text variant="p4" color="#6B7280" center>Транзакции появятся после первой операции</Text>
        </Box>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(tx) => `${tx.hash}-${tx.network}`}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          renderSectionHeader={({ section }) => (
            <Box px={20} pt={16} pb={6}>
              <Text variant="caption-medium" fontWeight="600" color="#6B7280" uppercase>{section.title}</Text>
            </Box>
          )}
          renderItem={({ item, index, section }) => (
            <TxRow tx={item} isLast={index === section.data.length - 1} />
          )}
        />
      )}
    </Box>
  );
}

