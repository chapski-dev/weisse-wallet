// Поддерживаемые блокчейн сети
export enum Network {
	// Mainnets
	ETHEREUM = "ethereum",
	POLYGON = "polygon",
	BSC = "bsc",
	ARBITRUM = "arbitrum",
	OPTIMISM = "optimism",
	AVALANCHE = "avalanche",
	BASE = "base",
	SOLANA = "solana",
	BITCOIN = "bitcoin",

	// Testnets
	ETHEREUM_SEPOLIA = "ethereum_sepolia",
	POLYGON_AMOY = "polygon_amoy",
	BSC_TESTNET = "bsc_testnet",
	ARBITRUM_SEPOLIA = "arbitrum_sepolia",
	OPTIMISM_SEPOLIA = "optimism_sepolia",
	AVALANCHE_FUJI = "avalanche_fuji",
	BASE_SEPOLIA = "base_sepolia",
	SOLANA_DEVNET = "solana_devnet",
	BITCOIN_TESTNET = "bitcoin_testnet",
}

// Тип режима сети
export type NetworkMode = "mainnet" | "testnet";

// Маппинг mainnet -> testnet
export const TESTNET_MAP: Partial<Record<Network, Network>> = {
	[Network.ETHEREUM]: Network.ETHEREUM_SEPOLIA,
	[Network.POLYGON]: Network.POLYGON_AMOY,
	[Network.BSC]: Network.BSC_TESTNET,
	[Network.ARBITRUM]: Network.ARBITRUM_SEPOLIA,
	[Network.OPTIMISM]: Network.OPTIMISM_SEPOLIA,
	[Network.AVALANCHE]: Network.AVALANCHE_FUJI,
	[Network.BASE]: Network.BASE_SEPOLIA,
	[Network.SOLANA]: Network.SOLANA_DEVNET,
	[Network.BITCOIN]: Network.BITCOIN_TESTNET,
};

// Маппинг testnet -> mainnet
export const MAINNET_MAP: Partial<Record<Network, Network>> = {
	[Network.ETHEREUM_SEPOLIA]: Network.ETHEREUM,
	[Network.POLYGON_AMOY]: Network.POLYGON,
	[Network.BSC_TESTNET]: Network.BSC,
	[Network.ARBITRUM_SEPOLIA]: Network.ARBITRUM,
	[Network.OPTIMISM_SEPOLIA]: Network.OPTIMISM,
	[Network.AVALANCHE_FUJI]: Network.AVALANCHE,
	[Network.BASE_SEPOLIA]: Network.BASE,
	[Network.SOLANA_DEVNET]: Network.SOLANA,
	[Network.BITCOIN_TESTNET]: Network.BITCOIN,
};

// Информация о сети
export interface NetworkInfo {
	id: Network;
	name: string;
	symbol: string;
	chainId?: number; // Для EVM сетей
	rpcUrl: string;
	explorerUrl: string;
	icon: string;
	isEVM: boolean;
	decimals: number;
	derivationPath: string;
	isTestnet: boolean;
}

// Кошелек в конкретной сети
export interface WalletAccount {
	network: Network;
	address: string;
	balance: string;
	publicKey?: string;
}

// Основной кошелек (хранит seed фразу)
export interface MasterWallet {
	id: string;
	name: string;
	createdAt: number;
	accounts: WalletAccount[];
}

// Транзакция
export interface Transaction {
	hash: string;
	from: string;
	to: string;
	value: string;
	network: Network;
	timestamp: number;
	status: "pending" | "confirmed" | "failed";
	type: "incoming" | "outgoing";
	fee?: string;
}
