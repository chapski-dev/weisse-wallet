import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, PanResponder, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Circle, Defs, Line, LinearGradient, Path, Stop, Svg } from 'react-native-svg';

import { Box } from '@/components/ui/builders/Box';
import { Text } from '@/components/ui/builders/Text';
import { ScreenHeader } from '@/components/ui/layouts/ScreenHeader';
import { TokenIcon } from '@/components/wallet/token-icon';
import { NETWORKS } from '@/constants/networks';
import { useWallet } from '@/providers/wallet-provider';
import { getTokenChartData, getTokenPrice, type ChartPoint, type PriceInfo } from '@/services/price-service';
import { getTransactionHistory, supportsTransactionHistory } from '@/services/transaction-service';
import { useAppTheme } from '@/theme/theme';
import { Network, Transaction } from '@/types/wallet';

// ─── Chart helpers ────────────────────────────────────────────────────────────

const CHART_W = 350;
const CHART_H = 120;

type Range = '1H' | '1D' | '1W' | '1M' | '1Y';

const RANGE_TABS: { id: Range; label: string }[] = [
  { id: '1H', label: '1Ч' },
  { id: '1D', label: '1Д' },
  { id: '1W', label: '1Н' },
  { id: '1M', label: '1М' },
  { id: '1Y', label: '1Г' },
];

const RANGE_DATE_LABELS: Record<Range, [string, string]> = {
  '1H':  ['0:00', 'сейчас'],
  '1D':  ['00:00', '23:59'],
  '1W':  ['Пн', 'Вс'],
  '1M':  ['1-е', '30-е'],
  '1Y':  ['Янв', 'Дек'],
};

function fmtAxisDate(ts: number, range: Range): string {
  const d = new Date(ts);
  if (range === '1H' || range === '1D') return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (range === '1Y') return d.toLocaleDateString('ru-RU', { month: 'short' });
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

const RANGE_AXIS: Record<Range, string[]> = {
  '1H': ['0:00', '15м', '30м', '45м', 'сейчас'],
  '1D': ['00:00', '06:00', '12:00', '18:00', '23:59'],
  '1W': ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  '1M': ['1', '8', '15', '22', '30'],
  '1Y': ['Янв', 'Мар', 'Май', 'Авг', 'Дек'],
};

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i];
    const cpx = ((p.x + c.x) / 2).toFixed(1);
    d += ` C ${cpx} ${p.y.toFixed(1)}, ${cpx} ${c.y.toFixed(1)}, ${c.x.toFixed(1)} ${c.y.toFixed(1)}`;
  }
  return d;
}

// ─── PriceChart ───────────────────────────────────────────────────────────────

interface PriceChartProps {
  points: ChartPoint[];
  color: string;
  scrubIndex: number | null;
  onScrub: (index: number | null) => void;
}

const PriceChart = React.memo(function PriceChart({ points, color, scrubIndex, onScrub }: PriceChartProps) {
  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;

  const pts = prices.map((p, i) => ({
    x: (i / (prices.length - 1)) * CHART_W,
    y: 10 + (1 - (p - min) / span) * CHART_H,
  }));

  const line = smoothPath(pts);
  const last = pts[pts.length - 1];
  const fill = `${line} L ${CHART_W} ${CHART_H + 20} L 0 ${CHART_H + 20} Z`;
  const cursor = scrubIndex !== null ? pts[scrubIndex] : null;

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (evt) => {
        const x = Math.max(0, Math.min(CHART_W, evt.nativeEvent.locationX));
        onScrub(Math.round((x / CHART_W) * (points.length - 1)));
      },
      onPanResponderMove: (evt) => {
        const x = Math.max(0, Math.min(CHART_W, evt.nativeEvent.locationX));
        onScrub(Math.round((x / CHART_W) * (points.length - 1)));
      },
      onPanResponderRelease: () => onScrub(null),
      onPanResponderTerminate: () => onScrub(null),
    }),
  ).current;

  return (
    <View {...panResponder.panHandlers} style={{ width: CHART_W, height: CHART_H + 30 }}>
      <Svg width={CHART_W} height={CHART_H + 30}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.22} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={fill} fill="url(#grad)" />
        <Path d={line} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Конечная точка — скрываем во время скраба */}
        {!cursor && <Circle cx={last.x} cy={last.y} r={5} fill={color} />}

        {/* Курсор */}
        {cursor && (
          <>
            <Line x1={cursor.x} y1={0} x2={cursor.x} y2={CHART_H + 20}
              stroke={color} strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
            <Circle cx={cursor.x} cy={cursor.y} r={10} fill={color} opacity={0.18} />
            <Circle cx={cursor.x} cy={cursor.y} r={5} fill={color} />
          </>
        )}
      </Svg>
    </View>
  );
});

// ─── TxRow ────────────────────────────────────────────────────────────────────

function shortenAddr(addr: string) {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function fmtDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) +
    ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function fmtVal(v: string, dec = 4) {
  const n = parseFloat(v);
  if (isNaN(n) || n === 0) return '0';
  return n.toFixed(dec).replace(/\.?0+$/, '');
}

function TxRow({ tx, symbol, isLast }: { tx: Transaction; symbol: string; isLast: boolean }) {
  const incoming = tx.type === 'incoming';
  const failed = tx.status === 'failed';

  const iconName: any = failed ? 'close-outline' : incoming ? 'arrow-down-outline' : 'arrow-up-outline';
  const iconColor = failed ? '#6B7280' : incoming ? '#4CAF50' : '#FF5C5C';
  const iconBg   = failed ? '#1A0505' : incoming ? '#1A2E1A' : '#2E1A1A';
  const amtColor = failed ? '#6B7280' : incoming ? '#4CAF50' : '#FF5C5C';
  const prefix   = incoming ? '+' : '-';
  const title    = incoming ? `Получение ${symbol}` : `Отправка ${symbol}`;
  const addr     = incoming ? tx.from : tx.to;

  const onPress = () =>
    router.push({ pathname: '/transaction-detail', params: { hash: tx.hash, from: tx.from, to: tx.to, value: tx.value, network: tx.network, timestamp: String(tx.timestamp), status: tx.status, type: tx.type, fee: tx.fee ?? '' } });

  return (
    <>
      <Box row alignItems="center" gap={12} py={12} onPress={onPress}>
        <Box w={40} h={40} borderRadius={20} alignItems="center" justifyContent="center" backgroundColor={iconBg}>
          <Ionicons name={iconName} size={18} color={iconColor} />
        </Box>
        <Box flex gap={3}>
          <Text variant="p3-semibold" color="#fff">{title}</Text>
          <Text variant="caption" color="#7A7A9A">{shortenAddr(addr)} · {fmtDate(tx.timestamp)}</Text>
        </Box>
        <Box alignItems="flex-end" gap={3}>
          <Text variant="p3-semibold" color={amtColor}>{prefix}{fmtVal(tx.value)} {symbol}</Text>
        </Box>
      </Box>
      {!isLast && <Box h={StyleSheet.hairlineWidth} backgroundColor="#1E1E30" />}
    </>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TokenDetailScreen() {
  const { network: netParam } = useLocalSearchParams<{ network: string }>();
  const { colors, insets } = useAppTheme();
  const { getAccountsForCurrentMode } = useWallet();

  const network  = NETWORKS[netParam as Network];
  const accounts = getAccountsForCurrentMode();
  const account  = accounts.find((a) => a.network === netParam);

  const [priceInfo, setPriceInfo] = useState<PriceInfo>({ price: 0, change24h: 0 });
  const positive   = priceInfo.change24h >= 0;
  const chartColor = positive ? '#4F83F7' : '#EF4444';

  const [range, setRange]             = useState<Range>('1D');
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [scrubIndex, setScrubIndex]   = useState<number | null>(null);

  const handleRangeChange = (r: Range) => { setRange(r); setScrubIndex(null); };
  const [txs, setTxs]                 = useState<Transaction[]>([]);
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    getTokenPrice(netParam as Network).then((info) => {
      if (info) setPriceInfo(info);
    });
  }, [netParam]);

  useEffect(() => {
    setChartLoading(true);
    getTokenChartData(netParam as Network, range)
      .then(setChartPoints)
      .catch(() => setChartPoints([]))
      .finally(() => setChartLoading(false));
  }, [netParam, range]);

  const loadTxs = useCallback(async () => {
    if (!account || !supportsTransactionHistory(netParam as Network)) return;
    setLoading(true);
    try {
      const data = await getTransactionHistory(netParam as Network, account.address);
      setTxs(data.slice(0, 10));
    } catch {
      setTxs([]);
    } finally {
      setLoading(false);
    }
  }, [account, netParam]);

  useEffect(() => { loadTxs(); }, [loadTxs]);

  if (!network || !account) {
    return (
      <Box flex alignItems="center" justifyContent="center" backgroundColor={colors.background}>
        <Text variant="p3" colorName="label">Токен не найден</Text>
      </Box>
    );
  }

  const balNum  = parseFloat(account.balance);
  const usdVal  = balNum * priceInfo.price;
  const chgAmt  = usdVal * (priceInfo.change24h / 100);

  const scrubPoint  = scrubIndex !== null ? chartPoints[scrubIndex] : null;
  const displayPrice = scrubPoint?.price ?? priceInfo.price;
  const displayTime  = scrubPoint ? fmtAxisDate(scrubPoint.timestamp, range) : null;

  // Axis: 5 evenly-spaced labels from real timestamps, fallback to static
  const axisLabels: string[] = (() => {
    if (chartPoints.length < 2) return RANGE_AXIS[range];
    const n = 5;
    return Array.from({ length: n }, (_, i) => {
      const idx = Math.round((i / (n - 1)) * (chartPoints.length - 1));
      return fmtAxisDate(chartPoints[idx].timestamp, range);
    });
  })();

  const dateFrom = chartPoints.length > 0
    ? fmtAxisDate(chartPoints[0].timestamp, range)
    : RANGE_DATE_LABELS[range][0];
  const dateTo = chartPoints.length > 0
    ? fmtAxisDate(chartPoints[chartPoints.length - 1].timestamp, range)
    : RANGE_DATE_LABELS[range][1];

  return (
    <Box flex backgroundColor="#0D0D1C">
      <ScreenHeader
        title={network.name}
        right={<Ionicons name="ellipsis-horizontal" size={24} color="#fff" />}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrubIndex === null}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* ── Hero ── */}
        <Box alignItems="center" gap={4} px={20} pt={12} pb={20}>
          <TokenIcon symbol={network.symbol} networkId={network.id} size={56} />
          <Text variant="caption" color="#7A7A9A" mt={4}>
            {displayTime ?? network.name}
          </Text>
          <Text variant="h2" color="#fff">
            {displayPrice > 0 ? `$${displayPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
          </Text>
          {!scrubPoint && (
            <Box row alignItems="center" gap={4} px={10} py={4} borderRadius={20} backgroundColor={positive ? '#1A2E1A' : '#2E1A1A'}>
              <Ionicons name={positive ? 'trending-up' : 'trending-down'} size={14} color={positive ? '#4CAF50' : '#EF4444'} />
              <Text variant="caption-medium" color={positive ? '#4CAF50' : '#EF4444'}>
                {positive ? '+' : ''}{priceInfo.change24h.toFixed(2)}% за день
              </Text>
            </Box>
          )}
        </Box>

        {/* ── Chart ── */}
        <Box px={20} h={CHART_H + 30} alignItems="center" justifyContent="center">
          {chartLoading || chartPoints.length < 2
            ? <ActivityIndicator color={chartColor} />
            : <PriceChart points={chartPoints} color={chartColor} scrubIndex={scrubIndex} onScrub={setScrubIndex} />
          }
        </Box>

        {/* Axis labels */}
        <Box row justifyContent="space-between" px={20} mt={2}>
          {axisLabels.map((lbl, i) => (
            <Text key={i} variant="label" color="#4A4A6A">{lbl}</Text>
          ))}
        </Box>

        {/* Range date info */}
        <Box row justifyContent="space-between" alignItems="center" px={20} mt={6}>
          <Text variant="label" color="#5A5A7A">{dateFrom}</Text>
          <Text variant="label" color="#5A5A7A">─────────────</Text>
          <Text variant="label" color="#5A5A7A">{dateTo}</Text>
        </Box>

        {/* ── Range tabs ── */}
        <Box row justifyContent="space-between" px={20} mt={8} mb={16}>
          {RANGE_TABS.map(({ id, label }) => {
            const active = id === range;
            return (
              <TouchableOpacity key={id} onPress={() => handleRangeChange(id)} activeOpacity={0.8}>
                <Box w={52} h={36} borderRadius={10} alignItems="center" justifyContent="center"
                  backgroundColor={active ? '#4F83F7' : '#1E1E30'}>
                  <Text variant="p4-semibold" color={active ? '#fff' : '#7A7A9A'}>{label}</Text>
                </Box>
              </TouchableOpacity>
            );
          })}
        </Box>

        {/* ── Balance card ── */}
        <Box mx={20} mb={12} p={20} gap={4} borderRadius={16} backgroundColor="#141424">
          <Box row justifyContent="space-between" alignItems="center">
            <Text variant="caption" color="#7A7A9A">Мой баланс</Text>
            <Box row alignItems="center" gap={6} px={10} py={4} borderRadius={12} backgroundColor="#1E1E30">
              <Box w={8} h={8} borderRadius={4} backgroundColor="#627EEA" />
              <Text variant="caption" color="#A0A0C0">{network.symbol} · {network.name}</Text>
            </Box>
          </Box>

          <Text variant="h3" color="#fff" mt={4}>{balNum.toFixed(4)} {network.symbol}</Text>
          <Text variant="p3" color="#7A7A9A">
            ≈ {priceInfo.price > 0 ? `$${usdVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
          </Text>

          <Box h={1} backgroundColor="#252540" my={8} />

          <Box row justifyContent="space-between" alignItems="center">
            <Text variant="caption" color="#7A7A9A">За 24 часа</Text>
            <Box row alignItems="center" gap={6}>
              <Ionicons name={positive ? 'trending-up' : 'trending-down'} size={14} color={positive ? '#4CAF50' : '#EF4444'} />
              <Text variant="p3-semibold" color={positive ? '#4CAF50' : '#EF4444'}>
                {positive ? '+' : '-'}${Math.abs(chgAmt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text variant="caption" color={positive ? '#4CAF50' : '#EF4444'}>
                ({positive ? '+' : ''}{priceInfo.change24h.toFixed(2)}%)
              </Text>
            </Box>
          </Box>
        </Box>

        {/* ── Action row ── */}
        <Box row gap={12} px={20} mb={16}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/send')} activeOpacity={0.85}>
            <Box flex h={72} borderRadius={16} alignItems="center" justifyContent="center" gap={6} backgroundColor="#4F83F7">
              <Ionicons name="arrow-up-outline" size={22} color="#fff" />
              <Text variant="p4-semibold" color="#fff">Отправить</Text>
            </Box>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/receive')} activeOpacity={0.85}>
            <Box flex h={72} borderRadius={16} alignItems="center" justifyContent="center" gap={6} backgroundColor="#1E1E30">
              <Ionicons name="arrow-down-outline" size={22} color="#4F83F7" />
              <Text variant="p4-semibold" color="#fff">Получить</Text>
            </Box>
          </TouchableOpacity>
          <Box style={styles.actionBtn} h={72} borderRadius={16} alignItems="center" justifyContent="center" gap={6} backgroundColor="#1E1E30">
            <Ionicons name="swap-horizontal-outline" size={22} color="#4F83F7" />
            <Text variant="p4-semibold" color="#fff">Обменять</Text>
          </Box>
        </Box>

        {/* ── History ── */}
        <Box px={20}>
          <Box row justifyContent="space-between" alignItems="center" h={40}>
            <Text variant="p2-semibold" color="#fff">История операций</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')} activeOpacity={0.7}>
              <Text variant="p4" color="#4F83F7">Все</Text>
            </TouchableOpacity>
          </Box>

          {loading ? (
            <Box py={32} alignItems="center">
              <ActivityIndicator color={colors.primary} />
            </Box>
          ) : txs.length === 0 ? (
            <Box py={32} alignItems="center" gap={8}>
              <Box w={56} h={56} borderRadius={28} alignItems="center" justifyContent="center" backgroundColor="#161B22">
                <Ionicons name="receipt-outline" size={24} color="#374151" />
              </Box>
              <Text variant="p4" color="#6B7280">Нет транзакций</Text>
            </Box>
          ) : (
            txs.map((tx, i) => (
              <TxRow key={`${tx.hash}-${i}`} tx={tx} symbol={network.symbol} isLast={i === txs.length - 1} />
            ))
          )}
        </Box>
      </ScrollView>
    </Box>
  );
}

const styles = StyleSheet.create({
  actionBtn: { flex: 1 },
});
