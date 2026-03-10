import { NETWORKS } from '@/constants/networks';
import { NFTItem, NFTNetwork } from '@/constants/nfts';
import { Network } from '@/types/wallet';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  arbitrum,
  arbitrumSepolia,
  avalanche,
  avalancheFuji,
  base,
  baseSepolia,
  bsc,
  bscTestnet,
  mainnet,
  optimism,
  optimismSepolia,
  polygon,
  polygonAmoy,
  sepolia,
} from 'viem/chains';

import { walletService } from './wallet-service';

// ─── Blockscout base URLs ─────────────────────────────────────────────────────

const BLOCKSCOUT_URLS: Partial<Record<Network, string>> = {
  [Network.ETHEREUM]: 'https://eth.blockscout.com',
  [Network.ETHEREUM_SEPOLIA]: 'https://eth-sepolia.blockscout.com',
  [Network.POLYGON]: 'https://polygon.blockscout.com',
  [Network.POLYGON_AMOY]: 'https://polygon-amoy.blockscout.com',
  [Network.BASE]: 'https://base.blockscout.com',
  [Network.BASE_SEPOLIA]: 'https://base-sepolia.blockscout.com',
  [Network.ARBITRUM]: 'https://arbitrum.blockscout.com',
  [Network.ARBITRUM_SEPOLIA]: 'https://arbitrum-sepolia.blockscout.com',
  [Network.OPTIMISM]: 'https://optimism.blockscout.com',
  [Network.OPTIMISM_SEPOLIA]: 'https://optimism-sepolia.blockscout.com',
};

// ─── NFTNetwork display mapping ───────────────────────────────────────────────

const NETWORK_TO_NFT_NETWORK: Partial<Record<Network, NFTNetwork>> = {
  [Network.ETHEREUM]: 'ethereum',
  [Network.ETHEREUM_SEPOLIA]: 'ethereum',
  [Network.POLYGON]: 'polygon',
  [Network.POLYGON_AMOY]: 'polygon',
  [Network.BASE]: 'ethereum',
  [Network.BASE_SEPOLIA]: 'ethereum',
  [Network.ARBITRUM]: 'ethereum',
  [Network.ARBITRUM_SEPOLIA]: 'ethereum',
  [Network.OPTIMISM]: 'ethereum',
  [Network.OPTIMISM_SEPOLIA]: 'ethereum',
};

// ─── viem chain map ───────────────────────────────────────────────────────────

const VIEM_CHAINS: Partial<Record<Network, any>> = {
  [Network.ETHEREUM]: mainnet,
  [Network.ETHEREUM_SEPOLIA]: sepolia,
  [Network.POLYGON]: polygon,
  [Network.POLYGON_AMOY]: polygonAmoy,
  [Network.BASE]: base,
  [Network.BASE_SEPOLIA]: baseSepolia,
  [Network.ARBITRUM]: arbitrum,
  [Network.ARBITRUM_SEPOLIA]: arbitrumSepolia,
  [Network.OPTIMISM]: optimism,
  [Network.OPTIMISM_SEPOLIA]: optimismSepolia,
  [Network.AVALANCHE]: avalanche,
  [Network.AVALANCHE_FUJI]: avalancheFuji,
  [Network.BSC]: bsc,
  [Network.BSC_TESTNET]: bscTestnet,
};

// ─── ERC-721 minimal ABI ──────────────────────────────────────────────────────

const ERC721_ABI = [
  {
    name: 'safeTransferFrom',
    type: 'function',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

// ─── Bg colors for NFT cards ──────────────────────────────────────────────────

const BG_COLORS = [
  '#0D1B2A', '#1A0D2A', '#0D1A1A', '#160D2A', '#1A160A', '#0A1A0A',
  '#1A1A0D', '#0D0D1A', '#1A0D0D', '#0A0A1A',
];

function bgForIndex(i: number) {
  return BG_COLORS[i % BG_COLORS.length];
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function supportsNFTFetch(network: Network): boolean {
  return network in BLOCKSCOUT_URLS;
}

export async function fetchNFTs(network: Network, address: string): Promise<NFTItem[]> {
  const baseUrl = BLOCKSCOUT_URLS[network];
  if (!baseUrl) return [];

  const url = `${baseUrl}/api/v2/addresses/${address}/nft?type=ERC-721`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) return [];

  const json = await res.json();
  const items: any[] = json.items ?? [];
  console.log("items correct => ", items)
  const nftNetwork: NFTNetwork = NETWORK_TO_NFT_NETWORK[network] ?? 'ethereum';

  return items.map((item: any, index: number): NFTItem => {
    const tokenId: string = String(item.id ?? index);
    const token = item.token ?? {};
    const metadata = item.metadata ?? {};

    return {
      id: `${token.address}_${tokenId}`,
      name: metadata.name ?? `${token.name ?? 'NFT'} #${tokenId}`,
      collection: token.name ?? 'Unknown Collection',
      network: nftNetwork,
      networkId: network,
      emoji: '🖼️',
      bgColor: bgForIndex(index),
      contractAddress: token.address_hash ?? '',
      tokenId: `#${tokenId}`,
      tokenIdRaw: tokenId,
      standard: token.type ?? 'ERC-721',
      imageUrl: item.image_url ?? metadata.image,
    };
  });
}

export async function sendERC721(
  network: Network,
  contractAddress: string,
  tokenIdRaw: string,
  fromAddress: string,
  toAddress: string,
): Promise<string> {
  const networkInfo = NETWORKS[network];
  if (!networkInfo?.isEVM) throw new Error('Not an EVM network');

  const chain = VIEM_CHAINS[network];
  if (!chain) throw new Error(`Unsupported network for NFT send: ${network}`);

  const { privateKey } = await walletService.getEVMWallet(network);
  const account = privateKeyToAccount(privateKey);

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(networkInfo.rpcUrl),
  });

  const hash = await walletClient.writeContract({
    address: contractAddress as `0x${string}`,
    abi: ERC721_ABI,
    functionName: 'safeTransferFrom',
    args: [
      fromAddress as `0x${string}`,
      toAddress as `0x${string}`,
      BigInt(tokenIdRaw),
    ],
    chain: undefined
  });

  return hash;
}
