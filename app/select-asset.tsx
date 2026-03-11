import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, ScrollView, StyleSheet, TextInput } from "react-native";

import { Box } from "@/components/ui/builders/Box";
import { Text } from "@/components/ui/builders/Text";
import { ScreenHeader } from "@/components/ui/layouts/ScreenHeader";
import { TokenIcon } from "@/components/wallet/token-icon";
import { useWallet } from "@/providers/wallet-provider";
import { useAppTheme } from "@/theme/theme";
import { Network } from "@/types/wallet";

interface TokenItem {
	symbol: string;
	name: string;
	amount: string;
	usd: string;
	network: string | null;
}

const ALL_TOKENS: TokenItem[] = [
	{
		symbol: "USDT",
		name: "Tether USD",
		amount: "1 234.56 USDT",
		usd: "$1 234.56",
		network: null,
	},
	{
		symbol: "USDC",
		name: "USD Coin",
		amount: "890.00 USDC",
		usd: "$890.00",
		network: null,
	},
	{
		symbol: "BTC",
		name: "Bitcoin",
		amount: "0.05823 BTC",
		usd: "$3 421.16",
		network: "bitcoin",
	},
	{
		symbol: "ETH",
		name: "Ethereum",
		amount: "2.4150 ETH",
		usd: "$7 892.32",
		network: "ethereum",
	},
	{
		symbol: "SOL",
		name: "Solana",
		amount: "45.33 SOL",
		usd: "$6 844.83",
		network: "solana",
	},
	{
		symbol: "BNB",
		name: "BNB Token",
		amount: "12.71 BNB",
		usd: "$7 621.40",
		network: "bsc",
	},
	{
		symbol: "TRX",
		name: "Tron",
		amount: "15 230 TRX",
		usd: "$1 523.90",
		network: null,
	},
	{
		symbol: "TON",
		name: "Toncoin",
		amount: "328.5 TON",
		usd: "$1 642.50",
		network: null,
	},
	{
		symbol: "MATIC",
		name: "Polygon",
		amount: "4 500 MATIC",
		usd: "$2 430.00",
		network: "polygon",
	},
];

const FILTER_CHIPS = [
	{ id: "all", label: "Все" },
	{ id: "ethereum", label: "Ethereum" },
	{ id: "bsc", label: "BNB Chain" },
	{ id: "solana", label: "Solana" },
];

const TOKEN_TO_NETWORK: Partial<Record<string, Network>> = {
	ETH: Network.ETHEREUM,
	BTC: Network.BITCOIN,
	SOL: Network.SOLANA,
	BNB: Network.BSC,
	MATIC: Network.POLYGON,
};

export default function SelectAssetScreen() {
	const router = useRouter();
	const { colors } = useAppTheme();
	const { setSelectedNetwork } = useWallet();
	const { mode = "receive" } = useLocalSearchParams<{ mode?: string }>();
	const [search, setSearch] = useState("");
	const [activeFilter, setActiveFilter] = useState("all");

	const filteredTokens = useMemo(() => {
		let list = ALL_TOKENS;

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
	}, [activeFilter, search]);

	const handleSelect = (token: TokenItem) => {
		if (token.symbol === "USDT" || token.symbol === "USDC") {
			router.push({
				pathname: "/select-network",
				params: { token: token.symbol, mode },
			});
		} else {
			const network = TOKEN_TO_NETWORK[token.symbol];
			if (network) setSelectedNetwork(network);
			router.replace(mode === "send" ? "/send" : "/receive");
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
				keyExtractor={(item) => item.symbol}
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
						<TokenIcon symbol={item.symbol} size={44} />
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
