import type { Network } from "@/types/wallet";

export type NFTNetwork = "ethereum" | "solana" | "polygon";

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

export const NETWORK_CFG: Record<
	NFTNetwork,
	{ bg: string; border: string; text: string; symbol: string; name: string }
> = {
	ethereum: {
		bg: "#1A2F4A",
		border: "#3B82F650",
		text: "#4B8EF5",
		symbol: "⟠",
		name: "Ethereum",
	},
	solana: {
		bg: "#1A1429",
		border: "#9945FF50",
		text: "#9945FF",
		symbol: "◎",
		name: "Solana",
	},
	polygon: {
		bg: "#1C1429",
		border: "#8247E550",
		text: "#8247E5",
		symbol: "🟣",
		name: "Polygon",
	},
};

export const NETWORK_STANDARD: Record<NFTNetwork, string> = {
	ethereum: "ERC-721",
	solana: "SPL",
	polygon: "ERC-721",
};

// ─── Module-level NFT cache ───────────────────────────────────────────────────
// Populated by the NFT tab screen when real NFTs are loaded.
// nft-detail and send-nft screens read from this cache.

let _nftCache: NFTItem[] = [];

export function setNFTCache(items: NFTItem[]): void {
	_nftCache = items;
}

export function getNFTCache(): NFTItem[] {
	return _nftCache;
}
