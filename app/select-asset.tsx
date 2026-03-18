import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, ScrollView, StyleSheet, TextInput } from "react-native";

import { Box } from "@/components/ui/builders/Box";
import { Text } from "@/components/ui/builders/Text";
import { ScreenHeader } from "@/components/ui/layouts/ScreenHeader";
import { TokenIcon } from "@/components/wallet/token-icon";
import { NETWORKS } from "@/constants/networks";
import { useWallet } from "@/providers/wallet-provider";
import { getTokenPrice } from "@/services/price-service";
import { useAppTheme } from "@/theme/theme";
import { MAINNET_MAP, type Network } from "@/types/wallet";

interface TokenItem {
	symbol: string;
	name: string;
	amount: string;
	usd: string;
	network: string | null; // mainnet-normalized network id for filter chips, null = multi-chain
	accountNetwork?: Network; // undefined for multi-chain tokens (USDT, USDC)
}

const MULTI_CHAIN_TOKENS: TokenItem[] = [
	{ symbol: "USDT", name: "Tether USD", amount: "0 USDT", usd: "$0.00", network: null },
	{ symbol: "USDC", name: "USD Coin", amount: "0 USDC", usd: "$0.00", network: null },
];

const FILTER_CHIPS = [
	{ id: "all", label: "Все" },
	{ id: "ethereum", label: "Ethereum" },
	{ id: "bsc", label: "BNB Chain" },
	{ id: "solana", label: "Solana" },
	{ id: "stellar", label: "Stellar" },
];

function formatBalance(balance: string, symbol: string): string {
	const n = parseFloat(balance || "0");
	if (n === 0) return `0 ${symbol}`;
	if (n >= 1000) return `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${symbol}`;
	if (n >= 1) return `${n.toFixed(4)} ${symbol}`;
	return `${n.toFixed(8).replace(/0+$/, "").replace(/\.$/, "")} ${symbol}`;
}

export default function SelectAssetScreen() {
	const router = useRouter();
	const { colors } = useAppTheme();
	const { mode = "receive" } = useLocalSearchParams<{ mode?: string }>();
	const { getAccountsForCurrentMode } = useWallet();
	const [search, setSearch] = useState("");
	const [activeFilter, setActiveFilter] = useState("all");
	const [prices, setPrices] = useState<Partial<Record<string, number>>>({});

	const accounts = useMemo(
		() => getAccountsForCurrentMode(),
		[getAccountsForCurrentMode],
	);

	useEffect(() => {
		let cancelled = false;
		Promise.all(
			accounts.map(async (acc) => {
				const info = await getTokenPrice(acc.network);
				return { network: acc.network, price: info?.price ?? 0 };
			}),
		).then((results) => {
			if (cancelled) return;
			const map: Record<string, number> = {};
			for (const r of results) map[r.network] = r.price;
			setPrices(map);
		});
		return () => {
			cancelled = true;
		};
	}, [accounts]);

	const tokens: TokenItem[] = useMemo(() => {
		const nativeTokens = accounts.map((acc) => {
			const networkInfo = NETWORKS[acc.network];
			const { symbol, name } = networkInfo;
			const filterNetwork = (MAINNET_MAP[acc.network] ?? acc.network) as string;
			const balance = parseFloat(acc.balance || "0");
			const price = prices[acc.network] ?? 0;
			const usd = balance * price;

			return {
				symbol,
				name,
				amount: formatBalance(acc.balance, symbol),
				usd: `$${usd.toFixed(2)}`,
				network: filterNetwork,
				accountNetwork: acc.network,
			};
		});
		return [...MULTI_CHAIN_TOKENS, ...nativeTokens];
	}, [accounts, prices]);

	const filteredTokens = useMemo(() => {
		let list = tokens;

		if (activeFilter !== "all") {
			list = list.filter(
				(t) => t.network === activeFilter || t.network === null,
			);
		}

		if (search.trim()) {
			const q = search.trim().toLowerCase();
			list = list.filter(
				(t) =>
					t.symbol.toLowerCase().includes(q) ||
					t.name.toLowerCase().includes(q),
			);
		}

		return list;
	}, [tokens, activeFilter, search]);

	const handleSelect = (token: TokenItem) => {
		if (!token.accountNetwork) {
			router.push({
				pathname: "/select-network",
				params: { token: token.symbol, mode },
			});
		} else {
			router.replace({
				pathname: mode === "send" ? "/send" : "/receive",
				params: { network: token.accountNetwork },
			});
		}
	};

	return (
		<Box flex backgroundColor={colors.background}>
			<ScreenHeader title="Выбрать актив" />

			{/* Search */}
			<Box px={16} pb={8}>
				<Box
					row
					alignItems="center"
					gap={10}
					backgroundColor={colors.grey_200}
					borderRadius={12}
					px={14}
					h={44}
				>
					<Ionicons name="search" size={18} color={colors.label} />
					<TextInput
						style={[styles.searchInput, { color: colors.text }]}
						placeholder="Поиск токена или сети..."
						placeholderTextColor={colors.label}
						value={search}
						onChangeText={setSearch}
					/>
				</Box>
			</Box>

			{/* Filter chips */}
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				style={styles.chipsScroll}
				contentContainerStyle={styles.chipsContent}
			>
				{FILTER_CHIPS.map((chip) => {
					const isActive = activeFilter === chip.id;
					return (
						<Box
							key={chip.id}
							row
							alignItems="center"
							gap={6}
							px={14}
							py={8}
							borderRadius={20}
							borderWidth={1}
							backgroundColor={isActive ? colors.primary : colors.grey_200}
							borderColor={isActive ? colors.primary : colors.grey_300}
							onPress={() => setActiveFilter(chip.id)}
						>
							{chip.id !== "all" && (
								<Box
									w={8}
									h={8}
									borderRadius={4}
									backgroundColor={CHIP_COLORS[chip.id]}
								/>
							)}
							<Text
								variant="caption-medium"
								color={isActive ? "#FFFFFF" : colors.label}
							>
								{chip.label}
							</Text>
						</Box>
					);
				})}
			</ScrollView>

			{/* Section label */}
			<Box px={20} py={10}>
				<Text variant="label" colorName="label" uppercase>
					Доступные токены
				</Text>
			</Box>

			{/* Token list */}
			<FlatList
				data={filteredTokens}
				keyExtractor={(item) => item.accountNetwork ?? item.symbol}
				renderItem={({ item }) => (
					<Box
						row
						alignItems="center"
						gap={12}
						px={20}
						py={12}
						borderBottomWidth={StyleSheet.hairlineWidth}
						borderColor={colors.grey_200}
						onPress={() => handleSelect(item)}
						activeOpacity={0.7}
					>
						<TokenIcon symbol={item.symbol} networkId={item.accountNetwork} size={44} />
						<Box flex gap={3}>
							<Text variant="p3-semibold">{item.symbol}</Text>
							<Text variant="p4" colorName="label">
								{item.name}
							</Text>
						</Box>
						<Box alignItems="flex-end" gap={3}>
							<Text variant="p4-semibold">{item.amount}</Text>
							<Text variant="caption" colorName="label">
								{item.usd}
							</Text>
						</Box>
					</Box>
				)}
				showsVerticalScrollIndicator={false}
			/>
		</Box>
	);
}

const CHIP_COLORS: Record<string, string> = {
	ethereum: "#627EEA",
	bsc: "#F0B90B",
	solana: "#9945FF",
	stellar: "#7B68EE",
};

const styles = StyleSheet.create({
	searchInput: {
		flex: 1,
		fontSize: 15,
		fontFamily: "Inter",
		padding: 0,
	},
	chipsScroll: { flexGrow: 0 },
	chipsContent: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
});
