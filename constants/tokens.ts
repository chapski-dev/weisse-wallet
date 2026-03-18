import { Network } from "@/types/wallet";

// Базовый URL Trust Wallet Assets CDN
const TW =
	"https://raw.githubusercontent.com/trustwallet/assets/master/blockchains";

/** Иконки по networkId — для сетей с неуникальным символом (Arbitrum/Optimism/Base = ETH) */
export const NETWORK_ICON_URLS: Partial<Record<Network, string>> = {
	[Network.ETHEREUM]: `${TW}/ethereum/info/logo.png`,
	[Network.POLYGON]: `${TW}/polygon/info/logo.png`,
	[Network.BSC]: `${TW}/smartchain/info/logo.png`,
	[Network.ARBITRUM]: `${TW}/arbitrum/info/logo.png`,
	[Network.OPTIMISM]: `${TW}/optimism/info/logo.png`,
	[Network.AVALANCHE]: `${TW}/avalanchec/info/logo.png`,
	[Network.BASE]: `${TW}/base/info/logo.png`,
	[Network.SOLANA]: `${TW}/solana/info/logo.png`,
	[Network.BITCOIN]: `${TW}/bitcoin/info/logo.png`,
	// Testnets — те же логотипы что и mainnet
	[Network.ETHEREUM_SEPOLIA]: `${TW}/ethereum/info/logo.png`,
	[Network.POLYGON_AMOY]: `${TW}/polygon/info/logo.png`,
	[Network.BSC_TESTNET]: `${TW}/smartchain/info/logo.png`,
	[Network.ARBITRUM_SEPOLIA]: `${TW}/arbitrum/info/logo.png`,
	[Network.OPTIMISM_SEPOLIA]: `${TW}/optimism/info/logo.png`,
	[Network.AVALANCHE_FUJI]: `${TW}/avalanchec/info/logo.png`,
	[Network.BASE_SEPOLIA]: `${TW}/base/info/logo.png`,
	[Network.SOLANA_DEVNET]: `${TW}/solana/info/logo.png`,
	[Network.BITCOIN_TESTNET]: `${TW}/bitcoin/info/logo.png`,
	[Network.STELLAR]: `${TW}/stellar/info/logo.png`,
	[Network.STELLAR_TESTNET]: `${TW}/stellar/info/logo.png`,
};

export interface TokenInfo {
	id: string;
	symbol: string;
	name: string;
	iconUrl: string;
}

export const TOKENS: Record<string, TokenInfo> = {
	// ─── Native coins ───────────────────────────────────────────────────────────
	ETH: {
		id: "ETH",
		symbol: "ETH",
		name: "Ethereum",
		iconUrl: `${TW}/ethereum/info/logo.png`,
	},
	BTC: {
		id: "BTC",
		symbol: "BTC",
		name: "Bitcoin",
		iconUrl: `${TW}/bitcoin/info/logo.png`,
	},
	SOL: {
		id: "SOL",
		symbol: "SOL",
		name: "Solana",
		iconUrl: `${TW}/solana/info/logo.png`,
	},
	BNB: {
		id: "BNB",
		symbol: "BNB",
		name: "BNB",
		iconUrl: `${TW}/smartchain/info/logo.png`,
	},
	AVAX: {
		id: "AVAX",
		symbol: "AVAX",
		name: "Avalanche",
		iconUrl: `${TW}/avalanchec/info/logo.png`,
	},
	MATIC: {
		id: "MATIC",
		symbol: "POL",
		name: "Polygon",
		iconUrl: `${TW}/polygon/info/logo.png`,
	},
	TON: {
		id: "TON",
		symbol: "TON",
		name: "Toncoin",
		iconUrl: `${TW}/ton/info/logo.png`,
	},
	XLM: {
		id: "XLM",
		symbol: "XLM",
		name: "Stellar",
		iconUrl: `${TW}/stellar/info/logo.png`,
	},
	TRX: {
		id: "TRX",
		symbol: "TRX",
		name: "TRON",
		iconUrl: `${TW}/tron/info/logo.png`,
	},

	// ─── Stablecoins (ERC-20) ───────────────────────────────────────────────────
	USDT: {
		id: "USDT",
		symbol: "USDT",
		name: "Tether USD",
		iconUrl: `${TW}/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png`,
	},
	USDC: {
		id: "USDC",
		symbol: "USDC",
		name: "USD Coin",
		iconUrl: `${TW}/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png`,
	},
	DAI: {
		id: "DAI",
		symbol: "DAI",
		name: "Dai",
		iconUrl: `${TW}/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png`,
	},

	// ─── Popular ERC-20 tokens ──────────────────────────────────────────────────
	XAUT: {
		id: "XAUT",
		symbol: "XAUT",
		name: "Tether Gold",
		iconUrl: `${TW}/ethereum/assets/0x68749665FF8D2d112Fa859AA293F07A622782F38/logo.png`,
	},
	LINK: {
		id: "LINK",
		symbol: "LINK",
		name: "Chainlink",
		iconUrl: `${TW}/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png`,
	},
	UNI: {
		id: "UNI",
		symbol: "UNI",
		name: "Uniswap",
		iconUrl: `${TW}/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png`,
	},
	SHIB: {
		id: "SHIB",
		symbol: "SHIB",
		name: "Shiba Inu",
		iconUrl: `${TW}/ethereum/assets/0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE/logo.png`,
	},
	PEPE: {
		id: "PEPE",
		symbol: "PEPE",
		name: "Pepe",
		iconUrl: `${TW}/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png`,
	},
	WBTC: {
		id: "WBTC",
		symbol: "WBTC",
		name: "Wrapped Bitcoin",
		iconUrl: `${TW}/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png`,
	},

	// ─── TON ecosystem ──────────────────────────────────────────────────────────
	NOT: {
		id: "NOT",
		symbol: "NOT",
		name: "Notcoin",
		iconUrl: `${TW}/ton/assets/EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT/logo.png`,
	},
	DOGS: {
		id: "DOGS",
		symbol: "DOGS",
		name: "DOGS",
		iconUrl: `${TW}/ton/assets/EQCvxJy4eG8hyHBFsZ7eePxrRsUQSFE_jpptRAYBmcG_DOGS/logo.png`,
	},
};

/** Иконка по символу токена (USDT, SOL, и т.д.) */
export function getTokenIconUrl(symbol: string): string | undefined {
	return TOKENS[symbol.toUpperCase()]?.iconUrl;
}

/** Иконка по networkId — всегда возвращает правильный логотип сети */
export function getNetworkIconUrl(networkId: Network): string | undefined {
	return NETWORK_ICON_URLS[networkId];
}
