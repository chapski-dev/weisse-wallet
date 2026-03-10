import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ScrollView, TextInput, TouchableOpacity } from 'react-native';

import { Box } from '@/components/ui/builders/Box';
import { Text } from '@/components/ui/builders/Text';
import { ScreenHeader } from '@/components/ui/layouts/ScreenHeader';
import { useAppTheme } from '@/theme/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProtocolConfig {
  name: string;
  badge: string;
  apy: string;
  tvl: string;
  min: string;
  fee: string;
  unlock: string;
  unlockColor: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  heroBg: string;
  heroBorder: string;
  glowColor: string;
  btnBg: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const PROTOCOLS: Record<string, ProtocolConfig> = {
  lido: {
    name: 'Lido Finance',
    badge: 'Стейкинг ETH',
    apy: '4.2%',
    tvl: '$14.2B',
    min: '0.01 ETH',
    fee: '10% от дохода',
    unlock: 'В любое время',
    unlockColor: '#10B981',
    iconName: 'water-outline',
    iconColor: '#10B981',
    iconBg: '#1A2F20',
    heroBg: '#0D2E1F',
    heroBorder: '#10B98140',
    glowColor: '#10B98118',
    btnBg: '#0D9966',
  },
  aave: {
    name: 'Aave',
    badge: 'Лендинг USDC',
    apy: '8.5%',
    tvl: '$6.8B',
    min: '10 USDC',
    fee: '0% от дохода',
    unlock: 'Мгновенно',
    unlockColor: '#3B82F6',
    iconName: 'business-outline',
    iconColor: '#3B82F6',
    iconBg: '#0D1E3B',
    heroBg: '#0D1830',
    heroBorder: '#3B82F640',
    glowColor: '#3B82F618',
    btnBg: '#2563EB',
  },
  uniswap: {
    name: 'Uniswap V3',
    badge: 'LP ETH/USDC',
    apy: '12–45%',
    tvl: '$3.1B',
    min: '0.001 ETH',
    fee: '0.3% от сделок',
    unlock: 'В любое время',
    unlockColor: '#8B5CF6',
    iconName: 'git-network-outline',
    iconColor: '#8B5CF6',
    iconBg: '#160D30',
    heroBg: '#120D28',
    heroBorder: '#8B5CF640',
    glowColor: '#8B5CF618',
    btnBg: '#7C3AED',
  },
};

const DEFAULT_AMOUNT_ETH = 3;
const ETH_PRICE_USD = 3250;

// ─── Yield Card ───────────────────────────────────────────────────────────────

function YieldCard({
  label,
  usd,
  eth,
  highlighted = false,
}: {
  label: string;
  usd: string;
  eth: string;
  highlighted?: boolean;
}) {
  return (
    <Box
      flex alignItems="center" justifyContent="center"
      gap={6} p={14} borderRadius={16}
      backgroundColor="#0D1826"
      borderWidth={highlighted ? 2 : 1}
      borderColor={highlighted ? '#10B98150' : '#1E3A5F'}
    >
      <Text variant="label" fontWeight="600" color="#6B7280" style={{ letterSpacing: 0.5 }}>{label}</Text>
      <Text variant="h4" color="#10B981" numberOfLines={1} adjustsFontSizeToFit>{usd}</Text>
      <Text variant="label" color="#6B7280" numberOfLines={1} adjustsFontSizeToFit>{eth}</Text>
    </Box>
  );
}

// ─── Detail Row ───────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
  valueColor = '#F9FAFB',
  last = false,
}: {
  label: string;
  value: string;
  valueColor?: string;
  last?: boolean;
}) {
  return (
    <>
      <Box row justifyContent="space-between" alignItems="center" px={16} h={44}>
        <Text variant="p4" color="#9CA3AF">{label}</Text>
        <Text variant="p4-semibold" color={valueColor}>{value}</Text>
      </Box>
      {!last && <Box h={1} backgroundColor="#1F2937" />}
    </>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function EarnDetailScreen() {
  const { insets } = useAppTheme();
  const router = useRouter();
  const { id = 'lido' } = useLocalSearchParams<{ id: string }>();

  const protocol = PROTOCOLS[id] ?? PROTOCOLS.lido;

  const [amountEth, setAmountEth] = useState(DEFAULT_AMOUNT_ETH);
  const [inputValue, setInputValue] = useState(String(DEFAULT_AMOUNT_ETH));
  const inputRef = useRef<TextInput>(null);

  const apyNum = parseFloat(protocol.apy) || 4.2;
  const amountUsd = amountEth * ETH_PRICE_USD;
  const dayUsd = (amountUsd * apyNum) / 100 / 365;
  const monthUsd = dayUsd * 30;
  const yearUsd = (amountUsd * apyNum) / 100;
  const ethPerYear = (amountEth * apyNum) / 100;

  const fmt = (n: number) =>
    n >= 100 ? `$${Math.round(n)}` : `$${n.toFixed(2)}`;
  const fmtEth = (n: number) =>
    `${n < 0.001 ? (n * 1000).toFixed(3) + 'm' : n.toFixed(4)} ETH`;

  const handleStake = () => {
    router.push({ pathname: '/send', params: { type: 'stake', protocol: id } });
  };

  return (
    <Box flex backgroundColor="#0A0F1E">
      {/* Ambient glow */}
      <Box
        style={{ position: 'absolute' }}
        top={100} left={45}
        w={300} h={300} borderRadius={150}
        backgroundColor={protocol.glowColor}
        pointerEvents="none"
      />

      <ScreenHeader title={protocol.name} backLabel="Назад" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24, gap: 12 }}
      >
        {/* ── Hero Card ── */}
        <Box
          borderRadius={24} p={20} gap={12}
          backgroundColor={protocol.heroBg}
          borderWidth={1} borderColor={protocol.heroBorder}
          style={{
            shadowColor: protocol.iconColor,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 32,
            elevation: 8,
          }}
        >
          {/* Top row: icon + badge */}
          <Box row justifyContent="space-between" alignItems="center">
            <Box w={44} h={44} borderRadius={22} alignItems="center" justifyContent="center" backgroundColor={protocol.iconBg}>
              <Ionicons name={protocol.iconName} size={22} color={protocol.iconColor} />
            </Box>
            <Box px={14} py={6} borderRadius={20} backgroundColor={protocol.iconBg}>
              <Text variant="p4-semibold" color={protocol.iconColor}>{protocol.badge}</Text>
            </Box>
          </Box>

          {/* APY */}
          <Box alignItems="center" gap={4}>
            <Text variant="h1" color={protocol.iconColor}>{protocol.apy}</Text>
            <Text variant="p4" color="#6B7280">годовых</Text>
          </Box>

          {/* Stats */}
          <Box row justifyContent="center" alignItems="center" gap={12}>
            <Text variant="caption-medium" color="#9CA3AF">TVL · {protocol.tvl}</Text>
            <Box w={1} h={14} backgroundColor="#2D3748" />
            <Text variant="caption-medium" color="#9CA3AF">Мин. · {protocol.min}</Text>
          </Box>
        </Box>

        {/* ── Calculator ── */}
        <Text variant="caption" fontWeight="600" color="#6B7280" mt={8} style={{ letterSpacing: 1 }}>
          КАЛЬКУЛЯТОР ДОХОДНОСТИ
        </Text>

        {/* Amount Input */}
        <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()}>
          <Box
            row alignItems="center" gap={12}
            px={16} h={64} borderRadius={16}
            backgroundColor="#161B22"
            borderWidth={1} borderColor={`${protocol.iconColor}50`}
          >
            <Box w={40} h={40} borderRadius={20} alignItems="center" justifyContent="center" backgroundColor={protocol.iconBg}>
              <Text variant="h5" color={protocol.iconColor}>Ξ</Text>
            </Box>

            <Box flex gap={2}>
              <TextInput
                ref={inputRef}
                value={inputValue}
                onChangeText={(text) => {
                  setInputValue(text);
                  const parsed = parseFloat(text);
                  if (!isNaN(parsed) && parsed >= 0) setAmountEth(parsed);
                }}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#4B5563"
                maxLength={10}
                style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700', padding: 0 }}
              />
              <Text variant="caption" color="#6B7280">≈ ${amountUsd.toLocaleString()}</Text>
            </Box>

            <Ionicons name="pencil-outline" size={18} color="#6B7280" />
          </Box>
        </TouchableOpacity>

        {/* Yield Row */}
        <Box row gap={10} h={100}>
          <YieldCard label="ЗА ДЕНЬ" usd={fmt(dayUsd)} eth={fmtEth(ethPerYear / 365)} />
          <YieldCard label="ЗА МЕСЯЦ" usd={fmt(monthUsd)} eth={fmtEth(ethPerYear / 12)} />
          <YieldCard label="ЗА ГОД" usd={fmt(yearUsd)} eth={fmtEth(ethPerYear)} highlighted />
        </Box>

        {/* ── Protocol Info ── */}
        <Text variant="caption" fontWeight="600" color="#6B7280" mt={8} style={{ letterSpacing: 1 }}>
          О ПРОТОКОЛЕ
        </Text>

        <Box
          borderRadius={16}
          backgroundColor="#111827"
          borderWidth={1} borderColor="#1F2937"
          overflow="hidden"
          mb={8}
        >
          <DetailRow label="TVL" value={protocol.tvl} />
          <DetailRow label="Минимум" value={protocol.min} />
          <DetailRow label="Комиссия" value={protocol.fee} />
          <DetailRow label="Разблокировка" value={protocol.unlock} valueColor={protocol.unlockColor} last />
        </Box>

        {/* ── Stake Button ── */}
        <TouchableOpacity onPress={handleStake} activeOpacity={0.85}>
          <Box
            row alignItems="center" justifyContent="center"
            gap={10} h={56} borderRadius={16}
            backgroundColor={protocol.btnBg}
            style={{
              shadowColor: protocol.iconColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
              elevation: 6,
            }}
          >
            <Ionicons name="trending-up-outline" size={20} color="#fff" />
            <Text variant="p1-semibold" color="#FFFFFF">Застейкать</Text>
          </Box>
        </TouchableOpacity>
      </ScrollView>
    </Box>
  );
}
