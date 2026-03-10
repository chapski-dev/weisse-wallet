import { Network } from '@/types/wallet';

// ─── CoinGecko mapping ────────────────────────────────────────────────────────

/** CoinGecko coin ID для каждой сети (native token) */
const COINGECKO_ID: Partial<Record<Network, string>> = {
  // Mainnets
  [Network.ETHEREUM]:   'ethereum',
  [Network.BITCOIN]:    'bitcoin',
  [Network.SOLANA]:     'solana',
  [Network.BSC]:        'binancecoin',
  [Network.POLYGON]:    'matic-network',
  [Network.AVALANCHE]:  'avalanche-2',
  [Network.ARBITRUM]:   'arbitrum',   
  [Network.OPTIMISM]:   'optimism',   
  [Network.BASE]:       'base',   
  // Testnets → те же монеты
  [Network.ETHEREUM_SEPOLIA]:  'ethereum',
  [Network.BITCOIN_TESTNET]:   'bitcoin',
  [Network.SOLANA_DEVNET]:     'solana',
  [Network.BSC_TESTNET]:       'binancecoin',
  [Network.POLYGON_AMOY]:      'matic-network',
  [Network.AVALANCHE_FUJI]:    'avalanche-2',
  [Network.ARBITRUM_SEPOLIA]:  'arbitrum',
  [Network.OPTIMISM_SEPOLIA]:  'optimism',
  [Network.BASE_SEPOLIA]:      'base',
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PriceInfo {
  price: number;
  change24h: number;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

const TTL_MS = 5 * 60 * 1000; // 5 минут

interface CacheEntry {
  data: Record<string, PriceInfo>;
  ts: number;
}

let cache: CacheEntry | null = null;
let inflight: Promise<Record<string, PriceInfo>> | null = null;

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchAllPrices(): Promise<Record<string, PriceInfo>> {
  const ids = [...new Set(Object.values(COINGECKO_ID))].join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const json = await res.json() as Record<string, { usd: number; usd_24h_change: number }>;

    const result: Record<string, PriceInfo> = {};
    for (const [id, val] of Object.entries(json)) {
      result[id] = {
        price:     val.usd           ?? 0,
        change24h: val.usd_24h_change ?? 0,
      };
    }
    return result;
  } finally {
    clearTimeout(timeout);
  }
}

async function getPrices(): Promise<Record<string, PriceInfo>> {
  if (cache && Date.now() - cache.ts < TTL_MS) return cache.data;

  if (!inflight) {
    inflight = fetchAllPrices()
      .then((data) => {
        cache = { data, ts: Date.now() };
        inflight = null;
        return data;
      })
      .catch((err) => {
        inflight = null;
        throw err;
      });
  }

  return inflight;
}

// ─── Public API: spot price ───────────────────────────────────────────────────

/**
 * Получить цену и изменение за 24ч для конкретной сети.
 * Возвращает null если сеть неизвестна или запрос упал.
 */
export async function getTokenPrice(network: Network): Promise<PriceInfo | null> {
  const coinId = COINGECKO_ID[network];
  if (!coinId) return null;

  try {
    const prices = await getPrices();
    return prices[coinId] ?? null;
  } catch {
    return null;
  }
}

/** Инвалидировать кэш (принудительное обновление при следующем вызове) */
export function invalidatePriceCache(): void {
  cache = null;
  chartCache.clear();
}

// ─── Chart history ────────────────────────────────────────────────────────────

export interface ChartPoint {
  timestamp: number;
  price: number;
}

/**
 * days → granularity (CoinGecko free tier):
 *   days=1   → ~5-минутные точки (288 шт за 24ч)
 *   days≤90  → почасовые точки
 *   days>90  → дневные точки
 */
const RANGE_DAYS: Record<string, number> = {
  '1H':  1,
  '1D':  1,
  '1W':  7,
  '1M':  30,
  '1Y':  365,
};

/** Сколько точек брать с конца для каждого диапазона (после получения массива) */
const RANGE_SLICE: Record<string, number> = {
  '1H':  12,   // 12 × 5 мин = последний час
  '1D':  288,  // все точки за 24ч
  '1W':  168,  // 7 × 24 ч
  '1M':  30,
  '1Y':  365,
};

const chartCache = new Map<string, { data: ChartPoint[]; ts: number }>();
const inflightChart = new Map<string, Promise<ChartPoint[]>>();

async function fetchChartData(coinId: string, days: number): Promise<ChartPoint[]> {
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`CoinGecko chart ${res.status}`);
    const json = await res.json() as { prices: [number, number][] };
    return json.prices.map(([ts, price]) => ({ timestamp: ts, price }));
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Получить массив исторических цен для графика.
 * range: '1H' | '1D' | '1W' | '1M' | '1Y'
 */
export async function getTokenChartData(network: Network, range: string): Promise<ChartPoint[]> {
  const coinId = COINGECKO_ID[network];
  if (!coinId) return [];

  const cacheKey = `${coinId}-${range}`;
  const cached = chartCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL_MS) return cached.data;

  if (!inflightChart.has(cacheKey)) {
    const days = RANGE_DAYS[range] ?? 1;
    const promise = fetchChartData(coinId, days)
      .then((all) => {
        const slice = RANGE_SLICE[range] ?? all.length;
        const data = all.slice(-slice);
        chartCache.set(cacheKey, { data, ts: Date.now() });
        inflightChart.delete(cacheKey);
        return data;
      })
      .catch((err) => {
        inflightChart.delete(cacheKey);
        throw err;
      });
    inflightChart.set(cacheKey, promise);
  }

  return inflightChart.get(cacheKey)!;
}
