import { FilterTabs } from "@/components/explore/filter-tabs";
import { NetworkErrorsBanner } from "@/components/explore/network-errors-banner";
import { NetworkFilter } from "@/components/explore/network-filter";
import { SummaryCard } from "@/components/explore/summary-card";
import { TxRow } from "@/components/explore/tx-row";
import { groupByDate, type TxFilter } from "@/components/explore/tx-utils";
import { Box } from "@/components/ui/builders/Box";
import { Text } from "@/components/ui/builders/Text";
import { getNetworksByMode, NETWORKS } from "@/constants/networks";
import { useWallet } from "@/providers/wallet-provider";
import { ERC20_CONTRACTS, ERC20_DECIMALS } from "@/constants/tokens";
import {
  getERC20TransactionHistory,
  getTransactionHistory,
  supportsTransactionHistory,
} from "@/services/transaction-service";
import { useAppTheme } from "@/theme/theme";
import type { Network, Transaction } from "@/types/wallet";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, SectionList } from "react-native";

export default function HistoryScreen() {
	const { colors, insets } = useAppTheme();
	const { networkMode, getAccountsForCurrentMode, isInitialized } = useWallet();

	const accounts = useMemo(
		() => getAccountsForCurrentMode(),
		[getAccountsForCurrentMode],
	);
	const supportedNetworks = useMemo(
		() =>
			getNetworksByMode(networkMode).filter(
				(net) =>
					supportsTransactionHistory(net.id) &&
					accounts.some((a) => a.network === net.id),
			),
		[accounts, networkMode],
	);
	const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
	const [txFilter, setTxFilter] = useState<TxFilter>("all");
	const [networkFilter, setNetworkFilter] = useState<Network | "all">("all");
	const [isLoading, setIsLoading] = useState(false);
	const [networkErrors, setNetworkErrors] = useState<
		{ name: string; message: string }[]
	>([]);

	const loadAll = useCallback(async () => {
		const networksToFetch =
			networkFilter === "all"
				? supportedNetworks
				: supportedNetworks.filter((n) => n.id === networkFilter);
		if (!networksToFetch.length) return;
		setIsLoading(true);
		setNetworkErrors([]);
		try {
			type NamedPromise = { label: string; promise: Promise<Transaction[]> };
			const jobs: NamedPromise[] = [];

			for (const net of networksToFetch) {
				const account = accounts.find((a) => a.network === net.id);
				if (!account) continue;

				// Native token history
				jobs.push({
					label: NETWORKS[net.id].name,
					promise: getTransactionHistory(net.id, account.address),
				});

				// ERC-20 history for every token that has a contract on this network
				if (net.isEVM) {
					for (const symbol of Object.keys(ERC20_CONTRACTS)) {
						const contractAddress =
							ERC20_CONTRACTS[symbol]?.[net.id as Network];
						if (!contractAddress) continue;
						const decimals = ERC20_DECIMALS[symbol] ?? 6;
						jobs.push({
							label: `${NETWORKS[net.id].name} ${symbol}`,
							promise: getERC20TransactionHistory(
								net.id,
								account.address,
								contractAddress,
								decimals,
								symbol,
							),
						});
					}
				}
			}

			const results = await Promise.allSettled(jobs.map((j) => j.promise));
			const errors: { name: string; message: string }[] = [];
			const merged = results.flatMap((r, i) => {
				if (r.status === "fulfilled") return r.value;
				errors.push({
					name: jobs[i].label,
					message:
						r.reason instanceof Error ? r.reason.message : String(r.reason),
				});
				return [];
			});
			merged.sort((a, b) => b.timestamp - a.timestamp);
			setAllTransactions(merged);
			setNetworkErrors(errors);
		} finally {
			setIsLoading(false);
		}
	}, [supportedNetworks, accounts, networkFilter]);

	useEffect(() => {
		if (isInitialized) loadAll();
	}, [isInitialized, loadAll]);

	const filtered = useMemo(() => {
		return allTransactions.filter((tx) => {
			if (txFilter !== "all" && tx.type !== txFilter) return false;
			if (networkFilter !== "all" && tx.network !== networkFilter) return false;
			return true;
		});
	}, [allTransactions, txFilter, networkFilter]);

	const sections = useMemo(() => groupByDate(filtered), [filtered]);

	if (!isInitialized) {
		return (
			<Box
				flex
				alignItems="center"
				justifyContent="center"
				backgroundColor={colors.background}
			>
				<Ionicons name="time-outline" size={48} color="#374151" />
				<Text variant="p2" colorName="label" center mt={12}>
					Сначала создайте кошелек
				</Text>
			</Box>
		);
	}

	return (
		<Box flex backgroundColor={colors.background}>
			{/* Header */}
			<Box
				row
				justifyContent="space-between"
				alignItems="center"
				px={20}
				pt={insets.top + 12}
				pb={4}
			>
				<Text variant="h4" color="#fff">
					История
				</Text>
				<Box
					w={36}
					h={36}
					borderRadius={10}
					backgroundColor="#1F2937"
					alignItems="center"
					justifyContent="center"
					onPress={loadAll}
					activeOpacity={0.7}
				>
					<Ionicons name="options-outline" size={16} color="#9CA3AF" />
				</Box>
			</Box>

			<FilterTabs value={txFilter} onChange={setTxFilter} />

			<NetworkFilter
				networks={supportedNetworks}
				value={networkFilter}
				onChange={setNetworkFilter}
			/>

			{filtered.length > 0 && !isLoading && <SummaryCard txs={filtered} />}

			<NetworkErrorsBanner errors={networkErrors} onRetry={loadAll} />

			{isLoading ? (
				<Box flex alignItems="center" justifyContent="center" gap={12}>
					<ActivityIndicator color={colors.primary} size="large" />
					<Text variant="p3" color="#6B7280">
						Загрузка транзакций...
					</Text>
				</Box>
			) : sections.length === 0 ? (
				<Box flex alignItems="center" justifyContent="center" gap={12}>
					<Box
						w={72}
						h={72}
						borderRadius={36}
						alignItems="center"
						justifyContent="center"
						backgroundColor="#161B22"
					>
						<Ionicons name="receipt-outline" size={32} color="#374151" />
					</Box>
					<Text variant="p2-semibold" color="#9CA3AF">
						Нет транзакций
					</Text>
					<Text variant="p4" color="#6B7280" center>
						Транзакции появятся после первой операции
					</Text>
				</Box>
			) : (
				<SectionList
					sections={sections}
					keyExtractor={(tx) => `${tx.hash}-${tx.network}`}
					stickySectionHeadersEnabled={false}
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
					renderSectionHeader={({ section }) => (
						<Box px={20} pt={16} pb={6}>
							<Text
								variant="caption-medium"
								fontWeight="600"
								color="#6B7280"
								uppercase
							>
								{section.title}
							</Text>
						</Box>
					)}
					renderItem={({ item, index, section }) => (
						<TxRow tx={item} isLast={index === section.data.length - 1} />
					)}
				/>
			)}
		</Box>
	);
}
