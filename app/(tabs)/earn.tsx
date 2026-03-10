import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';

import { Box } from '@/components/ui/builders/Box';
import { Text } from '@/components/ui/builders/Text';
import { useAppTheme } from '@/theme/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type EarnFilter = 'all' | 'staking' | 'lending' | 'lp';

interface Protocol {
  id: string;
  name: string;
  subtitle: string;
  subtitleColor: string;
  apy: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  cardBg: string;
  apyBg: string;
  borderColor: string;
  filter: Exclude<EarnFilter, 'all'>;
}

interface Position {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  income: string;
  period: string;
  borderColor: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const PROTOCOLS: Protocol[] = [
  {
    id: 'lido',
    name: 'Lido Finance',
    subtitle: 'Стейкинг ETH',
    subtitleColor: '#F59E0B',
    apy: '4.2%',
    icon: 'water-outline',
    iconColor: '#10B981',
    iconBg: '#1A2F20',
    cardBg: '#0D1826',
    apyBg: '#1A2F20',
    borderColor: '#1E3A5F',
    filter: 'staking',
  },
  {
    id: 'aave',
    name: 'Aave',
    subtitle: 'Лендинг USDC',
    subtitleColor: '#3B82F6',
    apy: '8.5%',
    icon: 'business-outline',
    iconColor: '#3B82F6',
    iconBg: '#0D1E3B',
    cardBg: '#0D1826',
    apyBg: '#0D1E3B',
    borderColor: '#1E3A5F',
    filter: 'lending',
  },
  {
    id: 'uniswap',
    name: 'Uniswap V3',
    subtitle: 'LP ETH/USDC',
    subtitleColor: '#8B5CF6',
    apy: '12–45%',
    icon: 'git-network-outline',
    iconColor: '#8B5CF6',
    iconBg: '#160D30',
    cardBg: '#0D1826',
    apyBg: '#160D30',
    borderColor: '#1E3A5F',
    filter: 'lp',
  },
];

const ACTIVE_POSITIONS: Position[] = [
  {
    id: 'steth',
    name: 'stETH · Lido',
    subtitle: '0.5842 ETH застейкано',
    icon: 'water-outline',
    iconColor: '#10B981',
    iconBg: '#1A2F20',
    income: '+$18.42',
    period: 'за 30 дней',
    borderColor: '#10B98130',
  },
];

const FILTER_TABS: { id: EarnFilter; label: string }[] = [
  { id: 'all',      label: 'Все'       },
  { id: 'staking',  label: 'Стейкинг'  },
  { id: 'lending',  label: 'Лендинг'   },
  { id: 'lp',       label: 'LP'        },
];

// ─── Protocol Card ────────────────────────────────────────────────────────────

function ProtocolCard({ protocol, onPress }: { protocol: Protocol; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Box
        row alignItems="center" gap={12}
        px={16} h={76} borderRadius={16}
        backgroundColor={protocol.cardBg}
        borderWidth={1} borderColor={protocol.borderColor}
      >
        <Box w={44} h={44} borderRadius={22} alignItems="center" justifyContent="center" backgroundColor={protocol.iconBg}>
          <Ionicons name={protocol.icon} size={22} color={protocol.iconColor} />
        </Box>

        <Box flex gap={4}>
          <Text variant="p3-semibold" color="#F9FAFB">{protocol.name}</Text>
          <Text variant="caption" color={protocol.subtitleColor}>{protocol.subtitle}</Text>
        </Box>

        <Box alignItems="flex-end" gap={2} px={12} py={8} borderRadius={12} backgroundColor={protocol.apyBg}>
          <Text fontSize={18} fontWeight="700" color="#10B981">{protocol.apy}</Text>
          <Text fontSize={11} fontWeight="500" color="#6B7280">в год</Text>
        </Box>
      </Box>
    </TouchableOpacity>
  );
}

// ─── Position Card ────────────────────────────────────────────────────────────

function PositionCard({ position }: { position: Position }) {
  return (
    <Box
      row alignItems="center" gap={12}
      px={16} h={76} borderRadius={16}
      backgroundColor="#0D1826"
      borderWidth={1} borderColor={position.borderColor}
    >
      <Box w={44} h={44} borderRadius={22} alignItems="center" justifyContent="center" backgroundColor={position.iconBg}>
        <Ionicons name={position.icon} size={22} color={position.iconColor} />
      </Box>

      <Box flex gap={4}>
        <Text variant="p3-semibold" color="#F9FAFB">{position.name}</Text>
        <Text variant="caption" color="#6B7280">{position.subtitle}</Text>
      </Box>

      <Box alignItems="flex-end" gap={2}>
        <Text variant="p3" fontWeight="700" color="#10B981">{position.income}</Text>
        <Text fontSize={11} color="#6B7280">{position.period}</Text>
      </Box>
    </Box>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function EarnScreen() {
  const { colors, insets } = useAppTheme();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<EarnFilter>('all');

  const filteredProtocols = activeFilter === 'all'
    ? PROTOCOLS
    : PROTOCOLS.filter((p) => p.filter === activeFilter);

  return (
    <Box flex backgroundColor={colors.background}>
      {/* Glow */}
      <Box
        style={{ position: 'absolute' }}
        top={insets.top + 60} left={45}
        w={300} h={300} borderRadius={150}
        backgroundColor="#10B98118"
        pointerEvents="none"
      />

      {/* Header */}
      <Box row justifyContent="space-between" alignItems="center" px={20} pt={insets.top + 12} pb={4}>
        <Text variant="h4" color="#fff">Earn</Text>
        <Box w={40} h={40} borderRadius={20} alignItems="center" justifyContent="center" backgroundColor="#0D2B1F">
          <Ionicons name="trending-up-outline" size={20} color="#10B981" />
        </Box>
      </Box>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 24 }}
      >
        {/* Summary Card */}
        <Box
          mx={20} mb={20} borderRadius={24} p={20}
          backgroundColor="#0D2E1F"
          borderWidth={1} borderColor="#1A4030"
          style={{ shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 8 }}
        >
          <Box row justifyContent="space-between" alignItems="center">
            <Box gap={4}>
              <Text variant="caption-medium" color="#6B7280">Общий доход</Text>
              <Text variant="h2" color="#10B981">$127.43</Text>
            </Box>
            <Box row alignItems="center" gap={6} px={12} py={6} borderRadius={10} backgroundColor="#0D2B1F">
              <Ionicons name="trending-up-outline" size={14} color="#10B981" />
              <Text variant="p4-semibold" color="#10B981">APY 6.8%</Text>
            </Box>
          </Box>

          <Box row alignItems="center" gap={16} mt={14}>
            <Text variant="caption-medium" color="#9CA3AF">Застейкано · $2,840</Text>
            <Box w={1} h={24} backgroundColor="#2D3748" />
            <Text variant="caption-medium" color="#9CA3AF">В пуле · $1,200</Text>
          </Box>
        </Box>

        {/* Filter Tabs */}
        <Box row gap={8} px={20} mb={20}>
          {FILTER_TABS.map((tab) => {
            const isActive = tab.id === activeFilter;
            return (
              <TouchableOpacity key={tab.id} onPress={() => setActiveFilter(tab.id)} activeOpacity={0.8}>
                <Box
                  h={32} px={16} borderRadius={20}
                  alignItems="center" justifyContent="center"
                  backgroundColor={isActive ? '#10B981' : '#161B22'}
                  borderWidth={isActive ? 0 : 1}
                  borderColor={isActive ? 'transparent' : '#30363D'}
                >
                  <Text variant="p4-semibold" color={isActive ? '#fff' : '#6B7280'}>{tab.label}</Text>
                </Box>
              </TouchableOpacity>
            );
          })}
        </Box>

        {/* Protocols */}
        <Text fontSize={11} fontWeight="600" color="#6B7280" mx={20} mb={12} style={{ letterSpacing: 1 }}>ПРОТОКОЛЫ</Text>
        <Box px={20} gap={12} mb={24}>
          {filteredProtocols.map((protocol) => (
            <ProtocolCard
              key={protocol.id}
              protocol={protocol}
              onPress={() => router.push({ pathname: '/earn-detail', params: { id: protocol.id } })}
            />
          ))}
          {filteredProtocols.length === 0 && (
            <Box py={32} alignItems="center" gap={8}>
              <Ionicons name="analytics-outline" size={32} color="#374151" />
              <Text variant="p3" color="#6B7280">Нет протоколов для этого фильтра</Text>
            </Box>
          )}
        </Box>

        {/* Active Positions */}
        <Text fontSize={11} fontWeight="600" color="#6B7280" mx={20} mb={12} style={{ letterSpacing: 1 }}>АКТИВНЫЕ ПОЗИЦИИ</Text>
        <Box px={20} gap={12}>
          {ACTIVE_POSITIONS.map((pos) => (
            <PositionCard key={pos.id} position={pos} />
          ))}
        </Box>
      </ScrollView>
    </Box>
  );
}

