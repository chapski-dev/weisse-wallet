import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { getNetworksByMode, NETWORKS } from "@/constants/networks";
import { walletService } from "@/services/wallet-service";
import {
	type MasterWallet,
	Network,
	type NetworkMode,
	TESTNET_MAP,
	type WalletAccount,
} from "@/types/wallet";
import { mmkvStorage } from "@/utils/storage";

const NETWORK_MODE_KEY = "network_mode";

// Типы для контекста
export interface WalletContextState {
	// State
	isLoading: boolean;
	isInitializing: boolean;
	isInitialized: boolean;
	wallet: MasterWallet | null;
	wallets: MasterWallet[];
	mnemonic: string | null;
	networkMode: NetworkMode;

	// Actions
	setNetworkMode: (mode: NetworkMode) => Promise<void>;
	toggleNetworkMode: () => Promise<void>;
	generateNewMnemonic: () => string;
	createWallet: (seedPhrase: string, name?: string) => Promise<MasterWallet>;
	importWallet: (seedPhrase: string, name?: string) => Promise<MasterWallet>;
	switchWallet: (walletId: string) => Promise<void>;
	renameWallet: (walletId: string, name: string) => Promise<void>;
	refreshBalances: () => Promise<void>;
	getAccount: (network: Network) => WalletAccount | undefined;
	getAccountsForCurrentMode: () => WalletAccount[];
	getActiveNetwork: (baseNetwork: Network) => Network;
	deleteWallet: () => Promise<void>;
	revealMnemonic: () => Promise<string | null>;
}

export const WalletContext = createContext<WalletContextState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
	const [isLoading, setIsLoading] = useState(false);
	const [isInitializing, setIsInitializing] = useState(true);
	const [isInitialized, setIsInitialized] = useState(false);
	const [wallet, setWallet] = useState<MasterWallet | null>(null);
	const [wallets, setWallets] = useState<MasterWallet[]>([]);
	const [mnemonic, setMnemonic] = useState<string | null>(null);
	const [networkMode, setNetworkModeState] = useState<NetworkMode>("testnet");

	// Получить актуальную сеть с учётом режима
	const getActiveNetwork = useCallback(
		(baseNetwork: Network): Network => {
			if (networkMode === "testnet") {
				return TESTNET_MAP[baseNetwork] || baseNetwork;
			}
			return baseNetwork;
		},
		[networkMode],
	);

	// Загрузка режима сети
	const loadNetworkMode = useCallback(() => {
		try {
			const savedMode = mmkvStorage.getItem(NETWORK_MODE_KEY);
			if (savedMode === "testnet" || savedMode === "mainnet") {
				setNetworkModeState(savedMode);
			}
		} catch (error) {
			console.error("Failed to load network mode:", error);
		}
	}, []);

	// Установка режима сети
	const setNetworkMode = useCallback(async (newMode: NetworkMode) => {
		try {
			mmkvStorage.setItem(NETWORK_MODE_KEY, newMode);
			setNetworkModeState(newMode);
		} catch (error) {
			console.error("Failed to save network mode:", error);
		}
	}, []);

	// Переключение режима
	const toggleNetworkMode = useCallback(async () => {
		const newMode = networkMode === "mainnet" ? "testnet" : "mainnet";
		await setNetworkMode(newMode);
	}, [networkMode, setNetworkMode]);

	// Внутренняя функция для обновления балансов (без setIsLoading)
	const refreshBalancesInternal = useCallback(
		async (targetWallet: MasterWallet) => {
			try {
				const currentNetworks = getNetworksByMode(networkMode);
				const currentNetworkIds = new Set(currentNetworks.map((n) => n.id));

				const updatedAccounts = await Promise.all(
					targetWallet.accounts.map(async (account) => {
						if (!currentNetworkIds.has(account.network)) {
							return account;
						}

						const networkInfo = NETWORKS[account.network];
						if (networkInfo?.isEVM) {
							try {
								const balance = await walletService.getEVMBalance(
									account.network,
									account.address,
								);
								return { ...account, balance };
							} catch (err) {
								console.error(
									`Failed to get balance for ${account.network}:`,
									err,
								);
								return account;
							}
						}
						return account;
					}),
				);

				const updatedWallet = { ...targetWallet, accounts: updatedAccounts };
				setWallet(updatedWallet);
				await walletService.saveWalletData(updatedWallet);
			} catch (error) {
				console.error("Failed to refresh balances:", error);
			}
		},
		[networkMode],
	);

	const checkWallet = useCallback(async () => {
		setIsInitializing(true);
		try {
			const walletsList = await walletService.loadWalletsList();
			if (walletsList.length > 0) {
				setWallets(walletsList);
				const activeId = await walletService.getActiveWalletId();
				const activeWallet =
					walletsList.find((w) => w.id === activeId) ?? walletsList[0];
				if (!activeId) await walletService.setActiveWalletId(activeWallet.id);

				// Add accounts for networks added after wallet creation
				const existingNetworks = new Set(
					activeWallet.accounts.map((a) => a.network),
				);
				const missingEVMNetworks = Object.values(NETWORKS).filter(
					(n) => n.isEVM && !existingNetworks.has(n.id),
				);
				if (missingEVMNetworks.length > 0) {
					const evmWallet = await walletService.getEVMWallet(Network.ETHEREUM);
					for (const network of missingEVMNetworks) {
						activeWallet.accounts.push({
							network: network.id,
							address: evmWallet.address,
							balance: "0",
						});
					}
					await walletService.updateWalletInList(activeWallet);
				}
				setWallet(activeWallet);
				setIsInitialized(true);

				// Загружаем балансы при входе в приложение (в фоне)
				// Используем setTimeout чтобы не блокировать инициализацию
				setTimeout(() => {
					refreshBalancesInternal(activeWallet);
				}, 100);
			}
		} catch (error) {
			console.error("Failed to check wallet:", error);
		} finally {
			setIsInitializing(false);
		}
	}, [refreshBalancesInternal]);

	// Проверка наличия кошелька при запуске
	useEffect(() => {
		loadNetworkMode();
		checkWallet();
	}, [checkWallet, loadNetworkMode]);

	// Генерация новой seed фразы
	const generateNewMnemonic = useCallback(() => {
		const newMnemonic = walletService.generateMnemonic();
		setMnemonic(newMnemonic);
		return newMnemonic;
	}, []);

	// Создание кошелька из seed фразы
	const createWallet = useCallback(
		async (seedPhrase: string, name: string = "Мой кошелек") => {
			setIsLoading(true);
			try {
				if (!walletService.validateMnemonic(seedPhrase)) {
					throw new Error("Invalid seed phrase");
				}

				await walletService.saveMnemonic(seedPhrase);
				const accounts = await walletService.createAccountsForAllNetworks();

				const newWallet: MasterWallet = {
					id: Date.now().toString(),
					name,
					createdAt: Date.now(),
					accounts,
				};

				await walletService.addWallet(newWallet, seedPhrase);

				setWallets((prev) => [...prev, newWallet]);
				setWallet(newWallet);
				setMnemonic(seedPhrase);
				setIsInitialized(true);

				// Загружаем балансы для нового кошелька (в фоне)
				setTimeout(() => {
					refreshBalancesInternal(newWallet);
				}, 100);

				return newWallet;
			} catch (error) {
				console.error("Failed to create wallet:", error);
				throw error;
			} finally {
				setIsLoading(false);
			}
		},
		[refreshBalancesInternal],
	);

	// Импорт существующего кошелька
	const importWallet = useCallback(
		async (seedPhrase: string, name: string = "Imported Wallet") => {
			return createWallet(seedPhrase, name);
		},
		[createWallet],
	);

	// Обновление балансов (публичный API)
	const refreshBalances = useCallback(async () => {
		if (!wallet) return;

		setIsLoading(true);
		try {
			await refreshBalancesInternal(wallet);
		} finally {
			setIsLoading(false);
		}
	}, [wallet, refreshBalancesInternal]);

	// Получение аккаунта для конкретной сети
	const getAccount = useCallback(
		(network: Network): WalletAccount | undefined => {
			return wallet?.accounts.find((a) => a.network === network);
		},
		[wallet],
	);

	// Получение аккаунтов для текущего режима
	const getAccountsForCurrentMode = useCallback((): WalletAccount[] => {
		if (!wallet) return [];
		const currentNetworks = getNetworksByMode(networkMode);
		const currentNetworkIds = new Set(currentNetworks.map((n) => n.id));
		return wallet.accounts.filter((a) => currentNetworkIds.has(a.network));
	}, [wallet, networkMode]);

	// Переключение активного кошелька
	const switchWallet = useCallback(
		async (walletId: string) => {
			const target = wallets.find((w) => w.id === walletId);
			if (!target) return;
			await walletService.setActiveWalletId(walletId);
			setWallet(target);
			setMnemonic(null);
		},
		[wallets],
	);

	// Переименование кошелька
	const renameWallet = useCallback(
		async (walletId: string, name: string) => {
			const target = wallets.find((w) => w.id === walletId);
			if (!target) return;
			const updated = { ...target, name };
			await walletService.updateWalletInList(updated);
			setWallets((prev) => prev.map((w) => (w.id === walletId ? updated : w)));
			if (wallet?.id === walletId) setWallet(updated);
		},
		[wallet, wallets],
	);

	// Удаление кошелька
	const deleteWallet = useCallback(async () => {
		if (!wallet) return;
		setIsLoading(true);
		try {
			const nextWallet = await walletService.deleteWalletById(wallet.id);
			const remaining = wallets.filter((w) => w.id !== wallet.id);
			setWallets(remaining);
			if (nextWallet) {
				setWallet(nextWallet);
			} else {
				setWallet(null);
				setMnemonic(null);
				setIsInitialized(false);
			}
		} catch (error) {
			console.error("Failed to delete wallet:", error);
			throw error;
		} finally {
			setIsLoading(false);
		}
	}, [wallet, wallets]);

	// Получение seed фразы
	const revealMnemonic = useCallback(async (): Promise<string | null> => {
		return walletService.loadMnemonic();
	}, []);

	const value = useMemo<WalletContextState>(
		() => ({
			isLoading,
			isInitializing,
			isInitialized,
			wallet,
			wallets,
			mnemonic,
			networkMode,
			setNetworkMode,
			toggleNetworkMode,
			generateNewMnemonic,
			createWallet,
			importWallet,
			switchWallet,
			renameWallet,
			refreshBalances,
			getAccount,
			getAccountsForCurrentMode,
			getActiveNetwork,
			deleteWallet,
			revealMnemonic,
		}),
		[
			isLoading,
			isInitializing,
			isInitialized,
			wallet,
			wallets,
			mnemonic,
			networkMode,
			getAccount,
			createWallet,
			deleteWallet,
			generateNewMnemonic,
			getAccountsForCurrentMode,
			getActiveNetwork,
			importWallet,
			refreshBalances,
			renameWallet,
			revealMnemonic,
			setNetworkMode,
			switchWallet,
			toggleNetworkMode,
		],
	);

	return (
		<WalletContext.Provider value={value}>{children}</WalletContext.Provider>
	);
}

export function useWallet(): WalletContextState {
	const context = useContext(WalletContext);
	if (!context) {
		throw new Error("useWallet must be used within a WalletProvider");
	}
	return context;
}
