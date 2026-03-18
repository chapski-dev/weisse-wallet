// Ensure polyfills are loaded first

import * as ecc from "@bitcoinerlab/secp256k1";
import {
	Account as StellarAccount,
	Asset,
	BASE_FEE,
	Keypair as StellarKeypair,
	Networks as StellarNetworks,
	Operation,
	TransactionBuilder,
} from "@stellar/stellar-base";
import { BIP32Factory } from "bip32";
import * as bip39 from "bip39";
import * as bitcoin from "bitcoinjs-lib";
import { Buffer } from "buffer";
import { hmac } from "@noble/hashes/hmac";
import { sha512 } from "@noble/hashes/sha512";
import * as Crypto from "expo-crypto";
import {
	createPublicClient,
	createWalletClient,
	formatEther,
	http,
	parseEther,
} from "viem";
import { mnemonicToAccount, privateKeyToAccount } from "viem/accounts";
import {
	arbitrum,
	arbitrumSepolia,
	avalanche,
	avalancheFuji,
	base,
	baseSepolia,
	bsc,
	bscTestnet,
	type Chain,
	mainnet,
	optimism,
	optimismSepolia,
	polygon,
	polygonAmoy,
	sepolia,
} from "viem/chains";
import { NETWORKS } from "@/constants/networks";
import { type MasterWallet, Network, type WalletAccount } from "@/types/wallet";
import { secureStorage } from "@/utils/secure-storage";
global.Buffer = global.Buffer || Buffer;

const MNEMONIC_KEY = "wallet_mnemonic";
const WALLET_DATA_KEY = "wallet_data";

// Multi-wallet storage keys
const WALLETS_LIST_KEY = "wallets_list";
const ACTIVE_WALLET_ID_KEY = "active_wallet_id";
const MNEMONIC_PREFIX = "mnemonic_";

class WalletService {
	private mnemonic: string | null = null;

	// Генерация новой seed фразы (12 или 24 слова)
	generateMnemonic(strength: 128 | 256 = 128): string {
		// Используем expo-crypto для генерации криптографически безопасных случайных байтов
		// strength 128 = 12 слов (16 байт), strength 256 = 24 слова (32 байта)
		const byteLength = strength / 8;
		const randomBytes = Crypto.getRandomBytes(byteLength);
		return bip39.entropyToMnemonic(Buffer.from(randomBytes));
	}

	// Проверка валидности seed фразы
	validateMnemonic(mnemonic: string): boolean {
		return bip39.validateMnemonic(mnemonic);
	}

	// Сохранение seed фразы в защищенное хранилище
	async saveMnemonic(mnemonic: string): Promise<void> {
		if (!this.validateMnemonic(mnemonic)) {
			throw new Error("Invalid mnemonic phrase");
		}
		await secureStorage.setItemAsync(MNEMONIC_KEY, mnemonic);
		this.mnemonic = mnemonic;
	}

	// Загрузка seed фразы из хранилища (активного кошелька)
	async loadMnemonic(): Promise<string | null> {
		if (this.mnemonic) return this.mnemonic;
		const activeId = await this.getActiveWalletId();
		if (activeId) {
			this.mnemonic = await this.loadMnemonicForWallet(activeId);
			if (this.mnemonic) return this.mnemonic;
		}
		// Fall back to legacy key
		this.mnemonic = await secureStorage.getItemAsync(MNEMONIC_KEY);
		return this.mnemonic;
	}

	// Проверка наличия кошелька
	async hasWallet(): Promise<boolean> {
		return this.hasAnyWallet();
	}

	// Удаление кошелька
	async deleteWallet(): Promise<void> {
		await secureStorage.deleteItemAsync(MNEMONIC_KEY);
		await secureStorage.deleteItemAsync(WALLET_DATA_KEY);
		this.mnemonic = null;
	}

	// Маппинг сетей на viem chains
	private getViemChain(network: Network): Chain {
		const chainMap: Partial<Record<Network, Chain>> = {
			// Mainnets
			[Network.ETHEREUM]: mainnet,
			[Network.POLYGON]: polygon,
			[Network.BSC]: bsc,
			[Network.ARBITRUM]: arbitrum,
			[Network.OPTIMISM]: optimism,
			[Network.AVALANCHE]: avalanche,
			[Network.BASE]: base,
			// Testnets
			[Network.ETHEREUM_SEPOLIA]: sepolia,
			[Network.POLYGON_AMOY]: polygonAmoy,
			[Network.BSC_TESTNET]: bscTestnet,
			[Network.ARBITRUM_SEPOLIA]: arbitrumSepolia,
			[Network.OPTIMISM_SEPOLIA]: optimismSepolia,
			[Network.AVALANCHE_FUJI]: avalancheFuji,
			[Network.BASE_SEPOLIA]: baseSepolia,
		};
		return chainMap[network] || mainnet;
	}

	// Получение EVM кошелька (Ethereum, Polygon, BSC и т.д.)
	async getEVMWallet(
		network: Network,
	): Promise<{ address: string; privateKey: `0x${string}` }> {
		const mnemonic = await this.loadMnemonic();
		if (!mnemonic) {
			throw new Error("No mnemonic found");
		}

		const networkInfo = NETWORKS[network];
		if (!networkInfo.isEVM) {
			throw new Error("Not an EVM network");
		}

		// Создаем аккаунт из mnemonic с использованием viem
		const account = mnemonicToAccount(mnemonic, {
			path: networkInfo.derivationPath as `m/44'/60'/${string}`,
		});

		return {
			address: account.address,
			privateKey: account.getHdKey().privateKey
				? (`0x${Buffer.from(account.getHdKey().privateKey!).toString("hex")}` as `0x${string}`)
				: ("0x" as `0x${string}`),
		};
	}

	// Получение Solana кошелька
	// async getSolanaWallet(): Promise<{ address: string; publicKey: string }> {
	//   const mnemonic = await this.loadMnemonic();
	//   if (!mnemonic) {
	//     throw new Error('No mnemonic found');
	//   }

	//   // Solana использует ed25519 с derivation path m/44'/501'/0'/0'
	//   const seed = await bip39.mnemonicToSeed(mnemonic);
	//   const derivationPath = "m/44'/501'/0'/0'";

	//   // Используем ed25519-hd-key для derivation
	//   const derived = derivePath(derivationPath, seed.toString('hex'));
	//   const keypair = Keypair.fromSeed(derived.key);

	//   return {
	//     address: keypair.publicKey.toBase58(),
	//     publicKey: keypair.publicKey.toBase58(),
	//   };
	// }

	// Получение Bitcoin адреса (Native SegWit - bc1q)
	async getBitcoinWallet(): Promise<{ address: string }> {
		const mnemonic = await this.loadMnemonic();
		if (!mnemonic) {
			throw new Error("No mnemonic found");
		}

		// Инициализируем bip32 с secp256k1
		const bip32 = BIP32Factory(ecc);

		// Получаем seed из mnemonic
		const seed = await bip39.mnemonicToSeed(mnemonic);

		// Создаем master key и derive по BIP84 path (Native SegWit)
		const root = bip32.fromSeed(seed);
		const child = root.derivePath("m/84'/0'/0'/0/0");

		// Создаем Native SegWit (bech32) адрес
		const { address } = bitcoin.payments.p2wpkh({
			pubkey: Buffer.from(child.publicKey),
			network: bitcoin.networks.bitcoin,
		});

		if (!address) {
			throw new Error("Failed to generate Bitcoin address");
		}

		return { address };
	}

	// Получение TRON кошелька
	// async getTronWallet(): Promise<{ address: string }> {
	//   const mnemonic = await this.loadMnemonic();
	//   if (!mnemonic) {
	//     throw new Error('No mnemonic found');
	//   }

	//   // TRON использует тот же secp256k1 что и Ethereum
	//   // Но с другим derivation path и Base58Check кодировкой
	//   const hdNode = HDNodeWallet.fromPhrase(mnemonic, undefined, "m/44'/195'/0'/0/0");

	//   // Получаем приватный ключ без 0x
	//   const privateKey = hdNode.privateKey.slice(2);

	//   // TronWeb конвертирует приватный ключ в TRON адрес
	//   const address = TronWeb.address.fromPrivateKey(privateKey);

	//   if (!address) {
	//     throw new Error('Failed to generate TRON address');
	//   }

	//   return { address };
	// }

	// SEP-0005 / SLIP-0010 ed25519 HD derivation — pure JS, no Node.js crypto
	// Replaces ed25519-hd-key which depends on Node.js createHmac
	private deriveStellarKey(path: string, seedHex: string): Uint8Array {
		const MASTER_SECRET = new TextEncoder().encode("ed25519 seed");
		const HARDENED_OFFSET = 0x80000000;
		const seedBytes = Buffer.from(seedHex, "hex");

		let I = hmac(sha512, MASTER_SECRET, seedBytes);
		let key = I.slice(0, 32);
		let chainCode = I.slice(32);

		for (const segment of path.replace("m/", "").split("/")) {
			const hardened = segment.endsWith("'");
			const index =
				(Number.parseInt(segment, 10) + (hardened ? HARDENED_OFFSET : 0)) >>> 0;
			const data = new Uint8Array(37);
			data[0] = 0x00;
			data.set(key, 1);
			data[33] = (index >>> 24) & 0xff;
			data[34] = (index >>> 16) & 0xff;
			data[35] = (index >>> 8) & 0xff;
			data[36] = index & 0xff;
			I = hmac(sha512, chainCode, data);
			key = I.slice(0, 32);
			chainCode = I.slice(32);
		}
		return key;
	}

	// Получение Stellar кошелька (SEP-0005: ed25519, m/44'/148'/0')
	async getStellarWallet(): Promise<{
		address: string;
		publicKey: string;
		secretKey: string;
	}> {
		const mnemonic = await this.loadMnemonic();
		if (!mnemonic) {
			throw new Error("No mnemonic found");
		}
		const seed = await bip39.mnemonicToSeed(mnemonic);
		const key = this.deriveStellarKey("m/44'/148'/0'", seed.toString("hex"));
		const keypair = StellarKeypair.fromRawEd25519Seed(Buffer.from(key));
		return {
			address: keypair.publicKey(),
			publicKey: keypair.publicKey(),
			secretKey: keypair.secret(),
		};
	}

	// Получение баланса Stellar (Horizon REST API)
	async getStellarBalance(network: Network, address: string): Promise<string> {
		const { rpcUrl } = NETWORKS[network];
		try {
			const res = await fetch(`${rpcUrl}/accounts/${address}`);
			if (res.status === 404) return "0"; // аккаунт не пополнен
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			const native = (
				data.balances as Array<{ asset_type: string; balance: string }>
			)?.find((b) => b.asset_type === "native");
			return native?.balance ?? "0";
		} catch (error) {
			console.error(`Failed to get Stellar balance for ${network}:`, error);
			return "0";
		}
	}

	// Отправка Stellar транзакции
	async sendStellarTransaction(
		network: Network,
		to: string,
		amount: string,
	): Promise<string> {
		const { rpcUrl } = NETWORKS[network];
		const { address, secretKey } = await this.getStellarWallet();
		const keypair = StellarKeypair.fromSecret(secretKey);

		// Получаем данные аккаунта (нужен sequence number)
		const accRes = await fetch(`${rpcUrl}/accounts/${address}`);
		if (!accRes.ok) {
			throw new Error("Sender account not found. Fund it first.");
		}
		const accData = await accRes.json();
		const sourceAccount = new StellarAccount(accData.id, accData.sequence);

		const networkPassphrase =
			network === Network.STELLAR
				? StellarNetworks.PUBLIC
				: StellarNetworks.TESTNET;

		// Строим транзакцию (amount — строка с ≤7 знаками после запятой)
		const xlmAmount = Number.parseFloat(amount).toFixed(7);
		const transaction = new TransactionBuilder(sourceAccount, {
			fee: BASE_FEE,
			networkPassphrase,
		})
			.addOperation(
				Operation.payment({
					destination: to,
					asset: Asset.native(),
					amount: xlmAmount,
				}),
			)
			.setTimeout(30)
			.build();

		transaction.sign(keypair);

		// Отправляем как base64 XDR через form-encoded POST
		const xdr = transaction.toEnvelope().toXDR("base64");
		const submitRes = await fetch(`${rpcUrl}/transactions`, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: `tx=${encodeURIComponent(xdr)}`,
		});

		const result = await submitRes.json();
		if (!submitRes.ok) {
			const code = result?.extras?.result_codes?.transaction;
			throw new Error(
				code ?? result?.detail ?? "Transaction failed",
			);
		}
		return result.hash as string;
	}

	// Создание аккаунтов во всех сетях
	async createAccountsForAllNetworks(): Promise<WalletAccount[]> {
		const accounts: WalletAccount[] = [];

		// EVM сети (один адрес для всех)
		const evmWallet = await this.getEVMWallet(Network.ETHEREUM);

		for (const network of Object.values(NETWORKS)) {
			if (network.isEVM) {
				accounts.push({
					network: network.id,
					address: evmWallet.address,
					balance: "0",
				});
			}
		}

		// Solana
		// try {
		//   const solanaWallet = await this.getSolanaWallet();
		//   accounts.push({
		//     network: Network.SOLANA,
		//     address: solanaWallet.address,
		//     balance: '0',
		//     publicKey: solanaWallet.publicKey,
		//   });
		// } catch (e) {
		//   console.warn('Solana wallet creation failed:', e);
		// }

		// Bitcoin
		// try {
		//   const btcWallet = await this.getBitcoinWallet();
		//   accounts.push({
		//     network: Network.BITCOIN,
		//     address: btcWallet.address,
		//     balance: '0',
		//   });
		// } catch (e) {
		//   console.warn('Bitcoin wallet creation failed:', e);
		// }

		// TRON
		// try {
		//   const tronWallet = await this.getTronWallet();
		//   accounts.push({
		//     network: Network.TRON,
		//     address: tronWallet.address,
		//     balance: '0',
		//   });
		// } catch (e) {
		//   console.warn('TRON wallet creation failed:', e);
		// }

		// Stellar
		try {
			const stellarWallet = await this.getStellarWallet();
			accounts.push(
				{
					network: Network.STELLAR,
					address: stellarWallet.address,
					balance: "0",
					publicKey: stellarWallet.publicKey,
				},
				{
					network: Network.STELLAR_TESTNET,
					address: stellarWallet.address,
					balance: "0",
					publicKey: stellarWallet.publicKey,
				},
			);
		} catch (e) {
			console.warn("Stellar wallet creation failed:", e);
		}

		return accounts;
	}

	// Получение баланса для EVM сетей
	async getEVMBalance(network: Network, address: string): Promise<string> {
		const networkInfo = NETWORKS[network];
		if (!networkInfo.isEVM) {
			throw new Error("Not an EVM network");
		}

		try {
			const chain = this.getViemChain(network);
			const client = createPublicClient({
				chain,
				transport: http(networkInfo.rpcUrl),
			});
			const balance = await client.getBalance({
				address: address as `0x${string}`,
			});
			return formatEther(balance);
		} catch (error) {
			console.error(`Failed to get balance for ${network}:`, error);
			return "0";
		}
	}

	// Отправка транзакции в EVM сети
	async sendEVMTransaction(
		network: Network,
		to: string,
		amount: string,
	): Promise<string> {
		const networkInfo = NETWORKS[network];
		if (!networkInfo.isEVM) {
			throw new Error("Not an EVM network");
		}

		const { privateKey } = await this.getEVMWallet(network);
		const chain = this.getViemChain(network);
		const account = privateKeyToAccount(privateKey);

		const walletClient = createWalletClient({
			account,
			chain,
			transport: http(networkInfo.rpcUrl.trim()),
		});

		const hash = await walletClient.sendTransaction({
			to: to as `0x${string}`,
			value: parseEther(amount),
		});

		return hash;
	}

	// Оценка комиссии EVM транзакции
	async estimateEVMFee(
		network: Network,
		from: string,
		to: string,
		value: string,
	): Promise<number> {
		const networkInfo = NETWORKS[network];
		const chain = this.getViemChain(network);
		const client = createPublicClient({
			chain,
			transport: http(networkInfo.rpcUrl),
		});

		const [gasLimit, feesPerGas] = await Promise.all([
			client.estimateGas({
				account: from as `0x${string}`,
				to: to as `0x${string}`,
				value: parseEther(value),
			}),
			client.estimateFeesPerGas().catch(() => null),
		]);

		let gasPrice: bigint;
		if (feesPerGas?.maxFeePerGas) {
			gasPrice = feesPerGas.maxFeePerGas;
		} else {
			gasPrice = await client.getGasPrice();
		}

		return parseFloat(formatEther(gasLimit * gasPrice));
	}

	// Сохранение данных кошелька
	async saveWalletData(wallet: MasterWallet): Promise<void> {
		await secureStorage.setItemAsync(WALLET_DATA_KEY, JSON.stringify(wallet));
		await this.updateWalletInList(wallet);
	}

	// Загрузка данных кошелька (активный кошелёк)
	async loadWalletData(): Promise<MasterWallet | null> {
		// Try new format first
		const activeId = await this.getActiveWalletId();
		if (activeId) {
			const wallets = await this.loadWalletsList();
			return wallets.find((w) => w.id === activeId) ?? null;
		}
		// Fall back to legacy key
		const data = await secureStorage.getItemAsync(WALLET_DATA_KEY);
		if (!data) return null;
		return JSON.parse(data);
	}

	// ─── Multi-wallet ──────────────────────────────────────────────────────────

	async loadWalletsList(): Promise<MasterWallet[]> {
		const data = await secureStorage.getItemAsync(WALLETS_LIST_KEY);
		if (!data) return [];
		return JSON.parse(data);
	}

	async saveWalletsList(wallets: MasterWallet[]): Promise<void> {
		await secureStorage.setItemAsync(WALLETS_LIST_KEY, JSON.stringify(wallets));
	}

	async saveMnemonicForWallet(
		walletId: string,
		mnemonic: string,
	): Promise<void> {
		await secureStorage.setItemAsync(`${MNEMONIC_PREFIX}${walletId}`, mnemonic);
	}

	async loadMnemonicForWallet(walletId: string): Promise<string | null> {
		return secureStorage.getItemAsync(`${MNEMONIC_PREFIX}${walletId}`);
	}

	async getActiveWalletId(): Promise<string | null> {
		return secureStorage.getItemAsync(ACTIVE_WALLET_ID_KEY);
	}

	async setActiveWalletId(walletId: string): Promise<void> {
		await secureStorage.setItemAsync(ACTIVE_WALLET_ID_KEY, walletId);
		this.mnemonic = null;
	}

	async addWallet(wallet: MasterWallet, mnemonic: string): Promise<void> {
		const wallets = await this.loadWalletsList();
		wallets.push(wallet);
		await this.saveWalletsList(wallets);
		await this.saveMnemonicForWallet(wallet.id, mnemonic);
		await this.setActiveWalletId(wallet.id);
		this.mnemonic = mnemonic;
	}

	async updateWalletInList(wallet: MasterWallet): Promise<void> {
		const wallets = await this.loadWalletsList();
		const idx = wallets.findIndex((w) => w.id === wallet.id);
		if (idx >= 0) {
			wallets[idx] = wallet;
			await this.saveWalletsList(wallets);
		}
	}

	async deleteWalletById(walletId: string): Promise<MasterWallet | null> {
		const wallets = await this.loadWalletsList();
		const remaining = wallets.filter((w) => w.id !== walletId);
		await this.saveWalletsList(remaining);
		await secureStorage.deleteItemAsync(`${MNEMONIC_PREFIX}${walletId}`);
		this.mnemonic = null;

		const activeId = await this.getActiveWalletId();
		if (activeId === walletId) {
			if (remaining.length > 0) {
				await this.setActiveWalletId(remaining[0].id);
				return remaining[0];
			}
			// Если кошельков больше нет, удаляем все данные включая legacy ключи
			await secureStorage.deleteItemAsync(ACTIVE_WALLET_ID_KEY);
			await secureStorage.deleteItemAsync(MNEMONIC_KEY);
			await secureStorage.deleteItemAsync(WALLET_DATA_KEY);
			return null;
		}
		return wallets.find((w) => w.id === activeId) ?? null;
	}

	async hasAnyWallet(): Promise<boolean> {
		const wallets = await this.loadWalletsList();
		if (wallets.length > 0) return true;
		const old = await secureStorage.getItemAsync(MNEMONIC_KEY);
		return old !== null;
	}
}

export const walletService = new WalletService();
