import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Linking, TextInput, TouchableOpacity } from "react-native";

import { Box } from "@/components/ui/builders/Box";
import { Text } from "@/components/ui/builders/Text";
import { ScreenHeader } from "@/components/ui/layouts/ScreenHeader";
import { Button } from "@/components/ui/shared/Button";
import { NETWORKS } from "@/constants/networks";
import { getNFTCache, NETWORK_CFG } from "@/constants/nfts";
import { useWallet } from "@/providers/wallet-provider";
import { sendERC721 } from "@/services/nft-service";
import { useAppTheme } from "@/theme/theme";

function isValidEVMAddress(addr: string): boolean {
	return /^0x[0-9a-fA-F]{40}$/.test(addr.trim());
}

export default function SendNFTScreen() {
	const router = useRouter();
	const { colors, insets } = useAppTheme();
	const { id } = useLocalSearchParams<{ id: string }>();
	const { wallet } = useWallet();

	const [address, setAddress] = useState("");
	const [sending, setSending] = useState(false);

	const nft = getNFTCache().find((n) => n.id === id);

	// Find the sender address for the NFT's specific network
	const fromAccount = useMemo(() => {
		if (!nft?.networkId || !wallet) return null;
		return wallet.accounts.find((a) => a.network === nft.networkId) ?? null;
	}, [nft, wallet]);

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
	const networkInfo = nft.networkId ? NETWORKS[nft.networkId] : null;
	const isRealNFT =
		!!nft.networkId &&
		!!nft.tokenIdRaw &&
		!!nft.contractAddress &&
		!nft.contractAddress.includes("...");

	const feeLabel = networkInfo
		? `~ 0.0008 ${networkInfo.symbol}`
		: "~ 0.0008 ETH";

	const trimmedAddress = address.trim();
	const addressValid = isRealNFT
		? isValidEVMAddress(trimmedAddress)
		: trimmedAddress.length > 0;

	const handlePaste = async () => {
		const text = await Clipboard.getStringAsync();
		if (text) setAddress(text);
	};

	const handleSend = () => {
		if (!addressValid) {
			Alert.alert("Неверный адрес", "Введите корректный EVM адрес (0x...)");
			return;
		}

		Alert.alert(
			"Подтвердите отправку",
			`Отправить ${nft.name} на адрес\n${trimmedAddress}?`,
			[
				{ text: "Отмена", style: "cancel" },
				{ text: "Отправить", style: "destructive", onPress: executeSend },
			],
		);
	};

	const executeSend = async () => {
		if (!isRealNFT) {
			Alert.alert("Готово", "NFT отправлен (demo)");
			router.back();
			return;
		}

		if (!fromAccount) {
			Alert.alert("Ошибка", "Аккаунт для этой сети не найден");
			return;
		}

		setSending(true);
		try {
			const hash = await sendERC721(
				nft.networkId!,
				nft.contractAddress,
				nft.tokenIdRaw!,
				fromAccount.address,
				trimmedAddress,
			);

			const explorerUrl = networkInfo?.explorerUrl
				? `${networkInfo.explorerUrl}/tx/${hash}`
				: null;

			Alert.alert(
				"Транзакция отправлена",
				`Hash: ${hash.slice(0, 10)}...${hash.slice(-8)}`,
				[
					explorerUrl
						? {
								text: "Открыть в Explorer",
								onPress: () => Linking.openURL(explorerUrl),
							}
						: null,
					{ text: "OK", onPress: () => router.back() },
				].filter(Boolean) as any,
			);
		} catch (err: any) {
			const message: string =
				err?.shortMessage ?? err?.message ?? "Неизвестная ошибка";
			Alert.alert("Ошибка отправки", message);
		} finally {
			setSending(false);
		}
	};

	return (
		<Box flex backgroundColor={colors.background}>
			<ScreenHeader backLabel="Детали NFT" title="Отправить NFT" />

			{/* NFT Preview Card */}
			<Box
				row
				alignItems="center"
				gap={12}
				mx={20}
				mt={4}
				mb={24}
				p={12}
				borderRadius={16}
				backgroundColor="#111827"
				borderWidth={1}
				borderColor="#1F2937"
			>
				<Box
					w={52}
					h={52}
					borderRadius={12}
					alignItems="center"
					justifyContent="center"
					style={{ backgroundColor: nft.bgColor }}
				>
					<Text style={{ fontSize: 28 }}>{nft.emoji}</Text>
				</Box>

				<Box flex gap={4}>
					<Text variant="p3-semibold" color="#F9FAFB">
						{nft.name}
					</Text>
					<Text variant="caption" color="#6B7280">
						@ {nft.collection}
					</Text>
					{fromAccount && (
						<Text variant="caption" color="#4B5563" numberOfLines={1}>
							С: {fromAccount.address.slice(0, 8)}...
							{fromAccount.address.slice(-6)}
						</Text>
					)}
				</Box>

				<Box
					row
					alignItems="center"
					gap={4}
					px={10}
					py={5}
					borderRadius={10}
					backgroundColor={net.bg}
					borderWidth={1}
					borderColor={net.border}
				>
					<Text fontSize={13} color={net.text}>
						{net.symbol}
					</Text>
					<Text variant="caption-medium" color="#fff">
						{net.name.split(" ")[0]}
					</Text>
				</Box>
			</Box>

			{/* Address input */}
			<Text variant="caption-medium" color="#6B7280" mx={20} mb={10}>
				Адрес получателя
			</Text>

			<Box
				mx={20}
				borderRadius={16}
				backgroundColor="#111827"
				borderWidth={1}
				borderColor={
					trimmedAddress.length > 0 && !addressValid ? "#EF444450" : "#1F2937"
				}
				overflow="hidden"
			>
				<Box row alignItems="center" gap={8} px={14} h={52}>
					<TextInput
						value={address}
						onChangeText={setAddress}
						placeholder="0x..."
						placeholderTextColor="#374151"
						autoCapitalize="none"
						autoCorrect={false}
						style={{
							flex: 1,
							color: "#F9FAFB",
							fontSize: 15,
							fontFamily: "monospace",
						}}
					/>

					<TouchableOpacity onPress={handlePaste} activeOpacity={0.8}>
						<Box
							px={12}
							py={6}
							borderRadius={8}
							backgroundColor="#0D2E1F"
							borderWidth={1}
							borderColor="#1A4030"
						>
							<Text variant="p4-semibold" color="#10B981">
								Вставить
							</Text>
						</Box>
					</TouchableOpacity>
				</Box>

				{trimmedAddress.length > 0 && !addressValid && (
					<Box px={14} pb={10}>
						<Text variant="caption" color="#EF4444">
							Неверный формат адреса
						</Text>
					</Box>
				)}

				<Box h={1} backgroundColor="#1F2937" />

				<Box
					row
					justifyContent="space-between"
					alignItems="center"
					px={14}
					h={44}
				>
					<Text variant="caption" color="#6B7280">
						Комиссия сети:
					</Text>
					<Text variant="caption-medium" color="#9CA3AF">
						{feeLabel}
					</Text>
				</Box>
			</Box>

			{/* Warning */}
			<Box
				row
				gap={10}
				mx={20}
				mt={16}
				p={14}
				borderRadius={14}
				backgroundColor="#1C1200"
				borderWidth={1}
				borderColor="#F59E0B40"
			>
				<Ionicons
					name="warning-outline"
					size={18}
					color="#F59E0B"
					style={{ marginTop: 1 }}
				/>
				<Box flex gap={4}>
					<Text variant="caption-medium" color="#F59E0B">
						NFT будет отправлен безвозвратно.
					</Text>
					<Text variant="caption" color="#D97706">
						Внимательно проверьте адрес получателя.
					</Text>
				</Box>
			</Box>

			<Box
				px={20}
				pb={insets.bottom + 16}
				pt={16}
				style={{ marginTop: "auto" }}
			>
				<Button
					onPress={handleSend}
					disabled={!addressValid || sending}
					icon={<Ionicons name="paper-plane-outline" size={18} color="#fff" />}
					buttonStyle={{ height: 56, borderRadius: 16 }}
				>
					{sending ? "Отправка..." : "Отправить"}
				</Button>
			</Box>
		</Box>
	);
}
