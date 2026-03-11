import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import type React from "react";
import {
	Alert,
	ScrollView,
	Share,
	StyleSheet,
	TouchableOpacity,
} from "react-native";

import { Box } from "@/components/ui/builders/Box";
import { Text } from "@/components/ui/builders/Text";
import { ScreenHeader } from "@/components/ui/layouts/ScreenHeader";
import { Button } from "@/components/ui/shared/Button";
import { TokenIcon } from "@/components/wallet/token-icon";
import { getNFTCache, NETWORK_CFG } from "@/constants/nfts";
import { useAppTheme } from "@/theme/theme";

// ─── Detail Row ───────────────────────────────────────────────────────────────

function DetailRow({
	label,
	children,
	last = false,
}: {
	label: string;
	children: React.ReactNode;
	last?: boolean;
}) {
	return (
		<>
			<Box
				row
				justifyContent="space-between"
				alignItems="center"
				px={20}
				h={52}
			>
				<Text variant="p4" color="#6B7280">
					{label}
				</Text>
				{children}
			</Box>
			{!last && <Box h={1} backgroundColor="#1F2937" />}
		</>
	);
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NFTDetailScreen() {
	const { colors, insets } = useAppTheme();
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();

	const nft = getNFTCache().find((n) => n.id === id);

	if (!nft) {
		return (
			<Box
				flex
				alignItems="center"
				justifyContent="center"
				backgroundColor={colors.background}
			>
				<Text variant="p2" colorName="label">
					NFT не найден
				</Text>
			</Box>
		);
	}

	const net = NETWORK_CFG[nft.network];

	const copyContract = async () => {
		await Clipboard.setStringAsync(nft.contractAddress);
		Alert.alert("Скопировано", "Адрес контракта скопирован");
	};

	const shareNFT = async () => {
		try {
			await Share.share({
				message: `NFT ${nft.name} из коллекции ${nft.collection}`,
			});
		} catch {}
	};

	const handleSend = () => {
		router.push({ pathname: "/send-nft", params: { id: nft.id } });
	};

	const handleOpenSea = () => {
		Alert.alert("OpenSea", "Открытие в браузере в разработке");
	};

	return (
		<Box flex backgroundColor={colors.background}>
			<ScreenHeader
				backLabel="NFT"
				right={
					<TouchableOpacity onPress={shareNFT} activeOpacity={0.7}>
						<Box
							w={40}
							h={40}
							borderRadius={20}
							alignItems="center"
							justifyContent="center"
							backgroundColor="#1F2937"
						>
							<Ionicons name="share-outline" size={18} color="#9CA3AF" />
						</Box>
					</TouchableOpacity>
				}
			/>

			{/* Scrollable content */}
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
			>
				{/* NFT Image */}
				<Box mx={20} mb={16} style={{ position: "relative" }}>
					<Box
						h={280}
						borderRadius={20}
						overflow="hidden"
						alignItems="center"
						justifyContent="center"
						style={{ backgroundColor: nft.bgColor }}
					>
						<Text style={styles.emoji}>{nft.emoji}</Text>
					</Box>

					{/* Network badge overlay */}
					<Box
						row
						alignItems="center"
						gap={5}
						px={10}
						py={5}
						borderRadius={10}
						backgroundColor="#0A0F1ECC"
						style={{ position: "absolute", top: 12, right: 12 }}
					>
						<Text variant="p4" color={net.text}>
							{net.symbol}
						</Text>
						<Text variant="p4-semibold" color="#fff">
							{net.name.split(" ")[0]}
						</Text>
					</Box>
				</Box>

				{/* Name + Collection */}
				<Box px={20} mb={16} gap={8}>
					<Text variant="h3" color="#fff">
						{nft.name}
					</Text>
					<Box row alignItems="center" gap={6}>
						<Ionicons name="layers-outline" size={14} color="#6B7280" />
						<Text variant="p4" color="#9CA3AF">
							{nft.collection}
						</Text>
						<Ionicons
							name="checkmark-circle"
							size={14}
							color={colors.primary}
						/>
					</Box>
				</Box>

				{/* Detail Card */}
				<Box
					mx={20}
					mb={16}
					backgroundColor="#111827"
					borderRadius={20}
					borderWidth={1}
					borderColor="#1F2937"
					overflow="hidden"
				>
					{/* Contract */}
					<DetailRow label="Контракт">
						<Box row alignItems="center" gap={6} onPress={copyContract}>
							<Text variant="caption" color="#9CA3AF">
								{nft.contractAddress}
							</Text>
							<Ionicons name="copy-outline" size={14} color="#6B7280" />
						</Box>
					</DetailRow>

					{/* Token ID */}
					<DetailRow label="Token ID">
						<Text variant="p4" fontWeight="500" color="#fff">
							{nft.tokenId}
						</Text>
					</DetailRow>

					{/* Standard */}
					<DetailRow label="Стандарт">
						<Box px={8} py={3} borderRadius={6} backgroundColor="#1F2937">
							<Text variant="p4-semibold" color="#9CA3AF">
								{nft.standard}
							</Text>
						</Box>
					</DetailRow>

					{/* Network */}
					<DetailRow label="Сеть" last>
						<Box row alignItems="center" gap={6}>
							<TokenIcon symbol={net.symbol} size={18} />
							<Text variant="p4" fontWeight="500" color="#fff">
								{net.name}
							</Text>
						</Box>
					</DetailRow>
				</Box>

				{/* Buttons */}
				<Box px={20} gap={12}>
					<Button
						onPress={handleSend}
						icon={
							<Ionicons name="paper-plane-outline" size={18} color="#fff" />
						}
						buttonStyle={{ height: 52, borderRadius: 16 }}
					>
						Отправить NFT
					</Button>

					<Button
						type="outline"
						onPress={handleOpenSea}
						icon={
							<Ionicons name="open-outline" size={18} color={colors.primary} />
						}
						textColor="primary"
						buttonStyle={{
							height: 52,
							borderRadius: 16,
							backgroundColor: "#0D1829",
							borderColor: "#1E3A5F",
						}}
					>
						Открыть на OpenSea
					</Button>
				</Box>
			</ScrollView>
		</Box>
	);
}

const styles = StyleSheet.create({
	emoji: { fontSize: 96, lineHeight: 120, textAlign: "center" },
});
