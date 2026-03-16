import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
	FlatList,
	Image,
	StyleSheet,
	TouchableOpacity,
	View,
} from "react-native";

import { Box } from "@/components/ui/builders/Box";
import { Text } from "@/components/ui/builders/Text";
import { ScreenHeader } from "@/components/ui/layouts/ScreenHeader";
import { getNetworkIconUrl, getTokenIconUrl } from "@/constants/tokens";
import { useAppTheme } from "@/theme/theme";
import { Network } from "@/types/wallet";

interface NetworkItem {
	id: string;
	networkId?: Network;
	iconSymbol: string;
	name: string;
	standard: string;
	color: string;
	isPopular?: boolean;
}

const STABLECOIN_NETWORKS: NetworkItem[] = [
	{
		id: "ethereum",
		networkId: Network.ETHEREUM,
		iconSymbol: "ETH",
		name: "Ethereum",
		standard: "ERC-20",
		color: "#627EEA",
		isPopular: true,
	},
	{
		id: "tron",
		networkId: undefined,
		iconSymbol: "TRX",
		name: "Tron",
		standard: "TRC-20",
		color: "#EB0029",
		isPopular: true,
	},
	{
		id: "bsc",
		networkId: Network.BSC,
		iconSymbol: "BNB",
		name: "BNB Chain",
		standard: "BEP-20",
		color: "#F0B90B",
	},
	{
		id: "solana",
		networkId: Network.SOLANA,
		iconSymbol: "SOL",
		name: "Solana",
		standard: "SPL",
		color: "#9945FF",
	},
	{
		id: "polygon",
		networkId: Network.POLYGON,
		iconSymbol: "MATIC",
		name: "Polygon",
		standard: "Polygon PoS",
		color: "#8247E5",
	},
	{
		id: "avalanche",
		networkId: Network.AVALANCHE,
		iconSymbol: "AVAX",
		name: "Avalanche",
		standard: "ARC-20",
		color: "#E84142",
	},
	{
		id: "arbitrum",
		networkId: Network.ARBITRUM,
		iconSymbol: "ARB",
		name: "Arbitrum",
		standard: "ARB",
		color: "#28A0F0",
	},
	{
		id: "ton",
		networkId: undefined,
		iconSymbol: "TON",
		name: "TON",
		standard: "Jetton",
		color: "#0098EA",
	},
];

const TOKEN_COLOR: Record<string, string> = {
	USDT: "#26A17B",
	USDC: "#2775CA",
};

function NetworkIconCircle({ item }: { item: NetworkItem }) {
	const [failed, setFailed] = useState(false);
	const iconUrl = item.networkId
		? getNetworkIconUrl(item.networkId)
		: getTokenIconUrl(item.iconSymbol);

	if (iconUrl && !failed) {
		return (
			<Image
				source={{ uri: iconUrl }}
				style={styles.networkIcon}
				onError={() => setFailed(true)}
			/>
		);
	}

	return (
		<View
			style={[
				styles.networkIcon,
				{
					backgroundColor: item.color,
					justifyContent: "center",
					alignItems: "center",
				},
			]}
		>
			<Text variant="caption-medium" color="#FFFFFF" fontWeight="700">
				{item.iconSymbol.slice(0, 3)}
			</Text>
		</View>
	);
}

const NETWORK_MAP: Partial<Record<string, Network>> = {
	ethereum: Network.ETHEREUM,
	bsc: Network.BSC,
	solana: Network.SOLANA,
	polygon: Network.POLYGON,
	avalanche: Network.AVALANCHE,
	arbitrum: Network.ARBITRUM,
};

export default function SelectNetworkScreen() {
	const router = useRouter();
	const { colors } = useAppTheme();
	const { token = "USDT", mode = "receive" } = useLocalSearchParams<{
		token?: string;
		mode?: string;
	}>();

	const tokenColor = TOKEN_COLOR[token] ?? "#26A17B";

	const handleSelectNetwork = (item: NetworkItem) => {
		const network = NETWORK_MAP[item.id];
		router.replace({
			pathname: mode === "send" ? "/send" : "/receive",
			params: network ? { network } : {},
		});
	};

	return (
		<Box flex backgroundColor={colors.background}>
			<ScreenHeader title="Выбрать сеть" />

			{/* Token pill */}
			<Box px={20} pb={12}>
				<Box
					row
					alignItems="center"
					gap={8}
					backgroundColor={colors.grey_200}
					borderRadius={18}
					px={14}
					h={36}
					borderWidth={1}
					borderColor={colors.grey_300}
					style={styles.pillSelf}
				>
					<Box
						w={22}
						h={22}
						borderRadius={11}
						alignItems="center"
						justifyContent="center"
						backgroundColor={tokenColor}
					>
						<Text variant="label" color="#FFFFFF" fontWeight="700">
							{token === "USDT" ? "₮" : "$"}
						</Text>
					</Box>
					<Text variant="p4-semibold">{token}</Text>
					<Box w={1} h={16} backgroundColor={colors.grey_300} />
					<Text variant="caption" colorName="label">
						Выберите сеть для получения
					</Text>
				</Box>
			</Box>

			{/* Section label */}
			<Box px={20} pb={8}>
				<Text variant="label" colorName="label" uppercase>
					Доступные сети
				</Text>
			</Box>

			{/* Network list */}
			<FlatList
				data={STABLECOIN_NETWORKS}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<TouchableOpacity
						style={[styles.networkRow, { borderBottomColor: colors.grey_200 }]}
						onPress={() => handleSelectNetwork(item)}
						activeOpacity={0.7}
					>
						<NetworkIconCircle item={item} />

						<View style={styles.networkInfo}>
							<Text variant="p3-semibold">{item.name}</Text>
							<Text variant="p4" colorName="label">
								{item.standard}
							</Text>
						</View>

						{item.isPopular && (
							<View style={styles.popularBadge}>
								<Text variant="label" color="#4CAF50">
									Популярная
								</Text>
							</View>
						)}

						<Ionicons
							name="chevron-forward"
							size={18}
							color={colors.grey_300}
						/>
					</TouchableOpacity>
				)}
				showsVerticalScrollIndicator={false}
			/>
		</Box>
	);
}

const styles = StyleSheet.create({
	pillSelf: { alignSelf: "flex-start" },
	networkIcon: {
		width: 44,
		height: 44,
		borderRadius: 22,
	},
	networkRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 14,
		gap: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	networkInfo: { flex: 1, gap: 3 },
	popularBadge: {
		backgroundColor: "#1A2A10",
		borderRadius: 10,
		paddingHorizontal: 8,
		paddingVertical: 3,
	},
});
