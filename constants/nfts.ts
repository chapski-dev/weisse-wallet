import { Network } from '@/types/wallet';

export type NFTNetwork = 'ethereum' | 'solana' | 'polygon';

export interface NFTItem {
  id: string;
  name: string;
  collection: string;
  network: NFTNetwork;
  /** Actual Network enum value — set for real on-chain NFTs */
  networkId?: Network;
  emoji: string;
  bgColor: string;
  contractAddress: string;
  tokenId: string;
  /** Raw numeric token ID for contract calls */
  tokenIdRaw?: string;
  standard: string;
  imageUrl?: string;
}

export const NETWORK_CFG: Record<NFTNetwork, { bg: string; border: string; text: string; symbol: string; name: string }> = {
  ethereum: { bg: '#1A2F4A', border: '#3B82F650', text: '#4B8EF5', symbol: '⟠', name: 'Ethereum' },
  solana:   { bg: '#1A1429', border: '#9945FF50', text: '#9945FF', symbol: '◎', name: 'Solana'   },
  polygon:  { bg: '#1C1429', border: '#8247E550', text: '#8247E5', symbol: '🟣', name: 'Polygon' },
};

export const NETWORK_STANDARD: Record<NFTNetwork, string> = {
  ethereum: 'ERC-721',
  solana:   'SPL',
  polygon:  'ERC-721',
};

export const MOCK_NFTS: NFTItem[] = [
  {
    id: '1',
    name: 'Cosmic #247',
    collection: 'Cosmic Collection',
    network: 'ethereum',
    networkId: Network.ETHEREUM,
    emoji: '🌌',
    bgColor: '#0D1B2A',
    contractAddress: '0x1a2b...3c4d',
    tokenId: '#247',
    tokenIdRaw: '247',
    standard: 'ERC-721',
  },
  {
    id: '2',
    name: 'PixelHero #33',
    collection: 'Pixel Heroes',
    network: 'solana',
    emoji: '🦸',
    bgColor: '#1A0D2A',
    contractAddress: 'PixH...33ab',
    tokenId: '#33',
    tokenIdRaw: '33',
    standard: 'SPL',
  },
  {
    id: '3',
    name: 'CyberBot #91',
    collection: 'CyberBots',
    network: 'ethereum',
    networkId: Network.ETHEREUM,
    emoji: '🤖',
    bgColor: '#0D1A1A',
    contractAddress: '0x9b1c...7e2f',
    tokenId: '#91',
    tokenIdRaw: '91',
    standard: 'ERC-721',
  },
  {
    id: '4',
    name: 'GeomArt #15',
    collection: 'Geometry Art',
    network: 'polygon',
    networkId: Network.POLYGON,
    emoji: '🔷',
    bgColor: '#160D2A',
    contractAddress: '0x4f3a...8d1c',
    tokenId: '#15',
    tokenIdRaw: '15',
    standard: 'ERC-721',
  },
  {
    id: '5',
    name: 'StarDust #4',
    collection: 'StarDust NFT',
    network: 'solana',
    emoji: '✨',
    bgColor: '#1A160A',
    contractAddress: 'StDu...04cd',
    tokenId: '#4',
    tokenIdRaw: '4',
    standard: 'SPL',
  },
  {
    id: '6',
    name: 'NeonApe #112',
    collection: 'Neon Apes',
    network: 'ethereum',
    networkId: Network.ETHEREUM,
    emoji: '🦍',
    bgColor: '#0A1A0A',
    contractAddress: '0x7c4e...2b9a',
    tokenId: '#112',
    tokenIdRaw: '112',
    standard: 'ERC-721',
  },
];

// ─── Module-level NFT cache ───────────────────────────────────────────────────
// Populated by the NFT tab screen when real NFTs are loaded.
// nft-detail and send-nft screens read from this cache.

let _nftCache: NFTItem[] = MOCK_NFTS;

export function setNFTCache(items: NFTItem[]): void {
  _nftCache = items;
}

export function getNFTCache(): NFTItem[] {
  return _nftCache;
}
