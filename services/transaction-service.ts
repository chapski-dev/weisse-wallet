import { formatEther } from 'viem';

import { Network, Transaction } from '@/types/wallet';

const BLOCKSCOUT_URLS: Partial<Record<Network, string>> = {
  // Mainnets
  [Network.ETHEREUM]: 'https://eth.blockscout.com',
  [Network.POLYGON]: 'https://polygon.blockscout.com',
  [Network.BSC]: 'https://bsc.blockscout.com',
  [Network.ARBITRUM]: 'https://arbitrum.blockscout.com',
  [Network.OPTIMISM]: 'https://optimism.blockscout.com',
  [Network.BASE]: 'https://base.blockscout.com',
  // Testnets
  [Network.ETHEREUM_SEPOLIA]: 'https://eth-sepolia.blockscout.com',
  [Network.POLYGON_AMOY]: 'https://polygon-amoy.blockscout.com',
  [Network.BSC_TESTNET]: 'https://bsc-testnet.blockscout.com',
  [Network.ARBITRUM_SEPOLIA]: 'https://arbitrum-sepolia.blockscout.com',
  [Network.OPTIMISM_SEPOLIA]: 'https://optimism-sepolia.blockscout.com',
  [Network.BASE_SEPOLIA]: 'https://base-sepolia.blockscout.com',
};

export function supportsTransactionHistory(network: Network): boolean {
  return network in BLOCKSCOUT_URLS;
}

export async function getTransactionHistory(
  network: Network,
  address: string,
  limit = 25,
): Promise<Transaction[]> {
  const baseUrl = BLOCKSCOUT_URLS[network];
  if (!baseUrl) return [];

  const url = `${baseUrl}/api/v2/addresses/${address}/transactions`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Blockscout ${res.status}: ${body.slice(0, 120)}`);
  }

  const json = await res.json();
  const items: any[] = (json.items ?? []).slice(0, limit);
  const lowerAddress = address.toLowerCase();

  return items.map((item): Transaction => {
    const fromHash: string = item.from?.hash ?? '';
    const toHash: string = item.to?.hash ?? '';

    let value = '0';
    try {
      value = formatEther(BigInt(item.value ?? '0'));
    } catch {}

    let fee: string | undefined;
    try {
      if (item.fee?.value) {
        fee = formatEther(BigInt(item.fee.value));
      }
    } catch {}

    const rawStatus: string = item.status ?? '';
    const status: Transaction['status'] =
      rawStatus === 'ok' ? 'confirmed' : rawStatus === 'error' ? 'failed' : 'pending';

    return {
      hash: item.hash,
      from: fromHash,
      to: toHash,
      value,
      fee,
      network,
      timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now(),
      status,
      type: fromHash.toLowerCase() === lowerAddress ? 'outgoing' : 'incoming',
    };
  });
}
