import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";

import { Box } from "@/components/ui/builders/Box";
import { Text } from "@/components/ui/builders/Text";
import { Button } from "@/components/ui/shared/Button";
import { TokenIcon } from "@/components/wallet/token-icon";
import { NETWORKS } from "@/constants/networks";
import { ERC20_CONTRACTS, ERC20_DECIMALS, TOKENS } from "@/constants/tokens";
import { getTokenPrice } from "@/services/price-service";
import { walletService } from "@/services/wallet-service";
import type { Network, WalletAccount } from "@/types/wallet";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtUsd(value: number): string {
	return value.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

// ─── Account Card ─────────────────────────────────────────────────────────────

interface AccountCardProps {
	accounts: WalletAccount[];
	selectedAccount: WalletAccount;
	onSend?: () => void;
	onReceive?: () => void;
}

export function AccountCard({ accounts, onSend, onReceive }: AccountCardProps) {
	const [totalUsd, setTotalUsd] = useState<number | null>(null);

	useEffect(() => {
		let cancelled = false;
		async function compute() {
			// Native token values
			const nativeValues = await Promise.all(
				accounts.map(async (a) => {
					const info = await getTokenPrice(a.network);
					if (!info) return 0;
					return parseFloat(a.balance) * info.price;
				}),
			);

			// ERC-20 values (USDC/USDT = $1 per token)
			const erc20Total = (
				await Promise.all(
					Object.keys(ERC20_CONTRACTS).map(async (symbol) => {
						const contracts = ERC20_CONTRACTS[symbol] ?? {};
						const decimals = ERC20_DECIMALS[symbol] ?? 6;
						const perNetwork = await Promise.all(
							accounts
								.filter((a) => a.network in contracts)
								.map(async (a) => {
									const addr = contracts[a.network as Network];
									if (!addr) return 0;
									const bal = await walletService.getERC20Balance(
										a.network,
										a.address,
										addr,
										decimals,
									);
									return parseFloat(bal);
								}),
						);
						return perNetwork.reduce((s, v) => s + v, 0);
					}),
				)
			).reduce((s, v) => s + v, 0);

			if (!cancelled)
				setTotalUsd(nativeValues.reduce((s, v) => s + v, 0) + erc20Total);
		}
		compute();
		return () => {
			cancelled = true;
		};
	}, [accounts]);

	return (
		<>
			<Box
				mx={20}
				mb={16}
				p={24}
				gap={8}
				borderRadius={24}
				backgroundColor="#1E3A5F"
				style={{
					shadowColor: "#000",
					shadowOpacity: 0.3,
					shadowRadius: 32,
					elevation: 10,
				}}
			>
				<Text variant="p2" color="#9CA3AF">
					Общий баланс
				</Text>
				{/* Total USD */}
				<Text variant="h1">
					{totalUsd !== null ? `$${fmtUsd(totalUsd)}` : "—"}
				</Text>
			</Box>

			{/* Actions */}
			<Box row gap={12} mt={8} mx={20}>
				<Button
					onPress={onSend}
					icon={<Ionicons name="arrow-up" size={18} color="#fff" />}
					wrapperStyle={{ flex: 1 }}
					buttonStyle={{ height: 52, borderRadius: 14 }}
				>
					Отправить
				</Button>
				<Button
					type="outline"
					backgroundColor="grey_200"
					textColor="label"
					onPress={onReceive}
					icon={<Ionicons name="arrow-down" size={18} color="#9CA3AF" />}
					wrapperStyle={{ flex: 1 }}
					buttonStyle={{ height: 52, borderRadius: 14 }}
				>
					Получить
				</Button>
			</Box>
		</>
	);
}

// ─── Stablecoin List Item ─────────────────────────────────────────────────────

interface StablecoinListItemProps {
	symbol: string;
	accounts: WalletAccount[];
}

interface NetworkBalance {
	network: Network;
	balance: number;
}

export function StablecoinListItem({
	symbol,
	accounts,
}: StablecoinListItemProps) {
	const [expanded, setExpanded] = useState(false);
	const [networkBalances, setNetworkBalances] = useState<NetworkBalance[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		async function load() {
			const contracts = ERC20_CONTRACTS[symbol] ?? {};
			const decimals = ERC20_DECIMALS[symbol] ?? 6;

			const results = await Promise.all(
				accounts
					.filter((a) => a.network in contracts)
					.map(async (a) => {
						const addr = contracts[a.network as Network];
						if (!addr) return { network: a.network, balance: 0 };
						const bal = await walletService.getERC20Balance(
							a.network,
							a.address,
							addr,
							decimals,
						);
						return { network: a.network, balance: parseFloat(bal) };
					}),
			);

			if (!cancelled) {
				setNetworkBalances(results.filter((r) => r.balance > 0));
				setLoading(false);
			}
		}
		load();
		return () => {
			cancelled = true;
		};
	}, [symbol, accounts]);

	const total = networkBalances.reduce((s, r) => s + r.balance, 0);
	const tokenInfo = TOKENS[symbol];

	return (
		<>
			<Box
				row
				alignItems="center"
				justifyContent="space-between"
				px={20}
				py={10}
				minHeight={60}
				onPress={() => setExpanded((v) => !v)}
			>
				<Box row alignItems="center" gap={12}>
					<TokenIcon symbol={symbol} size={38} />
					<Box gap={2}>
						<Text variant="p3-semibold" color="#fff">
							{tokenInfo?.name ?? symbol}
						</Text>
						<Text variant="p4" color="#6B7280">
							{symbol} · Stablecoin
						</Text>
					</Box>
				</Box>
				<Box row alignItems="center" gap={8}>
					<Box alignItems="flex-end" gap={2}>
						<Text variant="p3-semibold" color="#fff">
							{loading ? "—" : `$${fmtUsd(total)}`}
						</Text>
						{!loading && networkBalances.length > 1 && (
							<Text variant="caption" color="#6B7280">
								{networkBalances.length} сети
							</Text>
						)}
					</Box>
					{networkBalances.length > 0 && (
						<Ionicons
							name={expanded ? "chevron-up" : "chevron-down"}
							size={16}
							color="#6B7280"
						/>
					)}
				</Box>
			</Box>

			{expanded &&
				networkBalances.map((item) => (
					<Box
						key={item.network}
						row
						alignItems="center"
						justifyContent="space-between"
						px={20}
						py={8}
						style={{ paddingLeft: 70 }}
					>
						<Box row alignItems="center" gap={10}>
							<TokenIcon
								symbol={NETWORKS[item.network].symbol}
								networkId={item.network}
								size={22}
							/>
							<Text variant="p4" color="#9CA3AF">
								{NETWORKS[item.network].name}
							</Text>
						</Box>
						<Text variant="p4" color="#9CA3AF">
							${fmtUsd(item.balance)}
						</Text>
					</Box>
				))}
		</>
	);
}

// ─── Account List Item ────────────────────────────────────────────────────────

interface AccountListItemProps {
	account: WalletAccount;
	onPress: () => void;
}

export function AccountListItem({ account, onPress }: AccountListItemProps) {
	const network = NETWORKS[account.network];
	const [usdValue, setUsdValue] = useState<number | null>(null);

	useEffect(() => {
		let cancelled = false;
		getTokenPrice(account.network).then((info) => {
			if (!cancelled && info)
				setUsdValue(parseFloat(account.balance) * info.price);
		});
		return () => {
			cancelled = true;
		};
	}, [account.network, account.balance]);

	return (
		<Box
			row
			alignItems="center"
			justifyContent="space-between"
			px={20}
			py={10}
			minHeight={60}
			onPress={onPress}
		>
			<Box row alignItems="center" gap={12}>
				<TokenIcon symbol={network.symbol} networkId={network.id} size={38} />
				<Box gap={2}>
					<Text variant="p3-semibold" color="#fff">
						{network.name}
					</Text>
					<Text variant="p4" color="#6B7280">
						{network.symbol} · {network.isTestnet ? "Testnet" : "Mainnet"}
					</Text>
				</Box>
			</Box>
			<Box alignItems="flex-end" gap={2}>
				<Text variant="p3-semibold" color="#fff">
					{parseFloat(account.balance).toFixed(4)} {network.symbol}
				</Text>
				<Text variant="caption" color="#6B7280">
					{usdValue !== null ? `$${fmtUsd(usdValue)}` : "—"}
				</Text>
			</Box>
		</Box>
	);
}
